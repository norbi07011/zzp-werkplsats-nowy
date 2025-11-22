import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { getPosts } from "../../src/services/feedService";
import { Animated3DProfileBackground } from "../../components/Animated3DProfileBackground";
import type { Post } from "../../src/services/feedService";
import {
  User,
  Mail,
  ArrowLeft,
  Calendar,
  CheckCircleIcon,
} from "../../components/icons";
import { PostCardPremium } from "../FeedPage_PREMIUM";

interface AdminProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string | null;
  role: string | null;
}

export default function AdminPublicProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [admin, setAdmin] = useState<AdminProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"about" | "posts">("about");

  useEffect(() => {
    const abortController = new AbortController();
    let isMounted = true;

    if (id) {
      loadAdminData(abortController.signal, isMounted);
    }

    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, [id]);

  async function loadAdminData(
    signal?: AbortSignal,
    isMounted: boolean = true
  ) {
    if (!id) return;

    try {
      if (!isMounted) return;
      setLoading(true);

      // Load admin profile
      const { data: adminData, error: adminError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", id)
        .eq("role", "admin")
        .maybeSingle();

      if (adminError) {
        console.error("Error loading admin profile:", adminError);
        if (!isMounted) return;
        setLoading(false);
        return;
      }

      if (!adminData) {
        console.error("Admin not found");
        if (!isMounted) return;
        setLoading(false);
        return;
      }

      if (!isMounted) return;
      setAdmin(adminData as AdminProfile);

      // Load admin posts
      try {
        const postsData = await getPosts({
          author_id: id,
          author_type: "admin",
          limit: 20,
        });

        if (!isMounted) return;
        setPosts(postsData || []);
      } catch (postsError) {
        console.error("Error loading admin posts:", postsError);
        if (!isMounted) return;
        setPosts([]);
      }
    } catch (error) {
      console.error("Error in loadAdminData:", error);
    } finally {
      if (isMounted) {
        setLoading(false);
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!admin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Administrator niet gevonden
          </h2>
          <button
            onClick={() => navigate(-1)}
            className="text-blue-600 hover:text-blue-800 flex items-center gap-2 mx-auto"
          >
            <ArrowLeft className="w-5 h-5" />
            Terug
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* 3D Background Layer */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden perspective-container">
        <Animated3DProfileBackground role="admin" opacity={0.25} />
      </div>

      <div className="relative z-10">
        {/* Header with back button */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Wstecz</span>
            </button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Profile Header Card */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8 border border-gray-100">
            {/* Cover Image */}
            <div className="h-48 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 relative">
              <div className="absolute inset-0 bg-black/10"></div>
            </div>

            {/* Profile Info */}
            <div className="relative px-8 pb-8">
              {/* Avatar */}
              <div className="flex items-end justify-between -mt-16 mb-6">
                <div className="relative">
                  {admin.avatar_url ? (
                    <img
                      src={admin.avatar_url}
                      alt={admin.full_name || "Administrator"}
                      className="w-32 h-32 rounded-full border-4 border-white shadow-xl object-cover bg-white"
                    />
                  ) : (
                    <div className="w-32 h-32 rounded-full border-4 border-white shadow-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                      <CheckCircleIcon className="w-16 h-16 text-white" />
                    </div>
                  )}
                  <div className="absolute bottom-2 right-2 w-6 h-6 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center">
                    <CheckCircleIcon className="w-3 h-3 text-white" />
                  </div>
                </div>
              </div>

              {/* Name and Role */}
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-gray-900">
                    {admin.full_name || "Administrator"}
                  </h1>
                  <div className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-semibold rounded-full flex items-center gap-1">
                    <CheckCircleIcon className="w-4 h-4" />
                    Administrator
                  </div>
                </div>
                <p className="text-gray-600 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  {admin.email}
                </p>
              </div>

              {/* Stats */}
              <div className="flex gap-6 mb-6 pb-6 border-b border-gray-200">
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {posts.length}
                  </div>
                  <div className="text-sm text-gray-600">Posts</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {admin.created_at
                      ? new Date(admin.created_at).toLocaleDateString("nl-NL", {
                          year: "numeric",
                          month: "long",
                        })
                      : "Onbekend"}
                  </div>
                  <div className="text-sm text-gray-600">Lid sinds</div>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setActiveTab("about")}
                  className={`flex-1 px-4 py-2 rounded-md font-medium transition-all ${
                    activeTab === "about"
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Over
                </button>
                <button
                  onClick={() => setActiveTab("posts")}
                  className={`flex-1 px-4 py-2 rounded-md font-medium transition-all ${
                    activeTab === "posts"
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Posts ({posts.length})
                </button>
              </div>
            </div>
          </div>

          {/* Tab Content */}
          <div className="space-y-6">
            {activeTab === "about" && (
              <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Over Administrator
                  </h2>
                </div>

                <div className="prose prose-lg max-w-none text-gray-600">
                  <p>
                    Dit is het officiële administratorprofiel van het ZZP
                    Werkplaats platform. Admins beheren het platform en delen
                    belangrijke updates, aankondigingen en informatie met de
                    community.
                  </p>
                </div>

                <div className="mt-8 p-6 bg-blue-50 rounded-xl border border-blue-100">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <CheckCircleIcon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">
                        Geverifieerd Platform Beheerder
                      </h3>
                      <p className="text-sm text-gray-600">
                        Dit account wordt beheerd door het ZZP Werkplaats team
                        voor officiële platformcommunicatie.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "posts" && (
              <div className="space-y-6">
                {posts.length > 0 ? (
                  posts.map((post) => (
                    <PostCardPremium
                      key={post.id}
                      post={post}
                      onLike={() => {}}
                      onComment={() => {}}
                      onShare={() => {}}
                      onReactionChange={() => {}}
                    />
                  ))
                ) : (
                  <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-gray-100">
                    <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Nog geen posts
                    </h3>
                    <p className="text-gray-600">
                      Deze administrator heeft nog geen posts gedeeld.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
