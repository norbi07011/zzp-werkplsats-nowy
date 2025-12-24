import {
  supabase,
  supabaseService,
  getCurrentUser,
  canUserCreatePosts,
} from "../lib/supabase";

// Type assertion for new tables (until database.types.ts is regenerated)
const supabaseAny = supabase as any;
const supabaseServiceAny = supabaseService as any;

// =====================================================
// TYPES
// =====================================================

export type PostType = "job_offer" | "ad" | "announcement" | "service_request";
export type AuthorType =
  | "worker"
  | "employer"
  | "accountant"
  | "cleaning_company"
  | "admin"
  | "regular_user";
export type UserType =
  | "worker"
  | "employer"
  | "accountant"
  | "cleaning_company"
  | "admin"
  | "regular_user";
export type ReactionType = "like" | "love" | "wow" | "sad" | "angry";
export type SaveFolder =
  | "do_aplikowania"
  | "polubiane"
  | "moje_reakcje"
  | "komentowane";

export interface Post {
  id: string;
  author_id: string;
  author_type: AuthorType;
  type: PostType;
  title?: string;
  content: string;
  media_urls?: string[];
  media_types?: string[];

  // 🔥 NOWE: Pola wspólne dla wszystkich typów postów (dla filtrów)
  location?: string; // Miasto (Amsterdam, Rotterdam, etc.)
  category?: string; // Kategoria branżowa (Budowa, IT, Hydraulika, etc.)
  budget?: number; // Budżet/cena (dla wszystkich typów)

  // Job offer metadata
  job_category?: string;
  job_location?: string;
  job_salary_min?: number;
  job_salary_max?: number;
  job_requirements?: string[];
  job_deadline?: string;

  // ➕ NOWE dla JOB OFFER:
  job_type?: "full_time" | "part_time" | "contract" | "temporary";
  job_hours_per_week?: number;
  job_start_date?: string;
  job_benefits?: string[];
  job_contact_email?: string;
  job_contact_phone?: string;

  // ➕ NOWE dla AD:
  ad_type?: "product" | "service" | "event" | "promotion";
  ad_budget?: number;
  ad_duration_days?: number;
  ad_target_audience?: string[];
  ad_cta_text?: string;
  ad_cta_url?: string;
  ad_website?: string;
  ad_contact_email?: string;
  ad_contact_phone?: string;

  // ➕ NOWE dla ANNOUNCEMENT:
  announcement_category?: "info" | "warning" | "success" | "urgent";
  announcement_priority?: "low" | "medium" | "high";
  announcement_expires_at?: string;
  announcement_tags?: string[];
  announcement_pinned?: boolean;
  announcement_notify_users?: boolean;
  announcement_target_roles?: string[];

  // ➕ NOWE dla SERVICE_REQUEST (Zlecenia):
  request_category?: string; // 'plumbing', 'electrical', 'cleaning', 'moving', 'repair', 'gardening', 'painting', 'other'
  request_location?: string; // Adres/lokalizacja zlecenia
  request_budget_min?: number; // Minimalny budżet w EUR
  request_budget_max?: number; // Maksymalny budżet w EUR
  request_urgency?: "low" | "normal" | "high" | "urgent";
  request_preferred_date?: string; // Preferowana data wykonania
  request_contact_method?: "phone" | "email" | "both";
  request_status?: "open" | "in_progress" | "completed" | "cancelled";
  request_responses_count?: number; // Liczba ofert od workerów
  request_selected_worker_id?: string; // ID wybranego workera

  // Stats
  likes_count: number;
  comments_count: number;
  shares_count: number;
  views_count: number;

  // Status
  is_active: boolean;
  is_pinned: boolean;

  // Timestamps
  created_at: string;
  updated_at: string;
  published_at: string;

  // Computed
  user_has_liked?: boolean;
  user_reaction?: ReactionType; // Reakcja obecnego usera
  reactions?: PostReactionCounts; // Liczniki reakcji
  author_name?: string;
  author_company?: string;
  author_avatar?: string;
  author_profile_id?: string; // Profile ID for public profile links
  author_phone?: string | null; // Phone number for WhatsApp contact (service requests)
}

export interface PostComment {
  id: string;
  post_id: string;
  parent_comment_id?: string;
  user_id: string;
  user_type: UserType;
  content: string;
  likes_count: number;
  created_at: string;
  updated_at: string;

  // Computed
  user_has_liked?: boolean;
  user_reaction?: ReactionType; // Reakcja obecnego usera na komentarz
  reactions?: PostReactionCounts; // Liczniki reakcji na komentarz
  user_name?: string;
  user_avatar?: string;
}

export interface PostLike {
  id: string;
  post_id: string;
  user_id: string;
  user_type: UserType;
  profile_id: string;
  reaction_type: ReactionType;
  created_at: string;
}

export interface PostReactionCounts {
  like: number;
  love: number;
  wow: number;
  sad: number;
  angry: number;
  total: number;
}

export interface PostSave {
  id: string;
  post_id: string;
  user_id: string;
  profile_id: string;
  folder: SaveFolder;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CommentReaction {
  id: string;
  comment_id: string;
  user_id: string;
  profile_id: string;
  reaction_type: ReactionType;
  created_at: string;
}

export interface PostShare {
  id: string;
  post_id: string;
  user_id: string;
  user_type: UserType;
  share_type: string;
  created_at: string;
}

// =====================================================
// REGULAR USER & SERVICE REQUEST TYPES
// =====================================================

export interface RegularUser {
  id: string;
  profile_id: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  city?: string;
  postal_code?: string;
  address?: string;
  requests_posted: number;
  requests_completed: number;
  average_rating: number;
  is_premium: boolean;
  subscription_end_date?: string;
  requests_this_month: number;
  free_requests_limit: number;
  email_notifications: boolean;
  sms_notifications: boolean;
  created_at: string;
  updated_at: string;
}

export interface ServiceRequestResponse {
  id: string;
  post_id: string;
  worker_id: string;
  offered_price?: number;
  estimated_hours?: number;
  message: string;
  availability_date?: string;
  status: "pending" | "accepted" | "rejected" | "withdrawn";
  created_at: string;
  updated_at: string;

