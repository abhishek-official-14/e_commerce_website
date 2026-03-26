import { Document, Schema, model, Types } from 'mongoose';

export interface IProductReview {
  user: Types.ObjectId;
  rating: number;
  comment: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IProduct extends Document {
  name: string;
  price: number;
  description: string;
  category: string;
  stock: number;
  images: string[];
  isActive: boolean;
  reviews: IProductReview[];
  averageRating: number;
  totalReviews: number;
}

const productReviewSchema = new Schema<IProductReview>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, trim: true, minlength: 5, maxlength: 1000 }
  },
  { timestamps: true, _id: false }
);

const productSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, trim: true, index: true },
    price: { type: Number, required: true, min: 0 },
    description: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true, index: true },
    stock: { type: Number, required: true, min: 0, default: 0 },
    images: {
      type: [String],
      default: []
    },
    isActive: { type: Boolean, default: true, index: true },
    reviews: { type: [productReviewSchema], default: [] },
    averageRating: { type: Number, min: 0, max: 5, default: 0 },
    totalReviews: { type: Number, min: 0, default: 0 }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

productSchema.index({ name: 'text', description: 'text', category: 'text' });

export const Product = model<IProduct>('Product', productSchema);
