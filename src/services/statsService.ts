import { supabase } from "@/lib/supabase";

export interface UserStats {
  totalWorkers: number;
  totalEmployers: number;
  totalAccountants: number;
  totalCleaningCompanies: number;
  totalUsers: number;
}

/**
 * Fetch real-time user statistics from database
 * @returns {Promise<UserStats>} User counts by role
 */
export async function getUserStats(): Promise<UserStats> {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("role")
      .not("role", "is", null);

    console.log("📊 getUserStats response:", {
      data,
      error,
      dataLength: data?.length,
    });

    if (error) throw error;

    // Count users by role
    const stats: UserStats = {
      totalWorkers: 0,
      totalEmployers: 0,
      totalAccountants: 0,
      totalCleaningCompanies: 0,
      totalUsers: 0,
    };

    data?.forEach((profile) => {
      stats.totalUsers++;
      switch (profile.role) {
        case "worker":
          stats.totalWorkers++;
          break;
        case "employer":
          stats.totalEmployers++;
          break;
        case "accountant":
          stats.totalAccountants++;
          break;
        case "cleaning_company":
          stats.totalCleaningCompanies++;
          break;
      }
    });

    console.log("📊 Final stats:", stats);
    return stats;
  } catch (error) {
    console.error("❌ Error fetching user stats:", error);
    // Return default values on error
    return {
      totalWorkers: 0,
      totalEmployers: 0,
      totalAccountants: 0,
      totalCleaningCompanies: 0,
      totalUsers: 0,
    };
  }
}

/**
 * Calculate total active professionals (workers + cleaning companies)
 */
export async function getTotalActiveProfessionals(): Promise<number> {
  const stats = await getUserStats();
  return stats.totalWorkers + stats.totalCleaningCompanies;
}
