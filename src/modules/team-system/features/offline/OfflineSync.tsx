/**
 * ================================================================
 * OFFLINE SYNC - Zarządzanie danymi offline (PWA)
 * ================================================================
 */

import React, { useState, useEffect, useCallback } from "react";
import Wifi from "lucide-react/dist/esm/icons/wifi";
import WifiOff from "lucide-react/dist/esm/icons/wifi-off";
import CloudOff from "lucide-react/dist/esm/icons/cloud-off";
import CloudUpload from "lucide-react/dist/esm/icons/cloud-upload";
import RefreshCw from "lucide-react/dist/esm/icons/refresh-cw";
import Check from "lucide-react/dist/esm/icons/check";
import AlertTriangle from "lucide-react/dist/esm/icons/alert-triangle";
import Clock from "lucide-react/dist/esm/icons/clock";
import Trash2 from "lucide-react/dist/esm/icons/trash-2";
import Loader from "lucide-react/dist/esm/icons/loader";
import Database from "lucide-react/dist/esm/icons/database";
import { supabaseUntyped as supabase } from "../../../../lib/supabase";
import { useAuth } from "../../../../../contexts/AuthContext";
import { toast } from "sonner";

interface PendingItem {
  id: string;
  type: "timesheet" | "expense" | "location";
  data: any;
  createdAt: number;
}

interface SyncStatus {
  isOnline: boolean;
  pendingCount: number;
  lastSyncAt: Date | null;
  isSyncing: boolean;
}

interface OfflineSyncProps {
  teamId: string;
  userId: string;
}

// IndexedDB database name
const DB_NAME = "zzp-offline-db";
const DB_VERSION = 1;
const STORES = ["pending_timesheets", "pending_expenses", "pending_location"];

