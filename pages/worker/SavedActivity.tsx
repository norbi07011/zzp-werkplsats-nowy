/**
 * ===============================================
 * SAVED ACTIVITY - Worker (Consumer)
 * ===============================================
 * Historia aktywności dla odbiorców:
 * - 4 foldery: do_aplikowania, polubiane, moje_reakcje (wszystkie typy), komentowane
 * - Bez specjalnego folderu "reakcje na oferty" (tylko dla twórców)
 */

import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../src/lib/supabase";
import {
  getSavedPostsByFolder,
  getLikedPosts,
  getCommentedPosts,
  likePost,
  reactToPost,
  unreactToPost,
  type Post,
  type ReactionType,
} from "../../src/services/feedService";
import { PostCardPremium } from "../FeedPage_PREMIUM";

type FolderType =
  | "do_aplikowania"
  | "polubiane"
  | "moje_reakcje"
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
    moje_reakcje: 0,
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
      id: "moje_reakcje",
      label: "Moje reakcje",
      icon: "😊",
      description: "Wszystkie posty z reakcją emoji",
      count: counts.moje_reakcje,
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

      if (folder === "polubiane" || folder === "moje_reakcje") {
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
      const [saved, liked, commented] = await Promise.all([
        getSavedPostsByFolder(user.id, "do_aplikowania"),
        getLikedPosts(user.id),
        getCommentedPosts(user.id),
      ]);

      setCounts({
        do_aplikowania: saved.length,
        polubiane: liked.length,
        moje_reakcje: liked.length, // Same as polubiane for consumers
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
    <div className="flex h-screen bg-gradient-to-br from-green-50 via-teal-50 to-cyan-50">
      {/* Sidebar */}
      <aside className="w-80 bg-white/80 backdrop-blur-md border-r border-gray-200 shadow-xl">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-teal-600 mb-2">
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
                    ? "bg-gradient-to-r from-green-600 to-teal-600 text-white shadow-lg scale-105"
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
          <div className="bg-gradient-to-r from-green-100 to-teal-100 rounded-xl p-4">
            <p className="text-sm text-gray-600 mb-2">Łącznie</p>
            <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-teal-600">
              {counts.do_aplikowania + counts.polubiane + counts.komentowane}
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
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-600 border-t-transparent"></div>
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
                {activeFolder === "do_aplikowania" &&
                  "Użyj przycisku Zakładka aby zapisać posty na później"}
                {activeFolder === "polubiane" &&
                  "Zareaguj na posty aby zobaczyć je tutaj"}
                {activeFolder === "moje_reakcje" &&
                  "Zareaguj emoji na posty aby zobaczyć je tutaj"}
                {activeFolder === "komentowane" &&
                  "Skomentuj posty aby zobaczyć je tutaj"}
              </p>
            </div>
          ) : (
            /* Posts Grid with PostCardPremium */
            <div className="grid grid-cols-1 gap-6">
              {posts.map((post) => (
                <PostCardPremium
                  key={post.id}
                  post={post}
                  onLike={async () => {
                    if (!user) return;
                    const workerId = await (async () => {
                      const { data } = await (supabase as any)
                        .from("worker_profiles")
                        .select("id")
                        .eq("profile_id", user.id)
                        .single();
                      return data?.id || user.id;
                    })();
                    await likePost(post.id, workerId, "worker");
                  }}
                  onReactionChange={async (
                    reactionType: ReactionType | null
                  ) => {
                    if (!user) return;
                    const workerId = await (async () => {
                      const { data } = await (supabase as any)
                        .from("worker_profiles")
                        .select("id")
                        .eq("profile_id", user.id)
                        .single();
                      return data?.id || user.id;
                    })();
                    if (reactionType === null) {
                      await unreactToPost(post.id, user.id);
                    } else {
                      await reactToPost(
                        post.id,
                        workerId,
                        "worker",
                        user.id,
                        reactionType
                      );
                    }
                  }}
                  currentUserId={user?.id}
                  currentUserRole={user?.role}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
