import React, { useState } from "react";
import { createAccountantReview } from "../../services/accountantReviewService";

interface StarRatingProps {
  rating: number;
  onRatingChange: (rating: number) => void;
  label?: string;
  disabled?: boolean;
}

export const StarRating: React.FC<StarRatingProps> = ({
  rating,
  onRatingChange,
  label,
  disabled = false,
}) => {
  const [hoverRating, setHoverRating] = useState(0);

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label} {!disabled && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={disabled}
            onClick={() => !disabled && onRatingChange(star)}
            onMouseEnter={() => !disabled && setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            className={`transition-all ${
              disabled ? "cursor-default" : "cursor-pointer hover:scale-110"
            }`}
          >
            <svg
              className={`w-8 h-8 ${
                star <= (hoverRating || rating)
                  ? "text-yellow-400 fill-current"
                  : "text-gray-300"
              }`}
              fill={star <= (hoverRating || rating) ? "currentColor" : "none"}
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
          </button>
        ))}
      </div>
      {!disabled && rating > 0 && (
        <p className="text-sm text-gray-600">
          {rating === 1 && "⭐ Słabo"}
          {rating === 2 && "⭐⭐ Przeciętnie"}
          {rating === 3 && "⭐⭐⭐ Dobrze"}
          {rating === 4 && "⭐⭐⭐⭐ Bardzo dobrze"}
          {rating === 5 && "⭐⭐⭐⭐⭐ Wybitnie"}
        </p>
      )}
    </div>
  );
};

interface ReviewAccountantModalProps {
  isOpen: boolean;
  onClose: () => void;
  accountantId: string;
  accountantName: string;
  workerId?: string;
  employerId?: string;
  cleaningCompanyId?: string;
  onSuccess?: () => void;
}

export const ReviewAccountantModal: React.FC<ReviewAccountantModalProps> = ({
  isOpen,
  onClose,
  accountantId,
  accountantName,
  workerId,
  employerId,
  cleaningCompanyId,
  onSuccess,
}) => {
  const [rating, setRating] = useState(0);
  const [communicationRating, setCommunicationRating] = useState(0);
  const [professionalismRating, setProfessionalismRating] = useState(0);
  const [qualityRating, setQualityRating] = useState(0);
  const [timelinessRating, setTimelinessRating] = useState(0);
  const [comment, setComment] = useState("");
  const [wouldRecommend, setWouldRecommend] = useState<boolean | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      setError("Proszę wystawić ogólną ocenę (gwiazdki)");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const result = await createAccountantReview({
        accountant_id: accountantId,
        worker_id: workerId,
        employer_id: employerId,
        cleaning_company_id: cleaningCompanyId,
        rating,
        comment: comment.trim() || undefined,
        communication_rating:
          communicationRating > 0 ? communicationRating : undefined,
        professionalism_rating:
          professionalismRating > 0 ? professionalismRating : undefined,
        quality_rating: qualityRating > 0 ? qualityRating : undefined,
        timeliness_rating: timelinessRating > 0 ? timelinessRating : undefined,
        would_recommend: wouldRecommend ?? undefined,
      });

      if (result.success) {
        onSuccess?.();
        onClose();

        setRating(0);
        setCommunicationRating(0);
        setProfessionalismRating(0);
        setQualityRating(0);
        setTimelinessRating(0);
        setComment("");
        setWouldRecommend(null);
      } else {
        setError(result.error || "Nie udało się wystawić opinii");
      }
    } catch (err) {
      console.error("Error submitting review:", err);
      setError("Wystąpił nieoczekiwany błąd podczas wystawiania opinii");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">
            ⭐ Wystaw opinię: {accountantName}
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

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              ⚠️ {error}
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              💡 <strong>Twoja opinia pomaga innym!</strong> Wypełnij formularz
              szczegółowo, aby ułatwić przyszłym klientom decyzję o współpracy z
              tym księgowym.
            </p>
          </div>

          <StarRating
            rating={rating}
            onRatingChange={setRating}
            label="Ogólna ocena"
          />

          <div className="bg-gray-50 p-4 rounded-lg space-y-4">
            <h3 className="font-semibold text-gray-900 mb-3">
              Oceny szczegółowe (opcjonalne)
            </h3>

            <StarRating
              rating={communicationRating}
              onRatingChange={setCommunicationRating}
              label="📞 Komunikacja"
            />

            <StarRating
              rating={professionalismRating}
              onRatingChange={setProfessionalismRating}
              label="💼 Profesjonalizm"
            />

            <StarRating
              rating={qualityRating}
              onRatingChange={setQualityRating}
              label="📊 Jakość usług księgowych"
            />

            <StarRating
              rating={timelinessRating}
              onRatingChange={setTimelinessRating}
              label="⏰ Terminowość"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              💬 Komentarz (opcjonalnie)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={6}
              placeholder={`Opisz swoją współpracę z ${accountantName}...\n\nNp.: Jak wyglądała współpraca? Czy księgowy był pomocny? Czy polecasz?`}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              {comment.length} znaków
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              👍 Czy poleciłbyś tego księgowego innym?
            </label>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setWouldRecommend(true)}
                className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                  wouldRecommend === true
                    ? "border-green-500 bg-green-50 text-green-800"
                    : "border-gray-300 bg-white text-gray-700 hover:border-green-300"
                }`}
              >
                ✅ Tak, polecam
              </button>
              <button
                type="button"
                onClick={() => setWouldRecommend(false)}
                className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                  wouldRecommend === false
                    ? "border-red-500 bg-red-50 text-red-800"
                    : "border-gray-300 bg-white text-gray-700 hover:border-red-300"
                }`}
              >
                ❌ Nie polecam
              </button>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Anuluj
            </button>
            <button
              type="submit"
              disabled={isSubmitting || rating === 0}
              className="flex-1 px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "⏳ Wysyłanie..." : "⭐ Wyślij opinię"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
