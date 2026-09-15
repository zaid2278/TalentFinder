import type { Role } from '@prisma/client';

declare global {
  namespace Express {
    interface UserPayload {
      id: string;
      username: string;
      role: Role;
      tenantId: string | null;
    }

    interface Request {
      user?: UserPayload;
    }
  }
}

export {};
