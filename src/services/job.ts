// @ts-nocheck
/**
 * Job Service - Job Management
 * Handles job postings, search, filtering, and applications
 */

import { supabase } from "@/lib/supabase";

export interface Job {
  id: string;
  company_id: string;
  title: string;
  description: string;
  requirements?: string;
  responsibilities?: string;
  benefits?: string;
  category: string;
  subcategory?: string;
  job_type: "freelance" | "contract" | "project" | "part-time";
  experience_level: "junior" | "medior" | "senior" | "expert";
  industry: string;
  hourly_rate_min?: number;
  hourly_rate_max?: number;
  work_location: "remote" | "onsite" | "hybrid";
  city?: string;
  province?: string;
  required_skills: string[];
  preferred_skills?: string[];
  status: "active" | "paused" | "filled" | "cancelled" | "expired";
  applications_count: number;
  views_count: number;
  featured: boolean;
  created_at: string;
  updated_at: string;
  company?: {
    id: string;
    company_name: string;
    logo_url?: string;
    industry?: string;
  };
}

export interface JobFilters {
  category?: string;
  job_type?: string[];
  experience_level?: string[];
  work_location?: string[];
  city?: string;
  hourly_rate_min?: number;
  hourly_rate_max?: number;
  required_skills?: string[];
  status?: string;
}

export interface CreateJobData {
  company_id: string;
  title: string;
  description: string;
  requirements?: string;
  responsibilities?: string;
  benefits?: string;
  category: string;
  job_type: string;
  experience_level: string;
  industry: string;
  hourly_rate_min?: number;
  hourly_rate_max?: number;
  work_location: string;
  city?: string;
  required_skills: string[];
  preferred_skills?: string[];
}

/**
 * Get all active jobs with optional filters
 */
