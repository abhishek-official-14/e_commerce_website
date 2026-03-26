export interface Product {
  _id: string;
  name: string;
  price: number;
  description: string;
  category: string;
  stock: number;
  images: string[];
  inStock: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
}

export interface ProductQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
}

export interface ProductResponse {
  data: Product[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CartResponse {
  _id: string;
  user: string;
  items: CartItem[];
}

export interface OrderItemSnapshot {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Order {
  _id: string;
  user: string;
  items: OrderItemSnapshot[];
  totalAmount: number;
  address: string;
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'failed';
  paymentCurrency: string;
  paymentAmountInSubunits: number;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  paymentVerifiedAt?: string;
  stockReduced: boolean;
  paymentFailureReason?: string;
  createdAt: string;
  updatedAt: string;
}