export const OfflineSync: React.FC<OfflineSyncProps> = ({ teamId, userId }) => {
  const [status, setStatus] = useState<SyncStatus>({
    isOnline: navigator.onLine,
    pendingCount: 0,
    lastSyncAt: null,
    isSyncing: false,
  });
  const [pendingItems, setPendingItems] = useState<PendingItem[]>([]);
  const [expandPending, setExpandPending] = useState(false);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setStatus((prev) => ({ ...prev, isOnline: true }));
      toast.success("🌐 Połączono z internetem");
      // Auto-sync when back online
      syncAll();
    };

    const handleOffline = () => {
      setStatus((prev) => ({ ...prev, isOnline: false }));
      toast.warning("📴 Tryb offline - dane zostaną zsynchronizowane później");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Load pending items count
  useEffect(() => {
    loadPendingItems();
    loadLastSyncTime();
  }, []);

  const openDatabase = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event: any) => {
        const db = event.target.result;
        STORES.forEach((store) => {
          if (!db.objectStoreNames.contains(store)) {
            db.createObjectStore(store, { keyPath: "id" });
          }
        });
      };
    });
  };

  const loadPendingItems = async () => {
    try {
      const db = await openDatabase();
      const items: PendingItem[] = [];

      for (const store of STORES) {
        const tx = db.transaction(store, "readonly");
        const objectStore = tx.objectStore(store);
        const request = objectStore.getAll();

        await new Promise<void>((resolve) => {
          request.onsuccess = () => {
            const storeItems = request.result.map((item: any) => ({
              ...item,
              type: store.replace("pending_", "").replace("s", "") as any,
            }));
            items.push(...storeItems);
            resolve();
          };
        });
      }

      setPendingItems(items);
      setStatus((prev) => ({ ...prev, pendingCount: items.length }));
    } catch (error) {
      console.error("Error loading pending items:", error);
    }
  };

  const loadLastSyncTime = () => {
    const lastSync = localStorage.getItem("zzp-last-sync");
    if (lastSync) {
      setStatus((prev) => ({ ...prev, lastSyncAt: new Date(lastSync) }));
    }
  };

  const saveLastSyncTime = () => {
    const now = new Date();
    localStorage.setItem("zzp-last-sync", now.toISOString());
    setStatus((prev) => ({ ...prev, lastSyncAt: now }));
  };

  const syncAll = async () => {
    if (!status.isOnline || status.isSyncing) return;

    setStatus((prev) => ({ ...prev, isSyncing: true }));
    let syncedCount = 0;
    let errorCount = 0;

    try {
      const db = await openDatabase();

      // Sync timesheets
      const timesheetsTx = db.transaction("pending_timesheets", "readwrite");
      const timesheetsStore = timesheetsTx.objectStore("pending_timesheets");
      const timesheets = await new Promise<any[]>((resolve) => {
        const request = timesheetsStore.getAll();
        request.onsuccess = () => resolve(request.result);
      });

      for (const entry of timesheets) {
        try {
          const { error } = await supabase
            .from("team_timesheets")
            .insert(entry.data);
          if (!error) {
            timesheetsStore.delete(entry.id);
            syncedCount++;
          } else {
            throw error;
          }
        } catch (e) {
          errorCount++;
          console.error("Sync timesheet error:", e);
        }
      }

      // Sync expenses
      const expensesTx = db.transaction("pending_expenses", "readwrite");
      const expensesStore = expensesTx.objectStore("pending_expenses");
      const expenses = await new Promise<any[]>((resolve) => {
        const request = expensesStore.getAll();
        request.onsuccess = () => resolve(request.result);
      });

      for (const entry of expenses) {
        try {
          const { error } = await supabase
            .from("team_expense_claims")
            .insert(entry.data);
          if (!error) {
            expensesStore.delete(entry.id);
            syncedCount++;
          } else {
            throw error;
          }
        } catch (e) {
          errorCount++;
          console.error("Sync expense error:", e);
        }
      }

      // Sync location logs
      const locationTx = db.transaction("pending_location", "readwrite");
      const locationStore = locationTx.objectStore("pending_location");
      const locations = await new Promise<any[]>((resolve) => {
        const request = locationStore.getAll();
        request.onsuccess = () => resolve(request.result);
      });

      for (const entry of locations) {
        try {
          const { error } = await supabase
            .from("team_location_logs")
            .insert(entry.data);
          if (!error) {
            locationStore.delete(entry.id);
            syncedCount++;
          } else {
            throw error;
          }
        } catch (e) {
          errorCount++;
          console.error("Sync location error:", e);
        }
      }

      // Update state
      await loadPendingItems();
      saveLastSyncTime();

      if (syncedCount > 0) {
        toast.success(`✅ Zsynchronizowano ${syncedCount} elementów`);
      }
      if (errorCount > 0) {
        toast.error(`⚠️ ${errorCount} błędów synchronizacji`);
      }
    } catch (error) {
      console.error("Sync error:", error);
      toast.error("Błąd synchronizacji");
    } finally {
      setStatus((prev) => ({ ...prev, isSyncing: false }));
    }
  };

  const clearPendingItem = async (item: PendingItem) => {
    try {
      const storeName = `pending_${item.type}s`;
      const db = await openDatabase();
      const tx = db.transaction(storeName, "readwrite");
      tx.objectStore(storeName).delete(item.id);

      toast.success("Usunięto z kolejki");
      await loadPendingItems();
    } catch (error) {
      console.error("Error deleting item:", error);
      toast.error("Błąd usuwania");
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString("pl-PL", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getItemIcon = (type: string) => {
    switch (type) {
      case "timesheet":
        return "⏱️";
      case "expense":
        return "💰";
      case "location":
        return "📍";
      default:
        return "📄";
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div
          className={`w-12 h-12 rounded-full flex items-center justify-center ${
            status.isOnline ? "bg-emerald-100" : "bg-amber-100"
          }`}
        >
          {status.isOnline ? (
            <Wifi className="w-6 h-6 text-emerald-600" />
          ) : (
            <WifiOff className="w-6 h-6 text-amber-600" />
          )}
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Tryb Offline</h2>
          <p className="text-sm text-gray-500">
            {status.isOnline ? "Połączono" : "Brak połączenia"}
          </p>
        </div>
      </div>

      {/* Status Card */}
      <div
        className={`rounded-lg p-4 mb-6 ${
          status.isOnline
            ? "bg-emerald-50 border border-emerald-200"
            : "bg-amber-50 border border-amber-200"
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {status.isOnline ? (
              <Check className="w-5 h-5 text-emerald-600" />
            ) : (
              <CloudOff className="w-5 h-5 text-amber-600" />
            )}
            <div>
              <p
                className={`font-medium ${
                  status.isOnline ? "text-emerald-800" : "text-amber-800"
                }`}
              >
                {status.isOnline
                  ? "Dane synchronizowane na bieżąco"
                  : "Pracujesz w trybie offline"}
              </p>
              {status.lastSyncAt && (
                <p className="text-sm text-gray-600">
                  Ostatnia sync: {status.lastSyncAt.toLocaleString("pl-PL")}
                </p>
              )}
            </div>
          </div>

          {status.isOnline && (
            <button
              onClick={syncAll}
              disabled={status.isSyncing}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                status.isSyncing
                  ? "bg-gray-100 text-gray-400"
                  : "bg-emerald-600 text-white hover:bg-emerald-700"
              }`}
            >
              {status.isSyncing ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              Synchronizuj
            </button>
          )}
        </div>
      </div>

      {/* Pending Items */}
      <div className="space-y-4">
        <div
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setExpandPending(!expandPending)}
        >
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-gray-500" />
            <span className="font-medium text-gray-900">
              Oczekujące na synchronizację
            </span>
            {status.pendingCount > 0 && (
              <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-xs font-medium rounded-full">
                {status.pendingCount}
              </span>
            )}
          </div>
          <span className="text-sm text-gray-500">
            {expandPending ? "Zwiń" : "Rozwiń"}
          </span>
        </div>

        {expandPending && (
          <div className="space-y-2">
            {pendingItems.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Check className="w-8 h-8 mx-auto text-emerald-400 mb-2" />
                <p>Wszystko zsynchronizowane!</p>
              </div>
            ) : (
              pendingItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{getItemIcon(item.type)}</span>
                    <div>
                      <p className="font-medium text-gray-900 capitalize">
                        {item.type}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDate(item.createdAt)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => clearPendingItem(item)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Usuń z kolejki"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Jak działa tryb offline?</p>
            <ul className="list-disc list-inside space-y-1 text-blue-700">
              <li>
                Godziny i wydatki zapisują się lokalnie gdy brak internetu
              </li>
              <li>
                Po przywróceniu połączenia dane synchronizują się automatycznie
              </li>
              <li>
                Możesz też ręcznie wymusić synchronizację przyciskiem powyżej
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OfflineSync;
