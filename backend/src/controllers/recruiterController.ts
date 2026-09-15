import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authService } from '../services/authService.js';

const createRecruiterSchema = z.object({
  name: z.string().trim().min(1),
  username: z.string().trim().min(1),
  password: z.string().min(6),
  tenantId: z.string().uuid(),
});

export const recruiterController = {
  async list(_req: Request, res: Response, next: NextFunction) {
    try {
      const items = await authService.listRecruiters();
      res.json({ items });
    } catch (err) {
      next(err);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createRecruiterSchema.parse(req.body);
      const recruiter = await authService.createRecruiter(data);
      res.status(201).json(recruiter);
    } catch (err) {
      next(err);
    }
  },
};
