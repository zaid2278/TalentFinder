import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../lib/prisma.js', () => ({
  default: {
    candidate: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      count: vi.fn(),
      delete: vi.fn(),
      update: vi.fn(),
    },
    candidateSkill: {
      deleteMany: vi.fn(),
      createMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

import prisma from '../lib/prisma.js';
import { candidateRepository } from '../repositories/candidateRepository.js';

const TENANT = 'tenant-aaa';
const OTHER = 'tenant-bbb';
const ID = 'cand-111';

describe('candidateRepository tenant scoping', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('findMany / list includes tenantId in where', async () => {
    vi.mocked(prisma.candidate.findMany).mockResolvedValue([]);
    vi.mocked(prisma.candidate.count).mockResolvedValue(0);

    await candidateRepository.findMany({
      tenantId: TENANT,
      skip: 0,
      take: 10,
      orderBy: { createdAt: 'desc' },
    });

    expect(prisma.candidate.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ tenantId: TENANT }),
      }),
    );
    expect(prisma.candidate.count).toHaveBeenCalledWith({
      where: expect.objectContaining({ tenantId: TENANT }),
    });
  });

  it('findById includes tenantId in where', async () => {
    vi.mocked(prisma.candidate.findFirst).mockResolvedValue(null);

    await candidateRepository.findById(TENANT, ID);

    expect(prisma.candidate.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: ID, tenantId: TENANT },
      }),
    );
  });

  it('update verifies tenant ownership before mutating', async () => {
    vi.mocked(prisma.candidate.findFirst).mockResolvedValue(null);

    const result = await candidateRepository.update(TENANT, ID, { fullName: 'X' });

    expect(result).toBeNull();
    expect(prisma.candidate.findFirst).toHaveBeenCalledWith({
      where: { id: ID, tenantId: TENANT },
    });
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('update runs mutation only after tenant-scoped findFirst succeeds', async () => {
    vi.mocked(prisma.candidate.findFirst).mockResolvedValue({
      id: ID,
      tenantId: TENANT,
    } as never);
    const updated = { id: ID, fullName: 'Updated' };
    vi.mocked(prisma.$transaction).mockImplementation(async (fn: any) =>
      fn({
        candidateSkill: { deleteMany: vi.fn(), createMany: vi.fn() },
        candidate: { update: vi.fn().mockResolvedValue(updated) },
      }),
    );

    const result = await candidateRepository.update(TENANT, ID, { fullName: 'Updated' });

    expect(prisma.candidate.findFirst).toHaveBeenCalledWith({
      where: { id: ID, tenantId: TENANT },
    });
    expect(prisma.$transaction).toHaveBeenCalled();
    expect(result).toEqual(updated);
  });

  it('delete verifies tenant ownership before deleting', async () => {
    vi.mocked(prisma.candidate.findFirst).mockResolvedValue(null);

    const result = await candidateRepository.delete(OTHER, ID);

    expect(result).toBeNull();
    expect(prisma.candidate.findFirst).toHaveBeenCalledWith({
      where: { id: ID, tenantId: OTHER },
    });
    expect(prisma.candidate.delete).not.toHaveBeenCalled();
  });

  it('delete only deletes after tenant-scoped ownership check', async () => {
    const existing = { id: ID, tenantId: TENANT };
    vi.mocked(prisma.candidate.findFirst).mockResolvedValue(existing as never);
    vi.mocked(prisma.candidate.delete).mockResolvedValue(existing as never);

    const result = await candidateRepository.delete(TENANT, ID);

    expect(prisma.candidate.findFirst).toHaveBeenCalledWith({
      where: { id: ID, tenantId: TENANT },
    });
    expect(prisma.candidate.delete).toHaveBeenCalledWith({ where: { id: ID } });
    expect(result).toEqual(existing);
  });
});
