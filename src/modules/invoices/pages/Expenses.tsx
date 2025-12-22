// =====================================================
// EXPENSES PAGE - PREMIUM 3D DESIGN
// =====================================================
// Business expense tracking with VAT deduction
// Premium styling with 3D cards, glassmorphic elements
// =====================================================

import { useState, useMemo, useRef } from "react";
import { useTranslation } from "../i18n";
import { useSupabaseExpenses } from "../hooks";
import { Textarea } from "../components/ui/textarea";
import { formatCurrency, formatDate } from "../lib";
import { useAuth } from "../../../../contexts/AuthContext";
import { EXPENSE_CATEGORIES } from "../types";
import type { Expense, ExpenseCategory, PaymentMethod } from "../types";
import {
  Receipt,
  Plus,
  Save,
  Trash2,
  Search,
  FileText,
  CheckCircle2,
  Menu,
  Settings,
  TrendingUp,
  CreditCard,
  X,
  Calendar,
  Edit3,
  Download,
} from "lucide-react";

// 3D Tilt Card Component
const TiltCard = ({
  children,
  className = "",
}: {
  children?: React.ReactNode;
  className?: string;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [rotate, setRotate] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const { left, top, width, height } = ref.current.getBoundingClientRect();
    const x = (e.clientX - left - width / 2) / 20;
    const y = (e.clientY - top - height / 2) / 20;
    setRotate({ x: -y, y: x });
  };

  const handleMouseLeave = () => {
    setRotate({ x: 0, y: 0 });
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: `perspective(1000px) rotateX(${rotate.x}deg) rotateY(${rotate.y}deg)`,
        transition: "transform 0.1s ease-out",
      }}
      className={`relative transition-all duration-300 h-full ${className}`}
    >
      {children}
    </div>
  );
};

// Category Styles for premium UI
const CATEGORY_STYLES: Record<
  string,
  { color: string; bg: string; icon: typeof Receipt }
> = {
  software: { color: "text-blue-600", bg: "bg-blue-50", icon: FileText },
  office: { color: "text-emerald-600", bg: "bg-emerald-50", icon: FileText },
  fuel: { color: "text-orange-600", bg: "bg-orange-50", icon: TrendingUp },
  equipment: { color: "text-purple-600", bg: "bg-purple-50", icon: Settings },
  marketing: { color: "text-pink-600", bg: "bg-pink-50", icon: TrendingUp },
  other: { color: "text-slate-600", bg: "bg-slate-50", icon: Receipt },
};

interface ExpensesProps {
  onNavigate: (page: string, expenseId?: string) => void;
}

