/**
 * =====================================================
 * SAVED PROFILES SERVICE - Generic for all user types
 * =====================================================
 * Service for managing saved profiles across all user types
 * (Workers, Employers, Accountants, Cleaning Companies)
 *
 * NOTE: Using `as any` for saved_profiles table because it's not yet in database.types.ts
 */

import { supabaseUntyped } from "@/lib/supabase";

export type EntityType =
  | "worker"
  | "employer"
  | "accountant"
  | "cleaning_company";

export interface SavedProfile {
  id: string;
  owner_profile_id: string;
  entity_type: EntityType;
  entity_id: string;
  saved_at: string;
  notes?: string;
  tags?: string[];
  folder?: string;
  // Enriched data
  entity_name?: string;
  entity_avatar?: string;
  entity_location?: string;
  entity_rating?: number;
  entity_specialization?: string;
}

/**
 * Get all saved profiles for the current user
 */
export async function getAllSavedProfiles(
  ownerProfileId: string,
  filterType?: EntityType
): Promise<SavedProfile[]> {
  try {
    // WHY: Using supabaseUntyped because saved_profiles table is not yet in database.types.ts
    let query = supabaseUntyped
      .from("saved_profiles")
      .select("*")
      .eq("owner_profile_id", ownerProfileId)
      .order("saved_at", { ascending: false });

    if (filterType) {
      query = query.eq("entity_type", filterType);
    }

    const { data, error } = await query;

    if (error) throw error;
    if (!data) return [];

    // Enrich with entity details
    const enrichedProfiles: SavedProfile[] = [];

    for (const record of data) {
      const enriched: SavedProfile = {
        id: record.id,
        owner_profile_id: record.owner_profile_id,
        entity_type: record.entity_type as EntityType,
        entity_id: record.entity_id,
        saved_at: record.saved_at,
        notes: record.notes,
        tags: record.tags,
        folder: record.folder,
      };

      try {
        // Fetch entity details based on type
        switch (record.entity_type) {
          case "worker": {
            const { data: workerData } = await supabaseUntyped
              .from("workers")
              .select(
                "id, specialization, hourly_rate, rating, location_city, profile:profiles!workers_profile_id_fkey(full_name, avatar_url)"
              )
              .eq("id", record.entity_id)
              .single();

            if (workerData) {
              const profile = workerData.profile as any;
              enriched.entity_name = profile?.full_name || "Nieznany pracownik";
              enriched.entity_avatar = profile?.avatar_url;
              enriched.entity_location = workerData.location_city || undefined;
              enriched.entity_rating = workerData.rating || undefined;
              enriched.entity_specialization =
                workerData.specialization || undefined;
            }
            break;
          }
          case "employer": {
            const { data: employerData } = await supabaseUntyped
              .from("employers")
              .select(
                "id, company_name, location_city, avg_rating, logo_url, industry"
              )
              .eq("id", record.entity_id)
              .single();

            if (employerData) {
              enriched.entity_name =
                employerData.company_name || "Nieznany pracodawca";
              enriched.entity_avatar = employerData.logo_url || undefined;
              enriched.entity_location =
                employerData.location_city || undefined;
              enriched.entity_rating = employerData.avg_rating || undefined;
              enriched.entity_specialization =
                employerData.industry || undefined;
            }
            break;
          }
          case "accountant": {
            // accountants table has: full_name, company_name, city, rating, avatar_url, specializations (array)
            const { data: accountantData } = await supabaseUntyped
              .from("accountants")
              .select(
                "id, full_name, company_name, city, rating, avatar_url, specializations"
              )
              .eq("id", record.entity_id)
              .single();

            if (accountantData) {
              enriched.entity_name =
                accountantData.full_name ||
                accountantData.company_name ||
                "Nieznany księgowy";
              enriched.entity_avatar = accountantData.avatar_url || undefined;
              enriched.entity_location = accountantData.city || undefined;
              enriched.entity_rating = accountantData.rating || undefined;
              // specializations is an array
              enriched.entity_specialization = Array.isArray(
                accountantData.specializations
              )
                ? accountantData.specializations.join(", ")
                : undefined;
            }
            break;
          }
          case "cleaning_company": {
            // cleaning_companies table has: company_name, owner_name, location_city (not city!), average_rating, avatar_url, specialization (string, not array)
            const { data: companyData } = await supabaseUntyped
              .from("cleaning_companies")
              .select(
                "id, company_name, owner_name, location_city, average_rating, avatar_url, specialization"
              )
              .eq("id", record.entity_id)
              .single();

            if (companyData) {
              enriched.entity_name =
                companyData.company_name ||
                companyData.owner_name ||
                "Nieznana firma";
              enriched.entity_avatar = companyData.avatar_url || undefined;
              enriched.entity_location = companyData.location_city || undefined;
              enriched.entity_rating = companyData.average_rating || undefined;
              enriched.entity_specialization =
                companyData.specialization || undefined;
            }
            break;
          }
        }
      } catch (e) {
        console.error(`Error enriching entity ${record.entity_id}:`, e);
      }

      enrichedProfiles.push(enriched);
    }

    return enrichedProfiles;
  } catch (error) {
    console.error("Error fetching saved profiles:", error);
    return [];
  }
}

