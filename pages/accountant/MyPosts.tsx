/**
 * ╔═══════════════════════════════════════════════════════════════════╗
 * ║               📋 MY POSTS MANAGEMENT - ACCOUNTANT                 ║
 * ║                                                                   ║
 * ║  Panel zarządzania postami księgowego                             ║
 * ║  Features: Filtry, edycja, toggle active, statystyki, usuwanie   ║
 * ╚═══════════════════════════════════════════════════════════════════╝
 */

import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../src/lib/supabase";
import {
  type Post,
  type PostType,
  type ReactionType,
  getMyPosts,
  togglePostActive as togglePostActiveService,
  softDeletePost,
  getPostStats,
  likePost,
  reactToPost,
  unreactToPost,
} from "../../src/services/feedService";
import {
  Eye,
  Heart,
  MessageSquare,
  Bookmark,
  TrendingUp,
  Filter,
  Plus,
} from "../../components/icons";
import { PostFormModal } from "../../components/PostFormModal";
import { PostStatsModal } from "../../components/PostStatsModal";
import { PostCardPremium } from "../FeedPage_PREMIUM";

export default function MyPosts() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<PostType | "all">("all");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [showPostModal, setShowPostModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [statsPostId, setStatsPostId] = useState<string | null>(null);
  const [statsPostTitle, setStatsPostTitle] = useState<string>("");

  useEffect(() => {
    loadMyPosts();
  }, [filterType, filterStatus]);

  const loadMyPosts = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const data = await getMyPosts(user.id);
      setPosts(data);
    } catch (error) {
      console.error("Error loading posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleReactionChange = async (
    postId: string,
    reactionType: ReactionType | null
  ) => {
    if (!user?.id) return;

    try {
      // Get user role-specific ID
      const currentUserRole = user.role;
      let actualUserId = user.id;

      // For accountants, get the accountant-specific ID
      if (currentUserRole === "accountant") {
        const { data: accountantData } = await (supabase as any)
          .from("accountants")
          .select("id")
          .eq("profile_id", user.id)
          .single();
        if (accountantData) actualUserId = accountantData.id;
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

      // Reload posts to reflect changes
      await loadMyPosts();
    } catch (error) {
      console.error("Error changing reaction:", error);
      await loadMyPosts();
    }
  };

  const togglePostActive = async (postId: string, currentStatus: boolean) => {
    try {
      await togglePostActiveService(postId, currentStatus);
      loadMyPosts();
    } catch (error) {
      console.error("Error toggling post:", error);
    }
  };

  const editPost = (postId: string) => {
    const post = posts.find((p) => p.id === postId);
    if (post) {
      setEditingPost(post);
      setShowPostModal(true);
    }
  };

  const deletePost = async (postId: string) => {
    if (!confirm("Czy na pewno chcesz usunąć ten post?")) return;

    try {
      await softDeletePost(postId);
      loadMyPosts();
    } catch (error) {
      console.error("Error deleting post:", error);
    }
  };

  const viewStats = (postId: string) => {
    const post = posts.find((p) => p.id === postId);
    if (post) {
      setStatsPostId(postId);
      setStatsPostTitle(post.title || "Post");
      setShowStatsModal(true);
    }
  };

  const filteredPosts = posts.filter((post) => {
    const typeMatch = filterType === "all" || post.type === filterType;
    const statusMatch =
      filterStatus === "all" ||
      (filterStatus === "active" && post.is_active) ||
      (filterStatus === "inactive" && !post.is_active);
    return typeMatch && statusMatch;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-teal-50 to-blue-50 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-black bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
              📋 Zarządzanie Postami
            </h1>
            <p className="text-gray-600 mt-2">
              Zarządzaj swoimi reklamami i ogłoszeniami księgowymi
            </p>
          </div>
          <button
            onClick={() => {
              setEditingPost(null);
              setShowPostModal(true);
            }}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-bold hover:shadow-lg transform hover:scale-105 transition-all flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Nowy Post
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-lg border border-white/40 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-gray-700" />
            <h2 className="text-lg font-bold text-gray-900">Filtry</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Type Filter - Księgowy nie ma job_offer */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Typ postu
              </label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all"
              >
                <option value="all">🌟 Wszystkie typy</option>
                <option value="ad">📣 Reklamy</option>
                <option value="announcement">📢 Ogłoszenia</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-teal-500 focus:ring-4 focus:ring-teal-100 transition-all"
              >
                <option value="all">📊 Wszystkie</option>
                <option value="active">✅ Aktywne</option>
                <option value="inactive">⛔ Nieaktywne</option>
              </select>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Znaleziono: <strong>{filteredPosts.length}</strong> postów
            </p>
            <button
              onClick={() => {
                setFilterType("all");
                setFilterStatus("all");
              }}
              className="text-sm text-green-600 hover:text-green-700 font-medium"
            >
              Wyczyść filtry
            </button>
          </div>
        </div>
      </div>

      {/* Posts Grid */}
      <div className="max-w-7xl mx-auto">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-green-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Ładowanie postów...</p>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-lg border border-white/40 p-12 text-center">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Brak postów
            </h3>
            <p className="text-gray-600 mb-6">
              {filterType !== "all" || filterStatus !== "all"
                ? "Nie znaleziono postów pasujących do filtrów"
                : "Nie masz jeszcze żadnych postów. Utwórz pierwszy!"}
            </p>
            <button
              onClick={() => window.history.back()}
              className="px-6 py-3 bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-xl font-bold hover:shadow-lg transform hover:scale-105 transition-all"
            >
              Utwórz pierwszy post
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {filteredPosts.map((post) => (
              <PostCardPremium
                key={post.id}
                post={post}
                onLike={async () => {
                  if (!user?.id || !user?.role) return;
                  await likePost(post.id, user.id, user.role as any);
                  loadMyPosts();
                }}
                onComment={() => {
                  // Comment handling is in PostCardPremium component
                }}
                onShare={() => {
                  // Share handling is in PostCardPremium component
                }}
                onReactionChange={(reactionType) =>
                  handleReactionChange(post.id, reactionType)
                }
                currentUserId={user?.id}
                currentUserRole={user?.role}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modale */}
      <PostFormModal
        isOpen={showPostModal}
        onClose={() => {
          setShowPostModal(false);
          setEditingPost(null);
        }}
        onSuccess={() => {
          loadMyPosts();
          setShowPostModal(false);
          setEditingPost(null);
        }}
        mode={editingPost ? "edit" : "create"}
        postId={editingPost?.id}
        initialData={editingPost || undefined}
        authorType="accountant"
      />

      <PostStatsModal
        isOpen={showStatsModal}
        onClose={() => setShowStatsModal(false)}
        postId={statsPostId || ""}
        postTitle={statsPostTitle}
      />
    </div>
  );
}
