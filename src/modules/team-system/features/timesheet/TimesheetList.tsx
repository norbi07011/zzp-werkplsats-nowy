/**
 * ================================================================
 * TIMESHEET LIST - Lista wpisów godzin do zatwierdzenia
 * ================================================================
 */

import React, { useState, useEffect, useCallback } from "react";
import { Calendar, Clock, User, Check, ChevronDown, ChevronUp, Filter, Loader2, AlertCircle } from 'lucide-react';









import { supabase } from "../../../../lib/supabase";
import { useAuth } from "../../../../../contexts/AuthContext";
import { toast } from "sonner";

interface TimesheetEntry {
  id: string;
  user_id: string;
  project_id: string;
  date: string;
  start_time: string;
  end_time: string;
  break_minutes: number;
  total_hours: number;
  hourly_rate: number | null;
  total_amount: number | null;
  billable: boolean;
  work_type: string;
  status: "pending" | "approved" | "rejected";
  notes: string | null;
  approved_by: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  // Joined data
  user_name?: string;
  project_title?: string;
}

interface TimesheetListProps {
  teamId: string;
  mode: "worker" | "employer";
  onAddEntry?: () => void;
}

export const TimesheetList: React.FC<TimesheetListProps> = ({
  teamId,
  mode,
  onAddEntry,
}) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [entries, setEntries] = useState<TimesheetEntry[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split("T")[0];
  });
  const [dateTo, setDateTo] = useState(new Date().toISOString().split("T")[0]);

  const fetchEntries = useCallback(async () => {
    setIsLoading(true);

    let query = supabase
      .from("team_timesheets")
      .select(
        `
        *,
        profiles:user_id (full_name),
        team_projects:project_id (title)
      `
      )
      .eq("team_id", teamId)
      .gte("date", dateFrom)
      .lte("date", dateTo)
      .order("date", { ascending: false });

    // Worker sees only their entries
    if (mode === "worker") {
      query = query.eq("user_id", user?.id);
    }

    // Status filter
    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching timesheets:", error);
      toast.error("Błąd ładowania godzin");
    } else {
      const mapped = (data || []).map((e: any) => ({
        ...e,
        user_name: e.profiles?.full_name || "Nieznany",
        project_title: e.team_projects?.title || "Projekt",
      }));
      setEntries(mapped);
    }
    setIsLoading(false);
  }, [teamId, mode, user?.id, statusFilter, dateFrom, dateTo]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const handleApprove = async (entryId: string) => {
    const { error } = await supabase
      .from("team_timesheets")
      .update({
        status: "approved",
        approved_by: user?.id,
        approved_at: new Date().toISOString(),
      })
      .eq("id", entryId);

    if (error) {
      toast.error("Błąd zatwierdzania");
    } else {
      toast.success("✅ Godziny zatwierdzone");
      fetchEntries();
    }
  };

  const handleReject = async (entryId: string, reason: string) => {
    const { error } = await supabase
      .from("team_timesheets")
      .update({
        status: "rejected",
        approved_by: user?.id,
        approved_at: new Date().toISOString(),
        rejection_reason: reason,
      })
      .eq("id", entryId);

    if (error) {
      toast.error("Błąd odrzucania");
    } else {
      toast.success("Godziny odrzucone");
      fetchEntries();
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      approved: "bg-emerald-100 text-emerald-800 border-emerald-200",
      rejected: "bg-red-100 text-red-800 border-red-200",
    };
    const labels: Record<string, string> = {
      pending: "Oczekuje",
      approved: "Zatwierdzone",
      rejected: "Odrzucone",
    };
    return (
      <span
        className={`px-2 py-1 text-xs font-medium rounded-full border ${styles[status]}`}
      >
        {labels[status]}
      </span>
    );
  };

  const formatTime = (time: string) => time?.slice(0, 5) || "--:--";

  const getTotalStats = () => {
    const pending = entries.filter((e) => e.status === "pending");
    const approved = entries.filter((e) => e.status === "approved");
    const totalHours = entries.reduce(
      (sum, e) => sum + (e.total_hours || 0),
      0
    );
    const totalAmount = entries.reduce(
      (sum, e) => sum + (e.total_amount || 0),
      0
    );

    return {
      pending: pending.length,
      approved: approved.length,
      totalHours,
      totalAmount,
    };
  };

  const stats = getTotalStats();

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
              <Clock className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                {mode === "employer"
                  ? "Godziny do zatwierdzenia"
                  : "Moje godziny"}
              </h2>
              <p className="text-sm text-gray-500">Urenregistratie</p>
            </div>
          </div>

          {onAddEntry && (
            <button
              onClick={onAddEntry}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors"
            >
              + Nowy wpis
            </button>
          )}
        </div>
      </div>

      {/* Stats Row */}
      <div className="px-6 py-3 bg-gray-50 border-b border-gray-100 grid grid-cols-4 gap-4">
        <div>
          <p className="text-xs text-gray-500">Oczekujące</p>
          <p className="text-lg font-bold text-yellow-600">{stats.pending}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Zatwierdzone</p>
          <p className="text-lg font-bold text-emerald-600">{stats.approved}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Suma godzin</p>
          <p className="text-lg font-bold text-gray-900">
            {stats.totalHours.toFixed(1)}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Wartość</p>
          <p className="text-lg font-bold text-gray-900">
            €{stats.totalAmount.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="px-6 py-3 border-b border-gray-100 flex flex-wrap gap-3 items-center">
        <Filter className="w-4 h-4 text-gray-400" />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
        >
          <option value="all">Wszystkie statusy</option>
          <option value="pending">Oczekujące</option>
          <option value="approved">Zatwierdzone</option>
          <option value="rejected">Odrzucone</option>
        </select>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
        />
        <span className="text-gray-400">–</span>
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
        />
        <button
          onClick={fetchEntries}
          className="ml-auto px-3 py-1.5 text-sm text-emerald-600 hover:text-emerald-700"
        >
          Odśwież
        </button>
      </div>

      {/* Entries */}
      <div className="divide-y divide-gray-100">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Clock className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p>Brak wpisów w wybranym okresie</p>
          </div>
        ) : (
          entries.map((entry) => (
            <div
              key={entry.id}
              className="px-6 py-4 hover:bg-gray-50 transition-colors"
            >
              {/* Main Row */}
              <div
                className="flex items-center gap-4 cursor-pointer"
                onClick={() =>
                  setExpandedId(expandedId === entry.id ? null : entry.id)
                }
              >
                <div className="flex-shrink-0">
                  <Calendar className="w-5 h-5 text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">
                      {new Date(entry.date).toLocaleDateString("pl-PL", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                    {getStatusBadge(entry.status)}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                    {mode === "employer" && (
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {entry.user_name}
                      </span>
                    )}
                    <span>{entry.project_title}</span>
                    <span>
                      {formatTime(entry.start_time)} –{" "}
                      {formatTime(entry.end_time)}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900">
                    {entry.total_hours}h
                  </p>
                  {entry.total_amount && (
                    <p className="text-sm text-gray-500">
                      €{entry.total_amount.toFixed(2)}
                    </p>
                  )}
                </div>
                <div>
                  {expandedId === entry.id ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </div>

              {/* Expanded Details */}
              {expandedId === entry.id && (
                <div className="mt-4 pl-9 space-y-3">
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Przerwa:</span>{" "}
                      <span className="font-medium">
                        {entry.break_minutes} min
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Typ:</span>{" "}
                      <span className="font-medium">{entry.work_type}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Fakturowane:</span>{" "}
                      <span className="font-medium">
                        {entry.billable ? "Tak" : "Nie"}
                      </span>
                    </div>
                  </div>
                  {entry.notes && (
                    <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
                      <span className="font-medium">Notatki: </span>
                      {entry.notes}
                    </div>
                  )}
                  {entry.rejection_reason && (
                    <div className="bg-red-50 rounded-lg p-3 text-sm text-red-700 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 mt-0.5" />
                      <span>
                        <strong>Powód odrzucenia:</strong>{" "}
                        {entry.rejection_reason}
                      </span>
                    </div>
                  )}

                  {/* Employer Actions */}
                  {mode === "employer" && entry.status === "pending" && (
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleApprove(entry.id);
                        }}
                        className="flex items-center gap-1 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
                      >
                        <Check className="w-4 h-4" />
                        Zatwierdź
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const reason = prompt("Podaj powód odrzucenia:");
                          if (reason) handleReject(entry.id, reason);
                        }}
                        className="flex items-center gap-1 px-4 py-2 border border-red-300 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors"
                      >
                        <X className="w-4 h-4" />
                        Odrzuć
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TimesheetList;
