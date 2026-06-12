import { NextRequest } from 'next/server';
import { supabase } from '../lib/supabase';
import { json, requireAdminPassword, handleError } from '../lib/middleware';
import {
  CreateBodSchema,
  successResponse,
  errorResponse,
  fromZodError,
  type CreateBodInput,
} from '@rcb-2.0/shared';
import { ZodError } from 'zod';

const BOD_SELECT = `
  bod_id,
  full_name,
  designation,
  linkedin_url,
  instagram_url,
  gmail,
  avatar_url,
  description,
  riy_year,
  is_current,
  sort_order
`;

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('bod')
      .select(BOD_SELECT)
      .order('riy_year', { ascending: false })
      .order('sort_order', { ascending: true });

    if (error) {
      return json(errorResponse('DB_ERROR', error.message), 500);
    }

    return json(successResponse(data));
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    requireAdminPassword(request);

    const raw = await request.json();
    let body: CreateBodInput;
    try {
      body = CreateBodSchema.parse(raw);
    } catch (err) {
      if (err instanceof ZodError) {
        return json(fromZodError(err), 400);
      }
      throw err;
    }

    const { data, error } = await supabase
      .from('bod')
      .insert(body)
      .select('*')
      .single();

    if (error) {
      if (error.code === '23505') {
        return json(
          errorResponse(
            'DUPLICATE_ENTRY',
            'This member already has a BOD post for this Rotary year',
          ),
          409,
        );
      }
      return json(errorResponse('DB_ERROR', error.message), 500);
    }

    return json(successResponse(data, 'BOD member added successfully'), 201);
  } catch (err) {
    return handleError(err);
  }
}