  // Computed (joined from worker)
  worker?: {
    id: string;
    profile: {
      full_name?: string;
      avatar_url?: string;
    };
    rating?: number;
    completed_jobs?: number;
    specializations?: string[];
  };
}

export interface CreatePostData {
  author_type: AuthorType;
  type: PostType;
  title?: string;
  content: string;
  media_urls?: string[];
  media_types?: string[];

  // 🔥 NOWE: Pola dla filtrów
  location?: string; // miasto
  category?: string; // kategoria branżowa
  budget?: number; // budżet/cena

  // Job offer metadata (matching database column names)
  job_category?: string;
  job_location?: string;
  job_salary_min?: number;
  job_salary_max?: number;
  job_requirements?: string[];
  job_benefits?: string[];
  job_deadline?: string;
  job_type?: string; // full_time | part_time | contract | temporary
  job_hours_per_week?: number;
  job_start_date?: string;
  job_contact_email?: string;
  job_contact_phone?: string;
}

// =====================================================
// POSTS
// =====================================================

/**
 * Get paginated feed posts
 */
export async function getPosts(params?: {
  limit?: number;
  offset?: number;
  type?: PostType;
  author_id?: string;
  author_type?: AuthorType;
  currentUserId?: string; // role-specific ID (worker.id, employer.id, accountant.id)
}): Promise<Post[]> {
  let query = supabaseAny
    .from("posts")
    .select("*")
    .eq("is_active", true)
    .order("is_pinned", { ascending: false })
    .order("published_at", { ascending: false });

  if (params?.type) {
    query = query.eq("type", params.type);
  }

  if (params?.author_id) {
    query = query.eq("author_id", params.author_id);
  }

  if (params?.author_type) {
    query = query.eq("author_type", params.author_type);
  }

  if (params?.limit) {
    query = query.limit(params.limit);
  }

  if (params?.offset) {
    query = query.range(
      params.offset,
      params.offset + (params.limit || 20) - 1
    );
  }

  const { data, error } = await query;

  if (error) throw error;

  // Enrich posts with author data and user_has_liked status
  const enrichedPosts = await Promise.all(
    (data || []).map(async (post: Post) => {
      const authorData = await getAuthorData(post.author_id, post.author_type);

      // Check if current user has liked this post
      let userHasLiked = false;
      let userReaction: ReactionType | null = null;
      let reactionCounts: PostReactionCounts | null = null;

      if (params?.currentUserId) {
        // currentUserId is now profile_id (auth.uid()), not role-specific ID
        userHasLiked = await hasUserLikedPost(post.id, params.currentUserId);
        userReaction = await getUserReaction(post.id, params.currentUserId);
        reactionCounts = await getPostReactionCounts(post.id);
      }

      return {
        ...post,
        ...authorData,
        user_has_liked: userHasLiked,
        user_reaction: userReaction,
        reactions: reactionCounts,
      };
    })
  );

  return enrichedPosts as any;
}

/**
 * Get single post by ID
 */
export async function getPost(postId: string): Promise<Post> {
  const { data, error } = await supabaseAny
    .from("posts")
    .select("*")
    .eq("id", postId)
    .single();

  if (error) throw error;

  const authorData = await getAuthorData(data.author_id, data.author_type);

  return { ...data, ...authorData } as any;
}

/**
 * Create new post (only for employers and accountants)
 * Uses service key as workaround for RLS policy issues
 */
export async function createPost(postData: CreatePostData): Promise<Post> {
  // Get current authenticated user
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("User must be authenticated to create posts");
  }

  console.log(
    "[CREATE-POST] User:",
    user.id,
    "Author type:",
    postData.author_type
  );

  // Get author_id (employer_id lub accountant_id)
  let authorId: string;

  if (postData.author_type === "employer") {
    const { data: employer, error } = await supabaseAny
      .from("employers")
      .select("id")
      .eq("profile_id", user.id)
      .single();

    if (error || !employer) {
      throw new Error("User is not registered as employer");
    }
    authorId = employer.id;
  } else if (postData.author_type === "accountant") {
    const { data: accountant, error } = await supabaseAny
      .from("accountants")
      .select("id")
      .eq("profile_id", user.id)
      .single();

    if (error || !accountant) {
      throw new Error("User is not registered as accountant");
    }
    authorId = accountant.id;
  } else if (postData.author_type === "admin") {
    // Admin używa profile_id jako author_id
    authorId = user.id;
  } else {
    throw new Error("Invalid author_type");
  }

  console.log("[CREATE-POST] Author ID:", authorId, "Profile ID:", user.id);

  // Prepare post data with author_id AND profile_id
  const postToInsert = {
    ...postData,
    author_id: authorId,
    profile_id: user.id, // ✅ DODANE: profile_id dla storage
    is_active: true, // ✅ FIX: Ustawienie is_active na true żeby post był widoczny
    is_pinned: false, // ✅ FIX: Domyślnie nie przypięty
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    published_at: new Date().toISOString(),
  };

  console.log(
    "[CREATE-POST] Inserting post with media:",
    postData.media_urls?.length || 0,
    "files"
  );

  // Use service key client to bypass RLS policies
  const { data, error } = await supabaseServiceAny
    .from("posts")
    .insert(postToInsert)
    .select("*")
    .single();

  if (error) {
    console.error("[CREATE-POST] ❌ Failed:", error);
    throw new Error(`Failed to create post: ${error.message}`);
  }

  console.log("[CREATE-POST] ✅ Post created:", data.id);

  return data as any;
}

/**
 * Update post
 */
