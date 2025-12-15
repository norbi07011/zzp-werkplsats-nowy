/**
 * ================================================================
 * EXPENSE LIST - Lista wydatków do zatwierdzenia
 * ================================================================
 */

import React, { useState, useEffect, useCallback } from "react";














import { supabaseUntyped as supabase } from "../../../../lib/supabase";
import { useAuth } from "../../../../../contexts/AuthContext";
import { toast } from "sonner";

interface ExpenseEntry {
  id: string;
  user_id: string;
  project_id: string | null;
  date: string;
  category: string;
  amount: number;
  vat_amount: number | null;
  currency: string;
  description: string;
  merchant: string | null;
  receipt_url: string | null;
  status: "pending" | "approved" | "rejected" | "paid";
  approved_by: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
  paid_at: string | null;
  created_at: string;
  // Joined
  user_name?: string;
  project_title?: string;
}

interface ExpenseListProps {
  teamId: string;
  mode: "worker" | "employer";
  onAddExpense?: () => void;
}

const CATEGORY_LABELS: Record<string, { label: string; icon: string }> = {
  travel: { label: "Podróż", icon: "🚗" },
  meals: { label: "Posiłki", icon: "🍽️" },
  materials: { label: "Materiały", icon: "🔧" },
  tools: { label: "Narzędzia", icon: "🛠️" },
  parking: { label: "Parking", icon: "🅿️" },
  accommodation: { label: "Nocleg", icon: "🏨" },
  equipment: { label: "Sprzęt", icon: "💻" },
  office: { label: "Biuro", icon: "📎" },
  other: { label: "Inne", icon: "📦" },
};

