import { Request, Response } from 'express';
import { User } from '../models/user.model';
import { Product } from '../models/product.model';
import { catchAsync } from '../utils/catchAsync';
import { ApiError } from '../utils/ApiError';

export const getMyProfile = catchAsync(async (req: Request, res: Response) => {
  const user = await User.findById(req.user?.userId).populate('wishlist', 'name price images stock averageRating totalReviews');

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  res.status(200).json({
    success: true,
    data: user
  });
});

export const getAllUsers = catchAsync(async (_req: Request, res: Response) => {
  const users = await User.find().sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data: users
  });
});

export const updateUserBlockStatus = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { isBlocked } = req.body as { isBlocked: boolean };

  const user = await User.findByIdAndUpdate(id, { isBlocked }, { new: true, runValidators: true });

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  res.status(200).json({
    success: true,
    message: `User ${isBlocked ? 'blocked' : 'unblocked'} successfully`,
    data: user
  });
});

export const getMyWishlist = catchAsync(async (req: Request, res: Response) => {
  const user = await User.findById(req.user?.userId).populate('wishlist');
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  res.status(200).json({ success: true, data: user.wishlist });
});

export const addToWishlist = catchAsync(async (req: Request, res: Response) => {
  const { productId } = req.params;

  const product = await Product.findOne({ _id: productId, isActive: true });
  if (!product) {
    throw new ApiError(404, 'Product not found');
  }

  const user = await User.findByIdAndUpdate(
    req.user?.userId,
    { $addToSet: { wishlist: productId } },
    { new: true }
  ).populate('wishlist');

  res.status(200).json({
    success: true,
    message: 'Added to wishlist',
    data: user?.wishlist ?? []
  });
});

export const removeFromWishlist = catchAsync(async (req: Request, res: Response) => {
  const { productId } = req.params;

  const user = await User.findByIdAndUpdate(req.user?.userId, { $pull: { wishlist: productId } }, { new: true }).populate(
    'wishlist'
  );

  res.status(200).json({
    success: true,
    message: 'Removed from wishlist',
    data: user?.wishlist ?? []
  });
});

export const addAddress = catchAsync(async (req: Request, res: Response) => {
  const user = await User.findById(req.user?.userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  if (req.body.isDefault) {
    user.addresses.forEach((address) => {
      address.isDefault = false;
    });
  }

  if (user.addresses.length === 0) {
    req.body.isDefault = true;
  }

  user.addresses.push(req.body);
  await user.save();

  res.status(201).json({
    success: true,
    message: 'Address added successfully',
    data: user.addresses
  });
});

export const updateAddress = catchAsync(async (req: Request, res: Response) => {
  const user = await User.findById(req.user?.userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const address = user.addresses.id(req.params.addressId);
  if (!address) {
    throw new ApiError(404, 'Address not found');
  }

  Object.assign(address, req.body);

  if (address.isDefault) {
    user.addresses.forEach((existingAddress) => {
      if (existingAddress._id?.toString() !== req.params.addressId) {
        existingAddress.isDefault = false;
      }
    });
  }

  await user.save();

  res.status(200).json({ success: true, message: 'Address updated', data: user.addresses });
});

export const deleteAddress = catchAsync(async (req: Request, res: Response) => {
  const user = await User.findById(req.user?.userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const address = user.addresses.id(req.params.addressId);
  if (!address) {
    throw new ApiError(404, 'Address not found');
  }

  const wasDefault = address.isDefault;
  address.deleteOne();

  if (wasDefault && user.addresses.length > 0) {
    user.addresses[0].isDefault = true;
  }

  await user.save();

  res.status(200).json({ success: true, message: 'Address deleted', data: user.addresses });
});
