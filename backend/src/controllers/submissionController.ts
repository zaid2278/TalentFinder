import { Request, Response, NextFunction } from 'express';
import { submissionService } from '../services/submissionService.js';

export const submissionController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await submissionService.list(req.tenantId!, {
        search: typeof req.query.search === 'string' ? req.query.search : undefined,
        page: typeof req.query.page === 'string' ? req.query.page : undefined,
        pageSize: typeof req.query.pageSize === 'string' ? req.query.pageSize : undefined,
        sort: typeof req.query.sort === 'string' ? req.query.sort : undefined,
      });
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
};