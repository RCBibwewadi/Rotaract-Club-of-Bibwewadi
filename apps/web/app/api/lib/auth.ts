import jwt, { type SignOptions } from 'jsonwebtoken';
import bcrypt from 'bcrypt';

export interface JWTPayload {
  member_id: string;
  username: string;
  role: 'member' | 'admin';
  is_approved: boolean;
}

const SECRET = process.env.JWT_SECRET!;
const EXPIRES_IN = (process.env.JWT_EXPIRES_IN || '7d') as SignOptions['expiresIn'];

export const hashPassword = (plain: string) => bcrypt.hash(plain, 12);

export const verifyPassword = (plain: string, hash: string) =>
  bcrypt.compare(plain, hash);

export const signToken = (payload: JWTPayload): string =>
  jwt.sign(payload, SECRET, { expiresIn: EXPIRES_IN });

export const verifyToken = (token: string): JWTPayload =>
  jwt.verify(token, SECRET) as JWTPayload;
