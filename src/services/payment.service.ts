import mongoose from 'mongoose';
import { Cart } from '../models/cart.model';
import { Coupon } from '../models/coupon.model';
import { Order } from '../models/order.model';
import { Product } from '../models/product.model';
import { User } from '../models/user.model';
import { env } from '../config/env';
import { ApiError } from '../utils/ApiError';
import { sendOrderNotificationEmail } from '../utils/notifications';
import { createRazorpayOrder } from '../utils/razorpay';

export const markOrderPaidAndReduceStock = async ({ orderId, razorpayPaymentId, razorpaySignature }: { orderId: string; razorpayPaymentId: string; razorpaySignature: string }) => {
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

    if (order.couponCode) {
      await Coupon.updateOne({ code: order.couponCode }, { $inc: { usedCount: 1 } }, { session });
    }

    const cart = await Cart.findOne({ user: order.user }).session(session);
    if (cart) {
      cart.items = [];
      await cart.save({ session });
    }

    await session.commitTransaction();

    const orderUser = await User.findById(order.user);
    if (orderUser) {
      await sendOrderNotificationEmail({
        to: orderUser.email,
        subject: `Payment successful for order ${order._id.toString()}`,
        html: `<h2>Payment Successful</h2><p>Your payment has been confirmed.</p><p>Total Paid: ₹${order.totalAmount.toFixed(2)}</p>`
      });
    }

    return order;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

export const createOrReuseRazorpayOrderForOrder = async (orderId: string) => {
  const order = await Order.findById(orderId);
  if (!order) {
    throw new ApiError(404, 'Order not found');
  }

  if (order.status !== 'pending') {
    throw new ApiError(400, 'Razorpay order can be created only for pending orders');
  }

  if (order.razorpayOrderId) {
    return {
      order,
      razorpay: {
        key: env.RAZORPAY_KEY_ID,
        amount: order.paymentAmountInSubunits,
        currency: order.paymentCurrency,
        orderId: order.razorpayOrderId
      }
    };
  }

  const razorpayOrder = await createRazorpayOrder({
    amount: order.paymentAmountInSubunits,
    currency: order.paymentCurrency,
    receipt: order._id.toString()
  });

  order.razorpayOrderId = razorpayOrder.id;
  await order.save();

  return {
    order,
    razorpay: {
      key: env.RAZORPAY_KEY_ID,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      orderId: razorpayOrder.id
    }
  };
};