export async function getJobs(filters?: JobFilters): Promise<Job[]> {
  try {
    let query = supabase
      .from("jobs")
      .select(
        `
        *,
        company:employers(id, company_name, logo_url, industry)
      `
      )
      .eq("status", filters?.status || "active")
      .order("created_at", { ascending: false });

    // Apply filters
    if (filters?.category) {
      query = query.eq("category", filters.category);
    }

    if (filters?.job_type && filters.job_type.length > 0) {
      query = query.in("job_type", filters.job_type);
    }

    if (filters?.experience_level && filters.experience_level.length > 0) {
      query = query.in("experience_level", filters.experience_level);
    }

    if (filters?.work_location && filters.work_location.length > 0) {
      query = query.in("work_location", filters.work_location);
    }

    if (filters?.city) {
      query = query.eq("city", filters.city);
    }

    if (filters?.hourly_rate_min) {
      query = query.gte("hourly_rate_max", filters.hourly_rate_min);
    }

    if (filters?.hourly_rate_max) {
      query = query.lte("hourly_rate_min", filters.hourly_rate_max);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching jobs:", error);
    throw new Error("Failed to fetch jobs");
  }
}

/**
 * Get job by ID
 */
export async function getJobById(jobId: string): Promise<Job | null> {
  try {
    const { data, error } = await supabase
      .from("jobs")
      .select(
        `
        *,
        company:employers(id, company_name, logo_url, industry, description, website, company_city)
      `
      )
      .eq("id", jobId)
      .single();

    if (error) throw error;

    // Increment view count
    await incrementJobViews(jobId);

    return data;
  } catch (error) {
    console.error("Error fetching job:", error);
    return null;
  }
}

/**
 * Create new job posting
 */
export async function createJob(jobData: CreateJobData): Promise<Job | null> {
  try {
    const { data, error } = await supabase
      .from("jobs")
      .insert({
        ...jobData,
        status: "active",
        applications_count: 0,
        views_count: 0,
        featured: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select(
        `
        *,
        company:employers(id, company_name, logo_url, industry)
      `
      )
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error creating job:", error);
    throw new Error("Failed to create job");
  }
}

/**
 * Update job posting
 */
export async function updateJob(
  jobId: string,
  updates: Partial<CreateJobData>
): Promise<Job | null> {
  try {
    const { data, error } = await supabase
      .from("jobs")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", jobId)
      .select(
        `
        *,
        company:employers(id, company_name, logo_url, industry)
      `
      )
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error updating job:", error);
    throw new Error("Failed to update job");
  }
}

/**
 * Delete job posting
 */
export async function deleteJob(jobId: string): Promise<void> {
  try {
    const { error } = await supabase.from("jobs").delete().eq("id", jobId);

    if (error) throw error;
  } catch (error) {
    console.error("Error deleting job:", error);
    throw new Error("Failed to delete job");
  }
}

/**
 * Change job status
 */
export async function updateJobStatus(
  jobId: string,
  status: "active" | "paused" | "filled" | "cancelled" | "expired"
): Promise<void> {
  try {
    const { error } = await supabase
      .from("jobs")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", jobId);

    if (error) throw error;
  } catch (error) {
    console.error("Error updating job status:", error);
    throw new Error("Failed to update job status");
  }
}

/**
 * Search jobs by query
 */
export async function searchJobs(
  query: string,
  filters?: JobFilters
): Promise<Job[]> {
  try {
    let supabaseQuery = supabase
      .from("jobs")
      .select(
        `
        *,
        company:employers(id, company_name, logo_url, industry)
      `
      )
      .eq("status", "active");

    // Text search in title and description
    if (query) {
      supabaseQuery = supabaseQuery.or(
        `title.ilike.%${query}%,description.ilike.%${query}%`
      );
    }

    // Apply filters (same as getJobs)
    if (filters?.category) {
      supabaseQuery = supabaseQuery.eq("category", filters.category);
    }

    if (filters?.job_type && filters.job_type.length > 0) {
      supabaseQuery = supabaseQuery.in("job_type", filters.job_type);
    }

    const { data, error } = await supabaseQuery.order("created_at", {
      ascending: false,
    });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error searching jobs:", error);
    throw new Error("Failed to search jobs");
  }
}

/**
 * Get jobs by company
 */
export async function getJobsByCompany(companyId: string): Promise<Job[]> {
  try {
    const { data, error } = await supabase
      .from("jobs")
      .select(
        `
        *,
        company:employers(id, company_name, logo_url, industry)
      `
      )
      .eq("company_id", companyId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching company jobs:", error);
    throw new Error("Failed to fetch company jobs");
  }
}

/**
 * Increment job view count
 */
async function incrementJobViews(jobId: string): Promise<void> {
  try {
    const { error } = await supabase.rpc("increment_job_views", {
      job_id: jobId,
    });

    // If RPC doesn't exist, fallback to manual increment
    if (error) {
      const { data: job } = await supabase
        .from("jobs")
        .select("views_count")
        .eq("id", jobId)
        .single();

      if (job) {
        await supabase
          .from("jobs")
          .update({ views_count: (job.views_count || 0) + 1 })
          .eq("id", jobId);
      }
    }
  } catch (error) {
    console.error("Error incrementing views:", error);
  }
}

/**
 * Get featured jobs
 */
export async function getFeaturedJobs(limit: number = 6): Promise<Job[]> {
  try {
    const { data, error } = await supabase
      .from("jobs")
      .select(
        `
        *,
        company:employers(id, company_name, logo_url, industry)
      `
      )
      .eq("status", "active")
      .eq("featured", true)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching featured jobs:", error);
    return [];
  }
}

/**
 * Get job offers from posts table (where employers create job_offer posts)
 * This is the primary source for job offers in the platform
 */
export async function getJobOffersFromPosts(): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from("posts")
      .select(
        `
        id,
        title,
        content,
        author_id,
        type,
        category,
        is_active,
        is_premium,
        views_count,
        likes_count,
        comments_count,
        created_at,
        updated_at,
        media_urls,
        location,
        tags,
        author:profiles!posts_profile_id_fkey (
          id,
          full_name,
          avatar_url,
          role
        )
      `
      )
      .eq("type", "job_offer")
      .eq("is_active", true)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching job offers from posts:", error);
    return [];
  }
}

const jobService = {
  getJobs,
  getJobById,
  createJob,
  updateJob,
  deleteJob,
  updateJobStatus,
  searchJobs,
  getJobsByCompany,
  getFeaturedJobs,
  getJobOffersFromPosts,
};

export default jobService;
