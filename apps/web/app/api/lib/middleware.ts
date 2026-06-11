import { NextRequest } from 'next/server';
import { verifyToken, type JWTPayload } from './auth';
import { errorResponse } from '@rcb-2.0/shared';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'rotaract@2025';

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
  const pw = request.headers.get('x-admin-password');
  if (pw !== ADMIN_PASSWORD) {
    throw new AuthError(401, 'Invalid admin password');
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
