import { Router } from 'express';
import { supabase } from '../lib/supabase';
import { authenticate, requireAdmin } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import {
  CreateFomoSchema,
  UpdateFomoSchema,
  successResponse,
  errorResponse,
  type CreateFomoInput,
  type UpdateFomoInput,
} from '@rcb-2.0/shared';

export const fomoRoutes: Router = Router();

// ── GET /api/fomo ─────────────────────────────────────────────
// public — all fomo posts across all events
fomoRoutes.get('/', async (_req, res) => {
  const { data, error } = await supabase
    .from('fomo')
    .select(`
      fomo_id,
      category,
      name,
      description,
      images,
      videos,
      event_id,
      events (
        event_id,
        event_name,
        event_date,
        event_avenue
      )
    `)
    .order('category');

  if (error) {
    return res.status(500).json(
      errorResponse('DB_ERROR', error.message)
    );
  }

  res.json(successResponse(data));
});

// ── GET /api/fomo/category/:category ─────────────────────────
// filter by category e.g. /category/service or /category/fun
fomoRoutes.get('/category/:category', async (req, res) => {
  const { data, error } = await supabase
    .from('fomo')
    .select(`
      fomo_id,
      category,
      name,
      description,
      images,
      videos,
      events (
        event_id,
        event_name,
        event_date
      )
    `)
    .eq('category', req.params.category)
    .order('name');

  if (error) {
    return res.status(500).json(
      errorResponse('DB_ERROR', error.message)
    );
  }

  res.json(successResponse(data));
});

// ── GET /api/fomo/:id ─────────────────────────────────────────
fomoRoutes.get('/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('fomo')
    .select(`
      *,
      events (
        event_id,
        event_name,
        event_date,
        event_place,
        event_avenue
      )
    `)
    .eq('fomo_id', req.params.id)
    .single();

  if (error) {
    return res.status(404).json(
      errorResponse('NOT_FOUND', 'FOMO post not found')
    );
  }

  res.json(successResponse(data));
});

// ── POST /api/fomo ────────────────────────────────────────────
// admin only
fomoRoutes.post(
  '/',
  authenticate,
  requireAdmin,
  validate(CreateFomoSchema),
  async (req, res) => {
    const body = req.body as CreateFomoInput;

    // if event_id provided verify event exists
    if (body.event_id) {
      const { data: event } = await supabase
        .from('events')
        .select('event_id')
        .eq('event_id', body.event_id)
        .single();

      if (!event) {
        return res.status(404).json(
          errorResponse('NOT_FOUND', 'Event not found')
        );
      }
    }

    const { data, error } = await supabase
      .from('fomo')
      .insert(body)
      .select('*')
      .single();

    if (error) {
      return res.status(500).json(
        errorResponse('DB_ERROR', error.message)
      );
    }

    res.status(201).json(
      successResponse(data, 'FOMO post created successfully')
    );
  }
);

// ── PATCH /api/fomo/:id ───────────────────────────────────────
fomoRoutes.patch(
  '/:id',
  authenticate,
  requireAdmin,
  validate(UpdateFomoSchema),
  async (req, res) => {
    const body = req.body as UpdateFomoInput;

    // if event_id is being updated verify new event exists
    if (body.event_id) {
      const { data: event } = await supabase
        .from('events')
        .select('event_id')
        .eq('event_id', body.event_id)
        .single();

      if (!event) {
        return res.status(404).json(
          errorResponse('NOT_FOUND', 'Event not found')
        );
      }
    }

    const { data, error } = await supabase
      .from('fomo')
      .update(body)
      .eq('fomo_id', req.params.id)
      .select('*')
      .single();

    if (error) {
      return res.status(500).json(
        errorResponse('DB_ERROR', error.message)
      );
    }

    res.json(successResponse(data, 'FOMO post updated successfully'));
  }
);

// ── DELETE /api/fomo/:id ──────────────────────────────────────
fomoRoutes.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  const { error } = await supabase
    .from('fomo')
    .delete()
    .eq('fomo_id', req.params.id);

  if (error) {
    return res.status(500).json(
      errorResponse('DB_ERROR', error.message)
    );
  }

  res.json(successResponse(null, 'FOMO post deleted successfully'));
});