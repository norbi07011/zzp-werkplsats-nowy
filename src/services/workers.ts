// @ts-nocheck
// Type checking disabled due to Supabase auto-generated types issues
// TODO: Regenerate database.types.ts using: npx supabase gen types typescript --project-id dtnotuyagygexmkyqtgb

import { supabase } from "@/lib/supabase";
import { Database } from "../lib/database.types";

type Worker = Database["public"]["Tables"]["workers"]["Row"];
type WorkerInsert = Database["public"]["Tables"]["workers"]["Insert"];
type WorkerUpdate = Database["public"]["Tables"]["workers"]["Update"];
type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export interface WorkerWithProfile extends Worker {
  profile: Profile;
}

/**
 * Fetch all workers with their profiles (WORKERS ONLY - no cleaning companies)
 * ✅ FIXED 2025-01-16: Removed cleaning_companies UNION (caused duplicates)
 * 📦 Backup: archiwum/smieci/cleaning-companies-migration-2025-01-16/
 */
export async function fetchWorkers(): Promise<WorkerWithProfile[]> {
  console.log("🔍 Fetching workers (without cleaning companies)...");

  const { data: workersData, error: workersError } = await supabase
    .from("workers")
    .select(
      `
      *,
      profile:profiles!workers_profile_id_fkey (
        id,
        full_name,
        email,
        avatar_url,
        role
      )
    `
    )
    .order("created_at", { ascending: false });

  if (workersError) {
    console.error("❌ Error fetching workers:", workersError);
    throw workersError;
  }

  console.log("📊 Loaded workers:", workersData?.length || 0);
  return (workersData || []) as WorkerWithProfile[];
}

/**
 * Fetch single worker by ID with profile
 */
export async function fetchWorkerById(
  workerId: string
): Promise<WorkerWithProfile | null> {
  const { data, error } = await supabase
    .from("workers")
    .select(
      `
      *,
      profile:profiles!workers_profile_id_fkey (
        id,
        full_name,
        email,
        avatar_url,
        role
      )
    `
    )
    .eq("id", workerId)
    .single();

  if (error) {
    console.error("Error fetching worker:", error);
    return null;
  }

  return data as WorkerWithProfile;
}

/**
 * Fetch workers by specialization
 */
export async function fetchWorkersBySpecialization(
  specialization: string
): Promise<WorkerWithProfile[]> {
  const { data, error } = await supabase
    .from("workers")
    .select(
      `
      *,
      profile:profiles!workers_profile_id_fkey (
        id,
        full_name,
        email,
        avatar_url,
        role
      )
    `
    )
    .eq("specialization", specialization)
    .order("rating", { ascending: false });

  if (error) {
    console.error("Error fetching workers by specialization:", error);
    throw error;
  }

  return data as WorkerWithProfile[];
}

/**
 * Fetch verified workers only
 */
export async function fetchVerifiedWorkers(): Promise<WorkerWithProfile[]> {
  const { data, error } = await supabase
    .from("workers")
    .select(
      `
      *,
      profile:profiles!workers_profile_id_fkey (
        id,
        full_name,
        email,
        avatar_url,
        role
      )
    `
    )
    .eq("verified", true)
    .order("rating", { ascending: false });

  if (error) {
    console.error("Error fetching verified workers:", error);
    throw error;
  }

  return data as WorkerWithProfile[];
}

/**
 * Search workers by location (within radius using PostGIS)
 * @param lat Latitude of search center
 * @param lng Longitude of search center
 * @param radiusKm Radius in kilometers
 */
export async function searchWorkersByLocation(
  lat: number,
  lng: number,
  radiusKm: number
): Promise<WorkerWithProfile[]> {
  // Use PostGIS ST_DWithin for geographic distance queries
  const { data, error } = await (supabase.rpc as any)(
    "search_workers_by_location",
    {
      search_lat: lat,
      search_lng: lng,
      search_radius_km: radiusKm,
    }
  );

  if (error) {
    console.error("Error searching workers by location:", error);
    throw error;
  }

  return data as WorkerWithProfile[];
}

/**
 * Create new worker profile
 */
export async function createWorker(
  worker: WorkerInsert
): Promise<Worker | null> {
  const { data, error } = await supabase
    .from("workers")
    .insert(worker as any)
    .select()
    .single();

  if (error) {
    console.error("Error creating worker:", error);
    throw error;
  }

  return data;
}

/**
 * Update worker profile
 */
