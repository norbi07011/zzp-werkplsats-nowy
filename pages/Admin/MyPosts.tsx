/**
 * ╔═══════════════════════════════════════════════════════════════════╗
 * ║               📋 MY POSTS MANAGEMENT - ADMIN                      ║
 * ║                                                                   ║
 * ║  Panel zarządzania postami admina + moderacja                     ║
 * ║  Features: Wszystkie + moderacja cudzych postów                  ║
 * ╚═══════════════════════════════════════════════════════════════════╝
 */

import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { PostFormModal } from "../../components/PostFormModal";
import { PostStatsModal } from "../../components/PostStatsModal";
import {
  type Post,
  type PostType,
  getMyPosts,
  getPosts,
  togglePostActive as togglePostActiveService,
  softDeletePost,
  getPostStats,
} from "../../src/services/feedService";
import {
  Eye,
  Heart,
  MessageSquare,
  Bookmark,
  TrendingUp,
  Filter,
  Plus,
  Settings,
  User,
} from "../../components/icons";

export default function MyPosts() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<PostType | "all">("all");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [viewMode, setViewMode] = useState<"my" | "all">("my"); // Admin może widzieć wszystkie posty

  useEffect(() => {
    loadPosts();
  }, [filterType, filterStatus, viewMode]);

  const loadPosts = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      if (viewMode === "my") {
        const data = await getMyPosts(user.id);
        setPosts(data);
      } else {
        const data = await getPosts({ limit: 1000 }); // Wszystkie posty dla moderacji
        setPosts(data);
      }
    } catch (error) {
      console.error("Error loading posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const togglePostActive = async (postId: string, currentStatus: boolean) => {
    try {
      await togglePostActiveService(postId, currentStatus);
      loadPosts();
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

  const moderatePost = (postId: string) => {
    // TODO: Admin może moderować cudze posty (dezaktywować za spam)
    console.log("Moderate post:", postId);
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
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-black bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
              📋 Zarządzanie Postami (Admin)
            </h1>
            <p className="text-gray-600 mt-2">
              Zarządzaj swoimi postami + moderacja całej platformy
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

      {/* View Mode Toggle (Admin Only) */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-lg border border-white/40 p-4">
          <div className="flex items-center gap-4">
            <Settings className="w-5 h-5 text-gray-700" />
            <span className="text-sm font-bold text-gray-700">Widok:</span>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode("my")}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                  viewMode === "my"
                    ? "bg-red-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <User className="w-4 h-4 inline mr-1" />
                Moje posty
              </button>
              <button
                onClick={() => setViewMode("all")}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                  viewMode === "all"
                    ? "bg-orange-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <Settings className="w-4 h-4 inline mr-1" />
                Wszystkie posty (moderacja)
              </button>
            </div>
          </div>
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
            {/* Type Filter */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Typ postu
              </label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-red-500 focus:ring-4 focus:ring-red-100 transition-all"
              >
                <option value="all">🌟 Wszystkie typy</option>
                <option value="job_offer">💼 Oferty pracy</option>
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
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 transition-all"
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
              className="text-sm text-red-600 hover:text-red-700 font-medium"
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
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-red-600 mx-auto"></div>
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
                : viewMode === "my"
                ? "Nie masz jeszcze żadnych postów. Utwórz pierwszy!"
                : "Brak postów do moderacji"}
            </p>
            {viewMode === "my" && (
              <button
                onClick={() => window.history.back()}
                className="px-6 py-3 bg-gradient-to-r from-red-500 to-orange-600 text-white rounded-xl font-bold hover:shadow-lg transform hover:scale-105 transition-all"
              >
                Utwórz pierwszy post
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                isAdmin={true}
                isMyPost={post.author_id === user?.id}
                onToggleActive={togglePostActive}
                onEdit={editPost}
                onDelete={deletePost}
                onViewStats={viewStats}
                onModerate={moderatePost}
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
        authorType="admin"
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

/**
 * PostCard Component - Admin version z moderacją
 */
interface PostCardProps {
  post: Post;
  isAdmin: boolean;
  isMyPost: boolean;
  onToggleActive: (postId: string, currentStatus: boolean) => void;
  onEdit: (postId: string) => void;
  onDelete: (postId: string) => void;
  onViewStats: (postId: string) => void;
  onModerate: (postId: string) => void;
}

function PostCard({
  post,
  isAdmin,
  isMyPost,
  onToggleActive,
  onEdit,
  onDelete,
  onViewStats,
  onModerate,
}: PostCardProps) {
  const getTypeBadge = () => {
    switch (post.type) {
      case "job_offer":
        return (
          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold">
            💼 Oferta pracy
          </span>
        );
      case "ad":
        return (
          <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-bold">
            📣 Reklama
          </span>
        );
      case "announcement":
        return (
          <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-bold">
            📢 Ogłoszenie
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className={`bg-white/90 backdrop-blur-xl rounded-2xl shadow-lg border-2 p-6 transition-all hover:shadow-2xl hover:scale-105 ${
        post.is_active ? "border-green-200" : "border-gray-200 opacity-60"
      } ${!isMyPost ? "border-orange-300" : ""}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex flex-col gap-2">
          {getTypeBadge()}
          {!isMyPost && (
            <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-bold">
              👤 Cudzy post
            </span>
          )}
        </div>
        <div
          className={`px-3 py-1 rounded-full text-xs font-bold ${
            post.is_active
              ? "bg-green-100 text-green-800"
              : "bg-gray-100 text-gray-800"
          }`}
        >
          {post.is_active ? "✅ Aktywny" : "⛔ Nieaktywny"}
        </div>
      </div>

      {/* Title & Content */}
      <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
        {post.title || "Bez tytułu"}
      </h3>
      <p className="text-gray-600 text-sm mb-4 line-clamp-3">{post.content}</p>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2 mb-4 pb-4 border-b border-gray-200">
        <div className="text-center">
          <Eye className="w-4 h-4 mx-auto text-gray-500 mb-1" />
          <p className="text-xs font-bold text-gray-900">
            {post.views_count || 0}
          </p>
        </div>
        <div className="text-center">
          <Heart className="w-4 h-4 mx-auto text-red-500 mb-1" />
          <p className="text-xs font-bold text-gray-900">
            {post.likes_count || 0}
          </p>
        </div>
        <div className="text-center">
          <MessageSquare className="w-4 h-4 mx-auto text-blue-500 mb-1" />
          <p className="text-xs font-bold text-gray-900">
            {post.comments_count || 0}
          </p>
        </div>
        <div className="text-center">
          <Bookmark className="w-4 h-4 mx-auto text-amber-500 mb-1" />
          <p className="text-xs font-bold text-gray-900">
            {post.shares_count || 0}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => onToggleActive(post.id, post.is_active)}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
            post.is_active
              ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
              : "bg-green-100 text-green-700 hover:bg-green-200"
          }`}
        >
          {post.is_active ? "⛔ Dezaktywuj" : "✅ Aktywuj"}
        </button>

        <button
          onClick={() => onViewStats(post.id)}
          className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-bold hover:bg-blue-200 transition-all flex items-center justify-center gap-1"
        >
          <TrendingUp className="w-4 h-4" />
          Statystyki
        </button>

        {isMyPost && (
          <button
            onClick={() => onEdit(post.id)}
            className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg text-sm font-bold hover:bg-purple-200 transition-all flex items-center justify-center gap-1"
          >
            ✏️ Edytuj
          </button>
        )}

        {isAdmin && !isMyPost && (
          <button
            onClick={() => onModerate(post.id)}
            className="px-4 py-2 bg-orange-100 text-orange-700 rounded-lg text-sm font-bold hover:bg-orange-200 transition-all flex items-center justify-center gap-1"
          >
            <Settings className="w-4 h-4" />
            Moderuj
          </button>
        )}

        <button
          onClick={() => onDelete(post.id)}
          className="px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-bold hover:bg-red-200 transition-all flex items-center justify-center gap-1"
        >
          🗑️ Usuń
        </button>
      </div>

      {/* Date */}
      <p className="text-xs text-gray-500 mt-4 text-center">
        Utworzono: {new Date(post.created_at).toLocaleDateString("pl-PL")}
      </p>
    </div>
  );
}
