import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
import prisma from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';

const JWT_EXPIRY = '8h';

function jwtSecret(): string {
  const secret = process.env.JWT_SECRET?.trim();
  if (!secret) {
    throw new Error('JWT_SECRET is not configured');
  }
  return secret;
}

export type AuthUser = {
  id: string;
  username: string;
  role: Role;
  tenantId: string | null;
  name: string;
};

export const authService = {
  async login(username: string, password: string): Promise<{ token: string; user: AuthUser }> {
    const recruiter = await prisma.recruiter.findUnique({ where: { username } });
    if (!recruiter) {
      throw new AppError('Invalid username or password', 401);
    }

    const valid = await bcrypt.compare(password, recruiter.passwordHash);
    if (!valid) {
      throw new AppError('Invalid username or password', 401);
    }

    const payload = {
      id: recruiter.id,
      username: recruiter.username,
      role: recruiter.role,
      tenantId: recruiter.tenantId,
    };

    const token = jwt.sign(payload, jwtSecret(), { expiresIn: JWT_EXPIRY });

    return {
      token,
      user: {
        ...payload,
        name: recruiter.name,
      },
    };
  },

  async createRecruiter(input: {
    name: string;
    username: string;
    password: string;
    tenantId: string;
  }) {
    const passwordHash = await bcrypt.hash(input.password, 10);
    const email = `${input.username}@recruiter.local`;

    try {
      return await prisma.recruiter.create({
        data: {
          name: input.name,
          username: input.username,
          email,
          passwordHash,
          role: Role.RECRUITER,
          tenantId: input.tenantId,
        },
        select: {
          id: true,
          name: true,
          username: true,
          role: true,
          tenantId: true,
        },
      });
    } catch (err: unknown) {
      if (typeof err === 'object' && err && 'code' in err && (err as { code: string }).code === 'P2002') {
        throw new AppError('Username or email already exists', 400);
      }
      throw err;
    }
  },

  async listRecruiters() {
    return prisma.recruiter.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
        tenantId: true,
      },
    });
  },
};
