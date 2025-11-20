/**
 * POST FORM MODAL
 * Modal do tworzenia i edycji postów
 */

import { useState, useEffect } from "react";
import { X } from "./icons";
import type { Post, PostType } from "../src/services/feedService";
import { supabase } from "../src/lib/supabase";

interface PostFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  mode: "create" | "edit";
  postId?: string;
  initialData?: Post;
  authorType: "employer" | "accountant" | "admin";
}

export function PostFormModal({
  isOpen,
  onClose,
  onSuccess,
  mode,
  postId,
  initialData,
  authorType,
}: PostFormModalProps) {
  const [loading, setLoading] = useState(false);
  const [postType, setPostType] = useState<PostType>("job_offer");
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    job_category: "",
    job_location: "",
    job_salary_min: "",
    job_salary_max: "",
  });

  useEffect(() => {
    if (initialData) {
      setPostType(initialData.type);
      setFormData({
        title: initialData.title || "",
        content: initialData.content || "",
        job_category: initialData.job_category || "",
        job_location: initialData.job_location || "",
        job_salary_min: initialData.job_salary_min?.toString() || "",
        job_salary_max: initialData.job_salary_max?.toString() || "",
      });
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) {
      alert("Tytuł i treść są wymagane!");
      return;
    }

    setLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) throw new Error("Nie zalogowany");

      const postData: any = {
        type: postType,
        title: formData.title,
        content: formData.content,
        author_type: authorType,
        profile_id: userData.user.id,
        is_active: true,
        updated_at: new Date().toISOString(),
      };

      // Dodaj pola dla job_offer
      if (postType === "job_offer") {
        postData.job_category = formData.job_category || null;
        postData.job_location = formData.job_location || null;
        postData.job_salary_min = formData.job_salary_min
          ? parseFloat(formData.job_salary_min)
          : null;
        postData.job_salary_max = formData.job_salary_max
          ? parseFloat(formData.job_salary_max)
          : null;
      }

      if (mode === "edit" && postId) {
        // Edycja
        const { error } = await supabase
          .from("posts")
          .update(postData)
          .eq("id", postId)
          .eq("profile_id", userData.user.id);

        if (error) throw error;
        alert("✅ Post zaktualizowany!");
      } else {
        // Tworzenie
        postData.created_at = new Date().toISOString();
        postData.published_at = new Date().toISOString();
        postData.views_count = 0;
        postData.likes_count = 0;
        postData.comments_count = 0;
        postData.shares_count = 0;

        const { error } = await supabase.from("posts").insert(postData);

        if (error) throw error;
        alert("✅ Post utworzony!");
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error saving post:", error);
      alert("❌ Błąd: " + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            {mode === "create" ? "➕ Nowy Post" : "✏️ Edytuj Post"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Type Selector */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Typ postu
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setPostType("job_offer")}
                className={`p-4 rounded-xl border-2 transition-all ${
                  postType === "job_offer"
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                💼 Oferta pracy
              </button>
              <button
                type="button"
                onClick={() => setPostType("ad")}
                className={`p-4 rounded-xl border-2 transition-all ${
                  postType === "ad"
                    ? "border-purple-500 bg-purple-50 text-purple-700"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                📣 Reklama
              </button>
              <button
                type="button"
                onClick={() => setPostType("announcement")}
                className={`p-4 rounded-xl border-2 transition-all ${
                  postType === "announcement"
                    ? "border-amber-500 bg-amber-50 text-amber-700"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                📢 Ogłoszenie
              </button>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Tytuł *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
              placeholder="Np. Szukamy hydraulika..."
              required
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Treść *
            </label>
            <textarea
              value={formData.content}
              onChange={(e) =>
                setFormData({ ...formData, content: e.target.value })
              }
              rows={6}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all resize-none"
              placeholder="Opisz szczegóły..."
              required
            />
          </div>

          {/* Job Offer Fields */}
          {postType === "job_offer" && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Kategoria
                  </label>
                  <input
                    type="text"
                    value={formData.job_category}
                    onChange={(e) =>
                      setFormData({ ...formData, job_category: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 transition-all"
                    placeholder="Np. Hydraulika"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Lokalizacja
                  </label>
                  <input
                    type="text"
                    value={formData.job_location}
                    onChange={(e) =>
                      setFormData({ ...formData, job_location: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 transition-all"
                    placeholder="Np. Amsterdam"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Wynagrodzenie min (€)
                  </label>
                  <input
                    type="number"
                    value={formData.job_salary_min}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        job_salary_min: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 transition-all"
                    placeholder="15"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Wynagrodzenie max (€)
                  </label>
                  <input
                    type="number"
                    value={formData.job_salary_max}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        job_salary_max: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 transition-all"
                    placeholder="25"
                  />
                </div>
              </div>
            </>
          )}

          {/* Actions */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-bold hover:shadow-lg transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? "⏳ Zapisywanie..."
                : mode === "create"
                ? "✅ Utwórz Post"
                : "💾 Zapisz Zmiany"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-all"
            >
              Anuluj
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
