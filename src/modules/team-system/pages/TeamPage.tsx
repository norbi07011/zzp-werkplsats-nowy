/**
 * ================================================================
 * TEAM PAGE - Zarządzanie Zespołem
 * ================================================================
 * Przeniesione 1:1 z BetonCoat B.V.
 * Dostosowane do ZZP Werkplaats
 */

import React, { useState } from "react";
import { useTeamStore } from "../context/TeamStoreContext";
import { TeamUserRole, TeamMember } from "../types";
import {
  XCircle,
  Search,
  Plus,
  Phone,
  Mail,
  Euro,
  Edit2,
  Trash2,
  Users,
  CheckCircle,
} from "lucide-react";

export const TeamPage = () => {
  const { currentUser, users, addUser, updateUser, deleteUser, t } =
    useTeamStore();

  // Team Management State
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<TeamMember | null>(null);
  const [userSearch, setUserSearch] = useState("");

  // Form State
  const [formData, setFormData] = useState<Partial<TeamMember>>({
    name: "",
    role: TeamUserRole.WORKER,
    specialization: "",
    email: "",
    phone: "",
    hourlyRate: 0,
    isAvailable: true,
  });

  if (!currentUser || currentUser.role !== TeamUserRole.ADMIN) {
    return (
      <div className="p-8 text-center">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 max-w-md mx-auto">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-red-700 mb-2">Brak dostępu</h3>
          <p className="text-red-600">
            Ta strona jest dostępna tylko dla administratorów zespołu.
          </p>
        </div>
      </div>
    );
  }

  const handleEditClick = (user: TeamMember) => {
    setEditingUser(user);
    setFormData(user);
    setShowUserModal(true);
  };

  const handleAddClick = () => {
    setEditingUser(null);
    setFormData({
      name: "",
      role: TeamUserRole.WORKER,
      specialization: "",
      email: "",
      phone: "",
      hourlyRate: 0,
      isAvailable: true,
      completedTasksCount: 0,
      avatar: `https://picsum.photos/100/100?random=${Date.now()}`,
    });
    setShowUserModal(true);
  };

  const handleSaveUser = () => {
    if (!formData.name) return;

    if (editingUser) {
      updateUser({ ...editingUser, ...formData } as TeamMember);
    } else {
      addUser({
        ...(formData as TeamMember),
        id: Date.now().toString(),
        completedTasksCount: 0,
        avatar:
          formData.avatar ||
          `https://picsum.photos/100/100?random=${Date.now()}`,
      });
    }
    setShowUserModal(false);
  };

  const handleDeleteUser = (id: string) => {
    if (window.confirm(t("confirmDelete"))) {
      deleteUser(id);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      (u.specialization &&
        u.specialization.toLowerCase().includes(userSearch.toLowerCase()))
  );

  const activeWorkers = users.filter((u) => u.isAvailable).length;
  const avgRate =
    users.reduce((acc, curr) => acc + (curr.hourlyRate || 0), 0) /
    (users.length || 1);

  return (
    <div className="space-y-6 p-4 md:p-6">
      <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-6">
        {t("teamManagement")}
      </h2>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-100 flex items-center">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-full mr-4">
            <Users size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">
              {t("totalWorkers")}
            </p>
            <p className="text-2xl font-bold text-slate-800">{users.length}</p>
          </div>
        </div>
        <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-100 flex items-center">
          <div className="p-3 bg-green-100 text-green-600 rounded-full mr-4">
            <CheckCircle size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">
              {t("activeToday")}
            </p>
            <p className="text-2xl font-bold text-slate-800">{activeWorkers}</p>
          </div>
        </div>
        <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-100 flex items-center">
          <div className="p-3 bg-orange-100 text-orange-600 rounded-full mr-4">
            <Euro size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">{t("avgRate")}</p>
            <p className="text-2xl font-bold text-slate-800">
              €{avgRate.toFixed(2)}/h
            </p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <div className="relative w-full md:w-96">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"
            size={18}
          />
          <input
            type="text"
            placeholder={t("search")}
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          onClick={handleAddClick}
          className="w-full md:w-auto bg-green-500 text-white px-6 py-2 rounded-lg font-bold hover:bg-green-600 transition-colors flex items-center justify-center shadow-lg shadow-green-500/20"
        >
          <Plus size={20} className="mr-2" /> {t("addWorker")}
        </button>
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {filteredUsers.map((user) => (
          <div
            key={user.id}
            className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow"
          >
            <div className="p-4 md:p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center">
                  <img
                    src={user.avatar}
                    className="w-12 h-12 rounded-full object-cover border-2 border-slate-100 mr-3"
                    alt={user.name}
                  />
                  <div>
                    <h3 className="font-bold text-slate-800">{user.name}</h3>
                    <p className="text-xs text-slate-500 font-medium uppercase">
                      {user.role === TeamUserRole.ADMIN
                        ? t("admin")
                        : user.specialization || t("worker")}
                    </p>
                  </div>
                </div>
                <div
                  className={`w-3 h-3 rounded-full ${
                    user.isAvailable ? "bg-green-500" : "bg-red-400"
                  }`}
                  title={user.isAvailable ? t("available") : t("unavailable")}
                ></div>
              </div>

              <div className="space-y-2 mb-6">
                <div className="flex items-center text-sm text-slate-600">
                  <Phone size={14} className="mr-2 text-slate-400" />{" "}
                  {user.phone || "-"}
                </div>
                <div className="flex items-center text-sm text-slate-600">
                  <Mail size={14} className="mr-2 text-slate-400" />{" "}
                  {user.email || "-"}
                </div>
                <div className="flex items-center text-sm text-slate-600">
                  <Euro size={14} className="mr-2 text-slate-400" />{" "}
                  {user.hourlyRate ? `€${user.hourlyRate}/h` : "-"}
                </div>
              </div>

              <div className="flex gap-2 border-t pt-4">
                <button
                  onClick={() => handleEditClick(user)}
                  className="flex-1 flex items-center justify-center py-2 bg-slate-50 hover:bg-blue-50 text-slate-600 hover:text-blue-600 rounded-lg transition-colors text-sm font-medium"
                >
                  <Edit2 size={16} className="mr-2" /> {t("editWorker")}
                </button>
                {user.id !== currentUser.id && (
                  <button
                    onClick={() => handleDeleteUser(user.id)}
                    className="p-2 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* --- ADD/EDIT USER MODAL --- */}
      {showUserModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="p-4 md:p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-lg md:text-xl text-slate-800">
                {editingUser ? t("editWorker") : t("addWorker")}
              </h3>
              <button onClick={() => setShowUserModal(false)}>
                <XCircle className="text-slate-400 hover:text-slate-600" />
              </button>
            </div>
            <div className="p-4 md:p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                  Imię i Nazwisko
                </label>
                <input
                  className="w-full border p-2 rounded-lg"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                    {t("role")}
                  </label>
                  <select
                    className="w-full border p-2 rounded-lg bg-white"
                    value={formData.role}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        role: e.target.value as TeamUserRole,
                      })
                    }
                  >
                    <option value={TeamUserRole.WORKER}>{t("worker")}</option>
                    <option value={TeamUserRole.ADMIN}>{t("admin")}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                    {t("specialization")}
                  </label>
                  <input
                    className="w-full border p-2 rounded-lg"
                    placeholder="np. Malarz"
                    value={formData.specialization}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        specialization: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                    {t("phone")}
                  </label>
                  <input
                    className="w-full border p-2 rounded-lg"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                    {t("hourlyRate")}
                  </label>
                  <input
                    type="number"
                    className="w-full border p-2 rounded-lg"
                    value={formData.hourlyRate}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        hourlyRate: Number(e.target.value),
                      })
                    }
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                  {t("email")}
                </label>
                <input
                  className="w-full border p-2 rounded-lg"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="p-4 border-t border-slate-100 flex justify-end gap-3">
              <button
                onClick={() => setShowUserModal(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
              >
                {t("cancel")}
              </button>
              <button
                onClick={handleSaveUser}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700"
              >
                {t("save")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamPage;
