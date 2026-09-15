import { submissionRepository } from '../repositories/submissionRepository.js';
import { parsePagination, parseSort } from '../lib/query.js';

export const submissionService = {
  async list(
    tenantId: string,
    query: { search?: string; page?: string; pageSize?: string; sort?: string },
  ) {
    const { page, pageSize, skip, take } = parsePagination(query);
    const orderBy = parseSort(query.sort, ['createdAt', 'status']);
    const { items, total } = await submissionRepository.findMany({
      tenantId,
      search: query.search,
      skip,
      take,
      orderBy,
    });

    return {
      items: items.map((s) => ({
        id: s.id,
        status: s.status,
        createdAt: s.createdAt,
        jobOrder: s.jobOrder,
        candidate: s.candidate,
      })),
      total,
      page,
      pageSize,
    };
  },
};