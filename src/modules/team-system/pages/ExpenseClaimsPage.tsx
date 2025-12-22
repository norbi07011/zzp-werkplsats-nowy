/**
 * ================================================================
 * EXPENSE CLAIMS PAGE - Rozliczenia Kosztów
 * ================================================================
 * Wyświetla i zarządza wnioskami o zwrot kosztów zespołu
 */

import React, { useState, useEffect, useCallback } from "react";
import { useTeamStore } from "../context/TeamStoreContext";
import { supabase } from "../../../lib/supabase";
import { format, parseISO } from "date-fns";
import { pl } from "date-fns/locale";
import {
  Receipt,
  Plus,
  CheckCircle,
  XCircle,
  AlertCircle,
  User,
  Wallet,
  Filter,
  FileText,
  Download,
  Eye,
  Activity,
  Wrench,
  Package,
  MapPin,
  FileText as MealIcon,
  MoreHorizontal,
} from "lucide-react";
import { toast } from "sonner";

interface ExpenseClaim {
  id: string;
  team_id: string;
  user_id: string;
  project_id: string | null;
  title: string;
  description: string | null;
  category: string;
  amount: number;
  currency: string;
  receipt_url: string | null;
  expense_date: string;
  status: "pending" | "approved" | "rejected" | "paid";
  approved_by: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
  payment_reference: string | null;
  created_at: string;
  // Joined data
  user_name?: string;
  project_title?: string;
  approver_name?: string;
}

const EXPENSE_CATEGORIES = [
  {
    id: "fuel",
    label: "Paliwo",
    icon: Activity,
    color: "bg-amber-100 text-amber-600",
  },
  {
    id: "materials",
    label: "Materiały",
    icon: Package,
    color: "bg-blue-100 text-blue-600",
  },
  {
    id: "tools",
    label: "Narzędzia",
    icon: Wrench,
    color: "bg-purple-100 text-purple-600",
  },
  {
    id: "transport",
    label: "Transport",
    icon: MapPin,
    color: "bg-green-100 text-green-600",
  },
  {
    id: "meals",
    label: "Posiłki",
    icon: MealIcon,
    color: "bg-orange-100 text-orange-600",
  },
  {
    id: "other",
    label: "Inne",
    icon: MoreHorizontal,
    color: "bg-slate-100 text-slate-600",
  },
];

