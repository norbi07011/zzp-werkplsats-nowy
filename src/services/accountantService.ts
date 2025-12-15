import { supabase } from "../lib/supabase";

// Type assertion for new tables (until database.types.ts is regenerated)
const supabaseAny = supabase as any;

// =====================================================
// TYPES
// =====================================================

export interface Accountant {
  id: string;
  profile_id: string;
  full_name: string;
  company_name?: string;
  email: string;
  phone?: string;
  kvk_number?: string;
  btw_number?: string;
  license_number?: string;
  city?: string;
  address?: string;
  postal_code?: string;
  country: string;
  bio?: string;
  specializations: string[];
  languages: string[];
  website?: string;
  avatar_url?: string;
  cover_image_url?: string;
  portfolio_images?: string[];
  rating: number;
  rating_count: number;
  average_rating?: number; // New column updated by trigger
  review_count?: number; // New column updated by trigger
  total_clients: number;
  profile_views?: number;
  years_experience: number;
  latitude?: number | null;
  longitude?: number | null;
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AccountantService {
  id: string;
  accountant_id: string;
  service_type: string;
  name: string;
  description?: string;
  price_type: "fixed" | "hourly" | "monthly" | "custom";
  price_amount?: number;
  price_from?: number;
  price_unit?: string;
  price_currency: string;
  delivery_time?: string;
  includes?: string[];
  features?: string[];
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface AccountantForm {
  id: string;
  accountant_id: string;
  form_type: string;
  form_name: string;
  form_fields: FormField[];
  is_active: boolean;
  requires_approval: boolean;
  created_at: string;
  updated_at: string;
}

export interface FormField {
  name: string;
  label: string;
  type:
    | "text"
    | "number"
    | "email"
    | "tel"
    | "date"
    | "textarea"
    | "select"
    | "checkbox"
    | "file";
  required: boolean;
  placeholder?: string;
  options?: string[]; // For select/checkbox
  min?: number;
  max?: number;
  pattern?: string;
}

export interface FormSubmission {
  id: string;
  form_id: string;
  accountant_id: string;
  submitter_id: string;
  submitter_type: "worker" | "employer";
  submitter_name?: string;
  submitter_email?: string;
  submitter_phone?: string;
  form_data: Record<string, any>;
  attachments?: string[];
  status: "pending" | "in_progress" | "completed" | "rejected";
  accountant_response?: string;
  accountant_files?: string[];
  submitted_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface AccountantReview {
  id: string;
  accountant_id: string;
  reviewer_id: string;
  reviewer_type: "worker" | "employer";
  reviewer_name?: string;
  client_name?: string;
  rating: number;
  professionalism_rating?: number;
  communication_rating?: number;
  quality_rating?: number;
  timeliness_rating?: number;
  comment?: string;
  would_recommend: boolean;
  status: "pending" | "approved" | "rejected";
  created_at: string;
}

export interface CreateAccountantData {
  profile_id: string;
  full_name: string;
  company_name?: string;
  email: string;
  phone?: string;
  kvk_number?: string;
  btw_number?: string;
  license_number?: string;
  city?: string;
  address?: string;
  postal_code?: string;
  country?: string;
  bio?: string;
  specializations?: string[];
  languages?: string[];
  website?: string;
  years_experience?: number;
}

export interface UpdateAccountantData {
  full_name?: string;
  company_name?: string;
  email?: string;
  phone?: string;
  kvk_number?: string;
  btw_number?: string;
  license_number?: string;
  city?: string;
  address?: string;
  postal_code?: string;
  country?: string;
  bio?: string;
  specializations?: string[];
  languages?: string[];
  website?: string;
  avatar_url?: string;
  cover_image_url?: string;
  portfolio_images?: string[];
  years_experience?: number;
  is_active?: boolean;
}

// =====================================================
// ACCOUNTANT CRUD
// =====================================================

/**
 * Get accountant by ID (can be accountant.id or profile_id)
 */
export async function getAccountant(
  accountantId: string
): Promise<Accountant | null> {
  // First try to find by accountant.id
  let { data, error } = await supabaseAny
    .from("accountants")
    .select("*")
    .eq("id", accountantId)
    .single();

  // If not found, try to find by profile_id
  if (error?.code === "PGRST116") {
    const result = await supabaseAny
      .from("accountants")
      .select("*")
      .eq("profile_id", accountantId)
      .single();

    data = result.data;
    error = result.error;
  }

  if (error) {
    console.error("Error fetching accountant:", error);
    return null;
  }

  // Fetch profile view count using accountant's actual ID
  const { count } = await supabase
    .from("profile_views")
    .select("*", { count: "exact", head: true })
    .eq("accountant_id", data.id);

  return {
    ...data,
    profile_views: count || 0,
  } as Accountant;
}

/**
 * Get accountant by profile ID
 */
export async function getAccountantByProfileId(
  profileId: string
): Promise<Accountant | null> {
  const { data, error } = await supabaseAny
    .from("accountants")
    .select("*")
    .eq("profile_id", profileId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      // No rows returned
      return null;
    }
    console.error("Error fetching accountant by profile:", error);
    return null;
  }

  // Fetch profile view count
  if (data?.id) {
    const { count, error: countError } = await supabase
      .from("profile_views")
      .select("*", { count: "exact", head: true })
      .eq("accountant_id", data.id);

    console.log(
      "🔍 [ACCOUNTANT] Fetching profile_views for accountant:",
      data.id,
      "count:",
      count
    );

    if (countError) {
      console.error(
        "❌ [ACCOUNTANT] Error fetching profile_views:",
        countError
      );
    }

    return {
      ...data,
      profile_views: count || 0,
    } as Accountant;
  }

  return data as any;
}

/**
 * Get all active accountants
 */
export async function getAccountants(filters?: {
  city?: string;
  specializations?: string[];
  languages?: string[];
  minRating?: number;
}): Promise<Accountant[]> {
  let query = supabaseAny
    .from("accountants")
    .select("*")
    .eq("is_active", true)
    .order("rating", { ascending: false });

  if (filters?.city) {
    query = query.eq("city", filters.city);
  }

  if (filters?.specializations && filters.specializations.length > 0) {
    query = query.contains("specializations", filters.specializations);
  }

  if (filters?.languages && filters.languages.length > 0) {
    query = query.contains("languages", filters.languages);
  }

  if (filters?.minRating) {
    query = query.gte("rating", filters.minRating);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching accountants:", error);
    return [];
  }

  return (data || []) as any;
}

/**
 * Create new accountant profile
 */
export async function createAccountant(
  accountantData: CreateAccountantData
): Promise<Accountant | null> {
  const { data, error } = await supabaseAny
    .from("accountants")
    .insert({
      ...accountantData,
      country: accountantData.country || "Nederland",
      languages: accountantData.languages || ["Nederlands"],
      specializations: accountantData.specializations || [],
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating accountant:", error);
    throw error;
  }

  return data as any;
}

/**
 * Update accountant profile
 */
export async function updateAccountant(
  accountantId: string,
  updates: UpdateAccountantData
): Promise<Accountant | null> {
  const { data, error } = await supabaseAny
    .from("accountants")
    .update(updates)
    .eq("id", accountantId)
    .select()
    .single();

  if (error) {
    console.error("Error updating accountant:", error);
    throw error;
  }

  return data as any;
}

/**
 * Delete accountant (soft delete by setting is_active = false)
 */
export async function deleteAccountant(accountantId: string): Promise<boolean> {
  const { error } = await supabaseAny
    .from("accountants")
    .update({ is_active: false })
    .eq("id", accountantId);

  if (error) {
    console.error("Error deleting accountant:", error);
    return false;
  }

  return true;
}

// =====================================================
// SERVICES
// =====================================================

/**
 * Get all services for an accountant
 */
export async function getAccountantServices(
  accountantId: string
): Promise<AccountantService[]> {
  const { data, error } = await supabaseAny
    .from("accountant_services")
    .select("*")
    .eq("accountant_id", accountantId)
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  if (error) {
    console.error("Error fetching services:", error);
    return [];
  }

  return (data || []) as any;
}

/**
 * Create new service
 */
export async function createAccountantService(
  serviceData: Omit<AccountantService, "id" | "created_at" | "updated_at">
): Promise<AccountantService | null> {
  const { data, error } = await supabaseAny
    .from("accountant_services")
    .insert(serviceData)
    .select()
    .single();

  if (error) {
    console.error("Error creating service:", error);
    throw error;
  }

  return data as any;
}

/**
 * Update service
 */
export async function updateAccountantService(
  serviceId: string,
  updates: Partial<
    Omit<
      AccountantService,
      "id" | "accountant_id" | "created_at" | "updated_at"
    >
  >
): Promise<AccountantService | null> {
  const { data, error } = await supabaseAny
    .from("accountant_services")
    .update(updates)
    .eq("id", serviceId)
    .select()
    .single();

  if (error) {
    console.error("Error updating service:", error);
    throw error;
  }

  return data as any;
}

/**
 * Delete service (soft delete)
 */
export async function deleteAccountantService(
  serviceId: string
): Promise<boolean> {
  const { error } = await supabaseAny
    .from("accountant_services")
    .update({ is_active: false })
    .eq("id", serviceId);

  if (error) {
    console.error("Error deleting service:", error);
    return false;
  }

  return true;
}

// =====================================================
// FORMS
// =====================================================

/**
 * Get all forms for an accountant
 */
export async function getAccountantForms(
  accountantId: string
): Promise<AccountantForm[]> {
  const { data, error } = await supabaseAny
    .from("accountant_forms")
    .select("*")
    .eq("accountant_id", accountantId)
    .eq("is_active", true);

  if (error) {
    console.error("Error fetching forms:", error);
    return [];
  }

  return (data || []) as any;
}

/**
 * Get single form by ID
 */
export async function getAccountantForm(
  formId: string
): Promise<AccountantForm | null> {
  const { data, error } = await supabaseAny
    .from("accountant_forms")
    .select("*")
    .eq("id", formId)
    .single();

  if (error) {
    console.error("Error fetching form:", error);
    return null;
  }

  return data as any;
}

/**
 * Create new form
 */
export async function createAccountantForm(
  formData: Omit<AccountantForm, "id" | "created_at" | "updated_at">
): Promise<AccountantForm | null> {
  const { data, error } = await supabaseAny
    .from("accountant_forms")
    .insert(formData)
    .select()
    .single();

  if (error) {
    console.error("Error creating form:", error);
    throw error;
  }

  return data as any;
}

/**
 * Update form
 */
export async function updateAccountantForm(
  formId: string,
  updates: Partial<
    Omit<AccountantForm, "id" | "accountant_id" | "created_at" | "updated_at">
  >
): Promise<AccountantForm | null> {
  const { data, error } = await supabaseAny
    .from("accountant_forms")
    .update(updates)
    .eq("id", formId)
    .select()
    .single();

  if (error) {
    console.error("Error updating form:", error);
    throw error;
  }

  return data as any;
}

/**
 * Delete form (soft delete)
 */
export async function deleteAccountantForm(formId: string): Promise<boolean> {
  const { error } = await supabaseAny
    .from("accountant_forms")
    .update({ is_active: false })
    .eq("id", formId);

  if (error) {
    console.error("Error deleting form:", error);
    return false;
  }

  return true;
}

// =====================================================
// FORM SUBMISSIONS
// =====================================================

/**
 * Submit a form
 */
export async function submitForm(
  submissionData: Omit<
    FormSubmission,
    "id" | "submitted_at" | "updated_at" | "completed_at"
  >
): Promise<FormSubmission | null> {
  const { data, error } = await supabaseAny
    .from("form_submissions")
    .insert(submissionData)
    .select()
    .single();

  if (error) {
    console.error("Error submitting form:", error);
    throw error;
  }

  return data as any;
}

/**
 * Get submissions for an accountant
 */
export async function getAccountantSubmissions(
  accountantId: string,
  filters?: {
    status?: FormSubmission["status"];
  }
): Promise<FormSubmission[]> {
  let query = supabaseAny
    .from("form_submissions")
    .select("*")
    .eq("accountant_id", accountantId)
    .order("submitted_at", { ascending: false });

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching submissions:", error);
    return [];
  }

  return (data || []) as any;
}

/**
 * Get submissions by user (submitter)
 */
export async function getUserSubmissions(
  userId: string
): Promise<FormSubmission[]> {
  const { data, error } = await supabaseAny
    .from("form_submissions")
    .select("*")
    .eq("submitter_id", userId)
    .order("submitted_at", { ascending: false });

  if (error) {
    console.error("Error fetching user submissions:", error);
    return [];
  }

  return (data || []) as any;
}

/**
 * Update submission (for accountant response)
 */
export async function updateSubmission(
  submissionId: string,
  updates: {
    status?: FormSubmission["status"];
    accountant_response?: string;
    accountant_files?: string[];
  }
): Promise<FormSubmission | null> {
  const updateData: any = { ...updates };

  if (updates.status === "completed") {
    updateData.completed_at = new Date().toISOString();
  }

  const { data, error } = await supabaseAny
    .from("form_submissions")
    .update(updateData)
    .eq("id", submissionId)
    .select()
    .single();

  if (error) {
    console.error("Error updating submission:", error);
    throw error;
  }

  return data as any;
}

// =====================================================
// REVIEWS
// =====================================================

/**
 * Get reviews for an accountant (PUBLIC - with employer details)
 */
export async function getAccountantReviews(
  accountantId: string,
  limit: number = 50
): Promise<AccountantReview[]> {
  console.log("📋 Fetching reviews for accountant:", accountantId);

  try {
    // SIMPLIFIED - no employer JOIN because FK doesn't exist yet
    const { data, error } = await supabaseAny
      .from("accountant_reviews")
      .select("*")
      .eq("accountant_id", accountantId)
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("❌ Error fetching accountant reviews:", error);
      return [];
    }

    console.log(`✅ Loaded ${data?.length || 0} reviews for accountant`);
    return data || [];
  } catch (error) {
    console.error("❌ Error in getAccountantReviews:", error);
    return [];
  }
}

/**
 * Create review
 */
export async function createAccountantReview(
  reviewData: Omit<AccountantReview, "id" | "created_at">
): Promise<AccountantReview | null> {
  const { data, error } = await supabaseAny
    .from("accountant_reviews")
    .insert(reviewData)
    .select()
    .single();

  if (error) {
    console.error("Error creating review:", error);
    throw error;
  }

  return data as any;
}

/**
 * Update review
 */
export async function updateAccountantReview(
  reviewId: string,
  updates: Partial<
    Omit<
      AccountantReview,
      "id" | "accountant_id" | "reviewer_id" | "created_at"
    >
  >
): Promise<AccountantReview | null> {
  const { data, error } = await supabaseAny
    .from("accountant_reviews")
    .update(updates)
    .eq("id", reviewId)
    .select()
    .single();

  if (error) {
    console.error("Error updating review:", error);
    throw error;
  }

  return data as any;
}

/**
 * Get review statistics for an accountant
 */
export async function getAccountantReviewStats(accountantId: string): Promise<{
  averageRating: number;
  totalReviews: number;
  ratingDistribution: Record<number, number>;
  averageProfessionalism: number;
  averageCommunication: number;
  averageQuality: number;
  averageTimeliness: number;
  recommendationRate: number;
}> {
  const reviews = await getAccountantReviews(accountantId);

  if (reviews.length === 0) {
    return {
      averageRating: 0,
      totalReviews: 0,
      ratingDistribution: {},
      averageProfessionalism: 0,
      averageCommunication: 0,
      averageQuality: 0,
      averageTimeliness: 0,
      recommendationRate: 0,
    };
  }

  const ratingDistribution: Record<number, number> = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  };
  let totalProfessionalism = 0;
  let totalCommunication = 0;
  let totalQuality = 0;
  let totalTimeliness = 0;
  let professionalismCount = 0;
  let communicationCount = 0;
  let qualityCount = 0;
  let timelinessCount = 0;
  let recommendCount = 0;

