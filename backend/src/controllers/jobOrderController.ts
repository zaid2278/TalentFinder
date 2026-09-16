import { Request, Response, NextFunction } from 'express';
import { jobOrderService } from '../services/jobOrderService.js';
import { matchInsightService } from '../services/matchInsightService.js';

export const jobOrderController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await jobOrderService.list(req.tenantId!, {
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
      const job = await jobOrderService.getById(req.tenantId!, req.params.id);
      res.json(job);
    } catch (err) {
      next(err);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const job = await jobOrderService.create(req.tenantId!, req.body);
      res.status(201).json(job);
    } catch (err) {
      next(err);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const job = await jobOrderService.update(req.tenantId!, req.params.id, req.body);
      res.json(job);
    } catch (err) {
      next(err);
    }
  },

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await jobOrderService.remove(req.tenantId!, req.params.id);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  async matches(req: Request, res: Response, next: NextFunction) {
    try {
      const matches = await jobOrderService.getMatches(req.tenantId!, req.params.id);
      res.json(matches);
    } catch (err) {
      next(err);
    }
  },

  async matchInsights(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId!;
      const jobOrderId = req.params.id;
      const job = await jobOrderService.getById(tenantId, jobOrderId);
      const matches = await jobOrderService.getMatches(tenantId, jobOrderId);

      const insights = await matchInsightService.getMatchInsights({
        jobOrderId,
        jobOrder: {
          jobTitle: job.jobTitle,
          requiredSkills: job.requiredSkills,
        },
        matches: matches.map((m) => ({
          candidateId: m.candidate.id,
          fullName: m.candidate.fullName,
          experienceYears: m.candidate.experienceYears,
          matchedSkills: m.matchedSkills,
          matchCount: m.matchCount,
        })),
      });

      res.json({ insights });
    } catch (err) {
      next(err);
    }
  },

  async shortlist(req: Request, res: Response, next: NextFunction) {
    try {
      const submission = await jobOrderService.shortlist(req.tenantId!, req.params.id, req.body);
      res.status(201).json(submission);
    } catch (err) {
      next(err);
    }
  },

  async unshortlist(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await jobOrderService.unshortlist(req.tenantId!, req.params.id, req.body);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
};
