/**
 * =====================================================
 * EMPLOYER SERVICE - Backend Integration
 * =====================================================
 * Service for managing employer data and dashboard
 * Created: 2025-01-13
 */

import { supabase } from "@/lib/supabase";
import type { Database } from "@/lib/database.types";

// =====================================================
// TYPES - Database-generated types
// =====================================================

// WHY: use database-generated types for employers table to prevent type mismatches
type EmployersRow = Database["public"]["Tables"]["employers"]["Row"];
type EmployersUpdate = Database["public"]["Tables"]["employers"]["Update"];

// Use the basic EmployersRow type since subscription fields don't exist in current schema
export type EmployerProfile = EmployersRow;

// WHY: these tables (employer_stats, employer_search_history, employer_saved_workers, messages)
// are not yet in database.types.ts - keep manual interfaces until types are regenerated
export interface EmployerStats {
  total_searches: number;
  searches_this_month: number;
  total_saved_workers: number;
  total_contacts: number;
  contacts_this_month: number;
  subscription_end_date: string | null;
  days_until_expiry: number;
  profile_views: number; // Profile views count from profile_views table WHERE employer_id
}

export interface SearchHistoryItem {
  id: string;
  search_date: string | null;
  category: string | null;
  level: string | null;
  location: string | null; // Changed from location_city to match DB structure
  postal_code?: string | null;
  radius_km?: number | null;
  results_count: number | null;
}

export interface SavedWorker {
  id: string;
  worker_id: string;
  saved_at: string | null;
  notes: string | null;
  tags: string[] | null;
  // Joined worker data
  worker: {
    id: string;
    specialization: string | null;
    hourly_rate: number | null;
    rating: number | null;
    rating_count: number | null;
    location_city: string | null;
    profile: {
      full_name: string | null;
      avatar_url?: string | null;
    };
  };
}

export interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  subject: string | null;
  content: string;
  is_read: boolean | null;
  created_at: string | null;
  sender_profile: {
    full_name: string | null;
    avatar_url?: string | null;
  };
}

export interface EmployerReview {
  id: string;
  rating: number;
  comment: string | null;
  status: string | null;
  created_at: string | null;
  // Joined worker data
  worker: {
    id: string;
    specialization: string | null;
    profile: {
      full_name: string | null;
      avatar_url?: string | null;
    };
  };
}

// =====================================================
// EMPLOYER PROFILE
// =====================================================

/**
 * Get employer profile by user ID
 */
export async function getEmployerByUserId(
  userId: string
): Promise<EmployerProfile | null> {
  try {
    // WHY: check both user_id and profile_id for backwards compatibility
    const { data, error } = await supabase
      .from("employers")
      .select("*")
      .or(`user_id.eq.${userId},profile_id.eq.${userId}`)
      .maybeSingle();

    if (error) throw error;
    console.log("[EMPLOYER-SERVICE] getEmployerByUserId:", {
      userId,
      has_data: !!data,
      employer_id: data?.id,
    });
    return data;
  } catch (error) {
    console.error("Error fetching employer profile:", error);
    return null;
  }
}

/**
 * Update employer profile
 */
