import { Request, Response, NextFunction } from 'express';
import { tenantRepository } from '../repositories/tenantRepository.js';
import { AppError } from './errorHandler.js';

const WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH']);

/**
 * After requireTenant: block create/update writes against Inactive tenants.
 * GET/DELETE and Tenant admin routes are unaffected.
 */
export async function requireActiveTenantForWrites(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  try {
    if (!WRITE_METHODS.has(req.method)) {
      return next();
    }

    const tenantId = req.tenantId;
    if (!tenantId) {
      return next();
    }

    const tenant = await tenantRepository.findById(tenantId);
    if (!tenant) {
      return next(new AppError('Tenant not found', 404));
    }

    if (tenant.status !== 'Active') {
      return next(
        new AppError('Cannot create or update data for an inactive tenant', 403),
      );
    }

    next();
  } catch (err) {
    next(err);
  }
}
