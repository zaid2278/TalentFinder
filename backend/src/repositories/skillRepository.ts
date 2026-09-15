import prisma from '../lib/prisma.js';

export const skillRepository = {
  async findAll() {
    return prisma.skill.findMany({ orderBy: { name: 'asc' } });
  },

  async findByIds(ids: string[]) {
    return prisma.skill.findMany({ where: { id: { in: ids } } });
  },
};