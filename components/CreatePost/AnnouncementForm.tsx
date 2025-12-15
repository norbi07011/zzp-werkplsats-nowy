/**
 * ╔═══════════════════════════════════════════════════════════════════╗
 * ║               📢 ANNOUNCEMENT FORM COMPONENT 📢                   ║
 * ║                                                                   ║
 * ║  Enhanced form for creating announcement posts                    ║
 * ║  Fields: category, priority, expiration, tags, pinned             ║
 * ╚═══════════════════════════════════════════════════════════════════╝
 */

import React from "react";
import { Bell, Calendar, Users, MapPin } from "../icons";

interface AnnouncementFormProps {
  formData: {
    announcement_category?: "info" | "warning" | "success" | "urgent";
    announcement_priority?: "low" | "medium" | "high";
    announcement_expires_at?: string;
    announcement_tags?: string[];
    announcement_pinned?: boolean;
    announcement_notify_users?: boolean;
    announcement_target_roles?: string[];
    // 🔥 NOWE: dla filtrów
    location?: string;
    category?: string;
    budget?: number;
  };
  onChange: (field: string, value: any) => void;
}

export const AnnouncementForm: React.FC<AnnouncementFormProps> = ({
  formData,
  onChange,
}) => {
  const [newTag, setNewTag] = React.useState("");

  const handleAddTag = () => {
    if (newTag.trim()) {
      const current = formData.announcement_tags || [];
      if (!current.includes(newTag.trim())) {
        onChange("announcement_tags", [...current, newTag.trim()]);
      }
      setNewTag("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    const current = formData.announcement_tags || [];
    onChange(
      "announcement_tags",
      current.filter((t) => t !== tag)
    );
  };

  const handleRoleToggle = (role: string) => {
    const current = formData.announcement_target_roles || [];
    if (current.includes(role)) {
      onChange(
        "announcement_target_roles",
        current.filter((r) => r !== role)
      );
    } else {
      onChange("announcement_target_roles", [...current, role]);
    }
  };

  const roleOptions = [
    { value: "worker", label: "👷 Pracownicy ZZP" },
    { value: "cleaning_company", label: "🧹 Firmy sprzątające" },
    { value: "employer", label: "💼 Pracodawcy" },
    { value: "accountant", label: "📊 Księgowi" },
    { value: "admin", label: "⚙️ Administratorzy" },
  ];

  return (
    <div className="space-y-6 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 p-8 rounded-3xl border-2 border-amber-200">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-r from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center">
          <span className="text-2xl">📢</span>
        </div>
        <div>
          <h3 className="text-2xl font-black text-gray-900">
            Ogłoszenie - Szczegóły
          </h3>
          <p className="text-sm text-gray-600">
            Skonfiguruj ogłoszenie dla użytkowników platformy
          </p>
        </div>
      </div>

      {/* 🔥 MIASTO */}
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-3">
          <span className="flex items-center gap-2">
            <MapPin size={18} /> Miasto (opcjonalne)
          </span>
        </label>
        <select
          value={formData.location || ""}
          onChange={(e) => onChange("location", e.target.value)}
          className="w-full px-4 py-3 rounded-xl border-2 border-amber-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all bg-white"
        >
          <option value="">Wszystkie miasta</option>
          <option value="Amsterdam">Amsterdam</option>
          <option value="Rotterdam">Rotterdam</option>
          <option value="Den Haag">Den Haag</option>
          <option value="Utrecht">Utrecht</option>
          <option value="Eindhoven">Eindhoven</option>
          <option value="Groningen">Groningen</option>
          <option value="Tilburg">Tilburg</option>
          <option value="Almere">Almere</option>
          <option value="Breda">Breda</option>
          <option value="Nijmegen">Nijmegen</option>
          <option value="Arnhem">Arnhem</option>
          <option value="Haarlem">Haarlem</option>
          <option value="Enschede">Enschede</option>
          <option value="Apeldoorn">Apeldoorn</option>
          <option value="Leiden">Leiden</option>
          <option value="Maastricht">Maastricht</option>
          <option value="Dordrecht">Dordrecht</option>
          <option value="Zoetermeer">Zoetermeer</option>
          <option value="Zwolle">Zwolle</option>
          <option value="Den Bosch">Den Bosch</option>
        </select>
      </div>

      {/* 🔥 KATEGORIA BRANŻOWA */}
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-3">
          <span className="flex items-center gap-2">📂 Kategoria branżowa</span>
        </label>
        <select
          value={formData.category || ""}
          onChange={(e) => onChange("category", e.target.value)}
          className="w-full px-4 py-3 rounded-xl border-2 border-amber-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all bg-white"
        >
          <option value="">Wybierz kategorię</option>
          <option value="Budowa/Renovatie">Budowa/Renovatie</option>
          <option value="Instalacje elektryczne">Instalacje elektryczne</option>
          <option value="Hydraulika">Hydraulika</option>
          <option value="Ogrodnictwo">Ogrodnictwo</option>
          <option value="Malowanie">Malowanie</option>
          <option value="Sprzątanie">Sprzątanie</option>
          <option value="Transport">Transport</option>
          <option value="IT/Tech">IT/Tech</option>
          <option value="Administracja">Administracja</option>
          <option value="Księgowość">Księgowość</option>
          <option value="Marketing">Marketing</option>
          <option value="Fotografia">Fotografia</option>
          <option value="Catering">Catering</option>
          <option value="Inne">Inne</option>
        </select>
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-3">
          <span className="flex items-center gap-2">
            <span className="text-base">⚠️</span> Kategoria
            <span className="text-red-500">*</span>
            <span className="text-xs font-normal text-gray-500">
              (Określa kolor i priorytet wyświetlania)
            </span>
          </span>
        </label>
        <div className="grid grid-cols-2 gap-3">
          {(["info", "warning", "success", "urgent"] as const).map(
            (category) => (
              <button
                key={category}
                type="button"
                onClick={() => onChange("announcement_category", category)}
                className={`px-6 py-4 rounded-xl text-sm font-bold transition-all transform ${
                  formData.announcement_category === category
                    ? category === "info"
                      ? "bg-blue-500 text-white shadow-lg scale-105"
                      : category === "warning"
                      ? "bg-yellow-500 text-white shadow-lg scale-105"
                      : category === "success"
                      ? "bg-green-500 text-white shadow-lg scale-105"
                      : "bg-red-500 text-white shadow-lg scale-105"
                    : "bg-white text-gray-700 hover:bg-gray-50 hover:scale-105 border-2 border-gray-200"
                }`}
              >
                {category === "info" && "ℹ️ Informacja"}
                {category === "warning" && "⚠️ Ostrzeżenie"}
                {category === "success" && "✅ Sukces"}
                {category === "urgent" && "🚨 Pilne"}
              </button>
            )
          )}
        </div>
      </div>

      {/* Priority */}
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-3">
          <span className="flex items-center gap-2">
            📊 Priorytet
            <span className="text-red-500">*</span>
            <span className="text-xs font-normal text-gray-500">
              (Wpływa na kolejność i widoczność)
            </span>
          </span>
        </label>
        <div className="flex gap-3">
          {(["low", "medium", "high"] as const).map((priority) => (
            <button
              key={priority}
              type="button"
              onClick={() => onChange("announcement_priority", priority)}
              className={`flex-1 px-6 py-3 rounded-xl text-sm font-bold transition-all transform ${
                formData.announcement_priority === priority
                  ? priority === "low"
                    ? "bg-gray-500 text-white shadow-lg scale-105"
                    : priority === "medium"
                    ? "bg-orange-500 text-white shadow-lg scale-105"
                    : "bg-red-600 text-white shadow-lg scale-105"
                  : "bg-white text-gray-700 hover:bg-gray-50 hover:scale-105 border-2 border-gray-200"
              }`}
            >
              {priority === "low" && "⬇️ Niski"}
              {priority === "medium" && "➡️ Średni"}
              {priority === "high" && "⬆️ Wysoki"}
            </button>
          ))}
        </div>
      </div>

      {/* Expiration Date */}
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-3">
          <span className="flex items-center gap-2">
            <Calendar className="w-4 h-4" /> Data wygaśnięcia (opcjonalna)
          </span>
        </label>
        <input
          type="datetime-local"
          value={formData.announcement_expires_at || ""}
          onChange={(e) => onChange("announcement_expires_at", e.target.value)}
          className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all"
        />
        <p className="text-xs text-gray-600 mt-2">
          Ogłoszenie automatycznie zniknie po tej dacie
        </p>
      </div>

      {/* Tags */}
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-3">
          <span className="flex items-center gap-2">
            <span className="text-base">🏷️</span> Tagi
          </span>
        </label>
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyPress={(e) =>
              e.key === "Enter" && (e.preventDefault(), handleAddTag())
            }
            placeholder="Dodaj tag..."
            className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all"
          />
          <button
            type="button"
            onClick={handleAddTag}
            className="px-6 py-3 bg-amber-500 text-white rounded-xl font-bold hover:bg-amber-600 transition-all"
          >
            + Dodaj
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {formData.announcement_tags?.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-800 rounded-full text-sm font-bold"
            >
              {tag}
              <button
                type="button"
                onClick={() => handleRemoveTag(tag)}
                className="hover:text-amber-900"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Target Roles */}
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-3">
          <span className="flex items-center gap-2">
            <Users className="w-4 h-4" /> Grupa docelowa (zostaw puste dla
            wszystkich)
          </span>
        </label>
        <div className="grid grid-cols-2 gap-3">
          {roleOptions.map((role) => (
            <button
              key={role.value}
              type="button"
              onClick={() => handleRoleToggle(role.value)}
              className={`px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                formData.announcement_target_roles?.includes(role.value)
                  ? "bg-amber-500 text-white"
                  : "bg-white text-gray-700 border-2 border-gray-200 hover:border-amber-300"
              }`}
            >
              {role.label}
            </button>
          ))}
        </div>
      </div>

      {/* Toggle Options */}
      <div className="space-y-4 bg-white p-6 rounded-xl border-2 border-gray-200">
        <h4 className="text-lg font-bold text-gray-900 mb-4">
          ⚙️ Dodatkowe opcje
        </h4>

        {/* Pinned */}
        <label className="flex items-center gap-4 cursor-pointer group">
          <input
            type="checkbox"
            checked={formData.announcement_pinned || false}
            onChange={(e) => onChange("announcement_pinned", e.target.checked)}
            className="w-6 h-6 rounded-lg border-2 border-gray-300 text-amber-500 focus:ring-4 focus:ring-amber-100"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2 font-bold text-gray-900 group-hover:text-amber-600 transition-colors">
              <span className="text-lg">📌</span>
              Przypnij na górze
            </div>
            <p className="text-sm text-gray-600">
              Ogłoszenie będzie zawsze widoczne jako pierwsze
            </p>
          </div>
        </label>

        {/* Notify Users */}
        <label className="flex items-center gap-4 cursor-pointer group">
          <input
            type="checkbox"
            checked={formData.announcement_notify_users || false}
            onChange={(e) =>
              onChange("announcement_notify_users", e.target.checked)
            }
            className="w-6 h-6 rounded-lg border-2 border-gray-300 text-amber-500 focus:ring-4 focus:ring-amber-100"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2 font-bold text-gray-900 group-hover:text-amber-600 transition-colors">
              <Bell className="w-5 h-5" />
              Wyślij powiadomienia
            </div>
            <p className="text-sm text-gray-600">
              Użytkownicy dostaną powiadomienie push o nowym ogłoszeniu
            </p>
          </div>
        </label>
      </div>

      {/* Info box */}
      <div className="bg-gradient-to-r from-amber-100 to-orange-100 border-2 border-amber-300 rounded-xl p-4">
        <p className="text-sm text-amber-900 mb-2">
          <strong>💡 Wskazówka:</strong> Ogłoszenia pilne z powiadomieniami mają
          5x wyższy współczynnik przeczytania w ciągu pierwszej godziny!
        </p>
        <div className="text-xs text-amber-800 space-y-1 mt-3">
          <p>
            ✅ <span className="text-red-600 font-bold">Pola wymagane (*)</span>{" "}
            - bez nich ogłoszenie nie będzie widoczne
          </p>
          <p>
            ⚠️{" "}
            <span className="text-amber-600 font-bold">Pola rekomendowane</span>{" "}
            - zwiększają zaangażowanie o 40-60%
          </p>
          <p>
            📈 <strong>Tracking:</strong> Liczba przczytań ogłoszenia dostępna w
            analytics
          </p>
        </div>
      </div>
    </div>
  );
};
