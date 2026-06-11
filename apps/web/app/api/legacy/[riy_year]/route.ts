import { NextRequest } from 'next/server';
import { supabase } from '../../lib/supabase';
import { json, requireAdminPassword, handleError } from '../../lib/middleware';
import {
  UpdateLegacySchema,
  successResponse,
  errorResponse,
  fromZodError,
  type UpdateLegacyInput,
} from '@rcb-2.0/shared';
import { ZodError } from 'zod';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ riy_year: string }> },
) {
  try {
    const { riy_year } = await params;

    const { data, error } = await supabase
      .from('legacy')
      .select('*')
      .eq('riy_year', riy_year)
      .single();

    if (error) {
      return json(
        errorResponse(
          'NOT_FOUND',
          `No legacy record found for ${riy_year}`,
        ),
        404,
      );
    }

    const { data: bodMembers } = await supabase
      .from('bod')
      .select(
        'bod_id, full_name, designation, linkedin_url, instagram_url, gmail, avatar_url',
      )
      .eq('riy_year', riy_year)
      .order('designation');

    return json(
      successResponse({
        ...data,
        bod_members: bodMembers || [],
      }),
    );
  } catch (err) {
    return handleError(err);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ riy_year: string }> },
) {
  try {
    requireAdminPassword(request);
    const { riy_year } = await params;

    const raw = await request.json();
    let body: UpdateLegacyInput;
    try {
      body = UpdateLegacySchema.parse(raw);
    } catch (err) {
      if (err instanceof ZodError) {
        return json(fromZodError(err), 400);
      }
      throw err;
    }

    const { data, error } = await supabase
      .from('legacy')
      .update(body)
      .eq('riy_year', riy_year)
      .select('*')
      .single();

    if (error) {
      return json(errorResponse('DB_ERROR', error.message), 500);
    }

    return json(successResponse(data, 'Legacy record updated successfully'));
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ riy_year: string }> },
) {
  try {
    requireAdminPassword(request);
    const { riy_year } = await params;

    const { error } = await supabase
      .from('legacy')
      .delete()
      .eq('riy_year', riy_year);

    if (error) {
      return json(errorResponse('DB_ERROR', error.message), 500);
    }

    return json(
      successResponse(
        null,
        `Legacy record for ${riy_year} deleted successfully`,
      ),
    );
  } catch (err) {
    return handleError(err);
  }
}
