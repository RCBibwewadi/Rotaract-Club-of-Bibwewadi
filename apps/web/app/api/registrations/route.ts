import { NextRequest } from 'next/server';
import crypto from 'crypto';
import path from 'path';
import { supabaseAdmin } from '../lib/supabase';
import { json, authenticate, handleError } from '../lib/middleware';
import { PROOF_BUCKET } from '../lib/registrations';
import { successResponse, errorResponse } from '@rcb-2.0/shared';
import {
  validateAnswer, EMAIL_RE, PROOF_EXTS, PROOF_MAX_SIZE,
  type RegistrationQuestion, type AnswerValue,
} from '@/lib/registration';

/**
 * Email is a fixed required field. Name and phone come from the first matching
 * admin question (phone by type, name by label), else the member's profile.
 */
async function contactFor(questions: RegistrationQuestion[], raw: Record<string, unknown>, memberId: string | null) {
  const answer = (pick: (q: RegistrationQuestion) => boolean) => {
    const q = questions.find(q => pick(q) && typeof raw[q.id] === 'string' && (raw[q.id] as string).trim());
    return q ? (raw[q.id] as string).trim() : null;
  };
  const { data: member } = memberId
    ? await supabaseAdmin.from('members').select('full_name, email, phone').eq('member_id', memberId).maybeSingle()
    : { data: null };
  return {
    full_name: answer(q => q.type === 'text' && /name/i.test(q.label)) ?? member?.full_name ?? null,
    phone: answer(q => q.type === 'phone') ?? member?.phone ?? null,
  };
}

/**
 * POST /api/registrations — multipart form:
 *   form_id, email (required), answers (JSON object question_id -> value),
 *   payment_proof (file, when the form takes payment)
 */
export async function POST(request: NextRequest) {
  try {
    const fd = await request.formData();
    const formId = String(fd.get('form_id') || '');

    const { data: form, error: formErr } = await supabaseAdmin
      .from('registration_forms')
      .select('form_id, is_active, auth_required, payment_enabled, questions')
      .eq('form_id', formId)
      .maybeSingle();
    if (formErr) return json(errorResponse('DB_ERROR', formErr.message), 500);
    if (!form || !form.is_active) {
      return json(errorResponse('FORM_CLOSED', 'Registrations for this form are closed'), 400);
    }

    // Logged-in visitors are linked to their member record; required when the form says so.
    let memberId: string | null = null;
    if (request.headers.get('authorization') || form.auth_required) {
      memberId = authenticate(request).member_id;
    }

    const email = String(fd.get('email') || '').trim().toLowerCase();
    if (!EMAIL_RE.test(email)) return json(errorResponse('VALIDATION_ERROR', 'Enter a valid email'), 400);

    let raw: Record<string, unknown>;
    try {
      raw = JSON.parse(String(fd.get('answers') || '{}'));
    } catch {
      return json(errorResponse('VALIDATION_ERROR', 'Answers are malformed'), 400);
    }
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
      return json(errorResponse('VALIDATION_ERROR', 'Answers are malformed'), 400);
    }

    const questions = (form.questions || []) as RegistrationQuestion[];
    const answers = [];
    for (const q of questions) {
      const value = raw[q.id];
      const err = validateAnswer(q, value);
      if (err) return json(errorResponse('VALIDATION_ERROR', err), 400);
      answers.push({
        question_id: q.id,
        label: q.label,
        type: q.type,
        value: typeof value === 'string' ? value.trim() : (value as AnswerValue | undefined) ?? '',
      });
    }

    let proofPath: string | null = null;
    if (form.payment_enabled) {
      const file = fd.get('payment_proof');
      if (!(file instanceof File) || file.size === 0) {
        return json(errorResponse('VALIDATION_ERROR', 'Upload your payment screenshot'), 400);
      }
      const ext = path.extname(file.name).toLowerCase();
      if (!PROOF_EXTS.includes(ext)) {
        return json(errorResponse('VALIDATION_ERROR', 'Payment proof must be JPG, PNG, WEBP or PDF'), 400);
      }
      if (file.size > PROOF_MAX_SIZE) {
        return json(errorResponse('VALIDATION_ERROR', 'Payment proof must be under 5MB'), 400);
      }
      proofPath = `${form.form_id}/${crypto.randomUUID()}${ext}`;
      const { error: upErr } = await supabaseAdmin.storage
        .from(PROOF_BUCKET)
        .upload(proofPath, Buffer.from(await file.arrayBuffer()), { contentType: file.type, upsert: false });
      if (upErr) return json(errorResponse('UPLOAD_ERROR', upErr.message), 500);
    }

    const { data, error } = await supabaseAdmin
      .from('registrations')
      .insert({
        form_id: form.form_id,
        member_id: memberId,
        email,
        ...(await contactFor(questions, raw, memberId)),
        answers,
        payment_proof_path: proofPath,
        payment_status: proofPath ? 'submitted' : 'not_required',
      })
      .select('registration_id')
      .single();

    if (error) {
      if (proofPath) await supabaseAdmin.storage.from(PROOF_BUCKET).remove([proofPath]);
      if (error.code === '23505') {
        return json(errorResponse('ALREADY_REGISTERED', 'You have already registered for this form'), 409);
      }
      return json(errorResponse('DB_ERROR', error.message), 500);
    }

    return json(successResponse(data, 'Registration submitted'), 201);
  } catch (err) {
    return handleError(err);
  }
}
