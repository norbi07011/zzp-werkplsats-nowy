import { supabase } from "../lib/supabase";
import type { Database } from "../lib/database.types";

type EmployerReviewInsert =
  Database["public"]["Tables"]["employer_reviews"]["Insert"];
type EmployerReviewRow =
  Database["public"]["Tables"]["employer_reviews"]["Row"];

export interface CreateEmployerReviewData {
  employer_id: string; // Who is being reviewed
  worker_id?: string; // Reviewer option 1
  cleaning_company_id?: string; // Reviewer option 2
  accountant_id?: string; // Reviewer option 3
  rating: number; // Overall rating 1-5
  comment?: string;
  communication_rating?: number; // 1-5
  professionalism_rating?: number; // 1-5
  payment_rating?: number; // 1-5 (how fast they pay)
  would_recommend?: boolean;
}

export interface EmployerReviewStats {
  average_rating: number;
  total_reviews: number;
  average_communication: number;
  average_professionalism: number;
  average_payment: number;
  recommendation_percentage: number;
}

/**
 * Create a new review for an employer
 */
export async function createEmployerReview(
  data: CreateEmployerReviewData
): Promise<{ success: boolean; error?: string; review?: EmployerReviewRow }> {
  try {
    // Validate that at least one reviewer type is provided
    if (!data.worker_id && !data.cleaning_company_id && !data.accountant_id) {
      return {
        success: false,
        error: "Musisz podać worker_id, cleaning_company_id lub accountant_id",
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
      data.professionalism_rating &&
      (data.professionalism_rating < 1 || data.professionalism_rating > 5)
    ) {
      return {
        success: false,
        error: "Ocena profesjonalizmu musi być od 1 do 5",
      };
    }

    if (
      data.payment_rating &&
      (data.payment_rating < 1 || data.payment_rating > 5)
    ) {
      return { success: false, error: "Ocena płatności musi być od 1 do 5" };
    }

    // Check if employer exists
    const { data: employerExists, error: employerError } = await supabase
      .from("employers")
      .select("id, profile_id")
      .eq("id", data.employer_id)
      .single();

    if (employerError || !employerExists) {
      return { success: false, error: "Pracodawca nie istnieje" };
    }

    // Determine reviewer type and get profile_id
    let reviewerProfileId: string | null = null;

    if (data.worker_id) {
      const { data: worker, error: workerError } = await supabase
        .from("workers")
        .select("id, profile_id")
        .eq("id", data.worker_id)
        .single();

      if (workerError || !worker) {
        return { success: false, error: "Pracownik nie istnieje" };
      }

      reviewerProfileId = (worker as any).profile_id;
    } else if (data.cleaning_company_id) {
      const { data: cleaningCompany, error: cleaningError } = await supabase
        .from("cleaning_companies")
        .select("id, profile_id")
        .eq("id", data.cleaning_company_id)
        .single();

      if (cleaningError || !cleaningCompany) {
        return { success: false, error: "Firma sprzątająca nie istnieje" };
      }

      reviewerProfileId = (cleaningCompany as any).profile_id;
    } else if (data.accountant_id) {
      const { data: accountant, error: accountantError } = await supabase
        .from("accountants")
        .select("id, profile_id")
        .eq("id", data.accountant_id)
        .single();

      if (accountantError || !accountant) {
        return { success: false, error: "Księgowy nie istnieje" };
      }

      reviewerProfileId = (accountant as any).profile_id;
    }

    if (!reviewerProfileId) {
      return { success: false, error: "Nie znaleziono ID recenzenta" };
    }

    // Create review
    const reviewData: EmployerReviewInsert = {
      employer_id: data.employer_id,
      worker_id: data.worker_id || null,
      cleaning_company_id: data.cleaning_company_id || null,
      accountant_id: data.accountant_id || null,
      reviewer_id: reviewerProfileId, // profile_id of reviewer
      reviewee_id: (employerExists as any).profile_id, // profile_id of employer
      rating: data.rating,
      comment: data.comment || null,
      communication_rating: data.communication_rating || null,
      professionalism_rating: data.professionalism_rating || null,
      payment_rating: data.payment_rating || null,
      would_recommend: data.would_recommend ?? null,
      status: "approved", // Auto-approve reviews
      verified_by_platform: false,
    };

    const { data: review, error } = await supabase
      .from("employer_reviews")
      .insert(reviewData)
      .select()
      .single();

    if (error) {
      console.error("Error creating employer review:", error);
      return { success: false, error: error.message };
    }

    return { success: true, review };
  } catch (error) {
    console.error("Unexpected error creating employer review:", error);
    return {
      success: false,
      error: "Nieoczekiwany błąd podczas tworzenia opinii",
    };
  }
}

/**
 * Get all reviews for an employer
 */
export async function getEmployerReviews(employerId: string): Promise<{
  success: boolean;
  reviews?: EmployerReviewRow[];
  error?: string;
}> {
  try {
    const { data, error } = await supabase
      .from("employer_reviews")
      .select(
        `
        *,
        profiles:reviewer_id (
          id,
          full_name,
          avatar_url
        )
      `
      )
      .eq("employer_id", employerId)
      .eq("status", "approved")
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
      error: "Nieoczekiwany błąd podczas pobierania opinii",
    };
  }
}

