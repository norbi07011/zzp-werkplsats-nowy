/**
 * Team Profile - User Profile View
 */

import React, { useState } from "react";
import { Language, TeamMember } from "../types";
import { DICTIONARY } from "../constants";
import {
  User,
  Mail,
  Phone,
  Building2,
  MapPin,
  Calendar,
  Edit,
  Camera,
  Save,
  X,
} from "lucide-react";
import { toast } from "sonner";

interface TeamProfileProps {
  currentUser: TeamMember;
  language: Language;
}

export const TeamProfile: React.FC<TeamProfileProps> = ({
  currentUser,
  language,
}) => {
  const t = DICTIONARY[language];
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    name: currentUser.name,
    email: currentUser.email,
    phone: currentUser.phone || "",
    company: "Biuro Księgowe Example",
    location: "Amsterdam, NL",
    bio: "Certified accountant with 10+ years of experience in tax consulting and financial reporting.",
    kvkNumber: "12345678",
    btwNumber: "NL123456789B01",
  });

  const handleSave = () => {
    // TODO: Save to database
    toast.success("✅ Profil zaktualizowany");
    setIsEditing(false);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Profile Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="relative">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-24 h-24 rounded-2xl object-cover border-4 border-white/30 shadow-lg"
            />
            <button className="absolute -bottom-2 -right-2 p-2 bg-white rounded-full text-indigo-600 shadow-lg hover:bg-indigo-50 transition">
              <Camera className="w-4 h-4" />
            </button>
          </div>
          <div className="text-center md:text-left">
            <h1 className="text-2xl font-bold">{profile.name}</h1>
            <p className="text-indigo-200">{currentUser.role}</p>
            <div className="flex items-center justify-center md:justify-start gap-2 mt-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  currentUser.status === "Online"
                    ? "bg-emerald-400"
                    : currentUser.status === "Away"
                    ? "bg-amber-400"
                    : "bg-slate-400"
                }`}
              />
              <span className="text-sm text-indigo-200">
                {currentUser.status}
              </span>
            </div>
          </div>
          <div className="md:ml-auto">
            {isEditing ? (
              <div className="flex gap-2">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Anuluj
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-white text-indigo-600 rounded-lg hover:bg-indigo-50 transition flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Zapisz
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                Edytuj profil
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Profile Details */}
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6">
        <h2 className="text-lg font-bold text-slate-800 mb-4">Dane osobowe</h2>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-500 mb-1">
              <User className="w-4 h-4 inline mr-1" />
              Imię i nazwisko
            </label>
            {isEditing ? (
              <input
                type="text"
                value={profile.name}
                onChange={(e) =>
                  setProfile((prev) => ({ ...prev, name: e.target.value }))
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            ) : (
              <p className="text-slate-800 font-medium">{profile.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-500 mb-1">
              <Mail className="w-4 h-4 inline mr-1" />
              Email
            </label>
            {isEditing ? (
              <input
                type="email"
                value={profile.email}
                onChange={(e) =>
                  setProfile((prev) => ({ ...prev, email: e.target.value }))
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            ) : (
              <p className="text-slate-800">{profile.email}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-500 mb-1">
              <Phone className="w-4 h-4 inline mr-1" />
              Telefon
            </label>
            {isEditing ? (
              <input
                type="tel"
                value={profile.phone}
                onChange={(e) =>
                  setProfile((prev) => ({ ...prev, phone: e.target.value }))
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="+31 6 12345678"
              />
            ) : (
              <p className="text-slate-800">{profile.phone || "Nie podano"}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-500 mb-1">
              <Building2 className="w-4 h-4 inline mr-1" />
              Firma
            </label>
            {isEditing ? (
              <input
                type="text"
                value={profile.company}
                onChange={(e) =>
                  setProfile((prev) => ({ ...prev, company: e.target.value }))
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            ) : (
              <p className="text-slate-800">{profile.company}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-500 mb-1">
              <MapPin className="w-4 h-4 inline mr-1" />
              Lokalizacja
            </label>
            {isEditing ? (
              <input
                type="text"
                value={profile.location}
                onChange={(e) =>
                  setProfile((prev) => ({ ...prev, location: e.target.value }))
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            ) : (
              <p className="text-slate-800">{profile.location}</p>
            )}
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-slate-500 mb-1">
            Bio
          </label>
          {isEditing ? (
            <textarea
              value={profile.bio}
              onChange={(e) =>
                setProfile((prev) => ({ ...prev, bio: e.target.value }))
              }
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
              rows={3}
            />
          ) : (
            <p className="text-slate-600">{profile.bio}</p>
          )}
        </div>
      </div>

      {/* Business Details */}
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6">
        <h2 className="text-lg font-bold text-slate-800 mb-4">Dane firmy</h2>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-500 mb-1">
              Numer KVK
            </label>
            {isEditing ? (
              <input
                type="text"
                value={profile.kvkNumber}
                onChange={(e) =>
                  setProfile((prev) => ({ ...prev, kvkNumber: e.target.value }))
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            ) : (
              <p className="text-slate-800 font-mono">{profile.kvkNumber}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-500 mb-1">
              Numer BTW
            </label>
            {isEditing ? (
              <input
                type="text"
                value={profile.btwNumber}
                onChange={(e) =>
                  setProfile((prev) => ({ ...prev, btwNumber: e.target.value }))
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            ) : (
              <p className="text-slate-800 font-mono">{profile.btwNumber}</p>
            )}
          </div>
        </div>
      </div>

      {/* Activity Stats */}
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6">
        <h2 className="text-lg font-bold text-slate-800 mb-4">
          Statystyki aktywności
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-indigo-50 rounded-xl">
            <p className="text-2xl font-bold text-indigo-600">24</p>
            <p className="text-sm text-slate-500">Zadania wykonane</p>
          </div>
          <div className="text-center p-4 bg-emerald-50 rounded-xl">
            <p className="text-2xl font-bold text-emerald-600">156</p>
            <p className="text-sm text-slate-500">Wiadomości</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-xl">
            <p className="text-2xl font-bold text-purple-600">12</p>
            <p className="text-sm text-slate-500">Dokumenty</p>
          </div>
          <div className="text-center p-4 bg-amber-50 rounded-xl">
            <p className="text-2xl font-bold text-amber-600">8</p>
            <p className="text-sm text-slate-500">Dni aktywności</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamProfile;