export async function updatePost(
  postId: string,
  updates: Partial<CreatePostData>
): Promise<Post> {
  const { data, error } = await supabaseAny
    .from("posts")
    .update(updates)
    .eq("id", postId)
    .select()
    .single();

  if (error) throw error;
  return data as any;
}

/**
 * Delete post (soft delete - set is_active to false)
 */
export async function deletePost(postId: string): Promise<void> {
  const { error } = await supabaseAny
    .from("posts")
    .update({ is_active: false })
    .eq("id", postId);

  if (error) throw error;
}

/**
 * Pin/unpin post
 */
export async function togglePinPost(
  postId: string,
  isPinned: boolean
): Promise<void> {
  const { error } = await supabaseAny
    .from("posts")
    .update({ is_pinned: isPinned })
    .eq("id", postId);

  if (error) throw error;
}

// =====================================================
// LIKES
// =====================================================

/**
 * Like a post
 * @param postId - The post ID
 * @param profileId - The user's profile_id (auth.uid()), NOT role-specific ID
 * @param userType - The user's role type (for backwards compatibility)
 */
export async function likePost(
  postId: string,
  profileId: string,
  userType: UserType
): Promise<void> {
  const { error } = await supabaseAny.from("post_likes").insert({
    post_id: postId,
    user_id: profileId, // For backwards compatibility with RLS
    profile_id: profileId, // New standard column
    user_type: userType,
  });

  if (error) {
    // Ignore duplicate key error (already liked)
    if (error.code !== "23505") {
      throw error;
    }
  }
}

/**
 * Unlike a post
 * @param postId - The post ID
 * @param profileId - The user's profile_id (auth.uid()), NOT role-specific ID
 */
export async function unlikePost(
  postId: string,
  profileId: string
): Promise<void> {
  const { error } = await supabaseAny
    .from("post_likes")
    .delete()
    .eq("post_id", postId)
    .eq("user_id", profileId) // Use user_id for RLS compatibility
    .eq("profile_id", profileId);

  if (error) throw error;
}

/**
 * Check if user has liked a post
 * @param postId - The post ID
 * @param profileId - The user's profile_id (auth.uid()), NOT role-specific ID
 */
export async function hasUserLikedPost(
  postId: string,
  profileId: string
): Promise<boolean> {
  const { data, error } = await supabaseAny
    .from("post_likes")
    .select("id")
    .eq("post_id", postId)
    .eq("profile_id", profileId) // 🔥 FIXED: Use profile_id which is auth.uid()
    .maybeSingle(); // 🔥 FIXED: Use maybeSingle() to avoid 406 when no like exists

  if (error) throw error;
  return !!data;
}

/**
 * NEW: Get user's reaction type for a post (returns null if no reaction)
 */
export async function getUserReaction(
  postId: string,
  profileId: string
): Promise<ReactionType | null> {
  const { data, error } = await supabaseAny
    .from("post_likes")
    .select("reaction_type")
    .eq("post_id", postId)
    .eq("profile_id", profileId) // FIXED: Use profile_id which is auth.uid()
    .maybeSingle();

  if (error) {
    console.error("Error fetching user reaction:", error);
    return null;
  }

  return data?.reaction_type || null;
}

/**
 * Get post likes
 */
