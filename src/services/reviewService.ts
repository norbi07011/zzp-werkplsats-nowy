import { supabase } from "../lib/supabase";
import type { Database } from "../lib/database.types";

type ReviewInsert = Database["public"]["Tables"]["reviews"]["Insert"];
type ReviewRow = Database["public"]["Tables"]["reviews"]["Row"];

export interface CreateReviewData {
  worker_id: string;
  employer_id?: string; // Optional - for employer reviews
  cleaning_company_id?: string; // Optional - for cleaning company reviews
  rating: number; // Overall rating 1-5
  comment?: string;
  communication_rating?: number; // 1-5
  punctuality_rating?: number; // 1-5
  quality_rating?: number; // 1-5
  safety_rating?: number; // 1-5
  would_recommend?: boolean;
  job_id?: string;
}

export interface WorkerReviewStats {
  average_rating: number;
  total_reviews: number;
  average_communication: number;
  average_punctuality: number;
  average_quality: number;
  average_safety: number;
  recommendation_percentage: number;
}

/**
 * Create a new review for a worker
 */
export async function createReview(
  data: CreateReviewData
): Promise<{ success: boolean; error?: string; review?: ReviewRow }> {
  try {
    // Validate that at least one reviewer type is provided
    if (!data.employer_id && !data.cleaning_company_id) {
      return {
        success: false,
        error: "Musisz podać employer_id lub cleaning_company_id",
      };
    }

    // Validate ratings (1-5)
    if (data.rating < 1 || data.rating > 5) {
      return { success: false, error: "Ogólna ocena musi być od 1 do 5" };
    }

    if (
      data.communication_rating &&
      (data.communication_rating < 1 || data.communication_rating > 5)
    ) {
      return { success: false, error: "Ocena komunikacji musi być od 1 do 5" };
    }

    if (
      data.punctuality_rating &&
      (data.punctuality_rating < 1 || data.punctuality_rating > 5)
    ) {
      return {
        success: false,
        error: "Ocena punktualności musi być od 1 do 5",
      };
    }

    if (
      data.quality_rating &&
      (data.quality_rating < 1 || data.quality_rating > 5)
    ) {
      return { success: false, error: "Ocena jakości musi być od 1 do 5" };
    }

    if (
      data.safety_rating &&
      (data.safety_rating < 1 || data.safety_rating > 5)
    ) {
      return {
        success: false,
        error: "Ocena bezpieczeństwa musi być od 1 do 5",
      };
    }

    // Check if worker exists
    const { data: workerExists, error: workerError } = await supabase
      .from("workers")
      .select("id")
      .eq("id", data.worker_id)
      .single();

    if (workerError || !workerExists) {
      return { success: false, error: "Pracownik nie istnieje" };
    }

    // Determine reviewer type and get user_id
    let reviewerUserId: string | null = null;

    if (data.employer_id) {
      // Check if employer exists and get user_id
      const { data: employer, error: employerError } = await supabase
        .from("employers")
        .select("id, profile_id")
        .eq("id", data.employer_id)
        .single();

      if (employerError || !employer) {
        return { success: false, error: "Pracodawca nie istnieje" };
      }

      reviewerUserId = (employer as any).profile_id;
    } else if (data.cleaning_company_id) {
      // Check if cleaning company exists and get user_id
      const { data: cleaningCompany, error: cleaningError } = await supabase
        .from("cleaning_companies")
        .select("id, profile_id")
        .eq("id", data.cleaning_company_id)
        .single();

      if (cleaningError || !cleaningCompany) {
        return { success: false, error: "Firma sprzątająca nie istnieje" };
      }

      reviewerUserId = (cleaningCompany as any).profile_id;
    }

    if (!reviewerUserId) {
      return { success: false, error: "Nie znaleziono ID recenzenta" };
    }

    // Check if worker exists and get profile_id
    const { data: worker, error: workerError2 } = await supabase
      .from("workers")
      .select("id, profile_id")
      .eq("id", data.worker_id)
      .single();

    if (workerError2 || !worker) {
      return { success: false, error: "Pracownik nie istnieje (profile_id)" };
    }

    // Create review
    const reviewData: ReviewInsert = {
      worker_id: data.worker_id,
      employer_id: data.employer_id || null,
      cleaning_company_id: data.cleaning_company_id || null,
      reviewer_id: reviewerUserId, // profile_id of employer or cleaning_company
      reviewee_id: (worker as any).profile_id, // profile_id of worker
      rating: data.rating,
      comment: data.comment || null,
      communication_rating: data.communication_rating || null,
      punctuality_rating: data.punctuality_rating || null,
      quality_rating: data.quality_rating || null,
      safety_rating: data.safety_rating || null,
      would_recommend: data.would_recommend ?? null,
      job_id: data.job_id || null,
      status: "approved", // Auto-approve reviews from employers and cleaning companies
      verified_by_platform: false,
    };

    const { data: review, error } = await supabase
      .from("reviews")
      .insert(reviewData)
      .select()
      .single();

    if (error) {
      console.error("Error creating review:", error);
      return { success: false, error: error.message };
    }

    return { success: true, review };
  } catch (error) {
    console.error("Unexpected error creating review:", error);
    return {
      success: false,
      error: "Nieoczekiwany błąd podczas tworzenia opinii",
    };
  }
}

