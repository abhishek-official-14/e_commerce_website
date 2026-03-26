import { Router } from 'express';
import {
  createOrder,
  getAllOrders,
  getMyOrders,
  razorpayWebhook,
  updateOrderStatus,
  verifyOrderPayment
} from '../controllers/order.controller';
import { auth } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validateRequest';
import { createOrderSchema, updateOrderStatusSchema, verifyPaymentSchema } from '../validators/order.validator';

const router = Router();

router.post('/razorpay/webhook', razorpayWebhook);
router.post('/', auth('user', 'admin'), validateRequest(createOrderSchema), createOrder);
router.post('/verify-payment', auth('user', 'admin'), validateRequest(verifyPaymentSchema), verifyOrderPayment);
router.get('/my-orders', auth('user', 'admin'), getMyOrders);
router.get('/', auth('admin'), getAllOrders);
router.patch('/:id/status', auth('admin'), validateRequest(updateOrderStatusSchema), updateOrderStatus);

export default router;
