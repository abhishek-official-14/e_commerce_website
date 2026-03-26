import { Document, Schema, model } from 'mongoose';

export interface IPaymentWebhookEvent extends Document {
  eventId: string;
  eventType: string;
  processedAt?: Date;
}

const paymentWebhookEventSchema = new Schema<IPaymentWebhookEvent>(
  {
    eventId: { type: String, required: true, unique: true, index: true },
    eventType: { type: String, required: true, trim: true, index: true },
    processedAt: { type: Date }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

export const PaymentWebhookEvent = model<IPaymentWebhookEvent>('PaymentWebhookEvent', paymentWebhookEventSchema);
