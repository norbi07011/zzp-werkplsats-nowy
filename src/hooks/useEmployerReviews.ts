import { useState, useEffect } from "react";
import {
  getEmployerReviews,
  getEmployerReviewStats,
  hasReviewedEmployer,
} from "../services/employerReviewService";

export interface EmployerReview {
  id: string;
  rating: number;
  comment: string | null;
  communication_rating: number | null;
  professionalism_rating: number | null;
  payment_rating: number | null;
  would_recommend: boolean | null;
  created_at: string | null;
  reviewer_id: string;
  reviewee_id: string;
  employer_id: string;
  worker_id: string | null;
  accountant_id: string | null;
  cleaning_company_id: string | null;
  status: string | null;
  verified_by_platform: boolean | null;
  approved_at: string | null;
  reviewed_by_admin: string | null;
  updated_at: string | null;
}

export interface EmployerReviewStats {
  average_rating: number;
  total_reviews: number;
  average_communication: number;
  average_professionalism: number;
  average_payment: number;
  recommendation_percentage: number;
}

export function useEmployerReviews(employerId: string) {
  const [reviews, setReviews] = useState<EmployerReview[]>([]);
  const [stats, setStats] = useState<EmployerReviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReviews = async () => {
    setLoading(true);
    setError(null);

    try {
      const [reviewsResult, statsResult] = await Promise.all([
        getEmployerReviews(employerId),
        getEmployerReviewStats(employerId),
      ]);

      if (reviewsResult.success && reviewsResult.reviews) {
        setReviews(reviewsResult.reviews);
      } else {
        setError(reviewsResult.error || "Failed to load reviews");
      }

      if (statsResult.success && statsResult.stats) {
        setStats(statsResult.stats);
      }
    } catch (err) {
      console.error("Error fetching employer reviews:", err);
      setError("Unexpected error loading reviews");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [employerId]);

  return {
    reviews,
    stats,
    loading,
    error,
    refetch: fetchReviews,
  };
}

export function useHasReviewedEmployer(
  employerId: string,
  workerId?: string,
  cleaningCompanyId?: string,
  accountantId?: string
) {
  const [hasReviewed, setHasReviewed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkReview() {
      if (!workerId && !cleaningCompanyId && !accountantId) {
        setLoading(false);
        return;
      }

      const result = await hasReviewedEmployer(
        employerId,
        workerId,
        cleaningCompanyId,
        accountantId
      );

      if (result.success && result.hasReviewed !== undefined) {
        setHasReviewed(result.hasReviewed);
      }

      setLoading(false);
    }

    checkReview();
  }, [employerId, workerId, cleaningCompanyId, accountantId]);

  return { hasReviewed, loading };
}
