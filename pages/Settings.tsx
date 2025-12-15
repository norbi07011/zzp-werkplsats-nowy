/* eslint-disable jsx-a11y/aria-proptypes */
import { useState } from "react";
import {
  UserCircleIcon,
  BellIcon,
  ShieldCheckIcon,
  CreditCardIcon,
  GlobeAltIcon,
  PaintBrushIcon,
  KeyIcon,
  TrashIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";

type SettingsSection =
  | "account"
  | "notifications"
  | "privacy"
  | "payments"
  | "preferences";

export const Settings: React.FC = () => {
  const [activeSection, setActiveSection] =
    useState<SettingsSection>("account");
  const [settings, setSettings] = useState({
    // Account
    email: "jan.kowalski@example.com",
    phone: "+31 612 345 678",
    language: "nl",

    // Notifications
    emailNotifications: true,
    pushNotifications: true,
    newJobAlerts: true,
    applicationUpdates: true,
    messageNotifications: true,
    reviewNotifications: true,
    marketingEmails: false,

    // Privacy
    profileVisibility: "public" as "public" | "private" | "clients-only",
    showEmail: false,
    showPhone: true,
    allowMessages: true,
    allowDirectBooking: false,

    // Preferences
    theme: "light" as "light" | "dark" | "auto",
    compactView: false,
    showTips: true,
  });

  const sections = [
    { id: "account", label: "Konto", icon: UserCircleIcon },
    { id: "notifications", label: "Powiadomienia", icon: BellIcon },
    { id: "privacy", label: "Prywatność", icon: ShieldCheckIcon },
    { id: "payments", label: "Płatności", icon: CreditCardIcon },
    { id: "preferences", label: "Preferencje", icon: PaintBrushIcon },
  ];

  const ToggleSwitch: React.FC<{
    enabled: boolean;
    onChange: () => void;
    label: string;
    description?: string;
  }> = ({ enabled, onChange, label, description }) => {
    const ariaLabel = `${label} - obecnie ${
      enabled ? "włączone" : "wyłączone"
    }`;

    return (
      <div className="flex items-center justify-between py-3">
        <div className="flex-1">
          <p className="font-medium text-gray-900">{label}</p>
          {description && (
            <p className="text-sm text-gray-600 mt-0.5">{description}</p>
          )}
        </div>
        <button
          type="button"
          onClick={onChange}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-2 ${
            enabled ? "bg-primary-600" : "bg-gray-200"
          }`}
          aria-label={ariaLabel}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              enabled ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-5 py-6 sm:py-8 pb-24 md:pb-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 sm:mb-8">
        Ustawienia
      </h1>

      <div className="flex flex-col md:flex-row gap-4 md:gap-6">
        {/* Sidebar - poziome na mobile, pionowe na desktop */}
        <div className="w-full md:w-64 flex-shrink-0">
          <div className="bg-white rounded-xl shadow-lg p-2 overflow-x-auto">
            <div className="flex md:flex-col gap-1 min-w-max md:min-w-0">
              {sections.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() =>
                      setActiveSection(section.id as SettingsSection)
                    }
                    className={`flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3 rounded-lg text-left transition-colors whitespace-nowrap ${
                      activeSection === section.id
                        ? "bg-primary-50 text-primary-700"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span className="font-medium text-sm md:text-base">
                      {section.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
            {activeSection === "account" && (
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6">
                  Ustawienia konta
                </h2>

                <div className="space-y-6">
                  <div>
                    <label
                      htmlFor="settings-email"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Email
                    </label>
                    <input
                      id="settings-email"
                      type="email"
                      value={settings.email}
                      onChange={(e) =>
                        setSettings({ ...settings, email: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="settings-phone"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Telefon
                    </label>
                    <input
                      id="settings-phone"
                      type="tel"
                      value={settings.phone}
                      onChange={(e) =>
                        setSettings({ ...settings, phone: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="settings-language"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Język
                    </label>
                    <select
                      id="settings-language"
                      value={settings.language}
                      onChange={(e) =>
                        setSettings({ ...settings, language: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="nl">Nederlands</option>
                      <option value="en">English</option>
                      <option value="pl">Polski</option>
                      <option value="de">Deutsch</option>
                    </select>
                  </div>

                  <div className="pt-4 border-t border-gray-200">
                    <button className="flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium">
                      <KeyIcon className="w-5 h-5" />
                      Zmień hasło
                    </button>
                  </div>

                  <div className="pt-4">
                    <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
                      Zapisz zmiany
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeSection === "notifications" && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-6">
                  Powiadomienia
                </h2>

                <div className="space-y-1 divide-y divide-gray-200">
                  <ToggleSwitch
                    enabled={settings.emailNotifications}
                    onChange={() =>
                      setSettings({
                        ...settings,
                        emailNotifications: !settings.emailNotifications,
                      })
                    }
                    label="Powiadomienia email"
                    description="Otrzymuj powiadomienia na email"
                  />
                  <ToggleSwitch
                    enabled={settings.pushNotifications}
                    onChange={() =>
                      setSettings({
                        ...settings,
                        pushNotifications: !settings.pushNotifications,
                      })
                    }
                    label="Powiadomienia push"
                    description="Otrzymuj powiadomienia w przeglądarce"
                  />
                  <ToggleSwitch
                    enabled={settings.newJobAlerts}
                    onChange={() =>
                      setSettings({
                        ...settings,
                        newJobAlerts: !settings.newJobAlerts,
                      })
                    }
                    label="Nowe zlecenia"
                    description="Powiadom mnie o nowych zleceniach pasujących do mojego profilu"
                  />
                  <ToggleSwitch
                    enabled={settings.applicationUpdates}
                    onChange={() =>
                      setSettings({
                        ...settings,
                        applicationUpdates: !settings.applicationUpdates,
                      })
                    }
                    label="Status aplikacji"
                    description="Powiadom mnie o zmianach statusu moich aplikacji"
                  />
                  <ToggleSwitch
                    enabled={settings.messageNotifications}
                    onChange={() =>
                      setSettings({
                        ...settings,
                        messageNotifications: !settings.messageNotifications,
                      })
                    }
                    label="Wiadomości"
                    description="Powiadom mnie o nowych wiadomościach"
                  />
                  <ToggleSwitch
                    enabled={settings.reviewNotifications}
                    onChange={() =>
                      setSettings({
                        ...settings,
                        reviewNotifications: !settings.reviewNotifications,
                      })
                    }
                    label="Opinie"
                    description="Powiadom mnie o nowych opiniach"
                  />
                  <ToggleSwitch
                    enabled={settings.marketingEmails}
                    onChange={() =>
                      setSettings({
                        ...settings,
                        marketingEmails: !settings.marketingEmails,
                      })
                    }
                    label="Materiały marketingowe"
                    description="Otrzymuj informacje o promocjach i nowościach"
                  />
                </div>
              </div>
            )}

            {activeSection === "privacy" && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-6">
                  Prywatność i bezpieczeństwo
                </h2>

                <div className="space-y-6">
                  <div>
                    <label
                      htmlFor="settings-visibility"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Widoczność profilu
                    </label>
                    <select
                      id="settings-visibility"
                      value={settings.profileVisibility}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          profileVisibility: e.target.value as any,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="public">
                        Publiczny - widoczny dla wszystkich
                      </option>
                      <option value="clients-only">
                        Tylko klienci - widoczny dla zarejestrowanych klientów
                      </option>
                      <option value="private">
                        Prywatny - niewidoczny w wyszukiwarkach
                      </option>
                    </select>
                  </div>

                  <div className="space-y-1 divide-y divide-gray-200">
                    <ToggleSwitch
                      enabled={settings.showEmail}
                      onChange={() =>
                        setSettings({
                          ...settings,
                          showEmail: !settings.showEmail,
                        })
                      }
                      label="Pokaż email w profilu"
                      description="Twój email będzie widoczny dla wszystkich"
                    />
                    <ToggleSwitch
                      enabled={settings.showPhone}
                      onChange={() =>
                        setSettings({
                          ...settings,
                          showPhone: !settings.showPhone,
                        })
                      }
                      label="Pokaż telefon w profilu"
                      description="Twój numer telefonu będzie widoczny dla klientów"
                    />
                    <ToggleSwitch
                      enabled={settings.allowMessages}
                      onChange={() =>
                        setSettings({
                          ...settings,
                          allowMessages: !settings.allowMessages,
                        })
                      }
                      label="Zezwól na wiadomości"
                      description="Klienci mogą wysyłać Ci wiadomości"
                    />
                    <ToggleSwitch
                      enabled={settings.allowDirectBooking}
                      onChange={() =>
                        setSettings({
                          ...settings,
                          allowDirectBooking: !settings.allowDirectBooking,
                        })
                      }
                      label="Bezpośrednie rezerwacje"
                      description="Klienci mogą zarezerwować Cię bez potwierdzenia"
                    />
                  </div>

                  <div className="pt-4 border-t border-gray-200">
                    <button className="text-primary-600 hover:text-primary-700 font-medium">
                      Pobierz moje dane
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeSection === "payments" && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-6">
                  Metody płatności
                </h2>

                <div className="space-y-4 mb-6">
                  <div className="border border-gray-200 rounded-lg p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-8 bg-gradient-to-br from-blue-600 to-blue-400 rounded flex items-center justify-center text-white text-xs font-bold">
                        VISA
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">•••• 4242</p>
                        <p className="text-sm text-gray-600">Wygasa 12/2025</p>
                      </div>
                      <span className="ml-2 px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded">
                        Domyślna
                      </span>
                    </div>
                    <button className="text-red-600 hover:text-red-700 text-sm font-medium">
                      Usuń
                    </button>
                  </div>
                </div>

                <button className="px-4 py-2 border border-primary-600 text-primary-600 rounded-lg hover:bg-primary-50 transition-colors">
                  + Dodaj metodę płatności
                </button>

                <div className="mt-8 pt-6 border-t border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-4">
                    Historia płatności
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between py-2">
                      <div>
                        <p className="font-medium text-gray-900">
                          Subskrypcja Worker Plus
                        </p>
                        <p className="text-sm text-gray-600">
                          15 stycznia 2025
                        </p>
                      </div>
                      <p className="font-semibold text-gray-900">€29.99</p>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <div>
                        <p className="font-medium text-gray-900">
                          Subskrypcja Worker Plus
                        </p>
                        <p className="text-sm text-gray-600">15 grudnia 2024</p>
                      </div>
                      <p className="font-semibold text-gray-900">€29.99</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === "preferences" && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-6">
                  Preferencje
                </h2>

                <div className="space-y-6">
                  <div>
                    <label
                      htmlFor="settings-theme"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Motyw
                    </label>
                    <select
                      id="settings-theme"
                      value={settings.theme}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          theme: e.target.value as any,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="light">Jasny</option>
                      <option value="dark">Ciemny</option>
                      <option value="auto">Automatyczny (systemowy)</option>
                    </select>
                  </div>

                  <div className="space-y-1 divide-y divide-gray-200">
                    <ToggleSwitch
                      enabled={settings.compactView}
                      onChange={() =>
                        setSettings({
                          ...settings,
                          compactView: !settings.compactView,
                        })
                      }
                      label="Widok kompaktowy"
                      description="Pokaż więcej treści na ekranie"
                    />
                    <ToggleSwitch
                      enabled={settings.showTips}
                      onChange={() =>
                        setSettings({
                          ...settings,
                          showTips: !settings.showTips,
                        })
                      }
                      label="Pokaż wskazówki"
                      description="Wyświetlaj pomocne wskazówki i porady"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Danger Zone */}
          <div className="mt-4 sm:mt-6 bg-red-50 rounded-xl border border-red-200 p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-bold text-red-900 mb-2">
              Strefa niebezpieczna
            </h3>
            <p className="text-sm text-red-700 mb-4">
              Usunięcie konta jest nieodwracalne. Wszystkie Twoje dane zostaną
              trwale usunięte.
            </p>
            <button className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm sm:text-base">
              <TrashIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              Usuń konto
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