/**
 * Get all reviews for a worker
 */
export async function getWorkerReviews(
  workerId: string
): Promise<{ success: boolean; reviews?: ReviewRow[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from("reviews")
      .select(
        `
        *,
        reviewer:profiles!reviews_reviewer_id_fkey (id, full_name, avatar_url),
        employer:employers (id, company_name, logo_url)
      `
      )
      .eq("worker_id", workerId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching worker reviews:", error);
      return { success: false, error: error.message };
    }

    return { success: true, reviews: data || [] };
  } catch (error) {
    console.error("Unexpected error fetching worker reviews:", error);
    return {
      success: false,
      error: "Nieoczekiwany błąd podczas pobierania opinii",
    };
  }
}

/**
 * Get statistics for a worker's reviews
 */
export async function getWorkerReviewStats(
  workerId: string
): Promise<{ success: boolean; stats?: WorkerReviewStats; error?: string }> {
  try {
    const { data, error } = await supabase
      .from("reviews")
      .select(
        "rating, communication_rating, punctuality_rating, quality_rating, safety_rating, would_recommend"
      )
      .eq("worker_id", workerId);

    if (error) {
      console.error("Error fetching worker review stats:", error);
      return { success: false, error: error.message };
    }

    if (!data || data.length === 0) {
      return {
        success: true,
        stats: {
          average_rating: 0,
          total_reviews: 0,
          average_communication: 0,
          average_punctuality: 0,
          average_quality: 0,
          average_safety: 0,
          recommendation_percentage: 0,
        },
      };
    }

    const total = data.length;
    const sumRating = data.reduce((sum: number, r: any) => sum + r.rating, 0);
    const sumCommunication = data.reduce(
      (sum: number, r: any) => sum + (r.communication_rating || 0),
      0
    );
    const sumPunctuality = data.reduce(
      (sum: number, r: any) => sum + (r.punctuality_rating || 0),
      0
    );
    const sumQuality = data.reduce(
      (sum: number, r: any) => sum + (r.quality_rating || 0),
      0
    );
    const sumSafety = data.reduce(
      (sum: number, r: any) => sum + (r.safety_rating || 0),
      0
    );

    const commCount = data.filter(
      (r: any) => r.communication_rating !== null
    ).length;
    const punctCount = data.filter(
      (r: any) => r.punctuality_rating !== null
    ).length;
    const qualCount = data.filter((r: any) => r.quality_rating !== null).length;
    const safeCount = data.filter((r: any) => r.safety_rating !== null).length;

    const recommendCount = data.filter(
      (r: any) => r.would_recommend === true
    ).length;

    return {
      success: true,
      stats: {
        average_rating: sumRating / total,
        total_reviews: total,
        average_communication: commCount > 0 ? sumCommunication / commCount : 0,
        average_punctuality: punctCount > 0 ? sumPunctuality / punctCount : 0,
        average_quality: qualCount > 0 ? sumQuality / qualCount : 0,
        average_safety: safeCount > 0 ? sumSafety / safeCount : 0,
        recommendation_percentage:
          total > 0 ? (recommendCount / total) * 100 : 0,
      },
    };
  } catch (error) {
    console.error("Unexpected error calculating worker review stats:", error);
    return {
      success: false,
      error: "Nieoczekiwany błąd podczas obliczania statystyk opinii",
    };
  }
}

/**
 * Get all reviews written by an employer
 */
export async function getEmployerReviews(
  employerId: string
): Promise<{ success: boolean; reviews?: ReviewRow[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from("reviews")
      .select("*")
      .eq("employer_id", employerId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching employer reviews:", error);
      return { success: false, error: error.message };
    }

    return { success: true, reviews: data || [] };
  } catch (error) {
    console.error("Unexpected error fetching employer reviews:", error);
    return {
      success: false,
      error: "Nieoczekiwany błąd podczas pobierania opinii pracodawcy",
    };
  }
}

/**
 * Check if an employer has already reviewed a worker
 */
export async function hasEmployerReviewedWorker(
  employerId: string,
  workerId: string
): Promise<{ success: boolean; hasReviewed?: boolean; error?: string }> {
  try {
    const { data, error } = await supabase
      .from("reviews")
      .select("id")
      .eq("employer_id", employerId)
      .eq("worker_id", workerId)
      .maybeSingle();

    if (error) {
      console.error("Error checking if employer reviewed worker:", error);
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
