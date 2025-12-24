import { supabase } from "../lib/supabase";
import type { Database } from "../lib/database.types";

type AccountantReviewInsert =
  Database["public"]["Tables"]["accountant_reviews"]["Insert"];
type AccountantReviewRow =
  Database["public"]["Tables"]["accountant_reviews"]["Row"];

export interface CreateAccountantReviewData {
  accountant_id: string; // Who is being reviewed
  worker_id?: string; // Reviewer option 1
  employer_id?: string; // Reviewer option 2
  cleaning_company_id?: string; // Reviewer option 3
  rating: number; // Overall rating 1-5
  comment?: string;
  communication_rating?: number; // 1-5
  professionalism_rating?: number; // 1-5
  quality_rating?: number; // 1-5 (quality of accounting work)
  timeliness_rating?: number; // 1-5 (how fast they deliver)
  would_recommend?: boolean;
}

export interface AccountantReviewStats {
  average_rating: number;
  total_reviews: number;
  average_communication: number;
  average_professionalism: number;
  average_quality: number;
  average_timeliness: number;
  recommendation_percentage: number;
}

/**
 * Create a new review for an accountant
 */
export async function createAccountantReview(
  data: CreateAccountantReviewData
): Promise<{ success: boolean; error?: string; review?: AccountantReviewRow }> {
  try {
    // Validate that at least one reviewer type is provided
    if (!data.worker_id && !data.employer_id && !data.cleaning_company_id) {
      return {
        success: false,
        error: "Musisz podać worker_id, employer_id lub cleaning_company_id",
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
      data.quality_rating &&
      (data.quality_rating < 1 || data.quality_rating > 5)
    ) {
      return { success: false, error: "Ocena jakości musi być od 1 do 5" };
    }

    if (
      data.timeliness_rating &&
      (data.timeliness_rating < 1 || data.timeliness_rating > 5)
    ) {
      return { success: false, error: "Ocena terminowości musi być od 1 do 5" };
    }

    // Check if accountant exists
    const { data: accountantExists, error: accountantError } = await supabase
      .from("accountants")
      .select("id, profile_id")
      .eq("id", data.accountant_id)
      .single();

    if (accountantError || !accountantExists) {
      return { success: false, error: "Księgowy nie istnieje" };
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
    } else if (data.employer_id) {
      const { data: employer, error: employerError } = await supabase
        .from("employers")
        .select("id, profile_id")
        .eq("id", data.employer_id)
        .single();

      if (employerError || !employer) {
        return { success: false, error: "Pracodawca nie istnieje" };
      }

      reviewerProfileId = (employer as any).profile_id;
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
    }

    if (!reviewerProfileId) {
      return { success: false, error: "Nie znaleziono ID recenzenta" };
    }

    // Create review (note: reviewer_type is set by the database based on which ID is provided)
    const reviewData: AccountantReviewInsert = {
      accountant_id: data.accountant_id,
      worker_id: data.worker_id || null,
      employer_id: data.employer_id || null,
      cleaning_company_id: data.cleaning_company_id || null,
      reviewer_id: reviewerProfileId, // profile_id of reviewer
      rating: data.rating,
      comment: data.comment || null,
      communication_rating: data.communication_rating || null,
      professionalism_rating: data.professionalism_rating || null,
      quality_rating: data.quality_rating || null,
      timeliness_rating: data.timeliness_rating || null,
      would_recommend: data.would_recommend ?? null,
      status: "approved", // Auto-approve reviews
      reviewer_type: data.worker_id
        ? "worker"
        : data.employer_id
        ? "employer"
        : "cleaning_company",
      reviewer_name: null, // Will be filled by trigger if needed
    };

    const { data: review, error } = await supabase
      .from("accountant_reviews")
      .insert(reviewData)
      .select()
      .single();

    if (error) {
      console.error("Error creating accountant review:", error);
      return { success: false, error: error.message };
    }

    return { success: true, review };
  } catch (error) {
    console.error("Unexpected error creating accountant review:", error);
    return {
      success: false,
      error: "Nieoczekiwany błąd podczas tworzenia opinii",
    };
  }
}

/**
 * Get all reviews for an accountant
 */
export async function getAccountantReviews(accountantId: string): Promise<{
  success: boolean;
  reviews?: AccountantReviewRow[];
  error?: string;
}> {
  try {
    const { data, error } = await supabase
      .from("accountant_reviews")
      .select(
        `
        *,
        profiles:reviewer_id (id, full_name, avatar_url)
      `
      )
      .eq("accountant_id", accountantId)
      .eq("status", "approved")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching accountant reviews:", error);
      return { success: false, error: error.message };
    }

    return { success: true, reviews: data || [] };
  } catch (error) {
    console.error("Unexpected error fetching accountant reviews:", error);
    return {
      success: false,
      error: "Nieoczekiwany błąd podczas pobierania opinii",
    };
  }
}

/**
 * Get statistics for an accountant's reviews
 */
export async function getAccountantReviewStats(accountantId: string): Promise<{
  success: boolean;
  stats?: AccountantReviewStats;
  error?: string;
}> {
  try {
    const { data, error } = await supabase
      .from("accountant_reviews")
      .select(
        "rating, communication_rating, professionalism_rating, quality_rating, timeliness_rating, would_recommend"
      )
      .eq("accountant_id", accountantId)
      .eq("status", "approved");

    if (error) {
      console.error("Error fetching accountant review stats:", error);
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
          average_quality: 0,
          average_timeliness: 0,
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
    const sumQuality = data.reduce(
      (sum: number, r: any) => sum + (r.quality_rating || 0),
      0
    );
    const sumTimeliness = data.reduce(
      (sum: number, r: any) => sum + (r.timeliness_rating || 0),
      0
    );

    const commCount = data.filter(
      (r: any) => r.communication_rating !== null
    ).length;
    const profCount = data.filter(
      (r: any) => r.professionalism_rating !== null
    ).length;
    const qualCount = data.filter((r: any) => r.quality_rating !== null).length;
    const timeCount = data.filter(
      (r: any) => r.timeliness_rating !== null
    ).length;

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
        average_quality: qualCount > 0 ? sumQuality / qualCount : 0,
        average_timeliness: timeCount > 0 ? sumTimeliness / timeCount : 0,
        recommendation_percentage:
          total > 0 ? (recommendCount / total) * 100 : 0,
      },
    };
  } catch (error) {
    console.error(
      "Unexpected error calculating accountant review stats:",
      error
    );
    return {
      success: false,
      error: "Nieoczekiwany błąd podczas obliczania statystyk opinii",
    };
  }
}

/**
 * Check if a reviewer has already reviewed an accountant
 */
export async function hasReviewedAccountant(
  accountantId: string,
  workerId?: string,
  employerId?: string,
  cleaningCompanyId?: string
): Promise<{ success: boolean; hasReviewed?: boolean; error?: string }> {
  try {
    let query = supabase
      .from("accountant_reviews")
      .select("id")
      .eq("accountant_id", accountantId);

    if (workerId) {
      query = query.eq("worker_id", workerId);
    } else if (employerId) {
      query = query.eq("employer_id", employerId);
    } else if (cleaningCompanyId) {
      query = query.eq("cleaning_company_id", cleaningCompanyId);
    }

    const { data, error } = await query.maybeSingle();

    if (error) {
      console.error("Error checking if reviewed accountant:", error);
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
