/**
 * POST STATS MODAL
 * Modal ze statystykami postu
 */

import { useState, useEffect } from "react";
import { X, Eye, Heart, MessageSquare, Bookmark, TrendingUp } from "./icons";
import { supabase } from "../src/lib/supabase";

interface PostStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  postId: string;
  postTitle: string;
}

interface PostStats {
  views_count: number;
  likes_count: number;
  like_count: number;
  love_count: number;
  wow_count: number;
  sad_count: number;
  angry_count: number;
  comments_count: number;
  shares_count: number;
  saves_count: number;
}

export function PostStatsModal({
  isOpen,
  onClose,
  postId,
  postTitle,
}: PostStatsModalProps) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<PostStats | null>(null);

  useEffect(() => {
    if (isOpen && postId) {
      loadStats();
    }
  }, [isOpen, postId]);

  const loadStats = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("posts")
        .select(
          `
          views_count,
          likes_count,
          love_count,
          wow_count,
          sad_count,
          angry_count,
          comments_count,
          shares_count,
          saves_count
        `
        )
        .eq("id", postId)
        .single();

      if (error) throw error;
      setStats(data as any); // Type assertion - database types will catch up on next restart
    } catch (error) {
      console.error("Error loading stats:", error);
      alert("Błąd ładowania statystyk");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <TrendingUp className="w-6 h-6" />
                Statystyki Postu
              </h2>
              <p className="text-blue-100 mt-1 line-clamp-1">{postTitle}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">Ładowanie statystyk...</p>
            </div>
          ) : stats ? (
            <div className="space-y-6">
              {/* Main Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-xl p-4 text-center">
                  <Eye className="w-8 h-8 mx-auto text-blue-600 mb-2" />
                  <p className="text-3xl font-bold text-gray-900">
                    {stats.views_count || 0}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">Wyświetlenia</p>
                </div>

                <div className="bg-red-50 rounded-xl p-4 text-center">
                  <Heart className="w-8 h-8 mx-auto text-red-600 mb-2" />
                  <p className="text-3xl font-bold text-gray-900">
                    {(stats.likes_count || 0) + (stats.like_count || 0)}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">Polubienia</p>
                </div>

                <div className="bg-green-50 rounded-xl p-4 text-center">
                  <MessageSquare className="w-8 h-8 mx-auto text-green-600 mb-2" />
                  <p className="text-3xl font-bold text-gray-900">
                    {stats.comments_count || 0}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">Komentarze</p>
                </div>

                <div className="bg-amber-50 rounded-xl p-4 text-center">
                  <Bookmark className="w-8 h-8 mx-auto text-amber-600 mb-2" />
                  <p className="text-3xl font-bold text-gray-900">
                    {stats.saves_count || 0}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">Zapisane</p>
                </div>
              </div>

              {/* Reactions Breakdown */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  Rozkład reakcji
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700 flex items-center gap-2">
                      <span className="text-2xl">👍</span> Like
                    </span>
                    <span className="font-bold text-gray-900">
                      {stats.like_count || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700 flex items-center gap-2">
                      <span className="text-2xl">❤️</span> Love
                    </span>
                    <span className="font-bold text-gray-900">
                      {stats.love_count || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700 flex items-center gap-2">
                      <span className="text-2xl">😮</span> Wow
                    </span>
                    <span className="font-bold text-gray-900">
                      {stats.wow_count || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700 flex items-center gap-2">
                      <span className="text-2xl">😢</span> Sad
                    </span>
                    <span className="font-bold text-gray-900">
                      {stats.sad_count || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700 flex items-center gap-2">
                      <span className="text-2xl">😠</span> Angry
                    </span>
                    <span className="font-bold text-gray-900">
                      {stats.angry_count || 0}
                    </span>
                  </div>
                </div>
              </div>

              {/* Total Engagement */}
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl p-6 text-center">
                <p className="text-sm uppercase tracking-wide mb-2">
                  Całkowite zaangażowanie
                </p>
                <p className="text-5xl font-black">
                  {(stats.views_count || 0) +
                    (stats.likes_count || 0) +
                    (stats.like_count || 0) +
                    (stats.comments_count || 0) +
                    (stats.shares_count || 0)}
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              Brak dostępnych statystyk
            </div>
          )}

          {/* Close Button */}
          <button
            onClick={onClose}
            className="w-full mt-6 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-all"
          >
            Zamknij
          </button>
        </div>
      </div>
    </div>
  );
}