export const ExpenseClaimsPage = () => {
  const { selectedTeamId, users, projects, t, currentUser } = useTeamStore();
  const [expenses, setExpenses] = useState<ExpenseClaim[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<
    "all" | "pending" | "approved" | "rejected" | "paid"
  >("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterUserId, setFilterUserId] = useState<string>("all");
  const [showAddModal, setShowAddModal] = useState(false);

  const fetchExpenses = useCallback(async () => {
    if (!selectedTeamId) return;

    setIsLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from("team_expense_claims")
        .select(
          `
          *,
          profiles!team_expense_claims_user_id_fkey(full_name),
          team_projects(title),
          approver:profiles!team_expense_claims_approved_by_fkey(full_name)
        `
        )
        .eq("team_id", selectedTeamId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const mapped: ExpenseClaim[] = (data || []).map((e: any) => ({
        ...e,
        user_name: e.profiles?.full_name || "Nieznany",
        project_title: e.team_projects?.title || null,
        approver_name: e.approver?.full_name || null,
      }));

      setExpenses(mapped);
    } catch (error) {
      console.error("Error fetching expenses:", error);
      toast.error("Nie udało się pobrać rozliczeń kosztów");
    } finally {
      setIsLoading(false);
    }
  }, [selectedTeamId]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const handleApprove = async (id: string) => {
    try {
      const { error } = await (supabase as any)
        .from("team_expense_claims")
        .update({
          status: "approved",
          approved_by: currentUser?.id,
          approved_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;

      toast.success("Wniosek zatwierdzony");
      fetchExpenses();
    } catch (error) {
      console.error("Error approving expense:", error);
      toast.error("Nie udało się zatwierdzić wniosku");
    }
  };

  const handleReject = async (id: string) => {
    const reason = prompt("Podaj powód odrzucenia:");
    if (!reason) return;

    try {
      const { error } = await (supabase as any)
        .from("team_expense_claims")
        .update({
          status: "rejected",
          rejection_reason: reason,
        })
        .eq("id", id);

      if (error) throw error;

      toast.success("Wniosek odrzucony");
      fetchExpenses();
    } catch (error) {
      console.error("Error rejecting expense:", error);
      toast.error("Nie udało się odrzucić wniosku");
    }
  };

  const handleMarkPaid = async (id: string) => {
    const reference = prompt("Podaj referencję płatności (opcjonalnie):");

    try {
      const { error } = await (supabase as any)
        .from("team_expense_claims")
        .update({
          status: "paid",
          payment_reference: reference || null,
        })
        .eq("id", id);

      if (error) throw error;

      toast.success("Oznaczono jako wypłacone");
      fetchExpenses();
    } catch (error) {
      console.error("Error marking expense as paid:", error);
      toast.error("Nie udało się oznaczyć jako wypłacone");
    }
  };

  // Filter expenses
  let filteredExpenses = expenses;
  if (filterStatus !== "all") {
    filteredExpenses = filteredExpenses.filter(
      (e) => e.status === filterStatus
    );
  }
  if (filterCategory !== "all") {
    filteredExpenses = filteredExpenses.filter(
      (e) => e.category === filterCategory
    );
  }
  if (filterUserId !== "all") {
    filteredExpenses = filteredExpenses.filter(
      (e) => e.user_id === filterUserId
    );
  }

  // Calculate totals
  const totalAmount = filteredExpenses.reduce(
    (sum, e) => sum + (e.amount || 0),
    0
  );
  const pendingAmount = filteredExpenses
    .filter((e) => e.status === "pending")
    .reduce((sum, e) => sum + (e.amount || 0), 0);
  const approvedAmount = filteredExpenses
    .filter((e) => e.status === "approved")
    .reduce((sum, e) => sum + (e.amount || 0), 0);
  const paidAmount = filteredExpenses
    .filter((e) => e.status === "paid")
    .reduce((sum, e) => sum + (e.amount || 0), 0);

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
      case "paid":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <Wallet size={12} className="mr-1" /> Wypłacone
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

  const getCategoryInfo = (category: string) => {
    return (
      EXPENSE_CATEGORIES.find((c) => c.id === category) || EXPENSE_CATEGORIES[5]
    );
  };

  if (!selectedTeamId) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-white rounded-xl border border-slate-100">
        <Receipt size={64} className="text-slate-300 mb-4" />
        <h3 className="text-xl font-semibold text-slate-600 mb-2">
          Wybierz zespół
        </h3>
        <p className="text-slate-400">
          Rozliczenia kosztów wymagają wybrania zespołu.
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
            Rozliczenia Kosztów
          </h2>
          <p className="text-slate-500 text-sm">
            Zarządzaj wnioskami o zwrot wydatków
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus size={18} />
          Dodaj wniosek
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center">
          <div className="p-3 bg-slate-100 text-slate-600 rounded-full mr-4">
            <Receipt size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500">Łącznie</p>
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
            <p className="text-sm text-slate-500">Oczekujące</p>
            <p className="text-2xl font-bold text-slate-800">
              €{pendingAmount.toFixed(2)}
            </p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center">
          <div className="p-3 bg-green-100 text-green-600 rounded-full mr-4">
            <CheckCircle size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500">Zatwierdzone</p>
            <p className="text-2xl font-bold text-slate-800">
              €{approvedAmount.toFixed(2)}
            </p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-full mr-4">
            <Wallet size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500">Wypłacone</p>
            <p className="text-2xl font-bold text-slate-800">
              €{paidAmount.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col md:flex-row items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-slate-400" />
          <span className="text-sm text-slate-600">Filtry:</span>
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as any)}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="all">Wszystkie statusy</option>
          <option value="pending">Oczekujące</option>
          <option value="approved">Zatwierdzone</option>
          <option value="rejected">Odrzucone</option>
          <option value="paid">Wypłacone</option>
        </select>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="all">Wszystkie kategorie</option>
          {EXPENSE_CATEGORIES.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.label}
            </option>
          ))}
        </select>
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

      {/* Expenses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredExpenses.length === 0 ? (
          <div className="col-span-full bg-white rounded-xl border border-slate-100 p-12 text-center">
            <Receipt size={48} className="mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500">Brak wniosków o zwrot kosztów</p>
          </div>
        ) : (
          filteredExpenses.map((expense) => {
            const catInfo = getCategoryInfo(expense.category);
            const CategoryIcon = catInfo.icon;

            return (
              <div
                key={expense.id}
                className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className={`p-2 rounded-lg ${catInfo.color}`}>
                      <CategoryIcon size={20} />
                    </div>
                    {getStatusBadge(expense.status)}
                  </div>

                  <h3 className="font-semibold text-slate-800 mb-1">
                    {expense.title}
                  </h3>
                  {expense.description && (
                    <p className="text-sm text-slate-500 mb-3 line-clamp-2">
                      {expense.description}
                    </p>
                  )}

                  <div className="flex items-center gap-2 text-sm text-slate-500 mb-3">
                    <User size={14} />
                    <span>{expense.user_name}</span>
                    <span className="mx-1">•</span>
                    <span>
                      {format(parseISO(expense.expense_date), "d MMM yyyy", {
                        locale: pl,
                      })}
                    </span>
                  </div>

                  {expense.project_title && (
                    <div className="text-xs text-slate-400 mb-3">
                      Projekt: {expense.project_title}
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                    <span className="text-2xl font-bold text-primary-600">
                      {expense.currency === "EUR" ? "€" : expense.currency}
                      {expense.amount.toFixed(2)}
                    </span>

                    <div className="flex gap-2">
                      {expense.receipt_url && (
                        <a
                          href={expense.receipt_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
                          title="Zobacz paragon"
                        >
                          <Eye size={16} />
                        </a>
                      )}

                      {expense.status === "pending" && (
                        <>
                          <button
                            onClick={() => handleApprove(expense.id)}
                            className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
                            title="Zatwierdź"
                          >
                            <CheckCircle size={16} />
                          </button>
                          <button
                            onClick={() => handleReject(expense.id)}
                            className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                            title="Odrzuć"
                          >
                            <XCircle size={16} />
                          </button>
                        </>
                      )}

                      {expense.status === "approved" && (
                        <button
                          onClick={() => handleMarkPaid(expense.id)}
                          className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                          title="Oznacz jako wypłacone"
                        >
                          <Wallet size={16} />
                        </button>
                      )}
                    </div>
                  </div>

                  {expense.rejection_reason && (
                    <div className="mt-3 p-2 bg-red-50 rounded-lg">
                      <p className="text-xs text-red-600">
                        <strong>Powód odrzucenia:</strong>{" "}
                        {expense.rejection_reason}
                      </p>
                    </div>
                  )}

                  {expense.payment_reference && (
                    <div className="mt-3 p-2 bg-blue-50 rounded-lg">
                      <p className="text-xs text-blue-600">
                        <strong>Ref. płatności:</strong>{" "}
                        {expense.payment_reference}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ExpenseClaimsPage;
