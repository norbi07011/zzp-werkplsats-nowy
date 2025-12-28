/**
 * StoriesBarPro - Professional Stories Bar Component
 *
 * Features:
 * - Shows all stories grouped by author
 * - Multiple stories indicator (stacked rings)
 * - "Your Story" creation button
 * - Horizontal scrolling with fade edges
 * - Real-time updates via Supabase
 * - Unseen/seen state tracking
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { Plus, Camera, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "../../src/lib/supabase";
import { useAuth } from "../../contexts/AuthContext";

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
  duration: number; // Story duration in seconds
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
  author_role?: string; // Added for filtering
}

export interface AuthorGroup {
  authorId: string;
  authorName: string;
  authorAvatar: string;
  authorRole: string; // Added for filtering
  stories: Story[];
  hasUnseen: boolean;
}

// Story filter types
type StoryFilter = "all" | "employer" | "regular_user" | "accountant";

const FILTER_OPTIONS: {
  value: StoryFilter;
  label: string;
  emoji: string;
  color: string;
}[] = [
  {
    value: "all",
    label: "Wszystkie",
    emoji: "🌟",
    color: "from-purple-500 to-pink-500",
  },
  {
    value: "employer",
    label: "Pracodawcy",
    emoji: "💼",
    color: "from-blue-500 to-cyan-500",
  },
  {
    value: "regular_user",
    label: "Użytkownicy",
    emoji: "👤",
    color: "from-green-500 to-emerald-500",
  },
  {
    value: "accountant",
    label: "Księgowi",
    emoji: "📊",
    color: "from-orange-500 to-amber-500",
  },
];

interface StoriesBarProProps {
  onCreateStory: () => void;
  onViewStory: (authorId: string, storyId?: string) => void;
}

// =====================================================
// MAIN COMPONENT
// =====================================================

export const StoriesBarPro = ({
  onCreateStory,
  onViewStory,
}: StoriesBarProProps) => {
  const { user } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Role-based access: only employer, regular_user, accountant can create stories
  const canCreateStory =
    user && ["employer", "regular_user", "accountant"].includes(user.role);

  // Filter state - saved to localStorage
  const [activeFilter, setActiveFilter] = useState<StoryFilter>(() => {
    try {
      const saved = localStorage.getItem("stories_filter");
      return (saved as StoryFilter) || "all";
    } catch {
      return "all";
    }
  });

  const [authorGroups, setAuthorGroups] = useState<AuthorGroup[]>([]);
  const [allAuthorGroups, setAllAuthorGroups] = useState<AuthorGroup[]>([]); // Unfiltered
  const [myStories, setMyStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [seenStories, setSeenStories] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem("seen_stories");
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });

  // Save filter preference
  const handleFilterChange = (filter: StoryFilter) => {
    setActiveFilter(filter);
    localStorage.setItem("stories_filter", filter);
    setShowFilters(false);
  };

  // Apply filter to author groups
  useEffect(() => {
    if (activeFilter === "all") {
      setAuthorGroups(allAuthorGroups);
    } else {
      const filtered = allAuthorGroups.filter(
        (group) => group.authorRole === activeFilter
      );
      setAuthorGroups(filtered);
    }
  }, [activeFilter, allAuthorGroups]);

  // =====================================================
  // DATA LOADING
  // =====================================================

  const loadStories = useCallback(async () => {
    console.log("🔄 [StoriesBarPro] Loading stories...");

    try {
      const now = new Date().toISOString();

      const supabaseAny = supabase as any;
      const { data: stories, error } = await supabaseAny
        .from("stories")
        .select(
          `
          id,
          author_id,
          author_type,
          media_url,
          media_type,
          caption,
          duration,
          is_job_posting,
          job_title,
          job_category,
          job_location,
          job_budget_min,
          job_budget_max,
          job_urgency,
          job_preferred_date,
          views_count,
          reactions_count,
          created_at,
          expires_at,
          profiles!stories_author_id_fkey (
            id,
            full_name,
            avatar_url,
            role
          )
        `
        )
        .eq("is_active", true)
        .is("deleted_at", null)
        .gt("expires_at", now)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("❌ [StoriesBarPro] Query error:", error);
        return;
      }

      console.log("📊 [StoriesBarPro] Fetched stories:", stories?.length);

      if (!stories || stories.length === 0) {
        setAuthorGroups([]);
        setMyStories([]);
        setLoading(false);
        return;
      }

      // Group stories by author
      const grouped = new Map<string, AuthorGroup>();
      const myStoriesList: Story[] = [];

      for (const story of stories) {
        const authorId = story.author_id;
        const profile = story.profiles;
        const authorRole = profile?.role || "regular_user";

        // Add role to story for reference
        story.author_role = authorRole;

        // Separate user's own stories
        if (authorId === user?.id) {
          myStoriesList.push(story);
          continue;
        }

        if (!grouped.has(authorId)) {
          grouped.set(authorId, {
            authorId,
            authorName: profile?.full_name || "Nieznany",
            authorAvatar: profile?.avatar_url || "",
            authorRole: authorRole,
            stories: [],
            hasUnseen: false,
          });
        }

        const group = grouped.get(authorId)!;
        group.stories.push(story);

        // Check if any story is unseen
        if (!seenStories.has(story.id)) {
          group.hasUnseen = true;
        }
      }

      // Sort groups: unseen first, then by most recent story
      const sortedGroups = Array.from(grouped.values()).sort((a, b) => {
        if (a.hasUnseen !== b.hasUnseen) {
          return a.hasUnseen ? -1 : 1;
        }
        const aLatest = new Date(a.stories[0]?.created_at || 0).getTime();
        const bLatest = new Date(b.stories[0]?.created_at || 0).getTime();
        return bLatest - aLatest;
      });

      console.log(
        "✅ [StoriesBarPro] Grouped:",
        sortedGroups.length,
        "authors"
      );

      setAllAuthorGroups(sortedGroups); // Store unfiltered
      setMyStories(myStoriesList);
    } catch (err) {
      console.error("❌ [StoriesBarPro] Error loading stories:", err);
    } finally {
      setLoading(false);
    }
  }, [user?.id, seenStories]);

  // =====================================================
  // EFFECTS
  // =====================================================

  useEffect(() => {
    loadStories();
  }, [loadStories]);

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel("stories-bar-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "stories" },
        () => {
          console.log("📢 [StoriesBarPro] Real-time update, reloading...");
          loadStories();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadStories]);

  // Scroll arrows visibility
  useEffect(() => {
    const scrollEl = scrollRef.current;
    if (!scrollEl) return;

    const updateArrows = () => {
      setShowLeftArrow(scrollEl.scrollLeft > 0);
      setShowRightArrow(
        scrollEl.scrollLeft < scrollEl.scrollWidth - scrollEl.clientWidth - 10
      );
    };

    updateArrows();
    scrollEl.addEventListener("scroll", updateArrows);
    window.addEventListener("resize", updateArrows);

    return () => {
      scrollEl.removeEventListener("scroll", updateArrows);
      window.removeEventListener("resize", updateArrows);
    };
  }, [authorGroups]);

  // =====================================================
  // HANDLERS
  // =====================================================

  const handleViewStory = (authorId: string, storyId?: string) => {
    console.log("👁️ [StoriesBarPro] View story:", { authorId, storyId });

    // Mark stories as seen
    const authorGroup = authorGroups.find((g) => g.authorId === authorId);
    if (authorGroup) {
      const newSeen = new Set(seenStories);
      authorGroup.stories.forEach((s) => newSeen.add(s.id));
      setSeenStories(newSeen);
      localStorage.setItem("seen_stories", JSON.stringify([...newSeen]));
    }

    onViewStory(authorId, storyId);
  };

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = 200;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  // =====================================================
  // RENDER
  // =====================================================

  if (loading) {
    return (
      <div className="w-full py-4 px-2 flex gap-4 animate-pulse">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-2">
            <div className="w-16 h-16 rounded-full bg-gray-700" />
            <div className="w-12 h-3 rounded bg-gray-700" />
          </div>
        ))}
      </div>
    );
  }

  const hasContent = myStories.length > 0 || authorGroups.length > 0;

  // Get count per filter
  const getFilterCount = (filter: StoryFilter) => {
    if (filter === "all") return allAuthorGroups.length;
    return allAuthorGroups.filter((g) => g.authorRole === filter).length;
  };

  return (
    <div className="relative w-full">
      {/* Filter Bar - Modern Tab Design - Mobile Optimized */}
      <div
        className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 border-b border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm overflow-x-auto scrollbar-hide"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {FILTER_OPTIONS.map((filter) => {
          const count = getFilterCount(filter.value);
          const isActive = activeFilter === filter.value;

          return (
            <button
              key={filter.value}
              onClick={() => handleFilterChange(filter.value)}
              className={`
                relative flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-medium flex-shrink-0
                transition-all duration-200 transform hover:scale-105
                ${
                  isActive
                    ? `bg-gradient-to-r ${filter.color} text-white shadow-lg`
                    : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                }
              `}
            >
              <span className="text-sm sm:text-base">{filter.emoji}</span>
              <span className="hidden xs:inline sm:inline">{filter.label}</span>
              {count > 0 && (
                <span
                  className={`
                  min-w-[16px] sm:min-w-[18px] h-[16px] sm:h-[18px] flex items-center justify-center rounded-full text-[9px] sm:text-[10px] font-bold
                  ${
                    isActive
                      ? "bg-white/30"
                      : "bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300"
                  }
                `}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Left Scroll Arrow - hidden on mobile */}
      {showLeftArrow && (
        <button
          onClick={() => scroll("left")}
          className="hidden sm:flex absolute left-0 top-1/2 -translate-y-1/2 z-20 w-8 h-8 bg-white dark:bg-gray-800 shadow-lg rounded-full items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          style={{ marginTop: "24px" }}
        >
          <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </button>
      )}

      {/* Stories Container - Mobile Optimized */}
      <div
        ref={scrollRef}
        className="w-full overflow-x-auto scrollbar-hide py-2 sm:py-4 px-2 sm:px-4"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        <div className="flex gap-2 sm:gap-4">
          {/* Create Story Button - only for employer, regular_user, accountant */}
          {canCreateStory && (
            <div className="flex flex-col items-center gap-1 sm:gap-2 flex-shrink-0">
              <button
                onClick={onCreateStory}
                className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 p-[2px] transition-transform hover:scale-105 active:scale-95"
              >
                <div className="w-full h-full rounded-full bg-white dark:bg-gray-900 flex items-center justify-center">
                  {myStories.length > 0 ? (
                    <>
                      <img
                        src={myStories[0]?.media_url || "/default-avatar.png"}
                        alt="Your story"
                        className="w-full h-full rounded-full object-cover"
                      />
                      <div className="absolute bottom-0 right-0 w-5 h-5 sm:w-6 sm:h-6 bg-blue-500 rounded-full border-2 border-white dark:border-gray-900 flex items-center justify-center">
                        <Plus className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
                      <Camera className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                  )}
                </div>
              </button>
              <span className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 font-medium truncate max-w-[56px] sm:max-w-[64px]">
                {myStories.length > 0 ? "Twoja Story" : "Dodaj Story"}
              </span>
            </div>
          )}

          {/* View My Stories (if exists) */}
          {myStories.length > 0 && (
            <div className="flex flex-col items-center gap-1 sm:gap-2 flex-shrink-0">
              <button
                onClick={() => handleViewStory(user!.id, myStories[0]?.id)}
                className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 p-[2px] transition-transform hover:scale-105 active:scale-95"
              >
                <img
                  src={myStories[0]?.media_url || "/default-avatar.png"}
                  alt="Your story"
                  className="w-full h-full rounded-full object-cover border-2 border-white dark:border-gray-900"
                />
                {/* Story count indicator */}
                {myStories.length > 1 && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-purple-500 rounded-full border-2 border-white dark:border-gray-900 flex items-center justify-center text-[9px] sm:text-[10px] text-white font-bold">
                    {myStories.length}
                  </div>
                )}
              </button>
              <span className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 font-medium truncate max-w-[56px] sm:max-w-[64px]">
                Twoja Story
              </span>
            </div>
          )}

          {/* Other Users' Stories */}
          {authorGroups.map((group) => {
            // Get role badge
            const getRoleBadge = (role: string) => {
              switch (role) {
                case "employer":
                  return { emoji: "💼", color: "bg-blue-500" };
                case "accountant":
                  return { emoji: "📊", color: "bg-orange-500" };
                case "regular_user":
                  return { emoji: "👤", color: "bg-green-500" };
                default:
                  return null;
              }
            };
            const roleBadge = getRoleBadge(group.authorRole);

            return (
              <div
                key={group.authorId}
                className="flex flex-col items-center gap-1 sm:gap-2 flex-shrink-0"
              >
                <button
                  onClick={() =>
                    handleViewStory(group.authorId, group.stories[0]?.id)
                  }
                  className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-full p-[2px] transition-transform hover:scale-105 active:scale-95 ${
                    group.hasUnseen
                      ? "bg-gradient-to-tr from-purple-500 via-pink-500 to-orange-400"
                      : "bg-gray-300 dark:bg-gray-600"
                  }`}
                >
                  <img
                    src={group.authorAvatar || "/default-avatar.png"}
                    alt={group.authorName}
                    className="w-full h-full rounded-full object-cover border-2 border-white dark:border-gray-900"
                  />
                  {/* Role badge */}
                  {roleBadge && (
                    <div
                      className={`absolute -bottom-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 ${roleBadge.color} rounded-full border-2 border-white dark:border-gray-900 flex items-center justify-center text-[9px] sm:text-[10px]`}
                    >
                      {roleBadge.emoji}
                    </div>
                  )}
                  {/* Multiple stories indicator */}
                  {group.stories.length > 1 && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-purple-600 rounded-full border-2 border-white dark:border-gray-900 flex items-center justify-center text-[9px] sm:text-[10px] text-white font-bold">
                      {group.stories.length}
                    </div>
                  )}
                </button>
                <span className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 font-medium truncate max-w-[56px] sm:max-w-[64px]">
                  {group.authorName.split(" ")[0]}
                </span>
              </div>
            );
          })}

          {/* Empty State */}
          {!hasContent && activeFilter === "all" && (
            <div className="flex items-center justify-center px-4 py-2 text-gray-500 dark:text-gray-400 text-xs sm:text-sm">
              Brak aktywnych stories. Bądź pierwszy!
            </div>
          )}

          {/* Empty State for Filter */}
          {authorGroups.length === 0 && activeFilter !== "all" && (
            <div className="flex items-center justify-center px-4 py-2 text-gray-500 dark:text-gray-400 text-xs sm:text-sm">
              {FILTER_OPTIONS.find((f) => f.value === activeFilter)?.emoji} Brak
              stories od{" "}
              {FILTER_OPTIONS.find(
                (f) => f.value === activeFilter
              )?.label.toLowerCase()}
            </div>
          )}
        </div>
      </div>

      {/* Right Scroll Arrow - hidden on mobile */}
      {showRightArrow && (
        <button
          onClick={() => scroll("right")}
          className="hidden sm:flex absolute right-0 top-1/2 -translate-y-1/2 z-20 w-8 h-8 bg-white dark:bg-gray-800 shadow-lg rounded-full items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </button>
      )}

      {/* Hide scrollbar CSS */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default StoriesBarPro;
