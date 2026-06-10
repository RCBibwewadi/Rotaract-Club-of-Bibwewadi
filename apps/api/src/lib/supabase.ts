import { createClient } from "@supabase/supabase-js";
import ws from "ws";

const supabaseURI=process.env.NEXT_PUBLIC_SUPABASE_PROJECT_URL;
const supabaseServiceKey=process.env.NEXT_PUBLIC_SUPABASE_PUBLIC_KEY;

if (!supabaseURI || !supabaseServiceKey) {
  throw new Error("Supabase URI and Service Key must be provided in environment variables.");
}

export const supabase = createClient(supabaseURI,supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
    realtime: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        transport: ws as any,
    },
});

// Service role client — bypasses RLS, used for storage uploads
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
export const supabaseAdmin = serviceRoleKey
  ? createClient(supabaseURI, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
      realtime: { transport: ws as any },
    })
  : supabase;