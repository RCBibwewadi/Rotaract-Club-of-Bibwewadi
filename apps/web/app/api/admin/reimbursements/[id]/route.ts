import { NextRequest } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabase';
import { json, requireAdminPassword, handleError } from '../../../lib/middleware';
import { successResponse, errorResponse } from '@rcb-2.0/shared';

const VALID_STATUSES = [
  'Fetched',
  'Verification_Pending',
  'Payment_Pending',
  'Rejected',
  'Payment_Done',
  'Acknowledged',
  'Email_Sent',
];

const BUCKET = 'media';

/** PATCH /api/admin/reimbursements/[id] — update status */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    requireAdminPassword(request);
    const { id } = await params;
    const { status } = await request.json();

    if (!status || !VALID_STATUSES.includes(status)) {
      return json(errorResponse('INVALID_STATUS', `Status must be one of: ${VALID_STATUSES.join(', ')}`), 400);
    }

    const { data, error } = await supabaseAdmin
      .from('reimbursements')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) return json(errorResponse('DB_ERROR', error.message), 500);
    if (!data) return json(errorResponse('NOT_FOUND', 'Reimbursement not found'), 404);

    return json(successResponse(data, `Status updated to ${status}`));
  } catch (err) {
    return handleError(err);
  }
}

/** DELETE /api/admin/reimbursements/[id] — delete reimbursement + its screenshots */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    requireAdminPassword(request);
    const { id } = await params;

    // Fetch the row first to get screenshot paths for cleanup
    const { data: row } = await supabaseAdmin
      .from('reimbursements')
      .select('screenshot_paths')
      .eq('id', id)
      .single();

    if (!row) return json(errorResponse('NOT_FOUND', 'Reimbursement not found'), 404);

    // Delete from DB
    const { error } = await supabaseAdmin
      .from('reimbursements')
      .delete()
      .eq('id', id);

    if (error) return json(errorResponse('DB_ERROR', error.message), 500);

    // Clean up storage files (best-effort, don't fail the request)
    const paths = (row.screenshot_paths || '').split(',').filter(Boolean);
    if (paths.length > 0) {
      await supabaseAdmin.storage.from(BUCKET).remove(paths);
    }

    return json(successResponse(null, 'Reimbursement deleted'));
  } catch (err) {
    return handleError(err);
  }
}
