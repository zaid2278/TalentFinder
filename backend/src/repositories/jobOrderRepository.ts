import prisma from '../lib/prisma.js';
import { Prisma } from '@prisma/client';

type ListArgs = {
  tenantId: string;
  search?: string;
  skip: number;
  take: number;
  orderBy: Prisma.JobOrderOrderByWithRelationInput;
};

export const jobOrderRepository = {
  async findMany({ tenantId, search, skip, take, orderBy }: ListArgs) {
    const where: Prisma.JobOrderWhereInput = {
      tenantId,
      ...(search
        ? {
            OR: [
              { jobTitle: { contains: search, mode: 'insensitive' } },
              { clientName: { contains: search, mode: 'insensitive' } },
              { location: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      prisma.jobOrder.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          skills: { include: { skill: true } },
        },
      }),
      prisma.jobOrder.count({ where }),
    ]);

    return { items, total };
  },

  async findById(tenantId: string, id: string) {
    return prisma.jobOrder.findFirst({
      where: { id, tenantId },
      include: {
        skills: { include: { skill: true } },
        submissions: {
          include: {
            candidate: {
              include: { skills: { include: { skill: true } } },
            },
          },
        },
      },
    });
  },

  async create(
    tenantId: string,
    data: {
      jobTitle: string;
      clientName?: string | null;
      location: string;
      minExperienceYears: number;
      numberOfOpenings: number;
      status?: string;
      skillIds: string[];
    },
  ) {
    return prisma.jobOrder.create({
      data: {
        tenantId,
        jobTitle: data.jobTitle,
        clientName: data.clientName,
        location: data.location,
        minExperienceYears: data.minExperienceYears,
        numberOfOpenings: data.numberOfOpenings,
        status: data.status ?? 'Open',
        skills: {
          create: data.skillIds.map((skillId) => ({ skillId })),
        },
      },
      include: {
        skills: { include: { skill: true } },
      },
    });
  },

  async update(
    tenantId: string,
    id: string,
    data: {
      jobTitle?: string;
      clientName?: string | null;
      location?: string;
      minExperienceYears?: number;
      numberOfOpenings?: number;
      status?: string;
      skillIds?: string[];
    },
  ) {
    const existing = await prisma.jobOrder.findFirst({ where: { id, tenantId } });
    if (!existing) return null;

    return prisma.$transaction(async (tx) => {
      if (data.skillIds) {
        await tx.jobOrderSkill.deleteMany({ where: { jobOrderId: id } });
        await tx.jobOrderSkill.createMany({
          data: data.skillIds.map((skillId) => ({ jobOrderId: id, skillId })),
        });
      }

      return tx.jobOrder.update({
        where: { id },
        data: {
          jobTitle: data.jobTitle,
          clientName: data.clientName,
          location: data.location,
          minExperienceYears: data.minExperienceYears,
          numberOfOpenings: data.numberOfOpenings,
          status: data.status,
        },
        include: {
          skills: { include: { skill: true } },
          submissions: {
            include: {
              candidate: {
                include: { skills: { include: { skill: true } } },
              },
            },
          },
        },
      });
    });
  },

  async delete(tenantId: string, id: string) {
    const existing = await prisma.jobOrder.findFirst({ where: { id, tenantId } });
    if (!existing) return null;
    await prisma.jobOrder.delete({ where: { id } });
    return existing;
  },

  async getRequiredSkillIds(tenantId: string, id: string) {
    const job = await prisma.jobOrder.findFirst({
      where: { id, tenantId },
      include: { skills: true },
    });
    if (!job) return null;
    return job.skills.map((s) => s.skillId);
  },
};