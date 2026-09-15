import { Request, Response, NextFunction } from 'express';
import { tenantService } from '../services/tenantService.js';

export const tenantController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await tenantService.list({
        search: typeof req.query.search === 'string' ? req.query.search : undefined,
        page: typeof req.query.page === 'string' ? req.query.page : undefined,
        pageSize: typeof req.query.pageSize === 'string' ? req.query.pageSize : undefined,
      });
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const tenant = await tenantService.create(req.body);
      res.status(201).json(tenant);
    } catch (err) {
      next(err);
    }
  },
};