export async function getPostLikes(postId: string): Promise<PostLike[]> {
  const { data, error } = await supabaseAny
    .from("post_likes")
    .select("*")
    .eq("post_id", postId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as any;
}

// =====================================================
// COMMENTS
// =====================================================

/**
 * Get comments for a post
 */
export async function getPostComments(postId: string): Promise<PostComment[]> {
  const { data, error } = await supabaseAny
    .from("post_comments")
    .select("*")
    .eq("post_id", postId)
    .is("parent_comment_id", null) // Only root comments
    .order("created_at", { ascending: false });

  if (error) throw error;

  // Enrich comments with user data
  const enrichedComments = await Promise.all(
    (data || []).map(async (comment: PostComment) => {
      const userData = await getUserData(comment.user_id, comment.user_type);
      // Get replies
      const replies = await getCommentReplies(comment.id);
      return {
        ...comment,
        ...userData,
        replies,
      };
    })
  );

  return enrichedComments as any;
}

/**
 * Get replies for a comment
 */
export async function getCommentReplies(
  commentId: string
): Promise<PostComment[]> {
  const { data, error } = await supabaseAny
    .from("post_comments")
    .select("*")
    .eq("parent_comment_id", commentId)
    .order("created_at", { ascending: true });

  if (error) throw error;

  // Enrich replies with user data
  const enrichedReplies = await Promise.all(
    (data || []).map(async (reply: PostComment) => {
      const userData = await getUserData(reply.user_id, reply.user_type);
      return {
        ...reply,
        ...userData,
      };
    })
  );

  return enrichedReplies as any;
}

/**
 * Create comment
 */
export async function createComment(
  postId: string,
  userId: string,
  userType: UserType,
  content: string,
  parentCommentId?: string
): Promise<PostComment> {
  const { data, error } = await supabaseAny
    .from("post_comments")
    .insert({
      post_id: postId,
      user_id: userId,
      user_type: userType,
      content,
      parent_comment_id: parentCommentId,
    })
    .select()
    .single();

  if (error) throw error;
  return data as any;
}

/**
 * Update comment
 */
export async function updateComment(
  commentId: string,
  content: string
): Promise<PostComment> {
  const { data, error } = await supabaseAny
    .from("post_comments")
    .update({ content })
    .eq("id", commentId)
    .select()
    .single();

  if (error) throw error;
  return data as any;
}

/**
 * Delete comment
 */
export async function deleteComment(commentId: string): Promise<void> {
  const { error } = await supabaseAny
    .from("post_comments")
    .delete()
    .eq("id", commentId);

  if (error) throw error;
}

/**
 * Like a comment
 */
export async function likeComment(
  commentId: string,
  userId: string,
  userType: UserType
): Promise<void> {
  const { error } = await supabaseAny.from("comment_likes").insert({
    comment_id: commentId,
    user_id: userId,
    user_type: userType,
  });

  if (error) {
    // Ignore duplicate key error
    if (error.code !== "23505") {
      throw error;
    }
  }
}

/**
 * Unlike a comment
 */
export async function unlikeComment(
  commentId: string,
  userId: string
): Promise<void> {
  const { error } = await supabaseAny
    .from("comment_likes")
    .delete()
    .eq("comment_id", commentId)
    .eq("user_id", userId);

  if (error) throw error;
}

// =====================================================
// SHARES
// =====================================================

/**
 * Share a post
 */
export async function sharePost(
  postId: string,
  userId: string,
  userType: UserType,
  shareType: string = "profile"
): Promise<void> {
  const { error } = await supabaseAny.from("post_shares").insert({
    post_id: postId,
    user_id: userId,
    user_type: userType,
    share_type: shareType,
  });

  if (error) {
    // Ignore duplicate key error
    if (error.code !== "23505") {
      throw error;
    }
  }
}

/**
 * Get post shares
 */
export async function getPostShares(postId: string): Promise<PostShare[]> {
  const { data, error } = await supabaseAny
    .from("post_shares")
    .select("*")
    .eq("post_id", postId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as any;
}

// =====================================================
// VIEWS
// =====================================================

/**
 * Record post view
 */
export async function recordPostView(
  postId: string,
  userId?: string,
  userType?: UserType,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  const { error } = await supabaseAny.from("post_views").insert({
    post_id: postId,
    user_id: userId,
    user_type: userType,
    ip_address: ipAddress,
    user_agent: userAgent,
  });

  // Don't throw error if view recording fails
  if (error) {
    console.warn("Failed to record post view:", error);
  }
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Get author data (employer or accountant)
 */
async function getAuthorData(
  authorId: string,
  authorType: AuthorType
): Promise<{
  author_name: string;
  author_company?: string;
  author_avatar?: string;
  author_profile_id?: string;
}> {
  try {
    if (authorType === "employer") {
      const { data, error } = await supabaseAny
        .from("employers")
        .select("company_name, profile_id, logo_url")
        .eq("id", authorId)
        .single();

      if (error) {
        console.error("[getAuthorData] Employer error:", error);
        return { author_name: "Pracodawca" };
      }

      // Fetch profile data for name
      const { data: profile } = await supabaseAny
        .from("profiles")
        .select("full_name")
        .eq("id", data?.profile_id)
        .single();

      return {
        author_name: profile?.full_name || "Pracodawca",
        author_company: data?.company_name,
        author_avatar: data?.logo_url, // Use company logo as avatar
        author_profile_id: data?.profile_id,
      };
    } else if (authorType === "accountant") {
      const { data, error } = await supabaseAny
        .from("accountants")
        .select("company_name, full_name, avatar_url, profile_id")
        .eq("id", authorId)
        .single();

      if (error) {
        console.error("[getAuthorData] Accountant error:", error);
        return { author_name: "Księgowy" };
      }

      return {
        author_name: data?.full_name || "Księgowy",
        author_company: data?.company_name,
        author_avatar: data?.avatar_url,
        author_profile_id: data?.profile_id,
      };
    } else if (authorType === "admin") {
      // Admin pobiera dane z profiles używając authorId jako profile_id
      const { data: profile, error } = await supabaseAny
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", authorId)
        .single();

      if (error) {
        console.error("[getAuthorData] Admin profile error:", error);
        return { author_name: "Administrator" };
      }

      return {
        author_name: profile?.full_name || "Administrator",
        author_avatar: profile?.avatar_url,
        author_profile_id: authorId, // For admin, authorId is profile_id
      };
    } else if (authorType === "cleaning_company") {
      const { data, error } = await supabaseAny
        .from("cleaning_companies")
        .select("company_name, avatar_url, profile_id")
        .eq("id", authorId)
        .single();

      if (error) {
        console.error("[getAuthorData] Cleaning company error:", error);
        return { author_name: "Firma sprzątająca" };
      }

      return {
        author_name: data?.company_name || "Firma sprzątająca",
        author_avatar: data?.avatar_url,
        author_profile_id: data?.profile_id,
      };
    } else if (authorType === "worker") {
      const { data, error } = await supabaseAny
        .from("workers")
        .select("profile_id, avatar_url")
        .eq("id", authorId)
        .single();

      if (error) {
        console.error("[getAuthorData] Worker error:", error);
        return { author_name: "Pracownik" };
      }

      // Fetch profile data for name
      const { data: profile } = await supabaseAny
        .from("profiles")
        .select("full_name")
        .eq("id", data?.profile_id)
        .single();

      return {
        author_name: profile?.full_name || "Pracownik",
        author_avatar: data?.avatar_url,
        author_profile_id: data?.profile_id,
      };
    } else if (authorType === "regular_user") {
      // Regular user pobiera dane bezpośrednio z profiles (authorId = profile_id)
      const { data: profile, error } = await supabaseAny
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", authorId)
        .single();

      if (error) {
        console.error("[getAuthorData] Regular user profile error:", error);
        return { author_name: "Użytkownik" };
      }

      return {
        author_name: profile?.full_name || "Użytkownik",
        author_avatar: profile?.avatar_url,
        author_profile_id: authorId, // For regular_user, authorId is profile_id
      };
    } else {
      return { author_name: "Nieznany" };
    }
  } catch (error) {
    console.error("[getAuthorData] Unexpected error:", error);
    return {
      author_name:
        authorType === "employer"
          ? "Pracodawca"
          : authorType === "accountant"
          ? "Księgowy"
          : "Administrator",
    };
  }
}

/**
 * Get user data (worker, employer or accountant)
 */
async function getUserData(
  userId: string,
  userType: UserType
): Promise<{
  user_name: string;
  user_avatar?: string;
}> {
  try {
    if (userType === "worker") {
      const { data, error } = await supabaseAny
        .from("workers")
        .select("profile_id")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("[getUserData] Worker error:", error);
        return { user_name: "Pracownik" };
      }

      // Fetch profile for name and avatar
      const { data: profile } = await supabaseAny
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", data?.profile_id)
        .single();

      return {
        user_name: profile?.full_name || "Pracownik",
        user_avatar: profile?.avatar_url,
      };
    } else if (userType === "employer") {
      const { data, error } = await supabaseAny
        .from("employers")
        .select("profile_id")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("[getUserData] Employer error:", error);
        return { user_name: "Pracodawca" };
      }

      // Fetch profile for name and avatar
      const { data: profile } = await supabaseAny
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", data?.profile_id)
        .single();

      return {
        user_name: profile?.full_name || "Pracodawca",
        user_avatar: profile?.avatar_url,
      };
    } else if (userType === "accountant") {
      const { data, error } = await supabaseAny
        .from("accountants")
        .select("full_name, avatar_url")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("[getUserData] Accountant error:", error);
        return { user_name: "Księgowy" };
      }

      return {
        user_name: data?.full_name || "Księgowy",
        user_avatar: data?.avatar_url,
      };
    } else if (userType === "admin") {
      // Admin używa userId jako profile_id
      const { data: profile, error } = await supabaseAny
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("[getUserData] Admin profile error:", error);
        return { user_name: "Administrator" };
      }

      return {
        user_name: profile?.full_name || "Administrator",
        user_avatar: profile?.avatar_url,
      };
    } else {
      return { user_name: "Użytkownik" };
    }
  } catch (error) {
    console.error("[getUserData] Unexpected error:", error);
    return { user_name: "Użytkownik" };
  }
}

