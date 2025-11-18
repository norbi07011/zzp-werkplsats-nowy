/**
 * =====================================================
 * COVER IMAGE UPLOADER COMPONENT
 * =====================================================
 * Upload/change cover background image for profiles
 * Used by: Workers, Employers, Accountants, Cleaning Companies
 */

import { useState, useRef } from "react";
import { supabase } from "../../lib/supabase";

interface CoverImageUploaderProps {
  currentCoverUrl?: string | null;
  onUploadSuccess: (url: string) => void;
  profileType: "worker" | "employer" | "accountant" | "cleaning_company";
  profileId: string;
}

export function CoverImageUploader({
  currentCoverUrl,
  onUploadSuccess,
  profileType,
  profileId,
}: CoverImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(
    currentCoverUrl || null
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("❌ Proszę wybrać plik graficzny (JPG, PNG, WEBP)");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("❌ Plik jest za duży. Maksymalny rozmiar: 5MB");
      return;
    }

    try {
      setUploading(true);

      // Preview locally
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Upload to Supabase Storage
      const fileExt = file.name.split(".").pop();
      const fileName = `${profileType}-${profileId}-cover-${Date.now()}.${fileExt}`;
      const filePath = `cover-images/${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from("avatars") // Using same bucket as avatars
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl;

      console.log("✅ Cover image uploaded:", publicUrl);
      onUploadSuccess(publicUrl);
      alert("✅ Zdjęcie w tle zostało zaktualizowane!");
    } catch (err: any) {
      console.error("❌ Error uploading cover image:", err);
      alert(`❌ Nie udało się wgrać zdjęcia: ${err.message}`);
      setPreview(currentCoverUrl || null);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    if (!confirm("Czy na pewno chcesz usunąć zdjęcie w tle?")) return;

    try {
      setUploading(true);
      setPreview(null);
      onUploadSuccess(""); // Empty string removes cover
      alert("✅ Zdjęcie w tle zostało usunięte");
    } catch (err: any) {
      console.error("❌ Error removing cover image:", err);
      alert(`❌ Nie udało się usunąć zdjęcia: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Zdjęcie w tle profilu
          </h3>
          <p className="text-sm text-gray-600">
            Duży banner widoczny na górze Twojego profilu publicznego
          </p>
        </div>
      </div>

      {/* Preview */}
      <div className="relative w-full h-48 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg overflow-hidden border-2 border-gray-200">
        {preview ? (
          <>
            <img
              src={preview}
              alt="Podgląd zdjęcia w tle"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/20" />
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500">
              <p className="text-lg">📷</p>
              <p className="text-sm">Brak zdjęcia w tle</p>
            </div>
          </div>
        )}

        {/* Upload Button Overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/40">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="cursor-pointer bg-white text-gray-900 px-6 py-3 rounded-lg font-semibold shadow-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            {uploading ? (
              <div className="flex items-center gap-2">
                <span className="animate-spin">⏳</span>
                <span>Wysyłanie...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span>📤</span>
                <span>{preview ? "Zmień" : "Dodaj"} zdjęcie</span>
              </div>
            )}
          </button>
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        disabled={uploading}
        className="hidden"
      />

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex-1 px-4 py-2 bg-blue-600 text-white text-center rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
        >
          {uploading ? "⏳ Wysyłanie..." : "📤 Wybierz zdjęcie"}
        </button>

        {preview && (
          <button
            onClick={handleRemove}
            disabled={uploading}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50"
          >
            🗑️ Usuń
          </button>
        )}
      </div>

      <p className="text-xs text-gray-500">
        💡 Polecany rozmiar: 1200x300px. Maks. 5MB. Formaty: JPG, PNG, WEBP
      </p>
    </div>
  );
}
