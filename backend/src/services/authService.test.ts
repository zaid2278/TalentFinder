import { beforeEach, describe, expect, it, vi } from 'vitest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
import { AppError } from '../middleware/errorHandler.js';

vi.mock('../lib/prisma.js', () => ({
  default: {
    recruiter: {
      findUnique: vi.fn(),
    },
  },
}));

import prisma from '../lib/prisma.js';
import { authService } from '../services/authService.js';

const SECRET = 'test-jwt-secret-for-unit-tests';

describe('authService.login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.JWT_SECRET = SECRET;
  });

  it('returns a signed token for a correct username and password', async () => {
    const passwordHash = await bcrypt.hash('password123', 4);
    vi.mocked(prisma.recruiter.findUnique).mockResolvedValue({
      id: 'u1',
      username: 'admin',
      name: 'Admin',
      role: Role.ADMIN,
      tenantId: null,
      email: 'admin@test.local',
      passwordHash,
      createdAt: new Date(),
    });

    const result = await authService.login('admin', 'password123');

    expect(result.user).toMatchObject({
      id: 'u1',
      username: 'admin',
      role: Role.ADMIN,
      tenantId: null,
      name: 'Admin',
    });
    const decoded = jwt.verify(result.token, SECRET) as jwt.JwtPayload;
    expect(decoded).toMatchObject({
      id: 'u1',
      username: 'admin',
      role: Role.ADMIN,
    });
  });

  it('rejects an incorrect password', async () => {
    const passwordHash = await bcrypt.hash('password123', 4);
    vi.mocked(prisma.recruiter.findUnique).mockResolvedValue({
      id: 'u1',
      username: 'admin',
      name: 'Admin',
      role: Role.ADMIN,
      tenantId: null,
      email: 'admin@test.local',
      passwordHash,
      createdAt: new Date(),
    });

    await expect(authService.login('admin', 'wrong')).rejects.toMatchObject({
      message: 'Invalid username or password',
      statusCode: 401,
    });
  });

  it('rejects an unknown username with the same error as a bad password', async () => {
    vi.mocked(prisma.recruiter.findUnique).mockResolvedValue(null);

    const unknown = authService.login('nobody', 'password123');
    await expect(unknown).rejects.toBeInstanceOf(AppError);
    await expect(unknown).rejects.toMatchObject({
      message: 'Invalid username or password',
      statusCode: 401,
    });

    const passwordHash = await bcrypt.hash('password123', 4);
    vi.mocked(prisma.recruiter.findUnique).mockResolvedValue({
      id: 'u1',
      username: 'admin',
      name: 'Admin',
      role: Role.ADMIN,
      tenantId: null,
      email: 'admin@test.local',
      passwordHash,
      createdAt: new Date(),
    });

    await expect(authService.login('admin', 'wrong')).rejects.toMatchObject({
      message: 'Invalid username or password',
      statusCode: 401,
    });
  });
});
