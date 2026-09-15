import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authService } from '../services/authService.js';

const loginSchema = z.object({
  username: z.string().trim().min(1),
  password: z.string().min(1),
});

export const authController = {
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const body = loginSchema.parse(req.body);
      const result = await authService.login(body.username, body.password);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
};
