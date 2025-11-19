import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../src/lib/supabase";
import {
  getPosts,
  createPost,
  likePost,
  unlikePost,
  createComment,
  getPostComments,
  sharePost,
  type Post,
  type PostComment,
  type PostType,
  type CreatePostData,
} from "../src/services/feedService";
import {
  uploadMultipleFeedMedia,
  type MediaUploadResult,
} from "../src/services/storage";
import {
  Star,
  MessageSquare,
  User,
  Briefcase,
  MapPin,
  Calendar,
  Upload,
  X,
  Image,
  Video,
} from "../components/icons";
import { LoadingOverlay } from "../components/Loading";
import { ShareModal } from "../components/ShareModal";

export default function FeedPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreatePost, setShowCreatePost] = useState(false);

  // Can create posts: only employers and accountants
  const canCreatePost =
    user?.role === "employer" || user?.role === "accountant";

  useEffect(() => {
    loadFeed();
  }, []);

  const loadFeed = async () => {
    try {
      setLoading(true);
      console.log(
        "[FEED] Loading feed for user:",
        user?.id,
        "role:",
        user?.role
      );

      // Get current user's role-specific ID for post authorship
      // (posts.author_id uses role-specific IDs like accountants.id, workers.id)
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

      console.log("[FEED] Current user ID:", currentUserId);
      // Pass user.id (profile_id) for likes, currentUserId for post authorship
      const data = await getPosts({ limit: 20, currentUserId: user?.id });
      console.log("[FEED] Posts loaded:", data.length, "posts");
      console.log("[FEED] Posts:", data);
      setPosts(data);
    } catch (error) {
      console.error("[FEED] Error loading feed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId: string, currentlyLiked: boolean) => {
    if (!user?.id || !user?.role) return;

    try {
      // Use profile_id (auth.uid()) directly for likes - no need to query role table
      const profileId = user.id;

      if (currentlyLiked) {
        await unlikePost(postId, profileId);
      } else {
        await likePost(postId, profileId, user.role as any);
      }
      // Refresh feed
      await loadFeed();
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  if (loading) {
    return <LoadingOverlay isLoading={true} message="Feed laden..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Feed</h1>
          <p className="text-gray-600">
            Blijf op de hoogte van het laatste nieuws
          </p>
        </div>

        {/* Create Post Button (alleen voor employers en accountants) */}
        {canCreatePost && (
          <div className="mb-6">
            <button
              onClick={() => setShowCreatePost(!showCreatePost)}
              className="w-full bg-white rounded-lg shadow-sm p-4 text-left hover:shadow-md transition-shadow border-2 border-dashed border-gray-300 hover:border-amber-500"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-amber-600" />
                </div>
                <span className="text-gray-600">
                  {showCreatePost
                    ? "Annuleren"
                    : "Deel iets met de community..."}
                </span>
              </div>
            </button>
          </div>
        )}

        {/* Create Post Form */}
        {showCreatePost && canCreatePost && user && (
          <CreatePostForm
            userId={user.id}
            userRole={user.role as "employer" | "accountant"}
            onPostCreated={() => {
              setShowCreatePost(false);
              loadFeed();
            }}
            onCancel={() => setShowCreatePost(false)}
          />
        )}

        {/* Posts Feed */}
        <div className="space-y-6">
          {posts.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <div className="text-gray-400 mb-4">
                <MessageSquare className="w-16 h-16 mx-auto" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Nog geen posts
              </h3>
              <p className="text-gray-600">
                {canCreatePost
                  ? "Wees de eerste om iets te delen!"
                  : "Zodra er posts zijn, verschijnen ze hier."}
              </p>
            </div>
          ) : (
            posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onLike={() => handleLike(post.id, post.user_has_liked || false)}
                onComment={loadFeed}
                onShare={loadFeed}
                currentUserId={user?.id}
                currentUserRole={user?.role}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// =====================================================
// CREATE POST FORM COMPONENT
// =====================================================

interface CreatePostFormProps {
  userId: string;
  userRole: "employer" | "accountant";
  onPostCreated: () => void;
  onCancel: () => void;
}

function CreatePostForm({
  userId,
  userRole,
  onPostCreated,
  onCancel,
}: CreatePostFormProps) {
  const [postType, setPostType] = useState<PostType>("announcement");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Media upload states - re-enabled with proper error handling
  const MEDIA_UPLOAD_ENABLED = true;
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [mediaPreview, setMediaPreview] = useState<
    { file: File; preview: string; type: "image" | "video" }[]
  >([]);

  // Job offer specific fields
  const [jobCategory, setJobCategory] = useState("");
  const [jobLocation, setJobLocation] = useState("");
  const [jobSalaryMin, setJobSalaryMin] = useState("");
  const [jobSalaryMax, setJobSalaryMax] = useState("");

  // Media handling functions
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Validate file count (max 10)
    const currentCount = selectedFiles.length;
    const newCount = currentCount + files.length;
    if (newCount > 10) {
      alert("Maksymalnie 10 plików na post");
      return;
    }

    // Validate file types and sizes
    const validFiles: File[] = [];
    const invalidFiles: string[] = [];

    files.forEach((file) => {
      const isImage = file.type.startsWith("image/");
      const isVideo = file.type.startsWith("video/");
      const isValidSize = file.size <= 20 * 1024 * 1024; // 20MB

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

      // Generate previews
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

    // Reset input
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

      // Upload media files first if any - with better error handling
      let mediaUrls: string[] = [];
      let mediaTypes: string[] = [];

      if (selectedFiles.length > 0) {
        try {
          setUploadingMedia(true);
          console.log(
            `📤 Uploading ${selectedFiles.length} files for user: ${userId}`
          );

          const uploadResult = await uploadMultipleFeedMedia(
            selectedFiles,
            userId
          );

          if (uploadResult.success) {
            mediaUrls = uploadResult.urls;
            mediaTypes = uploadResult.types;
            console.log(
              "✅ Media uploaded successfully:",
              mediaUrls.length,
              "files"
            );
          } else {
            console.warn("⚠️ Media upload failed:", uploadResult.error);
            alert(
              `Ostrzeżenie: ${uploadResult.error}. Post zostanie utworzony bez mediów.`
            );
          }
        } catch (uploadError) {
          console.error("❌ Media upload error:", uploadError);
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
      };

      // Add job offer metadata if applicable
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

      console.log("📝 Creating post with media:", mediaUrls.length, "files");
      await createPost(postData);
      console.log("✅ Post created successfully!");

      // Reset form
      setTitle("");
      setContent("");
      setJobCategory("");
      setJobLocation("");
      setJobSalaryMin("");
      setJobSalaryMax("");
      setSelectedFiles([]);
      setMediaPreview([]);

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
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      <form onSubmit={handleSubmit}>
        {/* Post Type Selector */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Type post
          </label>
          <div className="flex flex-wrap gap-2">
            {(
              [
                "announcement",
                "job_offer",
                "ad",
                "story",
                "service",
              ] as PostType[]
            ).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setPostType(type)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  postType === type
                    ? "bg-amber-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {type === "announcement" && "📢 Aankondiging"}
                {type === "job_offer" && "💼 Vacature"}
                {type === "ad" && "📣 Advertentie"}
                {type === "story" && "📝 Verhaal"}
                {type === "service" && "🛠️ Dienst"}
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div className="mb-4">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Titel (optioneel)"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          />
        </div>

        {/* Content */}
        <div className="mb-4">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Wat wil je delen?"
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
            required
          />
        </div>

        {/* Job Offer Fields */}
        {postType === "job_offer" && (
          <div className="mb-4 p-4 bg-gray-50 rounded-lg space-y-3">
            <h4 className="font-medium text-gray-900">Vacature details</h4>

            <input
              type="text"
              value={jobCategory}
              onChange={(e) => setJobCategory(e.target.value)}
              placeholder="Categorie (bijv. Bouw, IT, Zorg)"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />

            <input
              type="text"
              value={jobLocation}
              onChange={(e) => setJobLocation(e.target.value)}
              placeholder="Locatie (bijv. Amsterdam, Rotterdam)"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />

            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                value={jobSalaryMin}
                onChange={(e) => setJobSalaryMin(e.target.value)}
                placeholder="Min. salaris (€/uur)"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
              <input
                type="number"
                value={jobSalaryMax}
                onChange={(e) => setJobSalaryMax(e.target.value)}
                placeholder="Max. salaris (€/uur)"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>
          </div>
        )}

        {/* Media Upload - re-enabled with better error handling */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-3">
            <label
              htmlFor="media-upload"
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer transition-colors"
            >
              <Upload className="w-4 h-4" />
              <span className="text-sm">Zdjęcia/Filmy</span>
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
            <span className="text-xs text-gray-500">
              Max 10 plików, 20MB każdy
            </span>
          </div>

          {/* Media Preview */}
          {mediaPreview.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {mediaPreview.map((media, index) => (
                <div
                  key={index}
                  className="relative bg-gray-100 rounded-lg overflow-hidden group"
                >
                  {media.type === "image" ? (
                    <img
                      src={media.preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-24 object-cover"
                    />
                  ) : (
                    <div className="w-full h-24 bg-gray-200 flex items-center justify-center">
                      <Video className="w-8 h-8 text-gray-500" />
                      <span className="ml-2 text-xs text-gray-600 truncate max-w-[100px]">
                        {media.file.name}
                      </span>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => removeMedia(index)}
                    className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>

                  <div className="absolute bottom-1 left-1 px-1 py-0.5 bg-black bg-opacity-60 text-white text-xs rounded">
                    {media.type === "image" ? (
                      <Image className="w-3 h-3" />
                    ) : (
                      <Video className="w-3 h-3" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {uploadingMedia && (
            <div className="flex items-center gap-2 text-sm text-amber-600 mt-2">
              <div className="animate-spin w-4 h-4 border-2 border-amber-600 border-t-transparent rounded-full"></div>
              <span>Przesyłanie mediów...</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Annuleren
          </button>
          <button
            type="submit"
            disabled={submitting || uploadingMedia || !content.trim()}
            className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting || uploadingMedia ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                {uploadingMedia ? "Przesyłanie..." : "Zapisywanie..."}
              </div>
            ) : (
              "Plaatsen"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

// =====================================================
// POST CARD COMPONENT
// =====================================================

interface PostCardProps {
  post: Post;
  onLike: () => void;
  onComment: () => void;
  onShare: () => void;
  currentUserId?: string;
  currentUserRole?: string;
}

function PostCard({
  post,
  onLike,
  onComment,
  onShare,
  currentUserId,
  currentUserRole,
}: PostCardProps) {
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<PostComment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  const loadComments = async () => {
    try {
      setLoadingComments(true);
      const data = await getPostComments(post.id);
      setComments(data);
    } catch (error) {
      console.error("Error loading comments:", error);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleShowComments = () => {
    if (!showComments) {
      loadComments();
    }
    setShowComments(!showComments);
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!commentText.trim() || !currentUserId || !currentUserRole) {
      return;
    }

    try {
      setIsSubmittingComment(true);

      // Get the actual user_id from the role-specific table
      let actualUserId: string = "";

      if (currentUserRole === "worker") {
        const { data } = await supabase
          .from("workers")
          .select("id")
          .eq("profile_id", currentUserId)
          .single();
        actualUserId = data?.id || "";
      } else if (currentUserRole === "employer") {
        const { data } = await supabase
          .from("employers")
          .select("id")
          .eq("profile_id", currentUserId)
          .single();
        actualUserId = data?.id || "";
      } else if (currentUserRole === "accountant") {
        const { data } = await supabase
          .from("accountants")
          .select("id")
          .eq("profile_id", currentUserId)
          .single();
        actualUserId = data?.id || "";
      }

      if (!actualUserId) {
        console.error("Could not find user ID for role:", currentUserRole);
        alert("Fout bij het plaatsen van reactie. Probeer het opnieuw.");
        return;
      }

      await createComment(
        post.id,
        actualUserId, // Now always string
        currentUserRole as any,
        commentText.trim()
      );

      setCommentText("");
      await loadComments(); // Reload comments
    } catch (error) {
      console.error("Error posting comment:", error);
      alert("Fout bij het plaatsen van reactie. Probeer het opnieuw.");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleShare = async () => {
    // Open share modal instead of directly calling sharePost
    setShowShareModal(true);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m geleden`;
    if (diffHours < 24) return `${diffHours}u geleden`;
    if (diffDays < 7) return `${diffDays}d geleden`;
    return date.toLocaleDateString("nl-NL");
  };

  return (
    <div className="bg-white rounded-lg shadow-sm">
      {/* Post Header */}
      <div className="p-6 pb-4">
        <div className="flex items-start gap-3 mb-4">
          {/* Avatar */}
          <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
            {post.author_name?.charAt(0) || "U"}
          </div>

          {/* Author Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900">{post.author_name}</h3>
            {post.author_company && (
              <p className="text-sm text-gray-600">{post.author_company}</p>
            )}
            <p className="text-xs text-gray-500">
              {formatDate(post.published_at)}
            </p>
          </div>

          {/* Post Type Badge */}
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium ${
              post.type === "job_offer"
                ? "bg-blue-100 text-blue-700"
                : post.type === "ad"
                ? "bg-purple-100 text-purple-700"
                : post.type === "service"
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            {post.type === "job_offer" && "💼 Vacature"}
            {post.type === "ad" && "📣 Advertentie"}
            {post.type === "announcement" && "📢 Aankondiging"}
            {post.type === "story" && "📝 Verhaal"}
            {post.type === "service" && "🛠️ Dienst"}
          </span>
        </div>

        {/* Post Title */}
        {post.title && (
          <h2 className="text-xl font-bold text-gray-900 mb-2">{post.title}</h2>
        )}

        {/* Post Content */}
        <p className="text-gray-700 whitespace-pre-wrap mb-4">{post.content}</p>

        {/* Media Gallery */}
        {post.media_urls && post.media_urls.length > 0 && (
          <div className="mb-4">
            <div
              className={`grid gap-2 ${
                post.media_urls.length === 1
                  ? "grid-cols-1"
                  : post.media_urls.length === 2
                  ? "grid-cols-2"
                  : post.media_urls.length === 3
                  ? "grid-cols-3"
                  : "grid-cols-2"
              }`}
            >
              {post.media_urls.map((mediaUrl, index) => {
                const mediaType = post.media_types?.[index] || "image";

                return (
                  <div
                    key={index}
                    className={`relative bg-gray-900 rounded-lg overflow-hidden group ${
                      post.media_urls!.length === 1 ? "col-span-full" : ""
                    }`}
                  >
                    {mediaType === "image" ? (
                      <img
                        src={mediaUrl}
                        alt={`Media ${index + 1}`}
                        className={`w-full ${
                          post.media_urls!.length === 1
                            ? "max-h-[600px] object-contain"
                            : "h-64 object-cover"
                        } hover:opacity-95 transition-opacity cursor-pointer bg-black`}
                        onClick={() => window.open(mediaUrl, "_blank")}
                      />
                    ) : (
                      <video
                        src={mediaUrl}
                        controls
                        className={`w-full ${
                          post.media_urls!.length === 1
                            ? "max-h-[600px]"
                            : "h-64"
                        } bg-black`}
                        preload="metadata"
                        style={{ objectFit: "contain" }}
                      >
                        Twoja przeglądarka nie obsługuje odtwarzania wideo.
                      </video>
                    )}

                    {/* Media type indicator */}
                    <div className="absolute top-2 right-2 px-2 py-1 bg-black bg-opacity-60 text-white text-xs rounded flex items-center gap-1">
                      {mediaType === "image" ? (
                        <Image className="w-3 h-3" />
                      ) : (
                        <Video className="w-3 h-3" />
                      )}
                      <span className="capitalize">{mediaType}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Media count indicator */}
            {post.media_urls.length > 4 && (
              <div className="text-center mt-2">
                <span className="text-sm text-gray-500">
                  +{post.media_urls.length - 4} więcej plików
                </span>
              </div>
            )}
          </div>
        )}

        {/* Job Offer Details */}
        {post.type === "job_offer" && (
          <div className="bg-blue-50 rounded-lg p-4 space-y-2 mb-4">
            {post.job_category && (
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Briefcase className="w-4 h-4" />
                <span>{post.job_category}</span>
              </div>
            )}
            {post.job_location && (
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <MapPin className="w-4 h-4" />
                <span>{post.job_location}</span>
              </div>
            )}
            {(post.job_salary_min || post.job_salary_max) && (
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <span className="font-medium">Salaris:</span>
                <span>
                  €{post.job_salary_min || "?"} - €{post.job_salary_max || "?"}{" "}
                  /uur
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Post Actions */}
      <div className="px-6 py-3 border-t border-gray-100 flex items-center gap-6">
        {/* Like Button */}
        <button
          onClick={onLike}
          className={`flex items-center gap-2 transition-colors ${
            post.user_has_liked
              ? "text-red-600"
              : "text-gray-600 hover:text-red-600"
          }`}
        >
          <Star
            className={`w-5 h-5 ${post.user_has_liked ? "fill-red-600" : ""}`}
          />
          <span className="text-sm font-medium">{post.likes_count}</span>
        </button>

        {/* Comment Button */}
        <button
          onClick={handleShowComments}
          className="flex items-center gap-2 text-gray-600 hover:text-amber-600 transition-colors"
        >
          <MessageSquare className="w-5 h-5" />
          <span className="text-sm font-medium">{post.comments_count}</span>
        </button>

        {/* Share Count (non-clickable for now) */}
        <button
          onClick={handleShare}
          className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
        >
          <span className="text-sm font-medium">
            {post.shares_count} shares
          </span>
        </button>

        {/* Views */}
        <div className="flex items-center gap-2 text-gray-600 ml-auto">
          <span className="text-sm">{post.views_count} weergaven</span>
        </div>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
          {loadingComments ? (
            <div className="text-center py-4 text-gray-600">
              Reacties laden...
            </div>
          ) : (
            <>
              {/* Comments List */}
              <div className="space-y-4 mb-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-xs font-bold text-gray-600 flex-shrink-0">
                      {comment.user_name?.charAt(0) || "U"}
                    </div>
                    <div className="flex-1">
                      <div className="bg-white rounded-lg p-3">
                        <p className="text-sm font-medium text-gray-900">
                          {comment.user_name}
                        </p>
                        <p className="text-sm text-gray-700">
                          {comment.content}
                        </p>
                      </div>
                      <div className="flex items-center gap-4 mt-1 px-3">
                        <span className="text-xs text-gray-500">
                          {formatDate(comment.created_at)}
                        </span>
                        <button className="text-xs text-gray-600 hover:text-amber-600">
                          Vind ik leuk ({comment.likes_count})
                        </button>
                        <button className="text-xs text-gray-600 hover:text-amber-600">
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
                    <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-xs font-bold text-gray-600 flex-shrink-0">
                      U
                    </div>
                    <div className="flex-1">
                      <textarea
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder="Schrijf een reactie..."
                        rows={2}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
                        disabled={isSubmittingComment}
                      />
                      <div className="flex items-center justify-end gap-2 mt-2">
                        <button
                          type="submit"
                          disabled={!commentText.trim() || isSubmittingComment}
                          className="px-4 py-2 bg-amber-600 text-white text-sm rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isSubmittingComment ? "Plaatsen..." : "Reageren"}
                        </button>
                      </div>
                    </div>
                  </div>
                </form>
              )}

              {!currentUserId && (
                <div className="text-sm text-gray-500 text-center py-2">
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
    </div>
  );
}
