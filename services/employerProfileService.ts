/**
 * =====================================================
 * EMPLOYER PROFILE SERVICE
 * =====================================================
 * Service for managing employer profiles, company info, and logo
 * Created: 2025-10-28
 */

import { supabase } from "@/lib/supabase";
import type { Database } from "@/lib/database.types";

type Employer = Database["public"]["Tables"]["employers"]["Row"];
type EmployerUpdate = Database["public"]["Tables"]["employers"]["Update"];
type Profile = Database["public"]["Tables"]["profiles"]["Row"];

// ===================================================================
// TYPES
// ===================================================================

export interface EmployerProfileData extends Employer {
  profile: Profile;
}

export interface EmployerUpdateData {
  company_name?: string;
  kvk_number?: string;
  description?: string; // nie company_description
  industry?: string;
  company_size?: string;
  address?: string;
  postal_code?: string;
  city?: string;
  country?: string;
  latitude?: number | null;
  longitude?: number | null;
  contact_phone?: string; // nie phone
  contact_email?: string; // nie email
  contact_person?: string;
  website?: string;
  logo_url?: string;
  // Dutch company verification
  company_type?: string;
  btw_number?: string;
  rsin_number?: string;
  // Google links
  google_place_id?: string; // Link do opinii Google
  google_maps_url?: string; // Link do Google Maps
}

// ===================================================================
// PROFILE OPERATIONS
// ===================================================================

/**
 * Get complete employer profile with user data
 */
export async function getEmployerProfile(
  employerId: string
): Promise<EmployerProfileData | null> {
  try {
    console.log("📥 Fetching employer profile for:", employerId);

    const { data, error } = await supabase
      .from("employers")
      .select(
        `
        *,
        profile:profile_id(*)
      `
      )
      .eq("id", employerId)
      .single();

    if (error) {
      console.error("❌ Error fetching employer profile:", error);
      throw error;
    }

    if (!data) {
      console.warn("⚠️ Employer profile not found");
      return null;
    }

    console.log("✅ Employer profile fetched:", data.company_name);
    return data as EmployerProfileData;
  } catch (error) {
    console.error("❌ Failed to fetch employer profile:", error);
    return null;
  }
}

/**
 * Get employer by user_id (profile_id)
 */
export async function getEmployerByUserId(
  userId: string
): Promise<Employer | null> {
  try {
    console.log("📥 Fetching employer by user_id:", userId);

    const { data, error } = await supabase
      .from("employers")
      .select("*")
      .eq("profile_id", userId)
      .single();

    if (error) {
      console.error("❌ Error fetching employer by user_id:", error);
      throw error;
    }

    if (!data) {
      console.warn("⚠️ Employer not found for user_id:", userId);
      return null;
    }

    console.log("✅ Employer fetched:", data.company_name);
    return data;
  } catch (error) {
    console.error("❌ Failed to fetch employer:", error);
    return null;
  }
}

/**
 * Update employer profile
 */
export async function updateEmployerProfile(
  employerId: string,
  updateData: EmployerUpdateData
): Promise<boolean> {
  try {
    console.log("📝 Updating employer profile:", employerId);

    const { error } = await supabase
      .from("employers")
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", employerId);

    if (error) {
      console.error("❌ Error updating employer profile:", error);
      throw error;
    }

    console.log("✅ Employer profile updated successfully");
    return true;
  } catch (error) {
    console.error("❌ Failed to update employer profile:", error);
    return false;
  }
}

/**
 * Upload company logo to storage and update employer profile
 */
export async function uploadCompanyLogo(
  employerId: string,
  file: File
): Promise<string | null> {
  try {
    console.log("📤 Uploading company logo for employer:", employerId);

    // Validate file
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new Error("File size exceeds 5MB limit");
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/svg+xml",
    ];
    if (!allowedTypes.includes(file.type)) {
      throw new Error(
        "Invalid file type. Only JPEG, PNG, WebP, and SVG are allowed"
      );
    }

    // Generate unique filename
    const fileExt = file.name.split(".").pop();
    const fileName = `${employerId}/logo/${Date.now()}.${fileExt}`;

    // Upload to storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("company-logos")
      .upload(fileName, file, {
        upsert: true,
        contentType: file.type,
      });

    if (uploadError) {
      console.error("❌ Upload error:", uploadError);
      throw uploadError;
    }

    console.log("✅ Logo uploaded to storage:", fileName);

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("company-logos").getPublicUrl(fileName);

    console.log("✅ Public URL generated:", publicUrl);

    // Update employer profile with new logo URL
    const { error: updateError } = await supabase
      .from("employers")
      .update({
        logo_url: publicUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", employerId);

    if (updateError) {
      console.error("❌ Failed to update logo URL:", updateError);
      throw updateError;
    }

    console.log("✅ Employer logo URL updated in database");
    return publicUrl;
  } catch (error) {
    console.error("❌ Error uploading company logo:", error);
    return null;
  }
}

/**
 * Get public employer profile (as workers see it)
 */
export async function getPublicEmployerProfile(
  employerId: string
): Promise<Employer | null> {
  try {
    const { data, error } = await supabase
      .from("employers")
      .select("*")
      .eq("id", employerId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error fetching public employer profile:", error);
    return null;
  }
}

/**
 * Calculate profile completion percentage
 */
export function calculateProfileCompletion(employer: Employer): number {
  const fields = [
    employer.company_name,
    employer.kvk_number,
    employer.description,
    employer.industry,
    employer.company_size,
    employer.address,
    employer.city,
    employer.country,
    employer.contact_phone,
    employer.contact_email,
    employer.website,
    employer.logo_url,
  ];

  const filledFields = fields.filter((field) => {
    if (typeof field === "string") return field.trim().length > 0;
    return field !== null && field !== undefined;
  }).length;

  return Math.round((filledFields / fields.length) * 100);
}

/**
 * Delete company logo
 */
export async function deleteCompanyLogo(
  employerId: string,
  logoPath: string
): Promise<boolean> {
  try {
    // Extract file path from URL
    const path = logoPath.split("/company-logos/")[1];
    if (!path) {
      throw new Error("Invalid logo path");
    }

    // Delete from storage
    const { error: deleteError } = await supabase.storage
      .from("company-logos")
      .remove([path]);

    if (deleteError) throw deleteError;

    // Update employer profile
    const { error: updateError } = await supabase
      .from("employers")
      .update({
        logo_url: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", employerId);

    if (updateError) throw updateError;

    console.log("✅ Logo deleted successfully");
    return true;
  } catch (error) {
    console.error("❌ Error deleting logo:", error);
    return false;
  }
}

// Export default object
const employerProfileService = {
  getEmployerProfile,
  getEmployerByUserId,
  updateEmployerProfile,
  uploadCompanyLogo,
  getPublicEmployerProfile,
  calculateProfileCompletion,
  deleteCompanyLogo,
};

export default employerProfileService;
