import prisma from '../lib/prisma.js';

export const tenantRepository = {
  async findMany({ search, skip, take }: { search?: string; skip: number; take: number }) {
    const where = search
      ? { name: { contains: search, mode: 'insensitive' as const } }
      : {};

    const [items, total] = await Promise.all([
      prisma.tenant.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        select: { id: true, name: true, status: true, createdAt: true },
      }),
      prisma.tenant.count({ where }),
    ]);

    return { items, total };
  },

  async create(name: string) {
    return prisma.tenant.create({
      data: { name },
      select: { id: true, name: true, status: true, createdAt: true },
    });
  },

  async findById(id: string) {
    return prisma.tenant.findUnique({ where: { id } });
  },

  async updateStatus(id: string, status: string) {
    return prisma.tenant.update({
      where: { id },
      data: { status },
      select: { id: true, name: true, status: true, createdAt: true },
    });
  },

  async remove(id: string) {
    return prisma.tenant.delete({
      where: { id },
      select: { id: true },
    });
  },
};