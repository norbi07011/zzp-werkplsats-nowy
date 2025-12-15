/**
 * ================================================================
 * OFFLINE STORAGE HELPERS
 * Funkcje do zapisywania danych w IndexedDB gdy brak internetu
 * ================================================================
 */

const DB_NAME = "zzp-offline-db";
const DB_VERSION = 1;

export type OfflineDataType = "timesheet" | "expense" | "location";

function getStoreName(type: OfflineDataType): string {
  const stores: Record<OfflineDataType, string> = {
    timesheet: "pending_timesheets",
    expense: "pending_expenses",
    location: "pending_location",
  };
  return stores[type];
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event: any) => {
      const db = event.target.result;
      ["pending_timesheets", "pending_expenses", "pending_location"].forEach(
        (store) => {
          if (!db.objectStoreNames.contains(store)) {
            db.createObjectStore(store, { keyPath: "id" });
          }
        }
      );
    };
  });
}

/**
 * Save data for offline sync
 */
export async function saveForOfflineSync(
  type: OfflineDataType,
  data: any
): Promise<string> {
  const id = `${type}_${Date.now()}_${Math.random().toString(36).substring(7)}`;

  try {
    const db = await openDatabase();
    const storeName = getStoreName(type);
    const tx = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);

    await new Promise<void>((resolve, reject) => {
      const request = store.add({
        id,
        data,
        createdAt: Date.now(),
      });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    // Trigger sync event if service worker is registered
    if (
      "serviceWorker" in navigator &&
      "sync" in ServiceWorkerRegistration.prototype
    ) {
      const registration = await navigator.serviceWorker.ready;
      await (registration as any).sync.register(`sync-${type}s`);
    }

    return id;
  } catch (error) {
    console.error("Error saving offline data:", error);
    throw error;
  }
}

/**
 * Get all pending items for a type
 */
export async function getPendingItems(type: OfflineDataType): Promise<any[]> {
  try {
    const db = await openDatabase();
    const storeName = getStoreName(type);
    const tx = db.transaction(storeName, "readonly");
    const store = tx.objectStore(storeName);

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error("Error getting pending items:", error);
    return [];
  }
}

/**
 * Delete a synced item
 */
export async function deletePendingItem(
  type: OfflineDataType,
  id: string
): Promise<void> {
  try {
    const db = await openDatabase();
    const storeName = getStoreName(type);
    const tx = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);

    await new Promise<void>((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error("Error deleting pending item:", error);
    throw error;
  }
}

/**
 * Get total count of pending items
 */
export async function getPendingCount(): Promise<number> {
  try {
    const db = await openDatabase();
    let total = 0;

    for (const storeName of [
      "pending_timesheets",
      "pending_expenses",
      "pending_location",
    ]) {
      const tx = db.transaction(storeName, "readonly");
      const store = tx.objectStore(storeName);

      const count = await new Promise<number>((resolve, reject) => {
        const request = store.count();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });

      total += count;
    }

    return total;
  } catch (error) {
    console.error("Error getting pending count:", error);
    return 0;
  }
}

/**
 * Check if we're online
 */
export function isOnline(): boolean {
  return navigator.onLine;
}

/**
 * Wrapper to save data - tries Supabase first, falls back to offline
 */
export async function saveWithOfflineFallback<T>(
  type: OfflineDataType,
  data: T,
  supabaseInsert: () => Promise<{ error: any }>
): Promise<{ success: boolean; offline: boolean }> {
  if (isOnline()) {
    try {
      const { error } = await supabaseInsert();
      if (!error) {
        return { success: true, offline: false };
      }
    } catch (e) {
      // Fall through to offline save
    }
  }

  // Save offline
  try {
    await saveForOfflineSync(type, data);
    return { success: true, offline: true };
  } catch (e) {
    return { success: false, offline: true };
  }
}