export async function updateWorker(
  workerId: string,
  updates: WorkerUpdate
): Promise<Worker | null> {
  const { data, error } = await supabase
    .from("workers")
    .update(updates as any)
    .eq("id", workerId)
    .select()
    .single();

  if (error) {
    console.error("Error updating worker:", error);
    throw error;
  }

  return data;
}

/**
 * Verify worker (admin action)
 */
export async function verifyWorker(
  workerId: string,
  verificationDocuments: any
): Promise<boolean> {
  const { error } = await supabase
    .from("workers")
    .update({
      verified: true,
      verification_documents: verificationDocuments,
    } as any)
    .eq("id", workerId);

  if (error) {
    console.error("Error verifying worker:", error);
    return false;
  }

  return true;
}

/**
 * Unverify worker (admin action)
 */
export async function unverifyWorker(workerId: string): Promise<boolean> {
  const { error } = await supabase
    .from("workers")
    .update({
      verified: false,
    } as any)
    .eq("id", workerId);

  if (error) {
    console.error("Error unverifying worker:", error);
    return false;
  }

  return true;
}

/**
 * Delete worker (admin action - cascades to related records)
 */
export async function deleteWorker(workerId: string): Promise<boolean> {
  const { error } = await supabase.from("workers").delete().eq("id", workerId);

  if (error) {
    console.error("Error deleting worker:", error);
    return false;
  }

  return true;
}

/**
 * Update worker rating (called by trigger, but can be manual)
 */
export async function updateWorkerRating(workerId: string): Promise<boolean> {
  // This is typically handled by database trigger after review insert
  // But can be called manually if needed

  const { data: reviews } = await supabase
    .from("reviews")
    .select("rating")
    .eq("reviewee_id", workerId);

  if (!reviews || reviews.length === 0) {
    return true; // No reviews yet
  }

  const avgRating =
    (reviews as any[]).reduce((sum: number, r: any) => sum + r.rating, 0) /
    reviews.length;
  const ratingCount = reviews.length;

  const { error } = await supabase
    .from("workers")
    .update({
      rating: avgRating,
      rating_count: ratingCount,
    } as any)
    .eq("id", workerId);

  if (error) {
    console.error("Error updating worker rating:", error);
    return false;
  }

  return true;
}

/**
 * Get worker statistics
 */
export async function getWorkerStats() {
  const { count: totalWorkers } = await supabase
    .from("workers")
    .select("*", { count: "exact", head: true });

  const { count: verifiedWorkers } = await supabase
    .from("workers")
    .select("*", { count: "exact", head: true })
    .eq("verified", true);

  const { data: topRatedWorkers } = await supabase
    .from("workers")
    .select(
      `
      *,
      profile:profiles!workers_profile_id_fkey (
        id,
        full_name,
        email,
        avatar_url,
        role
      )
    `
    )
    .order("rating", { ascending: false })
    .limit(5);

  return {
    total: totalWorkers || 0,
    verified: verifiedWorkers || 0,
    unverified: (totalWorkers || 0) - (verifiedWorkers || 0),
    topRated: topRatedWorkers || [],
  };
}

/**
 * Check if worker has valid VCA certificate
 * VCA = Veiligheid, gezondheid en milieu Checklist Aannemers (Dutch safety certification)
 */
export async function checkWorkerVCA(workerId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("certificates")
    .select("id, certificate_type, expiry_date, verified")
    .eq("worker_id", workerId)
    .ilike("certificate_type", "%VCA%")
    .eq("verified", true)
    .gte("expiry_date", new Date().toISOString().split("T")[0])
    .limit(1);

  if (error) {
    console.error("Error checking VCA certificate:", error);
    return false;
  }

  return data && data.length > 0;
}

/**
 * Batch check VCA certificates for multiple workers
 */
export async function batchCheckWorkersVCA(
  workerIds: string[]
): Promise<Record<string, boolean>> {
  if (workerIds.length === 0) return {};

  const { data, error } = await supabase
    .from("certificates")
    .select("worker_id, certificate_type, expiry_date, verified")
    .in("worker_id", workerIds)
    .ilike("certificate_type", "%VCA%")
    .eq("verified", true)
    .gte("expiry_date", new Date().toISOString().split("T")[0]);

  if (error) {
    console.error("Error batch checking VCA certificates:", error);
    return workerIds.reduce((acc, id) => ({ ...acc, [id]: false }), {});
  }

  const vcaMap = new Set((data || []).map((cert) => cert.worker_id));
  return workerIds.reduce((acc, id) => ({ ...acc, [id]: vcaMap.has(id) }), {});
}
