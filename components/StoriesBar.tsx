/**
 * StoriesBar - Instagram-like stories bar showing active stories
 * Displays circular avatars of users who posted stories in last 24h
 * Shows "+" button for current user to create new story
 */

import { useState, useEffect } from "react";
import { PlusCircle } from "lucide-react";
import { supabase } from "../src/lib/supabase";
import { useAuth } from "../contexts/AuthContext";

interface Story {
  id: string;
  author_id: string;
  media_url: string;
  media_type: string;
  caption: string | null;
  is_job_posting: boolean;
  views_count: number;
  reactions_count: number;
  created_at: string;
  expires_at: string;
  author: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

interface StoriesBarProps {
  onCreateStory: () => void;
  onViewStory: (storyId: string, authorId: string) => void;
}

export const StoriesBar = ({ onCreateStory, onViewStory }: StoriesBarProps) => {
  const { user } = useAuth();
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [myActiveStory, setMyActiveStory] = useState<Story | null>(null);

  useEffect(() => {
    loadStories();

    // Real-time subscription for new stories
    const channel = supabase
      .channel("stories_updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "stories",
        },
        () => {
          loadStories();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const loadStories = async () => {
    console.log("🔄 [StoriesBar] loadStories() called");
    try {
      const supabaseAny = supabase as any;

      // Get all active stories from last 24h, grouped by author
      const { data, error } = await supabaseAny
        .from("stories")
        .select(
          `
          id,
          author_id,
          media_url,
          media_type,
          caption,
          is_job_posting,
          views_count,
          reactions_count,
          created_at,
          expires_at,
          profiles:author_id (
            full_name,
            avatar_url
          )
        `
        )
        .eq("is_active", true)
        .is("deleted_at", null)
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false });

      console.log("📊 [StoriesBar] Query result:", {
        data,
        error,
        dataLength: data?.length,
      });

      if (error) throw error;

      // Transform data
      const transformedStories: Story[] = (data || []).map((s: any) => ({
        id: s.id,
        author_id: s.author_id,
        media_url: s.media_url,
        media_type: s.media_type,
        caption: s.caption,
        is_job_posting: s.is_job_posting,
        views_count: s.views_count,
        reactions_count: s.reactions_count,
        created_at: s.created_at,
        expires_at: s.expires_at,
        author: {
          full_name: s.profiles?.full_name || "Unknown User",
          avatar_url: s.profiles?.avatar_url || null,
        },
      }));

      console.log(
        "📖 [StoriesBar] Transformed:",
        transformedStories.length,
        "stories"
      );

      // Group by author (latest story per author)
      const storiesByAuthor = new Map<string, Story>();
      transformedStories.forEach((story) => {
        if (!storiesByAuthor.has(story.author_id)) {
          storiesByAuthor.set(story.author_id, story);
        }
      });

      console.log(
        "👥 [StoriesBar] Unique authors:",
        storiesByAuthor.size,
        "user?.id:",
        user?.id
      );

      // Separate my stories from others
      const myStory = user?.id
        ? Array.from(storiesByAuthor.values()).find(
            (s) => s.author_id === user.id
          )
        : null;
      const otherStories = Array.from(storiesByAuthor.values()).filter(
        (s) => s.author_id !== user?.id
      );

      console.log(
        "✅ [StoriesBar] Final: myStory:",
        !!myStory,
        "otherStories:",
        otherStories.length
      );

      setMyActiveStory(myStory || null);
      setStories(otherStories);
    } catch (error) {
      console.error("Error loading stories:", error);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffHours >= 1) return `${diffHours}h ago`;
    if (diffMinutes >= 1) return `${diffMinutes}m ago`;
    return "just now";
  };

  if (loading) {
    return (
      <div className="flex gap-4 p-4 overflow-x-auto bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="flex flex-col items-center gap-2 min-w-[80px]"
          >
            <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
            <div className="w-12 h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-4 p-4 overflow-x-auto bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      {/* Create Story Button (Your Story) */}
      <div className="flex flex-col items-center gap-2 min-w-[80px]">
        <button
          onClick={
            myActiveStory
              ? () => onViewStory(myActiveStory.id, myActiveStory.author_id)
              : onCreateStory
          }
          className={`relative w-16 h-16 rounded-full flex items-center justify-center transition-all ${
            myActiveStory
              ? "ring-4 ring-blue-500 ring-offset-2"
              : "bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 hover:from-blue-50 hover:to-blue-100 dark:hover:from-blue-900 dark:hover:to-blue-800"
          }`}
        >
          {myActiveStory ? (
            <>
              {myActiveStory.media_type === "image" ? (
                <img
                  src={myActiveStory.media_url}
                  alt="My Story"
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <div className="w-full h-full rounded-full bg-gray-900 flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-8 h-8 text-white"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 bg-green-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full border-2 border-white dark:border-gray-800">
                {myActiveStory.reactions_count}
              </div>
            </>
          ) : (
            <PlusCircle className="w-8 h-8 text-gray-600 dark:text-gray-300" />
          )}
        </button>
        <span className="text-xs font-medium text-gray-700 dark:text-gray-300 text-center truncate w-full">
          {myActiveStory ? "Twoja Story" : "Dodaj Story"}
        </span>
        {myActiveStory && (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {getTimeAgo(myActiveStory.created_at)}
          </span>
        )}
      </div>

      {/* Other Users' Stories */}
      {stories.map((story) => (
        <div
          key={story.id}
          className="flex flex-col items-center gap-2 min-w-[80px] cursor-pointer"
        >
          <div
            onClick={() => {
              console.log(
                "🎯 [StoriesBar] Story clicked:",
                story.id,
                story.author_id
              );
              onViewStory(story.id, story.author_id);
            }}
            className="relative w-16 h-16 rounded-full bg-gradient-to-tr from-purple-600 via-pink-500 to-orange-500 p-[3px] transition-transform hover:scale-110 active:scale-95"
          >
            <div className="w-full h-full rounded-full bg-white dark:bg-gray-800 p-[2px]">
              {story.author.avatar_url ? (
                <img
                  src={story.author.avatar_url}
                  alt={story.author.full_name || "User"}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                  {getInitials(story.author.full_name)}
                </div>
              )}
            </div>

            {/* Job Posting Badge */}
            {story.is_job_posting && (
              <div className="absolute -top-1 -right-1 bg-green-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full border-2 border-white dark:border-gray-800 z-10">
                💼
              </div>
            )}

            {/* Reactions Count */}
            {story.reactions_count > 0 && (
              <div className="absolute -bottom-1 -right-1 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full border-2 border-white dark:border-gray-800 z-10">
                {story.reactions_count}
              </div>
            )}
          </div>

          <span className="text-xs font-medium text-gray-700 dark:text-gray-300 text-center truncate w-full">
            {story.author.full_name?.split(" ")[0] || "User"}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {getTimeAgo(story.created_at)}
          </span>
        </div>
      ))}

      {stories.length === 0 && !myActiveStory && (
        <div className="flex items-center justify-center w-full py-8 text-gray-500 dark:text-gray-400">
          <p className="text-sm">Brak aktywnych stories. Bądź pierwszy! 🚀</p>
        </div>
      )}
    </div>
  );
};
