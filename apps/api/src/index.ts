import express   from 'express';
import cors      from 'cors';
import dotenv    from 'dotenv';
import { Request, Response, NextFunction } from 'express';

dotenv.config({ path: '../../.env' });

import { authRoutes }      from './routes/auth';
import { memberRoutes }    from './routes/members';

import { businessRoutes }  from './routes/businesses';
import { professionRoutes } from './routes/professions';
import { bodRoutes }       from './routes/bod';
import { eventRoutes }     from './routes/events';
import { fomoRoutes }      from './routes/fomo';
import { legacyRoutes }    from './routes/legacy';
import { errorResponse, fromZodError, AppError } from '@rcb-2.0/shared';
import { ZodError } from 'zod';
import { adminRoutes } from './routes/admin';
import { visibilityRoutes } from './routes/visibility';

const app  = express();
const PORT = process.env.API_PORT || 4000;

app.use(cors({ origin: process.env.WEB_URL || 'http://localhost:3000' }));
app.use(express.json());

// ── routes ────────────────────────────────────────────────────
app.use('/auth',             authRoutes);
app.use('/api/members',      memberRoutes);
app.use('/admin',            adminRoutes);
app.use('/api/businesses',   businessRoutes);
app.use('/api/professions',  professionRoutes);
app.use('/api/bod',          bodRoutes);
app.use('/api/events',       eventRoutes);
app.use('/api/fomo',         fomoRoutes);
app.use('/api/legacy',       legacyRoutes);
app.use('/api/visibility', visibilityRoutes)

// ── health check ──────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

// ── global error handler ──────────────────────────────────────
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof ZodError) {
    return res.status(400).json(fromZodError(err));
  }
  if (err instanceof AppError) {
    return res.status(err.status).json(
      errorResponse(err.code, err.message)
    );
  }
  console.error('Unhandled error:', err);
  res.status(500).json(
    errorResponse('INTERNAL_ERROR', 'Something went wrong')
  );
});

app.listen(PORT, () => {
  console.log(`\n🚀 RCB API running → http://localhost:${PORT}\n`);
});