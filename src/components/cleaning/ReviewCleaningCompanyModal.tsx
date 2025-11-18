import React, { useState } from "react";
import { createCleaningReview } from "../../services/cleaningReviewService";

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

interface ReviewCleaningCompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  cleaningCompanyId: string;
  cleaningCompanyName: string;
  employerId?: string;
  workerId?: string;
  accountantId?: string;
  onSuccess?: () => void;
}

export const ReviewCleaningCompanyModal: React.FC<
  ReviewCleaningCompanyModalProps
> = ({
  isOpen,
  onClose,
  cleaningCompanyId,
  cleaningCompanyName,
  employerId,
  workerId,
  accountantId,
  onSuccess,
}) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [workType, setWorkType] = useState("");
  const [workDate, setWorkDate] = useState("");
  const [workDuration, setWorkDuration] = useState("");
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
      const result = await createCleaningReview({
        cleaning_company_id: cleaningCompanyId,
        employer_id: employerId,
        worker_id: workerId,
        accountant_id: accountantId,
        rating,
        review_text: comment.trim() || undefined,
        work_type: workType.trim() || undefined,
        work_date: workDate || undefined,
        work_duration_hours: workDuration
          ? parseFloat(workDuration)
          : undefined,
      });

      if (result.success) {
        onSuccess?.();
        onClose();

        // Reset form
        setRating(0);
        setComment("");
        setWorkType("");
        setWorkDate("");
        setWorkDuration("");
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
            ⭐ Wystaw opinię: {cleaningCompanyName}
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
              tą firmą sprzątającą.
            </p>
          </div>

          <StarRating
            rating={rating}
            onRatingChange={setRating}
            label="Ogólna ocena usług sprzątania"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              💬 Komentarz (opcjonalnie)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={6}
              placeholder={`Opisz swoją współpracę z ${cleaningCompanyName}...\n\nNp.: Jak wyglądały usługi? Czy firma była punktualna? Czy polecasz?`}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              {comment.length} znaków
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg space-y-4">
            <h3 className="font-semibold text-gray-900 mb-3">
              Szczegóły zlecenia (opcjonalne)
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🏢 Rodzaj prac
              </label>
              <input
                type="text"
                value={workType}
                onChange={(e) => setWorkType(e.target.value)}
                placeholder="Np.: Sprzątanie biura, mieszkania, budowy..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📅 Data wykonania
              </label>
              <input
                type="date"
                value={workDate}
                onChange={(e) => setWorkDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ⏱️ Czas trwania (godziny)
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                max="100"
                value={workDuration}
                onChange={(e) => setWorkDuration(e.target.value)}
                placeholder="Np.: 4 lub 8.5"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
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
              className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "⏳ Wysyłanie..." : "⭐ Wyślij opinię"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
