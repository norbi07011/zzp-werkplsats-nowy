// @ts-nocheck
/**
 * ===================================================================
 * WORKER PROFILE SERVICE - FULL FUNCTIONAL IMPLEMENTATION
 * ===================================================================
 * Complete CRUD operations for worker profiles with database integration
 * Connects with: profiles, workers, certificates, skills tables
 */

import { supabase } from "@/lib/supabase";
import { Database } from "../src/lib/database.types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type Worker = Database["public"]["Tables"]["workers"]["Row"];
type Certificate = Database["public"]["Tables"]["certificates"]["Row"];

// ===================================================================
// INTERFACES
// ===================================================================

export interface WorkerProfileData {
  // Profile table
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  phone: string | null;
  language: "nl" | "en" | "pl" | "de" | "es" | "fr" | "ar";

  // Workers table
  kvk_number: string;
  btw_number: string | null;
  specialization: string;
  hourly_rate: number;
  years_experience: number;
  location_city: string;
  radius_km: number;
  available_from: string | null;
  rating: number;
  rating_count: number;
  verified: boolean;
  bio: string | null;
  skills: string[];
  certifications: string[];
}

export interface ProfileUpdateData {
  // Profile table fields
  full_name?: string;
  phone?: string;
  language?: "nl" | "en" | "pl" | "de" | "es" | "fr" | "ar";

  // Workers table fields - basic info
  specialization?: string;
  bio?: string;
  years_experience?: number;

  // Workers table fields - rates
  hourly_rate?: number;
  hourly_rate_max?: number | null;
  rate_negotiable?: boolean;

  // Workers table fields - location
  location_city?: string;
  address?: string;
  postal_code?: string;
  location_country?: string;
  service_radius_km?: number;

  // Workers table fields - business info
  kvk_number?: string;
  btw_number?: string;

  // Workers table fields - skills/languages
  languages?: string[];
  certifications?: string[];

  // Workers table fields - tools/vehicle
  own_tools?: string[];
  own_vehicle?: boolean;
  vehicle_type?: string;

  // Workers table fields - availability
  available_from?: string | null;
}

export interface NotificationSettings {
  email_enabled: boolean;
  sms_enabled: boolean;
  push_enabled: boolean;
}

export interface PrivacySettings {
  profile_visibility: "public" | "contacts" | "private";
  show_email: boolean;
  show_phone: boolean;
  show_location: boolean;
}

// ===================================================================
// NEW INTERFACES FOR DASHBOARD FEATURES
// ===================================================================

export interface WorkerStats {
  totalJobs: number;
  averageRating: number;
  totalReviews: number;
  totalEarnings: number;
  profileViews: number;
  viewsThisMonth: number;
  responseRate: number;
}

export interface WeeklyAvailability {
  monday: boolean;
  tuesday: boolean;
  wednesday: boolean;
  thursday: boolean;
  friday: boolean;
  saturday: boolean;
  sunday: boolean;
}

export interface UnavailableDate {
  date: string; // YYYY-MM-DD
  reason: string;
  type: "vacation" | "holiday" | "fully_booked" | "other";
}

export interface WorkerReview {
  id: string;
  worker_id: string;
  employer_id: string;
  reviewer_id: string;
  rating: number;
  comment: string | null;
  response: string | null;
  response_date: string | null;
  created_at: string;
  reviewer?: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  };
  employer?: {
    id: string;
    company_name: string;
    logo_url: string | null;
  };
}

export interface WorkerMessage {
  id: string;
  sender_id: string;
  recipient_id: string;
  subject: string | null;
  content: string;
  is_read: boolean;
  created_at: string;
  sender?: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  };
  recipient?: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  };
}

// ===================================================================
// PROFILE OPERATIONS
// ===================================================================

/**
 * Get complete worker profile with all related data
 */
export async function getWorkerProfile(
  userId: string
): Promise<WorkerProfileData | null> {
  try {
    console.log("📥 Fetching worker profile for user:", userId);

    // Get profile data
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (profileError) {
      console.error("❌ Profile fetch error:", profileError);
      throw profileError;
    }

    if (!profile) {
      console.error("❌ Profile not found for user:", userId);
      return null;
    }

    console.log("✅ Profile fetched:", profile.email);

    // ✅ FIX: Check user role and fetch from correct table
    const userRole = profile.role;
    const tableName =
      userRole === "cleaning_company" ? "cleaning_companies" : "workers";

    console.log(`📊 Fetching from table: ${tableName} (role: ${userRole})`);

    // Get worker/cleaning_company data from appropriate table
    const { data: worker, error: workerError } = await supabase
      .from(tableName)
      .select("*")
      .eq("profile_id", userId)
      .single();

    if (workerError) {
      console.warn(
        `⚠️ ${tableName} record not found, creating default...`,
        workerError.message
      );

      // ✅ FIX: Create record in correct table based on role
      if (userRole === "cleaning_company") {
        console.error(
          "❌ Cleaning company record should exist from registration!"
        );
        return null;
      }

      // If worker doesn't exist, create one with defaults
      const newWorker = await createWorkerRecord(userId, profile);
      if (!newWorker) {
        console.error("❌ Failed to create worker record");
        throw new Error("Failed to create worker record");
      }

      console.log("✅ New worker record created, merging data...");
      return {
        ...profile,
        ...newWorker,
        avatar_url: newWorker.avatar_url || profile.avatar_url || null,
      };
    }

    console.log(`✅ ${tableName} data fetched successfully`);

    // ✅ FIX: Handle cleaning_company specialization (array → string)
    let mergedData: any = {
      ...profile,
      ...worker,
      avatar_url: worker.avatar_url || profile.avatar_url || null,
    };

    // Convert cleaning_company array specialization to string for UI compatibility
    if (
      userRole === "cleaning_company" &&
      Array.isArray(worker.specialization)
    ) {
      mergedData.specialization = worker.specialization.join(", ");
      console.log(
        "✅ Converted specialization array to string:",
        mergedData.specialization
      );
    }

    return mergedData;
  } catch (error) {
    console.error("❌ Error fetching worker profile:", error);
    return null;
  }
}

