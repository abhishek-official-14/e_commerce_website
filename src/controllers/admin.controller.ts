import { Request, Response } from 'express';
import { Order } from '../models/order.model';
import { User } from '../models/user.model';
import { catchAsync } from '../utils/catchAsync';

export const getDashboardStats = catchAsync(async (_req: Request, res: Response) => {
  const [users, ordersAgg] = await Promise.all([
    User.countDocuments(),
    Order.aggregate([
      {
        $group: {
          _id: null,
          orders: { $sum: 1 },
          revenue: {
            $sum: {
              $cond: [{ $eq: ['$status', 'paid'] }, '$totalAmount', 0]
            }
          }
        }
      }
    ])
  ]);

  const orderStats = ordersAgg[0] ?? { orders: 0, revenue: 0 };

  res.status(200).json({
    success: true,
    data: {
      users,
      orders: orderStats.orders,
      revenue: orderStats.revenue
    }
  });
});
