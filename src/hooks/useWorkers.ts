import { useState, useEffect } from "react";
import {
  fetchWorkers,
  getWorkerStats,
  verifyWorker,
  unverifyWorker,
  deleteWorker,
  batchCheckWorkersVCA,
  WorkerWithProfile,
} from "../services/workers";

export interface WorkerWithVCA extends WorkerWithProfile {
  hasVca: boolean;
}

interface UseWorkersReturn {
  workers: WorkerWithVCA[];
  stats: {
    total: number;
    verified: number;
    unverified: number;
    topRated: any[];
  };
  loading: boolean;
  error: string | null;
  refreshWorkers: () => Promise<void>;
  verifyWorkerById: (
    workerId: string,
    verificationDocs: any
  ) => Promise<boolean>;
  unverifyWorkerById: (workerId: string) => Promise<boolean>;
  deleteWorkerById: (workerId: string) => Promise<boolean>;
}

/**
 * Custom hook for managing workers in admin panel
 * ✅ Includes VCA certificate check
 */
export function useWorkers(): UseWorkersReturn {
  const [workers, setWorkers] = useState<WorkerWithVCA[]>([]);
  const [stats, setStats] = useState<{
    total: number;
    verified: number;
    unverified: number;
    topRated: any[];
  }>({
    total: 0,
    verified: 0,
    unverified: 0,
    topRated: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadWorkers = async () => {
    try {
      setLoading(true);
      setError(null);
      const [workersData, statsData] = await Promise.all([
        fetchWorkers(),
        getWorkerStats(),
      ]);

      // Batch check VCA certificates for all workers
      const workerIds = workersData.map((w) => w.id);
      const vcaMap = await batchCheckWorkersVCA(workerIds);

      // Merge VCA status with worker data
      const workersWithVca: WorkerWithVCA[] = workersData.map((w) => ({
        ...w,
        hasVca: vcaMap[w.id] || false,
      }));

      setWorkers(workersWithVca);
      setStats(statsData);
    } catch (err: any) {
      console.error("Error loading workers:", err);
      setError(err.message || "Failed to load workers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkers();
  }, []);

  const refreshWorkers = async () => {
    await loadWorkers();
  };

  const verifyWorkerById = async (
    workerId: string,
    verificationDocs: any
  ): Promise<boolean> => {
    try {
      const success = await verifyWorker(workerId, verificationDocs);
      if (success) {
        await refreshWorkers();
      }
      return success;
    } catch (err: any) {
      console.error("Error verifying worker:", err);
      setError(err.message || "Failed to verify worker");
      return false;
    }
  };

  const unverifyWorkerById = async (workerId: string): Promise<boolean> => {
    try {
      const success = await unverifyWorker(workerId);
      if (success) {
        await refreshWorkers();
      }
      return success;
    } catch (err: any) {
      console.error("Error unverifying worker:", err);
      setError(err.message || "Failed to unverify worker");
      return false;
    }
  };

  const deleteWorkerById = async (workerId: string): Promise<boolean> => {
    try {
      const success = await deleteWorker(workerId);
      if (success) {
        await refreshWorkers();
      }
      return success;
    } catch (err: any) {
      console.error("Error deleting worker:", err);
      setError(err.message || "Failed to delete worker");
      return false;
    }
  };

  return {
    workers,
    stats,
    loading,
    error,
    refreshWorkers,
    verifyWorkerById,
    unverifyWorkerById,
    deleteWorkerById,
  };
}
