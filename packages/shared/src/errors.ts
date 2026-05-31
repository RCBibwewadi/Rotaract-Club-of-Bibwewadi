import { ZodError } from 'zod';

// ── Standard API error shape ──────────────────────────────────
export interface ApiError {
  success: false;
  code:    string;       
  message: string;       
  issues?: FieldIssue[]; 
}

export class AppError extends Error {
  constructor(
    public status:  number,
    public code:    string,
    message:        string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export interface FieldIssue {
  field:   string;       
  message: string;       
}

// ── Standard API success shape ────────────────────────────────
export interface ApiSuccess<T> {
  success: true;
  data:    T;
  message?: string;
}

// ── Builders ──────────────────────────────────────────────────
export const errorResponse = (
  code: string,
  message: string,
  issues?: FieldIssue[]
): ApiError => ({
  success: false,
  code,
  message,
  ...(issues && { issues }),
});

export const successResponse = <T>(
  data: T,
  message?: string
): ApiSuccess<T> => ({
  success: true,
  data,
  ...(message && { message }),
});

// ── Zod → standard format ─────────────────────────────────────
export const fromZodError = (err: ZodError): ApiError =>
  errorResponse(
    'VALIDATION_ERROR',
    'One or more fields are invalid',
    err.issues.map(i => ({
      field:   i.path.join('.') || 'root',
      message: i.message,
    }))
  );