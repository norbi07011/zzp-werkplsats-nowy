/**
 * ╔════════════════════════════════════════════════════════════════════╗
 * ║          🚀 ULTRA-PREMIUM FEED PAGE - 2025 EDITION 🚀             ║
 * ║                                                                    ║
 * ║  Design inspiracje: Instagram + LinkedIn + Twitter X              ║
 * ║  Features:                                                         ║
 * ║  ✅ Glassmorphism + 3D effects                                    ║
 * ║  ✅ Masonry layout responsive                                     ║
 * ║  ✅ Stories/Highlights                                            ║
 * ║  ✅ Trending posts                                                ║
 * ║  ✅ Advanced filters                                              ║
 * ║  ✅ Skeleton loaders                                              ║
 * ║  ✅ Micro-animations                                              ║
 * ║  ✅ Real-time updates                                             ║
 * ║  ✅ Infinite scroll                                               ║
 * ╚════════════════════════════════════════════════════════════════════╝
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../src/lib/supabase";
// @ts-ignore
const supabaseAny = supabase as any;
import {
  getPosts,
  createPost,
  likePost,
  unlikePost,
  createComment,
  getPostComments,
  sharePost,
  reactToPost,
  unreactToPost,
  type Post,
  type PostComment,
  type PostType,
  type CreatePostData,
  type ReactionType,
} from "../src/services/feedService";
import { searchUsers, type SearchResult } from "../src/services/searchService";
import {
  uploadMultipleFeedMedia,
  type MediaUploadResult,
} from "../src/services/storage";
import { AdForm } from "../components/CreatePost/AdForm";
import { AnnouncementForm } from "../components/CreatePost/AnnouncementForm";
import { JobOfferForm } from "../components/CreatePost/JobOfferForm";
import SaveButton, { type SaveFolder } from "../components/SaveButton";
import {
  Star,
  MessageSquare,
  User,
  Briefcase,
  MapPin,
  Calendar,
  Upload,
  X,
  Image as ImageIcon,
  Video,
  Heart,
  Share2,
  Bookmark,
  TrendingUp,
  Filter,
  Search,
  Plus,
  Send,
  Eye,
  MoreHorizontal,
  ChevronRight,
  Sparkles,
  Fire,
  Award,
  Users,
  Mail,
  Phone,
} from "../components/icons";
import { LayoutGrid, Info, Megaphone } from "../components/icons-additions";
import { LoadingOverlay } from "../components/Loading";
import { ShareModal } from "../components/ShareModal";
import {
  ReactionButton,
  ReactionCountsDisplay,
} from "../src/components/ReactionPicker";
import React from "react";

// =====================================================
// 3D BACKGROUND COMPONENTS (From Project 4)
// =====================================================

// 1. The Nebula Core (Announcements/Ogłoszenia)
const NebulaCore = React.memo(({ style }: { style: React.CSSProperties }) => (
  <div className="nebula-container" style={style}>
    <div className="nebula-core"></div>
    <div className="nebula-ring nr-1"></div>
    <div className="nebula-ring nr-2"></div>
    <div className="nebula-ring nr-3"></div>
    <div className="absolute top-0 left-20 w-2 h-2 bg-white rounded-full blur-[1px] animate-pulse"></div>
    <div className="absolute bottom-10 right-10 w-3 h-3 bg-orange-500 rounded-full blur-[2px] animate-bounce"></div>
  </div>
));

// 2. The Cyber Tesseract (Jobs/Oferty pracy) - używane tylko na "Alles"
const CyberTesseract = React.memo(
  ({ style }: { style: React.CSSProperties }) => (
    <div className="tesseract-container" style={style}>
      <div className="tesseract-cube">
        <div className="t-face f1"></div>
        <div className="t-face f2"></div>
        <div className="t-face f3"></div>
        <div className="t-face f4"></div>
        <div className="t-face f5"></div>
        <div className="t-face f6"></div>
        <div className="t-inner"></div>
      </div>
    </div>
  )
);

// 2b. Paint Roller (Jobs/Oferty pracy - Vacatures)
const PaintRoller = React.memo(({ style }: { style: React.CSSProperties }) => (
  <div className="paint-roller-wrapper" style={style}>
    <div className="paint-roller-container">
      <div className="paint-roller-roller">
        <div className="paint-roller-handle" />
      </div>
      <div className="paint-roller-paint" />
    </div>
  </div>
));

// 3. The Prismatic Obelisk (Ads/Reklamy)
const PrismaticObelisk = React.memo(
  ({ style }: { style: React.CSSProperties }) => (
    <div className="prism-container" style={style}>
      <div className="prism-shape">
        <div className="prism-core"></div>
        <div className="p-face pf-1"></div>
        <div className="p-face pf-2"></div>
        <div className="p-face pf-3"></div>
        <div className="p-face pf-4"></div>
        <div className="prism-ring pr-1"></div>
        <div className="prism-ring pr-2"></div>
        <div className="prism-glow"></div>
        <div className="prism-sparkle ps-1"></div>
        <div className="prism-sparkle ps-2"></div>
      </div>
    </div>
  )
);

// =====================================================
// TYPES
// =====================================================

interface Story {
  id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  media_url: string;
  created_at: string;
  is_seen: boolean;
}

interface TrendingPost extends Post {
  trending_score: number;
}

// =====================================================
// MAIN COMPONENT
// =====================================================

export default function FeedPagePremium() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Category filter (NEW)
  const [activeCategory, setActiveCategory] = useState<PostType | "all">("all");

  // User search
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [selectedUser, setSelectedUser] = useState<SearchResult | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Infinite scroll
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const observerTarget = useRef<HTMLDivElement>(null);

  // Stories
  const [stories, setStories] = useState<Story[]>([]);
  const [showStories, setShowStories] = useState(false);

  // Image Lightbox
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // Trending
  const [trending, setTrending] = useState<TrendingPost[]>([]);

  const canCreatePost =
    user?.role === "employer" ||
    user?.role === "accountant" ||
    user?.role === "admin";

  // Filter posts by category and selected user
  const filteredPosts = posts.filter((post) => {
    // Filter by category
    if (activeCategory !== "all" && post.type !== activeCategory) {
      return false;
    }

    // Filter by selected user
    if (selectedUser && post.author_id !== selectedUser.id) {
      return false;
    }

    return true;
  });

  // Background style based on category
  const getBackgroundStyle = () => {
    switch (activeCategory) {
      case "announcement":
        return "bg-[#fff7ed] bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-orange-200/40 via-transparent to-transparent";
      case "job_offer":
        return "bg-[#fff4e6] bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-orange-300/40 via-transparent to-transparent";
      case "ad":
        return "bg-[#faf5ff] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-fuchsia-200/40 via-transparent to-transparent";
      default:
        return "bg-slate-50 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-200/30 via-slate-50 to-slate-50";
    }
  };

  // Render 3D background based on category
  const render3DBackground = () => {
    switch (activeCategory) {
      case "announcement":
        return (
          <>
            <div className="absolute top-[15%] left-[10%] opacity-90 scale-90 md:scale-110">
              <NebulaCore style={{ animationDuration: "8s" }} />
            </div>
            <div className="absolute bottom-[20%] right-[10%] opacity-60 scale-60 rotate-12">
              <NebulaCore
                style={{ animationDelay: "-4s", animationDuration: "12s" }}
              />
            </div>
            <div className="absolute top-[25%] right-[30%] opacity-30 scale-40 -rotate-12">
              <NebulaCore
                style={{ animationDelay: "-1s", animationDuration: "15s" }}
              />
            </div>
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-orange-500/5 rounded-full blur-[100px] -z-10 pointer-events-none"></div>
          </>
        );
      case "job_offer":
        return (
          <>
            <div className="absolute top-[20%] right-[15%] opacity-70">
              <PaintRoller style={{ animationDelay: "0s" }} />
            </div>
            <div className="absolute bottom-[25%] left-[10%] opacity-60">
              <PaintRoller style={{ animationDelay: "-1s" }} />
            </div>
            <div className="absolute top-[50%] right-[30%] opacity-40">
              <PaintRoller style={{ animationDelay: "-1.5s" }} />
            </div>
            <div className="fixed top-1/3 right-1/3 w-[600px] h-[600px] bg-orange-500/5 rounded-full blur-[100px] -z-10 pointer-events-none"></div>
          </>
        );
      case "ad":
        return (
          <>
            <div className="absolute top-[18%] left-[18%] opacity-80 scale-90 md:scale-110">
              <PrismaticObelisk style={{ animationDuration: "9s" }} />
            </div>
            <div className="absolute bottom-[25%] right-[15%] opacity-60 scale-60 rotate-6">
              <PrismaticObelisk
                style={{ animationDelay: "-3s", animationDuration: "14s" }}
              />
            </div>
            <div className="absolute top-[12%] right-[25%] opacity-30 scale-[0.35] -rotate-12 blur-[0.5px]">
              <PrismaticObelisk
                style={{ animationDelay: "-6s", animationDuration: "18s" }}
              />
            </div>
            <div className="fixed bottom-0 left-0 w-full h-[500px] bg-gradient-to-t from-purple-500/10 to-transparent -z-10 pointer-events-none"></div>
          </>
        );
      default:
        return (
          <>
            <div className="absolute top-[15%] right-[15%] opacity-80 scale-90 md:scale-110">
              <CyberTesseract style={{ animationDuration: "10s" }} />
            </div>
            <div className="absolute bottom-[25%] left-[12%] opacity-50 scale-75 rotate-[15deg]">
              <CyberTesseract
                style={{ animationDuration: "16s", animationDelay: "-5s" }}
              />
            </div>
            <div className="absolute top-[40%] left-[8%] opacity-25 scale-40 -rotate-[25deg]">
              <CyberTesseract
                style={{ animationDuration: "12s", animationDelay: "-2s" }}
              />
            </div>
            <div className="fixed top-1/3 right-1/3 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[100px] -z-10 pointer-events-none"></div>
          </>
        );
    }
  };

  // =====================================================
  // LOAD FEED WITH INFINITE SCROLL
  // =====================================================

  useEffect(() => {
    if (user?.id) {
      loadFeed();
      loadStories();
      loadTrending();
    }
  }, [user?.id]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadMorePosts();
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loading]);

  const loadFeed = async () => {
    try {
      setLoading(true);

      let currentUserId: string | undefined;
      if (user?.id && user?.role) {
        if (user.role === "worker") {
          const { data } = await supabase
            .from("workers")
            .select("id")
            .eq("profile_id", user.id)
            .single();
          currentUserId = data?.id;
        } else if (user.role === "employer") {
          const { data } = await supabase
            .from("employers")
            .select("id")
            .eq("profile_id", user.id)
            .single();
          currentUserId = data?.id;
        } else if (user.role === "accountant") {
          const { data } = await supabase
            .from("accountants")
            .select("id")
            .eq("profile_id", user.id)
            .single();
          currentUserId = data?.id;
        }
      }

      const data = await getPosts({ limit: 20, currentUserId });
      setPosts(data);
    } catch (error) {
      console.error("[FEED] Error loading feed:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadMorePosts = async () => {
    // Infinite scroll logic
    setPage((prev) => prev + 1);
  };

  // Handle user search with debounce
  const handleSearchInput = (value: string) => {
    setSearchQuery(value);

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // If empty, clear results
    if (!value.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      setSelectedUser(null);
      return;
    }

    // Debounce search (500ms)
    searchTimeoutRef.current = setTimeout(async () => {
      const results = await searchUsers(value);
      setSearchResults(results);
      setShowSearchResults(results.length > 0);
    }, 500);
  };

  const handleSelectUser = (user: SearchResult) => {
    setSelectedUser(user);
    setSearchQuery(user.company_name || user.name);
    setShowSearchResults(false);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setShowSearchResults(false);
    setSelectedUser(null);
  };

  const loadStories = async () => {
    // Mock stories - integrate with real API
    setStories([
      {
        id: "1",
        user_id: "1",
        user_name: "Anna Kowalska",
        user_avatar: undefined,
        media_url: "",
        created_at: new Date().toISOString(),
        is_seen: false,
      },
    ]);
  };

  const loadTrending = async () => {
    // Mock trending - integrate with real API
    const trendingData = posts.slice(0, 3).map((p) => ({
      ...p,
      trending_score: Math.random() * 100,
    }));
    setTrending(trendingData as TrendingPost[]);
  };

  const handleLike = async (postId: string, currentlyLiked: boolean) => {
    if (!user?.id || !user?.role) return;

    try {
      let actualUserId: string | null = null;

      if (user.role === "worker") {
        const { data } = await supabase
          .from("workers")
          .select("id")
          .eq("profile_id", user.id)
          .single();
        actualUserId = data?.id || null;
      } else if (user.role === "employer") {
        const { data } = await supabase
          .from("employers")
          .select("id")
          .eq("profile_id", user.id)
          .single();
        actualUserId = data?.id || null;
      } else if (user.role === "accountant") {
        const { data } = await supabase
          .from("accountants")
          .select("id")
          .eq("profile_id", user.id)
          .single();
        actualUserId = data?.id || null;
      } else if (user.role === "admin") {
        // Admin uses profile_id directly
        actualUserId = user.id;
      }

      if (!actualUserId) return;

      if (currentlyLiked) {
        await unlikePost(postId, actualUserId);
      } else {
        await likePost(postId, actualUserId, user.role as any);
      }
      await loadFeed();
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  // NEW: Handle emoji reaction change
  const handleReactionChange = async (
    postId: string,
    reactionType: ReactionType | null
  ) => {
    if (!user?.id) return;

    try {
      // Get user role-specific ID
      const currentUserRole = user.role;

      let actualUserId = user.id;
      if (currentUserRole === "worker") {
        const { data: workerData } = await supabase
          .from("workers")
          .select("id")
          .eq("profile_id", user.id)
          .single();
        if (workerData) actualUserId = workerData.id;
      } else if (currentUserRole === "employer") {
        const { data: employerData } = await supabase
          .from("employers")
          .select("id")
          .eq("profile_id", user.id)
          .single();
        if (employerData) actualUserId = employerData.id;
      } else if (currentUserRole === "accountant") {
        const { data: accountantData } = await supabase
          .from("accountants")
          .select("id")
          .eq("profile_id", user.id)
          .single();
        if (accountantData) actualUserId = accountantData.id;
      } else if (currentUserRole === "admin") {
        // Admin uses profile_id directly
        actualUserId = user.id;
      }

      if (reactionType === null) {
        // Remove reaction
        await unreactToPost(postId, user.id);
      } else {
        // Add or change reaction
        await reactToPost(
          postId,
          actualUserId,
          currentUserRole as any,
          user.id,
          reactionType
        );
      }
      // Reload feed to show updated counts
      await loadFeed();
    } catch (error) {
      console.error("Error changing reaction:", error);
    }
  };

  if (loading && page === 1) {
    return <FeedSkeleton />;
  }

  return (
    <div
      className={`min-h-screen relative overflow-hidden transition-colors duration-1000 ${getBackgroundStyle()}`}
    >
      {/* 3D Background Layer */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden perspective-container">
        {render3DBackground()}
      </div>

      <div className="relative z-10">
        {/* ===== PREMIUM HEADER ===== */}
        <div className="sticky top-0 z-50 backdrop-blur-xl bg-white/90 border-b border-white/40 shadow-2xl">
          <div className="container mx-auto px-6 py-5">
            <div className="flex items-center justify-center gap-6 max-w-7xl mx-auto">
              {/* Premium Search Bar with Animated Gradient Border */}
              <div className="relative flex-1 max-w-2xl">
                {/* Animated gradient border */}
                <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 rounded-full opacity-75 blur-sm animate-pulse"></div>
                <div
                  className="absolute -inset-0.5 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 rounded-full opacity-50"
                  style={{
                    backgroundSize: "200% 200%",
                    animation: "gradient 3s ease infinite",
                  }}
                ></div>

                {/* Search input */}
                <div className="relative flex items-center bg-white rounded-full shadow-xl">
                  <Search className="absolute left-6 w-6 h-6 text-amber-500" />
                  <input
                    type="text"
                    placeholder="Szukaj firmy po nazwie lub KVK..."
                    value={searchQuery}
                    onChange={(e) => handleSearchInput(e.target.value)}
                    className="w-full pl-16 pr-14 py-4 bg-transparent border-none rounded-full text-lg font-medium text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-0"
                  />
                  {searchQuery && (
                    <button
                      onClick={handleClearSearch}
                      className="absolute right-6 w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <X className="w-5 h-5 text-gray-400" />
                    </button>
                  )}
                </div>

                {/* Search Results Dropdown */}
                {showSearchResults && searchResults.length > 0 && (
                  <div className="absolute top-full mt-3 left-0 right-0 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden z-50 max-h-[500px] overflow-y-auto">
                    <div className="p-2">
                      <div className="text-xs font-bold text-gray-400 uppercase tracking-wider px-4 py-2">
                        Znalezione firmy ({searchResults.length})
                      </div>
                      {searchResults.map((result) => (
                        <button
                          key={result.id}
                          onClick={() => handleSelectUser(result)}
                          className="w-full flex items-center gap-4 p-4 hover:bg-gradient-to-r hover:from-amber-50 hover:to-orange-50 rounded-xl transition-all group"
                        >
                          {/* Avatar */}
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                            {result.name.charAt(0).toUpperCase()}
                          </div>

                          {/* User Info */}
                          <div className="flex-1 text-left">
                            <div className="font-bold text-gray-900 group-hover:text-orange-600 transition-colors">
                              {result.company_name || result.name}
                            </div>
                            <div className="text-sm text-gray-500 flex items-center gap-3">
                              {result.kvk_number && (
                                <span className="flex items-center gap-1">
                                  <Briefcase className="w-3.5 h-3.5" />
                                  KVK: {result.kvk_number}
                                </span>
                              )}
                              {result.post_count > 0 && (
                                <span className="flex items-center gap-1 text-amber-600 font-medium">
                                  <MessageSquare className="w-3.5 h-3.5" />
                                  {result.post_count}{" "}
                                  {result.post_count === 1 ? "post" : "posts"}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Badge */}
                          <div className="text-xs font-bold px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-100 to-orange-100 text-orange-700">
                            {result.type === "employer"
                              ? "👔 Werkgever"
                              : "📊 Accountant"}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Premium Create Post Button */}
              {canCreatePost && (
                <button
                  onClick={() => setShowCreatePost(true)}
                  className="relative group"
                >
                  {/* Glow effect */}
                  <div className="absolute -inset-1 bg-gradient-to-r from-amber-600 to-orange-600 rounded-full opacity-70 blur group-hover:opacity-100 transition duration-500"></div>

                  {/* Button */}
                  <div className="relative flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-amber-600 via-orange-500 to-red-500 text-white rounded-full font-bold text-lg shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300">
                    <Plus className="w-6 h-6" />
                    <span>Nowy Post</span>
                  </div>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* CSS Animation for gradient */}
        <style>{`
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        /* Paint Roller Animation */
        .paint-roller-wrapper {
          height: 350px;
          width: 350px;
          transform: rotate(-45deg);
          position: relative;
        }

        .paint-roller-container {
          position: relative;
          width: 100%;
          height: 100%;
        }

        /* Wałek - porusza się w dół */
        .paint-roller-roller {
          height: 45px;
          width: 150px;
          border: 5px solid #040e15;
          border-radius: 7px;
          background: linear-gradient(to bottom, #fc8f2e 0%, #fc8f2e 80%, #e86f1a 80%);
          position: absolute;
          margin: auto;
          left: 0;
          right: 0;
          top: 0;
          animation: paint-roller-move 2s infinite;
        }

        /* Światło na wałku */
        .paint-roller-roller::before {
          position: absolute;
          content: "";
          background-color: rgba(255, 255, 255, 0.7);
          height: 7px;
          width: 75px;
          top: 8px;
          left: 8px;
          border-radius: 10px;
        }

        /* Boczny cylinder */
        .paint-roller-roller::after {
          position: absolute;
          content: "";
          height: 40px;
          width: 85px;
          border: 7px solid #040e15;
          border-left: none;
          right: -20px;
          top: 20px;
          z-index: -1;
          border-radius: 7px;
        }

        /* Uchwyt - jest WEWNĄTRZ rollera, więc porusza się razem */
        .paint-roller-handle {
          height: 30px;
          width: 7px;
          background-color: #040e15;
          position: absolute;
          top: 68px;
          right: 65px;
        }

        .paint-roller-handle::after {
          position: absolute;
          content: "";
          height: 75px;
          width: 25px;
          background-color: #040e15;
          bottom: -75px;
          right: -8px;
          border-radius: 5px;
        }

        /* Ślad farby */
        .paint-roller-paint {
          background-color: #fc8f2e;
          height: 0;
          width: 130px;
          position: absolute;
          margin: auto;
          left: 0;
          right: 0;
          top: 0;
          z-index: -1;
          animation: paint-stroke 2s infinite;
        }

        @keyframes paint-roller-move {
          0%, 100% { top: 0; }
          40% { top: 165px; }
        }

        @keyframes paint-stroke {
          0%, 100% { height: 0; }
          40% { height: 165px; }
        }
      `}</style>

        {/* ===== STORIES CAROUSEL ===== */}
        <div className="container mx-auto px-4 mt-6 max-w-7xl">
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
            {/* Add Story Button */}
            {canCreatePost && (
              <button className="flex-shrink-0 group">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 p-0.5">
                    <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                      <Plus className="w-8 h-8 text-amber-600" />
                    </div>
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-amber-600 rounded-full border-2 border-white flex items-center justify-center">
                    <Plus className="w-4 h-4 text-white" />
                  </div>
                </div>
                <p className="text-xs text-center mt-2 font-medium text-gray-700">
                  Jouw verhaal
                </p>
              </button>
            )}

            {/* Stories */}
            {stories.map((story) => (
              <button key={story.id} className="flex-shrink-0 group">
                <div
                  className={`w-20 h-20 rounded-full p-0.5 ${
                    story.is_seen
                      ? "bg-gray-300"
                      : "bg-gradient-to-br from-purple-500 via-pink-500 to-red-500"
                  }`}
                >
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center text-white font-bold text-2xl">
                    {story.user_name.charAt(0)}
                  </div>
                </div>
                <p className="text-xs text-center mt-2 font-medium text-gray-700 truncate w-20">
                  {story.user_name.split(" ")[0]}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* ===== MAIN LAYOUT WITH SIDEBAR ===== */}
        <div className="container mx-auto px-4 mt-6 max-w-7xl">
          <div className="flex gap-6">
            {/* ===== LEFT SIDEBAR - Categories ===== */}
            <aside className="hidden lg:block w-[280px] shrink-0">
              <div className="sticky top-24 space-y-6">
                <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/40">
                  <h3 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-[0.2em] mb-5 px-2">
                    CATEGORIEËN
                  </h3>
                  <div className="space-y-3">
                    <button
                      onClick={() => setActiveCategory("all")}
                      className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all duration-300 border-l-[3px] ${
                        activeCategory === "all"
                          ? "bg-gradient-to-r from-slate-800/5 to-transparent text-slate-900 border-slate-800 shadow-sm"
                          : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-white/50"
                      }`}
                    >
                      <LayoutGrid className="w-5 h-5" />
                      <span>Alles</span>
                    </button>

                    <button
                      onClick={() => setActiveCategory("announcement")}
                      className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all duration-300 border-l-[3px] ${
                        activeCategory === "announcement"
                          ? "bg-gradient-to-r from-orange-500/10 to-transparent text-orange-600 border-orange-500 shadow-sm"
                          : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-white/50"
                      }`}
                    >
                      <Info className="w-5 h-5" />
                      <span>Aankondigingen</span>
                    </button>

                    <button
                      onClick={() => setActiveCategory("job_offer")}
                      className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all duration-300 border-l-[3px] ${
                        activeCategory === "job_offer"
                          ? "bg-gradient-to-r from-blue-500/10 to-transparent text-blue-600 border-blue-500 shadow-sm"
                          : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-white/50"
                      }`}
                    >
                      <Briefcase className="w-5 h-5" />
                      <span>Vacatures</span>
                    </button>

                    <button
                      onClick={() => setActiveCategory("ad")}
                      className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all duration-300 border-l-[3px] ${
                        activeCategory === "ad"
                          ? "bg-gradient-to-r from-purple-500/10 to-transparent text-purple-600 border-purple-500 shadow-sm"
                          : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-white/50"
                      }`}
                    >
                      <Megaphone className="w-5 h-5" />
                      <span>Reclame</span>
                    </button>
                  </div>
                </div>
              </div>
            </aside>

            {/* ===== CENTER - Feed Posts ===== */}
            <main className="flex-1 min-w-0">
              {/* Selected User Filter Banner */}
              {selectedUser && (
                <div className="mb-6 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 rounded-2xl p-[2px] shadow-xl">
                  <div className="bg-white rounded-2xl p-5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                        {selectedUser.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-lg text-gray-900">
                            {selectedUser.company_name || selectedUser.name}
                          </span>
                          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-100 to-orange-100 text-orange-700">
                            {selectedUser.type === "employer"
                              ? "👔 Werkgever"
                              : "📊 Accountant"}
                          </span>
                        </div>
                        <div className="text-sm text-gray-500 flex items-center gap-3 mt-1">
                          {selectedUser.kvk_number && (
                            <span className="flex items-center gap-1">
                              <Briefcase className="w-3.5 h-3.5" />
                              KVK: {selectedUser.kvk_number}
                            </span>
                          )}
                          <span className="flex items-center gap-1 text-amber-600 font-medium">
                            <MessageSquare className="w-3.5 h-3.5" />
                            {filteredPosts.length}{" "}
                            {filteredPosts.length === 1 ? "post" : "posts"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={handleClearSearch}
                      className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-bold text-gray-700 transition-colors"
                    >
                      <X className="w-4 h-4" />
                      <span>Wyczyść filtr</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Create Post Card */}
              {showCreatePost && canCreatePost && user && (
                <div className="mb-6">
                  <CreatePostCardPremium
                    userId={user.id}
                    userRole={user.role as "employer" | "accountant"}
                    onPostCreated={() => {
                      setShowCreatePost(false);
                      loadFeed();
                    }}
                    onCancel={() => setShowCreatePost(false)}
                  />
                </div>
              )}

              {/* Posts Masonry */}
              <div className="space-y-6">
                {filteredPosts.length === 0 ? (
                  <EmptyFeedState canCreatePost={canCreatePost} />
                ) : (
                  filteredPosts.map((post) => (
                    <PostCardPremium
                      key={post.id}
                      post={post}
                      onLike={() =>
                        handleLike(post.id, post.user_has_liked || false)
                      }
                      onComment={loadFeed}
                      onShare={loadFeed}
                      onReactionChange={(reactionType) =>
                        handleReactionChange(post.id, reactionType)
                      }
                      currentUserId={user?.id}
                      currentUserRole={user?.role}
                      onImageClick={setLightboxImage}
                    />
                  ))
                )}
              </div>

              {/* Infinite Scroll Observer */}
              <div
                ref={observerTarget}
                className="h-20 flex items-center justify-center"
              >
                {loading && <LoadingSpinner />}
              </div>
            </main>
          </div>
        </div>
      </div>

      {/* Image Lightbox Modal */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
        >
          <button
            onClick={() => setLightboxImage(null)}
            className="absolute top-6 right-6 w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-xl rounded-full flex items-center justify-center text-white transition-colors z-10"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={lightboxImage}
            alt="Lightbox view"
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}

// =====================================================
// PREMIUM POST CARD COMPONENT
// =====================================================

interface PostCardPremiumProps {
  post: Post;
  onLike: () => void;
  onComment: () => void;
  onShare: () => void;
  onReactionChange: (reactionType: ReactionType | null) => void;
  currentUserId?: string;
  currentUserRole?: string;
  onImageClick?: (imageUrl: string) => void;
}

export function PostCardPremium({
  post,
  onLike,
  onComment,
  onShare,
  onReactionChange,
  currentUserId,
  currentUserRole,
  onImageClick,
}: PostCardPremiumProps) {
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<PostComment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [currentFolders, setCurrentFolders] = useState<SaveFolder[]>([]);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [flyingEmojis, setFlyingEmojis] = useState<
    {
      id: number;
      emoji: string;
      xOffset: number;
      scale: number;
      duration: number;
    }[]
  >([]);

  // 3D Tilt State (from Project 4)
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [glowX, setGlowX] = useState(50);
  const [glowY, setGlowY] = useState(50);

  // Load saved folders for this post
  useEffect(() => {
    const loadSavedFolders = async () => {
      if (!currentUserId) return;
      try {
        const { data } = await supabaseAny
          .from("post_saves")
          .select("folder")
          .eq("post_id", post.id)
          .eq("profile_id", currentUserId);

        if (data) {
          setCurrentFolders(data.map((save: any) => save.folder));
        }
      } catch (error) {
        console.error("Error loading saved folders:", error);
      }
    };
    loadSavedFolders();
  }, [post.id, currentUserId]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Zojuist";
    if (diffMins < 60) return `${diffMins}m geleden`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}u geleden`;
    if (diffMins < 10080) return `${Math.floor(diffMins / 1440)}d geleden`;
    return date.toLocaleDateString("nl-NL");
  };

  const handleShowComments = async () => {
    if (!showComments && comments.length === 0) {
      setLoadingComments(true);
      try {
        const fetchedComments = await getPostComments(post.id);
        setComments(fetchedComments);
        // Update local comment count with actual data from API
        post.comments_count = fetchedComments.length;
      } catch (error) {
        console.error("Error loading comments:", error);
      } finally {
        setLoadingComments(false);
      }
    }
    setShowComments(!showComments);
  };

  // 3D Tilt Handlers (from Project 4)
  const tiltSensitivity = post.type === "ad" ? 6 : 3;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateXValue = ((y - centerY) / centerY) * -tiltSensitivity;
    const rotateYValue = ((x - centerX) / centerX) * tiltSensitivity;

    setRotateX(rotateXValue);
    setRotateY(rotateYValue);
    setGlowX((x / rect.width) * 100);
    setGlowY((y / rect.height) * 100);
  };

  const handleMouseLeaveCard = () => {
    setRotateX(0);
    setRotateY(0);
  };

  // Flying Emoji Explosion Animation
  const triggerExplosion = (emoji: string) => {
    const count = Math.floor(Math.random() * 6) + 6; // 6-12 particles
    const newParticles = Array.from({ length: count }).map((_, i) => ({
      id: Date.now() + i + Math.random(),
      emoji,
      xOffset: (Math.random() - 0.5) * 80, // Spread horizontally
      scale: 0.5 + Math.random(), // Random scale 0.5-1.5
      duration: 0.8 + Math.random() * 0.7, // Duration 0.8-1.5s
    }));

    setFlyingEmojis((prev) => [...prev, ...newParticles]);

    // Cleanup after animation
    setTimeout(() => {
      setFlyingEmojis((prev) =>
        prev.filter((p) => !newParticles.find((np) => np.id === p.id))
      );
    }, 1500);
  };

  // Handle Comment Like with Animation
  const handleCommentLike = async (commentId: string) => {
    try {
      const comment = comments.find((c) => c.id === commentId);
      if (!comment) return;

      const isLiked = comment.user_has_liked;

      // Optimistic update
      setComments((prevComments) =>
        prevComments.map((c) =>
          c.id === commentId
            ? {
                ...c,
                likes_count: isLiked ? c.likes_count - 1 : c.likes_count + 1,
                user_has_liked: !isLiked,
              }
            : c
        )
      );

      // Trigger animation on like
      if (!isLiked) {
        triggerExplosion("❤️");
      }

      // TODO: Add API call to like/unlike comment
      // await likeComment(commentId);
    } catch (error) {
      console.error("Error liking comment:", error);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !currentUserId || !currentUserRole) return;

    try {
      setIsSubmittingComment(true);

      let actualUserId: string | null = null;
      const { data: supabaseData } = await supabase.auth.getUser();
      const authUserId = supabaseData?.user?.id;

      if (!authUserId) {
        alert("Je moet ingelogd zijn om te reageren");
        return;
      }

      if (currentUserRole === "worker") {
        const { data } = await supabase
          .from("workers")
          .select("id")
          .eq("profile_id", authUserId)
          .single();
        actualUserId = data?.id || null;
      } else if (currentUserRole === "employer") {
        const { data } = await supabase
          .from("employers")
          .select("id")
          .eq("profile_id", authUserId)
          .single();
        actualUserId = data?.id || null;
      } else if (currentUserRole === "accountant") {
        const { data } = await supabase
          .from("accountants")
          .select("id")
          .eq("profile_id", authUserId)
          .single();
        actualUserId = data?.id || null;
      } else if (currentUserRole === "admin") {
        // Admin uses profile_id directly
        actualUserId = authUserId;
      }

      if (!actualUserId) {
        alert("Kon gebruikers-ID niet vinden");
        return;
      }

      // Don't map admin role - use it directly
      await createComment(
        post.id,
        actualUserId,
        currentUserRole as any,
        commentText
      );
      setCommentText("");

      const updatedComments = await getPostComments(post.id);
      setComments(updatedComments);

      // Update local comment count
      post.comments_count = updatedComments.length;

      onComment();
    } catch (error) {
      console.error("Error creating comment:", error);
      alert("Fout bij het plaatsen van reactie");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // Dynamic glow color based on post type
  const getGlowColor = () => {
    switch (post.type) {
      case "announcement":
        return "rgba(255, 126, 51, 0.15)";
      case "job_offer":
        return "rgba(14, 165, 233, 0.15)";
      case "ad":
        return "rgba(168, 85, 247, 0.2)";
      default:
        return "rgba(148, 163, 184, 0.1)";
    }
  };

  return (
    <article
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeaveCard}
      className="group bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl border border-white/40 overflow-hidden hover:shadow-2xl transition-all duration-200 ease-out relative"
      style={{
        transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${
          1 + Math.abs(rotateX) / 150
        })`,
        transformStyle: "preserve-3d",
        perspective: "1200px",
      }}
    >
      {/* Dynamic Glow Layer */}
      <div
        className="absolute inset-0 rounded-3xl pointer-events-none transition-opacity duration-500 z-0"
        style={{
          background: `radial-gradient(circle at ${glowX}% ${glowY}%, ${getGlowColor()} 0%, transparent 60%)`,
          opacity: 1,
        }}
      />
      {/* Post Header */}
      <div className="p-6 relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4">
            {/* Avatar with gradient ring - clickable */}
            <div className="relative">
              <a
                href={`/${post.author_type}/profile/${
                  post.author_profile_id || post.author_id
                }`}
                className="block w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 p-0.5 hover:scale-110 transition-transform cursor-pointer"
              >
                {post.author_avatar ? (
                  <img
                    src={post.author_avatar}
                    alt={post.author_name || "User"}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center text-white font-bold text-xl">
                    {post.author_name?.charAt(0) || "U"}
                  </div>
                )}
              </a>
              {/* Online indicator */}
              <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <a
                  href={`/${post.author_type}/profile/${
                    post.author_profile_id || post.author_id
                  }`}
                  className="font-bold text-gray-900 hover:text-amber-600 cursor-pointer transition-colors hover:underline"
                >
                  {post.author_name || "Onbekend"}
                </a>
                {/* Verified badge */}
                <Award className="w-4 h-4 text-blue-500" />
              </div>
              <p className="text-sm text-gray-500 flex items-center gap-2">
                <span>{formatDate(post.created_at)}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5" />
                  {post.views_count}
                </span>
              </p>
            </div>
          </div>

          {/* More Options */}
          <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <MoreHorizontal className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Post Type Badge */}
        <div className="mb-3">
          <span
            className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold ${
              post.type === "job_offer"
                ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white"
                : post.type === "ad"
                ? "bg-gradient-to-r from-purple-500 to-pink-600 text-white"
                : "bg-gradient-to-r from-amber-500 to-orange-600 text-white"
            }`}
          >
            {post.type === "job_offer" && (
              <>
                <Briefcase className="w-3.5 h-3.5" /> Vacature
              </>
            )}
            {post.type === "ad" && <>📣 Advertentie</>}
            {post.type === "announcement" && <>📢 Aankondiging</>}
          </span>
        </div>

        {/* Post Title */}
        {post.title && (
          <h2 className="text-2xl font-black text-gray-900 mb-3 leading-tight">
            {post.title}
          </h2>
        )}

        {/* Post Content - Premium Styled */}
        <div className="premium-content-wrapper mb-4 relative group/content">
          {/* Outer glow effect */}
          <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-violet-500 to-purple-600 rounded-2xl opacity-0 group-hover/content:opacity-30 blur-md transition-opacity duration-500"></div>

          {/* Animated dots border */}
          <div className="dots-border absolute inset-0 overflow-hidden rounded-2xl pointer-events-none opacity-0 group-hover/content:opacity-100 transition-opacity duration-300 z-10">
            <div className="dots-rotating absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-8 bg-gradient-to-r from-transparent via-white to-transparent"></div>
          </div>

          {/* Gradient background overlay */}
          <div
            className="gradient-overlay absolute inset-0 rounded-2xl opacity-0 group-hover/content:opacity-100 transition-opacity duration-300 pointer-events-none"
            style={{
              background:
                "radial-gradient(at 51% 89%, hsla(266, 45%, 74%, 0.15) 0px, transparent 50%), radial-gradient(at 100% 100%, hsla(266, 36%, 60%, 0.15) 0px, transparent 50%), radial-gradient(at 22% 91%, hsla(266, 36%, 60%, 0.15) 0px, transparent 50%)",
            }}
          ></div>

          {/* Content container */}
          <div className="relative bg-gradient-to-br from-slate-50 to-white rounded-2xl p-6 border-2 border-transparent group-hover/content:border-slate-200 transition-all duration-300 shadow-sm group-hover/content:shadow-2xl premium-content-box">
            {/* Sparkle icon */}
            <div className="absolute top-3 right-3 opacity-0 group-hover/content:opacity-100 transition-opacity duration-500">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                className="w-5 h-5 sparkle-icon"
              >
                <path
                  className="sparkle-path"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="currentColor"
                  d="M14.187 8.096L15 5.25L15.813 8.096C16.0231 8.83114 16.4171 9.50062 16.9577 10.0413C17.4984 10.5819 18.1679 10.9759 18.903 11.186L21.75 12L18.904 12.813C18.1689 13.0231 17.4994 13.4171 16.9587 13.9577C16.4181 14.4984 16.0241 15.1679 15.814 15.903L15 18.75L14.187 15.904C13.9769 15.1689 13.5829 14.4994 13.0423 13.9587C12.5016 13.4181 11.8321 13.0241 11.097 12.814L8.25 12L11.096 11.187C11.8311 10.9769 12.5006 10.5829 13.0413 10.0423C13.5819 9.50162 13.9759 8.83214 14.186 8.097L14.187 8.096Z"
                />
              </svg>
            </div>

            {/* Text content */}
            <p className="premium-text text-gray-800 whitespace-pre-wrap leading-relaxed text-base font-medium relative z-10 group-hover/content:text-transparent group-hover/content:bg-clip-text group-hover/content:bg-gradient-to-r group-hover/content:from-gray-900 group-hover/content:via-purple-900 group-hover/content:to-gray-900 transition-all duration-500">
              {post.content}
            </p>
          </div>
        </div>

        <style>{`
          @keyframes rotate-dots {
            to {
              transform: translate(-50%, -50%) rotate(360deg);
            }
          }
          
          .dots-rotating {
            animation: rotate-dots 3s linear infinite;
            mask: linear-gradient(transparent 0%, white 120%);
          }
          
          .premium-content-box::before {
            content: "";
            position: absolute;
            inset: -2px;
            background: linear-gradient(90deg, 
              hsl(260, 97%, 61%), 
              hsl(266, 45%, 74%), 
              hsl(266, 36%, 60%), 
              hsl(260, 97%, 61%)
            );
            background-size: 200% 100%;
            border-radius: 1rem;
            opacity: 0;
            z-index: -1;
            transition: opacity 0.3s ease;
          }
          
          .group:hover .premium-content-box::before {
            opacity: 0.5;
            animation: gradient-shift 3s linear infinite;
          }
          
          @keyframes gradient-shift {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          
          .premium-content-box::after {
            content: "";
            position: absolute;
            inset: 0;
            background: radial-gradient(
              600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%),
              rgba(138, 43, 226, 0.1),
              transparent 40%
            );
            border-radius: 1rem;
            opacity: 0;
            transition: opacity 0.3s ease;
            pointer-events: none;
          }
          
          .group:hover .premium-content-box::after {
            opacity: 1;
          }
          
          .sparkle-icon {
            color: hsl(260, 97%, 61%);
          }
          
          .sparkle-path {
            transform-origin: center;
            animation: sparkle-pulse 2s ease-in-out infinite;
          }
          
          @keyframes sparkle-pulse {
            0%, 100% {
              transform: scale(1);
              opacity: 0.7;
            }
            50% {
              transform: scale(1.3);
              opacity: 1;
            }
          }
        `}</style>

        {/* Media Gallery with Modern Layout */}
        {post.media_urls && post.media_urls.length > 0 && (
          <div className="mb-4 -mx-6">
            <div
              className={`grid gap-1 ${
                post.media_urls.length === 1
                  ? "grid-cols-1"
                  : post.media_urls.length === 2
                  ? "grid-cols-2"
                  : post.media_urls.length === 3
                  ? "grid-cols-3"
                  : post.media_urls.length === 4
                  ? "grid-cols-2"
                  : "grid-cols-3"
              }`}
            >
              {post.media_urls.slice(0, 5).map((mediaUrl, index) => {
                const mediaType = post.media_types?.[index] || "image";
                const isLastAndMore =
                  index === 4 && post.media_urls!.length > 5;

                return (
                  <div
                    key={index}
                    className={`relative bg-slate-100 group/media cursor-pointer overflow-hidden rounded-lg ${
                      post.media_urls!.length === 1
                        ? "aspect-[16/10]"
                        : post.media_urls!.length === 2
                        ? "aspect-[4/5]"
                        : "aspect-square"
                    } ${
                      index === 0 && post.media_urls!.length === 3
                        ? "col-span-3"
                        : ""
                    }`}
                    onClick={() =>
                      mediaType === "image" &&
                      onImageClick &&
                      onImageClick(mediaUrl)
                    }
                  >
                    {mediaType === "image" ? (
                      <>
                        <img
                          src={mediaUrl}
                          alt={`Media ${index + 1}`}
                          className="w-full h-full object-contain group-hover/media:scale-105 transition-transform duration-500"
                        />
                        {isLastAndMore && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                            <span className="text-white text-4xl font-black">
                              +{post.media_urls!.length - 5}
                            </span>
                          </div>
                        )}
                      </>
                    ) : (
                      <video
                        src={mediaUrl}
                        controls
                        className="w-full h-full object-contain"
                        preload="metadata"
                      />
                    )}

                    {/* Media Type Indicator */}
                    <div className="absolute top-3 right-3 px-2.5 py-1 bg-black/70 backdrop-blur-sm text-white text-xs rounded-full flex items-center gap-1.5 opacity-0 group-hover/media:opacity-100 transition-opacity">
                      {mediaType === "image" ? (
                        <ImageIcon className="w-3 h-3" />
                      ) : (
                        <Video className="w-3 h-3" />
                      )}
                      <span className="capitalize">{mediaType}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Job Offer Card - Modern Clean Design */}
        {post.type === "job_offer" && (
          <div className="job-details-modern mb-6">
            {/* Main container - Clean white card */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
              {/* Grid with job details - 2 columns elegant pills */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                {/* Salary - First (most important) */}
                {(post.job_salary_min || post.job_salary_max) && (
                  <div className="col-span-2 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-100">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-white shadow-sm flex items-center justify-center">
                        <span className="text-2xl">€</span>
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-gray-600 uppercase mb-0.5">
                          UURTARIEF
                        </div>
                        <div className="text-xl font-black text-gray-900">
                          €{post.job_salary_min || "?"}-€
                          {post.job_salary_max || "?"} /uur
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Type */}
                {post.job_category && (
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">📋</span>
                      <div className="text-xs font-semibold text-gray-500 uppercase">
                        TYPE
                      </div>
                    </div>
                    <div className="text-sm font-bold text-gray-900">
                      {post.job_category}
                    </div>
                  </div>
                )}

                {/* Location */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin className="w-4 h-4 text-blue-600" />
                    <div className="text-xs font-semibold text-gray-500 uppercase">
                      LOCATIE
                    </div>
                  </div>
                  <div className="text-sm font-bold text-gray-900">
                    {post.job_location || (
                      <span className="text-gray-400">Niet opgegeven</span>
                    )}
                  </div>
                </div>

                {/* Hours per week */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">⏰</span>
                    <div className="text-xs font-semibold text-gray-500 uppercase">
                      UREN/TYDZIEŃ
                    </div>
                  </div>
                  <div className="text-sm font-bold text-gray-900">
                    {post.job_hours_per_week || (
                      <span className="text-gray-400">Niet opgegeven</span>
                    )}
                  </div>
                </div>

                {/* Start date */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <div className="text-xs font-semibold text-gray-500 uppercase">
                      POCZĄTEK
                    </div>
                  </div>
                  <div className="text-sm font-bold text-gray-900">
                    {post.job_start_date ? (
                      new Date(post.job_start_date).toLocaleDateString("nl-NL")
                    ) : (
                      <span className="text-gray-400">Nie podano</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Benefits Section - Modern Clean */}
              {post.job_benefits && post.job_benefits.length > 0 && (
                <div className="mb-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-5 border border-green-100">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-xl">🎁</span>
                    <span className="text-sm font-bold text-gray-700 uppercase">
                      VOORDELEN
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {post.job_benefits.map((benefit, idx) => (
                      <div
                        key={idx}
                        className="bg-white px-4 py-2 rounded-lg border border-green-200 text-sm font-semibold text-gray-800 hover:border-green-400 hover:shadow-sm transition-all"
                      >
                        <span className="text-green-600 mr-1.5">✓</span>
                        {benefit}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Contact Section - Modern Clean */}
              {(post.job_contact_email || post.job_contact_phone) && (
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-5 border border-blue-100">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-xl">📞</span>
                    <span className="text-sm font-bold text-gray-700 uppercase">
                      KONTAKT
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {post.job_contact_email && (
                      <a
                        href={`mailto:${post.job_contact_email}`}
                        className="flex items-center gap-3 bg-white px-4 py-3 rounded-lg border border-blue-200 hover:border-blue-400 hover:shadow-sm transition-all group"
                      >
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                          <Mail className="w-5 h-5 text-blue-600" />
                        </div>
                        <span className="text-sm font-semibold text-gray-800 truncate">
                          {post.job_contact_email}
                        </span>
                      </a>
                    )}
                    {post.job_contact_phone && (
                      <a
                        href={`tel:${post.job_contact_phone}`}
                        className="flex items-center gap-3 bg-white px-4 py-3 rounded-lg border border-blue-200 hover:border-blue-400 hover:shadow-sm transition-all group"
                      >
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                          <Phone className="w-5 h-5 text-blue-600" />
                        </div>
                        <span className="text-sm font-semibold text-gray-800">
                          {post.job_contact_phone}
                        </span>
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Apply Button for job offers */}
        {post.type === "job_offer" && (
          <div className="mb-4">
            <button
              onClick={async () => {
                if (!currentUserId) {
                  alert("Musisz być zalogowany, aby aplikować na ofertę pracy");
                  return;
                }

                // Only workers can apply for jobs
                if (currentUserRole !== "worker") {
                  alert("Tylko pracownicy mogą aplikować na oferty pracy");
                  return;
                }

                try {
                  // Get worker ID from profile
                  const { data: workerData, error: workerError } =
                    await supabase
                      .from("workers")
                      .select("id")
                      .eq("profile_id", currentUserId)
                      .single();

                  if (workerError || !workerData) {
                    alert("Nie znaleziono profilu pracownika");
                    return;
                  }

                  // Import application service
                  const { applyForJob } = await import(
                    "../src/services/application"
                  );

                  // Apply for the job
                  await applyForJob(post.id, workerData.id);

                  alert(
                    `✅ Aplikacja wysłana!\n\nTwoja aplikacja na: "${
                      post.title || "tę ofertę"
                    }" została pomyślnie wysłana.\n\nPracodawca otrzyma powiadomienie.`
                  );

                  // Reload feed - need to call parent component's loadFeed
                  window.location.reload();
                } catch (error: any) {
                  console.error("Error applying for job:", error);
                  if (error.message?.includes("already applied")) {
                    alert("⚠️ Już aplikowałeś na tę ofertę pracy");
                  } else {
                    alert(
                      "❌ Błąd podczas wysyłania aplikacji. Spróbuj ponownie."
                    );
                  }
                }
              }}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-3 rounded-full hover:shadow-lg transform hover:scale-105 transition-all"
            >
              Solliciteren
            </button>
          </div>
        )}

        {/* Ad Card */}
        {post.type === "ad" && (
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-5 space-y-4 mb-4 border border-purple-200">
            <div className="flex items-center gap-2 text-purple-900 font-bold">
              <span className="text-xl">📣</span>
              <span>Advertentie Details</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-center gap-2 text-sm text-gray-700 bg-white/60 rounded-lg px-3 py-2">
                <span className="font-semibold">📦 Type:</span>
                {post.ad_type ? (
                  <span>
                    {post.ad_type === "product" && "🛍️ Produkt"}
                    {post.ad_type === "service" && "🛠️ Usługa"}
                    {post.ad_type === "event" && "🎉 Wydarzenie"}
                    {post.ad_type === "promotion" && "🎁 Promocja"}
                  </span>
                ) : (
                  <span className="text-gray-400 italic">
                    Type reklamy nie podany
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-700 bg-white/60 rounded-lg px-3 py-2">
                <span className="font-semibold">💰 Budget:</span>
                {post.ad_budget ? (
                  <span className="text-green-700 font-bold">
                    €{post.ad_budget}
                  </span>
                ) : (
                  <span className="text-gray-400 italic">
                    Budżet nie podany
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-700 bg-white/60 rounded-lg px-3 py-2">
                <span className="font-semibold">⏱️ Duur:</span>
                {post.ad_duration_days ? (
                  <span>{post.ad_duration_days} dagen</span>
                ) : (
                  <span className="text-gray-400 italic">
                    Czas trwania nie podany
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-700 bg-white/60 rounded-lg px-3 py-2">
                <span className="font-semibold">🌐 Website:</span>
                {post.ad_website ? (
                  <a
                    href={post.ad_website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline truncate"
                  >
                    {post.ad_website}
                  </a>
                ) : (
                  <span className="text-gray-400 italic">
                    Strona www nie podana
                  </span>
                )}
              </div>
            </div>

            {/* Target Audience */}
            <div className="space-y-2">
              <span className="text-sm font-semibold text-gray-700">
                👥 Doelgroep:
              </span>
              {post.ad_target_audience && post.ad_target_audience.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {post.ad_target_audience.map((audience, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 text-xs font-bold rounded-full"
                    >
                      {audience}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-gray-400 italic text-sm">
                  Grupa docelowa nie podana
                </span>
              )}
            </div>

            {/* CTA Button */}
            {post.ad_cta_url && post.ad_cta_text && (
              <a
                href={post.ad_cta_url}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-3 rounded-full hover:shadow-lg transform hover:scale-105 transition-all text-center"
              >
                {post.ad_cta_text}
              </a>
            )}

            {/* Contact Info */}
            <div className="space-y-2 pt-2 border-t border-purple-200">
              <span className="text-sm font-semibold text-gray-700">
                📞 Contact:
              </span>
              <div className="flex flex-wrap gap-3">
                {post.ad_contact_email ? (
                  <a
                    href={`mailto:${post.ad_contact_email}`}
                    className="flex items-center gap-2 text-sm text-purple-600 hover:text-purple-800 bg-white/60 rounded-lg px-3 py-2"
                  >
                    <Mail className="w-4 h-4" />
                    {post.ad_contact_email}
                  </a>
                ) : (
                  <span className="flex items-center gap-2 text-sm text-gray-400 italic bg-white/60 rounded-lg px-3 py-2">
                    <Mail className="w-4 h-4" />
                    Email nie podany
                  </span>
                )}
                {post.ad_contact_phone ? (
                  <a
                    href={`tel:${post.ad_contact_phone}`}
                    className="flex items-center gap-2 text-sm text-purple-600 hover:text-purple-800 bg-white/60 rounded-lg px-3 py-2"
                  >
                    <Phone className="w-4 h-4" />
                    {post.ad_contact_phone}
                  </a>
                ) : (
                  <span className="flex items-center gap-2 text-sm text-gray-400 italic bg-white/60 rounded-lg px-3 py-2">
                    <Phone className="w-4 h-4" />
                    Telefon nie podany
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Announcement Card */}
        {post.type === "announcement" && (
          <div
            className={`rounded-2xl p-5 space-y-4 mb-4 border-2 ${
              post.announcement_category === "urgent"
                ? "bg-gradient-to-br from-red-50 to-orange-50 border-red-300"
                : post.announcement_category === "warning"
                ? "bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-300"
                : post.announcement_category === "success"
                ? "bg-gradient-to-br from-green-50 to-emerald-50 border-green-300"
                : "bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200"
            }`}
          >
            <div className="flex items-center gap-2 font-bold">
              <span className="text-xl">
                {post.announcement_category === "urgent" && "🚨"}
                {post.announcement_category === "warning" && "⚠️"}
                {post.announcement_category === "success" && "✅"}
                {(!post.announcement_category ||
                  post.announcement_category === "info") &&
                  "ℹ️"}
              </span>
              <span
                className={
                  post.announcement_category === "urgent"
                    ? "text-red-900"
                    : post.announcement_category === "warning"
                    ? "text-yellow-900"
                    : post.announcement_category === "success"
                    ? "text-green-900"
                    : "text-blue-900"
                }
              >
                Aankondiging
                {post.announcement_priority && (
                  <span className="ml-2 text-xs">
                    (
                    {post.announcement_priority === "high" && "Hoge prioriteit"}
                    {post.announcement_priority === "medium" &&
                      "Gemiddelde prioriteit"}
                    {post.announcement_priority === "low" && "Lage prioriteit"})
                  </span>
                )}
              </span>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <span className="text-sm font-semibold text-gray-700">
                🏷️ Tagi:
              </span>
              {post.announcement_tags && post.announcement_tags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {post.announcement_tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-white/80 text-gray-700 text-xs font-bold rounded-full border border-gray-200"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-gray-400 italic text-sm">
                  Tagi nie podane
                </span>
              )}
            </div>

            {/* Expiration Date */}
            <div className="flex items-center gap-2 text-sm text-gray-700 bg-white/60 rounded-lg px-3 py-2 w-fit">
              <Calendar className="w-4 h-4" />
              <span className="font-semibold">Geldig tot:</span>
              {post.announcement_expires_at ? (
                <span>
                  {new Date(post.announcement_expires_at).toLocaleDateString(
                    "nl-NL"
                  )}
                </span>
              ) : (
                <span className="text-gray-400 italic">
                  Brak daty wygaśnięcia
                </span>
              )}
            </div>

            {/* Target Roles */}
            <div className="space-y-2">
              <span className="text-sm font-semibold text-gray-700">
                👥 Voor:
              </span>
              {post.announcement_target_roles &&
              post.announcement_target_roles.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {post.announcement_target_roles.map((role, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 text-xs font-bold rounded-full"
                    >
                      {role === "worker" && "👷 Pracownicy ZZP"}
                      {role === "cleaning_company" && "🧹 Firmy sprzątające"}
                      {role === "employer" && "💼 Pracodawcy"}
                      {role === "accountant" && "📊 Księgowi"}
                      {role === "admin" && "⚙️ Administratorzy"}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-gray-400 italic text-sm">
                  Dla wszystkich użytkowników
                </span>
              )}
            </div>

            {post.announcement_pinned && (
              <div className="flex items-center gap-2 text-sm font-bold text-amber-700 bg-amber-100/80 rounded-lg px-3 py-2 w-fit">
                📌 Przypięte ogłoszenie
              </div>
            )}
          </div>
        )}
      </div>

      {/* Reaction Counts Display (NEW) */}
      {post.reactions && post.reactions.total > 0 && (
        <div className="px-6 py-2 border-t border-gray-100 relative z-10">
          <ReactionCountsDisplay reactions={post.reactions} />
        </div>
      )}

      {/* Post Stats - Top Bar */}
      {(post.likes_count > 0 ||
        post.comments_count > 0 ||
        post.shares_count > 0) && (
        <div className="px-6 py-2 border-t border-gray-100/50 relative z-10">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-3">
              {post.likes_count > 0 && (
                <span>
                  {post.likes_count}{" "}
                  {post.likes_count === 1
                    ? "persoon vindt dit leuk"
                    : "personen vinden dit leuk"}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              {post.comments_count > 0 && (
                <span>
                  {post.comments_count}{" "}
                  {post.comments_count === 1 ? "reactie" : "reacties"}
                </span>
              )}
              {post.shares_count > 0 && (
                <span>{post.shares_count} keer gedeeld</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Post Actions Bar - Minimalist Design */}
      <div className="px-6 py-3 border-t border-gray-100/50 relative z-10">
        <div className="flex items-center justify-between">
          {/* Like Button with Emoji Picker */}
          <div className="flex items-center gap-2">
            <ReactionButton
              likesCount={post.likes_count || 0}
              userReaction={post.user_reaction}
              onReactionChange={onReactionChange}
            />
          </div>

          {/* Comment Button */}
          <button
            onClick={handleShowComments}
            className="group flex items-center gap-2 px-3 py-2 transition-colors duration-200"
          >
            <MessageSquare className="w-5 h-5 text-gray-500 group-hover:text-gray-700 transition-colors" />
            <span className="text-sm font-medium text-gray-600 group-hover:text-gray-900 transition-colors">
              Reageer {post.comments_count > 0 && `(${post.comments_count})`}
            </span>
          </button>

          {/* Share Button */}
          <button
            onClick={() => setShowShareModal(true)}
            className="group flex items-center gap-2 px-3 py-2 transition-colors duration-200"
          >
            <Share2 className="w-5 h-5 text-gray-500 group-hover:text-gray-700 transition-colors" />
            <span className="text-sm font-medium text-gray-600 group-hover:text-gray-900 transition-colors">
              Delen
            </span>
          </button>

          {/* Save Button */}
          <SaveButton
            postId={post.id}
            currentFolders={currentFolders}
            onSave={async (folder) => {
              if (!currentUserId) return;

              // Get actual user ID based on role
              let actualUserId = currentUserId;
              if (currentUserRole === "worker") {
                const { data } = await supabaseAny
                  .from("workers")
                  .select("id")
                  .eq("profile_id", currentUserId)
                  .single();
                if (data) actualUserId = data.id;
              } else if (currentUserRole === "employer") {
                const { data } = await supabaseAny
                  .from("employers")
                  .select("id")
                  .eq("profile_id", currentUserId)
                  .single();
                if (data) actualUserId = data.id;
              } else if (currentUserRole === "accountant") {
                const { data } = await supabaseAny
                  .from("accountants")
                  .select("id")
                  .eq("profile_id", currentUserId)
                  .single();
                if (data) actualUserId = data.id;
              }

              await supabaseAny.from("post_saves").insert({
                post_id: post.id,
                profile_id: currentUserId,
                user_id: actualUserId,
                user_role: currentUserRole,
                folder: folder,
              });

              setCurrentFolders([...currentFolders, folder]);
            }}
            onUnsave={async (folder) => {
              await supabaseAny
                .from("post_saves")
                .delete()
                .eq("post_id", post.id)
                .eq("profile_id", currentUserId)
                .eq("folder", folder);

              setCurrentFolders(currentFolders.filter((f) => f !== folder));
            }}
            userRole={currentUserRole}
            compact
          />
        </div>
      </div>

      {/* Comments Section - Premium Style */}
      {showComments && (
        <div className="border-t border-slate-100/50 bg-white/20 backdrop-blur-xl rounded-b-[2.5rem] relative">
          {loadingComments ? (
            <div className="text-center py-8 text-slate-600">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
              <p className="mt-2 text-sm">Reacties laden...</p>
            </div>
          ) : (
            <>
              {/* Comments List */}
              <div className="px-6 py-4 space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar">
                {comments.length === 0 ? (
                  <p className="text-center text-slate-400 text-xs italic py-4">
                    Nog geen reacties. Wees de eerste!
                  </p>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} className="relative mt-4">
                      <div className="flex gap-3 group/comment">
                        {/* Avatar */}
                        <img
                          src={
                            comment.user_avatar ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(
                              comment.user_name || "User"
                            )}&background=f59e0b&color=fff`
                          }
                          alt={comment.user_name}
                          className="w-8 h-8 rounded-full border border-white shadow-sm object-cover flex-shrink-0"
                        />

                        <div className="flex-1 relative">
                          {/* Comment Bubble */}
                          <div className="bg-white/60 backdrop-blur-sm rounded-2xl rounded-tl-none px-4 py-2.5 border border-white/40 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-baseline">
                              <span className="font-bold text-xs text-slate-800">
                                {comment.user_name}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {formatDate(comment.created_at)}
                              </span>
                            </div>
                            <p className="text-sm text-slate-700 leading-relaxed mt-0.5">
                              {comment.content}
                            </p>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-4 mt-1.5 ml-2 relative z-20">
                            <button
                              onClick={() => handleCommentLike(comment.id)}
                              className={`text-xs font-bold flex items-center gap-1 transition-colors ${
                                comment.user_has_liked
                                  ? "text-rose-500"
                                  : "text-slate-400 hover:text-rose-500"
                              }`}
                            >
                              <Heart
                                className={`w-3 h-3 transition-transform ${
                                  comment.user_has_liked
                                    ? "fill-current animate-heart-pop"
                                    : ""
                                }`}
                              />
                              {comment.likes_count > 0 && (
                                <span>{comment.likes_count}</span>
                              )}
                            </button>
                            <button
                              onClick={() => setReplyingTo(comment.id)}
                              className="text-xs font-bold text-slate-400 hover:text-blue-500 transition-colors"
                            >
                              Reageer
                            </button>
                          </div>

                          {/* FLYING EMOJI CONTAINER */}
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 pointer-events-none w-20 h-0 overflow-visible z-50">
                            {flyingEmojis.map((p) => (
                              <div
                                key={p.id}
                                className="absolute bottom-0 left-1/2 text-2xl animate-fly-up opacity-80"
                                style={
                                  {
                                    "--tw-translate-x": `${p.xOffset}px`,
                                    animationDuration: `${p.duration}s`,
                                    fontSize: `${p.scale * 1.5}rem`,
                                  } as React.CSSProperties
                                }
                              >
                                {p.emoji}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Comment Input */}
              <div className="p-4 bg-white/40 backdrop-blur-md border-t border-white/50 rounded-b-[2.5rem] relative z-20">
                {replyingTo && (
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-2 px-2">
                    <span className="flex items-center gap-1">
                      <ChevronRight className="w-3 h-3" />
                      Antwoord op{" "}
                      <strong>
                        {comments.find((c) => c.id === replyingTo)?.user_name}
                      </strong>
                    </span>
                    <button
                      onClick={() => setReplyingTo(null)}
                      className="text-rose-500 hover:underline"
                    >
                      Annuleer
                    </button>
                  </div>
                )}

                {currentUserId && currentUserRole ? (
                  <form onSubmit={handleSubmitComment}>
                    <div className="flex gap-3 items-end">
                      <img
                        src={`https://ui-avatars.com/api/?name=U&background=f59e0b&color=fff`}
                        className="w-8 h-8 rounded-xl object-cover border border-white shadow-sm"
                        alt="me"
                      />
                      <div className="flex-1 relative">
                        <input
                          type="text"
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          onKeyDown={(e) =>
                            e.key === "Enter" && handleSubmitComment(e as any)
                          }
                          placeholder={
                            replyingTo
                              ? "Schrijf een antwoord..."
                              : "Schrijf een reactie..."
                          }
                          disabled={isSubmittingComment}
                          className="w-full pl-4 pr-10 py-2.5 bg-white/80 border border-white/60 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-200 shadow-inner placeholder-slate-400 transition-all disabled:opacity-50"
                        />
                        <button
                          type="submit"
                          disabled={!commentText.trim() || isSubmittingComment}
                          className="absolute right-1.5 top-1.5 p-1.5 bg-gradient-to-r from-slate-800 to-slate-900 text-white rounded-lg hover:shadow-lg disabled:opacity-30 disabled:shadow-none transition-all hover:scale-105"
                        >
                          <Send className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </form>
                ) : (
                  <div className="text-sm text-slate-500 text-center py-3 bg-slate-100 rounded-2xl">
                    Log in om te reageren
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Share Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        postUrl={`/feed/${post.id}`}
        postTitle={post.content.substring(0, 100)}
        postDescription={post.content}
      />
    </article>
  );
}

// =====================================================
// CREATE POST CARD PREMIUM
// =====================================================

interface CreatePostCardPremiumProps {
  userId: string;
  userRole: "employer" | "accountant";
  onPostCreated: () => void;
  onCancel: () => void;
}

function CreatePostCardPremium({
  userId,
  userRole,
  onPostCreated,
  onCancel,
}: CreatePostCardPremiumProps) {
  const [postType, setPostType] = useState<PostType>("announcement");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [mediaPreview, setMediaPreview] = useState<
    { file: File; preview: string; type: "image" | "video" }[]
  >([]);
  const [jobCategory, setJobCategory] = useState("");
  const [jobLocation, setJobLocation] = useState("");
  const [jobSalaryMin, setJobSalaryMin] = useState("");
  const [jobSalaryMax, setJobSalaryMax] = useState("");

  // Enhanced form data for all post types
  const [enhancedFormData, setEnhancedFormData] = useState<Record<string, any>>(
    {}
  );

  const handleFormChange = (field: string, value: any) => {
    setEnhancedFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const currentCount = selectedFiles.length;
    const newCount = currentCount + files.length;
    if (newCount > 10) {
      alert("Maksymalnie 10 plików na post");
      return;
    }

    const validFiles: File[] = [];
    const invalidFiles: string[] = [];

    files.forEach((file) => {
      const isImage = file.type.startsWith("image/");
      const isVideo = file.type.startsWith("video/");
      const isValidSize = file.size <= 20 * 1024 * 1024;

      if ((isImage || isVideo) && isValidSize) {
        validFiles.push(file);
      } else {
        invalidFiles.push(file.name);
      }
    });

    if (invalidFiles.length > 0) {
      alert(
        `Nieprawidłowe pliki: ${invalidFiles.join(
          ", "
        )}\nObsługiwane: zdjęcia i filmy do 20MB`
      );
    }

    if (validFiles.length > 0) {
      setSelectedFiles((prev) => [...prev, ...validFiles]);

      validFiles.forEach((file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const preview = e.target?.result as string;
          const type = file.type.startsWith("image/") ? "image" : "video";
          setMediaPreview((prev) => [...prev, { file, preview, type }]);
        };
        reader.readAsDataURL(file);
      });
    }

    e.target.value = "";
  };

  const removeMedia = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setMediaPreview((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    try {
      setSubmitting(true);
      let mediaUrls: string[] = [];
      let mediaTypes: string[] = [];

      if (selectedFiles.length > 0) {
        try {
          setUploadingMedia(true);
          const uploadResult = await uploadMultipleFeedMedia(
            selectedFiles,
            userId
          );

          if (uploadResult.success) {
            mediaUrls = uploadResult.urls;
            mediaTypes = uploadResult.types;
          } else {
            alert(
              `Ostrzeżenie: ${uploadResult.error}. Post zostanie utworzony bez mediów.`
            );
          }
        } catch (uploadError) {
          alert(
            "Ostrzeżenie: Błąd podczas przesyłania mediów. Post zostanie utworzony bez mediów."
          );
        } finally {
          setUploadingMedia(false);
        }
      }

      const postData: CreatePostData = {
        author_type: userRole,
        type: postType,
        title: title.trim() || undefined,
        content: content.trim(),
        media_urls: mediaUrls.length > 0 ? mediaUrls : undefined,
        media_types: mediaTypes.length > 0 ? mediaTypes : undefined,
        ...enhancedFormData, // Add all enhanced fields
      };

      // Legacy job_offer fields (keep for backward compatibility)
      if (postType === "job_offer") {
        postData.job_category = jobCategory || undefined;
        postData.job_location = jobLocation || undefined;
        postData.job_salary_min = jobSalaryMin
          ? parseFloat(jobSalaryMin)
          : undefined;
        postData.job_salary_max = jobSalaryMax
          ? parseFloat(jobSalaryMax)
          : undefined;
      }

      await createPost(postData);

      setTitle("");
      setContent("");
      setJobCategory("");
      setJobLocation("");
      setJobSalaryMin("");
      setJobSalaryMax("");
      setSelectedFiles([]);
      setMediaPreview([]);
      setEnhancedFormData({}); // Reset enhanced fields

      onPostCreated();
    } catch (error) {
      console.error("Error creating post:", error);
      alert("Fout bij het aanmaken van post. Probeer het opnieuw.");
    } finally {
      setSubmitting(false);
      setUploadingMedia(false);
    }
  };

  return (
    <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/40 p-8 animate-fadeIn">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-black bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
          Nieuw Post Maken
        </h2>
        <button
          onClick={onCancel}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X className="w-6 h-6 text-gray-400" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Post Type Pills */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-3">
            Type Post
          </label>
          <div className="flex flex-wrap gap-3">
            {(["announcement", "job_offer", "ad"] as PostType[]).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setPostType(type)}
                className={`px-6 py-3 rounded-full text-sm font-bold transition-all transform ${
                  postType === type
                    ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg scale-105"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-105"
                }`}
              >
                {type === "announcement" && "📢 Aankondiging"}
                {type === "job_offer" && "💼 Vacature"}
                {type === "ad" && "📣 Advertentie"}
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Titel (optioneel)
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Geef je post een titel..."
            className="w-full px-5 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-amber-500 focus:border-transparent text-lg"
          />
        </div>

        {/* Content */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Inhoud *
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Wat wil je delen met de community?"
            rows={6}
            className="w-full px-5 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none text-lg"
            required
          />
        </div>

        {/* Progress Bar */}
        <ProgressBar postType={postType} formData={enhancedFormData} />

        {/* Enhanced Forms Based on Post Type */}
        {postType === "ad" && (
          <AdForm formData={enhancedFormData} onChange={handleFormChange} />
        )}

        {postType === "announcement" && (
          <AnnouncementForm
            formData={enhancedFormData}
            onChange={handleFormChange}
          />
        )}

        {postType === "job_offer" && (
          <JobOfferForm
            formData={enhancedFormData}
            onChange={handleFormChange}
          />
        )}

        {/* Media Upload */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-3">
            Zdjęcia/Filmy
          </label>
          <div className="flex items-center gap-3 mb-4">
            <label
              htmlFor="media-upload"
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-full cursor-pointer hover:shadow-lg transform hover:scale-105 transition-all font-bold"
            >
              <Upload className="w-5 h-5" />
              Bestanden Selecteren
            </label>
            <input
              id="media-upload"
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              disabled={submitting || uploadingMedia}
            />
            <span className="text-sm text-gray-500">
              Max 10 plików, 20MB każdy
            </span>
          </div>

          {/* Media Preview Grid */}
          {mediaPreview.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {mediaPreview.map((media, index) => (
                <div
                  key={index}
                  className="relative bg-gray-100 rounded-2xl overflow-hidden group/preview"
                >
                  {media.type === "image" ? (
                    <img
                      src={media.preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-32 object-cover"
                    />
                  ) : (
                    <div className="w-full h-32 bg-gray-900 flex items-center justify-center">
                      <Video className="w-8 h-8 text-white" />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => removeMedia(index)}
                    className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full opacity-0 group-hover/preview:opacity-100 transition-opacity hover:bg-red-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit Buttons */}
        <div className="flex items-center gap-4 pt-4">
          <button
            type="submit"
            disabled={submitting || uploadingMedia || !content.trim()}
            className="flex-1 bg-gradient-to-r from-amber-600 to-orange-600 text-white font-black py-4 rounded-full hover:shadow-2xl transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-lg"
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <LoadingSpinner />
                {uploadingMedia ? "Uploaden..." : "Plaatsen..."}
              </span>
            ) : (
              "Publiceren"
            )}
          </button>

          <button
            type="button"
            onClick={onCancel}
            className="px-8 py-4 bg-gray-100 text-gray-700 font-bold rounded-full hover:bg-gray-200 transition-colors"
          >
            Annuleren
          </button>
        </div>
      </form>
    </div>
  );
}

// =====================================================
// UTILITY COMPONENTS
// =====================================================

// Progress Bar Component (extracted to prevent removeChild errors)
function ProgressBar({
  postType,
  formData,
}: {
  postType: PostType;
  formData: Record<string, any>;
}) {
  const getFieldCompletion = () => {
    if (postType === "job_offer") {
      const required = ["job_type", "job_location"];
      const recommended = [
        "job_hours_per_week",
        "job_contact_email",
        "job_benefits",
      ];
      const total = required.length + recommended.length;
      const filled = [...required, ...recommended].filter(
        (field) =>
          formData[field] &&
          (Array.isArray(formData[field]) ? formData[field].length > 0 : true)
      ).length;
      return {
        filled,
        total,
        percentage: Math.round((filled / total) * 100),
      };
    }
    if (postType === "ad") {
      const required = ["ad_type"];
      const recommended = ["ad_budget", "ad_cta_text", "ad_website"];
      const total = required.length + recommended.length;
      const filled = [...required, ...recommended].filter(
        (field) => formData[field]
      ).length;
      return {
        filled,
        total,
        percentage: Math.round((filled / total) * 100),
      };
    }
    if (postType === "announcement") {
      const required = ["announcement_category", "announcement_priority"];
      const recommended = ["announcement_tags", "announcement_expires_at"];
      const total = required.length + recommended.length;
      const filled = [...required, ...recommended].filter(
        (field) =>
          formData[field] &&
          (Array.isArray(formData[field]) ? formData[field].length > 0 : true)
      ).length;
      return {
        filled,
        total,
        percentage: Math.round((filled / total) * 100),
      };
    }
    return { filled: 0, total: 0, percentage: 0 };
  };

  const { filled, total, percentage } = getFieldCompletion();

  if (!postType) return null;

  return (
    <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-6 border-2 border-blue-200">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">📊</span>
          <span className="text-sm font-bold text-gray-700">
            Postęp wypełnienia formularza
          </span>
        </div>
        <span className="text-lg font-black text-gray-900">
          {filled}/{total} pól
        </span>
      </div>
      <div className="relative w-full h-4 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-500 ease-out ${
            percentage < 40
              ? "bg-gradient-to-r from-red-400 to-red-600"
              : percentage < 70
              ? "bg-gradient-to-r from-yellow-400 to-orange-500"
              : "bg-gradient-to-r from-green-400 to-emerald-600"
          }`}
          style={{ width: `${percentage}%` }}
        >
          <div className="w-full h-full bg-white/20 animate-pulse" />
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between text-xs">
        <span
          className={`font-bold ${
            percentage < 40
              ? "text-red-600"
              : percentage < 70
              ? "text-orange-600"
              : "text-green-600"
          }`}
        >
          {percentage}% ukończone
        </span>
        <span className="text-gray-600">
          {percentage < 40
            ? "⚠️ Wypełnij wymagane pola"
            : percentage < 70
            ? "📈 Dobra robota! Dodaj więcej szczegółów"
            : percentage < 100
            ? "🎯 Prawie gotowe!"
            : "✅ Wszystkie pola wypełnione!"}
        </span>
      </div>
    </div>
  );
}

function FeedSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl space-y-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-3xl p-6 animate-pulse">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 bg-gray-300 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-300 rounded w-1/4 mb-2"></div>
                <div className="h-3 bg-gray-300 rounded w-1/6"></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-300 rounded"></div>
              <div className="h-4 bg-gray-300 rounded w-5/6"></div>
            </div>
            <div className="h-64 bg-gray-300 rounded-2xl mt-4"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyFeedState({ canCreatePost }: { canCreatePost: boolean }) {
  return (
    <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl p-16 text-center border border-white/40">
      <div className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full flex items-center justify-center">
        <MessageSquare className="w-16 h-16 text-amber-600" />
      </div>
      <h3 className="text-2xl font-black text-gray-900 mb-3">Nog geen posts</h3>
      <p className="text-gray-600 mb-6 max-w-md mx-auto">
        {canCreatePost
          ? "Deel als eerste iets met de community en start een conversatie!"
          : "Zodra er posts zijn, verschijnen ze hier. Kom later terug!"}
      </p>
      {canCreatePost && (
        <button className="bg-gradient-to-r from-amber-600 to-orange-600 text-white font-bold px-8 py-4 rounded-full hover:shadow-xl transform hover:scale-105 transition-all">
          <Plus className="w-5 h-5 inline mr-2" />
          Maak je eerste post
        </button>
      )}
    </div>
  );
}

function LoadingSpinner() {
  return (
    <svg
      className="animate-spin h-5 w-5 text-white"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      ></circle>
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>
  );
}
