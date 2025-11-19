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

export type PostType =
  | "job_offer"
  | "ad"
  | "announcement"
  | "story"
  | "service";
export type AuthorType = "employer" | "accountant";
export type UserType = "worker" | "employer" | "accountant";

export interface Post {
  id: string;
  author_id: string;
  author_type: AuthorType;
  type: PostType;
  title?: string;
  content: string;
  media_urls?: string[];
  media_types?: string[];

  // Job offer metadata
  job_category?: string;
  job_location?: string;
  job_salary_min?: number;
  job_salary_max?: number;
  job_requirements?: string[];
  job_deadline?: string;

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
  author_name?: string;
  author_company?: string;
  author_avatar?: string;
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
  user_name?: string;
  user_avatar?: string;
}

export interface PostLike {
  id: string;
  post_id: string;
  user_id: string;
  user_type: UserType;
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

export interface CreatePostData {
  author_type: AuthorType;
  type: PostType;
  title?: string;
  content: string;
  media_urls?: string[];
  media_types?: string[];

  // Job offer metadata
  job_category?: string;
  job_location?: string;
  job_salary_min?: number;
  job_salary_max?: number;
  job_requirements?: string[];
  job_deadline?: string;
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
      if (params?.currentUserId) {
        // currentUserId is now profile_id (auth.uid()), not role-specific ID
        userHasLiked = await hasUserLikedPost(post.id, params.currentUserId);
      }

      return {
        ...post,
        ...authorData,
        user_has_liked: userHasLiked,
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
    .eq("user_id", profileId) // Use user_id for RLS compatibility
    .single();

  if (error && error.code !== "PGRST116") throw error;
  return !!data;
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
}> {
  try {
    if (authorType === "employer") {
      const { data, error } = await supabaseAny
        .from("employers")
        .select("company_name, profile_id")
        .eq("id", authorId)
        .single();

      if (error) {
        console.error("[getAuthorData] Employer error:", error);
        return { author_name: "Pracodawca" };
      }

      // Fetch profile data for name and avatar
      const { data: profile } = await supabaseAny
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", data?.profile_id)
        .single();

      return {
        author_name: profile?.full_name || "Pracodawca",
        author_company: data?.company_name,
        author_avatar: profile?.avatar_url,
      };
    } else {
      const { data, error } = await supabaseAny
        .from("accountants")
        .select("company_name, full_name, avatar_url")
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
      };
    }
  } catch (error) {
    console.error("[getAuthorData] Unexpected error:", error);
    return {
      author_name: authorType === "employer" ? "Pracodawca" : "Księgowy",
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
    } else {
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
    }
  } catch (error) {
    console.error("[getUserData] Unexpected error:", error);
    return { user_name: "Użytkownik" };
  }
}
