import { Router } from 'express';
import { supabase } from '../lib/supabase';
import { authenticate, requireAdmin } from '../middleware/authenticate';
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
// public — all legacy years, newest first
legacyRoutes.get('/', async (_req, res) => {
  const { data, error } = await supabase
    .from('legacy')
    .select(`
      legacy_id,
      riy_year,
      year_video_url,
      bod_member_ids
    `)
    .order('riy_year', { ascending: false });

  if (error) {
    return res.status(500).json(
      errorResponse('DB_ERROR', error.message)
    );
  }

  res.json(successResponse(data));
});

// ── GET /api/legacy/:riy_year ─────────────────────────────────
// get a specific year e.g. /api/legacy/2024-25
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

  // bod_member_ids is a jsonb snapshot array of uuids
  // fetch the actual member details to enrich the response
  let bod_members = null;
  if (data.bod_member_ids?.length) {
    const { data: members } = await supabase
      .from('members')
      .select('member_id, full_name, avatar_url')
      .in('member_id', data.bod_member_ids);

    bod_members = members;
  }

  res.json(
    successResponse({
      ...data,
      bod_members, // enriched member details alongside the raw id snapshot
    })
  );
});

// ── POST /api/legacy ──────────────────────────────────────────
// admin only
legacyRoutes.post(
  '/',
  authenticate,
  requireAdmin,
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
      return res.status(500).json(
        errorResponse('DB_ERROR', error.message)
      );
    }

    res.status(201).json(
      successResponse(data, `Legacy record for ${body.riy_year} created successfully`)
    );
  }
);

// ── PATCH /api/legacy/:riy_year ───────────────────────────────
// update by riy_year — more intuitive than by id for legacy records
legacyRoutes.patch(
  '/:riy_year',
  authenticate,
  requireAdmin,
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
      return res.status(500).json(
        errorResponse('DB_ERROR', error.message)
      );
    }

    res.json(successResponse(data, 'Legacy record updated successfully'));
  }
);

// ── DELETE /api/legacy/:riy_year ──────────────────────────────
legacyRoutes.delete('/:riy_year', authenticate, requireAdmin, async (req, res) => {
  const { error } = await supabase
    .from('legacy')
    .delete()
    .eq('riy_year', req.params.riy_year);

  if (error) {
    return res.status(500).json(
      errorResponse('DB_ERROR', error.message)
    );
  }

  res.json(
    successResponse(null, `Legacy record for ${req.params.riy_year} deleted successfully`)
  );
});