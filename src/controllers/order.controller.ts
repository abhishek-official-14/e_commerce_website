import crypto from 'crypto';
import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Cart } from '../models/cart.model';
import { Order, IOrderStatus } from '../models/order.model';
import { PaymentWebhookEvent } from '../models/paymentWebhookEvent.model';
import { Product } from '../models/product.model';
import { env } from '../config/env';
import { ApiError } from '../utils/ApiError';
import { catchAsync } from '../utils/catchAsync';
import { createRazorpayOrder, verifyRazorpayPaymentSignature, verifyRazorpayWebhookSignature } from '../utils/razorpay';

const markOrderPaidAndReduceStock = async ({
  orderId,
  razorpayPaymentId,
  razorpaySignature
}: {
  orderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const order = await Order.findById(orderId).session(session);
    if (!order) {
      throw new ApiError(404, 'Order not found');
    }

    if (order.status === 'paid') {
      await session.commitTransaction();
      return order;
    }

    if (order.status === 'failed') {
      throw new ApiError(400, 'Order is already marked as failed');
    }

    for (const item of order.items) {
      const stockUpdate = await Product.updateOne(
        { _id: item.productId, stock: { $gte: item.quantity }, isActive: true },
        { $inc: { stock: -item.quantity } },
        { session }
      );

      if (stockUpdate.modifiedCount === 0) {
        throw new ApiError(409, `${item.name} is out of stock while confirming payment`);
      }
    }

    order.status = 'paid';
    order.razorpayPaymentId = razorpayPaymentId;
    order.razorpaySignature = razorpaySignature;
    order.paymentVerifiedAt = new Date();
    order.stockReduced = true;
    order.paymentFailureReason = undefined;

    await order.save({ session });

    const cart = await Cart.findOne({ user: order.user }).session(session);
    if (cart) {
      cart.items = [];
      await cart.save({ session });
    }

    await session.commitTransaction();
    return order;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

export const createOrder = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    throw new ApiError(401, 'Unauthorized');
  }

  const { address, currency = 'INR' } = req.body as { address: string; currency?: string };

  const cart = await Cart.findOne({ user: userId });
  if (!cart || cart.items.length === 0) {
    throw new ApiError(400, 'Cart is empty');
  }

  const productIds = cart.items.map((item) => item.product);
  const products = await Product.find({ _id: { $in: productIds }, isActive: true });
  const productMap = new Map(products.map((product) => [product._id.toString(), product]));

  const orderItems = cart.items.map((item) => {
    const product = productMap.get(item.product.toString());

    if (!product) {
      throw new ApiError(400, 'One or more cart items are invalid or inactive');
    }

    if (product.stock < item.quantity) {
      throw new ApiError(400, `${product.name} is out of stock for requested quantity`);
    }

    return {
      productId: product._id,
      name: product.name,
      price: product.price,
      quantity: item.quantity
    };
  });

  const totalAmount = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const paymentAmountInSubunits = Math.round(totalAmount * 100);

  if (paymentAmountInSubunits < 100) {
    throw new ApiError(400, 'Order total must be at least 1 unit of currency');
  }

  const order = await Order.create({
    user: userId,
    items: orderItems,
    totalAmount,
    address,
    status: 'pending',
    paymentCurrency: currency,
    paymentAmountInSubunits,
    stockReduced: false
  });

  const razorpayOrder = await createRazorpayOrder({
    amount: paymentAmountInSubunits,
    currency,
    receipt: order._id.toString()
  });

  order.razorpayOrderId = razorpayOrder.id;
  await order.save();

  res.status(201).json({
    success: true,
    message: 'Order created. Complete payment on Razorpay checkout.',
    data: {
      orderId: order._id,
      razorpay: {
        key: env.RAZORPAY_KEY_ID,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        orderId: razorpayOrder.id
      }
    }
  });
});