/**
 * Save a profile
 */
export async function saveProfile(
  ownerProfileId: string,
  entityType: EntityType,
  entityId: string,
  notes?: string,
  tags?: string[]
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    // WHY: Using supabaseUntyped because saved_profiles table is not yet in database.types.ts
    const { data, error } = await supabaseUntyped
      .from("saved_profiles")
      .insert({
        owner_profile_id: ownerProfileId,
        entity_type: entityType,
        entity_id: entityId,
        notes,
        tags,
      })
      .select("id")
      .single();

    if (error) {
      if (error.code === "23505") {
        return { success: false, error: "Ten profil jest już zapisany" };
      }
      throw error;
    }

    return { success: true, id: data.id };
  } catch (error) {
    console.error("Error saving profile:", error);
    return { success: false, error: "Nie udało się zapisać profilu" };
  }
}

/**
 * Remove a saved profile
 */
export async function removeSavedProfile(
  savedProfileId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // WHY: Using supabaseUntyped because saved_profiles table is not yet in database.types.ts
    const { error } = await supabaseUntyped
      .from("saved_profiles")
      .delete()
      .eq("id", savedProfileId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error("Error removing saved profile:", error);
    return { success: false, error: "Nie udało się usunąć profilu" };
  }
}

/**
 * Check if a profile is saved by the current user
 */
export async function isProfileSaved(
  ownerProfileId: string,
  entityType: EntityType,
  entityId: string
): Promise<boolean> {
  try {
    // WHY: Using supabaseUntyped because saved_profiles table is not yet in database.types.ts
    const { data, error } = await supabaseUntyped
      .from("saved_profiles")
      .select("id")
      .eq("owner_profile_id", ownerProfileId)
      .eq("entity_type", entityType)
      .eq("entity_id", entityId)
      .maybeSingle();

    if (error) throw error;
    return !!data;
  } catch (error) {
    console.error("Error checking if profile is saved:", error);
    return false;
  }
}

/**
 * Get a saved profile record (for deletion)
 */
export async function getSavedProfileRecord(
  ownerProfileId: string,
  entityType: EntityType,
  entityId: string
): Promise<SavedProfile | null> {
  try {
    // WHY: Using supabaseUntyped because saved_profiles table is not yet in database.types.ts
    const { data, error } = await supabaseUntyped
      .from("saved_profiles")
      .select("*")
      .eq("owner_profile_id", ownerProfileId)
      .eq("entity_type", entityType)
      .eq("entity_id", entityId)
      .maybeSingle();

    if (error) throw error;
    return data as SavedProfile | null;
  } catch (error) {
    console.error("Error getting saved profile record:", error);
    return null;
  }
}

/**
 * Get saved profile IDs for a specific entity type (for UI state)
 */
export async function getSavedProfileIds(
  ownerProfileId: string,
  entityType: EntityType
): Promise<string[]> {
  try {
    const { data, error } = await supabaseUntyped
      .from("saved_profiles")
      .select("entity_id")
      .eq("owner_profile_id", ownerProfileId)
      .eq("entity_type", entityType);

    if (error) throw error;
    return (data || []).map((d) => d.entity_id).filter(Boolean);
  } catch (error) {
    console.error(`Error fetching saved ${entityType} IDs:`, error);
    return [];
  }
}

export default {
  getAllSavedProfiles,
  saveProfile,
  removeSavedProfile,
  isProfileSaved,
  getSavedProfileRecord,
  getSavedProfileIds,
};