  reviews.forEach((review) => {
    ratingDistribution[review.rating]++;

    if (review.professionalism_rating) {
      totalProfessionalism += review.professionalism_rating;
      professionalismCount++;
    }
    if (review.communication_rating) {
      totalCommunication += review.communication_rating;
      communicationCount++;
    }
    if (review.quality_rating) {
      totalQuality += review.quality_rating;
      qualityCount++;
    }
    if (review.timeliness_rating) {
      totalTimeliness += review.timeliness_rating;
      timelinessCount++;
    }
    if (review.would_recommend) {
      recommendCount++;
    }
  });

  const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);

  return {
    averageRating: totalRating / reviews.length,
    totalReviews: reviews.length,
    ratingDistribution,
    averageProfessionalism:
      professionalismCount > 0
        ? totalProfessionalism / professionalismCount
        : 0,
    averageCommunication:
      communicationCount > 0 ? totalCommunication / communicationCount : 0,
    averageQuality: qualityCount > 0 ? totalQuality / qualityCount : 0,
    averageTimeliness:
      timelinessCount > 0 ? totalTimeliness / timelinessCount : 0,
    recommendationRate: (recommendCount / reviews.length) * 100,
  };
}

// =====================================================
// SEARCH & FILTERS
// =====================================================

/**
 * Search accountants with advanced filters
 */
