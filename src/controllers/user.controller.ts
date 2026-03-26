import { Request, Response } from 'express';
import { User } from '../models/user.model';
import { catchAsync } from '../utils/catchAsync';
import { ApiError } from '../utils/ApiError';

export const getMyProfile = catchAsync(async (req: Request, res: Response) => {
  const user = await User.findById(req.user?.userId);

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
