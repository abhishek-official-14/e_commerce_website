import crypto from 'crypto';
import https from 'https';
import { env } from '../config/env';
import { ApiError } from './ApiError';

interface RazorpayOrderResponse {
  id: string;
  entity: 'order';
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt?: string;
  status: 'created' | 'attempted' | 'paid';
}

interface CreateRazorpayOrderInput {
  amount: number;
  currency: string;
  receipt: string;
}

export const createRazorpayOrder = async ({ amount, currency, receipt }: CreateRazorpayOrderInput): Promise<RazorpayOrderResponse> => {
  const payload = JSON.stringify({
    amount,
    currency,
    receipt
  });

  const auth = Buffer.from(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_SECRET_KEY}`).toString('base64');

  const response = await new Promise<{ statusCode: number; body: string }>((resolve, reject) => {
    const request = https.request(
      {
        hostname: 'api.razorpay.com',
        path: '/v1/orders',
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload)
        }
      },
      (res) => {
        const chunks: Buffer[] = [];

        res.on('data', (chunk: Buffer) => {
          chunks.push(chunk);
        });

        res.on('end', () => {
          resolve({
            statusCode: res.statusCode ?? 500,
            body: Buffer.concat(chunks).toString('utf-8')
          });
        });
      }
    );

    request.on('error', reject);
    request.write(payload);
    request.end();
  });

  if (response.statusCode < 200 || response.statusCode >= 300) {
    throw new ApiError(502, 'Failed to create Razorpay order');
  }

  return JSON.parse(response.body) as RazorpayOrderResponse;
};

export const verifyRazorpayPaymentSignature = ({
  razorpayOrderId,
  razorpayPaymentId,
  razorpaySignature
}: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}): boolean => {
  const payload = `${razorpayOrderId}|${razorpayPaymentId}`;
  const generatedSignature = crypto.createHmac('sha256', env.RAZORPAY_SECRET_KEY).update(payload).digest('hex');

  const expected = Buffer.from(generatedSignature, 'utf-8');
  const received = Buffer.from(razorpaySignature, 'utf-8');

  return expected.length === received.length && crypto.timingSafeEqual(expected, received);
};

export const verifyRazorpayWebhookSignature = (body: Buffer, signature: string): boolean => {
  const generatedSignature = crypto.createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET).update(body).digest('hex');

  const expected = Buffer.from(generatedSignature, 'utf-8');
  const received = Buffer.from(signature, 'utf-8');

  return expected.length === received.length && crypto.timingSafeEqual(expected, received);
};
