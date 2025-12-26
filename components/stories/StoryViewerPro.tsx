/**
 * StoryViewerPro - Professional Instagram/Facebook-style Story Viewer
 *
 * Features:
 * - View multiple stories per author
 * - Tap left/right to navigate between stories
 * - Swipe left/right to switch between authors
 * - Progress bar segments for each story
 * - Hold to pause
 * - Auto-advance (5 seconds per story)
 * - Reactions for workers
 * - Reply/comment for other users
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Heart,
  MessageCircle,
  Send,
  MoreHorizontal,
  Eye,
  Trash2,
  Share2,
  Bookmark,
  Briefcase,
  MapPin,
  DollarSign,
  Clock,
  User,
} from "lucide-react";

// Custom SVG icons for missing lucide-react exports
const PlayIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M8 5v14l11-7z" />
  </svg>
);

const PauseIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
  </svg>
);

const FlagIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    viewBox="0 0 24 24"
  >
    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zM4 22v-7" />
  </svg>
);
import { supabase } from "../../src/lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { toast } from "sonner";

// =====================================================
// TYPES
// =====================================================

interface Story {
  id: string;
  author_id: string;
  author_type: string;
  media_url: string;
  media_type: "image" | "video";
  caption: string | null;
  is_job_posting: boolean;
  job_title: string | null;
  job_category: string | null;
  job_location: string | null;
  job_budget_min: number | null;
  job_budget_max: number | null;
  job_urgency: string | null;
  job_preferred_date: string | null;
  views_count: number;
  reactions_count: number;
  created_at: string;
  expires_at: string;
}

interface AuthorGroup {
  authorId: string;
  authorName: string;
  authorAvatar: string;
  stories: Story[];
}

interface StoryViewerProProps {
  initialAuthorId: string;
  initialStoryId?: string;
  authorGroups: AuthorGroup[];
  onClose: () => void;
}

interface StoryReaction {
  id: string;
  story_id: string;
  worker_id: string;
  profile_id?: string;
  user_type?: string;
  reaction_type: string;
  created_at: string;
  worker?: {
    full_name: string;
    avatar_url: string;
    profile_id?: string;
  };
  profiles?: {
    id: string;
    full_name: string;
    avatar_url: string;
    role: string;
  };
}

// =====================================================
// CONSTANTS
// =====================================================

const STORY_DURATION = 5000; // 5 seconds per story

// Jeden typ reakcji - "interested" (Zainteresowany)
const SINGLE_REACTION = {
  type: "interested",
  emoji: "👀",
  label: "Zainteresowany",
};

// =====================================================
// MAIN COMPONENT
// =====================================================

export const StoryViewerPro = ({
  initialAuthorId,
  initialStoryId,
  authorGroups,
  onClose,
}: StoryViewerProProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(
    null
  );

  // Navigation state
  const [currentAuthorIndex, setCurrentAuthorIndex] = useState(() =>
    Math.max(
      0,
      authorGroups.findIndex((g) => g.authorId === initialAuthorId)
    )
  );
  const [currentStoryIndex, setCurrentStoryIndex] = useState(() => {
    if (!initialStoryId) return 0;
    const authorGroup = authorGroups.find(
      (g) => g.authorId === initialAuthorId
    );
    if (!authorGroup) return 0;
    return Math.max(
      0,
      authorGroup.stories.findIndex((s) => s.id === initialStoryId)
    );
  });

  // Playback state
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);

  // UI state
  const [showReactions, setShowReactions] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [reactions, setReactions] = useState<StoryReaction[]>([]);
  const [viewedStories, setViewedStories] = useState<Set<string>>(new Set());
  const [replyText, setReplyText] = useState("");
  const [showReplyInput, setShowReplyInput] = useState(false);

  // Current data
  const currentAuthor = authorGroups[currentAuthorIndex];
  const currentStory = currentAuthor?.stories[currentStoryIndex];
  const isOwnStory = currentStory?.author_id === user?.id;

  console.log("🎬 [StoryViewerPro] Render:", {
    currentAuthorIndex,
    currentStoryIndex,
    currentAuthor: currentAuthor?.authorName,
    currentStory: currentStory?.id,
    storyAuthorId: currentStory?.author_id,
    userId: user?.id,
    isOwnStory,
    userExists: !!user,
  });

  // =====================================================
  // STORY PROGRESSION
  // =====================================================

  const startProgress = useCallback(() => {
    if (progressRef.current) {
      clearInterval(progressRef.current);
    }

    setProgress(0);
    const interval = 50; // Update every 50ms
    const increment = (interval / STORY_DURATION) * 100;

    progressRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          // Go to next story
          goToNextStory();
          return 0;
        }
        return prev + increment;
      });
    }, interval);
  }, []);

  const pauseProgress = useCallback(() => {
    if (progressRef.current) {
      clearInterval(progressRef.current);
      progressRef.current = null;
    }
  }, []);

  const resumeProgress = useCallback(() => {
    if (!isPaused && !progressRef.current) {
      const remaining = ((100 - progress) / 100) * STORY_DURATION;
      const interval = 50;
      const increment = (interval / remaining) * (100 - progress);

      progressRef.current = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            goToNextStory();
            return 0;
          }
          return prev + increment;
        });
      }, interval);
    }
  }, [isPaused, progress]);

  // =====================================================
  // NAVIGATION
  // =====================================================

  const goToNextStory = useCallback(() => {
    if (!currentAuthor) return;

    if (currentStoryIndex < currentAuthor.stories.length - 1) {
      // Next story from same author
      setCurrentStoryIndex((prev) => prev + 1);
      setProgress(0);
    } else if (currentAuthorIndex < authorGroups.length - 1) {
      // Next author
      setCurrentAuthorIndex((prev) => prev + 1);
      setCurrentStoryIndex(0);
      setProgress(0);
    } else {
      // End of all stories - use setTimeout to avoid setState during render
      setTimeout(() => onClose(), 0);
    }
  }, [
    currentAuthor,
    currentStoryIndex,
    currentAuthorIndex,
    authorGroups.length,
    onClose,
  ]);

  const goToPrevStory = useCallback(() => {
    if (currentStoryIndex > 0) {
      // Previous story from same author
      setCurrentStoryIndex((prev) => prev - 1);
      setProgress(0);
    } else if (currentAuthorIndex > 0) {
      // Previous author (last story)
      const prevAuthor = authorGroups[currentAuthorIndex - 1];
      setCurrentAuthorIndex((prev) => prev - 1);
      setCurrentStoryIndex(prevAuthor.stories.length - 1);
      setProgress(0);
    }
    // If at the very beginning, do nothing
  }, [currentStoryIndex, currentAuthorIndex, authorGroups]);

  const goToAuthor = useCallback(
    (direction: "prev" | "next") => {
      if (direction === "prev" && currentAuthorIndex > 0) {
        setCurrentAuthorIndex((prev) => prev - 1);
        setCurrentStoryIndex(0);
        setProgress(0);
      } else if (
        direction === "next" &&
        currentAuthorIndex < authorGroups.length - 1
      ) {
        setCurrentAuthorIndex((prev) => prev + 1);
        setCurrentStoryIndex(0);
        setProgress(0);
      } else if (direction === "next") {
        // Use setTimeout to avoid setState during render
        setTimeout(() => onClose(), 0);
      }
    },
    [currentAuthorIndex, authorGroups.length, onClose]
  );

  // =====================================================
  // TOUCH/CLICK HANDLERS
  // =====================================================

  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

    touchStartRef.current = { x: clientX, y: clientY, time: Date.now() };

    // Pause on hold
    pauseProgress();
    setIsPaused(true);
  };

  const handleTouchEnd = (e: React.TouchEvent | React.MouseEvent) => {
    if (!touchStartRef.current || !containerRef.current) {
      setIsPaused(false);
      resumeProgress();
      return;
    }

    const clientX =
      "changedTouches" in e ? e.changedTouches[0].clientX : e.clientX;
    const clientY =
      "changedTouches" in e ? e.changedTouches[0].clientY : e.clientY;
    const { x: startX, y: startY, time } = touchStartRef.current;

    const deltaX = clientX - startX;
    const deltaY = clientY - startY;
    const deltaTime = Date.now() - time;
    const containerWidth = containerRef.current.offsetWidth;

    // Short hold = tap
    if (deltaTime < 200 && Math.abs(deltaX) < 30 && Math.abs(deltaY) < 30) {
      // Tap on left third = previous, right = next
      const tapPosition = clientX / containerWidth;
      if (tapPosition < 0.33) {
        goToPrevStory();
      } else if (tapPosition > 0.66) {
        goToNextStory();
      }
    }
    // Horizontal swipe = switch author
    else if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX > 0) {
        goToAuthor("prev");
      } else {
        goToAuthor("next");
      }
    }

    touchStartRef.current = null;
    setIsPaused(false);
    resumeProgress();
  };

  // =====================================================
  // EFFECTS
  // =====================================================

  // Start progress on story change
  useEffect(() => {
    if (currentStory && !isPaused) {
      startProgress();
    }
    return () => pauseProgress();
  }, [currentStory?.id, isPaused]);

  // Record view
  useEffect(() => {
    if (currentStory && !viewedStories.has(currentStory.id)) {
      setViewedStories((prev) => new Set([...prev, currentStory.id]));

      // Update view count
      const supabaseAny = supabase as any;
      supabaseAny
        .from("stories")
        .update({ views_count: (currentStory.views_count || 0) + 1 })
        .eq("id", currentStory.id)
        .then(() => {
          console.log("📊 View recorded for story:", currentStory.id);
        });
    }
  }, [currentStory?.id]);

  // Load reactions for own story
  useEffect(() => {
    if (isOwnStory && currentStory) {
      loadReactions();
    }
  }, [currentStory?.id, isOwnStory]);

  // Video handling
  useEffect(() => {
    if (currentStory?.media_type === "video" && videoRef.current) {
      if (isPaused) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  }, [isPaused, currentStory?.media_type]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowLeft":
          goToPrevStory();
          break;
        case "ArrowRight":
          goToNextStory();
          break;
        case "ArrowUp":
          goToAuthor("prev");
          break;
        case "ArrowDown":
          goToAuthor("next");
          break;
        case "Escape":
          onClose();
          break;
        case " ":
          e.preventDefault();
          setIsPaused((prev) => !prev);
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goToPrevStory, goToNextStory, goToAuthor, onClose]);

  // =====================================================
  // REACTIONS
  // =====================================================

  const loadReactions = async () => {
    if (!currentStory) return;

    const supabaseAny = supabase as any;
    const { data, error } = await supabaseAny
      .from("story_reactions")
      .select("*, profiles:profile_id(id, full_name, avatar_url, role)")
      .eq("story_id", currentStory.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      console.log("📊 Loaded reactions:", data);
      setReactions(data);
    }
  };

  const handleReaction = async (reactionType: string) => {
    console.log("🎯 handleReaction called:", {
      user: user?.id,
      currentStory: currentStory?.id,
      reactionType,
    });

    if (!user) {
      toast.error("Musisz być zalogowany aby reagować!");
      return;
    }

    if (!currentStory) {
      toast.error("Nie można załadować story");
      return;
    }

    try {
      const supabaseAny = supabase as any;

      // Check if already reacted - use maybeSingle to avoid 406 error
      const { data: existing, error: checkError } = await supabaseAny
        .from("story_reactions")
        .select("id")
        .eq("story_id", currentStory.id)
        .eq("profile_id", user.id)
        .maybeSingle();

      console.log("🔍 Check existing reaction:", { existing, checkError });

      if (existing) {
        toast.info("Już zareagowałeś na tę relację!");
        return;
      }

      // Create new reaction - NO worker_id needed anymore!
      const { error, data: newReaction } = await supabaseAny
        .from("story_reactions")
        .insert({
          story_id: currentStory.id,
          profile_id: user.id,
          reaction_type: reactionType,
        })
        .select()
        .single();

      console.log("📝 Insert reaction result:", { error, newReaction });

      if (error) {
        console.error("❌ Reaction error:", error);
        if (error.code === "23505") {
          toast.info("Już zareagowałeś na tę relację!");
        } else {
          toast.error("Nie udało się wysłać reakcji: " + error.message);
        }
        return;
      }

      // Create notification for story author
      const { data: senderProfile } = await supabaseAny
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", user.id)
        .single();

      await supabaseAny.from("notifications").insert({
        user_id: currentStory.author_id,
        type: "story_reaction",
        title: "👀 Ktoś zareagował na Twoją relację!",
        message: `${
          senderProfile?.full_name || "Użytkownik"
        } zainteresował się Twoją relacją`,
        data: {
          story_id: currentStory.id,
          reactor_id: user.id,
          reactor_name: senderProfile?.full_name,
          reactor_avatar: senderProfile?.avatar_url,
        },
        is_read: false,
      });

      toast.success("👀 Reakcja wysłana! Autor zostanie powiadomiony.");
    } catch (err) {
      console.error("❌ Reaction exception:", err);
      toast.error("Błąd podczas wysyłania reakcji");
    }
  };

  const handleDeleteStory = async () => {
    if (!currentStory || !isOwnStory) return;

    const supabaseAny = supabase as any;
    const { error } = await supabaseAny
      .from("stories")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", currentStory.id);

    if (error) {
      toast.error("Nie udało się usunąć");
      return;
    }

    toast.success("Story usunięte");
    goToNextStory();
  };

  const handleSendReply = async () => {
    console.log("💬 handleSendReply called:", {
      replyText,
      user: user?.id,
      currentStory: currentStory?.id,
    });

    if (!user) {
      toast.error("Musisz być zalogowany aby wysłać wiadomość!");
      return;
    }

    if (!replyText.trim()) {
      toast.error("Wpisz treść wiadomości");
      return;
    }

    if (!currentStory) {
      toast.error("Nie można załadować story");
      return;
    }

    try {
      const supabaseAny = supabase as any;

      // Get sender's profile info
      const { data: senderProfile } = await supabaseAny
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", user.id)
        .single();

      // 1. Create REAL message in messages table (so it appears in Messages section)
      const { error: msgError } = await supabaseAny.from("messages").insert({
        sender_id: user.id,
        recipient_id: currentStory.author_id,
        content: replyText.trim(),
        subject: `💬 Odpowiedź na Twoją relację`,
        message_type: "story_reply",
        is_read: false,
      });

      if (msgError) {
        console.error("❌ Message insert error:", msgError);
      } else {
        console.log("✅ Message created in messages table");
      }

      // 2. Also create notification for quick alert
      const { error: notifError } = await supabaseAny
        .from("notifications")
        .insert({
          user_id: currentStory.author_id,
          type: "story_reply",
          title: "💬 Nowa wiadomość do Twojej relacji",
          message: replyText.trim(),
          data: {
            story_id: currentStory.id,
            sender_id: user.id,
            sender_name: senderProfile?.full_name || user.email || "Użytkownik",
            sender_avatar: senderProfile?.avatar_url,
          },
          is_read: false,
        });

      if (notifError) {
        console.error("❌ Notification error:", notifError);
      }

      toast.success("💬 Wiadomość wysłana do autora!");
      setReplyText("");
      setShowReplyInput(false);
      setIsPaused(false);
      resumeProgress();
    } catch (err) {
      console.error("❌ Reply exception:", err);
      toast.error("Błąd podczas wysyłania wiadomości");
    }
  };

  // =====================================================
  // RENDER HELPERS
  // =====================================================

  if (!currentStory || !currentAuthor) {
    return null;
  }

  const formatTimeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return "teraz";
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
  };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div
      className="fixed inset-0 z-50 bg-black flex items-center justify-center"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Previous author indicator */}
      {currentAuthorIndex > 0 && (
        <button
          onClick={() => goToAuthor("prev")}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white/20 backdrop-blur rounded-full items-center justify-center hover:bg-white/30 transition-colors hidden md:flex"
        >
          <ChevronLeft className="w-6 h-6 text-white" />
        </button>
      )}

      {/* Story Container */}
      <div
        ref={containerRef}
        className="relative w-full max-w-[420px] h-full max-h-[95vh] bg-black rounded-none md:rounded-2xl overflow-hidden"
        onMouseDown={handleTouchStart}
        onMouseUp={handleTouchEnd}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Progress Bars */}
        <div className="absolute top-0 left-0 right-0 z-30 px-2 pt-2 flex gap-1">
          {currentAuthor.stories.map((story, index) => (
            <div
              key={story.id}
              className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden"
            >
              <div
                className="h-full bg-white rounded-full transition-all duration-50"
                style={{
                  width:
                    index < currentStoryIndex
                      ? "100%"
                      : index === currentStoryIndex
                      ? `${progress}%`
                      : "0%",
                }}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute top-4 left-0 right-0 z-30 px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 p-[2px]">
              <img
                src={currentAuthor.authorAvatar || "/default-avatar.png"}
                alt={currentAuthor.authorName}
                className="w-full h-full rounded-full object-cover border-2 border-black"
              />
            </div>
            <div>
              <p className="text-white font-semibold text-sm">
                {currentAuthor.authorName}
              </p>
              <p className="text-white/60 text-xs">
                {formatTimeAgo(currentStory.created_at)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsPaused((prev) => !prev);
              }}
              className="p-2 text-white hover:bg-white/20 rounded-full"
            >
              {isPaused ? (
                <PlayIcon className="w-5 h-5" />
              ) : (
                <PauseIcon className="w-5 h-5" />
              )}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu((prev) => !prev);
              }}
              className="p-2 text-white hover:bg-white/20 rounded-full"
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="p-2 text-white hover:bg-white/20 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Menu Dropdown */}
        {showMenu && (
          <div
            className="absolute top-16 right-4 z-40 bg-gray-900 rounded-xl shadow-xl overflow-hidden min-w-[180px]"
            onClick={(e) => e.stopPropagation()}
          >
            {isOwnStory ? (
              <>
                <button
                  onClick={handleDeleteStory}
                  className="w-full px-4 py-3 flex items-center gap-3 text-red-400 hover:bg-gray-800"
                >
                  <Trash2 className="w-5 h-5" />
                  <span>Usuń story</span>
                </button>
                <button
                  onClick={() => setShowReactions(true)}
                  className="w-full px-4 py-3 flex items-center gap-3 text-white hover:bg-gray-800"
                >
                  <Eye className="w-5 h-5" />
                  <span>Zobacz reakcje ({reactions.length})</span>
                </button>
              </>
            ) : (
              <>
                <button className="w-full px-4 py-3 flex items-center gap-3 text-white hover:bg-gray-800">
                  <Bookmark className="w-5 h-5" />
                  <span>Zapisz</span>
                </button>
                <button className="w-full px-4 py-3 flex items-center gap-3 text-white hover:bg-gray-800">
                  <Share2 className="w-5 h-5" />
                  <span>Udostępnij</span>
                </button>
                <button className="w-full px-4 py-3 flex items-center gap-3 text-red-400 hover:bg-gray-800">
                  <FlagIcon className="w-5 h-5" />
                  <span>Zgłoś</span>
                </button>
              </>
            )}
          </div>
        )}

        {/* Media Content */}
        <div className="absolute inset-0">
          {currentStory.media_type === "video" ? (
            <video
              ref={videoRef}
              src={currentStory.media_url}
              className="w-full h-full object-cover"
              autoPlay
              loop
              muted
              playsInline
            />
          ) : (
            <img
              src={currentStory.media_url}
              alt=""
              className="w-full h-full object-cover"
            />
          )}

          {/* Gradient Overlays */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60" />
        </div>

        {/* Caption & Job Info */}
        <div className="absolute bottom-20 left-0 right-0 z-20 px-4">
          {currentStory.is_job_posting && (
            <div className="bg-black/60 backdrop-blur-sm rounded-xl p-4 mb-4">
              <div className="flex items-center gap-2 text-orange-400 font-bold mb-2">
                <Briefcase className="w-5 h-5" />
                <span>{currentStory.job_title || "Zlecenie"}</span>
              </div>

              {currentStory.job_category && (
                <p className="text-white/80 text-sm mb-1">
                  📁 {currentStory.job_category}
                </p>
              )}

              {currentStory.job_location && (
                <p className="text-white/80 text-sm mb-1 flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {currentStory.job_location}
                </p>
              )}

              {(currentStory.job_budget_min || currentStory.job_budget_max) && (
                <p className="text-green-400 text-sm mb-1 flex items-center gap-1">
                  <DollarSign className="w-4 h-4" />
                  {currentStory.job_budget_min &&
                    `€${currentStory.job_budget_min}`}
                  {currentStory.job_budget_min &&
                    currentStory.job_budget_max &&
                    " - "}
                  {currentStory.job_budget_max &&
                    `€${currentStory.job_budget_max}`}
                </p>
              )}

              {currentStory.job_urgency && (
                <p
                  className={`text-sm ${
                    currentStory.job_urgency === "urgent"
                      ? "text-red-400"
                      : "text-white/80"
                  }`}
                >
                  ⏰{" "}
                  {currentStory.job_urgency === "urgent"
                    ? "🔥 PILNE"
                    : currentStory.job_urgency === "high"
                    ? "Wysoki priorytet"
                    : currentStory.job_urgency === "normal"
                    ? "Normalny"
                    : "Niski priorytet"}
                </p>
              )}
            </div>
          )}

          {currentStory.caption && (
            <p className="text-white text-sm leading-relaxed drop-shadow-lg">
              {currentStory.caption}
            </p>
          )}
        </div>

        {/* Bottom Actions - MUST BE ABOVE TOUCH HANDLERS */}
        <div
          className="absolute bottom-0 left-0 right-0 z-40 px-4 py-4 bg-gradient-to-t from-black/80 to-transparent"
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onMouseUp={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          onTouchEnd={(e) => e.stopPropagation()}
        >
          {!isOwnStory ? (
            showReplyInput ? (
              // Reply input mode
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => e.stopPropagation()}
                  onKeyUp={(e) => e.stopPropagation()}
                  onKeyPress={(e) => e.stopPropagation()}
                  placeholder="Napisz wiadomość..."
                  className="flex-1 px-4 py-3 bg-white/20 backdrop-blur text-white rounded-full placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                  autoFocus
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSendReply();
                  }}
                  className="p-3 bg-purple-500 rounded-full text-white hover:bg-purple-600"
                >
                  <Send className="w-5 h-5" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowReplyInput(false);
                    setIsPaused(false);
                    resumeProgress();
                  }}
                  className="p-3 text-white/60 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ) : (
              // Normal mode - REAGUJ button + message input
              <div className="flex items-center gap-3 relative z-50">
                {/* Jeden przycisk REAGUJ */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    console.log("🔥 REAGUJ CLICKED!");
                    handleReaction("interested");
                  }}
                  className="relative z-50 flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-full hover:scale-105 active:scale-95 transition-all shadow-lg cursor-pointer"
                >
                  <Eye className="w-5 h-5" />
                  <span>REAGUJ</span>
                </button>

                {/* Optional: Reply button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    console.log("💬 NAPISZ CLICKED!");
                    setShowReplyInput(true);
                    pauseProgress();
                    setIsPaused(true);
                  }}
                  className="relative z-50 flex-1 px-4 py-3 bg-white/20 backdrop-blur text-white/80 rounded-full text-left hover:bg-white/30 transition-colors cursor-pointer"
                >
                  Wyślij wiadomość...
                </button>
              </div>
            )
          ) : (
            <div className="flex items-center justify-between text-white/60">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                <span>{currentStory.views_count || 0} wyświetleń</span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowReactions(true);
                }}
                className="flex items-center gap-2 hover:text-white"
              >
                <Heart className="w-5 h-5" />
                <span>{reactions.length} reakcji</span>
              </button>
            </div>
          )}
        </div>

        {/* Reactions Modal (for story owner) */}
        {showReactions && isOwnStory && (
          <div
            className="absolute inset-0 z-50 bg-black/90 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-800">
              <h3 className="text-white font-bold text-lg">
                👀 Kto zareagował ({reactions.length})
              </h3>
              <button
                onClick={() => setShowReactions(false)}
                className="p-2 text-white hover:bg-gray-800 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="px-4 py-2 text-gray-400 text-sm">
              Kliknij w profil aby skontaktować się z osobą
            </p>

            <div className="flex-1 overflow-y-auto p-4">
              {reactions.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <Eye className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Nikt jeszcze nie zareagował na tę relację</p>
                  <p className="text-sm mt-2">
                    Gdy ktoś kliknie "Reaguj", pojawi się tutaj
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {reactions.map((reaction) => {
                    // Determine profile URL based on user role
                    const profile = reaction.profiles;
                    const profileId =
                      profile?.id || reaction.profile_id || reaction.worker_id;
                    const userRole = profile?.role || "worker";

                    // Build URL to contact section of public profile
                    let profileUrl = "#";
                    if (profileId) {
                      if (userRole === "worker") {
                        profileUrl = `/worker/profile/${profileId}#contact`;
                      } else if (userRole === "employer") {
                        profileUrl = `/employer/profile/${profileId}#contact`;
                      } else {
                        profileUrl = `/worker/profile/${profileId}#contact`;
                      }
                    }

                    const userName =
                      profile?.full_name ||
                      reaction.worker?.full_name ||
                      "Nieznany użytkownik";
                    const userAvatar =
                      profile?.avatar_url ||
                      reaction.worker?.avatar_url ||
                      "/default-avatar.png";

                    return (
                      <button
                        key={reaction.id}
                        onClick={() => {
                          onClose();
                          navigate(profileUrl);
                        }}
                        className="w-full flex items-center gap-3 p-3 bg-gray-800 hover:bg-gray-700 rounded-xl transition-colors cursor-pointer group"
                      >
                        <img
                          src={userAvatar}
                          alt=""
                          className="w-12 h-12 rounded-full object-cover ring-2 ring-purple-500/50"
                        />
                        <div className="flex-1 text-left">
                          <p className="text-white font-medium group-hover:text-purple-400 transition-colors">
                            {userName}
                          </p>
                          <p className="text-gray-400 text-sm flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {userRole === "worker"
                              ? "Pracownik"
                              : userRole === "employer"
                              ? "Pracodawca"
                              : userRole === "accountant"
                              ? "Księgowy"
                              : "Użytkownik"}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-2xl">👀</span>
                          <span className="text-xs text-purple-400 font-medium group-hover:underline">
                            Zobacz profil →
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Touch Areas Overlay (visual feedback) */}
        {isPaused && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/30">
            <PauseIcon className="w-16 h-16 text-white/80" />
          </div>
        )}
      </div>

      {/* Next author indicator */}
      {currentAuthorIndex < authorGroups.length - 1 && (
        <button
          onClick={() => goToAuthor("next")}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white/20 backdrop-blur rounded-full items-center justify-center hover:bg-white/30 transition-colors hidden md:flex"
        >
          <ChevronRight className="w-6 h-6 text-white" />
        </button>
      )}

      {/* Author Previews on sides (desktop) */}
      <div className="hidden lg:flex absolute left-20 top-1/2 -translate-y-1/2 z-10">
        {currentAuthorIndex > 0 && (
          <div className="w-24 h-40 rounded-xl overflow-hidden opacity-30 hover:opacity-50 cursor-pointer transition-opacity">
            <img
              src={
                authorGroups[currentAuthorIndex - 1].stories[0]?.media_url ||
                "/placeholder.png"
              }
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
        )}
      </div>

      <div className="hidden lg:flex absolute right-20 top-1/2 -translate-y-1/2 z-10">
        {currentAuthorIndex < authorGroups.length - 1 && (
          <div className="w-24 h-40 rounded-xl overflow-hidden opacity-30 hover:opacity-50 cursor-pointer transition-opacity">
            <img
              src={
                authorGroups[currentAuthorIndex + 1].stories[0]?.media_url ||
                "/placeholder.png"
              }
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
        )}
      </div>
    </div>
  );
};
