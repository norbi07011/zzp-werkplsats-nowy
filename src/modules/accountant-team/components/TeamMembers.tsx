/**
 * Team Members - Invite & Manage Team
 */

import React, { useState } from "react";
import { Language, TeamMember } from "../types";
import { DICTIONARY } from "../constants";
import {
  Plus,
  Search,
  Mail,
  Phone,
  MoreHorizontal,
  UserPlus,
  Copy,
  Check,
  X,
  Clock,
  Shield,
  Users,
} from "lucide-react";
import { toast } from "sonner";

interface TeamMembersProps {
  members: TeamMember[];
  language: Language;
  currentUser: TeamMember;
}

interface Invite {
  id: string;
  email: string;
  status: "pending" | "accepted" | "expired";
  createdAt: string;
  expiresAt: string;
}

export const TeamMembers: React.FC<TeamMembersProps> = ({
  members,
  language,
  currentUser,
}) => {
  const t = DICTIONARY[language];
  const [searchQuery, setSearchQuery] = useState("");
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [invites, setInvites] = useState<Invite[]>([]);
  const [copied, setCopied] = useState(false);

  // Mock invite link
  const inviteLink = `https://zzp-werkplaats.nl/team/invite/${currentUser.id}`;

  const filteredMembers = members.filter(
    (member) =>
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (member.email || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSendInvite = () => {
    if (!inviteEmail.trim() || !inviteEmail.includes("@")) {
      toast.error("Podaj poprawny adres email");
      return;
    }

    const newInvite: Invite = {
      id: crypto.randomUUID(),
      email: inviteEmail,
      status: "pending",
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
    };

    setInvites((prev) => [...prev, newInvite]);
    setInviteEmail("");
    setShowInviteModal(false);
    toast.success(`📧 Zaproszenie wysłane do ${inviteEmail}`);
  };

  const copyInviteLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    toast.success("📋 Link skopiowany!");
    setTimeout(() => setCopied(false), 2000);
  };

  const cancelInvite = (inviteId: string) => {
    setInvites((prev) => prev.filter((inv) => inv.id !== inviteId));
    toast.success("🗑️ Zaproszenie anulowane");
  };

  const statusColors: Record<string, string> = {
    Online: "bg-emerald-500",
    Away: "bg-amber-500",
    Offline: "bg-slate-300",
    Busy: "bg-red-500",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">{t.team}</h2>
          <p className="text-slate-500 text-sm">
            {members.length} członków drużyny
          </p>
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
        >
          <UserPlus className="w-5 h-5" />
          {t.invite_member}
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          placeholder="Szukaj członków..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      {/* Invite Link Card */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-100">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-medium text-slate-800">Link zaproszeniowy</h3>
            <p className="text-sm text-slate-500">
              Udostępnij link, aby zaprosić innych księgowych
            </p>
          </div>
        </div>
        <div className="flex gap-2 mt-3">
          <input
            type="text"
            value={inviteLink}
            readOnly
            className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600"
          />
          <button
            onClick={copyInviteLink}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
              copied
                ? "bg-emerald-500 text-white"
                : "bg-indigo-600 text-white hover:bg-indigo-700"
            }`}
          >
            {copied ? (
              <Check className="w-4 h-4" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
            {copied ? "Skopiowano!" : "Kopiuj"}
          </button>
        </div>
      </div>

      {/* Pending Invites */}
      {invites.filter((i) => i.status === "pending").length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h3 className="font-medium text-slate-800 mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-500" />
            Oczekujące zaproszenia (
            {invites.filter((i) => i.status === "pending").length})
          </h3>
          <div className="space-y-2">
            {invites
              .filter((i) => i.status === "pending")
              .map((invite) => (
                <div
                  key={invite.id}
                  className="flex items-center justify-between py-2 px-3 bg-amber-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                      <Mail className="w-4 h-4 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-700">
                        {invite.email}
                      </p>
                      <p className="text-xs text-slate-500">
                        Wygasa:{" "}
                        {new Date(invite.expiresAt).toLocaleDateString("pl-PL")}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => cancelInvite(invite.id)}
                    className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredMembers.map((member) => (
          <div
            key={member.id}
            className={`bg-white rounded-xl border p-4 shadow-sm hover:shadow-md transition-shadow ${
              member.id === currentUser.id
                ? "border-indigo-300 ring-2 ring-indigo-100"
                : "border-slate-200"
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="relative">
                <img
                  src={member.avatar}
                  alt={member.name}
                  className="w-12 h-12 rounded-xl object-cover"
                />
                <span
                  className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white ${
                    statusColors[member.status || "Offline"]
                  }`}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-slate-800 truncate">
                    {member.name}
                  </h4>
                  {member.id === currentUser.id && (
                    <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-600 text-xs rounded">
                      Ty
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-500">{member.role}</p>
              </div>
              <button className="p-1.5 text-slate-400 hover:text-slate-600 transition-colors">
                <MoreHorizontal className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
              <a
                href={`mailto:${member.email}`}
                className="flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-600 transition-colors"
              >
                <Mail className="w-4 h-4" />
                <span className="truncate">{member.email}</span>
              </a>
              {member.phone && (
                <a
                  href={`tel:${member.phone}`}
                  className="flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-600 transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  <span>{member.phone}</span>
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredMembers.length === 0 && (
        <div className="text-center py-12 bg-slate-50 rounded-xl">
          <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-600 mb-2">
            Brak członków
          </h3>
          <p className="text-slate-500 mb-4">
            Zaproś innych księgowych do drużyny
          </p>
          <button
            onClick={() => setShowInviteModal(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            <UserPlus className="w-4 h-4 inline mr-2" />
            Zaproś teraz
          </button>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800">
                {t.invite_member}
              </h3>
              <button
                onClick={() => setShowInviteModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="jan@biuro-ksiegowe.pl"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Rola
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                >
                  <option value="member">Członek drużyny</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              <div className="bg-slate-50 rounded-lg p-3 text-sm text-slate-600">
                <Shield className="w-4 h-4 inline mr-1 text-slate-400" />
                Zaproszenie wygaśnie po 7 dniach
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowInviteModal(false)}
                className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition"
              >
                {t.cancel}
              </button>
              <button
                onClick={handleSendInvite}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center justify-center gap-2"
              >
                <Mail className="w-4 h-4" />
                Wyślij zaproszenie
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamMembers;
