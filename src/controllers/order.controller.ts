import { Request, Response } from 'express';
import { Cart } from '../models/cart.model';
import { Order, IOrderStatus } from '../models/order.model';
import { Product } from '../models/product.model';
import { ApiError } from '../utils/ApiError';
import { catchAsync } from '../utils/catchAsync';

export const createOrder = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    throw new ApiError(401, 'Unauthorized');
  }

  const { address } = req.body as { address: string };

  const cart = await Cart.findOne({ user: userId });
  if (!cart || cart.items.length === 0) {
    throw new ApiError(400, 'Cart is empty');
  }

  const productIds = cart.items.map((item) => item.product);
  const products = await Product.find({ _id: { $in: productIds }, isActive: true });
  const productMap = new Map(products.map((product) => [product._id.toString(), product]));

  const orderItems = cart.items.map((item) => {
    const product = productMap.get(item.product.toString());

    if (!product) {
      throw new ApiError(400, 'One or more cart items are invalid or inactive');
    }

    if (product.stock < item.quantity) {
      throw new ApiError(400, `${product.name} is out of stock for requested quantity`);
    }

    return {
      productId: product._id,
      name: product.name,
      price: product.price,
      quantity: item.quantity
    };
  });

  const totalAmount = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const order = await Order.create({
    user: userId,
    items: orderItems,
    totalAmount,
    address,
    status: 'pending'
  });

  cart.items = [];
  await cart.save();

  res.status(201).json({
    success: true,
    message: 'Order created successfully before payment',
    data: order
  });
});

export const getMyOrders = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    throw new ApiError(401, 'Unauthorized');
  }

  const orders = await Order.find({ user: userId }).sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data: orders
  });
});

export const getAllOrders = catchAsync(async (_req: Request, res: Response) => {
  const orders = await Order.find().sort({ createdAt: -1 }).populate('user', 'name email role');

  res.status(200).json({
    success: true,
    data: orders
  });
});

export const updateOrderStatus = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body as { status: IOrderStatus };

  const order = await Order.findByIdAndUpdate(id, { status }, { new: true, runValidators: true });

  if (!order) {
    throw new ApiError(404, 'Order not found');
  }

  res.status(200).json({
    success: true,
    message: 'Order status updated successfully',
    data: order
  });
});
