/**
 * ================================================================
 * SERVICE WORKER for Push Notifications
 * Register in main app: navigator.serviceWorker.register('/sw.js')
 * ================================================================
 */

// Cache name for offline support
const CACHE_NAME = "zzp-werkplaats-v1";
const OFFLINE_URL = "/offline.html";

// Install event - cache essential files
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        "/",
        "/offline.html",
        "/manifest.json",
        // Add other essential assets
      ]);
    })
  );
  self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Push notification received
self.addEventListener("push", (event) => {
  let data = {
    title: "ZZP Werkplaats",
    body: "Masz nowe powiadomienie",
    icon: "/icons/icon-192.png",
    badge: "/icons/badge-72.png",
    data: { url: "/" },
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      data = { ...data, ...payload };
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    vibrate: [100, 50, 100],
    data: data.data,
    actions: data.actions || [],
    tag: data.tag || "default",
    renotify: true,
    requireInteraction: data.requireInteraction || false,
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// Notification click handler
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || "/";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // Try to focus existing window
        for (const client of clientList) {
          if (client.url.includes(urlToOpen) && "focus" in client) {
            return client.focus();
          }
        }
        // Open new window if none found
        return clients.openWindow(urlToOpen);
      })
  );
});

// Handle notification close
self.addEventListener("notificationclose", (event) => {
  // Optional: Track notification dismissal
  console.log("Notification closed:", event.notification.tag);
});

// Background sync for offline actions
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-timesheets") {
    event.waitUntil(syncTimesheets());
  }
  if (event.tag === "sync-expenses") {
    event.waitUntil(syncExpenses());
  }
  if (event.tag === "sync-location") {
    event.waitUntil(syncLocation());
  }
});

// Sync functions for offline data
async function syncTimesheets() {
  // Get pending timesheets from IndexedDB and sync
  const db = await openDatabase();
  const pendingTimesheets = await db.getAll("pending_timesheets");

  for (const entry of pendingTimesheets) {
    try {
      const response = await fetch("/api/timesheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entry),
      });

      if (response.ok) {
        await db.delete("pending_timesheets", entry.id);
      }
    } catch (error) {
      console.error("Failed to sync timesheet:", error);
    }
  }
}

async function syncExpenses() {
  // Similar implementation for expenses
}

async function syncLocation() {
  // Similar implementation for location logs
}

// IndexedDB helper
function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("zzp-offline-db", 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains("pending_timesheets")) {
        db.createObjectStore("pending_timesheets", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("pending_expenses")) {
        db.createObjectStore("pending_expenses", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("pending_location")) {
        db.createObjectStore("pending_location", { keyPath: "id" });
      }
    };
  });
}
