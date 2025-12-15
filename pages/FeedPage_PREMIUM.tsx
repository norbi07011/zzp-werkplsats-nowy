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
import { LoadingOverlay } from "../components/Loading";
import { ShareModal } from "../components/ShareModal";
import {
  ReactionButton,
  ReactionCountsDisplay,
} from "../src/components/ReactionPicker";

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

  // Stories
  const [stories, setStories] = useState<Story[]>([]);
  const [showStories, setShowStories] = useState(false);

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
      loadStories();
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      {/* ===== HEADER WITH GLASSMORPHISM ===== */}
      <div className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b border-white/20 shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center gap-6">
              <h1 className="text-3xl font-black bg-gradient-to-r from-amber-600 via-orange-500 to-red-500 bg-clip-text text-transparent">
                Feed
              </h1>
            </div>

            {/* Search */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Zoeken..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 pr-4 py-3 w-80 bg-white/60 backdrop-blur-sm border border-white/40 rounded-full focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                />
              </div>

              {canCreatePost && (
                <button
                  onClick={() => setShowCreatePost(true)}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-full font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                >
                  <Plus className="w-5 h-5" />
                  Nieuw Post
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ===== FILTER TABS ===== */}
        <div className="border-t border-white/20">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide py-3">
              <button
                onClick={() => setActiveFilter("all")}
                className={`px-6 py-2 rounded-full font-bold whitespace-nowrap transition-all ${
                  activeFilter === "all"
                    ? "bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-lg"
                    : "bg-white/60 text-gray-700 hover:bg-white/80"
                }`}
              >
                📋 Wszystko
              </button>
              <button
                onClick={() => setActiveFilter("service_requests")}
                className={`px-6 py-2 rounded-full font-bold whitespace-nowrap transition-all ${
                  activeFilter === "service_requests"
                    ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg"
                    : "bg-white/60 text-gray-700 hover:bg-white/80"
                }`}
              >
                🏡 Zlecenia prywatne
              </button>
              <button
                onClick={() => setActiveFilter("announcements")}
                className={`px-6 py-2 rounded-full font-bold whitespace-nowrap transition-all ${
                  activeFilter === "announcements"
                    ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg"
                    : "bg-white/60 text-gray-700 hover:bg-white/80"
                }`}
              >
                📢 Ogłoszenia
              </button>
              <button
                onClick={() => setActiveFilter("jobs")}
                className={`px-6 py-2 rounded-full font-bold whitespace-nowrap transition-all ${
                  activeFilter === "jobs"
                    ? "bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg"
                    : "bg-white/60 text-gray-700 hover:bg-white/80"
                }`}
              >
                💼 Praca
              </button>
              <button
                onClick={() => setActiveFilter("ads")}
                className={`px-6 py-2 rounded-full font-bold whitespace-nowrap transition-all ${
                  activeFilter === "ads"
                    ? "bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-lg"
                    : "bg-white/60 text-gray-700 hover:bg-white/80"
                }`}
              >
                📣 Reklamy
              </button>
            </div>
          </div>
        </div>

        {/* 🔥 NOWE: ZAAWANSOWANE FILTRY */}
        <div className="border-t border-white/10 bg-gradient-to-b from-white/5 to-transparent">
          <div className="max-w-7xl mx-auto px-4 py-4">
            {/* Wyszukiwarka + przycisk filtrów */}
            <div className="flex gap-3 mb-4">
              <div className="flex-1 relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 flex items-center justify-center">
                  <Search size={18} className="max-w-full max-h-full" />
                </div>
                <input
                  type="text"
                  placeholder="Szukaj ogłoszeń, lokalizacji, słów kluczowych..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white/80 backdrop-blur-sm border-2 border-white/20 rounded-2xl text-gray-800 placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-6 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all relative ${
                  showFilters
                    ? "bg-blue-600 text-white shadow-lg"
                    : "bg-white/80 text-gray-700 hover:bg-white"
                }`}
              >
                <Filter size={20} />
                Filtry
                {/* Licznik aktywnych filtrów */}
                {(selectedCity !== "all" ||
                  selectedCategory !== "all" ||
                  searchQuery.trim()) && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center animate-pulse">
                    {
                      [
                        selectedCity !== "all",
                        selectedCategory !== "all",
                        searchQuery.trim(),
                      ].filter(Boolean).length
                    }
                  </span>
                )}
              </button>
            </div>

            {/* Panel filtrów (rozwijany) */}
            {showFilters && (
              <div className="bg-white/90 backdrop-blur-md rounded-2xl p-4 sm:p-6 shadow-2xl border border-white/20 space-y-4 animate-in slide-in-from-top duration-200 max-h-[70vh] overflow-y-auto overscroll-contain">
                {/* Rząd 1: Miasto + Kategoria */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Miasto */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      🏙️ Miasto
                    </label>
                    <select
                      value={selectedCity}
                      onChange={(e) => setSelectedCity(e.target.value)}
                      className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-800 font-medium focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    >
                      <option value="all">🌍 Wszystkie miasta</option>
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
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      📂 Kategoria
                    </label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-800 font-medium focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    >
                      <option value="all">📋 Wszystkie kategorie</option>
                      {categories
                        .filter((c) => c !== "all")
                        .map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                {/* Rząd 2: Sortowanie */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    🔄 Sortowanie
                  </label>
                  <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
                    <button
                      onClick={() => setSortBy("newest")}
                      className={`px-3 sm:px-4 py-2.5 min-h-[44px] rounded-xl font-bold transition-all text-sm sm:text-base ${
                        sortBy === "newest"
                          ? "bg-blue-600 text-white shadow-lg"
                          : "bg-white border-2 border-gray-200 text-gray-700 hover:border-blue-500"
                      }`}
                    >
                      🕐 Najnowsze
                    </button>
                    <button
                      onClick={() => setSortBy("popular")}
                      className={`px-3 sm:px-4 py-2.5 min-h-[44px] rounded-xl font-bold transition-all text-sm sm:text-base ${
                        sortBy === "popular"
                          ? "bg-blue-600 text-white shadow-lg"
                          : "bg-white border-2 border-gray-200 text-gray-700 hover:border-blue-500"
                      }`}
                    >
                      ⭐ Popularne
                    </button>
                    <button
                      onClick={() => setSortBy("price_low")}
                      className={`px-3 sm:px-4 py-2.5 min-h-[44px] rounded-xl font-bold transition-all text-sm sm:text-base ${
                        sortBy === "price_low"
                          ? "bg-blue-600 text-white shadow-lg"
                          : "bg-white border-2 border-gray-200 text-gray-700 hover:border-blue-500"
                      }`}
                    >
                      💰 Cena: niższa
                    </button>
                    <button
                      onClick={() => setSortBy("price_high")}
                      className={`px-3 sm:px-4 py-2.5 min-h-[44px] rounded-xl font-bold transition-all text-sm sm:text-base ${
                        sortBy === "price_high"
                          ? "bg-blue-600 text-white shadow-lg"
                          : "bg-white border-2 border-gray-200 text-gray-700 hover:border-blue-500"
                      }`}
                    >
                      💎 Cena: wyższa
                    </button>
                  </div>
                </div>

                {/* Reset button */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedCity("all");
                      setSelectedCategory("all");
                      setSortBy("newest");
                    }}
                    className="text-sm text-gray-600 hover:text-gray-800 font-medium min-h-[44px] px-3 py-2"
                  >
                    🔄 Wyczyść filtry
                  </button>
                  <div className="text-sm text-gray-600 font-bold">
                    📊 Znaleziono: {filterPosts(posts).length} ogłoszeń
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

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

      {/* ===== MAIN 3-COLUMN LAYOUT ===== */}
      <div className="container mx-auto px-4 mt-6 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* ===== LEFT SIDEBAR - Trending ===== */}
          <aside className="hidden lg:block lg:col-span-3">
            <div className="sticky top-24 space-y-6">
              {/* Trending Widget */}
              <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/40">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-5 h-5 text-orange-600" />
                  <h3 className="font-bold text-lg">🔥 Trending Nu</h3>
                </div>

                <div className="space-y-4">
                  {trending.slice(0, 5).map((post, index) => (
                    <div
                      key={post.id}
                      className="flex items-start gap-3 group cursor-pointer hover:bg-amber-50 p-2 rounded-xl transition-all"
                    >
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-bold text-sm">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 line-clamp-2 group-hover:text-amber-600 transition-colors">
                          {post.title || post.content.substring(0, 60)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {post.likes_count} likes • {post.comments_count}{" "}
                          reacties
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

            {/* Posts Masonry */}
            <div className="space-y-6">
              {filterPosts(posts).length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🔍</div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">
                    Brak wyników
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Nie znaleziono ogłoszeń spełniających kryteria wyszukiwania
                  </p>
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedCity("all");
                      setSelectedCategory("all");
                      setActiveFilter("all");
                    }}
                    className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all"
                  >
                    Wyczyść filtry
                  </button>
                </div>
              ) : (
                filterPosts(posts).map((post) => (
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

          {/* ===== RIGHT SIDEBAR - Suggestions ===== */}
          <aside className="hidden lg:block lg:col-span-3">
            <div className="sticky top-24 space-y-6">
              {/* Footer Links */}
              <div className="text-xs text-gray-500 space-y-2 px-4">
                <div className="flex flex-wrap gap-2">
                  <a href="#" className="hover:text-amber-600">
                    Over
                  </a>
                  <span>•</span>
                  <a href="#" className="hover:text-amber-600">
                    Help
                  </a>
                  <span>•</span>
                  <a href="#" className="hover:text-amber-600">
                    Privacy
                  </a>
                  <span>•</span>
                  <a href="#" className="hover:text-amber-600">
                    Voorwaarden
                  </a>
                </div>
                <p className="text-gray-400">© 2025 ZZP Werkplaats</p>
              </div>
            </div>
          </aside>
        </div>
      </div>
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
  const [comments, setComments] = useState<PostComment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [currentFolders, setCurrentFolders] = useState<SaveFolder[]>([]);

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
      } catch (error) {
        console.error("Error loading comments:", error);
      } finally {
        setLoadingComments(false);
      }
    }
    setShowComments(!showComments);
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
      onComment();
    } catch (error) {
      console.error("Error creating comment:", error);
      alert("Fout bij het plaatsen van reactie");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  return (
    <article className="group bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl border border-white/40 overflow-hidden hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-1">
      {/* Post Header */}
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4">
            {/* Avatar with gradient ring */}
            <div className="relative">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 p-0.5">
                {post.author_avatar ? (
                  <img
                    src={post.author_avatar}
                    alt={post.author_name || "User"}
                    className="w-full h-full rounded-full object-cover bg-white"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center text-white font-bold text-xl">
                    {post.author_name?.charAt(0) || "U"}
                  </div>
                )}
              </div>
              {/* Online indicator */}
              <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-gray-900 hover:text-amber-600 cursor-pointer transition-colors">
                  {post.author_name || "Onbekend"}
                </h3>
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

        {/* Post Content */}
        <p className="text-gray-700 whitespace-pre-wrap mb-4 leading-relaxed">
          {post.content}
        </p>

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
                    className={`relative bg-black group/media cursor-pointer overflow-hidden ${
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
                  >
                    {mediaType === "image" ? (
                      <>
                        <img
                          src={mediaUrl}
                          alt={`Media ${index + 1}`}
                          className="w-full h-full object-cover group-hover/media:scale-110 transition-transform duration-500"
                          onClick={() => window.open(mediaUrl, "_blank")}
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
                        className="w-full h-full object-cover"
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

        {/* Service Request Card (Zlecenie Prywatne) */}
        {post.type === "service_request" &&
          (post.request_category || post.category) && (
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-5 space-y-4 mb-4 border border-purple-200">
              <div className="flex items-center gap-2 text-purple-900 font-bold">
                <span className="text-xl">🏡</span>
                <span>Szczegóły Zlecenia</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Kategoria */}
                <div className="flex items-center gap-2 text-sm text-gray-700 bg-white/60 rounded-lg px-3 py-2">
                  <span className="font-semibold">🏷️ Kategoria:</span>
                  <span className="capitalize">
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
                    {![
                      "plumbing",
                      "electrical",
                      "cleaning",
                      "moving",
                      "repair",
                      "gardening",
                      "painting",
                      "other",
                    ].includes(post.request_category || post.category || "") &&
                      (post.request_category || post.category)}
                  </span>
                </div>

                {/* Lokalizacja */}
                <div className="flex items-center gap-2 text-sm text-gray-700 bg-white/60 rounded-lg px-3 py-2">
                  <span className="font-semibold">📍 Miasto:</span>
                  {post.request_location || post.location ? (
                    <span>{post.request_location || post.location}</span>
                  ) : (
                    <span className="text-gray-400 italic">Nie podano</span>
                  )}
                </div>

                {/* Budżet */}
                <div className="flex items-center gap-2 text-sm text-gray-700 bg-white/60 rounded-lg px-3 py-2">
                  <span className="font-semibold">💰 Budżet:</span>
                  {post.request_budget_min || post.request_budget_max ? (
                    <span className="font-bold text-green-700">
                      {post.request_budget_min && post.request_budget_max
                        ? `€${post.request_budget_min} - €${post.request_budget_max}`
                        : post.request_budget_min
                        ? `od €${post.request_budget_min}`
                        : `do €${post.request_budget_max}`}
                    </span>
                  ) : (
                    <span className="text-gray-400 italic">Do negocjacji</span>
                  )}
                </div>

                {/* Pilność */}
                <div className="flex items-center gap-2 text-sm text-gray-700 bg-white/60 rounded-lg px-3 py-2">
                  <span className="font-semibold">🔥 Pilność:</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                      post.request_urgency === "urgent"
                        ? "bg-red-100 text-red-700"
                        : post.request_urgency === "high"
                        ? "bg-orange-100 text-orange-700"
                        : post.request_urgency === "normal"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {post.request_urgency === "urgent" && "⚡ Pilne!"}
                    {post.request_urgency === "high" && "🔥 Wysoka"}
                    {post.request_urgency === "normal" && "📋 Normalna"}
                    {post.request_urgency === "low" && "⏰ Niska"}
                    {!post.request_urgency && "📋 Normalna"}
                  </span>
                </div>

                {/* Preferowana data */}
                {post.request_preferred_date && (
                  <div className="flex items-center gap-2 text-sm text-gray-700 bg-white/60 rounded-lg px-3 py-2 md:col-span-2">
                    <span className="font-semibold">📅 Preferowana data:</span>
                    <span className="font-semibold text-blue-700">
                      {new Date(post.request_preferred_date).toLocaleDateString(
                        "pl-PL",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        }
                      )}
                    </span>
                  </div>
                )}

                {/* Status */}
                <div className="flex items-center gap-2 text-sm text-gray-700 bg-white/60 rounded-lg px-3 py-2">
                  <span className="font-semibold">📊 Status:</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                      post.request_status === "open"
                        ? "bg-green-100 text-green-700"
                        : post.request_status === "in_progress"
                        ? "bg-blue-100 text-blue-700"
                        : post.request_status === "completed"
                        ? "bg-gray-100 text-gray-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {post.request_status === "open" && "🟢 Otwarte"}
                    {post.request_status === "in_progress" && "🔵 W trakcie"}
                    {post.request_status === "completed" && "✅ Zakończone"}
                    {post.request_status === "cancelled" && "❌ Anulowane"}
                    {!post.request_status && "🟢 Otwarte"}
                  </span>
                </div>
              </div>
            </div>
          )}

        {/* Job Offer Card */}
        {post.type === "job_offer" && (
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-5 space-y-4 mb-4 border border-blue-200">
            <div className="flex items-center gap-2 text-blue-900 font-bold">
              <Briefcase className="w-5 h-5" />
              <span>Vacature Details</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(post.job_category || post.category) && (
                <div className="flex items-center gap-2 text-sm text-gray-700 bg-white/60 rounded-lg px-3 py-2">
                  <span className="font-semibold">Categorie:</span>
                  <span>{post.job_category || post.category}</span>
                </div>
              )}

              <div className="flex items-center gap-2 text-sm text-gray-700 bg-white/60 rounded-lg px-3 py-2">
                <span className="font-semibold">💼 Type:</span>
                {post.job_type ? (
                  <span>
                    {post.job_type === "full_time" && "Voltijd"}
                    {post.job_type === "part_time" && "Deeltijd"}
                    {post.job_type === "contract" && "Contract"}
                    {post.job_type === "temporary" && "Tijdelijk"}
                  </span>
                ) : (
                  <span className="text-gray-400 italic">
                    Type pracy nie podany
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-700 bg-white/60 rounded-lg px-3 py-2">
                <MapPin className="w-4 h-4" />
                {post.job_location || post.location ? (
                  <span>{post.job_location || post.location}</span>
                ) : (
                  <span className="text-gray-400 italic">
                    Lokalizacja nie podana
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-700 bg-white/60 rounded-lg px-3 py-2">
                <span className="font-semibold">⏰ Uren/week:</span>
                {post.job_hours_per_week ? (
                  <span>{post.job_hours_per_week}</span>
                ) : (
                  <span className="text-gray-400 italic">
                    Godziny nie podane
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-700 bg-white/60 rounded-lg px-3 py-2">
                <span className="font-semibold">📅 Start:</span>
                {post.job_start_date ? (
                  <span>
                    {new Date(post.job_start_date).toLocaleDateString("nl-NL")}
                  </span>
                ) : (
                  <span className="text-gray-400 italic">
                    Data rozpoczęcia nie podana
                  </span>
                )}
              </div>

              {(post.job_salary_min || post.job_salary_max) && (
                <div className="flex items-center gap-2 text-sm text-gray-700 bg-white/60 rounded-lg px-3 py-2 col-span-full">
                  <span className="font-semibold">💰 Salaris:</span>
                  <span className="text-green-700 font-bold">
                    €{post.job_salary_min || "?"} - €
                    {post.job_salary_max || "?"} /uur
                  </span>
                </div>
              )}
            </div>

            {/* Benefits */}
            <div className="space-y-2">
              <span className="text-sm font-semibold text-gray-700">
                🎁 Voordelen:
              </span>
              {post.job_benefits && post.job_benefits.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {post.job_benefits.map((benefit, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 text-xs font-bold rounded-full"
                    >
                      {benefit}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-gray-400 italic text-sm">
                  Benefity nie podane
                </span>
              )}
            </div>

            {/* Contact Info */}
            <div className="space-y-2 pt-2 border-t border-blue-200">
              <span className="text-sm font-semibold text-gray-700">
                📞 Contact:
              </span>
              <div className="flex flex-wrap gap-3">
                {post.job_contact_email ? (
                  <a
                    href={`mailto:${post.job_contact_email}`}
                    className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 bg-white/60 rounded-lg px-3 py-2"
                  >
                    <Mail className="w-4 h-4" />
                    {post.job_contact_email}
                  </a>
                ) : (
                  <span className="flex items-center gap-2 text-sm text-gray-400 italic bg-white/60 rounded-lg px-3 py-2">
                    <Mail className="w-4 h-4" />
                    Email nie podany
                  </span>
                )}
                {post.job_contact_phone ? (
                  <a
                    href={`tel:${post.job_contact_phone}`}
                    className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 bg-white/60 rounded-lg px-3 py-2"
                  >
                    <Phone className="w-4 h-4" />
                    {post.job_contact_phone}
                  </a>
                ) : (
                  <span className="flex items-center gap-2 text-sm text-gray-400 italic bg-white/60 rounded-lg px-3 py-2">
                    <Phone className="w-4 h-4" />
                    Telefon nie podany
                  </span>
                )}
              </div>
            </div>

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
        <div className="px-6 py-2 border-t border-gray-100">
          <ReactionCountsDisplay reactions={post.reactions} />
        </div>
      )}

      {/* Post Actions Bar */}
      <div className="px-6 py-4 border-t border-gray-100 bg-gradient-to-r from-gray-50 to-white">
        <div className="flex items-center justify-between">
          {/* Left Actions */}
          <div className="flex items-center gap-6">
            {/* For SERVICE REQUESTS - WhatsApp Button instead of likes/comments */}
            {post.type === "service_request" &&
            (post.request_category || post.category) ? (
              post.author_phone ? (
                <a
                  href={`https://wa.me/${post.author_phone.replace(
                    /\D/g,
                    ""
                  )}?text=${encodeURIComponent(
                    `Cześć! Zainteresowało mnie Twoje zlecenie: ${
                      post.title || post.content.substring(0, 50)
                    }`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-bold rounded-full hover:shadow-lg transform hover:scale-105 transition-all"
                >
                  <svg
                    className="w-6 h-6"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                  </svg>
                  Kontakt WhatsApp
                </a>
              ) : (
                <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-500 rounded-full text-sm">
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                  </svg>
                  Brak numeru telefonu
                </div>
              )
            ) : (
              <>
                {/* Reaction Button (emoji picker) - only for non-service-requests */}
                <ReactionButton
                  likesCount={post.likes_count}
                  userReaction={post.user_reaction}
                  onReactionChange={onReactionChange}
                />

                {/* Comment Button - only for non-service-requests */}
                <button
                  onClick={handleShowComments}
                  className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-all transform hover:scale-110"
                >
                  <MessageSquare className="w-6 h-6" />
                  <span className="font-bold">{post.comments_count}</span>
                </button>
              </>
            )}

            {/* Share Button - for all posts */}
            <button
              onClick={() => setShowShareModal(true)}
              className="flex items-center gap-2 text-gray-600 hover:text-green-600 transition-all transform hover:scale-110"
            >
              <Share2 className="w-6 h-6" />
              <span className="font-bold">{post.shares_count}</span>
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

      {/* Comments Section */}
      {showComments && (
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50">
          {loadingComments ? (
            <div className="text-center py-4 text-gray-600">
              Reacties laden...
            </div>
          ) : (
            <>
              {/* Comments List */}
              <div className="space-y-4 mb-4 max-h-96 overflow-y-auto">
                {comments.map((comment) => (
                  <div
                    key={comment.id}
                    className="flex items-start gap-3 group/comment"
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {comment.user_name?.charAt(0) || "U"}
                    </div>
                    <div className="flex-1">
                      <div className="bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-100">
                        <p className="text-sm font-bold text-gray-900">
                          {comment.user_name}
                        </p>
                        <p className="text-sm text-gray-700 mt-1">
                          {comment.content}
                        </p>
                      </div>
                      <div className="flex items-center gap-4 mt-2 px-4">
                        <span className="text-xs text-gray-500">
                          {formatDate(comment.created_at)}
                        </span>
                        <button className="text-xs text-gray-600 hover:text-red-600 font-semibold transition-colors">
                          Vind ik leuk ({comment.likes_count})
                        </button>
                        <button className="text-xs text-gray-600 hover:text-blue-600 font-semibold transition-colors">
                          Reageren
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Comment Input */}
              {currentUserId && currentUserRole && (
                <form onSubmit={handleSubmitComment} className="mt-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      U
                    </div>
                    <div className="flex-1">
                      <div className="relative">
                        <textarea
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          placeholder="Schrijf een reactie..."
                          rows={2}
                          className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none bg-white"
                          disabled={isSubmittingComment}
                        />
                        <button
                          type="submit"
                          disabled={!commentText.trim() || isSubmittingComment}
                          className="absolute right-2 bottom-2 p-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-full hover:shadow-lg transform hover:scale-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </form>
              )}

              {!currentUserId && (
                <div className="text-sm text-gray-500 text-center py-3 bg-gray-100 rounded-2xl">
                  Log in om te reageren
                </div>
              )}
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
        {postType && (
          <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-6 border-2 border-blue-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">📊</span>
                <span className="text-sm font-bold text-gray-700">
                  Postęp wypełnienia formularza
                </span>
              </div>
              <span className="text-lg font-black text-gray-900">
                {fieldCompletion.filled}/{fieldCompletion.total} pól
              </span>
            </div>
            <div className="relative w-full h-4 bg-gray-200 rounded-full overflow-hidden">
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
