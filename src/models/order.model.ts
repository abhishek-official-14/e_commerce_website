import { Document, Schema, model, Types } from 'mongoose';

export type IOrderStatus = 'pending' | 'paid' | 'shipped' | 'delivered' | 'failed';

export interface IOrderItemSnapshot {
  productId: Types.ObjectId;
  name: string;
  price: number;
  quantity: number;
}

export interface IOrderAddressSnapshot {
  fullName: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone?: string;
}

export interface IOrder extends Document {
  user: Types.ObjectId;
  items: IOrderItemSnapshot[];
  subtotalAmount: number;
  discountAmount: number;
  shippingCharges: number;
  totalAmount: number;
  couponCode?: string;
  address: string;
  shippingAddress: IOrderAddressSnapshot;
  status: IOrderStatus;
  paymentCurrency: string;
  paymentAmountInSubunits: number;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  paymentVerifiedAt?: Date;
  stockReduced: boolean;
  paymentFailureReason?: string;
}

const orderItemSnapshotSchema = new Schema<IOrderItemSnapshot>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 }
  },
  { _id: false }
);

const orderAddressSnapshotSchema = new Schema<IOrderAddressSnapshot>(
  {
    fullName: { type: String, required: true, trim: true },
    line1: { type: String, required: true, trim: true },
    line2: { type: String, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    postalCode: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true },
    phone: { type: String, trim: true }
  },
  { _id: false }
);

const orderSchema = new Schema<IOrder>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    items: {
      type: [orderItemSnapshotSchema],
      required: true,
      validate: {
        validator: (value: IOrderItemSnapshot[]) => value.length > 0,
        message: 'Order must contain at least one item'
      }
    },
    subtotalAmount: { type: Number, required: true, min: 0, default: 0 },
    discountAmount: { type: Number, required: true, min: 0, default: 0 },
    shippingCharges: { type: Number, required: true, min: 0, default: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    couponCode: { type: String, trim: true, uppercase: true },
    address: { type: String, required: true, trim: true },
    shippingAddress: { type: orderAddressSnapshotSchema, required: true },
    status: {
      type: String,
      enum: ['pending', 'paid', 'shipped', 'delivered', 'failed'],
      default: 'pending',
      index: true
    },
    paymentCurrency: { type: String, required: true, trim: true, uppercase: true, default: 'INR' },
    paymentAmountInSubunits: { type: Number, required: true, min: 1 },
    razorpayOrderId: { type: String, trim: true, unique: true, sparse: true, index: true },
    razorpayPaymentId: { type: String, trim: true },
    razorpaySignature: { type: String, trim: true },
    paymentVerifiedAt: { type: Date },
    stockReduced: { type: Boolean, default: false },
    paymentFailureReason: { type: String, trim: true }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

export const Order = model<IOrder>('Order', orderSchema);