export async function searchAccountants(searchParams: {
  query?: string;
  city?: string;
  specializations?: string[];
  languages?: string[];
  minRating?: number;
  maxPrice?: number;
  priceType?: string;
  isVerified?: boolean;
  limit?: number;
  offset?: number;
}): Promise<{ accountants: Accountant[]; total: number }> {
  let query = supabaseAny
    .from("accountants")
    .select("*", { count: "exact" })
    .eq("is_active", true);

  // Text search in name, company_name, bio
  if (searchParams.query) {
    query = query.or(
      `full_name.ilike.%${searchParams.query}%,company_name.ilike.%${searchParams.query}%,bio.ilike.%${searchParams.query}%`
    );
  }

  // City filter
  if (searchParams.city) {
    query = query.eq("city", searchParams.city);
  }

  // Specializations filter
  if (searchParams.specializations && searchParams.specializations.length > 0) {
    query = query.contains("specializations", searchParams.specializations);
  }

  // Languages filter
  if (searchParams.languages && searchParams.languages.length > 0) {
    query = query.contains("languages", searchParams.languages);
  }

  // Rating filter
  if (searchParams.minRating) {
    query = query.gte("rating", searchParams.minRating);
  }

  // Verified filter
  if (searchParams.isVerified !== undefined) {
    query = query.eq("is_verified", searchParams.isVerified);
  }

  // Pagination
  if (searchParams.limit) {
    query = query.limit(searchParams.limit);
  }
  if (searchParams.offset) {
    query = query.range(
      searchParams.offset,
      searchParams.offset + (searchParams.limit || 10) - 1
    );
  }

  // Order by rating
  query = query.order("rating", { ascending: false });

  const { data, error, count } = await query;

  if (error) {
    console.error("Error searching accountants:", error);
    return { accountants: [], total: 0 };
  }

  return { accountants: data || [], total: count || 0 };
}

