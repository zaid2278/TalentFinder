import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { AppError } from './errorHandler.js';

export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  if (req.user?.role !== Role.ADMIN) {
    return next(new AppError('Admin access required', 403));
  }
  next();
}
