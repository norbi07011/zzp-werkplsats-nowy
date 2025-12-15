import React, { useState, useEffect } from "react";
import { StarRating } from "./StarRating";
import { supabase } from "@/lib/supabase";

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string | null;
  reviewer_id: string;
  employer_id?: string | null;
  employer?: {
    company_name: string | null;
  } | null;
}

interface ReviewListProps {
  workerId: string;
  maxReviews?: number;
  showTitle?: boolean;
}

export const ReviewList: React.FC<ReviewListProps> = ({
  workerId,
  maxReviews = 10,
  showTitle = true,
}) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [averageRating, setAverageRating] = useState<number>(0);

  useEffect(() => {
    loadReviews();
  }, [workerId]);

  const loadReviews = async () => {
    try {
      setLoading(true);
      setError("");

      console.log("[REVIEWS] Loading reviews for worker:", workerId);

      const { data: reviewsData, error: reviewsError } = await supabase
        .from("reviews")
        .select(
          `
          id,
          rating,
          comment,
          created_at,
          reviewer_id,
          employer_id,
          reviewer:profiles!reviews_reviewer_id_fkey (
            id,
            full_name,
            avatar_url
          ),
          employer:employers (
            id,
            company_name
          )
        `
        )
        .eq("worker_id", workerId)
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(maxReviews);

      if (reviewsError) {
        console.error("[REVIEWS] Error loading reviews:", reviewsError);
        setError("Nie udało się załadować opinii");
        return;
      }

      // Map reviews with reviewer info from JOIN
      const reviewsWithEmployers = (reviewsData || []).map((review: any) => {
        return {
          ...review,
          employer: review.employer,
        };
      });

      setReviews(reviewsWithEmployers);

      // Calculate average rating
      if (reviewsWithEmployers.length > 0) {
        const avg =
          reviewsWithEmployers.reduce((sum, r) => sum + r.rating, 0) /
          reviewsWithEmployers.length;
        setAverageRating(Number(avg.toFixed(1)));
      } else {
        setAverageRating(0);
      }

      console.log(
        "[REVIEWS] Loaded reviews:",
        reviewsWithEmployers.length,
        "avg:",
        averageRating
      );
    } catch (err) {
      console.error("[REVIEWS] Unexpected error:", err);
      setError("Wystąpił nieoczekiwany błąd");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pl-PL", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      {showTitle && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Opinie ({reviews.length})
          </h3>
          {reviews.length > 0 && (
            <div className="flex items-center gap-3">
              <StarRating
                rating={averageRating}
                readonly={true}
                showLabel={false}
                size="md"
              />
              <span className="text-lg font-semibold text-gray-700">
                {averageRating}
              </span>
              <span className="text-sm text-gray-500">
                ({reviews.length} {reviews.length === 1 ? "opinia" : "opinii"})
              </span>
            </div>
          )}
        </div>
      )}

      {reviews.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
              />
            </svg>
          </div>
          <p className="text-gray-500">Brak opinii</p>
          <p className="text-sm text-gray-400 mt-1">
            Ten pracownik nie ma jeszcze żadnych opinii
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  {/* Avatar reviewer */}
                  {review.reviewer?.avatar_url ? (
                    <img
                      src={review.reviewer.avatar_url}
                      alt={review.reviewer.full_name || "Reviewer"}
                      className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                      {(
                        review.reviewer?.full_name ||
                        review.employer?.company_name ||
                        "P"
                      )
                        .charAt(0)
                        .toUpperCase()}
                    </div>
                  )}
                  <div>
                    <StarRating
                      rating={review.rating}
                      readonly={true}
                      showLabel={false}
                      size="sm"
                    />
                    <span className="font-medium text-gray-900 block text-sm mt-1">
                      {review.reviewer?.full_name ||
                        review.employer?.company_name ||
                        "Pracodawca"}
                    </span>
                  </div>
                </div>
                <span className="text-sm text-gray-500">
                  {review.created_at
                    ? formatDate(review.created_at)
                    : "Brak daty"}
                </span>
              </div>

              {review.comment && (
                <p className="text-gray-700 leading-relaxed">
                  {review.comment}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
