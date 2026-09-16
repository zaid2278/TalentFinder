import { beforeEach, describe, expect, it, vi } from 'vitest';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
import type { NextFunction, Request, Response } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { requireAdmin } from '../middleware/requireAdmin.js';
import { AppError } from '../middleware/errorHandler.js';

const SECRET = 'test-jwt-secret-for-middleware';

function mockRes() {
  return {} as Response;
}

describe('authenticate middleware', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = SECRET;
  });

  it('attaches req.user and calls next for a valid token', () => {
    const token = jwt.sign(
      { id: 'u1', username: 'admin', role: Role.ADMIN, tenantId: null },
      SECRET,
      { expiresIn: '1h' },
    );
    const req = {
      headers: { authorization: `Bearer ${token}` },
    } as Request;
    const next = vi.fn() as NextFunction;

    authenticate(req, mockRes(), next);

    expect(req.user).toEqual({
      id: 'u1',
      username: 'admin',
      role: Role.ADMIN,
      tenantId: null,
    });
    expect(next).toHaveBeenCalledWith();
  });

  it('returns 401 via next(AppError) when Authorization is missing', () => {
    const req = { headers: {} } as Request;
    const next = vi.fn() as NextFunction;

    authenticate(req, mockRes(), next);

    expect(req.user).toBeUndefined();
    expect(next).toHaveBeenCalledWith(expect.any(AppError));
    const err = (next as ReturnType<typeof vi.fn>).mock.calls[0][0] as AppError;
    expect(err.statusCode).toBe(401);
  });

  it('returns 401 via next(AppError) for an invalid token', () => {
    const req = {
      headers: { authorization: 'Bearer not-a-real-token' },
    } as Request;
    const next = vi.fn() as NextFunction;

    authenticate(req, mockRes(), next);

    expect(req.user).toBeUndefined();
    expect(next).toHaveBeenCalledWith(expect.any(AppError));
    const err = (next as ReturnType<typeof vi.fn>).mock.calls[0][0] as AppError;
    expect(err.statusCode).toBe(401);
  });
});

describe('requireAdmin middleware', () => {
  it('allows ADMIN through', () => {
    const req = { user: { role: Role.ADMIN } } as Request;
    const next = vi.fn() as NextFunction;

    requireAdmin(req, mockRes(), next);

    expect(next).toHaveBeenCalledWith();
  });

  it('rejects RECRUITER with 403', () => {
    const req = { user: { role: Role.RECRUITER } } as Request;
    const next = vi.fn() as NextFunction;

    requireAdmin(req, mockRes(), next);

    expect(next).toHaveBeenCalledWith(expect.any(AppError));
    const err = (next as ReturnType<typeof vi.fn>).mock.calls[0][0] as AppError;
    expect(err.statusCode).toBe(403);
  });
});
