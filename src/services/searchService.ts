import { supabase } from "../lib/supabase";

const supabaseAny = supabase as any;

// =====================================================
// USER SEARCH
// =====================================================

export interface SearchResult {
  id: string;
  profile_id: string;
  type: "employer" | "accountant" | "worker";
  name: string;
  company_name?: string;
  kvk_number?: string;
  avatar_url?: string;
  post_count: number;
}

/**
 * Search users by company name or KVK number
 */
export async function searchUsers(
  searchQuery: string
): Promise<SearchResult[]> {
  if (!searchQuery || searchQuery.trim().length < 2) {
    return [];
  }

  const query = searchQuery.trim().toLowerCase();
  const results: SearchResult[] = [];

  try {
    // Search in employers table
    const { data: employers, error: employersError } = await supabaseAny
      .from("employers")
      .select("id, profile_id, company_name, kvk_number, contact_person")
      .or(`company_name.ilike.%${query}%,kvk_number.ilike.%${query}%`)
      .limit(10);

    if (employers && !employersError) {
      for (const emp of employers) {
        // Get post count for this employer
        const { count } = await supabaseAny
          .from("posts")
          .select("*", { count: "exact", head: true })
          .eq("author_id", emp.id)
          .eq("author_type", "employer")
          .eq("is_active", true);

        results.push({
          id: emp.id,
          profile_id: emp.profile_id,
          type: "employer",
          name: emp.contact_person || emp.company_name,
          company_name: emp.company_name,
          kvk_number: emp.kvk_number,
          post_count: count || 0,
        });
      }
    }

    // Search in accountants table
    const { data: accountants, error: accountantsError } = await supabaseAny
      .from("accountants")
      .select("id, profile_id, company_name, kvk_number")
      .or(`company_name.ilike.%${query}%,kvk_number.ilike.%${query}%`)
      .limit(10);

    if (accountants && !accountantsError) {
      for (const acc of accountants) {
        const { count } = await supabaseAny
          .from("posts")
          .select("*", { count: "exact", head: true })
          .eq("author_id", acc.id)
          .eq("author_type", "accountant")
          .eq("is_active", true);

        results.push({
          id: acc.id,
          profile_id: acc.profile_id,
          type: "accountant",
          name: acc.company_name, // accountants nie mają contact_person
          company_name: acc.company_name,
          kvk_number: acc.kvk_number,
          post_count: count || 0,
        });
      }
    }

    // Sort by post count (most active users first)
    return results.sort((a, b) => (b.post_count || 0) - (a.post_count || 0));
  } catch (error) {
    console.error("[SEARCH-USERS] Error:", error);
    return [];
  }
}

/**
 * Get posts by specific user (author_id)
 */
export async function getPostsByUser(
  authorId: string,
  authorType: "employer" | "accountant"
): Promise<any[]> {
  try {
    const { data, error } = await supabaseAny
      .from("posts")
      .select("*")
      .eq("author_id", authorId)
      .eq("author_type", authorType)
      .eq("is_active", true)
      .order("published_at", { ascending: false });

    if (error) {
      console.error("[GET-USER-POSTS] Error:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("[GET-USER-POSTS] Error:", error);
    return [];
  }
}
