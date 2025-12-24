/**
 * StoryViewer - Full-screen Instagram-like story viewer
 * Shows story content, allows reactions from workers, shows reactions to authors
 */

import { useState, useEffect, useRef } from "react";
import {
  X,
  Heart,
  ThumbsUp,
  Star,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  User,
} from "lucide-react";
import { supabase } from "../src/lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface Story {
  id: string;
  author_id: string;
  media_url: string;
  media_type: string;
  caption: string | null;
  is_job_posting: boolean;
  job_title: string | null;
  job_category: string | null;
  job_location: string | null;
  job_budget_min: number | null;
  job_budget_max: number | null;
  job_urgency: string | null;
  views_count: number;
  reactions_count: number;
  created_at: string;
  expires_at: string;
  author: {
    full_name: string | null;
    avatar_url: string | null;
    role: string;
  };
}

interface Reaction {
  id: string;
  worker_id: string;
  worker_profile_id: string;
  reaction_type: string;
  message: string | null;
  available_from: string | null;
  estimated_hours: number | null;
  offered_price: number | null;
  status: string;
  created_at: string;
  worker: {
    profile_id: string;
    specialization: string | null;
    rating: number;
    rating_count: number;
    avatar_url: string | null;
    full_name: string | null;
  };
}

interface StoryViewerProps {
  storyId: string;
  authorId: string;
  onClose: () => void;
}

