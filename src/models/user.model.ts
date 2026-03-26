import bcrypt from 'bcrypt';
import { Schema, model, Document, Types } from 'mongoose';

export type IUserRole = 'user' | 'admin';

export interface IUserAddress {
  _id?: Types.ObjectId;
  label: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: IUserRole;
  isBlocked: boolean;
  wishlist: Types.ObjectId[];
  addresses: IUserAddress[];
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const addressSchema = new Schema<IUserAddress>(
  {
    label: { type: String, required: true, trim: true },
    line1: { type: String, required: true, trim: true },
    line2: { type: String, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    postalCode: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true, default: 'India' },
    isDefault: { type: Boolean, default: false }
  },
  { _id: true }
);

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user'
    },
    isBlocked: {
      type: Boolean,
      default: false
    },
    wishlist: {
      type: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
      default: []
    },
    addresses: {
      type: [addressSchema],
      default: []
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

userSchema.pre('save', async function handlePasswordHash(next) {
  if (!this.isModified('password')) return next();

  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = function comparePassword(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export const User = model<IUser>('User', userSchema);