// =====================================================
// POST REACTIONS (EMOJI)
// =====================================================

/**
 * Zareaguj na post emoji (like, love, wow, sad, angry)
 * Jeśli user już zareagował - zmienia reakcję
 */
export async function reactToPost(
  postId: string,
  userId: string,
  userType: UserType,
  profileId: string,
  reactionType: ReactionType
): Promise<void> {
  // Sprawdź czy user już zareagował - używamy maybeSingle() zamiast single()
  // żeby uniknąć błędu 406 gdy nie ma rekordu
  const { data: existing, error: selectError } = await supabaseAny
    .from("post_likes")
    .select("id, reaction_type")
    .eq("post_id", postId)
    .eq("profile_id", profileId)
    .maybeSingle();

  // Ignoruj błąd "no rows" - to normalne gdy user jeszcze nie zareagował
  if (selectError && selectError.code !== "PGRST116") {
    console.error("Error checking existing reaction:", selectError);
  }

  if (existing) {
    // Update istniejącej reakcji
    const { error } = await supabaseAny
      .from("post_likes")
      .update({ reaction_type: reactionType })
      .eq("id", existing.id);

    if (error) throw error;
  } else {
    // Insert nowej reakcji
    const { error } = await supabaseAny.from("post_likes").insert({
      post_id: postId,
      user_id: userId,
      user_type: userType,
      profile_id: profileId,
      reaction_type: reactionType,
    });

    if (error) throw error;

    // Zwiększ likes_count w posts
    await supabaseAny.rpc("increment_post_likes", { post_id: postId });
  }
}

/**
 * Usuń reakcję z posta
 */
export async function unreactToPost(
  postId: string,
  profileId: string
): Promise<void> {
  const { error } = await supabaseAny
    .from("post_likes")
    .delete()
    .eq("post_id", postId)
    .eq("profile_id", profileId);

  if (error) throw error;

  // Zmniejsz likes_count w posts
  await supabaseAny.rpc("decrement_post_likes", { post_id: postId });
}

/**
 * Pobierz liczniki reakcji dla posta
 */
export async function getPostReactionCounts(
  postId: string
): Promise<PostReactionCounts> {
  // Pobieramy liczniki bezpośrednio z tabeli posts (optymalizacja - jeden SELECT zamiast COUNT(*) dla każdej reakcji)
  const { data, error } = await supabaseAny
    .from("posts")
    .select(
      "like_count, love_count, wow_count, sad_count, angry_count, likes_count"
    )
    .eq("id", postId)
    .single();

  if (error) {
    console.error("Error fetching reaction counts:", error);
    // Fallback - zwróć zerowe liczniki
    return {
      like: 0,
      love: 0,
      wow: 0,
      sad: 0,
      angry: 0,
      total: 0,
    };
  }

  return {
    like: data.like_count || 0,
    love: data.love_count || 0,
    wow: data.wow_count || 0,
    sad: data.sad_count || 0,
    angry: data.angry_count || 0,
    total: data.likes_count || 0,
  };
}

/**
 * Pobierz listę osób które zareagowały na post
 * TYLKO DLA AUTORA POSTA (pracodawca/księgowy)
 */
export async function getPostReactions(postId: string): Promise<
  Array<{
    reaction_type: ReactionType;
    user_id: string;
    user_name: string;
    user_avatar?: string;
    user_role: string;
    profile_id: string;
    created_at: string;
  }>
