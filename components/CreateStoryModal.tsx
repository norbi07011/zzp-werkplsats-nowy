/**
 * CreateStoryModal - Modal for creating new story (Instagram-like)
 * Allows uploading photo/video, adding caption, marking as job posting
 */

import { useState } from "react";
import {
  X,
  Upload,
  Briefcase,
  MapPin,
  DollarSign,
  Calendar,
} from "lucide-react";
import { supabase } from "../src/lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner";

interface CreateStoryModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateStoryModal = ({
  onClose,
  onSuccess,
}: CreateStoryModalProps) => {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string>("");
  const [caption, setCaption] = useState("");
  const [isJobPosting, setIsJobPosting] = useState(false);

  // Job posting fields
  const [jobTitle, setJobTitle] = useState("");
  const [jobCategory, setJobCategory] = useState("");
  const [jobLocation, setJobLocation] = useState("");
  const [jobBudgetMin, setJobBudgetMin] = useState("");
  const [jobBudgetMax, setJobBudgetMax] = useState("");
  const [jobUrgency, setJobUrgency] = useState("normal");
  const [jobPreferredDate, setJobPreferredDate] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
      toast.error("Tylko obrazy i wideo są dozwolone");
      return;
    }

    // Check file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      toast.error("Plik jest za duży (max 50MB)");
      return;
    }

    setMediaFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setMediaPreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error("Musisz być zalogowany");
      return;
    }

    if (!mediaFile) {
      toast.error("Dodaj zdjęcie lub wideo");
      return;
    }

    if (isJobPosting && !jobTitle) {
      toast.error("Podaj tytuł zlecenia");
      return;
    }

    setUploading(true);

    try {
      // 1. Upload media to Supabase Storage
      const fileExt = mediaFile.name.split(".").pop();
      const fileName = `${user.id}_${Date.now()}.${fileExt}`;
      const filePath = `stories/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars") // Używamy tego samego bucketa co avatary (można też stworzyć osobny 'stories')
        .upload(filePath, mediaFile, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // 2. Get public URL
      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      const mediaUrl = urlData.publicUrl;

      // 3. Create story record
      const supabaseAny = supabase as any;
      const { error: insertError } = await supabaseAny.from("stories").insert({
        author_id: user.id,
        author_type: "regular_user",
        media_url: mediaUrl,
        media_type: mediaFile.type.startsWith("image/") ? "image" : "video",
        caption: caption || null,
        is_job_posting: isJobPosting,
        job_title: isJobPosting ? jobTitle : null,
        job_category: isJobPosting ? jobCategory : null,
        job_location: isJobPosting ? jobLocation : null,
        job_budget_min:
          isJobPosting && jobBudgetMin ? parseFloat(jobBudgetMin) : null,
        job_budget_max:
          isJobPosting && jobBudgetMax ? parseFloat(jobBudgetMax) : null,
        job_urgency: isJobPosting ? jobUrgency : null,
        job_preferred_date:
          isJobPosting && jobPreferredDate ? jobPreferredDate : null,
      });

      if (insertError) throw insertError;

      toast.success("✅ Story dodana!");
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Error creating story:", error);
      toast.error(`Błąd: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Utwórz Story</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Media Upload */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Zdjęcie/Wideo *
            </label>
            <div className="relative">
              {mediaPreview ? (
                <div className="relative">
                  {mediaFile?.type.startsWith("image/") ? (
                    <img
                      src={mediaPreview}
                      alt="Preview"
                      className="w-full h-64 object-cover rounded-xl"
                    />
                  ) : (
                    <video
                      src={mediaPreview}
                      className="w-full h-64 object-cover rounded-xl"
                      controls
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setMediaFile(null);
                      setMediaPreview("");
                    }}
                    className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <Upload className="w-12 h-12 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Kliknij lub przeciągnij plik
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    JPG, PNG, MP4 (max 50MB)
                  </p>
                  <input
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          {/* Caption */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Opis (opcjonalny)
            </label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Dodaj opis do swojej story..."
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
              maxLength={500}
            />
            <p className="text-xs text-gray-500 mt-1">{caption.length}/500</p>
          </div>

          {/* Job Posting Toggle */}
          <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
            <input
              type="checkbox"
              id="isJobPosting"
              checked={isJobPosting}
              onChange={(e) => setIsJobPosting(e.target.checked)}
              className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <label
              htmlFor="isJobPosting"
              className="flex items-center gap-2 cursor-pointer"
            >
              <Briefcase className="w-5 h-5 text-blue-600" />
              <span className="font-medium">To jest ogłoszenie o pracę</span>
            </label>
          </div>

          {/* Job Posting Fields */}
          {isJobPosting && (
            <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
              <h3 className="font-bold text-lg">Szczegóły zlecenia</h3>

              {/* Job Title */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Tytuł zlecenia *
                </label>
                <input
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="np. Malowanie pokoju"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                  required={isJobPosting}
                />
              </div>

              {/* Job Category & Location */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Kategoria
                  </label>
                  <input
                    type="text"
                    value={jobCategory}
                    onChange={(e) => setJobCategory(e.target.value)}
                    placeholder="np. Malowanie"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    <MapPin className="w-4 h-4 inline mr-1" />
                    Lokalizacja
                  </label>
                  <input
                    type="text"
                    value={jobLocation}
                    onChange={(e) => setJobLocation(e.target.value)}
                    placeholder="np. Amsterdam"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                  />
                </div>
              </div>

              {/* Budget */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  <DollarSign className="w-4 h-4 inline mr-1" />
                  Budżet (EUR)
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="number"
                    value={jobBudgetMin}
                    onChange={(e) => setJobBudgetMin(e.target.value)}
                    placeholder="Min"
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                  />
                  <input
                    type="number"
                    value={jobBudgetMax}
                    onChange={(e) => setJobBudgetMax(e.target.value)}
                    placeholder="Max"
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                  />
                </div>
              </div>

              {/* Urgency & Preferred Date */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Priorytet
                  </label>
                  <select
                    value={jobUrgency}
                    onChange={(e) => setJobUrgency(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                  >
                    <option value="low">Niski</option>
                    <option value="normal">Normalny</option>
                    <option value="high">Wysoki</option>
                    <option value="urgent">Pilne 🔥</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Preferowana data
                  </label>
                  <input
                    type="date"
                    value={jobPreferredDate}
                    onChange={(e) => setJobPreferredDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Info */}
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              ℹ️ Story będzie widoczna przez <strong>24 godziny</strong>. Po tym
              czasie automatycznie zniknie.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              disabled={uploading}
            >
              Anuluj
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={uploading || !mediaFile}
            >
              {uploading ? "Dodawanie..." : "Dodaj Story"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
