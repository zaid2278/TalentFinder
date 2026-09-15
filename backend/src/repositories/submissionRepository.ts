import prisma from '../lib/prisma.js';
import { Prisma } from '@prisma/client';

type ListArgs = {
  tenantId: string;
  search?: string;
  skip: number;
  take: number;
  orderBy: Prisma.SubmissionOrderByWithRelationInput;
};

export const submissionRepository = {
  async findMany({ tenantId, search, skip, take, orderBy }: ListArgs) {
    const where: Prisma.SubmissionWhereInput = {
      tenantId,
      ...(search
        ? {
            OR: [
              { status: { contains: search, mode: 'insensitive' } },
              { candidate: { fullName: { contains: search, mode: 'insensitive' } } },
              { jobOrder: { jobTitle: { contains: search, mode: 'insensitive' } } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      prisma.submission.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          candidate: { select: { id: true, fullName: true } },
          jobOrder: { select: { id: true, jobTitle: true } },
        },
      }),
      prisma.submission.count({ where }),
    ]);

    return { items, total };
  },

  async findByJobAndCandidate(tenantId: string, jobOrderId: string, candidateId: string) {
    return prisma.submission.findFirst({
      where: { tenantId, jobOrderId, candidateId },
      include: {
        candidate: { select: { id: true, fullName: true } },
        jobOrder: { select: { id: true, jobTitle: true } },
      },
    });
  },

  async create(tenantId: string, jobOrderId: string, candidateId: string) {
    return prisma.submission.create({
      data: {
        tenantId,
        jobOrderId,
        candidateId,
        status: 'Shortlisted',
      },
      include: {
        candidate: { select: { id: true, fullName: true } },
        jobOrder: { select: { id: true, jobTitle: true } },
      },
    });
  },
};