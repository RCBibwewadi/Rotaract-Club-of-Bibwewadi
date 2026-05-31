import { Router } from 'express';
import { supabase } from '../lib/supabase';
import { authenticate, requireApproved } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import { successResponse, errorResponse } from '@rcb-2.0/shared';
import { z } from 'zod';

export const visibilityRoutes: Router = Router();

visibilityRoutes.use(authenticate, requireApproved);

const UpdateVisibilitySchema = z.object({
  show_business_name: z.boolean().optional(),
  show_contact:       z.boolean().optional(),
  show_profession:    z.boolean().optional(),
  open_to_collab:     z.boolean().optional(),
});

export type UpdateVisibilityInput = z.infer<typeof UpdateVisibilitySchema>;

// ── GET /api/visibility/me ────────────────────────────────────
// get own visibility settings
visibilityRoutes.get('/me', async (_req, res) => {
  const { member_id } = res.locals.user;

  const { data, error } = await supabase
    .from('member_visibility')
    .select('*')
    .eq('member_id', member_id)
    .single();

  if (error) {
    return res.status(404).json(
      errorResponse('NOT_FOUND', 'Visibility settings not found')
    );
  }

  res.json(successResponse(data));
});

// ── PATCH /api/visibility/me ──────────────────────────────────
// update own visibility settings — only the fields sent are updated
visibilityRoutes.patch('/me', validate(UpdateVisibilitySchema), async (req, res) => {
  const { member_id } = res.locals.user;
  const body = req.body as UpdateVisibilityInput;

  const { data, error } = await supabase
    .from('member_visibility')
    .update(body)
    .eq('member_id', member_id)
    .select('*')
    .single();

  if (error) {
    return res.status(500).json(
      errorResponse('DB_ERROR', error.message)
    );
  }

  res.json(successResponse(data, 'Visibility settings updated'));
});