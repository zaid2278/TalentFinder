import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../lib/prisma.js', () => ({
  default: {
    jobOrder: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      count: vi.fn(),
      delete: vi.fn(),
      update: vi.fn(),
    },
    jobOrderSkill: {
      deleteMany: vi.fn(),
      createMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

import prisma from '../lib/prisma.js';
import { jobOrderRepository } from '../repositories/jobOrderRepository.js';

const TENANT = 'tenant-aaa';
const ID = 'job-111';

describe('jobOrderRepository tenant scoping', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('findMany / list includes tenantId in where', async () => {
    vi.mocked(prisma.jobOrder.findMany).mockResolvedValue([]);
    vi.mocked(prisma.jobOrder.count).mockResolvedValue(0);

    await jobOrderRepository.findMany({
      tenantId: TENANT,
      skip: 0,
      take: 10,
      orderBy: { createdAt: 'desc' },
    });

    expect(prisma.jobOrder.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ tenantId: TENANT }),
      }),
    );
    expect(prisma.jobOrder.count).toHaveBeenCalledWith({
      where: expect.objectContaining({ tenantId: TENANT }),
    });
  });

  it('findById includes tenantId in where', async () => {
    vi.mocked(prisma.jobOrder.findFirst).mockResolvedValue(null);

    await jobOrderRepository.findById(TENANT, ID);

    expect(prisma.jobOrder.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: ID, tenantId: TENANT },
      }),
    );
  });

  it('update verifies tenant ownership before mutating', async () => {
    vi.mocked(prisma.jobOrder.findFirst).mockResolvedValue(null);

    const result = await jobOrderRepository.update(TENANT, ID, { jobTitle: 'X' });

    expect(result).toBeNull();
    expect(prisma.jobOrder.findFirst).toHaveBeenCalledWith({
      where: { id: ID, tenantId: TENANT },
    });
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('update runs mutation only after tenant-scoped findFirst succeeds', async () => {
    vi.mocked(prisma.jobOrder.findFirst).mockResolvedValue({
      id: ID,
      tenantId: TENANT,
    } as never);
    const updated = { id: ID, jobTitle: 'Updated' };
    vi.mocked(prisma.$transaction).mockImplementation(async (fn: any) =>
      fn({
        jobOrderSkill: { deleteMany: vi.fn(), createMany: vi.fn() },
        jobOrder: { update: vi.fn().mockResolvedValue(updated) },
      }),
    );

    const result = await jobOrderRepository.update(TENANT, ID, { jobTitle: 'Updated' });

    expect(prisma.jobOrder.findFirst).toHaveBeenCalledWith({
      where: { id: ID, tenantId: TENANT },
    });
    expect(prisma.$transaction).toHaveBeenCalled();
    expect(result).toEqual(updated);
  });

  it('delete verifies tenant ownership before deleting', async () => {
    vi.mocked(prisma.jobOrder.findFirst).mockResolvedValue(null);

    const result = await jobOrderRepository.delete(TENANT, ID);

    expect(result).toBeNull();
    expect(prisma.jobOrder.findFirst).toHaveBeenCalledWith({
      where: { id: ID, tenantId: TENANT },
    });
    expect(prisma.jobOrder.delete).not.toHaveBeenCalled();
  });

  it('delete only deletes after tenant-scoped ownership check', async () => {
    const existing = { id: ID, tenantId: TENANT };
    vi.mocked(prisma.jobOrder.findFirst).mockResolvedValue(existing as never);
    vi.mocked(prisma.jobOrder.delete).mockResolvedValue(existing as never);

    const result = await jobOrderRepository.delete(TENANT, ID);

    expect(prisma.jobOrder.findFirst).toHaveBeenCalledWith({
      where: { id: ID, tenantId: TENANT },
    });
    expect(prisma.jobOrder.delete).toHaveBeenCalledWith({ where: { id: ID } });
    expect(result).toEqual(existing);
  });
});
