import { Router } from 'express';
import { supabase } from '../lib/supabase';
import { requireAdminPassword } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import {
  CreateEventSchema,
  UpdateEventSchema,
  successResponse,
  errorResponse,
  type CreateEventInput,
  type UpdateEventInput,
} from '@rcb-2.0/shared';

export const eventRoutes: Router = Router();

// ── GET /api/events ───────────────────────────────────────────
// public — shown on public website
eventRoutes.get('/', async (_req, res) => {
  const { data, error } = await supabase
    .from('events')
    .select(`
      event_id,
      event_name,
      event_date,
      event_time,
      event_place,
      event_strength,
      open_to_all,
      event_avenue,
      event_description,
      event_images,
      event_videos,
      event_best_member,
      members!event_lead_id (
        member_id,
        full_name,
        avatar_url
      ),
      best_member:members!event_best_member (
        member_id,
        full_name,
        avatar_url
      ),
      fomo (
        fomo_id,
        category,
        name,
        images,
        videos
      )
    `)
    .order('event_date', { ascending: false });

  if (error) {
    return res.status(500).json(
      errorResponse('DB_ERROR', error.message)
    );
  }

  res.json(successResponse(data));
});

// ── GET /api/events/upcoming ──────────────────────────────────
eventRoutes.get('/upcoming', async (_req, res) => {
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('events')
    .select(`
      event_id,
      event_name,
      event_date,
      event_time,
      event_place,
      open_to_all,
      event_avenue,
      event_description,
      event_images,
      event_best_member,
      members!event_lead_id (
        member_id,
        full_name,
        avatar_url
      ),
      best_member:members!event_best_member (
        member_id,
        full_name,
        avatar_url
      )
    `)
    .gte('event_date', today)
    .order('event_date', { ascending: true });

  if (error) {
    return res.status(500).json(
      errorResponse('DB_ERROR', error.message)
    );
  }

  res.json(successResponse(data));
});

// ── GET /api/events/past ──────────────────────────────────────
eventRoutes.get('/past', async (_req, res) => {
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('events')
    .select(`
      event_id,
      event_name,
      event_date,
      event_place,
      event_strength,
      event_avenue,
      event_images,
      event_best_member,
      members!event_lead_id (
        member_id,
        full_name,
        avatar_url
      ),
      best_member:members!event_best_member (
        member_id,
        full_name,
        avatar_url
      ),
      fomo (
        fomo_id,
        category,
        images
      )
    `)
    .lt('event_date', today)
    .order('event_date', { ascending: false });

  if (error) {
    return res.status(500).json(
      errorResponse('DB_ERROR', error.message)
    );
  }

  res.json(successResponse(data));
});

// ── GET /api/events/:id ───────────────────────────────────────
eventRoutes.get('/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('events')
    .select(`
      *,
      members!event_lead_id (
        member_id,
        full_name,
        avatar_url
      ),
      best_member:members!event_best_member (
        member_id,
        full_name,
        avatar_url
      ),
      fomo (*)
    `)
    .eq('event_id', req.params.id)
    .single();

  if (error) {
    return res.status(404).json(
      errorResponse('NOT_FOUND', 'Event not found')
    );
  }

  res.json(successResponse(data));
});

// ── POST /api/events ──────────────────────────────────────────
// admin only — only admin creates events
eventRoutes.post('/', requireAdminPassword,validate(CreateEventSchema), async (req, res) => {
  const body = req.body as CreateEventInput;

  const { data, error } = await supabase
    .from('events')
    .insert(body)
    .select('*')
    .single();

  if (error) {
    return res.status(500).json(
      errorResponse('DB_ERROR', error.message)
    );
  }

  res.status(201).json(
    successResponse(data, 'Event created successfully')
  );
});

// ── PATCH /api/events/:id ─────────────────────────────────────
eventRoutes.patch('/:id', requireAdminPassword,validate(UpdateEventSchema), async (req, res) => {
  const body = req.body as UpdateEventInput;

  const { data, error } = await supabase
    .from('events')
    .update(body)
    .eq('event_id', req.params.id)
    .select('*')
    .single();

  if (error) {
    return res.status(500).json(
      errorResponse('DB_ERROR', error.message)
    );
  }

  res.json(successResponse(data, 'Event updated successfully'));
});

// ── PATCH /api/events/:id/best-member ────────────────────────
// award best member after event concludes
eventRoutes.patch('/:id/best-member', requireAdminPassword,async (req, res) => {
  const { member_id } = req.body;

  if (!member_id) {
    return res.status(400).json(
      errorResponse('VALIDATION_ERROR', 'member_id is required')
    );
  }

  const { data, error } = await supabase
    .from('events')
    .update({ event_best_member: member_id })
    .eq('event_id', req.params.id)
    .select(`
      event_id,
      event_name,
      best_member:members!event_best_member (
        member_id,
        full_name,
        avatar_url
      )
    `)
    .single();

  if (error) {
    return res.status(500).json(
      errorResponse('DB_ERROR', error.message)
    );
  }

  res.json(successResponse(data, 'Best member awarded successfully'));
});

// ── DELETE /api/events/:id ────────────────────────────────────
eventRoutes.delete('/:id', requireAdminPassword,async (req, res) => {
  const { error } = await supabase
    .from('events')
    .delete()
    .eq('event_id', req.params.id);

  if (error) {
    return res.status(500).json(
      errorResponse('DB_ERROR', error.message)
    );
  }

  res.json(successResponse(null, 'Event deleted successfully'));
});

// ── GET /api/events/:id/fomo ──────────────────────────────────
// get all fomo posts for a specific event
eventRoutes.get('/:id/fomo', async (req, res) => {
  const { data, error } = await supabase
    .from('fomo')
    .select('*')
    .eq('event_id', req.params.id)
    .order('category');

  if (error) {
    return res.status(500).json(
      errorResponse('DB_ERROR', error.message)
    );
  }

  res.json(successResponse(data));
});