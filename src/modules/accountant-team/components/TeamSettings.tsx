/**
 * Team Settings - Configuration & Preferences
 */

import React, { useState } from "react";
import { Language, TeamMember } from "../types";
import { DICTIONARY } from "../constants";
import {
  Settings,
  Bell,
  Globe,
  Moon,
  Sun,
  Shield,
  Trash2,
  LogOut,
  Save,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { TeamNotificationSettings } from "./TeamNotificationSettings";

interface TeamSettingsProps {
  language: Language;
  setLanguage: React.Dispatch<React.SetStateAction<Language>>;
  currentUser: TeamMember;
  userId?: string; // Profile ID for push notifications
}

export const TeamSettings: React.FC<TeamSettingsProps> = ({
  language,
  setLanguage,
  currentUser,
  userId,
}) => {
  const t = DICTIONARY[language];
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    taskReminders: true,
    chatMessages: true,
    teamUpdates: true,
  });

  const handleSaveNotifications = () => {
    toast.success("✅ Ustawienia powiadomień zapisane");
  };

  const SettingSection: React.FC<{
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
  }> = ({ title, icon, children }) => (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
          {icon}
        </div>
        <h2 className="text-lg font-bold text-slate-800">{title}</h2>
      </div>
      {children}
    </div>
  );

  const ToggleSwitch: React.FC<{
    checked: boolean;
    onChange: (checked: boolean) => void;
    label: string;
    description?: string;
  }> = ({ checked, onChange, label, description }) => (
    <div className="flex items-center justify-between py-3">
      <div>
        <p className="font-medium text-slate-700">{label}</p>
        {description && <p className="text-sm text-slate-500">{description}</p>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-12 h-6 rounded-full transition-colors ${
          checked ? "bg-indigo-600" : "bg-slate-200"
        }`}
      >
        <span
          className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
            checked ? "left-7" : "left-1"
          }`}
        />
      </button>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">{t.settings}</h1>
        <p className="text-slate-500">
          Zarządzaj ustawieniami drużyny i preferencjami
        </p>
      </div>

      {/* Language Settings */}
      <SettingSection title="Język" icon={<Globe className="w-5 h-5" />}>
        <div className="space-y-2">
          <p className="text-sm text-slate-500 mb-3">
            Wybierz język interfejsu
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setLanguage("PL")}
              className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-colors ${
                language === "PL"
                  ? "border-indigo-500 bg-indigo-50"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <span className="text-2xl">🇵🇱</span>
              <div className="text-left">
                <p className="font-medium text-slate-700">Polski</p>
                <p className="text-xs text-slate-500">Polish</p>
              </div>
            </button>
            <button
              onClick={() => setLanguage("NL")}
              className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-colors ${
                language === "NL"
                  ? "border-indigo-500 bg-indigo-50"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <span className="text-2xl">🇳🇱</span>
              <div className="text-left">
                <p className="font-medium text-slate-700">Nederlands</p>
                <p className="text-xs text-slate-500">Dutch</p>
              </div>
            </button>
          </div>
        </div>
      </SettingSection>

      {/* Theme Settings */}
      <SettingSection
        title="Wygląd"
        icon={
          theme === "light" ? (
            <Sun className="w-5 h-5" />
          ) : (
            <Moon className="w-5 h-5" />
          )
        }
      >
        <div className="space-y-2">
          <p className="text-sm text-slate-500 mb-3">
            Wybierz motyw kolorystyczny
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setTheme("light")}
              className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-colors ${
                theme === "light"
                  ? "border-indigo-500 bg-indigo-50"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <Sun className="w-6 h-6 text-amber-500" />
              <div className="text-left">
                <p className="font-medium text-slate-700">Jasny</p>
                <p className="text-xs text-slate-500">Light mode</p>
              </div>
            </button>
            <button
              onClick={() => setTheme("dark")}
              className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-colors ${
                theme === "dark"
                  ? "border-indigo-500 bg-indigo-50"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <Moon className="w-6 h-6 text-slate-600" />
              <div className="text-left">
                <p className="font-medium text-slate-700">Ciemny</p>
                <p className="text-xs text-slate-500">Dark mode</p>
              </div>
            </button>
          </div>
        </div>
      </SettingSection>

      {/* Push Notifications Setup - Główna sekcja dla urządzeń mobilnych */}
      {userId && (
        <SettingSection
          title="Powiadomienia mobilne"
          icon={<Bell className="w-5 h-5" />}
        >
          <TeamNotificationSettings userId={userId} />
        </SettingSection>
      )}

      {/* Notification Settings */}
      <SettingSection
        title="Preferencje powiadomień"
        icon={<Bell className="w-5 h-5" />}
      >
        <div className="divide-y divide-slate-100">
          <ToggleSwitch
            checked={notifications.email}
            onChange={(val) =>
              setNotifications((prev) => ({ ...prev, email: val }))
            }
            label="Powiadomienia email"
            description="Otrzymuj powiadomienia na email"
          />
          <ToggleSwitch
            checked={notifications.push}
            onChange={(val) =>
              setNotifications((prev) => ({ ...prev, push: val }))
            }
            label="Powiadomienia push"
            description="Powiadomienia w przeglądarce"
          />
          <ToggleSwitch
            checked={notifications.taskReminders}
            onChange={(val) =>
              setNotifications((prev) => ({ ...prev, taskReminders: val }))
            }
            label="Przypomnienia o zadaniach"
            description="Powiadomienia o zbliżających się terminach"
          />
          <ToggleSwitch
            checked={notifications.chatMessages}
            onChange={(val) =>
              setNotifications((prev) => ({ ...prev, chatMessages: val }))
            }
            label="Wiadomości na czacie"
            description="Powiadomienia o nowych wiadomościach"
          />
          <ToggleSwitch
            checked={notifications.teamUpdates}
            onChange={(val) =>
              setNotifications((prev) => ({ ...prev, teamUpdates: val }))
            }
            label="Aktualizacje drużyny"
            description="Powiadomienia o zmianach w drużynie"
          />
        </div>
        <button
          onClick={handleSaveNotifications}
          className="mt-4 w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center justify-center gap-2"
        >
          <Save className="w-4 h-4" />
          Zapisz ustawienia
        </button>
      </SettingSection>

      {/* Security Settings */}
      <SettingSection
        title="Bezpieczeństwo"
        icon={<Shield className="w-5 h-5" />}
      >
        <div className="space-y-3">
          <button className="w-full flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
            <div className="text-left">
              <p className="font-medium text-slate-700">Zmień hasło</p>
              <p className="text-sm text-slate-500">
                Ostatnia zmiana: 30 dni temu
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400" />
          </button>
          <button className="w-full flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
            <div className="text-left">
              <p className="font-medium text-slate-700">
                Uwierzytelnianie dwuskładnikowe
              </p>
              <p className="text-sm text-emerald-600">Włączone</p>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400" />
          </button>
          <button className="w-full flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
            <div className="text-left">
              <p className="font-medium text-slate-700">Aktywne sesje</p>
              <p className="text-sm text-slate-500">2 urządzenia</p>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400" />
          </button>
        </div>
      </SettingSection>

      {/* Danger Zone */}
      <div className="bg-red-50 rounded-2xl border border-red-200 p-6">
        <h2 className="text-lg font-bold text-red-800 mb-4">
          Strefa niebezpieczna
        </h2>
        <div className="space-y-3">
          <button className="w-full flex items-center justify-between p-4 bg-white rounded-xl border border-red-200 hover:bg-red-50 transition-colors group">
            <div className="flex items-center gap-3">
              <LogOut className="w-5 h-5 text-red-500" />
              <div className="text-left">
                <p className="font-medium text-red-700">Opuść drużynę</p>
                <p className="text-sm text-red-500">
                  Opuścisz tę drużynę księgowych
                </p>
              </div>
            </div>
          </button>
          <button className="w-full flex items-center justify-between p-4 bg-white rounded-xl border border-red-200 hover:bg-red-50 transition-colors group">
            <div className="flex items-center gap-3">
              <Trash2 className="w-5 h-5 text-red-500" />
              <div className="text-left">
                <p className="font-medium text-red-700">Usuń konto</p>
                <p className="text-sm text-red-500">
                  Trwale usuń swoje konto i wszystkie dane
                </p>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TeamSettings;
