import { Document, Schema, model } from 'mongoose';

export interface ICoupon extends Document {
  code: string;
  description?: string;
  type: 'percentage' | 'flat';
  value: number;
  minOrderAmount: number;
  maxDiscountAmount?: number;
  startsAt?: Date;
  expiresAt?: Date;
  active: boolean;
  usageLimit?: number;
  usedCount: number;
}

const couponSchema = new Schema<ICoupon>(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    description: { type: String, trim: true },
    type: { type: String, enum: ['percentage', 'flat'], required: true },
    value: { type: Number, required: true, min: 0 },
    minOrderAmount: { type: Number, min: 0, default: 0 },
    maxDiscountAmount: { type: Number, min: 0 },
    startsAt: { type: Date },
    expiresAt: { type: Date },
    active: { type: Boolean, default: true },
    usageLimit: { type: Number, min: 1 },
    usedCount: { type: Number, min: 0, default: 0 }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

export const Coupon = model<ICoupon>('Coupon', couponSchema);
