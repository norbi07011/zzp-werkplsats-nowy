import React, { useState } from "react";
import { supabase } from "../../lib/supabase";
import { StarRating } from "./ReviewWorkerModal";
import { updateAccountantRating } from "../../services/accountantService";
import { useAuth } from "../../../contexts/AuthContext";

interface ReviewAccountantModalProps {
  isOpen: boolean;
  onClose: () => void;
  accountantId: string;
  reviewerId?: string; // DEPRECATED - zachowane dla backward compatibility
  onSuccess?: () => void;
}

export const ReviewAccountantModal: React.FC<ReviewAccountantModalProps> = ({
  isOpen,
  onClose,
  accountantId,
  onSuccess,
}) => {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [professionalismRating, setProfessionalismRating] = useState(0);
  const [communicationRating, setCommunicationRating] = useState(0);
  const [qualityRating, setQualityRating] = useState(0);
  const [timelinessRating, setTimelinessRating] = useState(0);
  const [comment, setComment] = useState("");
  const [wouldRecommend, setWouldRecommend] = useState<boolean | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      setError("Musisz być zalogowany, aby wystawić opinię");
      return;
    }

    // Validation
    if (rating === 0) {
      setError("Proszę wystawić ogólną ocenę (gwiazdki)");
      return;
    }

    if (!comment.trim()) {
      setError("Proszę dodać treść opinii");
      return;
    }

    if (wouldRecommend === null) {
      setError("Proszę zaznaczyć, czy polecasz tego księgowego");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      console.log("📤 Submitting accountant review:", {
        accountantId,
        reviewerId: user.id,
        userRole: user.role,
        rating,
        professionalismRating,
        communicationRating,
        qualityRating,
        timelinessRating,
        wouldRecommend,
      });

      // Prepare review data
      const reviewData: any = {
        accountant_id: accountantId,
        reviewer_id: user.id,
        reviewer_type: user.role,
        rating,
        professionalism_rating: professionalismRating || null,
        communication_rating: communicationRating || null,
        quality_rating: qualityRating || null,
        timeliness_rating: timelinessRating || null,
        comment: comment.trim(),
        would_recommend: wouldRecommend,
        status: "approved",
      };

      // Fetch appropriate ID from role-specific table
      if (user.role === "employer") {
        const { data: employerData, error: employerError } = await supabase
          .from("employers")
          .select("id")
          .eq("profile_id", user.id)
          .single();

        if (employerError || !employerData) {
          throw new Error("Nie znaleziono profilu pracodawcy");
        }
        reviewData.employer_id = employerData.id;
      } else if (user.role === "worker") {
        const { data: workerData, error: workerError } = await supabase
          .from("workers")
          .select("id")
          .eq("profile_id", user.id)
          .single();

        if (workerError || !workerData) {
          throw new Error("Nie znaleziono profilu pracownika");
        }
        reviewData.worker_id = workerData.id;
      } else if (user.role === "cleaning_company") {
        const { data: cleaningData, error: cleaningError } = await supabase
          .from("cleaning_companies")
          .select("id")
          .eq("profile_id", user.id)
          .single();

        if (cleaningError || !cleaningData) {
          throw new Error("Nie znaleziono profilu firmy sprzątającej");
        }
        reviewData.cleaning_company_id = cleaningData.id;
      }

      const { data, error: insertError } = await supabase
        .from("accountant_reviews")
        .insert(reviewData)
        .select()
        .single();

      if (insertError) {
        console.error("❌ Insert error:", insertError);
        throw insertError;
      }

      console.log("✅ Accountant review created:", data);

      // Update accountant's rating stats in database
      await updateAccountantRating(accountantId);

      // Success callback (refreshes parent component)
      onSuccess?.();
      onClose();

      // Reset form
      resetForm();
    } catch (err: any) {
      console.error("❌ Error submitting review:", err);

      // Handle duplicate review error
      if (err.code === "23505") {
        setError(
          "Już wystawiłeś opinię dla tego księgowego. Możesz edytować swoją istniejącą opinię w panelu pracodawcy."
        );
      } else {
        setError(err.message || "Nie udało się wystawić opinii");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setRating(0);
    setProfessionalismRating(0);
    setCommunicationRating(0);
    setQualityRating(0);
    setTimelinessRating(0);
    setComment("");
    setWouldRecommend(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">
            ⭐ Wystaw opinię księgowemu
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Info */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-800">
              💡 <strong>Wskazówka:</strong> Twoja opinia pomaga innym
              pracodawcom w wyborze księgowego. Bądź szczery i konstruktywny.
            </p>
          </div>

          {/* Overall Rating */}
          <StarRating
            rating={rating}
            onRatingChange={setRating}
            label="Ogólna ocena *"
          />

          {/* Detailed Ratings */}
          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Szczegółowe oceny (opcjonalne)
            </h3>

            <div className="space-y-4">
              <StarRating
                rating={professionalismRating}
                onRatingChange={setProfessionalismRating}
                label="Profesjonalizm"
              />

              <StarRating
                rating={communicationRating}
                onRatingChange={setCommunicationRating}
                label="Komunikacja"
              />

              <StarRating
                rating={qualityRating}
                onRatingChange={setQualityRating}
                label="Jakość usług"
              />

              <StarRating
                rating={timelinessRating}
                onRatingChange={setTimelinessRating}
                label="Terminowość"
              />
            </div>
          </div>

          {/* Comment */}
          <div className="border-t pt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Treść opinii <span className="text-red-500">*</span>
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={6}
              placeholder="Opisz swoje doświadczenia współpracy: jakość usług księgowych, terminowość, profesjonalizm, komunikacja, rozwiązywanie problemów..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              {comment.length} znaków
            </p>
          </div>

          {/* Would Recommend */}
          <div className="border-t pt-4">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Czy poleciłbyś tego księgowego?{" "}
              <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setWouldRecommend(true)}
                className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                  wouldRecommend === true
                    ? "border-green-500 bg-green-50 text-green-700 font-semibold"
                    : "border-gray-300 hover:border-gray-400"
                }`}
              >
                👍 Tak, polecam
              </button>
              <button
                type="button"
                onClick={() => setWouldRecommend(false)}
                className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                  wouldRecommend === false
                    ? "border-red-500 bg-red-50 text-red-700 font-semibold"
                    : "border-gray-300 hover:border-gray-400"
                }`}
              >
                👎 Nie polecam
              </button>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-4 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Anuluj
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Wysyłanie..." : "Wystaw opinię"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