> {
  const user = await getCurrentUser();
  if (!user) throw new Error("User must be authenticated");

  // Sprawdź czy user jest autorem posta
  const { data: post } = await supabaseAny
    .from("posts")
    .select("profile_id")
    .eq("id", postId)
    .single();

  if (!post || post.profile_id !== user.id) {
    throw new Error("Only post author can see who reacted");
  }

  // Pobierz reakcje
  const { data, error } = await supabaseAny
    .from("post_likes")
    .select("reaction_type, user_id, user_type, profile_id, created_at")
    .eq("post_id", postId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  // Wzbogać o dane użytkowników
  const enriched = await Promise.all(
    data.map(async (reaction: any) => {
      const userData = await getUserData(reaction.user_id, reaction.user_type);
      return {
        reaction_type: reaction.reaction_type,
        user_id: reaction.user_id,
        user_name: userData.user_name || "Użytkownik",
        user_avatar: userData.user_avatar,
        user_role: reaction.user_type,
        profile_id: reaction.profile_id,
        created_at: reaction.created_at,
      };
    })
  );

  return enriched;
}

// =====================================================
// POST SAVES (ZAPISANE OFERTY)
// =====================================================

/**
 * Zapisz post do folderu
 */
export async function savePost(
  postId: string,
  userId: string,
  userType: UserType,
  profileId: string,
  folder: SaveFolder = "polubiane",
  notes?: string
): Promise<void> {
  const { error } = await supabaseAny.from("post_saves").insert({
    post_id: postId,
    user_id: userId,
    profile_id: profileId,
    folder,
    notes,
  });

  if (error) {
    // Jeśli już istnieje - update
    if (error.code === "23505") {
      await supabaseAny
        .from("post_saves")
        .update({ notes, updated_at: new Date().toISOString() })
        .eq("post_id", postId)
        .eq("profile_id", profileId)
        .eq("folder", folder);
    } else {
      throw error;
    }
  }
}

/**
 * Usuń post z zapisanych
 */
export async function unsavePost(
  postId: string,
  folder?: SaveFolder
): Promise<void> {
  const user = await getCurrentUser();
  if (!user) throw new Error("User must be authenticated");

  let query = supabaseAny
    .from("post_saves")
    .delete()
    .eq("post_id", postId)
    .eq("profile_id", user.id);

  if (folder) {
    query = query.eq("folder", folder);
  }

  const { error } = await query;
  if (error) throw error;
}

/**
 * Pobierz zapisane posty z folderu
 */
export async function getSavedPosts(
  folder?: SaveFolder,
  limit: number = 20,
  offset: number = 0
): Promise<Post[]> {
  const user = await getCurrentUser();
  if (!user) throw new Error("User must be authenticated");

  let query = supabaseAny
    .from("post_saves")
    .select("post_id, notes, created_at")
    .eq("profile_id", user.id)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (folder) {
    query = query.eq("folder", folder);
  }

  const { data: saves, error } = await query;
  if (error) throw error;

  // Pobierz pełne dane postów
  const postIds = saves?.map((s: any) => s.post_id) || [];
  if (postIds.length === 0) return [];

  const { data: posts } = await supabaseAny
    .from("posts")
    .select("*")
    .in("id", postIds);

  // Wzbogać o author data
  const enrichedPosts = await Promise.all(
    (posts || []).map(async (post: any) => {
      const authorData = await getAuthorData(post.author_id, post.author_type);
      return { ...post, ...authorData };
    })
  );

  return enrichedPosts as any;
}

/**
 * Sprawdź czy post jest zapisany
 */
export async function isPostSaved(
  postId: string,
  folder?: SaveFolder
): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;

  let query = supabaseAny
    .from("post_saves")
    .select("id")
    .eq("post_id", postId)
    .eq("profile_id", user.id);

  if (folder) {
    query = query.eq("folder", folder);
  }

  const { data } = await query.single();
  return !!data;
}

// =====================================================
// COMMENT REACTIONS (EMOJI NA KOMENTARZE)
// =====================================================

/**
 * Zareaguj na komentarz emoji
 */
export async function reactToComment(
  commentId: string,
  userId: string,
  userType: UserType,
  profileId: string,
  reactionType: ReactionType
): Promise<void> {
  // Sprawdź czy user już zareagował - używamy maybeSingle() zamiast single()
  const { data: existing, error: selectError } = await supabaseAny
    .from("comment_reactions")
    .select("id, reaction_type")
    .eq("comment_id", commentId)
    .eq("profile_id", profileId)
    .maybeSingle();

  // Ignoruj błąd "no rows"
  if (selectError && selectError.code !== "PGRST116") {
    console.error("Error checking existing comment reaction:", selectError);
  }

  if (existing) {
    // Update istniejącej reakcji
    const { error } = await supabaseAny
      .from("comment_reactions")
      .update({ reaction_type: reactionType })
      .eq("id", existing.id);

    if (error) throw error;
  } else {
    // Insert nowej reakcji
    const { error } = await supabaseAny.from("comment_reactions").insert({
      comment_id: commentId,
      user_id: userId,
      profile_id: profileId,
      reaction_type: reactionType,
    });

    if (error) throw error;
  }
}

/**
 * Usuń reakcję z komentarza
 */
export async function unreactToComment(
  commentId: string,
  profileId: string
): Promise<void> {
  const { error } = await supabaseAny
    .from("comment_reactions")
    .delete()
    .eq("comment_id", commentId)
    .eq("profile_id", profileId);

  if (error) throw error;
}

/**
 * Pobierz liczniki reakcji dla komentarza
 */
export async function getCommentReactionCounts(
  commentId: string
): Promise<PostReactionCounts> {
  const { data, error } = await supabaseAny
    .from("comment_reactions")
    .select("reaction_type")
    .eq("comment_id", commentId);

  if (error) throw error;

  const counts: PostReactionCounts = {
    like: 0,
    love: 0,
    wow: 0,
    sad: 0,
    angry: 0,
    total: 0,
  };

  data?.forEach((reaction: any) => {
    counts[reaction.reaction_type as ReactionType]++;
    counts.total++;
  });

  return counts;
}

// =====================================================
// POST MANAGEMENT FUNCTIONS (dla panelu "Moje Posty")
// =====================================================

/**
 * Pobierz wszystkie posty użytkownika
 */
export async function getMyPosts(userId: string): Promise<Post[]> {
  const { data, error } = await supabaseAny
    .from("posts")
    .select("*")
    .eq("profile_id", userId)
    .is("deleted_at", null) // Nie pokazuj usuniętych
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching my posts:", error);
    throw error;
  }

  return data || [];
}

/**
 * Toggle aktywność posta (aktywny/nieaktywny)
 */
