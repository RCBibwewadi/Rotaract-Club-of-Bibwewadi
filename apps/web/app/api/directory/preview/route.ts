import { supabase } from '../../lib/supabase';
import { json } from '../../lib/middleware';
import { successResponse, errorResponse } from '@rcb-2.0/shared';

/**
 * Public preview endpoint for the directory gate.
 * Returns only non-sensitive fields: name, avatar, member_type.
 * No auth required. No emails, phones, or contact info.
 */
export async function GET() {
  try {
    const { data: members, error: membersErr } = await supabase
      .from('members')
      .select('member_id, full_name, avatar_url, member_type')
      .eq('is_active', true)
      .eq('is_approved', true)
      .order('created_at', { ascending: true })
      .limit(12);

    if (membersErr) {
      return json(errorResponse('DB_ERROR', membersErr.message), 500);
    }

    const { count: totalMembers } = await supabase
      .from('members')
      .select('member_id', { count: 'exact', head: true })
      .eq('is_active', true)
      .eq('is_approved', true);

    const { count: totalBusinesses } = await supabase
      .from('businesses')
      .select('business_id', { count: 'exact', head: true })
      .eq('is_visible', true);

    return json(
      successResponse({
        members: members || [],
        counts: {
          members: totalMembers || 0,
          businesses: totalBusinesses || 0,
        },
      }),
    );
  } catch (err) {
    console.error('Directory preview error:', err);
    return json(errorResponse('INTERNAL_ERROR', 'Something went wrong'), 500);
  }
}
