import crypto from 'crypto';
import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Cart } from '../models/cart.model';
import { Coupon } from '../models/coupon.model';
import { IOrderAddressSnapshot, IOrderStatus, Order } from '../models/order.model';
import { PaymentWebhookEvent } from '../models/paymentWebhookEvent.model';
import { Product } from '../models/product.model';
import { User } from '../models/user.model';
import { ApiError } from '../utils/ApiError';
import { catchAsync } from '../utils/catchAsync';
import { sendOrderNotificationEmail } from '../utils/notifications';
import { verifyRazorpayPaymentSignature, verifyRazorpayWebhookSignature } from '../utils/razorpay';
import { createOrReuseRazorpayOrderForOrder, markOrderPaidAndReduceStock } from '../services/payment.service';

const calculateShippingCharges = ({ subtotal }: { subtotal: number }) => {
  if (subtotal >= 1000) return 0;
  if (subtotal >= 500) return 40;
  return 80;
};

const computeDiscount = ({ subtotal, coupon }: { subtotal: number; coupon: Awaited<ReturnType<typeof Coupon.findOne>> }) => {
  if (!coupon) {
    return 0;
  }

  if (!coupon.active) {
    throw new ApiError(400, 'Coupon is inactive');
  }

  const now = new Date();
  if (coupon.startsAt && coupon.startsAt > now) {
    throw new ApiError(400, 'Coupon is not active yet');
  }

  if (coupon.expiresAt && coupon.expiresAt < now) {
    throw new ApiError(400, 'Coupon has expired');
  }

  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
    throw new ApiError(400, 'Coupon usage limit reached');
  }

  if (subtotal < coupon.minOrderAmount) {
    throw new ApiError(400, `Minimum order amount for this coupon is ${coupon.minOrderAmount}`);
  }

  const rawDiscount = coupon.type === 'percentage' ? (subtotal * coupon.value) / 100 : coupon.value;
  const capped = coupon.maxDiscountAmount ? Math.min(rawDiscount, coupon.maxDiscountAmount) : rawDiscount;
  return Number(Math.max(0, capped).toFixed(2));
};

const resolveShippingAddress = async ({
  userId,
  address,
  addressId,
  shippingAddress
}: {
  userId: string;
  address?: string;
  addressId?: string;
  shippingAddress?: IOrderAddressSnapshot;
}): Promise<IOrderAddressSnapshot> => {
  if (shippingAddress) {
    return shippingAddress;
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  if (addressId) {
    const selectedAddress = user.addresses.id(addressId);
    if (!selectedAddress) {
      throw new ApiError(404, 'Selected address not found');
    }

    return {
      fullName: user.name,
      line1: selectedAddress.line1,
      line2: selectedAddress.line2,
      city: selectedAddress.city,
      state: selectedAddress.state,
      postalCode: selectedAddress.postalCode,
      country: selectedAddress.country
    };
  }

  if (address) {
    return {
      fullName: user.name,
      line1: address,
      city: 'N/A',
      state: 'N/A',
      postalCode: 'N/A',
      country: 'India'
    };
  }

  const defaultAddress = user.addresses.find((entry) => entry.isDefault) ?? user.addresses[0];
  if (!defaultAddress) {
    throw new ApiError(400, 'No shipping address found. Please add an address first.');
  }

  return {
    fullName: user.name,
    line1: defaultAddress.line1,
    line2: defaultAddress.line2,
    city: defaultAddress.city,
    state: defaultAddress.state,
    postalCode: defaultAddress.postalCode,
    country: defaultAddress.country
  };
};

export const createOrder = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    throw new ApiError(401, 'Unauthorized');
  }

  const { address, addressId, shippingAddress, couponCode, currency = 'INR' } = req.body as {
    address?: string;
    addressId?: string;
    shippingAddress?: IOrderAddressSnapshot;
    couponCode?: string;
    currency?: string;
  };

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

  const subtotalAmount = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const normalizedCouponCode = couponCode?.trim().toUpperCase();
  const coupon = normalizedCouponCode ? await Coupon.findOne({ code: normalizedCouponCode }) : null;
  const discountAmount = computeDiscount({ subtotal: subtotalAmount, coupon });
  const shippingCharges = calculateShippingCharges({ subtotal: subtotalAmount - discountAmount });
  const totalAmount = Number((subtotalAmount - discountAmount + shippingCharges).toFixed(2));

  const paymentAmountInSubunits = Math.round(totalAmount * 100);
  if (paymentAmountInSubunits < 100) {
    throw new ApiError(400, 'Order total must be at least 1 unit of currency');
  }

  const resolvedShippingAddress = await resolveShippingAddress({ userId, address, addressId, shippingAddress });

  const order = await Order.create({
    user: userId,
    items: orderItems,
    subtotalAmount,
    discountAmount,
    shippingCharges,
    totalAmount,
    couponCode: normalizedCouponCode,
    address: [
      resolvedShippingAddress.line1,
      resolvedShippingAddress.line2,
      resolvedShippingAddress.city,
      resolvedShippingAddress.state,
      resolvedShippingAddress.postalCode,
      resolvedShippingAddress.country
    ]
      .filter(Boolean)
      .join(', '),
    shippingAddress: resolvedShippingAddress,
    status: 'pending',
    paymentCurrency: currency,
    paymentAmountInSubunits,
    stockReduced: false
  });

  const user = await User.findById(userId);
  if (user) {
    await sendOrderNotificationEmail({
      to: user.email,
      subject: `Order placed: ${order._id.toString()}`,
      html: `<h2>Order Placed</h2><p>Your order has been placed and is awaiting payment confirmation.</p><p>Amount: ₹${totalAmount.toFixed(2)}</p>`
    });
  }

  const paymentSession = await createOrReuseRazorpayOrderForOrder(order._id.toString());

  res.status(201).json({
    success: true,
    message: 'Order created with pending payment state.',
    data: {
      orderId: order._id,
      pricing: {
        subtotalAmount,
        discountAmount,
        shippingCharges,
        totalAmount,
        couponCode: normalizedCouponCode
      },
      razorpay: paymentSession.razorpay
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

  res.status(200).json({ success: true, message: 'Payment verified and order marked as paid', data: paidOrder });
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
    await PaymentWebhookEvent.create({ eventId, eventType: 'received' });
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

  res.status(200).json({ success: true, data: orders });
});

export const getAllOrders = catchAsync(async (_req: Request, res: Response) => {
  const orders = await Order.find().sort({ createdAt: -1 }).populate('user', 'name email role');

  res.status(200).json({ success: true, data: orders });
});

export const updateOrderStatus = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body as { status: IOrderStatus };

  const order = await Order.findByIdAndUpdate(id, { status }, { new: true, runValidators: true });

  if (!order) {
    throw new ApiError(404, 'Order not found');
  }

  res.status(200).json({ success: true, message: 'Order status updated successfully', data: order });
});
