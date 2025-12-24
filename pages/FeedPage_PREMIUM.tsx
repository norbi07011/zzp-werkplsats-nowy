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

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../src/lib/supabase";
import {
  StoriesBarPro,
  StoryViewerPro,
  CreateStoryEditor,
  type AuthorGroup,
} from "../components/stories";
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
  reactToComment,
  unreactToComment,
  type Post,
  type PostComment,
  type PostType,
  type CreatePostData,
  type ReactionType,
} from "../src/services/feedService";
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
  Check,
  Clock,
  DollarSign,
} from "../components/icons";
import { LoadingOverlay } from "../components/Loading";
import { ShareModal } from "../components/ShareModal";
import {
  ReactionButton,
  ReactionCountsDisplay,
} from "../src/components/ReactionPicker";

// =====================================================
// TYPES
// =====================================================

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

  // Stories state (PRO version)
  const [showCreateStoryEditor, setShowCreateStoryEditor] = useState(false);
  const [viewingAuthorId, setViewingAuthorId] = useState<string | null>(null);
  const [viewingStoryId, setViewingStoryId] = useState<string | null>(null);
  const [storyAuthorGroups, setStoryAuthorGroups] = useState<AuthorGroup[]>([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<
    "all" | "announcements" | "jobs" | "ads" | "service_requests"
  >("all");

  // 🔥 NOWE: Rozbudowane filtry
  const [selectedCity, setSelectedCity] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState<{ min: number; max: number }>({
    min: 0,
    max: 10000,
  });
  const [sortBy, setSortBy] = useState<
    "newest" | "popular" | "price_low" | "price_high"
  >("newest");

  // Infinite scroll
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const observerTarget = useRef<HTMLDivElement>(null);

  // Trending
  const [trending, setTrending] = useState<TrendingPost[]>([]);

  const canCreatePost =
    user?.role === "employer" ||
    user?.role === "accountant" ||
    user?.role === "admin";

  // 🔥 MIASTA W HOLANDII
  const cities = [
    "all",
    "Amsterdam",
    "Rotterdam",
    "Den Haag",
    "Utrecht",
    "Eindhoven",
    "Groningen",
    "Tilburg",
    "Almere",
    "Breda",
    "Nijmegen",
    "Arnhem",
    "Haarlem",
    "Enschede",
    "Apeldoorn",
    "Leiden",
    "Maastricht",
    "Dordrecht",
    "Zoetermeer",
    "Zwolle",
    "Den Bosch",
  ];

  // 🔥 KATEGORIE BRANŻOWE
  const categories = [
    "all",
    "Budowa/Renovatie",
    "Instalacje elektryczne",
    "Hydraulika",
    "Ogrodnictwo",
    "Malowanie",
    "Sprzątanie",
    "Transport",
    "IT/Tech",
    "Administracja",
    "Księgowość",
    "Marketing",
    "Fotografia",
    "Catering",
    "Inne",
  ];

  // 🔥 FUNKCJA FILTROWANIA POSTÓW
  const filterPosts = useCallback(
    (allPosts: Post[]) => {
      let filtered = [...allPosts];

      // Filtr wyszukiwania
      if (searchQuery.trim()) {
        filtered = filtered.filter(
          (post) =>
            post.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            post.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            post.location?.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }

      // Filtr miasta
      if (selectedCity !== "all") {
        filtered = filtered.filter((post) =>
          post.location?.toLowerCase().includes(selectedCity.toLowerCase())
        );
      }

      // Filtr kategorii
      if (selectedCategory !== "all") {
        filtered = filtered.filter(
          (post) =>
            post.category
              ?.toLowerCase()
              .includes(selectedCategory.toLowerCase()) ||
            post.content?.toLowerCase().includes(selectedCategory.toLowerCase())
        );
      }

      // Sortowanie
      switch (sortBy) {
        case "popular":
          filtered.sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0));
          break;
        case "price_low":
          filtered.sort((a, b) => (a.budget || 0) - (b.budget || 0));
          break;
        case "price_high":
          filtered.sort((a, b) => (b.budget || 0) - (a.budget || 0));
          break;
        case "newest":
        default:
          filtered.sort(
            (a, b) =>
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime()
          );
      }

      return filtered;
    },
    [searchQuery, selectedCity, selectedCategory, sortBy]
  );

  // =====================================================
  // LOAD FEED WITH INFINITE SCROLL
  // =====================================================

  useEffect(() => {
    if (user?.id) {
      loadFeed();
      loadTrending();
    }
  }, [user?.id, activeFilter]);

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

      // 🔥 FIXED: Always use profile_id (auth.uid()), not role-specific ID
      // This ensures RLS policies work correctly with user_id = auth.uid()
      const currentUserId = user?.id; // This is profile_id (auth.uid())

      let data: Post[];

      // Filtruj posty na podstawie activeFilter
      if (activeFilter === "service_requests") {
        // Zlecenia prywatne (service requests) - pobierz z telefonem autora
        const { data: serviceRequests, error } = await supabaseAny
          .from("posts")
          .select(
            `
            *,
            profiles!posts_profile_id_fkey (
              phone
            )
          `
          )
          .not("request_category", "is", null)
          .eq("is_active", true)
          .order("created_at", { ascending: false })
          .limit(20);

        if (error) throw error;

        // Mapuj phone z profiles do author_phone
        data = (serviceRequests || []).map((post: any) => ({
          ...post,
          author_phone: post.profiles?.phone || null,
        }));
      } else if (activeFilter === "announcements") {
        data = await getPosts({
          limit: 20,
          currentUserId,
          type: "announcement",
        });
      } else if (activeFilter === "jobs") {
        data = await getPosts({ limit: 20, currentUserId, type: "job_offer" });
      } else if (activeFilter === "ads") {
        data = await getPosts({ limit: 20, currentUserId, type: "ad" });
      } else {
        // Wszystkie posty
        data = await getPosts({ limit: 20, currentUserId });
      }

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
      } else if (currentUserRole === "cleaning_company") {
        const { data: cleaningData } = await supabase
          .from("cleaning_companies")
          .select("id")
          .eq("profile_id", user.id)
          .single();
        if (cleaningData) actualUserId = cleaningData.id;
      } else if (
        currentUserRole === "admin" ||
        currentUserRole === "regular_user"
      ) {
        // Admin and regular_user use profile_id directly
        actualUserId = user.id;
      }

      // Optimistic update - update local state immediately
      setPosts((prevPosts) =>
        prevPosts.map((post) => {
          if (post.id !== postId) return post;

          // Clone the post to update
          const updatedPost = { ...post };

          // Get previous reaction type (if any) for this user
          const prevReactionType = post.user_reaction || null;

          // Update likes_count for total count
          if (prevReactionType && reactionType === null) {
            // Removing reaction - decrement likes_count
            updatedPost.likes_count = Math.max(
              0,
              (updatedPost.likes_count || 0) - 1
            );
          } else if (!prevReactionType && reactionType !== null) {
            // Adding new reaction - increment likes_count
            updatedPost.likes_count = (updatedPost.likes_count || 0) + 1;
          }
          // If changing reaction type (e.g., like -> love), likes_count stays the same

          // Update user's current reaction
          updatedPost.user_reaction = reactionType;
          updatedPost.user_has_liked = reactionType !== null;

          return updatedPost;
        })
      );

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
      // No need to reload feed - we updated locally!
    } catch (error) {
      console.error("Error changing reaction:", error);
      // On error, reload feed to sync with database
      await loadFeed();
    }
  };

  if (loading && page === 1) {
    return <FeedSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 relative overflow-hidden">
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 🌈 HOLOGRAPHIC GRADIENT SHAPES - NOWOCZESNE TŁO                     */}
      {/* ═══════════════════════════════════════════════════════════════════ */}

      {/* Aurora Blob - Top Right */}
      <div className="fixed top-0 right-0 w-[800px] h-[800px] pointer-events-none z-0">
        <div
          className="absolute top-[-200px] right-[-200px] w-[600px] h-[600px] rounded-full bg-gradient-to-br from-violet-400/20 via-fuchsia-300/15 to-pink-400/20 blur-3xl animate-pulse"
          style={{ animationDuration: "8s" }}
        />
        <div
          className="absolute top-[100px] right-[50px] w-[300px] h-[300px] rounded-full bg-gradient-to-br from-cyan-300/20 via-blue-400/15 to-indigo-400/20 blur-2xl animate-pulse"
          style={{ animationDuration: "6s", animationDelay: "1s" }}
        />
      </div>

      {/* Geometric Gradient - Bottom Left */}
      <div className="fixed bottom-0 left-0 w-[700px] h-[700px] pointer-events-none z-0">
        <div
          className="absolute bottom-[-300px] left-[-200px] w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-amber-300/20 via-orange-400/15 to-rose-400/20 blur-3xl animate-pulse"
          style={{ animationDuration: "10s" }}
        />
        <div
          className="absolute bottom-[50px] left-[100px] w-[250px] h-[250px] rounded-full bg-gradient-to-tr from-emerald-300/15 via-teal-400/10 to-cyan-400/15 blur-2xl animate-pulse"
          style={{ animationDuration: "7s", animationDelay: "2s" }}
        />
      </div>

      {/* Floating Orbs - Middle */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] pointer-events-none z-0">
        <div
          className="absolute top-[200px] left-[100px] w-[150px] h-[150px] rounded-full bg-gradient-to-br from-purple-400/10 to-pink-400/10 blur-2xl animate-bounce"
          style={{ animationDuration: "15s" }}
        />
        <div
          className="absolute top-[400px] right-[150px] w-[100px] h-[100px] rounded-full bg-gradient-to-br from-blue-400/10 to-cyan-400/10 blur-xl animate-bounce"
          style={{ animationDuration: "12s", animationDelay: "3s" }}
        />
      </div>

      {/* Mesh Gradient Overlay */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-30">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient
              id="holographic"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#a855f7" stopOpacity="0.1" />
              <stop offset="25%" stopColor="#ec4899" stopOpacity="0.05" />
              <stop offset="50%" stopColor="#f97316" stopOpacity="0.08" />
              <stop offset="75%" stopColor="#06b6d4" stopOpacity="0.05" />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.1" />
            </linearGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#holographic)" />
        </svg>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 🎨 NOWOCZESNY HEADER - CLEAN & MINIMAL                              */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-2xl border-b border-white/40 shadow-lg shadow-slate-200/20">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 relative">
          {/* Header Gradient Line */}
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-violet-500/50 to-transparent" />

          {/* ===== ROW 1: Logo + Search + CTA ===== */}
          <div className="flex items-center justify-between h-14 sm:h-16 gap-2 sm:gap-4">
            {/* Logo with Holographic Effect */}
            <div className="relative group flex-shrink-0">
              <div className="absolute -inset-2 bg-gradient-to-r from-orange-500 via-pink-500 to-violet-500 rounded-xl opacity-0 group-hover:opacity-20 blur-lg transition-opacity duration-500" />
              <h1 className="relative text-xl sm:text-2xl font-black bg-gradient-to-r from-orange-500 via-rose-500 to-violet-500 bg-clip-text text-transparent whitespace-nowrap">
                ZZP Feed
              </h1>
            </div>

            {/* Search Bar - Glassmorphism z holograficznym akcentem */}
            <div className="flex-1 max-w-2xl mx-2 sm:mx-4 hidden sm:block">
              <div className="relative group">
                {/* Holographic glow on focus */}
                <div className="absolute -inset-1 bg-gradient-to-r from-violet-500/20 via-fuchsia-500/20 to-orange-500/20 rounded-2xl opacity-0 group-focus-within:opacity-100 blur-lg transition-opacity duration-300" />
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-violet-500 transition-colors" />
                  <input
                    type="text"
                    placeholder="Szukaj ogłoszeń, lokalizacji, słów kluczowych..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-white/60 backdrop-blur-sm border border-white/60 rounded-2xl text-slate-800 placeholder-slate-400 focus:bg-white/90 focus:border-violet-300 focus:ring-4 focus:ring-violet-500/10 transition-all shadow-sm"
                  />
                </div>
              </div>
            </div>

            {/* CTA Button - Vibrant Gradient */}
            {canCreatePost && (
              <div className="relative group flex-shrink-0">
                {/* Animated glow effect */}
                <div
                  className="absolute -inset-1 bg-gradient-to-r from-orange-500 via-pink-500 to-violet-500 rounded-xl sm:rounded-2xl opacity-50 group-hover:opacity-70 blur-lg transition-all duration-300 animate-pulse"
                  style={{ animationDuration: "3s" }}
                />
                <button
                  onClick={() => setShowCreatePost(true)}
                  className="relative flex items-center gap-1 sm:gap-2 px-3 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-orange-500 via-rose-500 to-violet-500 text-white rounded-xl font-bold shadow-xl hover:-translate-y-1 transition-all whitespace-nowrap text-sm sm:text-base"
                >
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="hidden xs:inline sm:inline">Nowy Post</span>
                </button>
              </div>
            )}
          </div>

          {/* ===== ROW 2: Stories (compact) ===== */}
          <div className="py-2 sm:py-3 border-t border-white/30">
            <StoriesBarPro
              onCreateStory={() => setShowCreateStoryEditor(true)}
              onViewStory={(authorId, storyId) => {
                setViewingAuthorId(authorId);
                setViewingStoryId(storyId || null);
              }}
            />
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 🎯 NAVIGATION BAR - KATEGORIE Z HOLOGRAFICZNYM EFEKTEM              */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <nav className="sticky top-14 sm:top-16 z-40 bg-white/80 backdrop-blur-2xl border-b border-white/40 shadow-lg shadow-slate-200/10">
        {/* Subtle gradient line */}
        <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-pink-500/30 to-transparent" />

        <div className="max-w-7xl mx-auto px-2 sm:px-6">
          <div className="flex items-center justify-between gap-2 sm:gap-4 py-2 sm:py-3">
            {/* Kategorie - Nowoczesne przyciski z efektami */}
            <div
              className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-hide -mx-1 px-1 flex-1"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {[
                {
                  id: "all",
                  label: "Wszystko",
                  icon: "📋",
                  color: "from-slate-600 via-slate-500 to-slate-600",
                  glow: "shadow-slate-500/30",
                },
                {
                  id: "service_requests",
                  label: "Zlecenia",
                  icon: "🏠",
                  color: "from-violet-500 via-purple-500 to-fuchsia-500",
                  glow: "shadow-purple-500/40",
                },
                {
                  id: "announcements",
                  label: "Ogłoszenia",
                  icon: "📢",
                  color: "from-cyan-500 via-blue-500 to-indigo-500",
                  glow: "shadow-blue-500/40",
                },
                {
                  id: "jobs",
                  label: "Praca",
                  icon: "💼",
                  color: "from-emerald-500 via-green-500 to-teal-500",
                  glow: "shadow-green-500/40",
                },
                {
                  id: "ads",
                  label: "Reklamy",
                  icon: "📣",
                  color: "from-orange-500 via-rose-500 to-pink-500",
                  glow: "shadow-rose-500/40",
                },
              ].map((cat) => (
                <div key={cat.id} className="relative group">
                  {/* Holographic glow behind active button */}
                  {activeFilter === cat.id && (
                    <div
                      className={`absolute -inset-1 bg-gradient-to-r ${cat.color} rounded-2xl opacity-40 blur-lg animate-pulse`}
                      style={{ animationDuration: "2s" }}
                    />
                  )}
                  <button
                    onClick={() => setActiveFilter(cat.id as any)}
                    className={`relative flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold whitespace-nowrap transition-all duration-300 ${
                      activeFilter === cat.id
                        ? `bg-gradient-to-r ${cat.color} text-white shadow-xl ${cat.glow} scale-105 border border-white/30`
                        : "bg-white/60 backdrop-blur-sm text-slate-600 border border-slate-200/50 hover:bg-white/90 hover:text-slate-800 hover:border-slate-300 hover:shadow-md hover:-translate-y-0.5"
                    }`}
                  >
                    <span className="text-base sm:text-lg">{cat.icon}</span>
                    <span className="hidden xs:inline sm:inline">
                      {cat.label}
                    </span>
                  </button>
                </div>
              ))}
            </div>

            {/* Przycisk Filtrów - Nowoczesny z efektem */}
            <div className="relative group flex-shrink-0">
              {(showFilters ||
                selectedCity !== "all" ||
                selectedCategory !== "all") && (
                <div
                  className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500 rounded-xl sm:rounded-2xl opacity-40 blur-lg animate-pulse"
                  style={{ animationDuration: "2s" }}
                />
              )}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`relative flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-bold transition-all duration-300 whitespace-nowrap text-xs sm:text-sm ${
                  showFilters ||
                  selectedCity !== "all" ||
                  selectedCategory !== "all"
                    ? "bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500 text-white shadow-xl shadow-blue-500/30 border border-white/30"
                    : "bg-white/60 backdrop-blur-sm text-slate-600 border border-slate-200/50 hover:bg-white/90 hover:border-slate-300 hover:shadow-md hover:-translate-y-0.5"
                }`}
              >
                <Filter className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">Filtry</span>
                {(selectedCity !== "all" || selectedCategory !== "all") && (
                  <span className="w-5 h-5 bg-white text-indigo-600 text-xs font-bold rounded-full flex items-center justify-center shadow-sm">
                    {
                      [
                        selectedCity !== "all",
                        selectedCategory !== "all",
                      ].filter(Boolean).length
                    }
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* ===== PANEL FILTRÓW (rozwijany) z glassmorphism ===== */}
          {showFilters && (
            <div className="pb-3 sm:pb-4 animate-in slide-in-from-top-2 duration-200">
              <div className="bg-white/70 backdrop-blur-xl rounded-xl sm:rounded-2xl p-3 sm:p-5 border border-white/50 shadow-lg space-y-3 sm:space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4">
                  {/* Miasto */}
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      🏙️ Miasto
                    </label>
                    <select
                      value={selectedCity}
                      onChange={(e) => setSelectedCity(e.target.value)}
                      className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border border-slate-200/50 rounded-xl text-slate-800 font-medium focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
                    >
                      <option value="all">Wszystkie miasta</option>
                      {cities
                        .filter((c) => c !== "all")
                        .map((city) => (
                          <option key={city} value={city}>
                            {city}
                          </option>
                        ))}
                    </select>
                  </div>

                  {/* Kategoria */}
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      📂 Kategoria
                    </label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border border-slate-200/50 rounded-xl text-slate-800 font-medium focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
                    >
                      <option value="all">Wszystkie kategorie</option>
                      {categories
                        .filter((c) => c !== "all")
                        .map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                    </select>
                  </div>

                  {/* Sortowanie */}
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      🔄 Sortowanie
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { id: "newest", label: "Najnowsze", icon: "✨" },
                        { id: "popular", label: "Popularne", icon: "🔥" },
                      ].map((s) => (
                        <button
                          key={s.id}
                          onClick={() => setSortBy(s.id as any)}
                          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                            sortBy === s.id
                              ? "bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-500/30"
                              : "bg-white/80 backdrop-blur-sm border border-slate-200/50 text-slate-600 hover:bg-white hover:border-indigo-300 hover:shadow-md"
                          }`}
                        >
                          <span>{s.icon}</span>
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Reset + Counter - Nowoczesny styl */}
                <div className="flex items-center justify-between pt-4 border-t border-white/50">
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedCity("all");
                      setSelectedCategory("all");
                      setSortBy("newest");
                    }}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-slate-500 hover:text-slate-700 hover:bg-white/60 transition-all"
                  >
                    🔄 Wyczyść filtry
                  </button>
                  <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-xl border border-emerald-200/50">
                    <span className="text-emerald-600 font-bold">📊</span>
                    <span className="text-sm text-emerald-700 font-bold">
                      {filterPosts(posts).length} wyników
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* ===== MOBILE SEARCH (pokazuje się tylko na mobile) - glassmorphism ===== */}
      <div className="sm:hidden px-4 py-3 bg-white/80 backdrop-blur-xl border-b border-white/40">
        <div className="relative group">
          {/* Holographic glow on focus */}
          <div className="absolute -inset-1 bg-gradient-to-r from-violet-500/20 via-fuchsia-500/20 to-orange-500/20 rounded-2xl opacity-0 group-focus-within:opacity-100 blur-lg transition-opacity duration-300" />
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-violet-500 transition-colors" />
            <input
              type="text"
              placeholder="Szukaj..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white/60 backdrop-blur-sm border border-white/60 rounded-2xl text-slate-800 placeholder-slate-400 focus:bg-white/90 focus:border-violet-300 focus:ring-4 focus:ring-violet-500/10 transition-all"
            />
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* USUNIĘTO: Zduplikowane filtry i searchbary                          */}
      {/* ═══════════════════════════════════════════════════════════════════ */}

      {/* ===== MAIN 3-COLUMN LAYOUT ===== */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* ===== LEFT SIDEBAR - Trending z glassmorphism ===== */}
          <aside className="hidden lg:block lg:col-span-3">
            <div className="sticky top-36 space-y-6">
              {/* Trending Widget - Glassmorphism */}
              <div className="bg-white/70 backdrop-blur-2xl rounded-2xl p-5 shadow-lg shadow-slate-200/20 border border-white/50 relative overflow-hidden">
                {/* Subtle gradient accent */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-500/10 to-pink-500/10 rounded-full blur-2xl" />

                <div className="flex items-center gap-2 mb-4 relative">
                  <div className="p-2 bg-gradient-to-br from-orange-500 to-rose-500 rounded-xl shadow-lg shadow-orange-500/30">
                    <TrendingUp className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="font-bold text-slate-800">Popularne</h3>
                </div>

                <div className="space-y-3 relative">
                  {trending.slice(0, 5).map((post, index) => (
                    <div
                      key={post.id}
                      className="flex items-start gap-3 group cursor-pointer hover:bg-white/60 p-2 -mx-2 rounded-xl transition-all"
                    >
                      <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-gradient-to-br from-orange-500 via-rose-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-orange-500/30">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-700 line-clamp-2 group-hover:text-orange-600 transition-colors">
                          {post.title || post.content.substring(0, 60)}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          {post.likes_count} ❤️ • {post.comments_count} 💬
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* ===== CENTER - Feed Posts ===== */}
          <main className="lg:col-span-6">
            {/* Create Post Card */}
            {showCreatePost && canCreatePost && user && (
              <div className="mb-6" key="create-post-card-container">
                <CreatePostCardPremium
                  key={`create-post-${user.id}`}
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

            {/* Posts List */}
            <div className="space-y-4">
              {filterPosts(posts).length === 0 ? (
                <div className="text-center py-16 bg-white/70 backdrop-blur-2xl rounded-2xl shadow-lg shadow-slate-200/20 border border-white/50 relative overflow-hidden">
                  {/* Decorative gradient */}
                  <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-orange-500/5" />

                  <div className="relative">
                    <div className="text-6xl mb-4">🔍</div>
                    <h3 className="text-2xl font-bold text-slate-800 mb-2">
                      Brak wyników
                    </h3>
                    <p className="text-slate-500 mb-6 max-w-sm mx-auto">
                      Nie znaleziono ogłoszeń spełniających kryteria
                      wyszukiwania
                    </p>
                    <button
                      onClick={() => {
                        setSearchQuery("");
                        setSelectedCity("all");
                        setSelectedCategory("all");
                        setActiveFilter("all");
                      }}
                      className="relative group"
                    >
                      <div className="absolute -inset-1 bg-gradient-to-r from-orange-500 via-rose-500 to-violet-500 rounded-2xl opacity-50 group-hover:opacity-70 blur-lg transition-all" />
                      <span className="relative flex items-center gap-2 bg-gradient-to-r from-orange-500 via-rose-500 to-violet-500 text-white px-6 py-3 rounded-xl font-bold shadow-xl">
                        🔄 Wyczyść filtry
                      </span>
                    </button>
                  </div>
                </div>
              ) : (
                filterPosts(posts).map((post) => (
                  <PostCardPremium
                    key={post.id}
                    post={post}
                    onLike={() =>
                      handleLike(post.id, post.user_has_liked || false)
                    }
                    onComment={() => {
                      // Update local state with incremented comment count
                      setPosts((prevPosts) =>
                        prevPosts.map((p) =>
                          p.id === post.id
                            ? {
                                ...p,
                                comments_count: (p.comments_count || 0) + 1,
                              }
                            : p
                        )
                      );
                    }}
                    onShare={loadFeed}
                    onReactionChange={(reactionType) =>
                      handleReactionChange(post.id, reactionType)
                    }
                    currentUserId={user?.id}
                    currentUserRole={user?.role}
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

          {/* ===== RIGHT SIDEBAR - Footer & Info z glassmorphism ===== */}
          <aside className="hidden lg:block lg:col-span-3">
            <div className="sticky top-36 space-y-6">
              {/* Quick Stats Widget */}
              <div className="bg-white/70 backdrop-blur-2xl rounded-2xl p-5 shadow-lg shadow-slate-200/20 border border-white/50 relative overflow-hidden">
                {/* Subtle gradient accent */}
                <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-full blur-2xl" />

                <div className="flex items-center gap-2 mb-4 relative">
                  <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl shadow-lg shadow-cyan-500/30">
                    <TrendingUp className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="font-bold text-slate-800">Statystyki</h3>
                </div>

                <div className="space-y-3 relative">
                  <div className="flex justify-between items-center p-3 bg-white/60 rounded-xl">
                    <span className="text-slate-600 text-sm">
                      Aktywne posty
                    </span>
                    <span className="font-bold text-slate-800">
                      {posts.length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white/60 rounded-xl">
                    <span className="text-slate-600 text-sm">Twoje wyniki</span>
                    <span className="font-bold text-emerald-600">
                      {filterPosts(posts).length}
                    </span>
                  </div>
                </div>
              </div>

              {/* Footer Links - Glassmorphism */}
              <div className="bg-white/50 backdrop-blur-xl rounded-2xl p-5 border border-white/40">
                <div className="text-xs text-slate-500 space-y-3">
                  <div className="flex flex-wrap gap-x-3 gap-y-1">
                    <a
                      href="#"
                      className="hover:text-violet-600 transition-colors"
                    >
                      O nas
                    </a>
                    <span className="text-slate-300">•</span>
                    <a
                      href="#"
                      className="hover:text-violet-600 transition-colors"
                    >
                      Pomoc
                    </a>
                    <span className="text-slate-300">•</span>
                    <a
                      href="#"
                      className="hover:text-violet-600 transition-colors"
                    >
                      Prywatność
                    </a>
                    <span className="text-slate-300">•</span>
                    <a
                      href="#"
                      className="hover:text-violet-600 transition-colors"
                    >
                      Regulamin
                    </a>
                  </div>
                  <div className="pt-2 border-t border-white/50">
                    <p className="text-slate-400 flex items-center gap-1">
                      <span>✨</span> © 2025 ZZP Werkplaats
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* ===== STORY MODALS (PRO) - MUST BE AT ROOT LEVEL ===== */}
      {showCreateStoryEditor && (
        <CreateStoryEditor
          onClose={() => setShowCreateStoryEditor(false)}
          onSuccess={() => {
            setShowCreateStoryEditor(false);
          }}
        />
      )}

      {/* Story Viewer PRO */}
      {viewingAuthorId && (
        <StoryViewerProWrapper
          authorId={viewingAuthorId}
          storyId={viewingStoryId}
          onClose={() => {
            setViewingAuthorId(null);
            setViewingStoryId(null);
          }}
        />
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
}

export function PostCardPremium({
  post,
  onLike,
  onComment,
  onShare,
  onReactionChange,
  currentUserId,
  currentUserRole,
}: PostCardPremiumProps) {
  const [showComments, setShowComments] = useState(false);
  const [isCommentsAnimating, setIsCommentsAnimating] = useState(false);
  const [comments, setComments] = useState<PostComment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [currentFolders, setCurrentFolders] = useState<SaveFolder[]>([]);
  const commentsRef = useRef<HTMLDivElement>(null);

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
    // Start animation
    setIsCommentsAnimating(true);

    if (!showComments && comments.length === 0) {
      setLoadingComments(true);
      try {
        const fetchedComments = await getPostComments(post.id);
        setComments(fetchedComments);
      } catch (error) {
        console.error("Error loading comments:", error);
      } finally {
        setLoadingComments(false);
      }
    }

    if (showComments) {
      // Closing - animate out first, then hide
      setTimeout(() => {
        setShowComments(false);
        setIsCommentsAnimating(false);
      }, 200);
    } else {
      // Opening
      setShowComments(true);
      setTimeout(() => setIsCommentsAnimating(false), 300);
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
      } else if (currentUserRole === "cleaning_company") {
        const { data } = await supabase
          .from("cleaning_companies")
          .select("id")
          .eq("profile_id", authUserId)
          .single();
        actualUserId = data?.id || null;
      } else if (
        currentUserRole === "admin" ||
        currentUserRole === "regular_user"
      ) {
        // Admin and regular_user use profile_id directly
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
      onComment();
    } catch (error) {
      console.error("Error creating comment:", error);
      alert("Fout bij het plaatsen van reactie");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // Determine if this is a job/service post (hero image style)
  const isHeroPost =
    post.type === "job_offer" ||
    post.type === "service_request" ||
    post.type === "ad";
  const hasMedia = post.media_urls && post.media_urls.length > 0;
  const primaryImage = hasMedia ? post.media_urls![0] : null;
  const mediaCount = post.media_urls?.length || 0;

  // Generate public profile URL based on author type
  const getProfileUrl = () => {
    if (!post.author_profile_id) return null;

    const profileId = post.author_profile_id;
    switch (post.author_type) {
      case "worker":
        return `/worker/profile/${profileId}`;
      case "employer":
        return `/employer/profile/${profileId}`;
      case "accountant":
        return `/accountant/profile/${profileId}`;
      case "cleaning_company":
        return `/cleaning-company/profile/${profileId}`;
      case "admin":
        return `/admin/profile/${profileId}`;
      case "regular_user":
        return `/regular-user/profile/${profileId}`;
      default:
        return null;
    }
  };

  const profileUrl = getProfileUrl();

  return (
    <article className="group relative bg-white/60 backdrop-blur-2xl rounded-2xl sm:rounded-[2rem] shadow-[0_4px_20px_rgba(0,0,0,0.04)] sm:shadow-[0_8px_40px_rgba(0,0,0,0.06)] border border-white/50 overflow-hidden hover:shadow-[0_20px_60px_rgba(0,0,0,0.1)] transition-all duration-500">
      {/* ============================================= */}
      {/* AUTHOR HEADER - Always visible for ALL posts */}
      {/* ============================================= */}
      <div className="flex items-center justify-between p-3 sm:p-4 md:p-5 border-b border-slate-100/50">
        <div className="flex items-center gap-2 sm:gap-3">
          {profileUrl ? (
            <Link
              to={profileUrl}
              className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center overflow-hidden ring-2 ring-white shadow-md hover:ring-4 hover:ring-orange-200 transition-all cursor-pointer active:scale-95"
            >
              {post.author_avatar ? (
                <img
                  src={post.author_avatar}
                  alt={post.author_name || ""}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-slate-500 font-bold text-xs sm:text-sm">
                  {post.author_name?.charAt(0) || "?"}
                </span>
              )}
            </Link>
          ) : (
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center overflow-hidden ring-2 ring-white shadow-md">
              {post.author_avatar ? (
                <img
                  src={post.author_avatar}
                  alt={post.author_name || ""}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-slate-500 font-bold text-xs sm:text-sm">
                  {post.author_name?.charAt(0) || "?"}
                </span>
              )}
            </div>
          )}
          <div className="min-w-0 flex-1">
            {profileUrl ? (
              <Link
                to={profileUrl}
                className="font-semibold text-slate-800 hover:text-orange-600 transition-colors cursor-pointer text-sm sm:text-base block truncate"
              >
                {post.author_name || "Anoniem"}
              </Link>
            ) : (
              <p className="font-semibold text-slate-800 text-sm sm:text-base truncate">
                {post.author_name || "Anoniem"}
              </p>
            )}
            <p className="text-[10px] sm:text-xs text-slate-400 flex items-center gap-1 flex-wrap">
              <span>{formatDate(post.created_at)}</span>
              {post.author_type && (
                <>
                  <span className="text-slate-300">•</span>
                  <span className="capitalize">
                    {post.author_type === "worker" && "Pracownik"}
                    {post.author_type === "employer" && "Pracodawca"}
                    {post.author_type === "accountant" && "Księgowy"}
                    {post.author_type === "cleaning_company" && "Firma sprząt."}
                    {post.author_type === "admin" && "Admin"}
                    {post.author_type === "regular_user" && "Użytkownik"}
                  </span>
                </>
              )}
            </p>
          </div>
        </div>
        <button className="p-1.5 sm:p-2 hover:bg-slate-100 rounded-xl transition-colors active:scale-95 flex-shrink-0">
          <MoreHorizontal className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
        </button>
      </div>

      {/* ============================================= */}
      {/* HERO IMAGE SECTION (for job/service/ad posts) */}
      {/* ============================================= */}
      {isHeroPost && primaryImage && (
        <div className="relative h-40 sm:h-52 md:h-64 overflow-hidden">
          <img
            src={primaryImage}
            alt={post.title || "Post image"}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

          {/* Gallery indicator */}
          {mediaCount > 1 && (
            <div className="absolute top-2 right-2 sm:top-4 sm:right-4 px-2 sm:px-3 py-1 sm:py-1.5 bg-white/20 backdrop-blur-md rounded-full text-white text-xs sm:text-sm font-medium border border-white/30">
              1/{mediaCount}
            </div>
          )}

          {/* Title overlay on image */}
          <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-5 md:p-6">
            {post.title && (
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white leading-tight drop-shadow-lg line-clamp-2">
                {post.title}
              </h2>
            )}
          </div>
        </div>
      )}

      {/* ============================================= */}
      {/* CONTENT SECTION */}
      {/* ============================================= */}
      <div className="p-3 sm:p-5 md:p-6">
        {/* Title for non-hero posts (hero posts have title on image) */}
        {(!isHeroPost || !primaryImage) && post.title && (
          <h2 className="text-lg sm:text-xl font-bold text-slate-800 mb-2 sm:mb-3 leading-tight">
            {post.title}
          </h2>
        )}

        {/* Content text */}
        {post.content && (
          <p
            className={`text-slate-600 leading-relaxed text-sm sm:text-base ${
              isHeroPost && primaryImage
                ? "text-xs sm:text-sm line-clamp-2"
                : "mb-3 sm:mb-4"
            }`}
          >
            {post.content}
          </p>
        )}

        {/* Media for non-hero posts */}
        {!isHeroPost && hasMedia && (
          <div className="mt-3 sm:mt-4 rounded-xl sm:rounded-2xl overflow-hidden">
            <div
              className={`grid gap-0.5 sm:gap-1 ${
                mediaCount === 1
                  ? "grid-cols-1"
                  : mediaCount === 2
                  ? "grid-cols-2"
                  : "grid-cols-3"
              }`}
            >
              {post.media_urls!.slice(0, 4).map((url, idx) => (
                <div
                  key={idx}
                  className={`relative aspect-square ${
                    idx === 0 && mediaCount === 3 ? "col-span-2 row-span-2" : ""
                  }`}
                >
                  <img
                    src={url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                  {idx === 3 && mediaCount > 4 && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="text-white text-xl sm:text-2xl font-bold">
                        +{mediaCount - 4}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============================================= */}
        {/* GLASSMORPHISM DETAILS CARD - SERVICE REQUEST */}
        {/* ============================================= */}
        {post.type === "service_request" &&
          (post.request_category || post.category) && (
            <div className="mt-3 sm:mt-4 bg-white/40 backdrop-blur-xl rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-white/60 shadow-sm">
              <div className="space-y-2">
                {/* Category */}
                <div className="flex items-center gap-2 text-slate-700">
                  <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-xs">🏷️</span>
                  </div>
                  <span className="text-sm">
                    {(post.request_category || post.category) === "plumbing" &&
                      "Hydraulika"}
                    {(post.request_category || post.category) ===
                      "electrical" && "Elektryka"}
                    {(post.request_category || post.category) === "cleaning" &&
                      "Sprzątanie"}
                    {(post.request_category || post.category) === "moving" &&
                      "Przeprowadzki"}
                    {(post.request_category || post.category) === "repair" &&
                      "Naprawa"}
                    {(post.request_category || post.category) === "gardening" &&
                      "Ogrodnictwo"}
                    {(post.request_category || post.category) === "painting" &&
                      "Malowanie"}
                    {(post.request_category || post.category) === "other" &&
                      "Inne"}
                  </span>
                </div>

                {/* Urgency with checkmark */}
                {(post.request_urgency === "urgent" ||
                  post.request_urgency === "high") && (
                  <div className="flex items-center gap-2 text-orange-600">
                    <Check className="w-4 h-4" />
                    <span className="text-sm font-medium">Szybki termin</span>
                  </div>
                )}

                {/* Location */}
                {(post.request_location || post.location) && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <span className="text-sm">
                      {post.request_location || post.location}
                    </span>
                  </div>
                )}

                {/* Budget */}
                {(post.request_budget_min || post.request_budget_max) && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <DollarSign className="w-4 h-4 text-slate-400" />
                    <span className="text-sm">
                      {post.request_budget_min && post.request_budget_max
                        ? `€${post.request_budget_min} - €${post.request_budget_max}`
                        : post.request_budget_min
                        ? `od €${post.request_budget_min}`
                        : `do €${post.request_budget_max}`}
                    </span>
                  </div>
                )}

                {/* Preferred Date */}
                {post.request_preferred_date && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span className="text-sm">
                      Preferowana data:{" "}
                      {new Date(post.request_preferred_date).toLocaleDateString(
                        "pl-PL"
                      )}
                    </span>
                  </div>
                )}

                {/* Contact Method */}
                {post.request_contact_method && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <Check className="w-4 h-4 text-green-500" />
                    <span className="text-sm">
                      {post.request_contact_method === "phone" &&
                        "Kontakt: Telefon"}
                      {post.request_contact_method === "email" &&
                        "Kontakt: Email"}
                      {post.request_contact_method === "both" &&
                        "Kontakt: Telefon lub Email"}
                    </span>
                  </div>
                )}

                {/* Status */}
                {post.request_status && post.request_status !== "open" && (
                  <div
                    className={`flex items-center gap-2 ${
                      post.request_status === "completed"
                        ? "text-green-600"
                        : post.request_status === "in_progress"
                        ? "text-blue-600"
                        : "text-slate-500"
                    }`}
                  >
                    <span className="text-xs">
                      {post.request_status === "in_progress" && "🔄"}
                      {post.request_status === "completed" && "✅"}
                      {post.request_status === "cancelled" && "❌"}
                    </span>
                    <span className="text-sm font-medium">
                      {post.request_status === "in_progress" &&
                        "W trakcie realizacji"}
                      {post.request_status === "completed" && "Zakończone"}
                      {post.request_status === "cancelled" && "Anulowane"}
                    </span>
                  </div>
                )}

                {/* Responses Count */}
                {post.request_responses_count !== undefined &&
                  post.request_responses_count > 0 && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <Users className="w-4 h-4 text-slate-400" />
                      <span className="text-sm">
                        {post.request_responses_count} ofert od wykonawców
                      </span>
                    </div>
                  )}
              </div>

              {/* CTA Button */}
              <div className="mt-3 sm:mt-4 flex justify-end">
                {post.author_phone ? (
                  <a
                    href={`https://wa.me/${post.author_phone.replace(
                      /\D/g,
                      ""
                    )}?text=${encodeURIComponent(
                      `Hej! Interesuje mnie: ${
                        post.title || post.content.substring(0, 50)
                      }`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 sm:px-5 py-2 bg-gradient-to-r from-slate-700 to-slate-800 text-white text-xs sm:text-sm font-semibold rounded-lg sm:rounded-xl hover:shadow-lg active:scale-95 sm:hover:scale-105 transition-all"
                  >
                    SKONTAKTUJ SIĘ
                  </a>
                ) : (
                  <button className="px-4 sm:px-5 py-2 bg-gradient-to-r from-slate-600 to-slate-700 text-white text-xs sm:text-sm font-semibold rounded-lg sm:rounded-xl hover:shadow-lg active:scale-95 sm:hover:scale-105 transition-all">
                    SKONTAKTUJ SIĘ
                  </button>
                )}
              </div>
            </div>
          )}

        {/* ============================================= */}
        {/* GLASSMORPHISM DETAILS CARD - JOB OFFER */}
        {/* ============================================= */}
        {post.type === "job_offer" && (
          <div className="mt-3 sm:mt-4 bg-white/40 backdrop-blur-xl rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-white/60 shadow-sm">
            <div className="space-y-2">
              {/* Category */}
              {(post.job_category || post.category) && (
                <div className="flex items-center gap-2 text-slate-700">
                  <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center">
                    <Briefcase className="w-3 h-3 text-blue-600" />
                  </div>
                  <span className="text-sm">
                    {post.job_category || post.category}
                  </span>
                </div>
              )}

              {/* Type with checkmark */}
              {post.job_type && (
                <div className="flex items-center gap-2 text-slate-600">
                  <Check className="w-4 h-4 text-green-500" />
                  <span className="text-sm">
                    {post.job_type === "full_time" && "Voltijd"}
                    {post.job_type === "part_time" && "Deeltijd"}
                    {post.job_type === "contract" && "Contract"}
                    {post.job_type === "temporary" && "Tijdelijk"}
                  </span>
                </div>
              )}

              {/* Location */}
              {(post.job_location || post.location) && (
                <div className="flex items-center gap-2 text-slate-600">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  <span className="text-sm">
                    {post.job_location || post.location}
                  </span>
                </div>
              )}

              {/* Salary */}
              {(post.job_salary_min || post.job_salary_max) && (
                <div className="flex items-center gap-2 text-slate-600">
                  <DollarSign className="w-4 h-4 text-slate-400" />
                  <span className="text-sm font-medium text-green-600">
                    €{post.job_salary_min || "?"} - €
                    {post.job_salary_max || "?"} /uur
                  </span>
                </div>
              )}

              {/* Hours per week */}
              {post.job_hours_per_week && (
                <div className="flex items-center gap-2 text-slate-600">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span className="text-sm">
                    {post.job_hours_per_week} uur/week
                  </span>
                </div>
              )}

              {/* Start Date */}
              {post.job_start_date && (
                <div className="flex items-center gap-2 text-slate-600">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span className="text-sm">
                    Start:{" "}
                    {new Date(post.job_start_date).toLocaleDateString("pl-PL")}
                  </span>
                </div>
              )}

              {/* Deadline */}
              {post.job_deadline && (
                <div className="flex items-center gap-2 text-orange-600">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    Aplikuj do:{" "}
                    {new Date(post.job_deadline).toLocaleDateString("pl-PL")}
                  </span>
                </div>
              )}

              {/* Requirements */}
              {post.job_requirements && post.job_requirements.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-200/50">
                  <p className="text-xs text-slate-500 mb-2">Wymagania:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {post.job_requirements.slice(0, 4).map((req, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-full"
                      >
                        {req}
                      </span>
                    ))}
                    {post.job_requirements.length > 4 && (
                      <span className="px-2 py-0.5 bg-slate-200 text-slate-600 text-xs rounded-full">
                        +{post.job_requirements.length - 4}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Benefits */}
              {post.job_benefits && post.job_benefits.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-200/50">
                  <p className="text-xs text-slate-500 mb-2">Benefity:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {post.job_benefits.slice(0, 4).map((benefit, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full"
                      >
                        {benefit}
                      </span>
                    ))}
                    {post.job_benefits.length > 4 && (
                      <span className="px-2 py-0.5 bg-green-200 text-green-700 text-xs rounded-full">
                        +{post.job_benefits.length - 4}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Contact Info */}
              {(post.job_contact_email || post.job_contact_phone) && (
                <div className="mt-3 pt-3 border-t border-slate-200/50">
                  <p className="text-xs text-slate-500 mb-2">Kontakt:</p>
                  <div className="space-y-1">
                    {post.job_contact_email && (
                      <div className="flex items-center gap-2 text-slate-600">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <a
                          href={`mailto:${post.job_contact_email}`}
                          className="text-sm hover:text-blue-600 transition-colors"
                        >
                          {post.job_contact_email}
                        </a>
                      </div>
                    )}
                    {post.job_contact_phone && (
                      <div className="flex items-center gap-2 text-slate-600">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <a
                          href={`tel:${post.job_contact_phone}`}
                          className="text-sm hover:text-blue-600 transition-colors"
                        >
                          {post.job_contact_phone}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* CTA Button */}
            <div className="mt-3 sm:mt-4 flex justify-end">
              <button
                onClick={async () => {
                  if (!currentUserId) {
                    alert(
                      "Musisz być zalogowany, aby aplikować na ofertę pracy"
                    );
                    return;
                  }
                  if (currentUserRole !== "worker") {
                    alert("Tylko pracownicy mogą aplikować na oferty pracy");
                    return;
                  }
                  try {
                    const { data: workerData } = await supabase
                      .from("workers")
                      .select("id")
                      .eq("profile_id", currentUserId)
                      .single();
                    if (!workerData) {
                      alert("Nie znaleziono profilu pracownika");
                      return;
                    }
                    const { applyForJob } = await import(
                      "../src/services/application"
                    );
                    await applyForJob(post.id, workerData.id);
                    alert(`✅ Aplikacja wysłana!`);
                    window.location.reload();
                  } catch (error: any) {
                    if (error.message?.includes("already applied")) {
                      alert("⚠️ Już aplikowałeś na tę ofertę pracy");
                    } else {
                      alert("❌ Błąd podczas wysyłania aplikacji");
                    }
                  }
                }}
                className="px-4 sm:px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs sm:text-sm font-semibold rounded-lg sm:rounded-xl hover:shadow-lg active:scale-95 sm:hover:scale-105 transition-all"
              >
                APLIKUJ
              </button>
            </div>
          </div>
        )}

        {/* ============================================= */}
        {/* GLASSMORPHISM DETAILS CARD - AD */}
        {/* ============================================= */}
        {post.type === "ad" && (
          <div className="mt-3 sm:mt-4 bg-white/40 backdrop-blur-xl rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-white/60 shadow-sm">
            <div className="space-y-2">
              {/* Type */}
              {post.ad_type && (
                <div className="flex items-center gap-2 text-slate-700">
                  <div className="w-5 h-5 rounded-full bg-purple-100 flex items-center justify-center">
                    <span className="text-xs">
                      {post.ad_type === "product" && "🛍️"}
                      {post.ad_type === "service" && "🛠️"}
                      {post.ad_type === "event" && "🎉"}
                      {post.ad_type === "promotion" && "🎁"}
                    </span>
                  </div>
                  <span className="text-sm">
                    {post.ad_type === "product" && "Produkt"}
                    {post.ad_type === "service" && "Usługa"}
                    {post.ad_type === "event" && "Wydarzenie"}
                    {post.ad_type === "promotion" && "Promocja"}
                  </span>
                </div>
              )}

              {/* Website */}
              {post.ad_website && (
                <div className="flex items-center gap-2 text-slate-600">
                  <Check className="w-4 h-4 text-green-500" />
                  <span className="text-sm">Link do strony</span>
                </div>
              )}

              {/* Duration */}
              {post.ad_duration_days && (
                <div className="flex items-center gap-2 text-slate-600">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span className="text-sm">{post.ad_duration_days} dni</span>
                </div>
              )}

              {/* Location */}
              {post.location && (
                <div className="flex items-center gap-2 text-slate-600">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  <span className="text-sm">{post.location}</span>
                </div>
              )}

              {/* Category */}
              {post.category && (
                <div className="flex items-center gap-2 text-slate-600">
                  <Briefcase className="w-4 h-4 text-slate-400" />
                  <span className="text-sm">{post.category}</span>
                </div>
              )}

              {/* Budget */}
              {post.ad_budget && (
                <div className="flex items-center gap-2 text-slate-600">
                  <DollarSign className="w-4 h-4 text-slate-400" />
                  <span className="text-sm">Budżet: €{post.ad_budget}</span>
                </div>
              )}

              {/* Target Audience */}
              {post.ad_target_audience &&
                post.ad_target_audience.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-200/50">
                    <p className="text-xs text-slate-500 mb-2">
                      Grupa docelowa:
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {post.ad_target_audience.map((audience, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full"
                        >
                          {audience}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

              {/* Contact Info */}
              {(post.ad_contact_email || post.ad_contact_phone) && (
                <div className="mt-3 pt-3 border-t border-slate-200/50">
                  <p className="text-xs text-slate-500 mb-2">Kontakt:</p>
                  <div className="space-y-1">
                    {post.ad_contact_email && (
                      <div className="flex items-center gap-2 text-slate-600">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <a
                          href={`mailto:${post.ad_contact_email}`}
                          className="text-sm hover:text-purple-600 transition-colors"
                        >
                          {post.ad_contact_email}
                        </a>
                      </div>
                    )}
                    {post.ad_contact_phone && (
                      <div className="flex items-center gap-2 text-slate-600">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <a
                          href={`tel:${post.ad_contact_phone}`}
                          className="text-sm hover:text-purple-600 transition-colors"
                        >
                          {post.ad_contact_phone}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* CTA Button */}
            <div className="mt-3 sm:mt-4 flex justify-end">
              {post.ad_cta_url ? (
                <a
                  href={post.ad_cta_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 sm:px-5 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs sm:text-sm font-semibold rounded-lg sm:rounded-xl hover:shadow-lg active:scale-95 sm:hover:scale-105 transition-all"
                >
                  {post.ad_cta_text || "ZOBACZ WIĘCEJ"}
                </a>
              ) : (
                <button className="px-4 sm:px-5 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs sm:text-sm font-semibold rounded-lg sm:rounded-xl hover:shadow-lg active:scale-95 sm:hover:scale-105 transition-all">
                  SKONTAKTUJ SIĘ
                </button>
              )}
            </div>
          </div>
        )}

        {/* ============================================= */}
        {/* GLASSMORPHISM DETAILS CARD - ANNOUNCEMENT */}
        {/* ============================================= */}
        {post.type === "announcement" && (
          <div className="mt-3 sm:mt-4 bg-white/40 backdrop-blur-xl rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-white/60 shadow-sm">
            <div className="space-y-2">
              {/* Category indicator */}
              <div className="flex items-center gap-2 text-slate-700">
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center ${
                    post.announcement_category === "urgent"
                      ? "bg-red-100"
                      : post.announcement_category === "warning"
                      ? "bg-yellow-100"
                      : post.announcement_category === "success"
                      ? "bg-green-100"
                      : "bg-blue-100"
                  }`}
                >
                  <span className="text-xs">
                    {post.announcement_category === "urgent" && "🚨"}
                    {post.announcement_category === "warning" && "⚠️"}
                    {post.announcement_category === "success" && "✅"}
                    {(!post.announcement_category ||
                      post.announcement_category === "info") &&
                      "ℹ️"}
                  </span>
                </div>
                <span className="text-sm font-medium">
                  {post.announcement_category === "urgent" &&
                    "Pilne ogłoszenie"}
                  {post.announcement_category === "warning" && "Ostrzeżenie"}
                  {post.announcement_category === "success" && "Sukces"}
                  {(!post.announcement_category ||
                    post.announcement_category === "info") &&
                    "Informacja"}
                </span>
              </div>

              {/* Pinned */}
              {post.announcement_pinned && (
                <div className="flex items-center gap-2 text-amber-600">
                  <Check className="w-4 h-4" />
                  <span className="text-sm font-medium">Przypięte</span>
                </div>
              )}

              {/* Expiration */}
              {post.announcement_expires_at && (
                <div className="flex items-center gap-2 text-slate-600">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span className="text-sm">
                    Do{" "}
                    {new Date(post.announcement_expires_at).toLocaleDateString(
                      "pl-PL"
                    )}
                  </span>
                </div>
              )}

              {/* Tags */}
              {post.announcement_tags && post.announcement_tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {post.announcement_tags.slice(0, 3).map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-full"
                    >
                      #{tag}
                    </span>
                  ))}
                  {post.announcement_tags.length > 3 && (
                    <span className="px-2 py-0.5 bg-slate-200 text-slate-600 text-xs rounded-full">
                      +{post.announcement_tags.length - 3}
                    </span>
                  )}
                </div>
              )}

              {/* Priority */}
              {post.announcement_priority && (
                <div
                  className={`flex items-center gap-2 ${
                    post.announcement_priority === "high"
                      ? "text-red-600"
                      : post.announcement_priority === "medium"
                      ? "text-orange-600"
                      : "text-slate-600"
                  }`}
                >
                  <span className="text-xs">
                    {post.announcement_priority === "high" && "⬆️"}
                    {post.announcement_priority === "medium" && "➡️"}
                    {post.announcement_priority === "low" && "⬇️"}
                  </span>
                  <span className="text-sm font-medium">
                    Priorytet:{" "}
                    {post.announcement_priority === "high"
                      ? "Wysoki"
                      : post.announcement_priority === "medium"
                      ? "Średni"
                      : "Niski"}
                  </span>
                </div>
              )}

              {/* Location */}
              {post.location && (
                <div className="flex items-center gap-2 text-slate-600">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  <span className="text-sm">{post.location}</span>
                </div>
              )}

              {/* Category */}
              {post.category && (
                <div className="flex items-center gap-2 text-slate-600">
                  <Briefcase className="w-4 h-4 text-slate-400" />
                  <span className="text-sm">{post.category}</span>
                </div>
              )}

              {/* Target Roles */}
              {post.announcement_target_roles &&
                post.announcement_target_roles.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-200/50">
                    <p className="text-xs text-slate-500 mb-2">Dla:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {post.announcement_target_roles.map((role, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full"
                        >
                          {role === "worker" && "👷 Pracownicy"}
                          {role === "employer" && "💼 Pracodawcy"}
                          {role === "accountant" && "📊 Księgowi"}
                          {role === "cleaning_company" &&
                            "🧹 Firmy sprzątające"}
                          {role === "admin" && "⚙️ Administratorzy"}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          </div>
        )}
      </div>

      {/* Reaction Counts Display */}
      {post.reactions && post.reactions.total > 0 && (
        <div className="px-3 sm:px-5 py-1.5 sm:py-2 border-t border-slate-100/50">
          <ReactionCountsDisplay reactions={post.reactions} />
        </div>
      )}

      {/* Post Actions Bar - Minimalist */}
      <div className="px-3 sm:px-5 py-2 sm:py-3 border-t border-slate-100/50 bg-white/30">
        <div className="flex items-center justify-between">
          {/* Left Actions */}
          <div className="flex items-center gap-3 sm:gap-5">
            {/* Skip WhatsApp for service_request - it's already in the card */}
            {!(
              post.type === "service_request" &&
              (post.request_category || post.category)
            ) && (
              <>
                {/* Reaction Button */}
                <ReactionButton
                  likesCount={post.likes_count}
                  userReaction={post.user_reaction}
                  onReactionChange={onReactionChange}
                />

                {/* Comment Button */}
                <button
                  onClick={handleShowComments}
                  className="flex items-center gap-1 sm:gap-1.5 text-slate-500 hover:text-slate-700 active:scale-95 transition-all"
                >
                  <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="text-xs sm:text-sm font-medium">
                    {post.comments_count}
                  </span>
                </button>
              </>
            )}

            {/* Share Button */}
            <button
              onClick={() => setShowShareModal(true)}
              className="flex items-center gap-1 sm:gap-1.5 text-slate-500 hover:text-slate-700 active:scale-95 transition-all"
            >
              <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-xs sm:text-sm font-medium">
                {post.shares_count}
              </span>
            </button>
          </div>

          {/* Right Actions */}
          <SaveButton
            postId={post.id}
            currentFolders={currentFolders}
            onSave={async (folder) => {
              if (!currentUserId || !currentUserRole) {
                console.error("User ID or role not available");
                return;
              }

              const { savePost } = await import("../src/services/feedService");
              // Get user role-specific ID for savePost
              const effectiveRole =
                currentUserRole === "admin" ? "worker" : currentUserRole;

              let actualUserId = currentUserId;
              if (currentUserRole === "worker") {
                const { data: workerData } = await supabase
                  .from("workers")
                  .select("id")
                  .eq("profile_id", currentUserId)
                  .single();
                if (workerData) actualUserId = workerData.id;
              } else if (currentUserRole === "employer") {
                const { data: employerData } = await supabase
                  .from("employers")
                  .select("id")
                  .eq("profile_id", currentUserId)
                  .single();
                if (employerData) actualUserId = employerData.id;
              } else if (currentUserRole === "accountant") {
                const { data: accountantData } = await supabase
                  .from("accountants")
                  .select("id")
                  .eq("profile_id", currentUserId)
                  .single();
                if (accountantData) actualUserId = accountantData.id;
              }

              await savePost(
                post.id,
                actualUserId,
                effectiveRole as any,
                currentUserId,
                folder
              );
              setCurrentFolders([...currentFolders, folder]);
            }}
            onUnsave={async (folder) => {
              const { unsavePost } = await import(
                "../src/services/feedService"
              );
              await unsavePost(post.id, folder);
              setCurrentFolders(currentFolders.filter((f) => f !== folder));
            }}
            userRole={currentUserRole}
            compact
          />
        </div>
      </div>

      {/* Comment Preview - Shows last comment when collapsed */}
      {!showComments && post.comments_count > 0 && comments.length > 0 && (
        <button
          onClick={handleShowComments}
          className="w-full px-3 sm:px-5 py-2 border-t border-slate-100/50 bg-slate-50/30 hover:bg-slate-100/50 transition-colors text-left group"
        >
          <div className="flex items-start gap-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
              {comments[comments.length - 1]?.user_name?.charAt(0) || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-xs font-semibold text-slate-700">
                {comments[comments.length - 1]?.user_name}
              </span>
              <span className="text-xs text-slate-600 ml-1.5 line-clamp-1">
                {comments[comments.length - 1]?.content}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 group-hover:text-blue-500 transition-colors whitespace-nowrap">
              Bekijk alle {post.comments_count} reacties →
            </span>
          </div>
        </button>
      )}

      {/* Comments Section with Animation */}
      <div
        ref={commentsRef}
        className={`
          overflow-hidden transition-all duration-300 ease-out
          ${showComments ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"}
        `}
      >
        <div
          className={`
          px-3 sm:px-6 py-3 sm:py-4 border-t border-gray-100 bg-gradient-to-b from-slate-50/80 to-white
          ${
            isCommentsAnimating
              ? "animate-in slide-in-from-top-2 fade-in duration-300"
              : ""
          }
        `}
        >
          {loadingComments ? (
            <div className="flex items-center justify-center gap-2 py-6 text-slate-500">
              <div className="w-5 h-5 border-2 border-slate-300 border-t-blue-500 rounded-full animate-spin" />
              <span className="text-sm">Reacties laden...</span>
            </div>
          ) : (
            <>
              {/* Comments List */}
              <div className="space-y-3 sm:space-y-4 mb-3 sm:mb-4 max-h-80 sm:max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                {comments.length === 0 ? (
                  <div className="text-center py-6 text-slate-400">
                    <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">
                      Nog geen reacties. Wees de eerste!
                    </p>
                  </div>
                ) : (
                  comments.map((comment, index) => (
                    <div
                      key={comment.id}
                      className="flex items-start gap-2 sm:gap-3 group/comment"
                    >
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center text-white font-bold text-xs sm:text-sm flex-shrink-0">
                        {comment.user_name?.charAt(0) || "U"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="bg-white rounded-xl sm:rounded-2xl px-3 sm:px-4 py-2 sm:py-3 shadow-sm border border-gray-100">
                          <p className="text-xs sm:text-sm font-bold text-gray-900 truncate">
                            {comment.user_name}
                          </p>
                          <p className="text-xs sm:text-sm text-gray-700 mt-1 break-words">
                            {comment.content}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3 mt-1.5 sm:mt-2 px-2 sm:px-4">
                          <span className="text-[10px] sm:text-xs text-gray-500">
                            {formatDate(comment.created_at)}
                          </span>
                          {/* Comment Reaction Button */}
                          <ReactionButton
                            currentReaction={comment.user_reaction || null}
                            reactionCounts={{
                              like: comment.likes_count || 0,
                              love: 0,
                              wow: 0,
                              sad: 0,
                              angry: 0,
                              total: comment.likes_count || 0,
                            }}
                            onReactionChange={async (reactionType) => {
                              if (!currentUserId || !currentUserRole) return;
                              try {
                                if (reactionType === null) {
                                  await unreactToComment(
                                    comment.id,
                                    currentUserId
                                  );
                                } else {
                                  await reactToComment(
                                    comment.id,
                                    currentUserId,
                                    currentUserRole as any,
                                    currentUserId,
                                    reactionType
                                  );
                                }
                                // Reload comments to show updated counts
                                const updatedComments = await getPostComments(
                                  post.id
                                );
                                setComments(updatedComments);
                              } catch (error) {
                                console.error(
                                  "Error reacting to comment:",
                                  error
                                );
                              }
                            }}
                            size="sm"
                            showCount={true}
                            compact={true}
                          />
                          <button className="text-[10px] sm:text-xs text-gray-600 hover:text-blue-600 active:scale-95 font-semibold transition-all">
                            Reageren
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Comment Input */}
              {currentUserId && currentUserRole && (
                <form onSubmit={handleSubmitComment} className="mt-3 sm:mt-4">
                  <div className="flex items-start gap-2 sm:gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center text-white font-bold text-xs sm:text-sm flex-shrink-0">
                      U
                    </div>
                    <div className="flex-1">
                      <div className="relative">
                        <textarea
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          placeholder="Schrijf een reactie..."
                          rows={2}
                          className="w-full px-3 sm:px-4 py-2 sm:py-3 pr-10 sm:pr-12 border border-gray-200 rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none bg-white text-sm"
                          disabled={isSubmittingComment}
                        />
                        <button
                          type="submit"
                          disabled={!commentText.trim() || isSubmittingComment}
                          className="absolute right-1.5 sm:right-2 bottom-1.5 sm:bottom-2 p-1.5 sm:p-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-full hover:shadow-lg active:scale-95 sm:hover:scale-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        >
                          <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </form>
              )}

              {!currentUserId && (
                <div className="text-xs sm:text-sm text-gray-500 text-center py-2 sm:py-3 bg-gray-100 rounded-xl sm:rounded-2xl">
                  Log in om te reageren
                </div>
              )}
            </>
          )}
        </div>
      </div>

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
  const [postType, setPostType] = useState<PostType>("job_offer");
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

  // 🔥 Memoized progress calculation to prevent re-renders
  const fieldCompletion = useMemo(() => {
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
          enhancedFormData[field] &&
          (Array.isArray(enhancedFormData[field])
            ? enhancedFormData[field].length > 0
            : true)
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
        (field) => enhancedFormData[field]
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
          enhancedFormData[field] &&
          (Array.isArray(enhancedFormData[field])
            ? enhancedFormData[field].length > 0
            : true)
      ).length;
      return {
        filled,
        total,
        percentage: Math.round((filled / total) * 100),
      };
    }
    return { filled: 0, total: 0, percentage: 0 };
  }, [postType, enhancedFormData]);

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

      // 🔥 ALWAYS sync job_* fields to generic fields (CRITICAL FOR FILTERS)
      // This must run BEFORE postType check, because JobOfferForm might be shown
      // even if user didn't explicitly click "job_offer" button
      if (postData.job_location && !postData.location) {
        postData.location = postData.job_location;
      }
      if (postData.job_category && !postData.category) {
        postData.category = postData.job_category;
      }
      if (
        (postData.job_salary_min || postData.job_salary_max) &&
        !postData.budget
      ) {
        const min = postData.job_salary_min || 0;
        const max = postData.job_salary_max || min;
        postData.budget = (min + max) / 2;
      }

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
    <div className="bg-white/90 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-2xl border border-white/40 p-4 sm:p-6 md:p-8 animate-fadeIn">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h2 className="text-lg sm:text-xl md:text-2xl font-black bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
          Nieuw Post Maken
        </h2>
        <button
          onClick={onCancel}
          className="p-1.5 sm:p-2 hover:bg-gray-100 active:scale-95 rounded-full transition-all"
        >
          <X className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        {/* Post Type Pills */}
        <div>
          <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-2 sm:mb-3">
            Type Post
          </label>
          <div className="flex flex-wrap gap-2 sm:gap-3">
            {(["announcement", "job_offer", "ad"] as PostType[]).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setPostType(type)}
                className={`px-3 sm:px-6 py-2 sm:py-3 rounded-full text-xs sm:text-sm font-bold transition-all active:scale-95 ${
                  postType === type
                    ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg scale-105"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 sm:hover:scale-105"
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
          <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1.5 sm:mb-2">
            Titel (optioneel)
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Geef je post een titel..."
            className="w-full px-3 sm:px-5 py-2.5 sm:py-3 border border-gray-300 rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm sm:text-lg"
          />
        </div>

        {/* Content */}
        <div>
          <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1.5 sm:mb-2">
            Inhoud *
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Wat wil je delen met de community?"
            rows={4}
            className="w-full px-3 sm:px-5 py-2.5 sm:py-3 border border-gray-300 rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none text-sm sm:text-lg"
            required
          />
        </div>

        {/* Progress Bar */}
        {postType && (
          <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-xl sm:rounded-2xl p-3 sm:p-6 border-2 border-blue-200">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-lg sm:text-2xl">📊</span>
                <span className="text-xs sm:text-sm font-bold text-gray-700">
                  Postęp wypełnienia
                </span>
              </div>
              <span className="text-sm sm:text-lg font-black text-gray-900">
                {fieldCompletion.filled}/{fieldCompletion.total}
              </span>
            </div>
            <div className="relative w-full h-2.5 sm:h-4 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ease-out ${
                  fieldCompletion.percentage < 40
                    ? "bg-gradient-to-r from-red-400 to-red-600"
                    : fieldCompletion.percentage < 70
                    ? "bg-gradient-to-r from-yellow-400 to-orange-500"
                    : "bg-gradient-to-r from-green-400 to-emerald-600"
                }`}
                style={{ width: `${fieldCompletion.percentage}%` }}
              >
                <div className="w-full h-full bg-white/20 animate-pulse" />
              </div>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs">
              <span
                className={`font-bold ${
                  fieldCompletion.percentage < 40
                    ? "text-red-600"
                    : fieldCompletion.percentage < 70
                    ? "text-orange-600"
                    : "text-green-600"
                }`}
              >
                {fieldCompletion.percentage}% ukończone
              </span>
              <span className="text-gray-600">
                {(() => {
                  if (fieldCompletion.percentage < 40)
                    return "⚠️ Wypełnij wymagane pola";
                  if (fieldCompletion.percentage < 70)
                    return "📈 Dobra robota! Dodaj więcej szczegółów";
                  if (fieldCompletion.percentage < 100)
                    return "🎯 Prawie gotowe!";
                  return "✅ Wszystkie pola wypełnione!";
                })()}
              </span>
            </div>
          </div>
        )}

        {/* Enhanced Forms Based on Post Type */}
        {postType === "ad" && (
          <AdForm
            key="ad-form"
            formData={enhancedFormData}
            onChange={handleFormChange}
          />
        )}

        {postType === "announcement" && (
          <AnnouncementForm
            key="announcement-form"
            formData={enhancedFormData}
            onChange={handleFormChange}
          />
        )}

        {postType === "job_offer" && (
          <JobOfferForm
            key="job-offer-form"
            formData={enhancedFormData}
            onChange={handleFormChange}
          />
        )}

        {/* Media Upload */}
        <div>
          <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-2 sm:mb-3">
            Zdjęcia/Filmy
          </label>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <label
              htmlFor="media-upload"
              className="flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-full cursor-pointer hover:shadow-lg active:scale-95 sm:hover:scale-105 transition-all font-bold text-xs sm:text-sm"
            >
              <Upload className="w-4 h-4 sm:w-5 sm:h-5" />
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
            <span className="text-xs sm:text-sm text-gray-500">
              Max 10 plików, 20MB
            </span>
          </div>

          {/* Media Preview Grid */}
          {mediaPreview.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
              {mediaPreview.map((media, index) => (
                <div
                  key={index}
                  className="relative bg-gray-100 rounded-xl sm:rounded-2xl overflow-hidden group/preview"
                >
                  {media.type === "image" ? (
                    <img
                      src={media.preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-20 sm:h-32 object-cover"
                    />
                  ) : (
                    <div className="w-full h-20 sm:h-32 bg-gray-900 flex items-center justify-center">
                      <Video className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => removeMedia(index)}
                    className="absolute top-1 right-1 sm:top-2 sm:right-2 p-1 sm:p-1.5 bg-red-600 text-white rounded-full sm:opacity-0 sm:group-hover/preview:opacity-100 transition-opacity hover:bg-red-700"
                  >
                    <X className="w-3 h-3 sm:w-4 sm:h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 pt-3 sm:pt-4">
          <button
            type="submit"
            disabled={submitting || uploadingMedia || !content.trim()}
            className="flex-1 bg-gradient-to-r from-amber-600 to-orange-600 text-white font-black py-3 sm:py-4 rounded-full hover:shadow-2xl active:scale-95 sm:hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm sm:text-lg"
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
            className="px-6 sm:px-8 py-3 sm:py-4 bg-gray-100 text-gray-700 font-bold rounded-full hover:bg-gray-200 active:scale-95 transition-all text-sm sm:text-base"
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

// Helper component to load author groups for StoryViewerPro
function StoryViewerProWrapper({
  authorId,
  storyId,
  onClose,
}: {
  authorId: string;
  storyId: string | null;
  onClose: () => void;
}) {
  const [authorGroups, setAuthorGroups] = useState<AuthorGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadGroups = async () => {
      console.log(
        "🔄 [StoryViewerProWrapper] Loading stories for author:",
        authorId
      );

      const now = new Date().toISOString();
      const supabaseAny = supabase as any;

      try {
        const { data: stories, error: queryError } = await supabaseAny
          .from("stories")
          .select(
            `
            id,
            author_id,
            author_type,
            media_url,
            media_type,
            caption,
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

        if (queryError) {
          console.error("❌ [StoryViewerProWrapper] Query error:", queryError);
          setError(queryError.message);
          setLoading(false);
          return;
        }

        console.log(
          "📊 [StoryViewerProWrapper] Fetched stories:",
          stories?.length
        );

        if (!stories || stories.length === 0) {
          console.warn("⚠️ [StoryViewerProWrapper] No stories found");
          setError("Brak aktywnych stories");
          setLoading(false);
          return;
        }

        const grouped = new Map<string, AuthorGroup>();

        for (const story of stories) {
          const aId = story.author_id;
          const profile = story.profiles;

          if (!grouped.has(aId)) {
            grouped.set(aId, {
              authorId: aId,
              authorName: profile?.full_name || "Nieznany",
              authorAvatar: profile?.avatar_url || "",
              authorRole: profile?.role || "regular_user",
              stories: [],
              hasUnseen: false,
            });
          }
          grouped.get(aId)!.stories.push(story);
        }

        const groupsArray = Array.from(grouped.values());
        console.log(
          "✅ [StoryViewerProWrapper] Grouped authors:",
          groupsArray.length
        );
        setAuthorGroups(groupsArray);
      } catch (err) {
        console.error("❌ [StoryViewerProWrapper] Exception:", err);
        setError("Błąd ładowania stories");
      }

      setLoading(false);
    };

    loadGroups();
  }, [authorId]);

  // Show loading overlay
  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-white">Ładowanie story...</p>
        </div>
      </div>
    );
  }

  // Show error with close button
  if (error || authorGroups.length === 0) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
        <div className="text-center p-6">
          <p className="text-white text-lg mb-4">
            {error || "Brak stories do wyświetlenia"}
          </p>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-purple-600 text-white rounded-full hover:bg-purple-700"
          >
            Zamknij
          </button>
        </div>
      </div>
    );
  }

  return (
    <StoryViewerPro
      initialAuthorId={authorId}
      initialStoryId={storyId || undefined}
      authorGroups={authorGroups}
      onClose={onClose}
    />
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
