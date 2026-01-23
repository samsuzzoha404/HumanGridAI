import { supabase } from "./supabaseClient";
import type { User, Session } from "@supabase/supabase-js";

export interface AuthUser {
  id: string;
  email?: string;
  wallet_address?: string;
  created_at: string;
}

/**
 * Sign in with email and password
 */
export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

/**
 * Sign up with email and password
 */
export async function signUpWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

/**
 * Sign in with wallet address (passwordless)
 */
export async function signInWithWallet(walletAddress: string) {
  // Generate a deterministic email from wallet address
  // Remove 0x prefix and use a valid email format
  const cleanAddress = walletAddress.toLowerCase().replace("0x", "");
  const email = `wallet-${cleanAddress}@humangrid.ai`;
  const password = walletAddress.toLowerCase(); // In production, use proper signing

  try {
    // Try to sign in first
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error && error.message.includes("Invalid login credentials")) {
      // If user doesn't exist, create them
      return await signUpWithEmail(email, password);
    }

    if (error) throw error;
    return data;
  } catch (err) {
    throw err;
  }
}

/**
 * Sign out the current user
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/**
 * Get the current user
 */
export async function getCurrentUser(): Promise<User | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/**
 * Get the current session
 */
export async function getCurrentSession(): Promise<Session | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
}

/**
 * Listen to auth state changes
 */
export function onAuthStateChange(
  callback: (event: string, session: Session | null) => void,
) {
  return supabase.auth.onAuthStateChange(callback);
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getCurrentSession();
  return session !== null;
}

/**
 * Get or create user stats in database
 */
export async function ensureUserStats(userId: string) {
  // Check if user stats exist
  const { data: existing, error: fetchError } = await supabase
    .from("user_stats")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (fetchError && fetchError.code !== "PGRST116") {
    // PGRST116 = not found
    throw fetchError;
  }

  if (existing) {
    return existing;
  }

  // Create new user stats
  const { data: newStats, error: createError } = await supabase
    .from("user_stats")
    .insert({
      user_id: userId,
      total_earnings: 0,
      tasks_solved_today: 0,
      accuracy_score: 100,
      current_rank: 0,
      weekly_earnings: [0, 0, 0, 0, 0, 0, 0],
    })
    .select()
    .single();

  if (createError) throw createError;
  return newStats;
}
