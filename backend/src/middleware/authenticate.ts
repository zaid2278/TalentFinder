import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
import { AppError } from './errorHandler.js';

type JwtPayload = {
  id: string;
  username: string;
  role: Role;
  tenantId: string | null;
};

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return next(new AppError('Authentication required', 401));
  }

  const token = header.slice('Bearer '.length).trim();
  const secret = process.env.JWT_SECRET?.trim();
  if (!secret) {
    return next(new Error('JWT_SECRET is not configured'));
  }

  try {
    const decoded = jwt.verify(token, secret) as JwtPayload;
    req.user = {
      id: decoded.id,
      username: decoded.username,
      role: decoded.role,
      tenantId: decoded.tenantId ?? null,
    };
    next();
  } catch {
    next(new AppError('Invalid or expired token', 401));
  }
}
