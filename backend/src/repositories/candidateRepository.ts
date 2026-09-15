import prisma from '../lib/prisma.js';
import { Prisma } from '@prisma/client';

type ListArgs = {
  tenantId: string;
  search?: string;
  skip: number;
  take: number;
  orderBy: Prisma.CandidateOrderByWithRelationInput;
};

export const candidateRepository = {
  async findMany({ tenantId, search, skip, take, orderBy }: ListArgs) {
    const where: Prisma.CandidateWhereInput = {
      tenantId,
      ...(search
        ? {
            OR: [
              { fullName: { contains: search, mode: 'insensitive' } },
              { location: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      prisma.candidate.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          skills: { include: { skill: true } },
        },
      }),
      prisma.candidate.count({ where }),
    ]);

    return { items, total };
  },

  async findById(tenantId: string, id: string) {
    return prisma.candidate.findFirst({
      where: { id, tenantId },
      include: {
        skills: { include: { skill: true } },
        submissions: {
          include: {
            jobOrder: { select: { id: true, jobTitle: true, status: true } },
          },
        },
      },
    });
  },

  async findAllWithSkills(tenantId: string) {
    return prisma.candidate.findMany({
      where: { tenantId },
      include: {
        skills: { include: { skill: true } },
      },
    });
  },

  async create(
    tenantId: string,
    data: {
      fullName: string;
      email?: string | null;
      phone?: string | null;
      location?: string | null;
      experienceYears: number;
      cvUrl?: string | null;
      skillIds: string[];
    },
  ) {
    return prisma.candidate.create({
      data: {
        tenantId,
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        location: data.location,
        experienceYears: data.experienceYears,
        cvUrl: data.cvUrl,
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
      fullName?: string;
      email?: string | null;
      phone?: string | null;
      location?: string | null;
      experienceYears?: number;
      cvUrl?: string | null;
      skillIds?: string[];
    },
  ) {
    const existing = await prisma.candidate.findFirst({ where: { id, tenantId } });
    if (!existing) return null;

    return prisma.$transaction(async (tx) => {
      if (data.skillIds) {
        await tx.candidateSkill.deleteMany({ where: { candidateId: id } });
        await tx.candidateSkill.createMany({
          data: data.skillIds.map((skillId) => ({ candidateId: id, skillId })),
        });
      }

      return tx.candidate.update({
        where: { id },
        data: {
          fullName: data.fullName,
          email: data.email,
          phone: data.phone,
          location: data.location,
          experienceYears: data.experienceYears,
          cvUrl: data.cvUrl === undefined ? undefined : data.cvUrl,
        },
        include: {
          skills: { include: { skill: true } },
          submissions: {
            include: {
              jobOrder: { select: { id: true, jobTitle: true, status: true } },
            },
          },
        },
      });
    });
  },

  async delete(tenantId: string, id: string) {
    const existing = await prisma.candidate.findFirst({ where: { id, tenantId } });
    if (!existing) return null;
    await prisma.candidate.delete({ where: { id } });
    return existing;
  },
};