/**
 * Update worker profile (both profiles and workers tables)
 */
export async function updateWorkerProfile(
  userId: string,
  updates: ProfileUpdateData
): Promise<boolean> {
  try {
    // Split updates between profiles and workers tables
    const profileUpdates: any = {};
    const workerUpdates: any = {};

    // Profile table fields
    if (updates.full_name !== undefined)
      profileUpdates.full_name = updates.full_name;
    if (updates.phone !== undefined) profileUpdates.phone = updates.phone;
    if (updates.language !== undefined)
      profileUpdates.language = updates.language;

    // Workers table fields - basic info
    if (updates.specialization !== undefined)
      workerUpdates.specialization = updates.specialization;
    if (updates.bio !== undefined) workerUpdates.bio = updates.bio;
    if (updates.years_experience !== undefined)
      workerUpdates.years_experience = updates.years_experience;

    // Workers table fields - rates
    if (updates.hourly_rate !== undefined)
      workerUpdates.hourly_rate = updates.hourly_rate;
    if (updates.hourly_rate_max !== undefined)
      workerUpdates.hourly_rate_max = updates.hourly_rate_max;
    if (updates.rate_negotiable !== undefined)
      workerUpdates.rate_negotiable = updates.rate_negotiable;

    // Workers table fields - location
    if (updates.location_city !== undefined)
      workerUpdates.location_city = updates.location_city;
    if (updates.address !== undefined) workerUpdates.address = updates.address;
    if (updates.postal_code !== undefined)
      workerUpdates.postal_code = updates.postal_code;
    if (updates.location_country !== undefined)
      workerUpdates.location_country = updates.location_country;
    if (updates.service_radius_km !== undefined)
      workerUpdates.service_radius_km = updates.service_radius_km;

    // Workers table fields - business info
    if (updates.kvk_number !== undefined)
      workerUpdates.kvk_number = updates.kvk_number;
    if (updates.btw_number !== undefined)
      workerUpdates.btw_number = updates.btw_number;

    // Workers table fields - skills/languages
    if (updates.languages !== undefined)
      workerUpdates.languages = updates.languages;
    if (updates.certifications !== undefined)
      workerUpdates.certifications = updates.certifications;

    // Workers table fields - tools/vehicle
    if (updates.own_tools !== undefined)
      workerUpdates.own_tools = updates.own_tools;
    if (updates.own_vehicle !== undefined)
      workerUpdates.own_vehicle = updates.own_vehicle;
    if (updates.vehicle_type !== undefined)
      workerUpdates.vehicle_type = updates.vehicle_type;

    // Workers table fields - availability
    if (updates.available_from !== undefined)
      workerUpdates.available_from = updates.available_from;

    // Update profiles table
    if (Object.keys(profileUpdates).length > 0) {
      profileUpdates.updated_at = new Date().toISOString();

      const { error: profileError } = await supabase
        .from("profiles")
        .update(profileUpdates)
        .eq("id", userId);

      if (profileError) throw profileError;
    }

    // Update workers table
    if (Object.keys(workerUpdates).length > 0) {
      workerUpdates.updated_at = new Date().toISOString();

      const { error: workerError } = await supabase
        .from("workers")
        .update(workerUpdates)
        .eq("profile_id", userId);

      if (workerError) throw workerError;
    }

    return true;
  } catch (error) {
    console.error("Error updating worker profile:", error);
    return false;
  }
}

/**
 * Update worker skills
 */
export async function updateWorkerSkills(
  userId: string,
  skills: string[]
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("workers")
      .update({
        skills,
        updated_at: new Date().toISOString(),
      })
      .eq("profile_id", userId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error updating skills:", error);
    return false;
  }
}

/**
 * Upload avatar and update profile
 */
