import { supabase } from "../lib/supabase";
import type { Database } from "../types/supabase";

type CleaningReviewInsert =
  Database["public"]["Tables"]["cleaning_reviews"]["Insert"];
type CleaningReviewRow =
  Database["public"]["Tables"]["cleaning_reviews"]["Row"];

export interface CreateCleaningReviewData {
  cleaning_company_id: string; // Who is being reviewed
  employer_id?: string; // Reviewer option 1
  worker_id?: string; // Reviewer option 2
  accountant_id?: string; // Reviewer option 3
  rating: number; // Overall rating 1-5
  review_text?: string;
  work_type?: string;
  work_date?: string;
  work_duration_hours?: number;
}

export interface CleaningReviewStats {
  average_rating: number;
  total_reviews: number;
  recommendation_percentage: number;
}

/**
 * Create a new review for a cleaning company
 */
export async function createCleaningReview(
  data: CreateCleaningReviewData
): Promise<{ success: boolean; error?: string; review?: CleaningReviewRow }> {
  try {
    // Validate that at least one reviewer type is provided
    if (!data.employer_id && !data.worker_id && !data.accountant_id) {
      return {
        success: false,
        error: "Musisz podać employer_id, worker_id lub accountant_id",
      };
    }

    // Validate rating (1-5)
    if (data.rating < 1 || data.rating > 5) {
      return { success: false, error: "Ogólna ocena musi być od 1 do 5" };
    }

    // Check if cleaning company exists
    const { data: companyExists, error: companyError } = await supabase
      .from("cleaning_companies")
      .select("id, profile_id")
      .eq("id", data.cleaning_company_id)
      .single();

    if (companyError || !companyExists) {
      return { success: false, error: "Firma sprzątająca nie istnieje" };
    }

    // Determine reviewer type (no need to get profile_id for cleaning_reviews table)
    if (data.employer_id) {
      const { data: employer, error: employerError } = await supabase
        .from("employers")
        .select("id")
        .eq("id", data.employer_id)
        .single();

      if (employerError || !employer) {
        return { success: false, error: "Pracodawca nie istnieje" };
      }
    } else if (data.worker_id) {
      const { data: worker, error: workerError } = await supabase
        .from("workers")
        .select("id")
        .eq("id", data.worker_id)
        .single();

      if (workerError || !worker) {
        return { success: false, error: "Pracownik nie istnieje" };
      }
    } else if (data.accountant_id) {
      const { data: accountant, error: accountantError } = await supabase
        .from("accountants")
        .select("id")
        .eq("id", data.accountant_id)
        .single();

      if (accountantError || !accountant) {
        return { success: false, error: "Księgowy nie istnieje" };
      }
    }

    // Create review
    const reviewData: CleaningReviewInsert = {
      cleaning_company_id: data.cleaning_company_id,
      employer_id: data.employer_id || null,
      worker_id: data.worker_id || null,
      accountant_id: data.accountant_id || null,
      rating: data.rating,
      review_text: data.review_text || null,
      work_type: data.work_type || null,
      work_date: data.work_date || null,
      work_duration_hours: data.work_duration_hours || null,
    };

    const { data: review, error } = await supabase
      .from("cleaning_reviews")
      .insert(reviewData)
      .select()
      .single();

    if (error) {
      console.error("Error creating cleaning review:", error);
      return { success: false, error: error.message };
    }

    return { success: true, review };
  } catch (error) {
    console.error("Unexpected error creating cleaning review:", error);
    return {
      success: false,
      error: "Nieoczekiwany błąd podczas tworzenia opinii",
    };
  }
}

/**
 * Get all reviews for a cleaning company
 */
export async function getCleaningCompanyReviews(
  cleaningCompanyId: string
): Promise<{
  success: boolean;
  reviews?: CleaningReviewRow[];
  error?: string;
}> {
  try {
    const { data, error } = await supabase
      .from("cleaning_reviews")
      .select("*")
      .eq("cleaning_company_id", cleaningCompanyId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching cleaning company reviews:", error);
      return { success: false, error: error.message };
    }

    return { success: true, reviews: data || [] };
  } catch (error) {
    console.error("Unexpected error fetching cleaning company reviews:", error);
    return {
      success: false,
      error: "Nieoczekiwany błąd podczas pobierania opinii",
    };
  }
}

/**
 * Get statistics for a cleaning company's reviews
 */
export async function getCleaningCompanyReviewStats(
  cleaningCompanyId: string
): Promise<{ success: boolean; stats?: CleaningReviewStats; error?: string }> {
  try {
    const { data, error } = await supabase
      .from("cleaning_reviews")
      .select("rating")
      .eq("cleaning_company_id", cleaningCompanyId);

    if (error) {
      console.error("Error fetching cleaning company review stats:", error);
      return { success: false, error: error.message };
    }

    if (!data || data.length === 0) {
      return {
        success: true,
        stats: {
          average_rating: 0,
          total_reviews: 0,
          recommendation_percentage: 0,
        },
      };
    }

    const total = data.length;
    const sumRating = data.reduce((sum: number, r: any) => sum + r.rating, 0);

    return {
      success: true,
      stats: {
        average_rating: sumRating / total,
        total_reviews: total,
        recommendation_percentage: 100, // Simplified - you can add would_recommend field to cleaning_reviews if needed
      },
    };
  } catch (error) {
    console.error(
      "Unexpected error calculating cleaning company review stats:",
      error
    );
    return {
      success: false,
      error: "Nieoczekiwany błąd podczas obliczania statystyk opinii",
    };
  }
}

/**
 * Check if a reviewer has already reviewed a cleaning company
 */
export async function hasReviewedCleaningCompany(
  cleaningCompanyId: string,
  employerId?: string,
  workerId?: string,
  accountantId?: string
): Promise<{ success: boolean; hasReviewed?: boolean; error?: string }> {
  try {
    let query = supabase
      .from("cleaning_reviews")
      .select("id")
      .eq("cleaning_company_id", cleaningCompanyId);

    if (employerId) {
      query = query.eq("employer_id", employerId);
    } else if (workerId) {
      query = query.eq("worker_id", workerId);
    } else if (accountantId) {
      query = query.eq("accountant_id", accountantId);
    }

    const { data, error } = await query.maybeSingle();

    if (error) {
      console.error("Error checking if reviewed cleaning company:", error);
      return { success: false, error: error.message };
    }

    return { success: true, hasReviewed: !!data };
  } catch (error) {
    console.error("Unexpected error checking review status:", error);
    return {
      success: false,
      error: "Nieoczekiwany błąd podczas sprawdzania statusu opinii",
    };
  }
}
