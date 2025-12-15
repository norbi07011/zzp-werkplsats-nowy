/**
 * ================================================================
 * NOTIFICATION PREFERENCES - Ustawienia powiadomień Push
 * ================================================================
 */

import React, { useState, useEffect } from "react";
import { Bell, BellOff, Mail, Smartphone, MessageSquare, Save, Loader2, AlertCircle, CheckCircle, Settings } from 'lucide-react';

import { supabase } from "../../../../lib/supabase";
import { useAuth } from "../../../../../contexts/AuthContext";
import { toast } from "sonner";

interface NotificationPreference {
  id?: string;
  push_enabled: boolean;
  email_enabled: boolean;
  in_app_enabled: boolean;
  new_task_assigned: boolean;
  task_status_changed: boolean;
  project_deadline: boolean;
  expense_approved: boolean;
  timesheet_approved: boolean;
  team_announcement: boolean;
  daily_summary: boolean;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
}

interface NotificationPreferencesProps {
  teamId: string;
}

const DEFAULT_PREFS: NotificationPreference = {
  push_enabled: true,
  email_enabled: true,
  in_app_enabled: true,
  new_task_assigned: true,
  task_status_changed: true,
  project_deadline: true,
  expense_approved: true,
  timesheet_approved: true,
  team_announcement: true,
  daily_summary: false,
  quiet_hours_start: null,
  quiet_hours_end: null,
};

export const NotificationPreferences: React.FC<
  NotificationPreferencesProps