/**
 * Get unique cities for filter dropdown
 */
export async function getAccountantCities(): Promise<string[]> {
  const { data, error } = await supabaseAny
    .from("accountants")
    .select("city")
    .eq("is_active", true)
    .not("city", "is", null);

  if (error) {
    console.error("Error fetching cities:", error);
    return [];
  }

  const uniqueCities = [...new Set(data.map((item: any) => item.city))].filter(
    Boolean
  ) as string[];
  return uniqueCities.sort();
}

// =====================================================
// PUBLIC PROFILE FUNCTIONS (NEW - 2025-11-11)
// =====================================================

/**
 * Get accountant public profile by ID (with average rating and total reviews)
 */
export async function getAccountantById(
  accountantId: string
): Promise<Accountant | null> {
  console.log("🔍 Fetching accountant by ID:", accountantId);

  try {
    // Fetch accountant profile
    const { data: accountant, error: accountantError } = await supabaseAny
      .from("accountants")
      .select("*")
      .eq("id", accountantId)
      .maybeSingle();

    if (accountantError) {
      console.error("❌ Error fetching accountant:", accountantError);
      return null;
    }

    if (!accountant) {
      console.error("❌ Accountant not found:", accountantId);
      return null;
    }

    if (!accountant) {
      console.warn("⚠️ Accountant not found:", accountantId);
      return null;
    }

    // Fetch review statistics
    const { data: reviews, error: reviewsError } = await supabaseAny
      .from("accountant_reviews")
      .select("rating")
      .eq("accountant_id", accountantId);

    if (reviewsError) {
      console.error("❌ Error fetching reviews for stats:", reviewsError);
      // Continue without stats
    }

    // Calculate average rating and count
    const totalReviews = reviews?.length || 0;
    const averageRating =
      totalReviews > 0
        ? reviews.reduce((sum: number, r: any) => sum + r.rating, 0) /
          totalReviews
        : 0;

    console.log("✅ Accountant profile loaded:", {
      id: accountant.id,
      company_name: accountant.company_name,
      averageRating: averageRating.toFixed(1),
      totalReviews,
      calculatedRating: parseFloat(averageRating.toFixed(1)),
      reviewsRaw: reviews,
    });

    return {
      ...accountant,
      rating: parseFloat(averageRating.toFixed(1)),
      rating_count: totalReviews,
    };
  } catch (error) {
    console.error("❌ Error in getAccountantById:", error);
    return null;
  }
}

