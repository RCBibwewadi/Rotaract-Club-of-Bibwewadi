import { Router } from 'express';
import { supabase } from '../lib/supabase';
import { authenticate, requireApproved } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import {
  CreateProfessionSchema,
  UpdateProfessionSchema,
  successResponse,
  errorResponse,
  type CreateProfessionInput,
  type UpdateProfessionInput,
} from '@rcb-2.0/shared';

export const professionRoutes: Router = Router();

professionRoutes.use(authenticate, requireApproved);

// ── GET /api/professions ──────────────────────────────────────
// all visible professions — for network/directory page
professionRoutes.get('/', async (_req, res) => {
  const { data, error } = await supabase
    .from('professions')
    .select(`
      profession_id,
      profession_type,
      specialisation,
      years_experience,
      employer,
      is_primary,
      members (
        member_id,
        full_name,
        avatar_url
      )
    `)
    .eq('is_visible', true)
    .order('profession_type');

  if (error) {
    return res.status(500).json(
      errorResponse('DB_ERROR', error.message)
    );
  }

  res.json(successResponse(data));
});

// ── GET /api/professions/my ───────────────────────────────────
// logged-in member's own professions (all, including hidden)
professionRoutes.get('/my', async (_req, res) => {
  const { member_id } = res.locals.user;

  const { data, error } = await supabase
    .from('professions')
    .select('*')
    .eq('member_id', member_id)
    .order('is_primary', { ascending: false });
  // primary profession comes first

  if (error) {
    return res.status(500).json(
      errorResponse('DB_ERROR', error.message)
    );
  }

  res.json(successResponse(data));
});

// ── GET /api/professions/:id ──────────────────────────────────
professionRoutes.get('/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('professions')
    .select(`
      profession_id,
      profession_type,
      specialisation,
      years_experience,
      employer,
      is_primary,
      members (
        member_id,
        full_name,
        avatar_url
      )
    `)
    .eq('profession_id', req.params.id)
    .eq('is_visible', true)
    .single();

  if (error) {
    return res.status(404).json(
      errorResponse('NOT_FOUND', 'Profession not found')
    );
  }

  res.json(successResponse(data));
});

// ── POST /api/professions ─────────────────────────────────────
professionRoutes.post('/', validate(CreateProfessionSchema), async (req, res) => {
  const { member_id } = res.locals.user;
  const body = req.body as CreateProfessionInput;

  // if new profession is primary, unset existing primary first
  if (body.is_primary) {
    await supabase
      .from('professions')
      .update({ is_primary: false })
      .eq('member_id', member_id)
      .eq('is_primary', true);
  }

  const { data, error } = await supabase
    .from('professions')
    .insert({
      ...body,
      member_id,
    })
    .select('*')
    .single();

  if (error) {
    return res.status(500).json(
      errorResponse('DB_ERROR', error.message)
    );
  }

  res.status(201).json(
    successResponse(data, 'Profession created successfully')
  );
});

// ── PATCH /api/professions/:id ────────────────────────────────
professionRoutes.patch('/:id', validate(UpdateProfessionSchema), async (req, res) => {
  const { member_id } = res.locals.user;
  const body = req.body as UpdateProfessionInput;

  // verify ownership
  const { data: existing } = await supabase
    .from('professions')
    .select('profession_id')
    .eq('profession_id', req.params.id)
    .eq('member_id', member_id)
    .single();

  if (!existing) {
    return res.status(403).json(
      errorResponse('FORBIDDEN', 'You do not own this profession')
    );
  }

  // if updating to primary, unset existing primary first
  if (body.is_primary) {
    await supabase
      .from('professions')
      .update({ is_primary: false })
      .eq('member_id', member_id)
      .eq('is_primary', true);
  }

  const { data, error } = await supabase
    .from('professions')
    .update(body)
    .eq('profession_id', req.params.id)
    .select('*')
    .single();

  if (error) {
    return res.status(500).json(
      errorResponse('DB_ERROR', error.message)
    );
  }

  res.json(successResponse(data, 'Profession updated successfully'));
});

// ── DELETE /api/professions/:id ───────────────────────────────
professionRoutes.delete('/:id', async (req, res) => {
  const { member_id } = res.locals.user;

  // verify ownership
  const { data: existing } = await supabase
    .from('professions')
    .select('profession_id, is_primary')
    .eq('profession_id', req.params.id)
    .eq('member_id', member_id)
    .single();

  if (!existing) {
    return res.status(403).json(
      errorResponse('FORBIDDEN', 'You do not own this profession')
    );
  }

  const { error } = await supabase
    .from('professions')
    .delete()
    .eq('profession_id', req.params.id);

  if (error) {
    return res.status(500).json(
      errorResponse('DB_ERROR', error.message)
    );
  }

  // if deleted profession was primary, auto-promote the first remaining one
  if (existing.is_primary) {
    const { data: next } = await supabase
      .from('professions')
      .select('profession_id')
      .eq('member_id', member_id)
      .limit(1)
      .single();

    if (next) {
      await supabase
        .from('professions')
        .update({ is_primary: true })
        .eq('profession_id', next.profession_id);
    }
  }

  res.json(successResponse(null, 'Profession deleted successfully'));
});