export default function Expenses({ onNavigate }: ExpensesProps) {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { expenses, createExpense, updateExpense, deleteExpense } =
    useSupabaseExpenses(user?.id || "");

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );
  const [viewMode, setViewMode] = useState<"list" | "gallery">("list");
  const [filterCategory, setFilterCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const [formData, setFormData] = useState<{
    date: string;
    category: ExpenseCategory;
    supplier: string;
    description: string;
    amount: number;
    vat_rate: number;
    payment_method: PaymentMethod;
    is_deductible: boolean;
    deductible_percentage: number;
    notes?: string;
  }>({
    date: new Date().toISOString().split("T")[0],
    category: "software",
    supplier: "",
    description: "",
    amount: 0,
    vat_rate: 21,
    payment_method: "bank_transfer",
    is_deductible: true,
    deductible_percentage: 100,
  });

  // Filter by month, category and search
  const filteredExpenses = useMemo(() => {
    return (expenses || [])
      .filter((exp) => exp.date.startsWith(selectedMonth))
      .filter(
        (exp) => filterCategory === "ALL" || exp.category === filterCategory
      )
      .filter(
        (exp) =>
          searchQuery === "" ||
          exp.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (exp.supplier || "").toLowerCase().includes(searchQuery.toLowerCase())
      )
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [expenses, selectedMonth, filterCategory, searchQuery]);

  // Totals
  const totals = useMemo(() => {
    return {
      count: filteredExpenses.length,
      amount: filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0),
      vat: filteredExpenses.reduce((sum, exp) => sum + exp.vat_amount, 0),
      gross: filteredExpenses.reduce(
        (sum, exp) => sum + exp.amount + exp.vat_amount,
        0
      ),
      deductibleVat: filteredExpenses.reduce(
        (sum, exp) =>
          sum +
          (exp.is_deductible
            ? exp.vat_amount * (exp.deductible_percentage / 100)
            : 0),
        0
      ),
    };
  }, [filteredExpenses]);

  const handleOpenDialog = (expense?: Expense) => {
    if (expense) {
      setEditingExpense(expense);
      setFormData({
        date: expense.date,
        category: expense.category,
        supplier: expense.supplier || "",
        description: expense.description,
        amount: expense.amount,
        vat_rate: expense.vat_rate,
        payment_method: expense.payment_method || "bank_transfer",
        is_deductible: expense.is_deductible,
        deductible_percentage: expense.deductible_percentage,
        notes: expense.notes,
      });
    } else {
      setEditingExpense(null);
      setFormData({
        date: new Date().toISOString().split("T")[0],
        category: "software",
        supplier: "",
        description: "",
        amount: 0,
        vat_rate: 21,
        payment_method: "bank_transfer",
        is_deductible: true,
        deductible_percentage: 100,
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.supplier || !formData.description || formData.amount <= 0) {
      alert("Dostawca, opis i kwota są wymagane");
      return;
    }

    try {
      const vatAmount =
        Math.round(formData.amount * (formData.vat_rate / 100) * 100) / 100;

      const expenseData = {
        ...formData,
        user_id: user?.id || "",
        vat_amount: vatAmount,
        is_paid: false, // Default unpaid
      };

      if (editingExpense) {
        await updateExpense(editingExpense.id, expenseData);
        alert("Wydatek zaktualizowany");
      } else {
        await createExpense(expenseData);
        alert("Wydatek dodany");
      }

      setIsDialogOpen(false);
    } catch (error) {
      alert("Błąd zapisu wydatku");
      console.error(error);
    }
  };

  const handleDelete = async (id: string, supplier: string) => {
    if (confirm(`Czy na pewno usunąć wydatek "${supplier}"?`)) {
      try {
        await deleteExpense(id);
        alert("Wydatek usunięty");
      } catch (error) {
        alert("Błąd usuwania");
        console.error(error);
      }
    }
  };

  const handleExportCSV = () => {
    const csv = [
      ["Data", "Kategoria", "Dostawca", "Opis", "Kwota", "VAT", "Brutto"].join(
        ";"
      ),
      ...filteredExpenses.map((exp) => {
        const categoryInfo = EXPENSE_CATEGORIES.find(
          (c) => c.category === exp.category
        );
        return [
          exp.date,
          categoryInfo?.name_pl || exp.category,
          exp.supplier || "",
          exp.description,
          exp.amount.toFixed(2),
          exp.vat_amount.toFixed(2),
          (exp.amount + exp.vat_amount).toFixed(2),
        ].join(";");
      }),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `wydatki_${selectedMonth}.csv`;
    link.click();
    alert("CSV wyeksportowany");
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      {/* --- Premium Header --- */}
      <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-3 py-1 rounded-full bg-rose-50 border border-rose-100 text-rose-600 text-xs font-bold uppercase tracking-wider flex items-center gap-1">
              <CreditCard size={14} /> Cost Control
            </span>
          </div>
          <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-slate-800 to-slate-600 tracking-tight">
            💳 {t.expenses.title}
          </h2>
          <p className="text-slate-500 mt-2 font-medium text-lg">
            Inteligentna ewidencja wydatków i rozliczenia VAT
          </p>
        </div>

        <div className="flex gap-3">
          {/* View Toggles */}
          <div className="bg-white border border-slate-200 p-1 rounded-xl flex">
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-lg transition-all ${
                viewMode === "list"
                  ? "bg-slate-100 text-slate-800 shadow-sm"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <Menu size={20} />
            </button>
            <button
              onClick={() => setViewMode("gallery")}
              className={`p-2 rounded-lg transition-all ${
                viewMode === "gallery"
                  ? "bg-slate-100 text-slate-800 shadow-sm"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <Settings size={20} />
            </button>
          </div>

          <button
            onClick={() => handleOpenDialog()}
            className="group relative overflow-hidden bg-gradient-to-r from-rose-600 to-pink-600 text-white px-6 py-3 rounded-xl flex items-center gap-2 shadow-xl shadow-rose-500/30 hover:shadow-rose-500/50 transition-all hover:-translate-y-1"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
            <Plus size={20} className="relative z-10" />
            <span className="font-bold relative z-10">Dodaj Wydatek</span>
          </button>
        </div>
      </div>

      {/* --- 3D Stats Grid --- */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Total Spend */}
        <TiltCard>
          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-[0_20px_50px_-12px_rgba(225,29,72,0.15)] relative overflow-hidden group h-full">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-rose-400/20 to-pink-600/20 rounded-bl-full -mr-6 -mt-6 blur-2xl group-hover:scale-110 transition-transform duration-500"></div>
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-3">
                <CreditCard size={24} />
              </div>
              <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">
                Wydatki (Netto)
              </h3>
              <div className="text-3xl font-black text-slate-800">
                {formatCurrency(totals.amount)}
              </div>
            </div>
          </div>
        </TiltCard>

        {/* VAT Amount */}
        <TiltCard>
          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-[0_20px_50px_-12px_rgba(168,85,247,0.15)] relative overflow-hidden group h-full">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-400/20 to-pink-600/20 rounded-bl-full -mr-6 -mt-6 blur-2xl group-hover:scale-110 transition-transform duration-500"></div>
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3">
                <Receipt size={24} />
              </div>
              <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">
                VAT Naliczony
              </h3>
              <div className="text-3xl font-black text-purple-600">
                {formatCurrency(totals.vat)}
              </div>
            </div>
          </div>
        </TiltCard>

        {/* Deductible VAT */}
        <TiltCard>
          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-[0_20px_50px_-12px_rgba(16,185,129,0.15)] relative overflow-hidden group h-full">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-400/20 to-teal-600/20 rounded-bl-full -mr-6 -mt-6 blur-2xl group-hover:scale-110 transition-transform duration-500"></div>
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                <CheckCircle2 size={24} />
              </div>
              <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">
                VAT do Odliczenia
              </h3>
              <div className="text-3xl font-black text-emerald-600">
                {formatCurrency(totals.deductibleVat)}
              </div>
            </div>
          </div>
        </TiltCard>

        {/* Total Gross */}
        <TiltCard>
          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-[0_20px_50px_-12px_rgba(251,146,60,0.15)] relative overflow-hidden group h-full">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-orange-400/20 to-red-600/20 rounded-bl-full -mr-6 -mt-6 blur-2xl group-hover:scale-110 transition-transform duration-500"></div>
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center mb-3">
                <TrendingUp size={24} />
              </div>
              <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">
                Suma Brutto
              </h3>
              <div className="text-3xl font-black text-orange-600">
                {formatCurrency(totals.gross)}
              </div>
            </div>
          </div>
        </TiltCard>
      </div>

      {/* --- Glassmorphic Filter Bar --- */}
      <div className="bg-white/70 backdrop-blur-xl p-4 rounded-2xl border border-white/50 shadow-lg flex flex-col md:flex-row items-center gap-4">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            placeholder="Szukaj wydatków..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-slate-50/80 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none font-medium text-slate-700 placeholder:text-slate-400"
          />
        </div>

        {/* Month Picker */}
        <div className="flex items-center gap-2">
          <Calendar size={18} className="text-slate-400" />
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-4 py-3 bg-slate-50/80 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none font-medium text-slate-700"
          />
        </div>

        {/* Export Button */}
        <button
          onClick={handleExportCSV}
          className="px-4 py-3 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-600 font-bold flex items-center gap-2 transition-colors"
        >
          <Download size={18} /> CSV
        </button>
      </div>

      {/* --- Category Filters --- */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setFilterCategory("ALL")}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
            filterCategory === "ALL"
              ? "bg-slate-800 text-white shadow-lg"
              : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
          }`}
        >
          Wszystkie ({totals.count})
        </button>
        {EXPENSE_CATEGORIES.map((cat) => (
          <button
            key={cat.category}
            onClick={() => setFilterCategory(cat.category)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
              filterCategory === cat.category
                ? "bg-white ring-2 ring-offset-1 ring-rose-200 shadow-md text-rose-600"
                : "bg-white border border-slate-200 text-slate-500 hover:bg-slate-50"
            }`}
          >
            {cat.name_pl}
          </button>
        ))}
      </div>

      {/* --- Main Content Area --- */}
      {filteredExpenses.length === 0 ? (
        <div className="text-center py-20 bg-white/50 backdrop-blur-sm rounded-[2rem] border border-slate-100">
          <div className="text-6xl mb-4">💳</div>
          <h3 className="text-2xl font-bold text-slate-800 mb-2">
            Brak wydatków
          </h3>
          <p className="text-slate-500 mb-6">
            Dodaj pierwszy wydatek tego miesiąca
          </p>
          <button
            onClick={() => handleOpenDialog()}
            className="px-6 py-3 bg-gradient-to-r from-rose-600 to-pink-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all"
          >
            ➕ Dodaj wydatek
          </button>
        </div>
      ) : viewMode === "list" ? (
        <div className="space-y-4">
          {filteredExpenses.map((expense) => {
            const catStyle =
              CATEGORY_STYLES[expense.category] || CATEGORY_STYLES.other;
            const Icon = catStyle.icon;

            return (
              <div
                key={expense.id}
                className="group bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg hover:border-slate-200 hover:-translate-y-1 transition-all flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-14 h-14 rounded-xl ${catStyle.bg} ${catStyle.color} flex items-center justify-center`}
                  >
                    <Icon size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-lg">
                      {expense.supplier || expense.description}
                    </h4>
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <span
                        className={`${catStyle.bg} ${catStyle.color} px-2 py-0.5 rounded-lg border text-xs font-bold`}
                      >
                        {EXPENSE_CATEGORIES.find(
                          (c) => c.category === expense.category
                        )?.name_pl || expense.category}
                      </span>
                      <span>•</span>
                      <span>{formatDate(expense.date)}</span>
                      {expense.is_deductible && (
                        <>
                          <span>•</span>
                          <span className="text-emerald-600 font-medium flex items-center gap-1">
                            <CheckCircle2 size={12} />{" "}
                            {expense.deductible_percentage}%
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <div className="text-xl font-black text-slate-800">
                      -{formatCurrency(expense.amount + expense.vat_amount)}
                    </div>
                    <div className="text-xs font-medium text-slate-400">
                      VAT: {formatCurrency(expense.vat_amount)}
                    </div>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleOpenDialog(expense)}
                      className="p-2 bg-purple-50 hover:bg-purple-100 rounded-lg text-purple-600 transition-colors"
                    >
                      <Edit3 size={16} />
                    </button>
                    <button
                      onClick={() =>
                        handleDelete(expense.id, expense.supplier || "wydatek")
                      }
                      className="p-2 bg-red-50 hover:bg-red-100 rounded-lg text-red-600 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Gallery View */
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {filteredExpenses.map((expense) => {
            const catStyle =
              CATEGORY_STYLES[expense.category] || CATEGORY_STYLES.other;

            return (
              <div
                key={expense.id}
                className="group relative aspect-[3/4] rounded-2xl overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 border border-slate-200 shadow-sm hover:shadow-xl transition-all cursor-pointer"
                onClick={() => handleOpenDialog(expense)}
              >
                <div
                  className={`absolute inset-0 ${catStyle.bg} opacity-50`}
                ></div>
                <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                  <div
                    className={`w-16 h-16 rounded-2xl ${catStyle.bg} ${catStyle.color} flex items-center justify-center mb-3`}
                  >
                    <Receipt size={32} />
                  </div>
                  <p className="text-slate-800 font-bold text-center truncate w-full">
                    {expense.supplier || expense.description}
                  </p>
                  <p className="text-rose-600 font-mono font-bold text-lg mt-1">
                    -{formatCurrency(expense.amount + expense.vat_amount)}
                  </p>
                  <p className="text-slate-500 text-xs mt-1">
                    {formatDate(expense.date)}
                  </p>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                  <p className="text-white font-bold truncate">
                    {expense.description}
                  </p>
                  <p className="text-rose-300 font-mono font-bold">
                    -{formatCurrency(expense.amount)}
                  </p>
                </div>
              </div>
            );
          })}
          {/* Add New Card */}
          <button
            onClick={() => handleOpenDialog()}
            className="aspect-[3/4] rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-rose-500 hover:border-rose-300 hover:bg-rose-50/30 transition-all"
          >
            <Plus size={32} />
            <span className="text-xs font-bold">Dodaj Wydatek</span>
          </button>
        </div>
      )}

      {/* --- Premium Modal --- */}
      {isDialogOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsDialogOpen(false);
          }}
        >
          <div className="bg-white rounded-[2rem] max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b sticky top-0 bg-white z-10 flex items-center justify-between rounded-t-[2rem]">
              <div>
                <h2 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-600">
                  {editingExpense ? "✏️ Edytuj wydatek" : "➕ Nowy wydatek"}
                </h2>
                <p className="text-slate-500 mt-1">
                  Dodaj fakturę zakupu lub koszt biznesowy
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsDialogOpen(false)}
                className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <X size={24} className="text-slate-400" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Date & Category */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
                    Data <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-rose-500 outline-none font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
                    Kategoria <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        category: e.target.value as ExpenseCategory,
                      })
                    }
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-rose-500 outline-none font-medium"
                  >
                    {EXPENSE_CATEGORIES.map((cat) => (
                      <option key={cat.category} value={cat.category}>
                        {cat.name_pl}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Supplier */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
                  Dostawca / Vendor <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.supplier}
                  onChange={(e) =>
                    setFormData({ ...formData, supplier: e.target.value })
                  }
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-rose-500 outline-none font-bold text-slate-700"
                  placeholder="Adobe, Google, IKEA, MediaMarkt..."
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
                  Opis
                </label>
                <input
                  type="text"
                  value={formData.description || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-rose-500 outline-none text-slate-700"
                  placeholder="Dodatkowy opis wydatku"
                />
              </div>

              {/* Amount & VAT */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
                      Kwota Netto (€) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.amount}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          amount: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-rose-500 outline-none text-xl font-black text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
                      VAT (%)
                    </label>
                    <select
                      value={formData.vat_rate}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          vat_rate: parseFloat(e.target.value),
                        })
                      }
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-rose-500 outline-none font-medium"
                    >
                      <option value="0">0%</option>
                      <option value="9">9%</option>
                      <option value="21">21%</option>
                      <option value="23">23%</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
                      Brutto
                    </label>
                    <div className="flex h-[50px] items-center px-4 bg-rose-50 border border-rose-200 rounded-xl font-mono font-black text-rose-600 text-lg">
                      {formatCurrency(
                        formData.amount * (1 + formData.vat_rate / 100)
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
                  Metoda płatności
                </label>
                <select
                  value={formData.payment_method}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      payment_method: e.target.value as PaymentMethod,
                    })
                  }
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-rose-500 outline-none font-medium"
                >
                  <option value="bank_transfer">Przelew bankowy</option>
                  <option value="cash">Gotówka</option>
                  <option value="card">Karta</option>
                  <option value="paypal">PayPal</option>
                  <option value="other">Inne</option>
                </select>
              </div>

              {/* VAT Deduction Section */}
              <div className="grid grid-cols-2 gap-4">
                <div
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    formData.is_deductible
                      ? "bg-emerald-50 border-emerald-300"
                      : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                  }`}
                  onClick={() =>
                    setFormData({
                      ...formData,
                      is_deductible: !formData.is_deductible,
                    })
                  }
                >
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                      formData.is_deductible
                        ? "bg-emerald-500 border-emerald-500"
                        : "border-slate-300"
                    }`}
                  >
                    {formData.is_deductible && (
                      <CheckCircle2 size={14} className="text-white" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-700">
                      VAT Odliczalny
                    </p>
                    <p className="text-xs text-slate-500">Koszt firmowy</p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
                    % Odliczenia
                  </label>
                  <select
                    value={formData.deductible_percentage}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        deductible_percentage: parseFloat(e.target.value),
                      })
                    }
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-rose-500 outline-none font-medium"
                    disabled={!formData.is_deductible}
                  >
                    <option value="100">100% (w pełni biznesowy)</option>
                    <option value="75">75%</option>
                    <option value="50">50% (mieszany)</option>
                    <option value="25">25%</option>
                    <option value="0">0% (prywatny)</option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
                  Notatki
                </label>
                <Textarea
                  value={formData.notes || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  placeholder="Dodatkowe informacje..."
                  rows={3}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-rose-500 outline-none"
                />
              </div>

              {/* Submit Button */}
              <button
                onClick={handleSave}
                className="w-full py-4 bg-gradient-to-r from-rose-600 to-pink-600 text-white font-bold rounded-xl shadow-lg shadow-rose-200 hover:from-rose-700 hover:to-pink-700 hover:scale-[1.01] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <Save size={20} />{" "}
                {editingExpense ? "Zapisz Zmiany" : "Zapisz Wydatek"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
