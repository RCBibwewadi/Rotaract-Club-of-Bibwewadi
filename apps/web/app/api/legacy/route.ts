import { NextRequest } from 'next/server';
import { supabase } from '../lib/supabase';
import { json, requireAdminPassword, handleError } from '../lib/middleware';
import {
  CreateLegacySchema,
  successResponse,
  errorResponse,
  fromZodError,
  type CreateLegacyInput,
} from '@rcb-2.0/shared';
import { ZodError } from 'zod';

export async function GET() {
  try {
    const { data: legacyYears, error } = await supabase
      .from('legacy')
      .select('legacy_id, riy_year, year_video_url')
      .order('riy_year', { ascending: false });

    if (error) {
      return json(errorResponse('DB_ERROR', error.message), 500);
    }

    // Also find non-current BOD members whose riy_year has no legacy record
    const { data: prevBod } = await supabase
      .from('bod')
      .select('riy_year')
      .eq('is_current', false);

    const legacyYearSet = new Set((legacyYears || []).map((l) => l.riy_year));
    const extraYears = [...new Set((prevBod || []).map((b) => b.riy_year))]
      .filter((y) => !legacyYearSet.has(y))
      .sort()
      .reverse();

    // Combine legacy records + auto-generated entries for previous BOD years
    const allLegacyYears = [
      ...(legacyYears || []),
      ...extraYears.map((y) => ({ legacy_id: `auto-${y}`, riy_year: y, year_video_url: '' })),
    ].sort((a, b) => b.riy_year.localeCompare(a.riy_year));

    const allYears = allLegacyYears.map((l) => l.riy_year);
    let bodByYear: Record<string, unknown[]> = {};

    if (allYears.length) {
      const { data: bodData } = await supabase
        .from('bod')
        .select(
          'bod_id, full_name, designation, linkedin_url, instagram_url, gmail, avatar_url, riy_year',
        )
        .in('riy_year', allYears)
        .eq('is_current', false)
        .order('designation');

      if (bodData) {
        for (const b of bodData) {
          if (!bodByYear[b.riy_year]) bodByYear[b.riy_year] = [];
          bodByYear[b.riy_year].push(b);
        }
      }
    }

    const enriched = allLegacyYears.map((l) => ({
      ...l,
      bod_members: bodByYear[l.riy_year] || [],
    }));

    return json(successResponse(enriched));
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    requireAdminPassword(request);

    const raw = await request.json();
    let body: CreateLegacyInput;
    try {
      body = CreateLegacySchema.parse(raw);
    } catch (err) {
      if (err instanceof ZodError) {
        return json(fromZodError(err), 400);
      }
      throw err;
    }

    const { data, error } = await supabase
      .from('legacy')
      .insert(body)
      .select('*')
      .single();

    if (error) {
      if (error.code === '23505') {
        return json(
          errorResponse(
            'DUPLICATE_ENTRY',
            `Legacy record for ${body.riy_year} already exists`,
          ),
          409,
        );
      }
      return json(errorResponse('DB_ERROR', error.message), 500);
    }

    return json(
      successResponse(
        data,
        `Legacy record for ${body.riy_year} created successfully`,
      ),
      201,
    );
  } catch (err) {
    return handleError(err);
  }
}