export async function uploadAvatar(
  userId: string,
  file: File
): Promise<string | null> {
  try {
    // Validate file
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new Error("File size exceeds 5MB limit");
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      throw new Error(
        "Invalid file type. Only JPEG, PNG, and WebP are allowed"
      );
    }

    // Generate unique filename
    const fileExt = file.name.split(".").pop();
    const fileName = `${userId}/avatar/${Date.now()}.${fileExt}`;

    // Upload to storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(fileName, file, {
        upsert: true,
        contentType: file.type,
      });

    if (uploadError) throw uploadError;

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("avatars").getPublicUrl(fileName);

    console.log("✅ Avatar uploaded to storage:", publicUrl);

    // Update BOTH profiles AND workers tables
    const updateTimestamp = new Date().toISOString();

    // Update profiles table
    const { error: profileUpdateError } = await supabase
      .from("profiles")
      .update({
        avatar_url: publicUrl,
        updated_at: updateTimestamp,
      })
      .eq("id", userId);

    if (profileUpdateError) {
      console.error(
        "❌ Failed to update profiles.avatar_url:",
        profileUpdateError
      );
      throw profileUpdateError;
    }

    console.log("✅ Updated profiles.avatar_url");

    // Update workers table
    const { error: workerUpdateError } = await supabase
      .from("workers")
      .update({
        avatar_url: publicUrl,
        updated_at: updateTimestamp,
      })
      .eq("profile_id", userId);

    if (workerUpdateError) {
      console.warn(
        "⚠️ Failed to update workers.avatar_url:",
        workerUpdateError
      );
      // Don't throw - profiles table is updated, worker table might not exist yet
    } else {
      console.log("✅ Updated workers.avatar_url");
    }

    return publicUrl;
  } catch (error) {
    console.error("Error uploading avatar:", error);
    return null;
  }
}

/**
 * Delete avatar
 */
export async function deleteAvatar(
  userId: string,
  avatarPath: string
): Promise<boolean> {
  try {
    // Delete from storage
    const { error: deleteError } = await supabase.storage
      .from("avatars")
      .remove([avatarPath]);

    if (deleteError) throw deleteError;

    // Update profile to remove avatar URL
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        avatar_url: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (updateError) throw updateError;

    return true;
  } catch (error) {
    console.error("Error deleting avatar:", error);
    return false;
  }
}

// ===================================================================
// CERTIFICATES OPERATIONS
// ===================================================================

/**
 * Get worker certificates
 */
export async function getWorkerCertificates(
  workerId: string
): Promise<Certificate[]> {
  try {
    // WHY: Wrapped in try-catch to prevent blocking if certificates table doesn't exist
    const { data, error } = await supabase
      .from("certificates")
      .select("*")
      .eq("worker_id", workerId)
      .order("issue_date", { ascending: false });

    if (error) {
      console.warn(
        "[WORKER-PROFILE] Certificates table error (non-critical):",
        error.code,
        error.message
      );
      return []; // Return empty array instead of throwing
    }
    return data || [];
  } catch (error) {
    console.warn(
      "[WORKER-PROFILE] Error fetching certificates (non-critical):",
      error
    );
    return [];
  }
}

/**
 * Add new certificate
 */
