import { z } from 'zod';
import { candidateRepository } from '../repositories/candidateRepository.js';
import { skillRepository } from '../repositories/skillRepository.js';
import { parsePagination, parseSort } from '../lib/query.js';
import { AppError } from '../middleware/errorHandler.js';

const createCandidateSchema = z.object({
  fullName: z.string().trim().min(1, 'fullName is required'),
  location: z.string().trim().optional().nullable(),
  experienceYears: z.coerce.number().int().min(0, 'experienceYears must be 0 or greater'),
  email: z.string().trim().email().optional().nullable().or(z.literal('')),
  phone: z.string().trim().optional().nullable(),
  skillIds: z
    .union([z.array(z.string().uuid()), z.string()])
    .transform((v) => (typeof v === 'string' ? (v ? JSON.parse(v) : []) : v))
    .pipe(z.array(z.string().uuid()).min(1, 'At least one skill is required')),
});

const updateCandidateSchema = createCandidateSchema.partial().extend({
  skillIds: z
    .union([z.array(z.string().uuid()), z.string()])
    .transform((v) => (typeof v === 'string' ? (v ? JSON.parse(v) : []) : v))
    .pipe(z.array(z.string().uuid()).min(1, 'At least one skill is required'))
    .optional(),
});

function mapCandidate(c: Awaited<ReturnType<typeof candidateRepository.findById>>) {
  if (!c) return null;
  return {
    id: c.id,
    tenantId: c.tenantId,
    fullName: c.fullName,
    email: c.email,
    phone: c.phone,
    location: c.location,
    experienceYears: c.experienceYears,
    cvUrl: c.cvUrl,
    createdAt: c.createdAt,
    skills: c.skills.map((s) => ({ id: s.skill.id, name: s.skill.name })),
    submissions: 'submissions' in c && Array.isArray(c.submissions)
      ? c.submissions.map((sub) => ({
          id: sub.id,
          status: sub.status,
          jobOrder: sub.jobOrder,
        }))
      : undefined,
  };
}

export const candidateService = {
  async list(
    tenantId: string,
    query: { search?: string; page?: string; pageSize?: string; sort?: string },
  ) {
    const { page, pageSize, skip, take } = parsePagination(query);
    const orderBy = parseSort(query.sort, ['createdAt', 'fullName', 'experienceYears', 'location']);
    const { items, total } = await candidateRepository.findMany({
      tenantId,
      search: query.search,
      skip,
      take,
      orderBy,
    });

    return {
      items: items.map((c) => mapCandidate(c)),
      total,
      page,
      pageSize,
    };
  },

  async getById(tenantId: string, id: string) {
    const candidate = await candidateRepository.findById(tenantId, id);
    if (!candidate) throw new AppError('Candidate not found', 404);
    return mapCandidate(candidate);
  },

  async create(tenantId: string, body: unknown, cvUrl?: string | null) {
    const data = createCandidateSchema.parse(body);
    const skills = await skillRepository.findByIds(data.skillIds);
    if (skills.length !== data.skillIds.length) {
      throw new AppError('One or more skillIds are invalid', 400);
    }

    const candidate = await candidateRepository.create(tenantId, {
      fullName: data.fullName,
      location: data.location || null,
      experienceYears: data.experienceYears,
      email: data.email || null,
      phone: data.phone || null,
      cvUrl: cvUrl ?? null,
      skillIds: data.skillIds,
    });

    return mapCandidate(candidate);
  },

  async update(tenantId: string, id: string, body: unknown, cvUrl?: string | null) {
    const data = updateCandidateSchema.parse(body);
    if (data.skillIds) {
      const skills = await skillRepository.findByIds(data.skillIds);
      if (skills.length !== data.skillIds.length) {
        throw new AppError('One or more skillIds are invalid', 400);
      }
    }

    const candidate = await candidateRepository.update(tenantId, id, {
      ...data,
      email: data.email === '' ? null : data.email,
      location: data.location || null,
      phone: data.phone || null,
      cvUrl: cvUrl === undefined ? undefined : cvUrl,
    });

    if (!candidate) throw new AppError('Candidate not found', 404);
    return mapCandidate(candidate);
  },

  async remove(tenantId: string, id: string) {
    const deleted = await candidateRepository.delete(tenantId, id);
    if (!deleted) throw new AppError('Candidate not found', 404);
    return { success: true };
  },
};