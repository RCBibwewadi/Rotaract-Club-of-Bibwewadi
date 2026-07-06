import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import { verifyToken, type JWTPayload } from './auth';
import { errorResponse } from '@rcb-2.0/shared';

const JWT_SECRET = process.env.JWT_SECRET!;

export function json(data: unknown, status = 200) {
  return Response.json(data, { status });
}

export function authenticate(request: NextRequest): JWTPayload {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    throw new AuthError(401, 'Invalid authorization header');
  }

  try {
    return verifyToken(authHeader.slice(7));
  } catch {
    throw new AuthError(401, 'Invalid or expired token');
  }
}

export function requireApproved(user: JWTPayload): void {
  if (!user.is_approved) {
    throw new AuthError(403, 'Account pending admin approval');
  }
}

export function requireAdminPassword(request: NextRequest): void {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    throw new AuthError(401, 'Missing admin token');
  }

  try {
    const decoded = jwt.verify(authHeader.slice(7), JWT_SECRET) as { role: string };
    if (decoded.role !== 'admin') {
      throw new AuthError(403, 'Not an admin token');
    }
  } catch (err) {
    if (err instanceof AuthError) throw err;
    throw new AuthError(401, 'Invalid or expired admin token');
  }
}

export class AuthError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export function handleError(err: unknown) {
  if (err instanceof AuthError) {
    return json(errorResponse('AUTH_ERROR', err.message), err.status);
  }
  console.error('Unhandled error:', err);
  return json(errorResponse('INTERNAL_ERROR', 'Something went wrong'), 500);
}

export function parseAndValidate<T>(schema: { parse: (data: unknown) => T }, data: unknown): T {
  return schema.parse(data);
}