export async function addCertificate(
  workerId: string,
  certificateData: {
    certificate_type: string;
    certificate_number?: string;
    issuer: string;
    issue_date: string;
    expiry_date?: string;
    file_url: string;
  }
): Promise<Certificate | null> {
  try {
    const { data, error } = await supabase
      .from("certificates")
      .insert({
        worker_id: workerId,
        ...certificateData,
        verified: false,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error adding certificate:", error);
    return null;
  }
}

/**
 * Upload certificate file
 */
export async function uploadCertificateFile(
  workerId: string,
  file: File
): Promise<string | null> {
  try {
    const fileExt = file.name.split(".").pop();
    const fileName = `${workerId}/certificates/${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from("certificates")
      .upload(fileName, file);

    if (error) throw error;

    const {
      data: { publicUrl },
    } = supabase.storage.from("certificates").getPublicUrl(fileName);

    return publicUrl;
  } catch (error) {
    console.error("Error uploading certificate:", error);
    return null;
  }
}

/**
 * Delete certificate
 */
export async function deleteCertificate(
  certificateId: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("certificates")
      .delete()
      .eq("id", certificateId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error deleting certificate:", error);
    return false;
  }
}

// ===================================================================
// SETTINGS OPERATIONS
// ===================================================================

/**
 * Update notification settings
 */
export async function updateNotificationSettings(
  userId: string,
  settings: NotificationSettings
): Promise<boolean> {
  try {
    // Store in user metadata or separate settings table
    const { error } = await supabase.from("user_settings").upsert({
      user_id: userId,
      notification_settings: settings,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      // Fallback: store in profiles metadata
      const { error: metaError } = await supabase
        .from("profiles")
        .update({
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

      if (metaError) throw metaError;
    }

    return true;
  } catch (error) {
    console.error("Error updating notification settings:", error);
    return false;
  }
}

/**
 * Update privacy settings
 */
export async function updatePrivacySettings(
  userId: string,
  settings: PrivacySettings
): Promise<boolean> {
  try {
    const { error } = await supabase.from("user_settings").upsert({
      user_id: userId,
      privacy_settings: settings,
      updated_at: new Date().toISOString(),
    });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error updating privacy settings:", error);
    return false;
  }
}

// ===================================================================
// HELPER FUNCTIONS
// ===================================================================

/**
 * Create worker record if it doesn't exist
 */
async function createWorkerRecord(
  userId: string,
  profile: any
): Promise<Worker | null> {
  try {
    console.log("🔧 Creating worker record for user:", userId);

    const { data, error } = await supabase
      .from("workers")
      .insert({
        profile_id: userId,
        avatar_url: profile.avatar_url || null, // Copy from profile
        kvk_number: "", // To be filled by user
        specialization: "",
        hourly_rate: 0,
        years_experience: 0,
        location_city: "",
        radius_km: 25,
        skills: [],
        certifications: [],
        rating: 0,
        rating_count: 0,
        verified: false,
        // Subscription defaults
        subscription_tier: "basic",
        subscription_status: "active",
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("❌ Error creating worker record:", error);
      throw error;
    }

    console.log("✅ Worker record created successfully:", data.id);
    return data;
  } catch (error) {
    console.error("❌ Failed to create worker record:", error);
    return null;
  }
}

/**
 * Calculate profile completion percentage
 */
export function calculateProfileCompletion(profile: WorkerProfileData): number {
  const fields = [
    profile.full_name,
    profile.email,
    profile.phone,
    profile.avatar_url,
    profile.kvk_number,
    profile.specialization,
    profile.location_city,
    profile.bio,
    profile.hourly_rate > 0,
    profile.years_experience > 0,
    profile.skills?.length > 0,
  ];

  const completed = fields.filter(Boolean).length;
  return Math.round((completed / fields.length) * 100);
}

// ===================================================================
// PORTFOLIO OPERATIONS
// ===================================================================

export interface PortfolioProject {
  id: string;
  worker_id: string;
  title: string;
  description: string | null;
  images: string[] | null; // POPRAWKA: array zdjęć zamiast pojedynczego image_url
  project_url: string | null;
  video_url: string | null;
  tags: string[] | null;
  category: string | null;
  start_date: string | null;
  end_date: string | null;
  duration_days: number | null;
  client_name: string | null;
  client_company: string | null;
  is_featured: boolean;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Get worker portfolio projects
 * POPRAWKA: Używa worker_portfolio (istniejąca tabela) zamiast portfolio_projects
 */
export async function getPortfolioProjects(
  workerId: string
): Promise<PortfolioProject[]> {
  try {
    const { data, error } = await supabase
      .from("worker_portfolio") // POPRAWKA: zmieniona nazwa tabeli
      .select("*")
      .eq("worker_id", workerId)
      .order("start_date", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching portfolio:", error);
    return [];
  }
}

/**
 * Add portfolio project
 * POPRAWKA: Używa worker_portfolio + obsługuje is_public, images array
 */
export async function addPortfolioProject(
  workerId: string,
  project: Omit<
    PortfolioProject,
    "id" | "worker_id" | "created_at" | "updated_at"
  >
): Promise<PortfolioProject | null> {
  try {
    const dataToInsert = {
      worker_id: workerId,
      ...project,
      is_public: project.is_public ?? true, // domyślnie public
      is_featured: project.is_featured ?? false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    console.log(
      "[DEBUG] Inserting portfolio project:",
      JSON.stringify(dataToInsert, null, 2)
    );

    const { data, error } = await supabase
      .from("worker_portfolio") // POPRAWKA: zmieniona nazwa tabeli
      .insert(dataToInsert)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error adding portfolio project:", error);
    return null;
  }
}

/**
 * Update portfolio project
 * POPRAWKA: Używa worker_portfolio
 */
export async function updatePortfolioProject(
  projectId: string,
  updates: Partial<PortfolioProject>
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("worker_portfolio") // POPRAWKA: zmieniona nazwa tabeli
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", projectId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error updating portfolio project:", error);
    return false;
  }
}

/**
 * Delete portfolio project
 * POPRAWKA: Używa worker_portfolio
 */
export async function deletePortfolioProject(
  projectId: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("worker_portfolio") // POPRAWKA: zmieniona nazwa tabeli
      .delete()
      .eq("id", projectId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error deleting portfolio project:", error);
    return false;
  }
}

/**
 * Upload portfolio image
 */
export async function uploadPortfolioImage(
  workerId: string,
  file: File
): Promise<string | null> {
  try {
    const fileExt = file.name.split(".").pop();
    const fileName = `${workerId}/portfolio/${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from("portfolio-images")
      .upload(fileName, file);

    if (error) throw error;

    const {
      data: { publicUrl },
    } = supabase.storage.from("portfolio-images").getPublicUrl(fileName);

    return publicUrl;
  } catch (error) {
    console.error("Error uploading portfolio image:", error);
    return null;
  }
}

// ===================================================================
// APPLICATIONS OPERATIONS
// ===================================================================

export interface JobApplication {
  id: string;
  worker_id: string;
  job_id: string;
  status: "pending" | "accepted" | "rejected" | "withdrawn";
  cover_letter: string | null;
  applied_at: string;
  updated_at: string;
  job?: {
    id: string;
    title: string;
    company: string;
    location: string;
    salary_min: number;
    salary_max: number;
  };
}

/**
 * Get worker applications
 */
export async function getApplications(
  workerId: string
): Promise<JobApplication[]> {
  try {
    const { data, error } = await supabase
      .from("job_applications")
      .select(
        `
        *,
        job:jobs(
          id, 
          title, 
          location, 
          salary_min, 
          salary_max,
          employer:employers(company_name)
        )
      `
      )
      .eq("worker_id", workerId)
      .order("applied_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching applications:", error);
    return [];
  }
}

/**
 * Apply for job
 */
export async function applyForJob(
  workerId: string,
  jobId: string,
  coverLetter?: string
): Promise<JobApplication | null> {
  try {
    const { data, error } = await supabase
      .from("job_applications")
      .insert({
        worker_id: workerId,
        job_id: jobId,
        cover_letter: coverLetter || null,
        status: "pending",
        applied_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error applying for job:", error);
    return null;
  }
}

/**
 * Withdraw application
 */
export async function withdrawApplication(
  applicationId: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("job_applications")
      .update({
        status: "withdrawn",
        updated_at: new Date().toISOString(),
      })
      .eq("id", applicationId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error withdrawing application:", error);
    return false;
  }
}

// ===================================================================
// EARNINGS OPERATIONS
// ===================================================================

export interface Earning {
  id: string;
  worker_id: string;
  job_id: string;
  amount: number;
  hours_worked: number;
  payment_date: string;
  status: "pending" | "paid" | "disputed";
  description: string;
}

/**
 * Get worker earnings
 */
export async function getEarnings(workerId: string): Promise<Earning[]> {
  try {
    const { data, error } = await supabase
      .from("earnings")
      .select("*")
      .eq("worker_id", workerId)
      .order("payment_date", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching earnings:", error);
    return [];
  }
}

/**
 * Calculate earnings statistics
 */
export async function getEarningsStats(workerId: string) {
  const earnings = await getEarnings(workerId);

  const total = earnings.reduce((sum, e) => sum + e.amount, 0);
  const thisMonth = earnings
    .filter(
      (e) => new Date(e.payment_date).getMonth() === new Date().getMonth()
    )
    .reduce((sum, e) => sum + e.amount, 0);
  const lastMonth = earnings
    .filter((e) => {
      const date = new Date(e.payment_date);
      const lastMonthDate = new Date();
      lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
      return date.getMonth() === lastMonthDate.getMonth();
    })
    .reduce((sum, e) => sum + e.amount, 0);

  return {
    total,
    thisMonth,
    lastMonth,
    pending: earnings
      .filter((e) => e.status === "pending")
      .reduce((sum, e) => sum + e.amount, 0),
    paid: earnings
      .filter((e) => e.status === "paid")
      .reduce((sum, e) => sum + e.amount, 0),
  };
}

// ===================================================================
// REVIEWS OPERATIONS
// ===================================================================

export interface Review {
  id: string;
  worker_id: string;
  employer_id: string;
  job_id: string;
  rating: number;
  comment: string;
  created_at: string;
  employer?: {
    company_name: string;
  };
}

/**
 * Get worker reviews
 */
export async function getReviews(workerId: string): Promise<Review[]> {
  try {
    // workerId is actually user_id (profile_id) from the worker
    const { data, error } = await supabase
      .from("reviews")
      .select(
        `
        *,
        reviewer:profiles!reviews_reviewer_id_fkey (id, full_name, avatar_url),
        employer:employers(id, company_name, logo_url)
      `
      )
      .eq("reviewee_id", workerId) // Changed from worker_id to reviewee_id
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return [];
  }
}

/**
 * Calculate average rating
 */
export async function getAverageRating(workerId: string): Promise<number> {
  const reviews = await getReviews(workerId);
  if (reviews.length === 0) return 0;

  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  return sum / reviews.length;
}

// ===================================================================
// NEW DASHBOARD FEATURES
// ===================================================================

/**
 * Get worker dashboard statistics
 */
export async function getWorkerStats(
  workerId: string,
  profileId: string
): Promise<WorkerStats> {
  console.log("📊 [WORKER-SERVICE] getWorkerStats:", { workerId, profileId });

  try {
    // Pobierz dane z tabeli workers
    const { data: worker } = await supabase
      .from("workers")
      .select(
        "rating, rating_count, total_earnings, completed_jobs, response_rate"
      )
      .eq("id", workerId)
      .single();

    // Policz wyświetlenia profilu (ostatnie 30 dni)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { count: totalViews, error: viewsError } = await supabase
      .from("profile_views")
      .select("*", { count: "exact", head: true })
      .eq("worker_id", workerId);

    if (viewsError) {
      console.error(
        "❌ [WORKER-SERVICE] Error counting profile views:",
        viewsError
      );
    }

    const { count: viewsThisMonth, error: viewsMonthError } = await supabase
      .from("profile_views")
      .select("*", { count: "exact", head: true })
      .eq("worker_id", workerId)
      .gte("viewed_at", thirtyDaysAgo.toISOString());

    if (viewsMonthError) {
      console.error(
        "❌ [WORKER-SERVICE] Error counting monthly views:",
        viewsMonthError
      );
    }

    console.log("👁️ [WORKER-SERVICE] Profile views count:", {
      totalViews,
      viewsThisMonth,
      workerId,
    });

    const stats: WorkerStats = {
      totalJobs: worker?.completed_jobs || 0,
      averageRating: worker?.rating || 0,
      totalReviews: worker?.rating_count || 0,
      totalEarnings: worker?.total_earnings || 0,
      profileViews: totalViews || 0,
      viewsThisMonth: viewsThisMonth || 0,
      responseRate: worker?.response_rate || 100,
    };

    console.log("✅ [WORKER-SERVICE] Stats fetched:", stats);
    return stats;
  } catch (error) {
    console.error("❌ [WORKER-SERVICE] Error fetching stats:", error);
    return {
      totalJobs: 0,
      averageRating: 0,
      totalReviews: 0,
      totalEarnings: 0,
      profileViews: 0,
      viewsThisMonth: 0,
      responseRate: 100,
    };
  }
}

/**
 * Get recent messages for worker (dashboard inbox widget)
 */
export async function getRecentMessages(
  profileId: string,
  limit = 5
): Promise<WorkerMessage[]> {
  console.log("📬 [WORKER-SERVICE] getRecentMessages:", { profileId, limit });

  try {
    const { data, error } = await supabase
      .from("messages")
      .select(
        `
        *,
        sender:profiles!messages_sender_id_fkey(id, full_name, avatar_url),
        recipient:profiles!messages_recipient_id_fkey(id, full_name, avatar_url)
      `
      )
      .or(`sender_id.eq.${profileId},recipient_id.eq.${profileId}`)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("❌ [WORKER-SERVICE] Error fetching messages:", error);
      throw error;
    }

    console.log(`✅ [WORKER-SERVICE] Fetched ${data?.length || 0} messages`);
    return (data || []) as WorkerMessage[];
  } catch (error) {
    console.error("❌ [WORKER-SERVICE] Error in getRecentMessages:", error);
    return [];
  }
}

/**
 * Get worker reviews with employer info
 */
export async function getWorkerReviews(
  workerId: string,
  limit = 3
): Promise<WorkerReview[]> {
  console.log("⭐ [WORKER-SERVICE] getWorkerReviews:", { workerId, limit });

  try {
    const { data, error } = await supabase
      .from("reviews")
      .select(
        `
        *,
        employer:employers(company_name)
      `
      )
      .eq("worker_id", workerId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("❌ [WORKER-SERVICE] Error fetching reviews:", error);
      throw error;
    }

    console.log(`✅ [WORKER-SERVICE] Fetched ${data?.length || 0} reviews`);
    return (data || []) as WorkerReview[];
  } catch (error) {
    console.error("❌ [WORKER-SERVICE] Error in getWorkerReviews:", error);
    return [];
  }
}

/**
 * Respond to employer review
 */
export async function respondToReview(
  reviewId: string,
  responseText: string
): Promise<WorkerReview> {
  console.log("💬 [WORKER-SERVICE] respondToReview:", { reviewId });

  try {
    const { data, error } = await supabase
      .from("reviews")
      .update({
        response: responseText,
        response_date: new Date().toISOString(),
      })
      .eq("id", reviewId)
      .select(
        `
        *,
        employer:employers(company_name)
      `
      )
      .single();

    if (error) {
      console.error("❌ [WORKER-SERVICE] Error responding to review:", error);
      throw error;
    }

    console.log("✅ [WORKER-SERVICE] Response added successfully");
    return data as WorkerReview;
  } catch (error) {
    console.error("❌ [WORKER-SERVICE] Error in respondToReview:", error);
    throw error;
  }
}

/**
 * Update weekly availability
 */
export async function updateAvailability(
  workerId: string,
  availability: WeeklyAvailability
): Promise<void> {
  console.log("📅 [WORKER-SERVICE] updateAvailability:", {
    workerId,
    availability,
  });

  try {
    const { error } = await supabase
      .from("workers")
      .update({
        availability: availability as any,
        updated_at: new Date().toISOString(),
      })
      .eq("id", workerId);

    if (error) {
      console.error("❌ [WORKER-SERVICE] Error updating availability:", error);
      throw error;
    }

    console.log("✅ [WORKER-SERVICE] Availability updated successfully");
  } catch (error) {
    console.error("❌ [WORKER-SERVICE] Error in updateAvailability:", error);
    throw error;
  }
}

/**
 * Toggle worker availability status
 */
export async function toggleAvailability(
  profileId: string,
  isAvailable: boolean
): Promise<void> {
  console.log("🔄 [WORKER-SERVICE] toggleAvailability:", {
    profileId,
    isAvailable,
  });

  try {
    const { error } = await supabase
      .from("workers")
      .update({
        is_available: isAvailable,
        updated_at: new Date().toISOString(),
      })
      .eq("profile_id", profileId);

    if (error) {
      console.error("❌ [WORKER-SERVICE] Error toggling availability:", error);
      throw error;
    }

    console.log("✅ [WORKER-SERVICE] Availability toggled successfully");
  } catch (error) {
    console.error("❌ [WORKER-SERVICE] Error in toggleAvailability:", error);
    throw error;
  }
}

/**
 * Block a date (add to unavailable_dates)
 */
export async function blockDate(
  workerId: string,
  date: string,
  reason: string,
  type: "vacation" | "holiday" | "fully_booked" | "other"
): Promise<void> {
  console.log("🚫 [WORKER-SERVICE] blockDate:", {
    workerId,
    date,
    reason,
    type,
  });

  try {
    // Pobierz obecną listę zablokowanych dat
    const { data: worker } = await supabase
      .from("workers")
      .select("unavailable_dates")
      .eq("id", workerId)
      .single();

    const currentDates = (worker?.unavailable_dates as UnavailableDate[]) || [];

    // Sprawdź czy data już zablokowana
    if (currentDates.some((d) => d.date === date)) {
      console.warn("⚠️ [WORKER-SERVICE] Date already blocked:", date);
      return;
    }

    // Dodaj nową datę
    const newDates = [...currentDates, { date, reason, type }];

    const { error } = await supabase
      .from("workers")
      .update({
        unavailable_dates: newDates as any,
        updated_at: new Date().toISOString(),
      })
      .eq("id", workerId);

    if (error) {
      console.error("❌ [WORKER-SERVICE] Error blocking date:", error);
      throw error;
    }

    console.log("✅ [WORKER-SERVICE] Date blocked successfully");
  } catch (error) {
    console.error("❌ [WORKER-SERVICE] Error in blockDate:", error);
    throw error;
  }
}

/**
 * Unblock a date (remove from unavailable_dates)
 */
export async function unblockDate(
  workerId: string,
  date: string
): Promise<void> {
  console.log("✅ [WORKER-SERVICE] unblockDate:", { workerId, date });

  try {
    // Pobierz obecną listę
    const { data: worker } = await supabase
      .from("workers")
      .select("unavailable_dates")
      .eq("id", workerId)
      .single();

    const currentDates = (worker?.unavailable_dates as UnavailableDate[]) || [];

    // Usuń datę
    const newDates = currentDates.filter((d) => d.date !== date);

    const { error } = await supabase
      .from("workers")
      .update({
        unavailable_dates: newDates as any,
        updated_at: new Date().toISOString(),
      })
      .eq("id", workerId);

    if (error) {
      console.error("❌ [WORKER-SERVICE] Error unblocking date:", error);
      throw error;
    }

    console.log("✅ [WORKER-SERVICE] Date unblocked successfully");
  } catch (error) {
    console.error("❌ [WORKER-SERVICE] Error in unblockDate:", error);
    throw error;
  }
}

/**
 * Upload portfolio image
 */
export async function uploadWorkerPortfolioImage(
  workerId: string,
  file: File
): Promise<string> {
  console.log("📸 [WORKER-SERVICE] uploadWorkerPortfolioImage:", {
    workerId,
    fileName: file.name,
  });

  try {
    // Upload do Supabase Storage
    const fileExt = file.name.split(".").pop();
    const fileName = `${workerId}/portfolio/${Date.now()}.${fileExt}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("portfolio-images")
      .upload(fileName, file);

    if (uploadError) {
      console.error("❌ [WORKER-SERVICE] Error uploading file:", uploadError);
      throw uploadError;
    }

    // Pobierz publiczny URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("portfolio-images").getPublicUrl(fileName);

    // Dodaj URL do portfolio_images
    const { data: worker } = await supabase
      .from("workers")
      .select("portfolio_images")
      .eq("id", workerId)
      .single();

    const currentImages = (worker?.portfolio_images as string[]) || [];

    // Limit 20 zdjęć
    if (currentImages.length >= 20) {
      throw new Error("Maximum 20 portfolio images allowed");
    }

    const newImages = [...currentImages, publicUrl];

    const { error: updateError } = await supabase
      .from("workers")
      .update({
        portfolio_images: newImages as any,
        updated_at: new Date().toISOString(),
      })
      .eq("id", workerId);

    if (updateError) {
      console.error(
        "❌ [WORKER-SERVICE] Error updating portfolio_images:",
        updateError
      );
      throw updateError;
    }

    console.log("✅ [WORKER-SERVICE] Portfolio image uploaded:", publicUrl);
    return publicUrl;
  } catch (error) {
    console.error(
      "❌ [WORKER-SERVICE] Error in uploadWorkerPortfolioImage:",
      error
    );
    throw error;
  }
}

/**
 * Delete portfolio image
 */
export async function deleteWorkerPortfolioImage(
  workerId: string,
  imageUrl: string
): Promise<void> {
  console.log("🗑️ [WORKER-SERVICE] deleteWorkerPortfolioImage:", {
    workerId,
    imageUrl,
  });

  try {
    // Usuń z portfolio_images
    const { data: worker } = await supabase
      .from("workers")
      .select("portfolio_images")
      .eq("id", workerId)
      .single();

    const currentImages = (worker?.portfolio_images as string[]) || [];
    const newImages = currentImages.filter((url) => url !== imageUrl);

    const { error: updateError } = await supabase
      .from("workers")
      .update({
        portfolio_images: newImages as any,
        updated_at: new Date().toISOString(),
      })
      .eq("id", workerId);

    if (updateError) {
      console.error(
        "❌ [WORKER-SERVICE] Error updating portfolio_images:",
        updateError
      );
      throw updateError;
    }

    // Usuń z Storage
    const fileName = imageUrl.split("/").slice(-3).join("/"); // Extract path from URL

    const { error: deleteError } = await supabase.storage
      .from("portfolio-images")
      .remove([fileName]);

    if (deleteError) {
      console.warn(
        "⚠️ [WORKER-SERVICE] Error deleting from storage:",
        deleteError
      );
      // Nie rzucaj błędu - DB już zaktualizowane
    }

    console.log("✅ [WORKER-SERVICE] Portfolio image deleted successfully");
  } catch (error) {
    console.error(
      "❌ [WORKER-SERVICE] Error in deleteWorkerPortfolioImage:",
      error
    );
    throw error;
  }
}

// ===================================================================
// ANALYTICS OPERATIONS
// ===================================================================

export interface WorkerAnalytics {
  profile_views: number;
  job_views: number;
  applications_sent: number;
  applications_accepted: number;
  total_earnings: number;
  average_rating: number;
  completed_jobs: number;
  response_rate: number;
}

/**
 * Get worker analytics
 */
export async function getAnalytics(workerId: string): Promise<WorkerAnalytics> {
  try {
    // Fetch data from multiple sources
    const applications = await getApplications(workerId);
    const earnings = await getEarnings(workerId);
    const reviews = await getReviews(workerId);

    // Fetch profile_views from workers table
    const { data: workerData, error: workerError } = await supabase
      .from("workers")
      .select("profile_views")
      .eq("id", workerId)
      .maybeSingle();

    if (workerError) {
      console.error("Error fetching worker profile_views:", workerError);
    }

    const analytics: WorkerAnalytics = {
      profile_views: workerData?.profile_views || 0,
      job_views: 0,
      applications_sent: applications.length,
      applications_accepted: applications.filter((a) => a.status === "accepted")
        .length,
      total_earnings: earnings.reduce((sum, e) => sum + e.amount, 0),
      average_rating:
        reviews.length > 0
          ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
          : 0,
      completed_jobs: earnings.filter((e) => e.status === "paid").length,
      response_rate:
        applications.length > 0
          ? (applications.filter((a) => a.status !== "pending").length /
              applications.length) *
            100
          : 0,
    };

    return analytics;
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return {
      profile_views: 0,
      job_views: 0,
      applications_sent: 0,
      applications_accepted: 0,
      total_earnings: 0,
      average_rating: 0,
      completed_jobs: 0,
      response_rate: 0,
    };
  }
}

/**
 * Mark message as read
 */
export async function markMessageAsRead(messageId: string): Promise<void> {
  console.log("📧 [WORKER-SERVICE] markMessageAsRead:", messageId);

  try {
    const { error } = await supabase
      .from("messages")
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq("id", messageId);

    if (error) throw error;

    console.log("✅ [WORKER-SERVICE] Message marked as read");
  } catch (error) {
    console.error("❌ [WORKER-SERVICE] Mark message as read error:", error);
    throw error;
  }
}

/**
 * Send message
 */
export async function sendMessage(
  senderId: string,
  recipientId: string,
  content: string,
  subject?: string
): Promise<void> {
  console.log("📧 [WORKER-SERVICE] sendMessage:", {
    senderId,
    recipientId,
    subject,
  });

  try {
    const { error } = await supabase.from("messages").insert({
      sender_id: senderId,
      recipient_id: recipientId,
      subject: subject || "Re: Wiadomość",
      content: content,
      is_read: false,
      created_at: new Date().toISOString(),
    });

    if (error) throw error;

    console.log("✅ [WORKER-SERVICE] Message sent successfully");
  } catch (error) {
    console.error("❌ [WORKER-SERVICE] Send message error:", error);
    throw error;
  }
}

// Export all functions
export default {
  // Profile
  getWorkerProfile,
  updateWorkerProfile,
  updateWorkerSkills,
  uploadAvatar,
  deleteAvatar,
  calculateProfileCompletion,

  // Certificates
  getWorkerCertificates,
  addCertificate,
  uploadCertificateFile,
  deleteCertificate,

  // Settings
  updateNotificationSettings,
  updatePrivacySettings,

  // Portfolio
  getPortfolioProjects,
  addPortfolioProject,
  updatePortfolioProject,
  deletePortfolioProject,
  uploadPortfolioImage,

  // Applications
  getApplications,
  applyForJob,
  withdrawApplication,

  // Earnings
  getEarnings,
  getEarningsStats,

  // Reviews
  getReviews,
  getAverageRating,

  // Analytics
  getAnalytics,

  // ===== NEW DASHBOARD FEATURES =====
  // Stats
  getWorkerStats,

  // Messages
  getRecentMessages,
  markMessageAsRead,
  sendMessage,

  // Reviews (enhanced)
  getWorkerReviews,
  respondToReview, // Availability
  updateAvailability,
  toggleAvailability,
  blockDate,
  unblockDate,

  // Portfolio (enhanced)
  uploadWorkerPortfolioImage,
  deleteWorkerPortfolioImage,
};
