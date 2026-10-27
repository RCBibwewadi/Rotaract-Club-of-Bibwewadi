// Shared by the /register page, the admin Registrations tab and the API routes,
// so the browser and the server validate answers with the same rules.

export const QUESTION_TYPES = ['text', 'email', 'phone', 'number', 'dropdown', 'checkbox', 'textarea'] as const;
export type QuestionType = (typeof QUESTION_TYPES)[number];

export interface RegistrationQuestion {
  id: string;
  label: string;
  type: QuestionType;
  required: boolean;
  /** dropdown: the choices; checkbox: the choices (multi-select) */
  options?: string[];
}

/** What the public API exposes about the active form. */
export interface PublicRegistrationForm {
  form_id: string;
  title: string;
  description: string;
  offer_title: string;
  offer_description: string;
  image_url: string | null;
  video_url: string | null;
  payment_enabled: boolean;
  payment_amount: number | null;
  payment_original_amount: number | null;
  payment_qr_url: string | null;
  auth_required: boolean;
  questions: RegistrationQuestion[];
}

export type AnswerValue = string | string[];

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PHONE_RE = /^\+?[0-9][0-9\s-]{8,14}$/;
export const PROOF_EXTS = ['.jpg', '.jpeg', '.png', '.webp', '.pdf'];
export const PROOF_MAX_SIZE = 5 * 1024 * 1024; // 5 MB

const MAX_TEXT = 500;
const MAX_TEXTAREA = 5000;

/** Returns an error message, or null when the answer is valid. */
export function validateAnswer(q: RegistrationQuestion, value: unknown): string | null {
  const empty = value === undefined || value === null || value === ''
    || (Array.isArray(value) && value.length === 0);
  if (empty) return q.required ? `${q.label} is required` : null;

  if (q.type === 'checkbox') {
    if (!Array.isArray(value) || !value.every(v => typeof v === 'string' && q.options?.includes(v))) {
      return `${q.label}: choose from the given options`;
    }
    return null;
  }

  if (typeof value !== 'string') return `${q.label} is invalid`;
  const v = value.trim();
  if (!v) return q.required ? `${q.label} is required` : null;

  switch (q.type) {
    case 'email':
      return EMAIL_RE.test(v) ? null : `${q.label}: enter a valid email`;
    case 'phone':
      return PHONE_RE.test(v) ? null : `${q.label}: enter a valid phone number`;
    case 'number':
      return Number.isFinite(Number(v)) ? null : `${q.label}: enter a number`;
    case 'dropdown':
      return q.options?.includes(v) ? null : `${q.label}: choose from the given options`;
    case 'textarea':
      return v.length <= MAX_TEXTAREA ? null : `${q.label} is too long`;
    default:
      return v.length <= MAX_TEXT ? null : `${q.label} is too long`;
  }
}

/** Only same-site paths, so ?next= cannot send people off-site. */
export function safeNextPath(next: string | null | undefined): string | null {
  return next && next.startsWith('/') && !next.startsWith('//') && !next.startsWith('/\\') ? next : null;
}
