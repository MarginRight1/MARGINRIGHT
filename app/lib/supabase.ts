import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const missingConfigMessage = "Supabase environment variables are not configured yet.";

const fallbackAuth = {
  getSession: async () => ({ data: { session: null }, error: null }),
  signInWithPassword: async () => ({ data: { user: null, session: null }, error: { message: missingConfigMessage } }),
  signUp: async () => ({ data: { user: null, session: null }, error: { message: missingConfigMessage } }),
  resetPasswordForEmail: async () => ({ data: {}, error: { message: missingConfigMessage } }),
  signOut: async () => ({ error: null }),
};

const createFallbackClient = () => ({
  auth: fallbackAuth,
}) as unknown as ReturnType<typeof createClient>;

export const supabaseBrowser = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : createFallbackClient();

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const createServerSupabaseClient = (cookieStore: { getAll?: () => Array<{ name: string; value: string }>; set?: (name: string, value: string, options: CookieOptions) => void; remove?: (name: string, options: CookieOptions) => void }) => {
  if (!supabaseUrl || !supabaseAnonKey) {
    return createFallbackClient();
  }

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll?.() ?? [];
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => cookieStore.set?.(name, value, options));
      },
    },
  });
};
