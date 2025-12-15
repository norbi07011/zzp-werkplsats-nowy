/**
 * ================================================================
 * EXPENSE FORM - Formularz zgłaszania wydatków (Declaraties)
 * ================================================================
 */

import React, { useState, useEffect, useRef } from "react";










import { supabase } from "../../../../lib/supabase";
import { useAuth } from "../../../../../contexts/AuthContext";
import { toast } from "sonner";

interface Project {
  id: string;
  title: string;
}

interface ExpenseFormProps {
  teamId: string;
  preselectedProjectId?: string;
  onSave?: () => void;
  onCancel?: () => void;
}

const EXPENSE_CATEGORIES = [
  { value: "travel", label: "Podróż (reis)", icon: "🚗" },
  { value: "meals", label: "Posiłki (maaltijden)", icon: "🍽️" },
  { value: "materials", label: "Materiały (materialen)", icon: "🔧" },
  { value: "tools", label: "Narzędzia (gereedschap)", icon: "🛠️" },
  { value: "parking", label: "Parking", icon: "🅿️" },
  { value: "accommodation", label: "Nocleg (verblijf)", icon: "🏨" },
  { value: "equipment", label: "Sprzęt (apparatuur)", icon: "💻" },
  { value: "office", label: "Biuro (kantoor)", icon: "📎" },
  { value: "other", label: "Inne (overig)", icon: "📦" },
];

