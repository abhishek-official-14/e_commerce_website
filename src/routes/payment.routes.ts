import { Router } from 'express';
import { createPaymentOrder, paymentWebhook, verifyPayment } from '../controllers/payment.controller';
import { auth } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validateRequest';
import { createPaymentOrderSchema, verifyPaymentSchema } from '../validators/payment.validator';

const router = Router();

router.post('/create-order', auth('user', 'admin'), validateRequest(createPaymentOrderSchema), createPaymentOrder);
router.post('/verify', auth('user', 'admin'), validateRequest(verifyPaymentSchema), verifyPayment);
router.post('/webhook', paymentWebhook);

export default router;
