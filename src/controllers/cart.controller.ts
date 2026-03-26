import { Request, Response } from 'express';
import { Cart } from '../models/cart.model';
import { Product } from '../models/product.model';
import { ApiError } from '../utils/ApiError';
import { catchAsync } from '../utils/catchAsync';

const populateCart = (userId: string) =>
  Cart.findOne({ user: userId }).populate({
    path: 'items.product',
    select: 'name price images stock isActive'
  });

export const getMyCart = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    throw new ApiError(401, 'Unauthorized');
  }

  const cart = (await populateCart(userId)) ?? (await Cart.create({ user: userId, items: [] }));

  res.status(200).json({
    success: true,
    data: cart
  });
});

export const addItemToCart = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    throw new ApiError(401, 'Unauthorized');
  }

  const { productId, quantity } = req.body as { productId: string; quantity: number };

  const product = await Product.findById(productId);
  if (!product || !product.isActive) {
    throw new ApiError(404, 'Product not found');
  }

  const cart = (await Cart.findOne({ user: userId })) ?? (await Cart.create({ user: userId, items: [] }));

  const itemIndex = cart.items.findIndex((item) => item.product.toString() === productId);
  const nextQuantity = itemIndex >= 0 ? cart.items[itemIndex].quantity + quantity : quantity;

  if (nextQuantity > product.stock) {
    throw new ApiError(400, `Only ${product.stock} units available in stock`);
  }

  if (itemIndex >= 0) {
    cart.items[itemIndex].quantity = nextQuantity;
  } else {
    cart.items.push({ product: product._id, quantity: nextQuantity });
  }

  await cart.save();

  const populated = await populateCart(userId);

  res.status(200).json({
    success: true,
    message: 'Item added to cart',
    data: populated
  });
});

export const updateCartItemQuantity = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    throw new ApiError(401, 'Unauthorized');
  }

  const { productId, quantity } = req.body as { productId: string; quantity: number };

  const cart = await Cart.findOne({ user: userId });
  if (!cart) {
    throw new ApiError(404, 'Cart not found');
  }

  const product = await Product.findOne({ _id: productId, isActive: true });
  if (!product) {
    throw new ApiError(404, 'Product not found');
  }

  const item = cart.items.find((cartItem) => cartItem.product.toString() === productId);
  if (!item) {
    throw new ApiError(404, 'Item not found in cart');
  }

  if (quantity > product.stock) {
    throw new ApiError(400, `Only ${product.stock} units available in stock`);
  }

  item.quantity = quantity;
  await cart.save();

  const populated = await populateCart(userId);

  res.status(200).json({
    success: true,
    message: 'Cart item quantity updated',
    data: populated
  });
});

export const removeItemFromCart = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    throw new ApiError(401, 'Unauthorized');
  }

  const { productId } = req.params;

  const cart = await Cart.findOne({ user: userId });
  if (!cart) {
    throw new ApiError(404, 'Cart not found');
  }

  const initialLength = cart.items.length;
  cart.items = cart.items.filter((item) => item.product.toString() !== productId);

  if (cart.items.length === initialLength) {
    throw new ApiError(404, 'Item not found in cart');
  }

  await cart.save();

  const populated = await populateCart(userId);

  res.status(200).json({
    success: true,
    message: 'Item removed from cart',
    data: populated
  });
});