> = ({ teamId }) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [prefs, setPrefs] = useState<NotificationPreference>(DEFAULT_PREFS);
  const [pushSupported, setPushSupported] = useState(false);
  const [pushPermission, setPushPermission] =
    useState<NotificationPermission>("default");

  useEffect(() => {
    // Check push support
    if ("Notification" in window && "serviceWorker" in navigator) {
      setPushSupported(true);
      setPushPermission(Notification.permission);
    }
    fetchPreferences();
  }, [teamId, user?.id]);

  const fetchPreferences = async () => {
    if (!user?.id) return;
    setIsLoading(true);

    const { data, error } = await supabase
      .from("team_notification_preferences")
      .select("*")
      .eq("team_id", teamId)
      .eq("user_id", user.id)
      .single();

    if (data) {
      setPrefs(data);
    } else if (error?.code !== "PGRST116") {
      // Not "no rows" error
      console.error("Error fetching preferences:", error);
    }
    setIsLoading(false);
  };

  const requestPushPermission = async () => {
    if (!pushSupported) {
      toast.error("Przeglądarka nie wspiera powiadomień Push");
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setPushPermission(permission);

      if (permission === "granted") {
        toast.success("✅ Powiadomienia Push włączone!");
        // Register with service worker
        await registerPushSubscription();
      } else if (permission === "denied") {
        toast.error("Powiadomienia Push zostały zablokowane");
      }
    } catch (error) {
      console.error("Push permission error:", error);
      toast.error("Błąd przy aktywacji powiadomień");
    }
  };

  const registerPushSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          // This would be your VAPID public key
          "BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U"
        ),
      });

      // Save subscription to database
      const { error } = await supabase.from("team_push_subscriptions").upsert({
        team_id: teamId,
        user_id: user?.id,
        endpoint: subscription.endpoint,
        p256dh: subscription.toJSON().keys?.p256dh,
        auth: subscription.toJSON().keys?.auth,
        is_active: true,
      });

      if (error) throw error;
    } catch (error) {
      console.error("Push registration error:", error);
    }
  };

  const handleSave = async () => {
    if (!user?.id) return;
    setIsSaving(true);

    try {
      const { error } = await supabase
        .from("team_notification_preferences")
        .upsert({
          team_id: teamId,
          user_id: user.id,
          ...prefs,
        });

      if (error) throw error;
      toast.success("✅ Preferencje zapisane!");
    } catch (error: any) {
      console.error("Error saving preferences:", error);
      toast.error("Błąd podczas zapisywania");
    } finally {
      setIsSaving(false);
    }
  };

  const updatePref = (key: keyof NotificationPreference, value: any) => {
    setPrefs((prev) => ({ ...prev, [key]: value }));
  };

  // Helper function for VAPID key
  function urlBase64ToUint8Array(base64String: string) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, "+")
      .replace(/_/g, "/");
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 flex justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
          <Bell className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Powiadomienia</h2>
          <p className="text-sm text-gray-500">Meldingsvoorkeuren</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Push Permission Banner */}
        {pushSupported && pushPermission !== "granted" && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Smartphone className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="font-medium text-blue-900">
                    Włącz powiadomienia Push
                  </p>
                  <p className="text-sm text-blue-700">
                    Otrzymuj powiadomienia nawet gdy aplikacja jest zamknięta
                  </p>
                </div>
              </div>
              <button
                onClick={requestPushPermission}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Włącz
              </button>
            </div>
          </div>
        )}

        {pushPermission === "granted" && (
          <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 rounded-lg p-3">
            <CheckCircle className="w-5 h-5" />
            <span className="text-sm font-medium">
              Powiadomienia Push aktywne
            </span>
          </div>
        )}

        {/* Channels */}
        <div>
          <h3 className="font-medium text-gray-900 mb-3">Kanały powiadomień</h3>
          <div className="space-y-3">
            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Smartphone className="w-5 h-5 text-gray-500" />
                <span>Push na telefon/przeglądarkę</span>
              </div>
              <input
                type="checkbox"
                checked={prefs.push_enabled}
                onChange={(e) => updatePref("push_enabled", e.target.checked)}
                className="w-5 h-5 text-blue-600 rounded"
                disabled={pushPermission !== "granted"}
              />
            </label>
            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-gray-500" />
                <span>E-mail</span>
              </div>
              <input
                type="checkbox"
                checked={prefs.email_enabled}
                onChange={(e) => updatePref("email_enabled", e.target.checked)}
                className="w-5 h-5 text-blue-600 rounded"
              />
            </label>
            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <MessageSquare className="w-5 h-5 text-gray-500" />
                <span>W aplikacji</span>
              </div>
              <input
                type="checkbox"
                checked={prefs.in_app_enabled}
                onChange={(e) => updatePref("in_app_enabled", e.target.checked)}
                className="w-5 h-5 text-blue-600 rounded"
              />
            </label>
          </div>
        </div>

        {/* Event Types */}
        <div>
          <h3 className="font-medium text-gray-900 mb-3">Typy powiadomień</h3>
          <div className="space-y-3">
            {[
              {
                key: "new_task_assigned",
                label: "Przypisano nowe zadanie",
                icon: "📋",
              },
              {
                key: "task_status_changed",
                label: "Zmiana statusu zadania",
                icon: "🔄",
              },
              {
                key: "project_deadline",
                label: "Termin projektu (przypomnienie)",
                icon: "⏰",
              },
              {
                key: "expense_approved",
                label: "Wydatek zatwierdzony/odrzucony",
                icon: "💰",
              },
              {
                key: "timesheet_approved",
                label: "Godziny zatwierdzone/odrzucone",
                icon: "⏱️",
              },
              {
                key: "team_announcement",
                label: "Ogłoszenie zespołu",
                icon: "📢",
              },
              {
                key: "daily_summary",
                label: "Dzienne podsumowanie",
                icon: "📊",
              },
            ].map(({ key, label, icon }) => (
              <label
                key={key}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{icon}</span>
                  <span>{label}</span>
                </div>
                <input
                  type="checkbox"
                  checked={
                    prefs[key as keyof NotificationPreference] as boolean
                  }
                  onChange={(e) =>
                    updatePref(
                      key as keyof NotificationPreference,
                      e.target.checked
                    )
                  }
                  className="w-5 h-5 text-blue-600 rounded"
                />
              </label>
            ))}
          </div>
        </div>

        {/* Quiet Hours */}
        <div>
          <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
            <Clock className="w-5 h-5 text-gray-500" />
            Godziny ciszy (bez powiadomień)
          </h3>
          <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Od:</span>
              <input
                type="time"
                value={prefs.quiet_hours_start || ""}
                onChange={(e) =>
                  updatePref("quiet_hours_start", e.target.value || null)
                }
                className="border border-gray-300 rounded-lg px-3 py-1.5"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Do:</span>
              <input
                type="time"
                value={prefs.quiet_hours_end || ""}
                onChange={(e) =>
                  updatePref("quiet_hours_end", e.target.value || null)
                }
                className="border border-gray-300 rounded-lg px-3 py-1.5"
              />
            </div>
            {prefs.quiet_hours_start && (
              <button
                onClick={() => {
                  updatePref("quiet_hours_start", null);
                  updatePref("quiet_hours_end", null);
                }}
                className="text-sm text-red-600 hover:text-red-700"
              >
                Wyczyść
              </button>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            W tych godzinach nie będziesz otrzymywać powiadomień Push
          </p>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={isSaving}
          className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all ${
            isSaving
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-blue-600 text-white hover:bg-blue-700 active:scale-95"
          }`}
        >
          {isSaving ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Save className="w-5 h-5" />
          )}
          Zapisz preferencje
        </button>
      </div>
    </div>
  );
};

export default NotificationPreferences;
