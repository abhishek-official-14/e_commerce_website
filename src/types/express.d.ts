import { IUserRole } from '../models/user.model';

declare global {
  namespace Express {
    interface UserPayload {
      userId: string;
      role: IUserRole;
    }

    interface Request {
      user?: UserPayload;
    }
  }
}

export {};
