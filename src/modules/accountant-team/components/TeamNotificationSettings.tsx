/**
 * Team Notification Settings Component
 * Zarządzanie ustawieniami powiadomień zespołu
 */

import React, { useState, useEffect } from "react";
import {
  Bell,
  XCircle as BellOff,
  Settings as Smartphone,
  Loader2,
  Check,
} from "lucide-react";
import {
  setupPushNotifications,
  removePushSubscription,
} from "../services/teamNotificationService";
import { toast } from "sonner";

interface TeamNotificationSettingsProps {
  userId: string;
}

export const TeamNotificationSettings: React.FC<
  TeamNotificationSettingsProps
> = ({ userId }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [permissionState, setPermissionState] =
    useState<NotificationPermission>("default");

  useEffect(() => {
    // Check current notification permission
    if ("Notification" in window) {
      setPermissionState(Notification.permission);
      setPushEnabled(Notification.permission === "granted");
    }
  }, []);

  const handleEnablePush = async () => {
    setIsLoading(true);
    try {
      const success = await setupPushNotifications(userId);
      if (success) {
        setPushEnabled(true);
        setPermissionState("granted");
        toast.success("✅ Powiadomienia push włączone!");
      } else {
        toast.error("❌ Nie udało się włączyć powiadomień");
      }
    } catch (error) {
      console.error("Error enabling push:", error);
      toast.error("❌ Błąd podczas włączania powiadomień");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisablePush = async () => {
    setIsLoading(true);
    try {
      // Get current subscription
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();
        await removePushSubscription(userId, subscription.endpoint);
      }

      setPushEnabled(false);
      toast.success("✅ Powiadomienia push wyłączone");
    } catch (error) {
      console.error("Error disabling push:", error);
      toast.error("❌ Błąd podczas wyłączania powiadomień");
    } finally {
      setIsLoading(false);
    }
  };

  // Show different UI based on browser support
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <div className="flex items-center gap-3 text-yellow-700 dark:text-yellow-300">
          <BellOff className="w-5 h-5" />
          <div>
            <p className="font-medium">Powiadomienia push niedostępne</p>
            <p className="text-sm opacity-80">
              Twoja przeglądarka nie obsługuje powiadomień push.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Permission denied
  if (permissionState === "denied") {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <div className="flex items-center gap-3 text-red-700 dark:text-red-300">
          <BellOff className="w-5 h-5" />
          <div>
            <p className="font-medium">Powiadomienia zablokowane</p>
            <p className="text-sm opacity-80">
              Odblokuj powiadomienia w ustawieniach przeglądarki, aby otrzymywać
              powiadomienia o nowych wiadomościach i wydarzeniach.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`p-2 rounded-full ${
              pushEnabled
                ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
            }`}
          >
            {pushEnabled ? (
              <Bell className="w-5 h-5" />
            ) : (
              <BellOff className="w-5 h-5" />
            )}
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-white">
              Powiadomienia push
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {pushEnabled
                ? "Otrzymujesz powiadomienia na tym urządzeniu"
                : "Włącz powiadomienia, aby nie przegapić wiadomości"}
            </p>
          </div>
        </div>

        <button
          onClick={pushEnabled ? handleDisablePush : handleEnablePush}
          disabled={isLoading}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            pushEnabled
              ? "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              : "bg-indigo-600 text-white hover:bg-indigo-700"
          }`}
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : pushEnabled ? (
            <>
              <BellOff className="w-4 h-4" />
              Wyłącz
            </>
          ) : (
            <>
              <Smartphone className="w-4 h-4" />
              Włącz
            </>
          )}
        </button>
      </div>

      {pushEnabled && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
            Będziesz otrzymywać powiadomienia o:
          </p>
          <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-500" />
              Nowych wiadomościach w czacie zespołu
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-500" />
              Przydzielonych zadaniach
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-500" />
              Nadchodzących wydarzeniach i terminach
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default TeamNotificationSettings;
