import { NextRequest } from 'next/server';
import { supabase } from '../lib/supabase';
import { json, requireAdminPassword, handleError } from '../lib/middleware';
import { successResponse, errorResponse } from '@rcb-2.0/shared';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('site_content')
      .select('*')
      .eq('id', 'main')
      .single();

    if (error) {
      return json(errorResponse('DB_ERROR', error.message), 500);
    }

    return json(successResponse(data));
  } catch (err) {
    return handleError(err);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    requireAdminPassword(request);

    const body = await request.json();

    const { data, error } = await supabase
      .from('site_content')
      .update(body)
      .eq('id', 'main')
      .select('*')
      .single();

    if (error) {
      return json(errorResponse('DB_ERROR', error.message), 500);
    }

    return json(successResponse(data, 'Content updated successfully'));
  } catch (err) {
    return handleError(err);
  }
}
