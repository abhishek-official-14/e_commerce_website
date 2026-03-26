import { Document, Schema, model, Types } from 'mongoose';

export type IOrderStatus = 'pending' | 'paid' | 'shipped' | 'delivered' | 'failed';

export interface IOrderItemSnapshot {
  productId: Types.ObjectId;
  name: string;
  price: number;
  quantity: number;
}

export interface IOrder extends Document {
  user: Types.ObjectId;
  items: IOrderItemSnapshot[];
  totalAmount: number;
  address: string;
  status: IOrderStatus;
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
    totalAmount: { type: Number, required: true, min: 0 },
    address: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ['pending', 'paid', 'shipped', 'delivered', 'failed'],
      default: 'pending',
      index: true
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

export const Order = model<IOrder>('Order', orderSchema);
