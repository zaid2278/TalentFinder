import { Request, Response, NextFunction } from 'express';

declare global {
  namespace Express {
    interface Request {
      tenantId?: string;
    }
  }
}

export function requireTenant(req: Request, res: Response, next: NextFunction) {
  const tenantId =
    (typeof req.query.tenantId === 'string' && req.query.tenantId) ||
    (typeof req.body?.tenantId === 'string' && req.body.tenantId) ||
    undefined;

  if (!tenantId) {
    return res.status(400).json({ error: 'tenantId is required' });
  }

  req.tenantId = tenantId;
  next();
}