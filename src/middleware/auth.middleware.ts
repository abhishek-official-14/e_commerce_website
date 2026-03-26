import { NextFunction, Request, Response } from 'express';
import { ApiError } from '../utils/ApiError';
import { verifyAccessToken } from '../utils/jwt';
import { IUserRole } from '../models/user.model';

export const auth = (...roles: IUserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(new ApiError(401, 'Unauthorized: Missing or invalid token'));
    }

    const token = authHeader.split(' ')[1];

    try {
      const decoded = verifyAccessToken(token);
      req.user = decoded;

      if (roles.length > 0 && !roles.includes(decoded.role)) {
        return next(new ApiError(403, 'Forbidden: Insufficient permissions'));
      }

      next();
    } catch {
      next(new ApiError(401, 'Unauthorized: Token invalid or expired'));
    }
  };
};