export const ExpenseList: React.FC<ExpenseListProps> = ({
  teamId,
  mode,
  onAddExpense,
}) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [entries, setEntries] = useState<ExpenseEntry[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split("T")[0];
  });
  const [dateTo, setDateTo] = useState(new Date().toISOString().split("T")[0]);

  const fetchEntries = useCallback(async () => {
    setIsLoading(true);

    let query = supabase
      .from("team_expense_claims")
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

    if (mode === "worker") {
      query = query.eq("user_id", user?.id);
    }

    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }

    if (categoryFilter !== "all") {
      query = query.eq("category", categoryFilter);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching expenses:", error);
      toast.error("Błąd ładowania wydatków");
    } else {
      const mapped = (data || []).map((e: any) => ({
        ...e,
        user_name: e.profiles?.full_name || "Nieznany",
        project_title: e.team_projects?.title || null,
      }));
      setEntries(mapped);
    }
    setIsLoading(false);
  }, [teamId, mode, user?.id, statusFilter, categoryFilter, dateFrom, dateTo]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const handleApprove = async (entryId: string) => {
    const { error } = await supabase
      .from("team_expense_claims")
      .update({
        status: "approved",
        approved_by: user?.id,
        approved_at: new Date().toISOString(),
      })
      .eq("id", entryId);

    if (error) {
      toast.error("Błąd zatwierdzania");
    } else {
      toast.success("✅ Wydatek zatwierdzony");
      fetchEntries();
    }
  };

  const handleMarkPaid = async (entryId: string) => {
    const { error } = await supabase
      .from("team_expense_claims")
      .update({
        status: "paid",
        paid_at: new Date().toISOString(),
      })
      .eq("id", entryId);

    if (error) {
      toast.error("Błąd oznaczania jako wypłacone");
    } else {
      toast.success("💰 Oznaczono jako wypłacone");
      fetchEntries();
    }
  };

  const handleReject = async (entryId: string, reason: string) => {
    const { error } = await supabase
      .from("team_expense_claims")
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
      toast.success("Wydatek odrzucony");
      fetchEntries();
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      approved: "bg-blue-100 text-blue-800 border-blue-200",
      rejected: "bg-red-100 text-red-800 border-red-200",
      paid: "bg-emerald-100 text-emerald-800 border-emerald-200",
    };
    const labels: Record<string, string> = {
      pending: "Oczekuje",
      approved: "Zatwierdzone",
      rejected: "Odrzucone",
      paid: "Wypłacone",
    };
    return (
      <span
        className={`px-2 py-1 text-xs font-medium rounded-full border ${styles[status]}`}
      >
        {labels[status]}
      </span>
    );
  };

  const getTotalStats = () => {
    const pending = entries.filter((e) => e.status === "pending");
    const approved = entries.filter((e) => e.status === "approved");
    const paid = entries.filter((e) => e.status === "paid");
    const totalAmount = entries.reduce((sum, e) => sum + (e.amount || 0), 0);
    const pendingAmount = pending.reduce((sum, e) => sum + (e.amount || 0), 0);

    return {
      pending: pending.length,
      approved: approved.length,
      paid: paid.length,
      totalAmount,
      pendingAmount,
    };
  };

  const stats = getTotalStats();

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <Receipt className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                {mode === "employer"
                  ? "Wydatki do zatwierdzenia"
                  : "Moje wydatki"}
              </h2>
              <p className="text-sm text-gray-500">Declaraties</p>
            </div>
          </div>

          {onAddExpense && (
            <button
              onClick={onAddExpense}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
            >
              + Nowy wydatek
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
          <p className="text-xs text-gray-500">Do wypłaty</p>
          <p className="text-lg font-bold text-blue-600">
            €{stats.pendingAmount.toFixed(2)}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Wypłacone</p>
          <p className="text-lg font-bold text-emerald-600">{stats.paid}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Suma</p>
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
          <option value="paid">Wypłacone</option>
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
        >
          <option value="all">Wszystkie kategorie</option>
          {Object.entries(CATEGORY_LABELS).map(([key, { label, icon }]) => (
            <option key={key} value={key}>
              {icon} {label}
            </option>
          ))}
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
      </div>

      {/* Entries */}
      <div className="divide-y divide-gray-100">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader className="w-8 h-8 text-purple-500 animate-spin" />
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Receipt className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p>Brak wydatków w wybranym okresie</p>
          </div>
        ) : (
          entries.map((entry) => {
            const categoryInfo = CATEGORY_LABELS[entry.category] || {
              label: entry.category,
              icon: "📦",
            };
            return (
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
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-xl">
                    {categoryInfo.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 truncate">
                        {entry.description}
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
                      <span>
                        {new Date(entry.date).toLocaleDateString("pl-PL")}
                      </span>
                      <span className="flex items-center gap-1">
                        <Tag className="w-3 h-3" />
                        {categoryInfo.label}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">
                      €{entry.amount.toFixed(2)}
                    </p>
                    {entry.receipt_url && (
                      <span className="text-xs text-purple-600">
                        📎 Paragon
                      </span>
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
                  <div className="mt-4 pl-14 space-y-3">
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      {entry.merchant && (
                        <div>
                          <span className="text-gray-500">Sprzedawca:</span>{" "}
                          <span className="font-medium">{entry.merchant}</span>
                        </div>
                      )}
                      {entry.vat_amount && (
                        <div>
                          <span className="text-gray-500">BTW:</span>{" "}
                          <span className="font-medium">
                            €{entry.vat_amount.toFixed(2)}
                          </span>
                        </div>
                      )}
                      {entry.project_title && (
                        <div>
                          <span className="text-gray-500">Projekt:</span>{" "}
                          <span className="font-medium">
                            {entry.project_title}
                          </span>
                        </div>
                      )}
                    </div>

                    {entry.receipt_url && (
                      <a
                        href={entry.receipt_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-2 bg-purple-50 text-purple-700 rounded-lg text-sm hover:bg-purple-100 transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Zobacz paragon
                      </a>
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
                          className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
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

                    {mode === "employer" && entry.status === "approved" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkPaid(entry.id);
                        }}
                        className="flex items-center gap-1 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
                      >
                        <Euro className="w-4 h-4" />
                        Oznacz jako wypłacone
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ExpenseList;
