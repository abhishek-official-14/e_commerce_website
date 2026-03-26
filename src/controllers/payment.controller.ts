import { Request, Response } from 'express';
import { Order } from '../models/order.model';
import { ApiError } from '../utils/ApiError';
import { catchAsync } from '../utils/catchAsync';
import { verifyRazorpayPaymentSignature } from '../utils/razorpay';
import { createOrReuseRazorpayOrderForOrder, markOrderPaidAndReduceStock } from '../services/payment.service';
import { razorpayWebhook as processRazorpayWebhook } from './order.controller';

export const createPaymentOrder = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    throw new ApiError(401, 'Unauthorized');
  }

  const { orderId } = req.body as { orderId: string };

  const order = await Order.findOne({ _id: orderId, user: userId });
  if (!order) {
    throw new ApiError(404, 'Order not found');
  }

  const paymentSession = await createOrReuseRazorpayOrderForOrder(order._id.toString());

  res.status(200).json({
    success: true,
    message: 'Payment order created successfully',
    data: {
      orderId: order._id,
      razorpay: paymentSession.razorpay
    }
  });
});

export const verifyPayment = catchAsync(async (req: Request, res: Response) => {
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

export const paymentWebhook = processRazorpayWebhook;
