// @ts-nocheck
/**
 * Application Service - Job Applications Management
 * Handles job applications, status updates, and worker-company connections
 */

import { supabase } from "@/lib/supabase";

export interface Application {
  id: string;
  job_id: string;
  worker_id: string;
  cover_letter?: string;
  status: "pending" | "accepted" | "rejected" | "withdrawn";
  applied_at: string;
  updated_at: string;
  job?: {
    id: string;
    title: string;
    company_id: string;
    hourly_rate_min?: number;
    hourly_rate_max?: number;
    work_location: string;
    city?: string;
  };
  worker?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    avatar_url?: string;
    specialization?: string;
    hourly_rate?: number;
  };
  company?: {
    id: string;
    company_name: string;
    logo_url?: string;
  };
}

export interface CreateApplicationData {
  job_id: string;
  worker_id: string;
  cover_letter?: string;
}

/**
 * Apply for a job
 */
export async function applyForJob(
  jobId: string,
  workerId: string,
  coverLetter?: string
): Promise<Application | null> {
  try {
    // Check if already applied
    const { data: existing } = await supabase
      .from("applications")
      .select("id")
      .eq("job_id", jobId)
      .eq("worker_id", workerId)
      .single();

    if (existing) {
      throw new Error("You have already applied for this job");
    }

    // Create application
    const { data, error } = await supabase
      .from("applications")
      .insert({
        job_id: jobId,
        worker_id: workerId,
        cover_letter: coverLetter,
        status: "pending",
        applied_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select(
        `
        *,
        job:jobs(id, title, hourly_rate_min, hourly_rate_max, work_location, city),
        worker:workers(id, first_name, last_name, email, avatar_url, specialization, hourly_rate)
      `
      )
      .single();

    if (error) throw error;

    // Increment job applications count
    await incrementJobApplications(jobId);

    return data;
  } catch (error) {
    console.error("Error applying for job:", error);
    throw error;
  }
}

/**
 * Get applications by worker
 */
export async function getApplicationsByWorker(
  workerId: string
): Promise<Application[]> {
  try {
    const { data, error } = await supabase
      .from("applications")
      .select(
        `
        *,
        job:jobs(
          id, 
          title, 
          company_id, 
          hourly_rate_min, 
          hourly_rate_max, 
          work_location, 
          city,
          company:companies(id, company_name, logo_url)
        )
      `
      )
      .eq("worker_id", workerId)
      .order("applied_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching worker applications:", error);
    throw new Error("Failed to fetch applications");
  }
}

/**
 * Get applications by job
 */
export async function getApplicationsByJob(
  jobId: string
): Promise<Application[]> {
  try {
    const { data, error } = await supabase
      .from("applications")
      .select(
        `
        *,
        worker:workers(id, first_name, last_name, email, avatar_url, specialization, hourly_rate, skills)
      `
      )
      .eq("job_id", jobId)
      .order("applied_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching job applications:", error);
    throw new Error("Failed to fetch job applications");
  }
}

/**
 * Get application by ID
 */
export async function getApplicationById(
  applicationId: string
): Promise<Application | null> {
  try {
    const { data, error } = await supabase
      .from("applications")
      .select(
        `
        *,
        job:jobs(
          id, 
          title, 
          company_id, 
          description,
          hourly_rate_min, 
          hourly_rate_max,
          company:companies(id, company_name, logo_url, contact_email, contact_phone)
        ),
        worker:workers(id, first_name, last_name, email, avatar_url, specialization, hourly_rate, bio, skills)
      `
      )
      .eq("id", applicationId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error fetching application:", error);
    return null;
  }
}

/**
 * Update application status
 */
export async function updateApplicationStatus(
  applicationId: string,
  status: "accepted" | "rejected" | "withdrawn"
): Promise<Application | null> {
  try {
    const { data, error } = await supabase
      .from("applications")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", applicationId)
      .select(
        `
        *,
        job:jobs(id, title, company_id),
        worker:workers(id, first_name, last_name, email)
      `
      )
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error updating application status:", error);
    throw new Error("Failed to update application status");
  }
}

/**
 * Withdraw application
 */
export async function withdrawApplication(
  applicationId: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from("applications")
      .update({
        status: "withdrawn",
        updated_at: new Date().toISOString(),
      })
      .eq("id", applicationId);

    if (error) throw error;
  } catch (error) {
    console.error("Error withdrawing application:", error);
    throw new Error("Failed to withdraw application");
  }
}

/**
 * Delete application
 */
export async function deleteApplication(applicationId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from("applications")
      .delete()
      .eq("id", applicationId);

    if (error) throw error;
  } catch (error) {
    console.error("Error deleting application:", error);
    throw new Error("Failed to delete application");
  }
}

/**
 * Get application statistics for worker
 */
export async function getWorkerApplicationStats(workerId: string): Promise<{
  total: number;
  pending: number;
  accepted: number;
  rejected: number;
  withdrawn: number;
}> {
  try {
    const { data, error } = await supabase
      .from("applications")
      .select("status")
      .eq("worker_id", workerId);

    if (error) throw error;

    const stats = {
      total: data?.length || 0,
      pending: 0,
      accepted: 0,
      rejected: 0,
      withdrawn: 0,
    };

    data?.forEach((app) => {
      stats[app.status]++;
    });

    return stats;
  } catch (error) {
    console.error("Error fetching worker stats:", error);
    return { total: 0, pending: 0, accepted: 0, rejected: 0, withdrawn: 0 };
  }
}

/**
 * Get application statistics for job
 */
export async function getJobApplicationStats(jobId: string): Promise<{
  total: number;
  pending: number;
  accepted: number;
  rejected: number;
}> {
  try {
    const { data, error } = await supabase
      .from("applications")
      .select("status")
      .eq("job_id", jobId);

    if (error) throw error;

    const stats = {
      total: data?.length || 0,
      pending: 0,
      accepted: 0,
      rejected: 0,
    };

    data?.forEach((app) => {
      if (app.status !== "withdrawn") {
        stats[app.status]++;
      }
    });

    return stats;
  } catch (error) {
    console.error("Error fetching job stats:", error);
    return { total: 0, pending: 0, accepted: 0, rejected: 0 };
  }
}

/**
 * Check if worker has applied for job
 */
export async function hasApplied(
  jobId: string,
  workerId: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from("applications")
      .select("id")
      .eq("job_id", jobId)
      .eq("worker_id", workerId)
      .single();

    return !!data;
  } catch (error) {
    return false;
  }
}

/**
 * Increment job applications count
 */
async function incrementJobApplications(jobId: string): Promise<void> {
  try {
    const { data: job } = await supabase
      .from("jobs")
      .select("applications_count")
      .eq("id", jobId)
      .single();

    if (job) {
      await supabase
        .from("jobs")
        .update({ applications_count: (job.applications_count || 0) + 1 })
        .eq("id", jobId);
    }
  } catch (error) {
    console.error("Error incrementing applications:", error);
  }
}

export const applicationService = {
  applyForJob,
  getApplicationsByWorker,
  getApplicationsByJob,
  getApplicationById,
  updateApplicationStatus,
  withdrawApplication,
  deleteApplication,
  getWorkerApplicationStats,
  getJobApplicationStats,
  hasApplied,
};

export default applicationService;
