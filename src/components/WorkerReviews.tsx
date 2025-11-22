import React, { useEffect, useState } from "react";
import type { Database } from "../lib/database.types";
import {
  getWorkerReviews,
  getWorkerReviewStats,
  type WorkerReviewStats,
} from "../services/reviewService";

type ReviewRow = Database["public"]["Tables"]["reviews"]["Row"];

interface WorkerReviewsProps {
  workerId: string;
  showStats?: boolean;
  maxReviews?: number;
}

const StarDisplay: React.FC<{ rating: number; label?: string }> = ({
  rating,
  label,
}) => {
  return (
    <div className="flex items-center gap-1">
      {label && <span className="text-sm text-gray-600 mr-1">{label}:</span>}
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`w-4 h-4 ${
            star <= rating ? "text-yellow-400 fill-current" : "text-gray-300"
          }`}
          fill={star <= rating ? "currentColor" : "none"}
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
          />
        </svg>
      ))}
      <span className="ml-1 text-sm font-medium text-gray-700">
        {rating.toFixed(1)}
      </span>
    </div>
  );
};

export const WorkerReviews: React.FC<WorkerReviewsProps> = ({
  workerId,
  showStats = true,
  maxReviews,
}) => {
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [stats, setStats] = useState<WorkerReviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadReviews() {
      setLoading(true);
      setError("");

      try {
        const [reviewsResult, statsResult] = await Promise.all([
          getWorkerReviews(workerId),
          showStats
            ? getWorkerReviewStats(workerId)
            : Promise.resolve({ success: true, stats: null }),
        ]);

        if (reviewsResult.success) {
          const displayReviews = maxReviews
            ? (reviewsResult.reviews || []).slice(0, maxReviews)
            : reviewsResult.reviews || [];
          setReviews(displayReviews);
        } else {
          setError(reviewsResult.error || "Nie udało się załadować opinii");
        }

        if (statsResult.success && statsResult.stats) {
          setStats(statsResult.stats);
        }
      } catch (err) {
        console.error("Error loading reviews:", err);
        setError("Wystąpił błąd podczas ładowania opinii");
      } finally {
        setLoading(false);
      }
    }

    loadReviews();
  }, [workerId, showStats, maxReviews]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
        <span className="ml-3 text-gray-600">Ładowanie opinii...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        ⚠️ {error}
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
        <p className="text-gray-600">Brak opinii dla tego pracownika</p>
        <p className="text-sm text-gray-500 mt-1">
          Bądź pierwszy, który wystawi opinię!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Summary */}
      {showStats && stats && stats.total_reviews > 0 && (
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            📊 Podsumowanie opinii
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-orange-600">
                {stats.average_rating.toFixed(1)}
              </p>
              <StarDisplay rating={Math.round(stats.average_rating)} />
              <p className="text-sm text-gray-600 mt-1">
                {stats.total_reviews} opinii
              </p>
            </div>

            {stats.average_communication > 0 && (
              <div>
                <p className="text-xs text-gray-600 mb-1">📞 Komunikacja</p>
                <StarDisplay rating={Math.round(stats.average_communication)} />
                <p className="text-xs text-gray-500">
                  {stats.average_communication.toFixed(1)}/5
                </p>
              </div>
            )}

            {stats.average_punctuality > 0 && (
              <div>
                <p className="text-xs text-gray-600 mb-1">⏰ Punktualność</p>
                <StarDisplay rating={Math.round(stats.average_punctuality)} />
                <p className="text-xs text-gray-500">
                  {stats.average_punctuality.toFixed(1)}/5
                </p>
              </div>
            )}

            {stats.average_quality > 0 && (
              <div>
                <p className="text-xs text-gray-600 mb-1">🔨 Jakość pracy</p>
                <StarDisplay rating={Math.round(stats.average_quality)} />
                <p className="text-xs text-gray-500">
                  {stats.average_quality.toFixed(1)}/5
                </p>
              </div>
            )}

            {stats.average_safety > 0 && (
              <div>
                <p className="text-xs text-gray-600 mb-1">🦺 Bezpieczeństwo</p>
                <StarDisplay rating={Math.round(stats.average_safety)} />
                <p className="text-xs text-gray-500">
                  {stats.average_safety.toFixed(1)}/5
                </p>
              </div>
            )}

            {stats.recommendation_percentage > 0 && (
              <div>
                <p className="text-xs text-gray-600 mb-1">👍 Polecenia</p>
                <p className="text-2xl font-bold text-green-600">
                  {Math.round(stats.recommendation_percentage)}%
                </p>
                <p className="text-xs text-gray-500">poleca tego pracownika</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-gray-900">
          💬 Opinie ({reviews.length})
        </h3>

        {reviews.map((review) => (
          <div
            key={review.id}
            className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
          >
            {/* Rating & Date */}
            <div className="flex items-start justify-between mb-3">
              <StarDisplay rating={review.rating} />
              <span className="text-xs text-gray-500">
                {new Date(review.created_at || "").toLocaleDateString("pl-PL", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>

            {/* Comment */}
            {review.comment && (
              <p className="text-gray-700 mb-3 leading-relaxed">
                {review.comment}
              </p>
            )}

            {/* Reviewer Info */}
            <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-100">
              {(review as any).reviewer?.avatar_url ||
              (review as any).employer?.logo_url ? (
                <img
                  src={
                    (review as any).reviewer?.avatar_url ||
                    (review as any).employer?.logo_url
                  }
                  alt="Reviewer"
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-sm font-bold text-white">
                  {((review as any).reviewer?.full_name ||
                    (review as any).employer?.company_name ||
                    "A")[0].toUpperCase()}
                </div>
              )}
              <p className="text-sm text-gray-600">
                {(review as any).reviewer?.full_name ||
                  (review as any).employer?.company_name ||
                  "Anonim"}
              </p>
            </div>

            {/* Detailed Ratings */}
            {(review.communication_rating ||
              review.punctuality_rating ||
              review.quality_rating ||
              review.safety_rating) && (
              <div className="grid grid-cols-2 gap-2 mb-3 bg-gray-50 p-3 rounded">
                {review.communication_rating && (
                  <StarDisplay
                    rating={review.communication_rating}
                    label="📞 Komunikacja"
                  />
                )}
                {review.punctuality_rating && (
                  <StarDisplay
                    rating={review.punctuality_rating}
                    label="⏰ Punktualność"
                  />
                )}
                {review.quality_rating && (
                  <StarDisplay
                    rating={review.quality_rating}
                    label="🔨 Jakość"
                  />
                )}
                {review.safety_rating && (
                  <StarDisplay
                    rating={review.safety_rating}
                    label="🦺 Bezpieczeństwo"
                  />
                )}
              </div>
            )}

            {/* Recommendation Badge */}
            {review.would_recommend !== null && (
              <div className="flex items-center gap-2">
                {review.would_recommend ? (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    ✅ Poleca tego pracownika
                  </span>
                ) : (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    ❌ Nie poleca
                  </span>
                )}
              </div>
            )}

            {/* Verification Badge */}
            {review.verified_by_platform && (
              <div className="mt-2 flex items-center gap-1 text-xs text-blue-600">
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Zweryfikowana przez platformę</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
