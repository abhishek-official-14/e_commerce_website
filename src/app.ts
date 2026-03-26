import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import routes from './routes';
import { globalErrorHandler } from './middleware/error.middleware';
import { ApiError } from './utils/ApiError';

const app = express();

app.use(helmet());
app.use(cors());
app.use('/api/v1/orders/razorpay/webhook', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '10kb' }));

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message: 'Too many requests. Please try again later.'
    }
  })
);

app.get('/health', (_req, res) => {
  res.status(200).json({ success: true, message: 'Server is running' });
});

app.use('/api/v1', routes);

app.use((_req, _res, next) => {
  next(new ApiError(404, 'Route not found'));
});

app.use(globalErrorHandler);

export default app;
