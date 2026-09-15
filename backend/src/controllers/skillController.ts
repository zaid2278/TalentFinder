import { Request, Response, NextFunction } from 'express';
import { skillService } from '../services/skillService.js';

export const skillController = {
  async list(_req: Request, res: Response, next: NextFunction) {
    try {
      const skills = await skillService.list();
      res.json(skills);
    } catch (err) {
      next(err);
    }
  },
};