/**
 * Track profile view for analytics
 */
/**
 * Track profile view for analytics
 */
export async function trackAccountantProfileView(
  accountantId: string,
  viewerProfileId?: string
): Promise<void> {
  console.log("👁️ Tracking profile view:", { accountantId, viewerProfileId });

  try {
    // Fetch current view count
    const { data: accountant, error: fetchError } = await supabaseAny
      .from("accountants")
      .select("profile_views")
      .eq("id", accountantId)
      .maybeSingle();

    if (fetchError) {
      console.error("❌ Error fetching current profile_views:", fetchError);
      return;
    }

    if (!accountant) {
      console.error("❌ Accountant not found:", accountantId);
      return;
    }

    // Increment by 1
    const newViewCount = (accountant?.profile_views || 0) + 1;

    const { error: updateError } = await supabaseAny
      .from("accountants")
      .update({
        profile_views: newViewCount,
        updated_at: new Date().toISOString(),
      })
      .eq("id", accountantId);

    if (updateError) {
      console.error("❌ Error updating profile_views:", updateError);
      return;
    }

    console.log(`✅ Profile view tracked: ${newViewCount} total views`);
  } catch (error) {
    console.error("❌ Error in trackAccountantProfileView:", error);
    // Don't throw - tracking is non-critical
  }
}

