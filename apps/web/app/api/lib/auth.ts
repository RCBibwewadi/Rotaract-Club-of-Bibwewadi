import jwt, { type SignOptions } from 'jsonwebtoken';
import bcrypt from 'bcrypt';

export interface JWTPayload {
  member_id: string;
  username: string;
  role: 'member' | 'admin';
  is_approved: boolean;
}

const SECRET = process.env.JWT_SECRET!;
// Tokens do not expire by default — members stay logged in until they log out.
// Set JWT_EXPIRES_IN (e.g. '90d') to put a lifetime back on them.
// Note there is no revocation: nothing re-checks the member per request, so a
// token keeps working even if the member is later blocked or removed.
const EXPIRES_IN = process.env.JWT_EXPIRES_IN as SignOptions['expiresIn'] | undefined;

export const hashPassword = (plain: string) => bcrypt.hash(plain, 12);

export const verifyPassword = (plain: string, hash: string) =>
  bcrypt.compare(plain, hash);

export const signToken = (payload: JWTPayload): string =>
  jwt.sign(payload, SECRET, EXPIRES_IN ? { expiresIn: EXPIRES_IN } : {});

export const verifyToken = (token: string): JWTPayload =>
  jwt.verify(token, SECRET) as JWTPayload;
