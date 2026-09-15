import { z } from 'zod';
import { tenantRepository } from '../repositories/tenantRepository.js';
import { parsePagination } from '../lib/query.js';
import { AppError } from '../middleware/errorHandler.js';

const createTenantSchema = z.object({
  name: z.string().trim().min(1, 'name is required'),
});

export const tenantService = {
  async list(query: { search?: string; page?: string; pageSize?: string }) {
    const { page, pageSize, skip, take } = parsePagination(query);
    const { items, total } = await tenantRepository.findMany({
      search: query.search,
      skip,
      take,
    });

    return {
      items: items.map((t) => ({ ...t, status: 'Active' as const })),
      total,
      page,
      pageSize,
    };
  },

  async create(body: unknown) {
    const data = createTenantSchema.parse(body);
    try {
      const tenant = await tenantRepository.create(data.name);
      return { ...tenant, status: 'Active' as const };
    } catch (err: unknown) {
      if (typeof err === 'object' && err && 'code' in err && (err as { code: string }).code === 'P2002') {
        throw new AppError('Tenant name already exists', 400);
      }
      throw err;
    }
  },
};