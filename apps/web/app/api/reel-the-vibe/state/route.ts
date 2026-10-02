import { NextRequest } from 'next/server';
import { supabaseAdmin } from '../../lib/supabase';
import { json, handleError } from '../../lib/middleware';
import { successResponse, errorResponse } from '@rcb-2.0/shared';

// Phases: registration | stimulated | revealed | voting
// Public endpoint — anyone can read current phase

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('reel_config')
      .select('*')
      .eq('key', 'phase')
      .maybeSingle();

    if (error) return json(errorResponse('DB_ERROR', error.message), 500);

    return json(successResponse({
      phase: data?.value || 'registration',
    }));
  } catch (err) {
    return handleError(err);
  }
}
