import { Request, Response, NextFunction } from 'express';
import { candidateService } from '../services/candidateService.js';

export const candidateController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await candidateService.list(req.tenantId!, {
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

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const candidate = await candidateService.getById(req.tenantId!, req.params.id);
      res.json(candidate);
    } catch (err) {
      next(err);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const cvUrl = req.file ? `/uploads/${req.file.filename}` : null;
      const candidate = await candidateService.create(req.tenantId!, req.body, cvUrl);
      res.status(201).json(candidate);
    } catch (err) {
      next(err);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const cvUrl = req.file ? `/uploads/${req.file.filename}` : undefined;
      const candidate = await candidateService.update(req.tenantId!, req.params.id, req.body, cvUrl);
      res.json(candidate);
    } catch (err) {
      next(err);
    }
  },

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await candidateService.remove(req.tenantId!, req.params.id);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
};