export const StoryViewer = ({
  storyId,
  authorId,
  onClose,
}: StoryViewerProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [story, setStory] = useState<Story | null>(null);
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReactions, setShowReactions] = useState(false);
  const [showReactModal, setShowReactModal] = useState(false);
  const progressRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-close after 10 seconds (story duration)
  useEffect(() => {
    timerRef.current = setTimeout(() => {
      onClose();
    }, 10000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [onClose]);

  useEffect(() => {
    loadStory();
    loadReactions();
    incrementViewCount();
  }, [storyId]);

  const loadStory = async () => {
    try {
      const supabaseAny = supabase as any;
      const { data, error } = await supabaseAny
        .from("stories")
        .select(
          `
          *,
          profiles:author_id (
            full_name,
            avatar_url,
            role
          )
        `
        )
        .eq("id", storyId)
        .single();

      if (error) throw error;

      setStory({
        ...data,
        author: {
          full_name: data.profiles?.full_name || "Unknown",
          avatar_url: data.profiles?.avatar_url || null,
          role: data.profiles?.role || "regular_user",
        },
      });
    } catch (error) {
      console.error("Error loading story:", error);
      toast.error("Nie udało się załadować story");
    } finally {
      setLoading(false);
    }
  };

  const loadReactions = async () => {
    try {
      const supabaseAny = supabase as any;
      const { data, error } = await supabaseAny
        .from("story_reactions")
        .select(
          `
          *,
          workers (
            profile_id,
            specialization,
            rating,
            rating_count,
            profiles:profile_id (
              full_name,
              avatar_url
            )
          )
        `
        )
        .eq("story_id", storyId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setReactions(
        (data || []).map((r: any) => ({
          ...r,
          worker: {
            profile_id: r.workers?.profile_id,
            specialization: r.workers?.specialization,
            rating: r.workers?.rating || 0,
            rating_count: r.workers?.rating_count || 0,
            avatar_url: r.workers?.profiles?.avatar_url || null,
            full_name: r.workers?.profiles?.full_name || "Unknown Worker",
          },
        }))
      );
    } catch (error) {
      console.error("Error loading reactions:", error);
    }
  };

  const incrementViewCount = async () => {
    try {
      const supabaseAny = supabase as any;
      await supabaseAny
        .from("stories")
        .update({ views_count: (story?.views_count || 0) + 1 })
        .eq("id", storyId);
    } catch (error) {
      console.error("Error incrementing view count:", error);
    }
  };

  const handleReact = async (reactionType: string) => {
    if (!user) {
      toast.error("Musisz być zalogowany");
      return;
    }

    // Check if user is worker
    const supabaseAny = supabase as any;
    const { data: workerData } = await supabaseAny
      .from("workers")
      .select("id")
      .eq("profile_id", user.id)
      .single();

    if (!workerData) {
      toast.error("Tylko pracownicy mogą reagować na stories");
      return;
    }

    try {
      const { error } = await supabaseAny.from("story_reactions").insert({
        story_id: storyId,
        worker_id: workerData.id,
        worker_profile_id: user.id,
        reaction_type: reactionType,
      });

      if (error) throw error;

      toast.success("✅ Reakcja dodana!");
      loadReactions();
      setShowReactModal(false);
    } catch (error: any) {
      if (error.code === "23505") {
        toast.error("Już zareagowałeś na tę story");
      } else {
        console.error("Error adding reaction:", error);
        toast.error("Błąd dodawania reakcji");
      }
    }
  };

  const handleContactWorker = (workerId: string) => {
    navigate(`/worker/${workerId}`);
  };

  const getTimeRemaining = () => {
    if (!story) return "";
    const expiresAt = new Date(story.expires_at);
    const now = new Date();
    const diffMs = expiresAt.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffHours > 0) return `${diffHours}h ${diffMinutes}m left`;
    if (diffMinutes > 0) return `${diffMinutes}m left`;
    return "Ending soon";
  };

  if (loading || !story) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent" />
      </div>
    );
  }

  const isMyStory = story.author_id === user?.id;
  const isWorker =
    user?.id && reactions.some((r) => r.worker_profile_id === user.id);

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Progress Bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gray-700">
        <div
          ref={progressRef}
          className="h-full bg-white transition-all duration-[10000ms] ease-linear"
          style={{ width: "100%" }}
        />
      </div>

      {/* Header */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          {story.author.avatar_url ? (
            <img
              src={story.author.avatar_url}
              alt={story.author.full_name || "User"}
              className="w-10 h-10 rounded-full border-2 border-white"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold border-2 border-white">
              {story.author.full_name?.[0] || "?"}
            </div>
          )}
          <div>
            <p className="text-white font-semibold text-sm">
              {story.author.full_name}
            </p>
            <p className="text-gray-300 text-xs">{getTimeRemaining()}</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
        >
          <X className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Story Content */}
      <div className="w-full h-full flex items-center justify-center">
        {story.media_type === "image" ? (
          <img
            src={story.media_url}
            alt="Story"
            className="max-w-full max-h-full object-contain"
          />
        ) : (
          <video
            src={story.media_url}
            className="max-w-full max-h-full object-contain"
            autoPlay
            loop
            muted
          />
        )}
      </div>

      {/* Caption Overlay */}
      {story.caption && (
        <div className="absolute bottom-32 left-4 right-4 bg-black/70 backdrop-blur-sm p-4 rounded-lg">
          <p className="text-white text-sm">{story.caption}</p>
        </div>
      )}

      {/* Job Posting Info */}
      {story.is_job_posting && (
        <div className="absolute bottom-48 left-4 right-4 bg-gradient-to-r from-green-500/90 to-blue-500/90 backdrop-blur-sm p-4 rounded-lg">
          <p className="text-white font-bold text-lg mb-2">
            💼 {story.job_title}
          </p>
          <div className="flex flex-wrap gap-2 text-xs text-white">
            {story.job_category && (
              <span className="bg-white/20 px-2 py-1 rounded">
                {story.job_category}
              </span>
            )}
            {story.job_location && (
              <span className="bg-white/20 px-2 py-1 rounded">
                📍 {story.job_location}
              </span>
            )}
            {story.job_budget_min && story.job_budget_max && (
              <span className="bg-white/20 px-2 py-1 rounded">
                €{story.job_budget_min} - €{story.job_budget_max}
              </span>
            )}
            {story.job_urgency && story.job_urgency !== "normal" && (
              <span className="bg-red-500 px-2 py-1 rounded font-bold">
                🔥 {story.job_urgency.toUpperCase()}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Bottom Action Bar */}
      <div className="absolute bottom-8 left-4 right-4 flex items-center justify-between">
        {/* React Button (for workers) */}
        {!isMyStory && (
          <button
            onClick={() => setShowReactModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-500 to-red-500 text-white font-semibold rounded-full hover:scale-105 transition-transform"
          >
            <Heart className="w-5 h-5" />
            Zareaguj
          </button>
        )}

        {/* View Reactions Button (for story author) */}
        {isMyStory && (
          <button
            onClick={() => setShowReactions(true)}
            className="flex items-center gap-2 px-6 py-3 bg-white text-gray-900 font-semibold rounded-full hover:scale-105 transition-transform"
          >
            <MessageCircle className="w-5 h-5" />
            Reakcje ({reactions.length})
          </button>
        )}

        {/* Stats */}
        <div className="flex items-center gap-4 text-white text-sm">
          <span>👁️ {story.views_count}</span>
          <span>❤️ {reactions.length}</span>
        </div>
      </div>

      {/* React Modal (for workers) */}
      {showReactModal && !isMyStory && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">Wybierz reakcję</h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleReact("interested")}
                className="p-4 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
              >
                <Star className="w-6 h-6 mx-auto mb-2" />
                <p className="text-sm font-semibold">Zainteresowany</p>
              </button>
              <button
                onClick={() => handleReact("like")}
                className="p-4 bg-pink-500 text-white rounded-xl hover:bg-pink-600 transition-colors"
              >
                <Heart className="w-6 h-6 mx-auto mb-2" />
                <p className="text-sm font-semibold">Lubię to</p>
              </button>
              <button
                onClick={() => handleReact("available")}
                className="p-4 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors"
              >
                <ThumbsUp className="w-6 h-6 mx-auto mb-2" />
                <p className="text-sm font-semibold">Dostępny</p>
              </button>
              <button
                onClick={() => setShowReactModal(false)}
                className="p-4 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-white rounded-xl hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
              >
                <X className="w-6 h-6 mx-auto mb-2" />
                <p className="text-sm font-semibold">Anuluj</p>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reactions List (for story author) */}
      {showReactions && isMyStory && (
        <div className="absolute inset-0 bg-black/90 backdrop-blur-sm overflow-y-auto">
          <div className="max-w-2xl mx-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-white">
                Reakcje ({reactions.length})
              </h3>
              <button
                onClick={() => setShowReactions(false)}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            <div className="space-y-4">
              {reactions.map((reaction) => (
                <div
                  key={reaction.id}
                  className="bg-white dark:bg-gray-800 rounded-xl p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    {reaction.worker.avatar_url ? (
                      <img
                        src={reaction.worker.avatar_url}
                        alt={reaction.worker.full_name || "Worker"}
                        className="w-12 h-12 rounded-full"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                        {reaction.worker.full_name?.[0] || "?"}
                      </div>
                    )}
                    <div>
                      <p className="font-semibold">
                        {reaction.worker.full_name}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {reaction.worker.specialization || "Worker"}
                      </p>
                      <p className="text-xs text-gray-500">
                        ⭐ {reaction.worker.rating.toFixed(1)} (
                        {reaction.worker.rating_count})
                      </p>
                      <p className="text-xs text-blue-500 font-semibold">
                        {reaction.reaction_type === "interested" &&
                          "⭐ Zainteresowany"}
                        {reaction.reaction_type === "like" && "❤️ Polubił"}
                        {reaction.reaction_type === "available" &&
                          "✅ Dostępny"}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() =>
                      handleContactWorker(reaction.worker_profile_id)
                    }
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
                  >
                    <User className="w-4 h-4" />
                    Zobacz profil
                  </button>
                </div>
              ))}

              {reactions.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>Brak reakcji na razie</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
