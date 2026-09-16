import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../repositories/jobOrderRepository.js', () => ({
  jobOrderRepository: {
    findById: vi.fn(),
  },
}));

vi.mock('../repositories/candidateRepository.js', () => ({
  candidateRepository: {
    findById: vi.fn(),
  },
}));

vi.mock('../repositories/submissionRepository.js', () => ({
  submissionRepository: {
    findByJobAndCandidate: vi.fn(),
    create: vi.fn(),
  },
}));

vi.mock('../repositories/skillRepository.js', () => ({
  skillRepository: {
    findByIds: vi.fn(),
  },
}));

import { jobOrderRepository } from '../repositories/jobOrderRepository.js';
import { candidateRepository } from '../repositories/candidateRepository.js';
import { submissionRepository } from '../repositories/submissionRepository.js';
import { jobOrderService } from '../services/jobOrderService.js';

const TENANT = '11111111-1111-1111-1111-111111111111';
const JOB = '22222222-2222-2222-2222-222222222222';
const CAND = '33333333-3333-3333-3333-333333333333';

describe('shortlist idempotency', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(jobOrderRepository.findById).mockResolvedValue({ id: JOB } as never);
    vi.mocked(candidateRepository.findById).mockResolvedValue({ id: CAND } as never);
  });

  it('returns the existing submission on a second shortlist instead of inserting again', async () => {
    const existing = {
      id: 'sub-1',
      tenantId: TENANT,
      jobOrderId: JOB,
      candidateId: CAND,
      status: 'Shortlisted',
    };

    vi.mocked(submissionRepository.findByJobAndCandidate).mockResolvedValue(existing as never);

    const first = await jobOrderService.shortlist(TENANT, JOB, { candidateId: CAND });
    const second = await jobOrderService.shortlist(TENANT, JOB, { candidateId: CAND });

    expect(first).toEqual(existing);
    expect(second).toEqual(existing);
    expect(submissionRepository.create).not.toHaveBeenCalled();
    expect(submissionRepository.findByJobAndCandidate).toHaveBeenCalledTimes(2);
    expect(submissionRepository.findByJobAndCandidate).toHaveBeenCalledWith(TENANT, JOB, CAND);
  });

  it('creates a submission only when none exists yet', async () => {
    const created = {
      id: 'sub-new',
      tenantId: TENANT,
      jobOrderId: JOB,
      candidateId: CAND,
      status: 'Shortlisted',
    };

    vi.mocked(submissionRepository.findByJobAndCandidate).mockResolvedValue(null);
    vi.mocked(submissionRepository.create).mockResolvedValue(created as never);

    const result = await jobOrderService.shortlist(TENANT, JOB, { candidateId: CAND });

    expect(result).toEqual(created);
    expect(submissionRepository.create).toHaveBeenCalledTimes(1);
    expect(submissionRepository.create).toHaveBeenCalledWith(TENANT, JOB, CAND);
  });
});
