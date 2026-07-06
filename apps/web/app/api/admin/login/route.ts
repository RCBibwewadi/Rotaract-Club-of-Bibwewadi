import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import { json, handleError } from '../../lib/middleware';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const JWT_SECRET = process.env.JWT_SECRET!;
const ADMIN_TOKEN_EXPIRY = '24h';

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();

    if (!password || password !== ADMIN_PASSWORD) {
      return json({ error: 'Invalid admin password' }, 401);
    }

    const token = jwt.sign({ role: 'admin' }, JWT_SECRET, {
      expiresIn: ADMIN_TOKEN_EXPIRY,
    });

    return json({ token });
  } catch (err) {
    return handleError(err);
  }
}