export async function togglePostActive(
  postId: string,
  currentStatus: boolean
): Promise<void> {
  const {
    data: { user },
  } = await supabaseAny.auth.getUser();

  if (!user) {
    throw new Error("User not authenticated");
  }

  const { error } = await supabaseAny
    .from("posts")
    .update({
      is_active: !currentStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", postId)
    .eq("profile_id", user.id);

  if (error) {
    console.error("Error toggling post active:", error);
    throw error;
  }
}

/**
 * Soft delete posta (ustawia deleted_at i dezaktywuje)
 */
export async function softDeletePost(postId: string): Promise<void> {
  const {
    data: { user },
  } = await supabaseAny.auth.getUser();

  if (!user) {
    throw new Error("User not authenticated");
  }

  const { error } = await supabaseAny
    .from("posts")
    .update({
      deleted_at: new Date().toISOString(),
      is_active: false,
      updated_at: new Date().toISOString(),
    })
    .eq("id", postId)
    .eq("profile_id", user.id);

  if (error) {
    console.error("Error soft deleting post:", error);
    throw error;
  }
}

/**
 * Pobierz statystyki posta
 */
export async function getPostStats(postId: string) {
  const { data, error } = await supabaseAny
    .from("posts")
    .select(
      `
      views_count,
      likes_count,
      like_count,
      love_count,
      wow_count,
      sad_count,
      angry_count,
      comments_count,
      shares_count,
      saves_count
    `
    )
    .eq("id", postId)
    .single();

  if (error) {
    console.error("Error fetching post stats:", error);
    throw error;
  }

  return data;
}

// =====================================================
// SAVED ACTIVITY / HISTORY FUNCTIONS
// =====================================================

/**
 * Get posts saved in specific folder
 */
export async function getSavedPostsByFolder(
  userId: string,
  folder: "do_aplikowania" | "polubiane" | "moje_reakcje" | "komentowane"
): Promise<Post[]> {
  const { data: savedData, error: saveError } = await supabaseAny
    .from("post_saves")
    .select("post_id")
    .eq("profile_id", userId)
    .eq("folder", folder);

  if (saveError) {
    console.error("Error fetching saved posts:", saveError);
    throw saveError;
  }

  if (!savedData || savedData.length === 0) return [];

  const postIds = savedData.map((s: any) => s.post_id);

  const { data: posts, error: postsError } = await supabaseAny
    .from("posts")
    .select("*")
    .in("id", postIds)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (postsError) {
    console.error("Error fetching posts:", postsError);
    throw postsError;
  }

  return posts || [];
}

/**
 * Get posts that user liked (reacted to)
 */
export async function getLikedPosts(userId: string): Promise<Post[]> {
  const { data: likesData, error: likesError } = await supabaseAny
    .from("post_likes")
    .select("post_id")
    .eq("profile_id", userId);

  if (likesError) {
    console.error("Error fetching liked posts:", likesError);
    throw likesError;
  }

  if (!likesData || likesData.length === 0) return [];

  // Get unique post IDs
  const postIds = [...new Set(likesData.map((l: any) => l.post_id))];

  const { data: posts, error: postsError } = await supabaseAny
    .from("posts")
    .select("*")
    .in("id", postIds)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (postsError) {
    console.error("Error fetching posts:", postsError);
    throw postsError;
  }

  return posts || [];
}

/**
 * Get job offer posts that user reacted to (for creators only)
 */
export async function getJobOfferReactions(userId: string): Promise<Post[]> {
  const { data: likesData, error: likesError } = await supabaseAny
    .from("post_likes")
    .select("post_id")
    .eq("profile_id", userId);

  if (likesError) {
    console.error("Error fetching job offer reactions:", likesError);
    throw likesError;
  }

  if (!likesData || likesData.length === 0) return [];

  // Get unique post IDs
  const postIds = [...new Set(likesData.map((l: any) => l.post_id))];

  const { data: posts, error: postsError } = await supabaseAny
    .from("posts")
    .select("*")
    .in("id", postIds)
    .eq("type", "job_offer") // ✅ Only job offers!
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (postsError) {
    console.error("Error fetching posts:", postsError);
    throw postsError;
  }

  return posts || [];
}

/**
 * Get posts where user commented
 */
export async function getCommentedPosts(userId: string): Promise<Post[]> {
  const { data: commentsData, error: commentsError } = await supabaseAny
    .from("post_comments")
    .select("post_id")
    .eq("user_id", userId);

  if (commentsError) {
    console.error("Error fetching commented posts:", commentsError);
    throw commentsError;
  }

  if (!commentsData || commentsData.length === 0) return [];

  // Get unique post IDs
  const postIds = [...new Set(commentsData.map((c: any) => c.post_id))];

  const { data: posts, error: postsError } = await supabaseAny
    .from("posts")
    .select("*")
    .in("id", postIds)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (postsError) {
    console.error("Error fetching posts:", postsError);
    throw postsError;
  }

  return posts || [];
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Pobierz role-specific ID użytkownika
 */
async function getUserRoleId(
  profileId: string,
  role: string
): Promise<{ roleId: string }> {
  if (role === "worker") {
    const { data } = await supabaseAny
      .from("workers")
      .select("id")
      .eq("profile_id", profileId)
      .single();
    return { roleId: data?.id || profileId };
  } else if (role === "employer") {
    const { data } = await supabaseAny
      .from("employers")
      .select("id")
      .eq("profile_id", profileId)
      .single();
    return { roleId: data?.id || profileId };
  } else if (role === "accountant") {
    const { data } = await supabaseAny
      .from("accountants")
      .select("id")
      .eq("profile_id", profileId)
      .single();
    return { roleId: data?.id || profileId };
  }
  return { roleId: profileId };
}

// =====================================================
// SERVICE REQUESTS (Zlecenia od Regular Users)
// =====================================================

/**
 * Get all service requests (for workers to browse)
 */
export async function getServiceRequests(filters?: {
  category?: string;
  urgency?: string;
  minBudget?: number;
  maxBudget?: number;
  status?: string;
}): Promise<Post[]> {
  let query = supabaseAny
    .from("posts")
    .select("*")
    .eq("type", "service_request")
    .eq("is_active", true)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  // Apply filters
  if (filters?.category) {
    query = query.eq("request_category", filters.category);
  }
  if (filters?.urgency) {
    query = query.eq("request_urgency", filters.urgency);
  }
  if (filters?.status) {
    query = query.eq("request_status", filters.status);
  } else {
    // Default: only show open requests
    query = query.eq("request_status", "open");
  }
  if (filters?.minBudget) {
    query = query.gte("request_budget_min", filters.minBudget);
  }
  if (filters?.maxBudget) {
    query = query.lte("request_budget_max", filters.maxBudget);
  }

  const { data, error } = await query;

  if (error) throw error;
  return (data as any) || [];
}

/**
 * Worker submits response to service request
 */
export async function respondToServiceRequest(
  postId: string,
  workerId: string,
  response: {
    offered_price?: number;
    estimated_hours?: number;
    message: string;
    availability_date?: string;
  }
): Promise<void> {
  const { error } = await supabaseAny.from("service_request_responses").insert({
    post_id: postId,
    worker_id: workerId,
    ...response,
    status: "pending",
  });

  if (error) throw error;

  console.log(
    `[RESPOND-SERVICE-REQUEST] Worker ${workerId} responded to request ${postId}`
  );
}

/**
 * Regular user gets responses to their request
 */
export async function getRequestResponses(
  postId: string
): Promise<ServiceRequestResponse[]> {
  const { data, error } = await supabaseAny
    .from("service_request_responses")
    .select(
      `
      *,
      worker:workers(
        id,
        profile:profiles(full_name, avatar_url),
        rating,
        completed_jobs,
        specializations
      )
    `
    )
    .eq("post_id", postId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data as any) || [];
}

/**
 * Regular user accepts worker's response
 */
export async function acceptWorkerResponse(
  responseId: string,
  postId: string
): Promise<void> {
  // Update response status to accepted
  const { error: responseError } = await supabaseAny
    .from("service_request_responses")
    .update({ status: "accepted", updated_at: new Date().toISOString() })
    .eq("id", responseId);

  if (responseError) throw responseError;

  // Get worker_id from response
  const { data: response } = await supabaseAny
    .from("service_request_responses")
    .select("worker_id")
    .eq("id", responseId)
    .single();

  // Update post status to in_progress and set selected_worker_id
  const { error: postError } = await supabaseAny
    .from("posts")
    .update({
      request_status: "in_progress",
      request_selected_worker_id: response.worker_id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", postId);

  if (postError) throw postError;

  // Reject all other responses
  const { error: rejectError } = await supabaseAny
    .from("service_request_responses")
    .update({ status: "rejected", updated_at: new Date().toISOString() })
    .eq("post_id", postId)
    .neq("id", responseId)
    .eq("status", "pending");

  if (rejectError) throw rejectError;

  console.log(
    `[ACCEPT-RESPONSE] Response ${responseId} accepted for request ${postId}`
  );
}

/**
 * Regular user rejects worker's response
 */
export async function rejectWorkerResponse(responseId: string): Promise<void> {
  const { error } = await supabaseAny
    .from("service_request_responses")
    .update({ status: "rejected", updated_at: new Date().toISOString() })
    .eq("id", responseId);

  if (error) throw error;

  console.log(`[REJECT-RESPONSE] Response ${responseId} rejected`);
}

/**
 * Worker withdraws their response
 */
export async function withdrawResponse(responseId: string): Promise<void> {
  const { error } = await supabaseAny
    .from("service_request_responses")
    .update({ status: "withdrawn", updated_at: new Date().toISOString() })
    .eq("id", responseId);

  if (error) throw error;

  console.log(`[WITHDRAW-RESPONSE] Response ${responseId} withdrawn by worker`);
}

/**
 * Complete service request (mark as completed)
 */
export async function completeServiceRequest(postId: string): Promise<void> {
  const { error } = await supabaseAny
    .from("posts")
    .update({
      request_status: "completed",
      updated_at: new Date().toISOString(),
    })
    .eq("id", postId);

  if (error) throw error;

  console.log(`[COMPLETE-REQUEST] Request ${postId} marked as completed`);
}

/**
 * Cancel service request
 */
export async function cancelServiceRequest(postId: string): Promise<void> {
  const { error } = await supabaseAny
    .from("posts")
    .update({
      request_status: "cancelled",
      is_active: false,
      updated_at: new Date().toISOString(),
    })
    .eq("id", postId);

  if (error) throw error;

  console.log(`[CANCEL-REQUEST] Request ${postId} cancelled`);
}

/**
 * Get regular user profile
 */
export async function getRegularUserProfile(
  userId: string
): Promise<RegularUser | null> {
  const { data, error } = await supabaseAny
    .from("regular_users")
    .select("*")
    .eq("profile_id", userId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null; // Not found
    throw error;
  }

  return data as any;
}

/**
 * Check if regular user can create new request (freemium limit)
 */
export async function canCreateServiceRequest(
  userId: string
): Promise<{ can: boolean; reason?: string }> {
  const user = await getRegularUserProfile(userId);

  if (!user) {
    return { can: false, reason: "User not found" };
  }

  // Premium users can create unlimited requests
  if (user.is_premium) {
    const now = new Date();
    const subscriptionEndDate = user.subscription_end_date
      ? new Date(user.subscription_end_date)
      : null;
    if (subscriptionEndDate && subscriptionEndDate > now) {
      return { can: true };
    }
  }

  // Free users have limit
  if (user.requests_this_month >= user.free_requests_limit) {
    return {
      can: false,
      reason: `Osiągnięto limit ${user.free_requests_limit} darmowych zleceń na miesiąc. Kup premium (€9.99/miesiąc) dla nielimitowanych zleceń!`,
    };
  }

  return { can: true };
}
