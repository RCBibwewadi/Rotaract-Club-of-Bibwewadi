import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let _supabase: SupabaseClient;
let _supabaseAdmin: SupabaseClient;

export function getSupabase() {
  if (!_supabase) {
    _supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_PROJECT_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLIC_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );
  }
  return _supabase;
}

export function getSupabaseAdmin() {
  if (!_supabaseAdmin) {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    _supabaseAdmin = serviceRoleKey
      ? createClient(
          process.env.NEXT_PUBLIC_SUPABASE_PROJECT_URL!,
          serviceRoleKey,
          { auth: { autoRefreshToken: false, persistSession: false } },
        )
      : getSupabase();
  }
  return _supabaseAdmin;
}

// Convenience aliases for backward compat
export const supabase = new Proxy({} as SupabaseClient, {
  get: (_target, prop) => (getSupabase() as unknown as Record<string, unknown>)[prop as string],
});

export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get: (_target, prop) => (getSupabaseAdmin() as unknown as Record<string, unknown>)[prop as string],
});