export async function updateEmployerProfile(
  employerId: string,
  updates: EmployersUpdate // WHY: use database Update type to prevent unknown properties
): Promise<boolean> {
  try {
    // WHY: cast to any because TS can't infer table type from string literal
    const { error } = await (supabase.from("employers") as any)
      .update(updates)
      .eq("id", employerId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error updating employer profile:", error);
    return false;
  }
}

// =====================================================
// EMPLOYER STATS
// =====================================================

/**
 * Get employer dashboard statistics
 */
export async function getEmployerStats(
  employerId: string
): Promise<EmployerStats | null> {
  try {
    console.log("[EMPLOYER-SERVICE] Getting stats for employer:", employerId);

    // Get employer data for subscription info
    const { data: employer } = await supabase
      .from("employers")
      .select("*")
      .eq("id", employerId)
      .single();

    if (!employer) {
      console.error("[EMPLOYER-SERVICE] Employer not found:", employerId);
      return getDefaultStats();
    }

    // Get search history count (cast to any - new table not in types)
    const { count: totalSearches } = await (
      supabase.from("search_history") as any
    )
      .select("*", { count: "exact", head: true })
      .eq("employer_id", employerId);

    // Get searches this month
    const firstDayOfMonth = new Date();
    firstDayOfMonth.setDate(1);
    firstDayOfMonth.setHours(0, 0, 0, 0);

    const { count: searchesThisMonth } = await (
      supabase.from("search_history") as any
    )
      .select("*", { count: "exact", head: true })
      .eq("employer_id", employerId)
      .gte("created_at", firstDayOfMonth.toISOString());

    // Get saved workers count (cast to any - new table not in types)
    const { count: savedWorkers } = await (
      supabase.from("saved_workers") as any
    )
      .select("*", { count: "exact", head: true })
      .eq("employer_id", employerId);

    // Get messages count (as contacts)
    const { count: totalContacts } = await supabase
      .from("messages")
      .select("*", { count: "exact", head: true })
      .eq("sender_id", (employer as any).user_id || employer.profile_id);

    // Get contacts this month
    const { count: contactsThisMonth } = await supabase
      .from("messages")
      .select("*", { count: "exact", head: true })
      .eq("sender_id", (employer as any).user_id || employer.profile_id)
      .gte("created_at", firstDayOfMonth.toISOString());

    // Get profile views count from profile_views table WHERE employer_id
    console.log(
      "[EMPLOYER-SERVICE] 🔍 Fetching profile_views for employer_id:",
      employerId
    );
    const { count: profileViewsCount, error: profileViewsError } =
      await supabase
        .from("profile_views")
        .select("*", { count: "exact", head: true })
        .eq("employer_id", employerId);

    if (profileViewsError) {
      console.error(
        "[EMPLOYER-SERVICE] ❌ Error fetching profile_views:",
        profileViewsError
      );
    } else {
      console.log(
        "[EMPLOYER-SERVICE] ✅ Profile views count:",
        profileViewsCount
      );
    }

    // Get subscription info (cast to any - new table not in types)
    const { data: subscription } = await (supabase.from("subscriptions") as any)
      .select("*")
      .eq("employer_id", employerId)
      .eq("status", "active")
      .order("end_date", { ascending: false })
      .limit(1)
      .maybeSingle();

    const subscriptionEndDate =
      subscription?.end_date || (employer as any).subscription_end_date;
    const daysUntilExpiry = subscriptionEndDate
      ? Math.ceil(
          (new Date(subscriptionEndDate).getTime() - Date.now()) /
            (1000 * 60 * 60 * 24)
        )
      : 0;

    const stats: EmployerStats = {
      total_searches: totalSearches || 0,
      searches_this_month: searchesThisMonth || 0,
      total_saved_workers: savedWorkers || 0,
      total_contacts: totalContacts || 0,
      contacts_this_month: contactsThisMonth || 0,
      subscription_end_date: subscriptionEndDate,
      days_until_expiry: Math.max(0, daysUntilExpiry),
      profile_views: profileViewsCount || 0, // Profile views count from profile_views table
    };

    console.log("[EMPLOYER-SERVICE] Stats:", stats);
    return stats;
  } catch (error) {
    console.error("[EMPLOYER-SERVICE] Error fetching employer stats:", error);
    return getDefaultStats();
  }
}

function getDefaultStats(): EmployerStats {
  return {
    total_searches: 0,
    searches_this_month: 0,
    total_saved_workers: 0,
    total_contacts: 0,
    contacts_this_month: 0,
    subscription_end_date: null,
    days_until_expiry: 0,
    profile_views: 0, // Default profile views count
  };
}

// =====================================================
// SEARCH HISTORY
// =====================================================

/**
 * Get employer's search history
 */
export async function getSearchHistory(
  employerId: string,
  limit: number = 10
): Promise<SearchHistoryItem[]> {
  try {
    // WHY: Using new search_history table (as any) - not yet in database.types.ts
    const { data, error } = await (supabase.from("search_history") as any)
      .select(
        "id, search_date, category, level, location, postal_code, radius_km, results_count"
      )
      .eq("employer_id", employerId)
      .order("search_date", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching search history:", error);
    return [];
  }
}

/**
 * Add search to history
 */
export async function addSearchToHistory(
  employerId: string,
  searchParams: {
    category: string;
    level?: string;
    location?: string; // Changed from location_city
    postal_code?: string;
    radius_km?: number;
    min_hourly_rate?: number;
    max_hourly_rate?: number;
    skills?: string[];
    results_count: number;
  }
): Promise<boolean> {
  try {
    // WHY: Using new search_history table (as any) - not yet in database.types.ts
    const { error } = await (supabase.from("search_history") as any).insert({
      employer_id: employerId,
      ...searchParams,
    });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error adding search to history:", error);
    return false;
  }
}

/**
 * Delete search from history
 */
export async function deleteSearchFromHistory(
  searchId: string
): Promise<boolean> {
  try {
    // WHY: Using new search_history table (as any) - not yet in database.types.ts
    const { error } = await (supabase.from("search_history") as any)
      .delete()
      .eq("id", searchId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error deleting search from history:", error);
    return false;
  }
}

// =====================================================
// SAVED WORKERS
// =====================================================

/**
 * Get employer's saved workers
 */
export async function getSavedWorkers(
  employerId: string
): Promise<SavedWorker[]> {
  try {
    // WHY: Using new saved_workers table (as any) - not yet in database.types.ts
    // WHY: workers(profile_id) explicitly specifies which foreign key to use for profiles join
    const { data, error } = await (supabase.from("saved_workers") as any)
      .select(
        `
        id,
        worker_id,
        saved_at,
        notes,
        tags,
        worker:workers!inner(
          id,
          specialization,
          hourly_rate,
          rating,
          rating_count,
          location_city,
          profile:profiles!workers_profile_id_fkey(
            full_name,
            avatar_url
          )
        )
      `
      )
      .eq("employer_id", employerId)
      .order("saved_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching saved workers:", error);
    return [];
  }
}

/**
 * Save/bookmark a worker
 */
export async function saveWorker(
  employerId: string,
  workerId: string,
  notes?: string,
  tags?: string[]
): Promise<boolean> {
  try {
    // WHY: Using new saved_workers table (as any) - not yet in database.types.ts
    const { error } = await (supabase.from("saved_workers") as any).insert({
      employer_id: employerId,
      worker_id: workerId,
      notes: notes || null,
      tags: tags || [],
    });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error saving worker:", error);
    return false;
  }
}

/**
 * Remove saved worker
 */
export async function removeSavedWorker(
  savedWorkerId: string
): Promise<boolean> {
  try {
    // WHY: Using new saved_workers table (as any) - not yet in database.types.ts
    const { error } = await (supabase.from("saved_workers") as any)
      .delete()
      .eq("id", savedWorkerId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error removing saved worker:", error);
    return false;
  }
}

/**
 * Check if worker is saved
 */
export async function isWorkerSaved(
  employerId: string,
  workerId: string
): Promise<boolean> {
  try {
    // WHY: Using new saved_workers table (as any), .maybeSingle() returns null if worker not saved
    const { data, error } = await (supabase.from("saved_workers") as any)
      .select("id")
      .eq("employer_id", employerId)
      .eq("worker_id", workerId)
      .maybeSingle();

    if (error) throw error;
    return !!data;
  } catch (error) {
    console.error("Error checking if worker is saved:", error);
    return false;
  }
}

// =====================================================
// MESSAGES
// =====================================================

/**
 * Get employer's messages
 */
export async function getMessages(
  userId: string,
  limit: number = 10,
  unreadOnly: boolean = false
): Promise<Message[]> {
  try {
    let query = supabase
      .from("messages")
      .select(
        `
        id,
        sender_id,
        recipient_id,
        subject,
        content,
        is_read,
        created_at,
        sender_profile:profiles!messages_sender_id_fkey(
          full_name,
          role,
          id
        )
      `
      )
      .eq("recipient_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (unreadOnly) {
      query = query.eq("is_read", false);
    }

    const { data, error } = await query;

    if (error) throw error;

    if (!data) return [];

    // For each message, fetch avatar based on sender role
    const messagesWithAvatars = await Promise.all(
      data.map(async (msg: any) => {
        let avatar_url = null;
        const senderId = msg.sender_profile?.id;
        const role = msg.sender_profile?.role;

        if (senderId && role) {
          try {
            if (role === "worker") {
              const { data: worker } = await supabase
                .from("workers")
                .select("avatar_url")
                .eq("profile_id", senderId)
                .single();
              avatar_url = worker?.avatar_url;
            } else if (role === "employer") {
              const { data: employer } = await supabase
                .from("employers")
                .select("logo_url")
                .eq("profile_id", senderId)
                .single();
              avatar_url = employer?.logo_url;
            } else if (role === "accountant") {
              const { data: accountant } = await supabase
                .from("accountants")
                .select("avatar_url")
                .eq("profile_id", senderId)
                .single();
              avatar_url = accountant?.avatar_url;
            } else if (role === "cleaning_company") {
              const { data: cleaning } = await supabase
                .from("cleaning_companies")
                .select("avatar_url")
                .eq("profile_id", senderId)
                .single();
              avatar_url = cleaning?.avatar_url;
            }
          } catch (err) {
            console.error(`Error fetching avatar for ${role}:`, err);
          }
        }

        return {
          ...msg,
          sender_profile: {
            ...msg.sender_profile,
            avatar_url,
          },
        };
      })
    );

    return messagesWithAvatars as any;
  } catch (error) {
    console.error("Error fetching messages:", error);
    return [];
  }
}

/**
 * Get unread message count
 */
export async function getUnreadMessageCount(userId: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from("messages")
      .select("*", { count: "exact", head: true })
      .eq("recipient_id", userId)
      .eq("is_read", false);

    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error("Error fetching unread message count:", error);
    return 0;
  }
}

/**
 * Mark message as read
 */
export async function markMessageAsRead(messageId: string): Promise<boolean> {
  try {
    // WHY: cast to any - messages table not in database.types.ts
    const { error } = await (supabase.from("messages") as any)
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq("id", messageId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error marking message as read:", error);
    return false;
  }
}

/**
 * Send message
 */
export async function sendMessage(
  senderId: string,
  recipientId: string,
  subject: string,
  content: string
): Promise<boolean> {
  try {
    // WHY: cast to any - messages table not in database.types.ts
    const { error } = await (supabase.from("messages") as any).insert({
      sender_id: senderId,
      recipient_id: recipientId,
      subject,
      content,
    });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error sending message:", error);
    return false;
  }
}

// =====================================================
// REVIEWS WRITTEN BY EMPLOYER
// =====================================================

/**
 * Get all reviews written by this employer
 */
export async function getEmployerReviews(
  employerId: string
): Promise<EmployerReview[]> {
  try {
    const { data, error } = await supabase
      .from("reviews")
      .select(
        `
        id,
        rating,
        comment,
        status,
        created_at,
        worker:workers!reviews_worker_id_fkey(
          id,
          specialization,
          profile:profiles!workers_user_id_fkey(
            full_name
          )
        )
      `
      )
      .eq("employer_id", employerId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data || []) as any; // Type cast needed - new joins not in generated types
  } catch (error) {
    console.error("Error fetching employer reviews:", error);
    return [];
  }
}

// =====================================================
// EXPORT ALL
// =====================================================

const employerService = {
  // Profile
  getEmployerByUserId,
  updateEmployerProfile,

  // Stats
  getEmployerStats,

  // Search History
  getSearchHistory,
  addSearchToHistory,
  deleteSearchFromHistory,

  // Saved Workers
  getSavedWorkers,
  saveWorker,
  removeSavedWorker,
  isWorkerSaved,

  // Messages
  getMessages,
  getUnreadMessageCount,
  markMessageAsRead,
  sendMessage,

  // Reviews
  getEmployerReviews,
};

export default employerService;
