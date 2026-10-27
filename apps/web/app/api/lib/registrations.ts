import { z } from 'zod';
import { supabaseAdmin } from './supabase';
import { QUESTION_TYPES } from '@/lib/registration';

export const PROOF_BUCKET = 'registration-proofs';

export const PUBLIC_FORM_COLUMNS =
  'form_id, title, description, offer_title, offer_description, image_url, video_url, payment_enabled, payment_amount, payment_original_amount, payment_qr_url, auth_required, questions';

const MEDIA_PREFIX = () =>
  `${process.env.NEXT_PUBLIC_SUPABASE_PROJECT_URL}/storage/v1/object/public/media/`;

/** Storage path inside the media bucket for a public URL we issued, else null. */
export function mediaPath(url: string | null | undefined): string | null {
  return url && url.startsWith(MEDIA_PREFIX()) ? url.slice(MEDIA_PREFIX().length) : null;
}

// Only accept files /api/upload put in our own media bucket.
const mediaUrl = z.string().refine(u => mediaPath(u) !== null, 'Upload the file through the admin panel')
  .nullable().optional();

const QuestionSchema = z.object({
  id: z.string().min(1).max(64),
  label: z.string().trim().min(1, 'Every question needs a label').max(300),
  type: z.enum(QUESTION_TYPES),
  required: z.boolean(),
  options: z.array(z.string().trim().min(1).max(200)).max(50).optional(),
}).refine(q => !['dropdown', 'checkbox'].includes(q.type) || (q.options?.length ?? 0) > 0, {
  message: 'Dropdown and checkbox questions need at least one option',
});

export const FormSchema = z.object({
  title: z.string().trim().min(1, 'Form title is required').max(200),
  description: z.string().trim().max(5000).default(''),
  offer_title: z.string().trim().min(1, 'Offer card title is required').max(200),
  offer_description: z.string().trim().max(2000).default(''),
  image_url: mediaUrl,
  video_url: mediaUrl,
  payment_enabled: z.boolean().default(false),
  payment_amount: z.number().positive().max(10_000_000).nullable().optional(),
  payment_original_amount: z.number().positive().max(10_000_000).nullable().optional(),
  payment_qr_url: mediaUrl,
  auth_required: z.boolean().default(false),
  questions: z.array(QuestionSchema).max(100).default([]),
}).superRefine((f, ctx) => {
  if (f.payment_enabled && !f.payment_amount) {
    ctx.addIssue({ code: 'custom', path: ['payment_amount'], message: 'Payment amount is required when payment is on' });
  }
  if (f.payment_enabled && !f.payment_qr_url) {
    ctx.addIssue({ code: 'custom', path: ['payment_qr_url'], message: 'Payment QR is required when payment is on' });
  }
  if (f.payment_original_amount && f.payment_amount && f.payment_original_amount <= f.payment_amount) {
    ctx.addIssue({ code: 'custom', path: ['payment_original_amount'], message: 'Original price must be higher than the payment amount' });
  }
  if (new Set(f.questions.map(q => q.id)).size !== f.questions.length) {
    ctx.addIssue({ code: 'custom', path: ['questions'], message: 'Question ids must be unique' });
  }
});

/**
 * Deletes media objects a form no longer references, skipping any still used
 * by another form. Failures are logged only: the DB already points elsewhere.
 */
export async function cleanupMedia(urls: (string | null | undefined)[]) {
  const candidates = [...new Set(urls)].filter((u): u is string => !!mediaPath(u));
  for (const url of candidates) {
    const { count } = await supabaseAdmin
      .from('registration_forms')
      .select('form_id', { count: 'exact', head: true })
      .or(`image_url.eq."${url}",video_url.eq."${url}",payment_qr_url.eq."${url}"`);
    if (count) continue;
    const { error } = await supabaseAdmin.storage.from('media').remove([mediaPath(url)!]);
    if (error) console.error('[registrations] media cleanup failed for', url, error.message);
  }
}
