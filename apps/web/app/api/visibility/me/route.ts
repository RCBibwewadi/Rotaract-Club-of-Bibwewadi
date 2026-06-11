import { NextRequest } from 'next/server';
import { supabase } from '../../lib/supabase';
import {
  json,
  authenticate,
  requireApproved,
  handleError,
} from '../../lib/middleware';
import { successResponse, errorResponse, fromZodError } from '@rcb-2.0/shared';
import { z, ZodError } from 'zod';

const UpdateVisibilitySchema = z.object({
  show_business_name: z.boolean().optional(),
  show_contact: z.boolean().optional(),
  show_profession: z.boolean().optional(),
  open_to_collab: z.boolean().optional(),
});

type UpdateVisibilityInput = z.infer<typeof UpdateVisibilitySchema>;

export async function GET(request: NextRequest) {
  try {
    const user = authenticate(request);
    requireApproved(user);

    const { data, error } = await supabase
      .from('member_visibility')
      .select('*')
      .eq('member_id', user.member_id)
      .single();

    if (error) {
      return json(
        errorResponse('NOT_FOUND', 'Visibility settings not found'),
        404,
      );
    }

    return json(successResponse(data));
  } catch (err) {
    return handleError(err);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = authenticate(request);
    requireApproved(user);

    const raw = await request.json();
    let body: UpdateVisibilityInput;
    try {
      body = UpdateVisibilitySchema.parse(raw);
    } catch (err) {
      if (err instanceof ZodError) {
        return json(fromZodError(err), 400);
      }
      throw err;
    }

    const { data, error } = await supabase
      .from('member_visibility')
      .update(body)
      .eq('member_id', user.member_id)
      .select('*')
      .single();

    if (error) {
      return json(errorResponse('DB_ERROR', error.message), 500);
    }

    return json(successResponse(data, 'Visibility settings updated'));
  } catch (err) {
    return handleError(err);
  }
}
