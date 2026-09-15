import { z } from 'zod';
import { jobOrderRepository } from '../repositories/jobOrderRepository.js';
import { candidateRepository } from '../repositories/candidateRepository.js';
import { submissionRepository } from '../repositories/submissionRepository.js';
import { skillRepository } from '../repositories/skillRepository.js';
import { parsePagination, parseSort } from '../lib/query.js';
import { AppError } from '../middleware/errorHandler.js';

const createJobOrderSchema = z.object({
  jobTitle: z.string().trim().min(1, 'jobTitle is required'),
  location: z.string().trim().min(1, 'location is required'),
  minExperienceYears: z.coerce.number().int().min(0),
  numberOfOpenings: z.coerce.number().int().min(1, 'numberOfOpenings must be 1 or greater'),
  clientName: z.string().trim().optional().nullable(),
  status: z.string().trim().optional(),
  skillIds: z.array(z.string().uuid()).min(1, 'At least one skill is required'),
});

const updateJobOrderSchema = createJobOrderSchema.partial();

const shortlistSchema = z.object({
  candidateId: z.string().uuid(),
});

function mapJobOrder(j: NonNullable<Awaited<ReturnType<typeof jobOrderRepository.findById>>>) {
  return {
    id: j.id,
    tenantId: j.tenantId,
    jobTitle: j.jobTitle,
    clientName: j.clientName,
    location: j.location,
    minExperienceYears: j.minExperienceYears,
    numberOfOpenings: j.numberOfOpenings,
    status: j.status,
    createdAt: j.createdAt,
    requiredSkills: j.skills.map((s) => ({ id: s.skill.id, name: s.skill.name })),
    submissions:
      'submissions' in j && Array.isArray(j.submissions)
        ? j.submissions.map((sub) => ({
            id: sub.id,
            status: sub.status,
            candidate: {
              id: sub.candidate.id,
              fullName: sub.candidate.fullName,
              location: sub.candidate.location,
              experienceYears: sub.candidate.experienceYears,
              skills: sub.candidate.skills.map((s) => ({
                id: s.skill.id,
                name: s.skill.name,
              })),
            },
          }))
        : undefined,
  };
}

export const jobOrderService = {
  async list(
    tenantId: string,
    query: { search?: string; page?: string; pageSize?: string; sort?: string },
  ) {
    const { page, pageSize, skip, take } = parsePagination(query);
    const orderBy = parseSort(query.sort, [
      'createdAt',
      'jobTitle',
      'location',
      'minExperienceYears',
      'numberOfOpenings',
      'status',
    ]);
    const { items, total } = await jobOrderRepository.findMany({
      tenantId,
      search: query.search,
      skip,
      take,
      orderBy,
    });

    return {
      items: items.map((j) => mapJobOrder(j)),
      total,
      page,
      pageSize,
    };
  },

  async getById(tenantId: string, id: string) {
    const job = await jobOrderRepository.findById(tenantId, id);
    if (!job) throw new AppError('Job order not found', 404);
    return mapJobOrder(job);
  },

  async create(tenantId: string, body: unknown) {
    const data = createJobOrderSchema.parse(body);
    const skills = await skillRepository.findByIds(data.skillIds);
    if (skills.length !== data.skillIds.length) {
      throw new AppError('One or more skillIds are invalid', 400);
    }

    const job = await jobOrderRepository.create(tenantId, {
      ...data,
      clientName: data.clientName || null,
      status: data.status || 'Open',
    });
    return mapJobOrder(job);
  },

  async update(tenantId: string, id: string, body: unknown) {
    const data = updateJobOrderSchema.parse(body);
    if (data.skillIds) {
      const skills = await skillRepository.findByIds(data.skillIds);
      if (skills.length !== data.skillIds.length) {
        throw new AppError('One or more skillIds are invalid', 400);
      }
    }

    const job = await jobOrderRepository.update(tenantId, id, {
      ...data,
      clientName: data.clientName === undefined ? undefined : data.clientName || null,
    });
    if (!job) throw new AppError('Job order not found', 404);
    return mapJobOrder(job);
  },

  async remove(tenantId: string, id: string) {
    const deleted = await jobOrderRepository.delete(tenantId, id);
    if (!deleted) throw new AppError('Job order not found', 404);
    return { success: true };
  },

  async getMatches(tenantId: string, jobOrderId: string) {
    const requiredSkillIds = await jobOrderRepository.getRequiredSkillIds(tenantId, jobOrderId);
    if (!requiredSkillIds) throw new AppError('Job order not found', 404);

    const requiredSet = new Set(requiredSkillIds);
    const candidates = await candidateRepository.findAllWithSkills(tenantId);

    const matches = candidates
      .map((candidate) => {
        const matchedSkills = candidate.skills
          .filter((cs) => requiredSet.has(cs.skillId))
          .map((cs) => ({ id: cs.skill.id, name: cs.skill.name }));

        return {
          candidate: {
            id: candidate.id,
            fullName: candidate.fullName,
            location: candidate.location,
            experienceYears: candidate.experienceYears,
            skills: candidate.skills.map((s) => ({ id: s.skill.id, name: s.skill.name })),
          },
          matchedSkills,
          matchCount: matchedSkills.length,
        };
      })
      .filter((m) => m.matchCount > 0)
      .sort((a, b) => b.matchCount - a.matchCount);

    return matches;
  },

  async shortlist(tenantId: string, jobOrderId: string, body: unknown) {
    const { candidateId } = shortlistSchema.parse(body);

    const job = await jobOrderRepository.findById(tenantId, jobOrderId);
    if (!job) throw new AppError('Job order not found', 404);

    const candidate = await candidateRepository.findById(tenantId, candidateId);
    if (!candidate) throw new AppError('Candidate not found', 404);

    const existing = await submissionRepository.findByJobAndCandidate(
      tenantId,
      jobOrderId,
      candidateId,
    );
    if (existing) return existing;

    return submissionRepository.create(tenantId, jobOrderId, candidateId);
  },
};