export const verifyOrderPayment = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    throw new ApiError(401, 'Unauthorized');
  }

  const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body as {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  };

  const order = await Order.findOne({ user: userId, razorpayOrderId: razorpay_order_id });
  if (!order) {
    throw new ApiError(404, 'Order not found for provided Razorpay order id');
  }

  const isValidSignature = verifyRazorpayPaymentSignature({
    razorpayOrderId: razorpay_order_id,
    razorpayPaymentId: razorpay_payment_id,
    razorpaySignature: razorpay_signature
  });

  if (!isValidSignature) {
    order.status = 'failed';
    order.paymentFailureReason = 'Invalid Razorpay signature from frontend verification';
    await order.save();

    throw new ApiError(400, 'Invalid payment signature');
  }

  const paidOrder = await markOrderPaidAndReduceStock({
    orderId: order._id.toString(),
    razorpayPaymentId: razorpay_payment_id,
    razorpaySignature: razorpay_signature
  });

  res.status(200).json({
    success: true,
    message: 'Payment verified and order marked as paid',
    data: paidOrder
  });
});

export const razorpayWebhook = catchAsync(async (req: Request, res: Response) => {
  const signature = req.header('x-razorpay-signature');

  if (!signature) {
    throw new ApiError(400, 'Missing Razorpay webhook signature');
  }

  const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body), 'utf-8');

  const isValidWebhook = verifyRazorpayWebhookSignature(rawBody, signature);
  if (!isValidWebhook) {
    throw new ApiError(400, 'Invalid webhook signature');
  }

  const eventId = req.header('x-razorpay-event-id') ?? crypto.createHash('sha256').update(rawBody).digest('hex');

  try {
    await PaymentWebhookEvent.create({
      eventId,
      eventType: 'received'
    });
  } catch (error) {
    if (error instanceof mongoose.Error && 'code' in error && (error as { code?: number }).code === 11000) {
      res.status(200).json({ success: true, message: 'Duplicate webhook event ignored' });
      return;
    }
    throw error;
  }

  const payload = JSON.parse(rawBody.toString('utf-8')) as {
    event: string;
    payload?: {
      payment?: { entity?: { id?: string; order_id?: string } };
      order?: { entity?: { id?: string } };
    };
  };

  const eventType = payload.event;
  const paymentEntity = payload.payload?.payment?.entity;
  const orderEntity = payload.payload?.order?.entity;

  if (eventType === 'payment.captured' || eventType === 'order.paid') {
    const razorpayOrderId = paymentEntity?.order_id ?? orderEntity?.id;
    const razorpayPaymentId = paymentEntity?.id;

    if (razorpayOrderId && razorpayPaymentId) {
      const order = await Order.findOne({ razorpayOrderId });

      if (order) {
        await markOrderPaidAndReduceStock({
          orderId: order._id.toString(),
          razorpayPaymentId,
          razorpaySignature: signature
        });
      }
    }
  }

  if (eventType === 'payment.failed') {
    const razorpayOrderId = paymentEntity?.order_id;

    if (razorpayOrderId) {
      await Order.findOneAndUpdate(
        { razorpayOrderId, status: { $ne: 'paid' } },
        {
          status: 'failed',
          paymentFailureReason: 'Razorpay reported payment.failed event'
        }
      );
    }
  }

  await PaymentWebhookEvent.updateOne({ eventId }, { eventType, processedAt: new Date() });

  res.status(200).json({ success: true, message: 'Webhook processed' });
});

export const getMyOrders = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    throw new ApiError(401, 'Unauthorized');
  }

  const orders = await Order.find({ user: userId }).sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data: orders
  });
});

export const getAllOrders = catchAsync(async (_req: Request, res: Response) => {
  const orders = await Order.find().sort({ createdAt: -1 }).populate('user', 'name email role');

  res.status(200).json({
    success: true,
    data: orders
  });
});

export const updateOrderStatus = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body as { status: IOrderStatus };

  const order = await Order.findByIdAndUpdate(id, { status }, { new: true, runValidators: true });

  if (!order) {
    throw new ApiError(404, 'Order not found');
  }

  res.status(200).json({
    success: true,
    message: 'Order status updated successfully',
    data: order
  });
});
