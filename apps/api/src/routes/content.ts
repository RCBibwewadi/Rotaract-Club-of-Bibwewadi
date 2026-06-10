import { Router } from 'express';
import { supabase } from '../lib/supabase';
import { requireAdminPassword } from '../middleware/authenticate';
import { successResponse, errorResponse } from '@rcb-2.0/shared';

export const contentRoutes: Router = Router();

// ── GET /api/content ── public, returns site content ──────────
contentRoutes.get('/', async (_req, res) => {
  const { data, error } = await supabase
    .from('site_content')
    .select('*')
    .eq('id', 'main')
    .single();

  if (error) {
    return res.status(500).json(errorResponse('DB_ERROR', error.message));
  }

  res.json(successResponse(data));
});

// ── PATCH /api/content ── admin only, update site content ─────
contentRoutes.patch('/', requireAdminPassword, async (req, res) => {
  const body = req.body;

  const { data, error } = await supabase
    .from('site_content')
    .update(body)
    .eq('id', 'main')
    .select('*')
    .single();

  if (error) {
    return res.status(500).json(errorResponse('DB_ERROR', error.message));
  }

  res.json(successResponse(data, 'Content updated successfully'));
});
