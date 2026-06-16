import { NextRequest } from 'next/server';
import { supabase } from '../../../../lib/supabase';
import { supabaseAdmin } from '../../../../lib/supabase';
import { json, requireAdminPassword, handleError } from '../../../../lib/middleware';
import { successResponse, errorResponse } from '@rcb-2.0/shared';

/** Extract storage path from a full public URL */
function storagePathFromUrl(url: string): string | null {
  // URL pattern: .../storage/v1/object/public/media/some/path.jpg
  const match = url.match(/\/storage\/v1\/object\/public\/media\/(.+)$/);
  return match ? match[1] : null;
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    requireAdminPassword(request);
    const { id } = await params;

    // 1. Fetch member to get avatar + payment proof URLs
    const { data: member, error: fetchErr } = await supabase
      .from('members')
      .select('member_id, full_name, avatar_url, payment_proof_url')
      .eq('member_id', id)
      .single();

    if (fetchErr || !member) {
      return json(errorResponse('NOT_FOUND', 'Member not found'), 404);
    }

    // 2. Collect storage files to delete
    const filesToDelete: string[] = [];

    if (member.avatar_url) {
      const path = storagePathFromUrl(member.avatar_url);
      if (path) filesToDelete.push(path);
    }

    if (member.payment_proof_url) {
      const path = storagePathFromUrl(member.payment_proof_url);
      if (path) filesToDelete.push(path);
    }

    // 3. Delete related rows (order matters for FK constraints)
    await supabase.from('member_visibility').delete().eq('member_id', id);
    await supabase.from('businesses').delete().eq('member_id', id);
    await supabase.from('professions').delete().eq('member_id', id);

    // 4. Delete the member row
    const { error: deleteErr } = await supabase
      .from('members')
      .delete()
      .eq('member_id', id);

    if (deleteErr) {
      return json(errorResponse('DB_ERROR', deleteErr.message), 500);
    }

    // 5. Delete storage files (best-effort, don't fail if storage cleanup fails)
    if (filesToDelete.length > 0) {
      await supabaseAdmin.storage.from('media').remove(filesToDelete);
    }

    return json(
      successResponse(
        { member_id: id, full_name: member.full_name },
        `Member "${member.full_name}" and all related data deleted permanently`,
      ),
    );
  } catch (err) {
    return handleError(err);
  }
}