export const ExpenseForm: React.FC<ExpenseFormProps> = ({
  teamId,
  preselectedProjectId,
  onSave,
  onCancel,
}) => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);

  // Form state
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [category, setCategory] = useState("travel");
  const [amount, setAmount] = useState<number | "">("");
  const [vatAmount, setVatAmount] = useState<number | "">("");
  const [description, setDescription] = useState("");
  const [projectId, setProjectId] = useState(preselectedProjectId || "");
  const [merchant, setMerchant] = useState("");

  useEffect(() => {
    fetchProjects();
  }, [teamId]);

  const fetchProjects = async () => {
    setIsLoading(true);
    const { data } = await supabase
      .from("team_projects")
      .select("id, title")
      .eq("team_id", teamId)
      .order("title");

    if (data) {
      setProjects(data);
    }
    setIsLoading(false);
  };

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
      toast.error("Dozwolone tylko zdjęcia i PDF");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Maksymalny rozmiar pliku to 10MB");
      return;
    }

    setReceiptFile(file);

    // Preview for images
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => setReceiptPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setReceiptPreview(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const removeReceipt = () => {
    setReceiptFile(null);
    setReceiptPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  const uploadReceipt = async (): Promise<string | null> => {
    if (!receiptFile || !user?.id) return null;

    const fileExt = receiptFile.name.split(".").pop();
    const fileName = `${user.id}/${Date.now()}_${Math.random()
      .toString(36)
      .substring(7)}.${fileExt}`;

    const { error } = await supabase.storage
      .from("expense-receipts")
      .upload(fileName, receiptFile);

    if (error) {
      console.error("Upload error:", error);
      toast.error("Błąd uploadu paragonu");
      return null;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("expense-receipts").getPublicUrl(fileName);

    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!amount || Number(amount) <= 0) {
      toast.error("Podaj poprawną kwotę");
      return;
    }

    if (!description.trim()) {
      toast.error("Podaj opis wydatku");
      return;
    }

    setIsSaving(true);

    try {
      // Upload receipt if provided
      let receiptUrl = null;
      if (receiptFile) {
        receiptUrl = await uploadReceipt();
      }

      const { error } = await supabase.from("team_expense_claims").insert({
        team_id: teamId,
        user_id: user?.id,
        project_id: projectId || null,
        date: date,
        category: category,
        amount: Number(amount),
        vat_amount: vatAmount ? Number(vatAmount) : null,
        currency: "EUR",
        description: description.trim(),
        merchant: merchant.trim() || null,
        receipt_url: receiptUrl,
        status: "pending",
      });

      if (error) throw error;

      toast.success("✅ Wydatek zgłoszony!");
      onSave?.();
    } catch (error: any) {
      console.error("Error saving expense:", error);
      toast.error("Błąd podczas zapisywania");
    } finally {
      setIsSaving(false);
    }
  };

  const calculateVat = () => {
    if (amount) {
      // Dutch VAT 21%
      const vat = Math.round((Number(amount) / 1.21) * 0.21 * 100) / 100;
      setVatAmount(vat);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
          <Receipt className="w-6 h-6 text-purple-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Zgłoś wydatek</h2>
          <p className="text-sm text-gray-500">Declaratie indienen</p>
        </div>
      </div>

      <div className="space-y-5">
        {/* Date & Category */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Calendar className="w-4 h-4 inline mr-1" />
              Data wydatku
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Kategoria
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {EXPENSE_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.icon} {cat.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Amount & VAT */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Euro className="w-4 h-4 inline mr-1" />
              Kwota brutto (€)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) =>
                setAmount(e.target.value ? Number(e.target.value) : "")
              }
              onBlur={calculateVat}
              min="0.01"
              step="0.01"
              placeholder="0.00"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              BTW/VAT (€)
            </label>
            <input
              type="number"
              value={vatAmount}
              onChange={(e) =>
                setVatAmount(e.target.value ? Number(e.target.value) : "")
              }
              min="0"
              step="0.01"
              placeholder="Automatycznie 21%"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>

        {/* Project & Merchant */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Projekt (opcjonalnie)
            </label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">-- Bez projektu --</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sprzedawca/Sklep
            </label>
            <input
              type="text"
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
              placeholder="np. Albert Heijn, Shell"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <FileText className="w-4 h-4 inline mr-1" />
            Opis wydatku
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Opisz co kupiłeś/aś i dlaczego..."
            rows={2}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
            required
          />
        </div>

        {/* Receipt Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Paragon / Faktura
          </label>

          {receiptFile ? (
            <div className="relative border-2 border-purple-200 rounded-lg p-4 bg-purple-50">
              <button
                type="button"
                onClick={removeReceipt}
                className="absolute top-2 right-2 w-8 h-8 bg-white rounded-full shadow flex items-center justify-center hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </button>
              {receiptPreview ? (
                <img
                  src={receiptPreview}
                  alt="Receipt preview"
                  className="max-h-48 mx-auto rounded"
                />
              ) : (
                <div className="flex items-center gap-3 text-purple-700">
                  <FileText className="w-8 h-8" />
                  <div>
                    <p className="font-medium">{receiptFile.name}</p>
                    <p className="text-sm">
                      {(receiptFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*,application/pdf"
                className="hidden"
              />
              <input
                type="file"
                ref={cameraInputRef}
                onChange={handleFileChange}
                accept="image/*"
                capture="environment"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="flex items-center justify-center gap-2 py-3 px-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-purple-400 hover:text-purple-600 transition-colors"
              >
                <Camera className="w-5 h-5" />
                Zrób zdjęcie
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center gap-2 py-3 px-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-purple-400 hover:text-purple-600 transition-colors"
              >
                <Upload className="w-5 h-5" />
                Wybierz plik
              </button>
            </div>
          )}
          <p className="text-xs text-gray-500 mt-1">
            Maksymalnie 10MB. Dozwolone: JPG, PNG, PDF
          </p>
        </div>

        {/* Summary */}
        {amount && (
          <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-purple-700">Kwota do zwrotu</p>
                <p className="text-2xl font-bold text-purple-800">
                  €{Number(amount).toFixed(2)}
                </p>
              </div>
              {vatAmount && (
                <div className="text-right">
                  <p className="text-sm text-purple-700">w tym BTW</p>
                  <p className="text-lg font-medium text-purple-800">
                    €{Number(vatAmount).toFixed(2)}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Anuluj
            </button>
          )}
          <button
            type="submit"
            disabled={isSaving}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all ${
              isSaving
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-purple-600 text-white hover:bg-purple-700 active:scale-95"
            }`}
          >
            {isSaving ? (
              <Loader className="w-5 h-5 animate-spin" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            Zgłoś wydatek
          </button>
        </div>
      </div>
    </form>
  );
};

export default ExpenseForm;
