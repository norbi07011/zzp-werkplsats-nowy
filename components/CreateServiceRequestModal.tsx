import { useState, useEffect } from "react";
import { supabase } from "../src/lib/supabase";
import { toast } from "sonner";
import { XMarkIcon } from "./icons";
import {
  uploadMultipleFeedMedia,
  type MediaUploadResult,
} from "../src/services/storage";

interface CreateServiceRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userId: string;
  editingRequestId?: string | null;
}

export default function CreateServiceRequestModal({
  isOpen,
  onClose,
  onSuccess,
  userId,
  editingRequestId,
}: CreateServiceRequestModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedMedia, setUploadedMedia] = useState<MediaUploadResult[]>([]);
  const [formData, setFormData] = useState({
    title: "",
    request_category: "",
    content: "",
    request_location: "",
    request_budget_min: "",
    request_budget_max: "",
    request_urgency: "normal",
    request_preferred_date: "",
  });

  // Załaduj dane przy edycji
  useEffect(() => {
    const loadRequestData = async () => {
      if (!editingRequestId) {
        // Reset formularza przy tworzeniu nowego
        setFormData({
          title: "",
          request_category: "",
          content: "",
          request_location: "",
          request_budget_min: "",
          request_budget_max: "",
          request_urgency: "normal",
          request_preferred_date: "",
        });
        setUploadedMedia([]);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("posts")
          .select("*")
          .eq("id", editingRequestId)
          .single();

        if (error) {
          console.error("[MODAL] Error loading request:", error);
          toast.error("Błąd ładowania zlecenia");
          return;
        }

        // Wypełnij formularz danymi
        setFormData({
          title: data.title || "",
          request_category: data.request_category || "",
          content: data.content || "",
          request_location: data.request_location || "",
          request_budget_min: data.request_budget_min?.toString() || "",
          request_budget_max: data.request_budget_max?.toString() || "",
          request_urgency: data.request_urgency || "normal",
          request_preferred_date: data.request_preferred_date || "",
        });

        // Załaduj istniejące zdjęcia
        if (data.media_urls && data.media_urls.length > 0) {
          const mediaResults: MediaUploadResult[] = data.media_urls.map(
            (url: string) => ({
              success: true,
              url,
              type: "image",
            })
          );
          setUploadedMedia(mediaResults);
        }
      } catch (error) {
        console.error("[MODAL] Unexpected error:", error);
        toast.error("Wystąpił nieoczekiwany błąd");
      }
    };

    if (isOpen) {
      loadRequestData();
    }
  }, [editingRequestId, isOpen]);

  if (!isOpen) return null;

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Maksymalnie 5 zdjęć
    if (uploadedMedia.length + files.length > 5) {
      toast.error("❌ Możesz dodać maksymalnie 5 zdjęć");
      return;
    }

    try {
      const filesArray = Array.from(files);
      const uploadResult = await uploadMultipleFeedMedia(filesArray, userId);

      if (!uploadResult.success) {
        toast.error(uploadResult.error || "❌ Błąd podczas przesyłania zdjęć");
        return;
      }

      // uploadResult.results to tablica obiektów MediaUploadResult
      const successfulUploads = uploadResult.results.filter((r) => r.success);
      setUploadedMedia([...uploadedMedia, ...successfulUploads]);
      toast.success(`✅ Dodano ${successfulUploads.length} zdjęć`);
    } catch (error) {
      console.error("[MODAL] Upload error:", error);
      toast.error("❌ Błąd podczas przesyłania zdjęć");
    }
  };

  const removeMedia = (index: number) => {
    setUploadedMedia(uploadedMedia.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.title.trim() ||
      !formData.request_category ||
      !formData.content.trim()
    ) {
      toast.error("Wypełnij wymagane pola!");
      return;
    }

    setIsSubmitting(true);

    try {
      const supabaseAny = supabase as any;
      const mediaUrls = uploadedMedia
        .filter((m) => m.success && m.url)
        .map((m) => m.url);

      const postData = {
        title: formData.title,
        content: formData.content,
        request_category: formData.request_category,
        request_location: formData.request_location || null,
        request_budget_min: formData.request_budget_min
          ? parseFloat(formData.request_budget_min)
          : null,
        request_budget_max: formData.request_budget_max
          ? parseFloat(formData.request_budget_max)
          : null,
        request_urgency: formData.request_urgency,
        request_preferred_date: formData.request_preferred_date || null,
        media_urls: mediaUrls.length > 0 ? mediaUrls : null,
        updated_at: new Date().toISOString(),
        // 🔥 SYNC request_* → generic fields (CRITICAL FOR FILTERS)
        location: formData.request_location || null,
        category: formData.request_category || null,
        budget:
          formData.request_budget_min || formData.request_budget_max
            ? (parseFloat(formData.request_budget_min || "0") +
                parseFloat(formData.request_budget_max || "0")) /
                2 || null
            : null,
      };

      if (editingRequestId) {
        // TRYB EDYCJI - UPDATE
        const { error } = await supabaseAny
          .from("posts")
          .update(postData)
          .eq("id", editingRequestId)
          .eq("author_id", userId);

        if (error) {
          console.error("[MODAL] Update error:", error);
          toast.error("❌ Błąd aktualizacji zlecenia");
          return;
        }

        toast.success("✅ Zlecenie zaktualizowane!");
      } else {
        // TRYB TWORZENIA - INSERT
        const { error } = await supabaseAny.from("posts").insert({
          profile_id: userId,
          author_id: userId,
          author_type: "regular_user",
          type: "service_request",
          ...postData,
        });

        if (error) {
          console.error("[MODAL] Insert error:", error);
          toast.error("❌ Błąd tworzenia zlecenia");
          return;
        }

        toast.success("✅ Zlecenie utworzone!");
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error("[MODAL] Unexpected error:", error);
      toast.error("Wystąpił nieoczekiwany błąd");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {editingRequestId
              ? "✏️ Edytuj zlecenie"
              : "➕ Utwórz nowe zlecenie"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isSubmitting}
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Tytuł */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tytuł zlecenia *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="np. Remont łazienki 10m²"
              required
            />
          </div>

          {/* Kategoria */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kategoria *
            </label>
            <select
              value={formData.request_category}
              onChange={(e) =>
                setFormData({ ...formData, request_category: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Wybierz kategorię...</option>
              <option value="plumbing">Hydraulika</option>
              <option value="electrical">Elektryka</option>
              <option value="carpentry">Stolarka</option>
              <option value="painting">Malowanie</option>
              <option value="cleaning">Sprzątanie</option>
              <option value="gardening">Ogrodnictwo</option>
              <option value="renovation">Remont</option>
              <option value="moving">Przeprowadzka</option>
              <option value="other">Inne</option>
            </select>
          </div>

          {/* Opis */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Opis zlecenia *
            </label>
            <textarea
              value={formData.content}
              onChange={(e) =>
                setFormData({ ...formData, content: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={4}
              placeholder="Opisz szczegółowo czego potrzebujesz..."
              required
            />
          </div>

          {/* Lokalizacja */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Lokalizacja
            </label>
            <input
              type="text"
              value={formData.request_location}
              onChange={(e) =>
                setFormData({ ...formData, request_location: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="np. Amsterdam, Centrum"
            />
          </div>

          {/* Budżet */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Budżet min (€)
              </label>
              <input
                type="number"
                value={formData.request_budget_min}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    request_budget_min: e.target.value,
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="100"
                min="0"
                step="10"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Budżet max (€)
              </label>
              <input
                type="number"
                value={formData.request_budget_max}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    request_budget_max: e.target.value,
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="500"
                min="0"
                step="10"
              />
            </div>
          </div>

          {/* Pilność */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pilność
            </label>
            <select
              value={formData.request_urgency}
              onChange={(e) =>
                setFormData({ ...formData, request_urgency: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="low">Niska - w ciągu miesiąca</option>
              <option value="normal">Normalna - w ciągu 2 tygodni</option>
              <option value="high">Wysoka - w ciągu tygodnia</option>
              <option value="urgent">Pilne - jak najszybciej</option>
            </select>
          </div>

          {/* Preferowana data */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Preferowana data rozpoczęcia
            </label>
            <input
              type="date"
              value={formData.request_preferred_date}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  request_preferred_date: e.target.value,
                })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min={new Date().toISOString().split("T")[0]}
            />
          </div>

          {/* Upload zdjęć */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Zdjęcia (opcjonalne, max 5)
            </label>
            <div className="space-y-4">
              {/* Preview zdjęć */}
              {uploadedMedia.length > 0 && (
                <div className="grid grid-cols-3 gap-4">
                  {uploadedMedia.map((media, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={media.url}
                        alt={`Zdjęcie ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeMedia(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <XMarkIcon className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload button */}
              {uploadedMedia.length < 5 && (
                <label className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors">
                  <div className="text-center">
                    <div className="text-4xl mb-2">📷</div>
                    <p className="text-sm text-gray-600">
                      Kliknij aby dodać zdjęcia
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {uploadedMedia.length}/5 zdjęć
                    </p>
                  </div>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleMediaUpload}
                    className="hidden"
                    disabled={isSubmitting}
                  />
                </label>
              )}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              disabled={isSubmitting}
            >
              Anuluj
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? editingRequestId
                  ? "Zapisywanie..."
                  : "Tworzenie..."
                : editingRequestId
                ? "Zapisz zmiany"
                : "Utwórz zlecenie"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
