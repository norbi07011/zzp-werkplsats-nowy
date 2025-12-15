import { createClient } from "@supabase/supabase-js";
import { Database } from "./database.types";

// Get Supabase credentials from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables. Please check your .env file."
  );
}

// WHY: single browser-wide client; stable storage key; avoid duplicate GoTrue instances
// WHY: strongly-typed Supabase client to prevent 'never' types
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    // WHY: unique storage key prevents conflicts with multiple client instances
    storageKey: "zzp-werkplaats-auth",
  },
});

// WHY: Untyped client for tables not yet in database.types.ts (team modules, document builder)
// Use this when TypeScript complains about missing table names
export const supabaseUntyped = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storageKey: "zzp-werkplaats-auth",
  },
});

// Helper function to check if user is authenticated
export const isAuthenticated = async (): Promise<boolean> => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return !!session;
};

// Helper function to get current user
export const getCurrentUser = async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
};

// Helper function to sign out
export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error("Error signing out:", error);
    throw error;
  }
};

// Service role client (admin access, bypasses RLS)
// WARNING: Only use server-side or in trusted contexts
export const supabaseService = supabaseServiceKey
  ? createClient<Database>(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : supabase; // Fallback to regular client if service key not available

// Helper function to check if user can create posts
export const canUserCreatePosts = async (userId: string): Promise<boolean> => {
  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    return profile?.role !== "worker"; // All roles except worker can create posts
  } catch (error) {
    console.error("Error checking user permissions:", error);
    return false;
  }
};
