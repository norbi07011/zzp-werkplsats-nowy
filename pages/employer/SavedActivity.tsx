/**
 * ===============================================
 * SAVED ACTIVITY - Employer
 * ===============================================
 * Historia aktywności na tablicy:
 * - 4 foldery: do_aplikowania, polubiane, moje_reakcje_job_offers, komentowane
 * - Grid postów z każdego folderu
 * - Sidebar z licznikami
 */

import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import {
  getSavedPostsByFolder,
  getLikedPosts,
  getJobOfferReactions,
  getCommentedPosts,
  type Post,
} from "../../src/services/feedService";

type FolderType =
  | "do_aplikowania"
  | "polubiane"
  | "reactions_jobs"
  | "komentowane";

interface FolderConfig {
  id: FolderType;
  label: string;
  icon: string;
  description: string;
  count: number;
}

export default function SavedActivity() {
  const { user } = useAuth();
  const [activeFolder, setActiveFolder] =
    useState<FolderType>("do_aplikowania");
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [counts, setCounts] = useState({
    do_aplikowania: 0,
    polubiane: 0,
    reactions_jobs: 0,
    komentowane: 0,
  });

  const folders: FolderConfig[] = [
    {
      id: "do_aplikowania",
      label: "Do aplikowania później",
      icon: "📁",
      description: "Posty zapisane na później",
      count: counts.do_aplikowania,
    },
    {
      id: "polubiane",
      label: "Polubiane",
      icon: "❤️",
      description: "Posty z moją reakcją",
      count: counts.polubiane,
    },
    {
      id: "reactions_jobs",
      label: "Moje reakcje na oferty",
      icon: "💼",
      description: "Oferty pracy z reakcją",
      count: counts.reactions_jobs,
    },
    {
      id: "komentowane",
      label: "Komentowane",
      icon: "💬",
      description: "Posty gdzie skomentowałem",
      count: counts.komentowane,
    },
  ];

  const loadPosts = async (folder: FolderType) => {
    if (!user?.id) return;

    setLoading(true);
    try {
      let data: Post[] = [];

      if (folder === "reactions_jobs") {
        data = await getJobOfferReactions(user.id);
      } else if (folder === "polubiane") {
        data = await getLikedPosts(user.id);
      } else if (folder === "komentowane") {
        data = await getCommentedPosts(user.id);
      } else {
        data = await getSavedPostsByFolder(user.id, folder);
      }

      setPosts(data);
    } catch (error) {
      console.error("Error loading saved posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadCounts = async () => {
    if (!user?.id) return;

    try {
      const [saved, liked, reactions, commented] = await Promise.all([
        getSavedPostsByFolder(user.id, "do_aplikowania"),
        getLikedPosts(user.id),
        getJobOfferReactions(user.id),
        getCommentedPosts(user.id),
      ]);

      setCounts({
        do_aplikowania: saved.length,
        polubiane: liked.length,
        reactions_jobs: reactions.length,
        komentowane: commented.length,
      });
    } catch (error) {
      console.error("Error loading counts:", error);
    }
  };

  useEffect(() => {
    loadPosts(activeFolder);
  }, [activeFolder, user?.id]);

  useEffect(() => {
    loadCounts();
  }, [user?.id]);

  return (
    <div className="flex h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Sidebar */}
      <aside className="w-80 bg-white/80 backdrop-blur-md border-r border-gray-200 shadow-xl">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-2">
            Historia Aktywności
          </h2>
          <p className="text-sm text-gray-600">
            Twoje zapisane posty i interakcje
          </p>
        </div>

        <nav className="px-4 space-y-2">
          {folders.map((folder) => {
            const isActive = activeFolder === folder.id;
            return (
              <button
                key={folder.id}
                onClick={() => setActiveFolder(folder.id)}
                className={`w-full text-left px-4 py-4 rounded-xl transition-all duration-300 ${
                  isActive
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg scale-105"
                    : "hover:bg-gray-100 text-gray-700"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{folder.icon}</span>
                    <div>
                      <p
                        className={`font-semibold ${
                          isActive ? "text-white" : "text-gray-900"
                        }`}
                      >
                        {folder.label}
                      </p>
                      <p
                        className={`text-xs ${
                          isActive ? "text-white/80" : "text-gray-500"
                        }`}
                      >
                        {folder.description}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-sm font-bold ${
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-gray-200 text-gray-700"
                    }`}
                  >
                    {folder.count}
                  </span>
                </div>
              </button>
            );
          })}
        </nav>

        {/* Stats Summary */}
        <div className="p-6 mt-6 border-t border-gray-200">
          <div className="bg-gradient-to-r from-blue-100 to-purple-100 rounded-xl p-4">
            <p className="text-sm text-gray-600 mb-2">Łącznie</p>
            <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
              {counts.do_aplikowania +
                counts.polubiane +
                counts.reactions_jobs +
                counts.komentowane}
            </p>
            <p className="text-xs text-gray-500 mt-1">Posty w historii</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {folders.find((f) => f.id === activeFolder)?.icon}{" "}
              {folders.find((f) => f.id === activeFolder)?.label}
            </h1>
            <p className="text-gray-600">
              {folders.find((f) => f.id === activeFolder)?.description}
            </p>
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
            </div>
          ) : posts.length === 0 ? (
            /* Empty State */
            <div className="text-center py-20">
              <div className="text-8xl mb-6">
                {folders.find((f) => f.id === activeFolder)?.icon}
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Brak postów w tym folderze
              </h3>
              <p className="text-gray-600 max-w-md mx-auto">
                {activeFolder === "do_aplikowania"
                  ? "Użyj przycisku Zakładka aby zapisać posty na później"
                  : activeFolder === "polubiane"
                  ? "Zareaguj na posty aby zobaczyć je tutaj"
                  : activeFolder === "reactions_jobs"
                  ? "Zareaguj na oferty pracy aby zobaczyć je tutaj"
                  : activeFolder === "komentowane"
                  ? "Skomentuj posty aby zobaczyć je tutaj"
                  : ""}
              </p>
            </div>
          ) : (
            /* Posts Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-shadow duration-300"
                >
                  {/* Post Header */}
                  <div className="p-4 border-b border-gray-100">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                        {post.author_name?.[0]?.toUpperCase() || "U"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 truncate">
                          {post.author_name || "Użytkownik"}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(post.created_at).toLocaleDateString(
                            "pl-PL"
                          )}
                        </p>
                      </div>
                    </div>
                    {/* Type Badge */}
                    <span className="inline-block px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-600">
                      {post.type === "job_offer" && "💼 Oferta pracy"}
                      {post.type === "ad" && "📣 Reklama"}
                      {post.type === "announcement" && "📢 Ogłoszenie"}
                    </span>
                  </div>

                  {/* Post Content */}
                  <div className="p-4">
                    <h3 className="font-bold text-gray-900 mb-2 line-clamp-2">
                      {post.title}
                    </h3>
                    <p className="text-sm text-gray-600 line-clamp-3">
                      {post.content}
                    </p>
                  </div>

                  {/* Post Stats */}
                  <div className="px-4 pb-4 flex items-center gap-4 text-sm text-gray-500">
                    <span>👁️ {post.views_count || 0}</span>
                    <span>❤️ {post.likes_count || 0}</span>
                    <span>💬 {post.comments_count || 0}</span>
                    <span>🔗 {post.shares_count || 0}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