/**
 * Get my accountant reviews (for dashboard)
 */
export async function getMyReviews(
  accountantId: string
): Promise<AccountantReview[]> {
  console.log("📋 Fetching my reviews for accountant dashboard:", accountantId);

  try {
    // SIMPLIFIED - no employer JOIN because FK doesn't exist yet
    const { data, error } = await supabaseAny
      .from("accountant_reviews")
      .select("*")
      .eq("accountant_id", accountantId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("❌ Error fetching my reviews:", error);
      return [];
    }

    console.log(`✅ Loaded ${data?.length || 0} reviews for dashboard`);
    return data || [];
  } catch (error) {
    console.error("❌ Error in getMyReviews:", error);
    return [];
  }
}

/**
 * Respond to a review (UPDATE response_text)
 */
export async function respondToReview(
  reviewId: string,
  responseText: string
): Promise<{ success: boolean; error?: string }> {
  console.log("💬 Responding to review:", reviewId);

  try {
    const { error } = await supabaseAny
      .from("accountant_reviews")
      .update({
        response_text: responseText,
        response_date: new Date().toISOString(),
      })
      .eq("id", reviewId);

    if (error) {
      console.error("❌ Error responding to review:", error);
      return { success: false, error: error.message };
    }

    console.log("✅ Review response saved");
    return { success: true };
  } catch (error: any) {
    console.error("❌ Error in respondToReview:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Update accountant's rating and rating_count in database
 * Call this after review INSERT/UPDATE/DELETE to keep stats current
 */
export async function updateAccountantRating(
  accountantId: string
): Promise<void> {
  console.log("🔄 Updating accountant rating for ID:", accountantId);

  try {
    // Fetch all reviews for this accountant
    const { data: reviews, error: reviewsError } = await supabaseAny
      .from("accountant_reviews")
      .select("rating")
      .eq("accountant_id", accountantId)
      .eq("status", "approved"); // Only count approved reviews

    if (reviewsError) {
      console.error(
        "❌ Error fetching reviews for rating update:",
        reviewsError
      );
      return;
    }

    // Calculate stats
    const totalReviews = reviews?.length || 0;
    const averageRating =
      totalReviews > 0
        ? reviews.reduce((sum: number, r: any) => sum + r.rating, 0) /
          totalReviews
        : 0;

    // Update accountants table
    const { error: updateError } = await supabaseAny
      .from("accountants")
      .update({
        rating: parseFloat(averageRating.toFixed(1)),
        rating_count: totalReviews,
        updated_at: new Date().toISOString(),
      })
      .eq("id", accountantId);

    if (updateError) {
      console.error("❌ Error updating accountant rating:", updateError);
      return;
    }

    console.log("✅ Accountant rating updated:", {
      accountantId,
      rating: parseFloat(averageRating.toFixed(1)),
      rating_count: totalReviews,
    });
  } catch (error) {
    console.error("❌ Error in updateAccountantRating:", error);
  }
}

/**
 * Save or update weekly availability
 */
export async function saveAvailability(
  profileId: string,
  availability: any
): Promise<{ success: boolean; error?: string }> {
  console.log("💾 Saving availability for profile:", profileId);

  try {
    // Check if availability record exists
    const { data: existing } = await supabaseAny
      .from("availability")
      .select("id")
      .eq("profile_id", profileId)
      .maybeSingle();

    if (existing) {
      // UPDATE existing record
      const { error } = await supabaseAny
        .from("availability")
        .update({
          monday: availability.monday || false,
          tuesday: availability.tuesday || false,
          wednesday: availability.wednesday || false,
          thursday: availability.thursday || false,
          friday: availability.friday || false,
          saturday: availability.saturday || false,
          sunday: availability.sunday || false,
          updated_at: new Date().toISOString(),
        })
        .eq("profile_id", profileId);

      if (error) {
        console.error("❌ Error updating availability:", error);
        return { success: false, error: error.message };
      }

      console.log("✅ Availability updated");
      return { success: true };
    } else {
      // INSERT new record
      const { error } = await supabaseAny.from("availability").insert({
        profile_id: profileId,
        monday: availability.monday || false,
        tuesday: availability.tuesday || false,
        wednesday: availability.wednesday || false,
        thursday: availability.thursday || false,
        friday: availability.friday || false,
        saturday: availability.saturday || false,
        sunday: availability.sunday || false,
      });

      if (error) {
        console.error("❌ Error inserting availability:", error);
        return { success: false, error: error.message };
      }

      console.log("✅ Availability created");
      return { success: true };
    }
  } catch (error: any) {
    console.error("❌ Error in saveAvailability:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Load weekly availability
 */
export async function getAvailability(profileId: string): Promise<any | null> {
  console.log("📅 Loading availability for profile:", profileId);

  try {
    const { data, error } = await supabaseAny
      .from("availability")
      .select("*")
      .eq("profile_id", profileId)
      .maybeSingle(); // ✅ FIX: Use maybeSingle() instead of single()

    if (error) {
      console.warn("⚠️ Error loading availability:", error.message);
      return null;
    }

    if (!data) {
      console.log("ℹ️ No availability record found for profile:", profileId);
      return null;
    }

    return data;
  } catch (error) {
    console.error("❌ Error in getAvailability:", error);
    return null;
  }
}

/**
 * Add unavailable date
 */
export async function addUnavailableDate(
  profileId: string,
  date: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  console.log("🚫 Adding unavailable date:", { profileId, date, reason });

  try {
    const { error } = await supabaseAny.from("unavailable_dates").insert({
      profile_id: profileId,
      date,
      reason: reason || null,
    });

    if (error) {
      console.error("❌ Error adding unavailable date:", error);
      return { success: false, error: error.message };
    }

    console.log("✅ Unavailable date added");
    return { success: true };
  } catch (error: any) {
    console.error("❌ Error in addUnavailableDate:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Get unavailable dates
 */
export async function getUnavailableDates(profileId: string): Promise<any[]> {
  console.log("📋 Loading unavailable dates for profile:", profileId);

  try {
    const { data, error } = await supabaseAny
      .from("unavailable_dates")
      .select("*")
      .eq("profile_id", profileId)
      .gte("date", new Date().toISOString().split("T")[0]) // Only future dates
      .order("date", { ascending: true });

    if (error) {
      console.error("❌ Error loading unavailable dates:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("❌ Error in getUnavailableDates:", error);
    return [];
  }
}

/**
 * Remove unavailable date
 */
export async function removeUnavailableDate(
  dateId: string
): Promise<{ success: boolean; error?: string }> {
  console.log("🗑️ Removing unavailable date:", dateId);

  try {
    const { error } = await supabaseAny
      .from("unavailable_dates")
      .delete()
      .eq("id", dateId);

    if (error) {
      console.error("❌ Error removing unavailable date:", error);
      return { success: false, error: error.message };
    }

    console.log("✅ Unavailable date removed");
    return { success: true };
  } catch (error: any) {
    console.error("❌ Error in removeUnavailableDate:", error);
    return { success: false, error: error.message };
  }
}
