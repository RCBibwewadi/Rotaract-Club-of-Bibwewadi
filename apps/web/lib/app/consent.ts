/**
 * The member's standing consent record (supabase/consents.sql), as the newest
 * row the API found. null means the member has never answered.
 */
export interface ConsentStatus {
  personal_data_consent: boolean;
  ai_training_consent: boolean;
  consent_version: string;
  accepted_at: string;
}

/**
 * Bump this when the processing purposes in the Privacy Notice materially
 * change: every member is then asked again, and their old record is kept.
 */
export const CONSENT_VERSION = '2026-11-13';

/** True while the app must hold the member at the consent screen. */
export function needsConsent(status: ConsentStatus | null): boolean {
  if (!status) return true;
  return !status.personal_data_consent || status.consent_version !== CONSENT_VERSION;
}
