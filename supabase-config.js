// supabase-config.js
// Replace ONLY these two values with your Supabase project values.
// Never put a service_role/secret key in this file.

const SUPABASE_URL = "https://phqqxutqdvpqmlsbhell.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_bf3Rmop-vAPpHDmM9zRk0Q_wgOf4ze_";

const { createClient } = supabase;

window.honeyTraceDB = createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  }
);
