import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import { json, handleError } from '../../lib/middleware';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const JWT_SECRET = process.env.JWT_SECRET!;
const ADMIN_TOKEN_EXPIRY = '24h';

// The mobile app signs admins in with a username as well as the password. The
// website's admin page still posts the password alone, so the username is only
// checked when one is sent.
const ADMIN_USERNAME = (process.env.ADMIN_USERNAME || 'admin@rcb.com').toLowerCase();

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (username !== undefined && String(username).trim().toLowerCase() !== ADMIN_USERNAME) {
      // Same message as a wrong password, so this cannot be used to probe for
      // the admin username.
      return json({ error: 'Invalid admin credentials' }, 401);
    }

    if (!password || password !== ADMIN_PASSWORD) {
      return json({ error: username !== undefined ? 'Invalid admin credentials' : 'Invalid admin password' }, 401);
    }

    const token = jwt.sign({ role: 'admin' }, JWT_SECRET, {
      expiresIn: ADMIN_TOKEN_EXPIRY,
    });

    return json({ token });
  } catch (err) {
    return handleError(err);
  }
}
