import { Router } from 'express';
import { supabase } from '../lib/supabase';
import { requireAdminPassword } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import {
  CreateLegacySchema,
  UpdateLegacySchema,
  successResponse,
  errorResponse,
  type CreateLegacyInput,
  type UpdateLegacyInput,
} from '@rcb-2.0/shared';

export const legacyRoutes: Router = Router();

// ── GET /api/legacy ───────────────────────────────────────────
// public — all legacy years with their BOD, newest first
legacyRoutes.get('/', async (_req, res) => {
  const { data: legacyYears, error } = await supabase
    .from('legacy')
    .select('legacy_id, riy_year, year_video_url')
    .order('riy_year', { ascending: false });

  if (error) {
    return res.status(500).json(errorResponse('DB_ERROR', error.message));
  }

  // Fetch BOD for all legacy years in one query
  const years = (legacyYears || []).map(l => l.riy_year);
  let bodByYear: Record<string, unknown[]> = {};

  if (years.length) {
    const { data: bodData } = await supabase
      .from('bod')
      .select('bod_id, full_name, designation, linkedin_url, instagram_url, gmail, avatar_url, riy_year')
      .in('riy_year', years)
      .order('designation');

    if (bodData) {
      for (const b of bodData) {
        if (!bodByYear[b.riy_year]) bodByYear[b.riy_year] = [];
        bodByYear[b.riy_year].push(b);
      }
    }
  }

  const enriched = (legacyYears || []).map(l => ({
    ...l,
    bod_members: bodByYear[l.riy_year] || [],
  }));

  res.json(successResponse(enriched));
});

// ── GET /api/legacy/:riy_year ─────────────────────────────────
legacyRoutes.get('/:riy_year', async (req, res) => {
  const { data, error } = await supabase
    .from('legacy')
    .select('*')
    .eq('riy_year', req.params.riy_year)
    .single();

  if (error) {
    return res.status(404).json(
      errorResponse('NOT_FOUND', `No legacy record found for ${req.params.riy_year}`)
    );
  }

  // Fetch BOD from bod table for this year
  const { data: bodMembers } = await supabase
    .from('bod')
    .select('bod_id, full_name, designation, linkedin_url, instagram_url, gmail, avatar_url')
    .eq('riy_year', req.params.riy_year)
    .order('designation');

  res.json(
    successResponse({
      ...data,
      bod_members: bodMembers || [],
    })
  );
});

// ── POST /api/legacy ──────────────────────────────────────────
legacyRoutes.post(
  '/',
  requireAdminPassword,
  validate(CreateLegacySchema),
  async (req, res) => {
    const body = req.body as CreateLegacyInput;

    const { data, error } = await supabase
      .from('legacy')
      .insert(body)
      .select('*')
      .single();

    if (error) {
      if (error.code === '23505') {
        return res.status(409).json(
          errorResponse('DUPLICATE_ENTRY', `Legacy record for ${body.riy_year} already exists`)
        );
      }
      return res.status(500).json(errorResponse('DB_ERROR', error.message));
    }

    res.status(201).json(
      successResponse(data, `Legacy record for ${body.riy_year} created successfully`)
    );
  }
);

// ── PATCH /api/legacy/:riy_year ───────────────────────────────
legacyRoutes.patch(
  '/:riy_year',
  requireAdminPassword,
  validate(UpdateLegacySchema),
  async (req, res) => {
    const body = req.body as UpdateLegacyInput;

    const { data, error } = await supabase
      .from('legacy')
      .update(body)
      .eq('riy_year', req.params.riy_year)
      .select('*')
      .single();

    if (error) {
      return res.status(500).json(errorResponse('DB_ERROR', error.message));
    }

    res.json(successResponse(data, 'Legacy record updated successfully'));
  }
);

// ── DELETE /api/legacy/:riy_year ──────────────────────────────
legacyRoutes.delete('/:riy_year', requireAdminPassword, async (req, res) => {
  const { error } = await supabase
    .from('legacy')
    .delete()
    .eq('riy_year', req.params.riy_year);

  if (error) {
    return res.status(500).json(errorResponse('DB_ERROR', error.message));
  }

  res.json(
    successResponse(null, `Legacy record for ${req.params.riy_year} deleted successfully`)
  );
});
