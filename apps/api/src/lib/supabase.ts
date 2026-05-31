import { createClient } from "@supabase/supabase-js";

const supabaseURI=process.env.NEXT_PUBLIC_SUPABASE_PROJECT_URL;
const supabaseServiceKey=process.env.NEXT_PUBLIC_SUPABASE_PUBLIC_KEY;

if (!supabaseURI || !supabaseServiceKey) {
  throw new Error("Supabase URI and Service Key must be provided in environment variables.");
}

export const supabase = createClient(supabaseURI,supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    }
});