import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { IUserRole } from '../models/user.model';

interface AccessTokenPayload {
  userId: string;
  role: IUserRole;
}

export const generateAccessToken = (payload: AccessTokenPayload): string => {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN
  });
};

export const verifyAccessToken = (token: string): AccessTokenPayload => {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
};
