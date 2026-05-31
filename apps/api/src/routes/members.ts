import { Router } from 'express';
import { supabase } from '../lib/supabase';
import { authenticate, requireApproved } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import {
  UpdateMemberSchema,
  successResponse,
  errorResponse,
  type UpdateMemberInput,
} from '@rcb-2.0/shared';

export const memberRoutes: Router = Router();

memberRoutes.use(authenticate, requireApproved);

// ── GET /api/members ──────────────────────────────────────────
memberRoutes.get('/', async (_req, res) => {
  const { data, error } = await supabase
    .from('members')
    .select(`
      member_id,
      full_name,
      avatar_url,
      member_type,
      years_in_rcb,
      businesses (*),
      professions (*),
      member_visibility (*)
    `)
    .eq('is_active', true)
    .eq('is_approved', true)
    .order('full_name');

  if (error) {
    return res.status(500).json(
      errorResponse('DB_ERROR', error.message)
    );
  }

  res.json(successResponse(data));
});

// ── GET /api/members/me ───────────────────────────────────────
memberRoutes.get('/me', async (_req, res) => {
  const { member_id } = res.locals.user;

  const { data, error } = await supabase
    .from('members')
    .select(`
      member_id,
      full_name,
      email,
      phone,
      username,
      avatar_url,
      member_type,
      years_in_rcb,
      interests,
      rid,
      dob,
      businesses (*),
      professions (*),
      member_visibility (*)
    `)
    .eq('member_id', member_id)
    .single();

  if (error) {
    return res.status(404).json(
      errorResponse('NOT_FOUND', 'Member not found')
    );
  }

  res.json(successResponse(data));
});

// ── GET /api/members/:id ──────────────────────────────────────
memberRoutes.get('/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('members')
    .select(`
      member_id,
      full_name,
      avatar_url,
      member_type,
      years_in_rcb,
      interests,
      businesses (*),
      professions (*),
      member_visibility (*)
    `)
    .eq('member_id', req.params.id)
    .eq('is_active', true)
    .eq('is_approved', true)
    .single();

  if (error) {
    return res.status(404).json(
      errorResponse('NOT_FOUND', 'Member not found')
    );
  }

  res.json(successResponse(data));
});

// ── PATCH /api/members/me ─────────────────────────────────────
memberRoutes.patch('/me', validate(UpdateMemberSchema), async (req, res) => {
  const { member_id } = res.locals.user;
  const body = req.body as UpdateMemberInput;

  const { data, error } = await supabase
    .from('members')
    .update(body)
    .eq('member_id', member_id)
    .select(`
      member_id,
      full_name,
      email,
      phone,
      avatar_url,
      member_type,
      years_in_rcb,
      interests
    `)
    .single();

  if (error) {
    return res.status(500).json(
      errorResponse('DB_ERROR', error.message)
    );
  }

  res.json(successResponse(data, 'Profile updated successfully'));
});