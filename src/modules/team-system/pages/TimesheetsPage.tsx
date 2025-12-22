/**
 * ================================================================
 * TIMESHEETS PAGE - Karty Czasu Pracy
 * ================================================================
 * Wyświetla i zarządza timesheetami zespołu
 */

import React, { useState, useEffect, useCallback } from "react";
import { useTeamStore } from "../context/TeamStoreContext";
import { supabase } from "../../../lib/supabase";
import {
  format,
  parseISO,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addWeeks,
  subWeeks,
} from "date-fns";
import { pl } from "date-fns/locale";
import {
  Clock,
  Calendar,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  AlertCircle,
  User,
  Briefcase,
  Wallet,
  Filter,
} from "lucide-react";
import { toast } from "sonner";

interface Timesheet {
  id: string;
  team_id: string;
  user_id: string;
  project_id: string | null;
  task_id: string | null;
  date: string;
  start_time: string;
  end_time: string | null;
  break_minutes: number;
  total_hours: number;
  hourly_rate: number | null;
  total_amount: number | null;
  billable: boolean;
  work_type: string | null;
  status: "pending" | "approved" | "rejected";
  notes: string | null;
  created_at: string;
  // Joined data
  user_name?: string;
  project_title?: string;
  task_title?: string;
}

export const TimesheetsPage = () => {
  const { selectedTeamId, users, projects, t, currentUser } = useTeamStore();
  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [filterStatus, setFilterStatus] = useState<
    "all" | "pending" | "approved" | "rejected"
  >("all");
  const [filterUserId, setFilterUserId] = useState<string>("all");

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const fetchTimesheets = useCallback(async () => {
    if (!selectedTeamId) return;

    setIsLoading(true);
    try {
      let query = (supabase as any)
        .from("team_timesheets")
        .select(
          `
          *,
          profiles!team_timesheets_user_id_fkey(full_name),
          team_projects(title),
          team_tasks(title)
        `
        )
        .eq("team_id", selectedTeamId)
        .gte("date", format(weekStart, "yyyy-MM-dd"))
        .lte("date", format(weekEnd, "yyyy-MM-dd"))
        .order("date", { ascending: true })
        .order("start_time", { ascending: true });

      const { data, error } = await query;

      if (error) throw error;

      const mapped: Timesheet[] = (data || []).map((t: any) => ({
        ...t,
        user_name: t.profiles?.full_name || "Nieznany",
        project_title: t.team_projects?.title || null,
        task_title: t.team_tasks?.title || null,
      }));

      setTimesheets(mapped);
    } catch (error) {
      console.error("Error fetching timesheets:", error);
      toast.error("Nie udało się pobrać kart czasu pracy");
    } finally {
      setIsLoading(false);
    }
  }, [selectedTeamId, weekStart, weekEnd]);

  useEffect(() => {
    fetchTimesheets();
  }, [fetchTimesheets]);

  const handleApprove = async (id: string) => {
    try {
      const { error } = await (supabase as any)
        .from("team_timesheets")
        .update({
          status: "approved",
          approved_by: currentUser?.id,
          approved_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;

      toast.success("Karta zatwierdzona");
      fetchTimesheets();
    } catch (error) {
      console.error("Error approving timesheet:", error);
      toast.error("Nie udało się zatwierdzić karty");
    }
  };

  const handleReject = async (id: string) => {
    const reason = prompt("Podaj powód odrzucenia:");
    if (!reason) return;

    try {
      const { error } = await (supabase as any)
        .from("team_timesheets")
        .update({
          status: "rejected",
          rejection_reason: reason,
        })
        .eq("id", id);

      if (error) throw error;

      toast.success("Karta odrzucona");
      fetchTimesheets();
    } catch (error) {
      console.error("Error rejecting timesheet:", error);
      toast.error("Nie udało się odrzucić karty");
    }
  };

  // Filter timesheets
  let filteredTimesheets = timesheets;
  if (filterStatus !== "all") {
    filteredTimesheets = filteredTimesheets.filter(
      (t) => t.status === filterStatus
    );
  }
  if (filterUserId !== "all") {
    filteredTimesheets = filteredTimesheets.filter(
      (t) => t.user_id === filterUserId
    );
  }

  // Calculate totals
  const totalHours = filteredTimesheets.reduce(
    (sum, t) => sum + (t.total_hours || 0),
    0
  );
  const totalAmount = filteredTimesheets.reduce(
    (sum, t) => sum + (t.total_amount || 0),
    0
  );
  const pendingCount = filteredTimesheets.filter(
    (t) => t.status === "pending"
  ).length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle size={12} className="mr-1" /> Zatwierdzone
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle size={12} className="mr-1" /> Odrzucone
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <AlertCircle size={12} className="mr-1" /> Oczekuje
          </span>
        );
    }
  };

  if (!selectedTeamId) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-white rounded-xl border border-slate-100">
        <Clock size={64} className="text-slate-300 mb-4" />
        <h3 className="text-xl font-semibold text-slate-600 mb-2">
          Wybierz zespół
        </h3>
        <p className="text-slate-400">
          Karty czasu pracy wymagają wybrania zespołu.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">
            Karty Czasu Pracy
          </h2>
          <p className="text-slate-500 text-sm">
            Zarządzaj godzinami pracy zespołu
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-full mr-4">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500">Łączny czas</p>
            <p className="text-2xl font-bold text-slate-800">
              {totalHours.toFixed(1)}h
            </p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center">
          <div className="p-3 bg-green-100 text-green-600 rounded-full mr-4">
            <Wallet size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500">Łączna kwota</p>
            <p className="text-2xl font-bold text-slate-800">
              €{totalAmount.toFixed(2)}
            </p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center">
          <div className="p-3 bg-yellow-100 text-yellow-600 rounded-full mr-4">
            <AlertCircle size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500">Do zatwierdzenia</p>
            <p className="text-2xl font-bold text-slate-800">{pendingCount}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center">
          <div className="p-3 bg-slate-100 text-slate-600 rounded-full mr-4">
            <Briefcase size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500">Wpisów</p>
            <p className="text-2xl font-bold text-slate-800">
              {filteredTimesheets.length}
            </p>
          </div>
        </div>
      </div>

      {/* Week Navigation & Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-lg">
            <Calendar size={16} className="text-slate-500" />
            <span className="font-medium text-slate-700">
              {format(weekStart, "d MMM", { locale: pl })} -{" "}
              {format(weekEnd, "d MMM yyyy", { locale: pl })}
            </span>
          </div>
          <button
            onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ChevronRight size={20} />
          </button>
          <button
            onClick={() => setCurrentWeek(new Date())}
            className="px-3 py-2 text-sm bg-primary-50 text-primary-600 rounded-lg hover:bg-primary-100 transition-colors"
          >
            Dzisiaj
          </button>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-slate-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">Wszystkie statusy</option>
              <option value="pending">Oczekujące</option>
              <option value="approved">Zatwierdzone</option>
              <option value="rejected">Odrzucone</option>
            </select>
          </div>
          <select
            value={filterUserId}
            onChange={(e) => setFilterUserId(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">Wszyscy pracownicy</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Timesheets Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Data
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Pracownik
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Projekt / Zadanie
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Czas
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Godziny
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Kwota
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Akcje
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTimesheets.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-12 text-center text-slate-500"
                  >
                    <Clock size={48} className="mx-auto text-slate-300 mb-4" />
                    <p>Brak kart czasu pracy w tym okresie</p>
                  </td>
                </tr>
              ) : (
                filteredTimesheets.map((ts) => (
                  <tr
                    key={ts.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <span className="font-medium text-slate-800">
                        {format(parseISO(ts.date), "EEEE, d MMM", {
                          locale: pl,
                        })}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mr-2">
                          <User size={14} />
                        </div>
                        <span className="text-slate-700">{ts.user_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-slate-700">
                          {ts.project_title || "-"}
                        </p>
                        {ts.task_title && (
                          <p className="text-xs text-slate-500">
                            {ts.task_title}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {ts.start_time?.slice(0, 5)} -{" "}
                      {ts.end_time?.slice(0, 5) || "..."}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-slate-800">
                        {ts.total_hours?.toFixed(1)}h
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {ts.total_amount ? (
                        <span className="font-semibold text-green-600">
                          €{ts.total_amount.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">{getStatusBadge(ts.status)}</td>
                    <td className="px-4 py-3">
                      {ts.status === "pending" && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApprove(ts.id)}
                            className="p-1.5 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
                            title="Zatwierdź"
                          >
                            <CheckCircle size={16} />
                          </button>
                          <button
                            onClick={() => handleReject(ts.id)}
                            className="p-1.5 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                            title="Odrzuć"
                          >
                            <XCircle size={16} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Notes */}
      {filteredTimesheets.some((t) => t.notes) && (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
          <h3 className="font-semibold text-slate-800 mb-3">Notatki</h3>
          <div className="space-y-2">
            {filteredTimesheets
              .filter((t) => t.notes)
              .map((ts) => (
                <div key={ts.id} className="p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-slate-700">
                      {ts.user_name}
                    </span>
                    <span className="text-xs text-slate-400">
                      {format(parseISO(ts.date), "d MMM", { locale: pl })}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600">{ts.notes}</p>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TimesheetsPage;