/**
 * Get statistics for an employer's reviews
 */
export async function getEmployerReviewStats(
  employerId: string
): Promise<{ success: boolean; stats?: EmployerReviewStats; error?: string }> {
  try {
    const { data, error } = await supabase
      .from("employer_reviews")
      .select(
        "rating, communication_rating, professionalism_rating, payment_rating, would_recommend"
      )
      .eq("employer_id", employerId)
      .eq("status", "approved");

    if (error) {
      console.error("Error fetching employer review stats:", error);
      return { success: false, error: error.message };
    }

    if (!data || data.length === 0) {
      return {
        success: true,
        stats: {
          average_rating: 0,
          total_reviews: 0,
          average_communication: 0,
          average_professionalism: 0,
          average_payment: 0,
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
    const sumProfessionalism = data.reduce(
      (sum: number, r: any) => sum + (r.professionalism_rating || 0),
      0
    );
    const sumPayment = data.reduce(
      (sum: number, r: any) => sum + (r.payment_rating || 0),
      0
    );

    const commCount = data.filter(
      (r: any) => r.communication_rating !== null
    ).length;
    const profCount = data.filter(
      (r: any) => r.professionalism_rating !== null
    ).length;
    const payCount = data.filter((r: any) => r.payment_rating !== null).length;

    const recommendCount = data.filter(
      (r: any) => r.would_recommend === true
    ).length;

    return {
      success: true,
      stats: {
        average_rating: sumRating / total,
        total_reviews: total,
        average_communication: commCount > 0 ? sumCommunication / commCount : 0,
        average_professionalism:
          profCount > 0 ? sumProfessionalism / profCount : 0,
        average_payment: payCount > 0 ? sumPayment / payCount : 0,
        recommendation_percentage:
          total > 0 ? (recommendCount / total) * 100 : 0,
      },
    };
  } catch (error) {
    console.error("Unexpected error calculating employer review stats:", error);
    return {
      success: false,
      error: "Nieoczekiwany błąd podczas obliczania statystyk opinii",
    };
  }
}

/**
 * Check if a reviewer has already reviewed an employer
 */
export async function hasReviewedEmployer(
  employerId: string,
  workerId?: string,
  cleaningCompanyId?: string,
  accountantId?: string
): Promise<{ success: boolean; hasReviewed?: boolean; error?: string }> {
  try {
    let query = supabase
      .from("employer_reviews")
      .select("id")
      .eq("employer_id", employerId);

    if (workerId) {
      query = query.eq("worker_id", workerId);
    } else if (cleaningCompanyId) {
      query = query.eq("cleaning_company_id", cleaningCompanyId);
    } else if (accountantId) {
      query = query.eq("accountant_id", accountantId);
    }

    const { data, error } = await query.maybeSingle();

    if (error) {
      console.error("Error checking if reviewed employer:", error);
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
