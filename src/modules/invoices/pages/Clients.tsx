// =====================================================
// CLIENTS PAGE - PREMIUM 3D DESIGN
// =====================================================
// Client management: list, create, edit, delete
// Premium styling with 3D cards, glassmorphic elements
// =====================================================

import { useState, useMemo } from "react";
import {
  Plus,
  Search,
  Building2,
  User,
  MapPin,
  Phone,
  Mail,
  Save,
  Trash2,
  Edit,
  Globe,
  FileSpreadsheet,
  Briefcase,
  X,
} from "lucide-react";
import { useTranslation } from "../i18n";
import { useSupabaseClients } from "../hooks";
import { Textarea } from "../components/ui/textarea";
import { useAuth } from "../../../../contexts/AuthContext";
import { SuccessCelebration } from "../components/ui/SuccessCelebration";
import type { Client, ClientType } from "../types";

const COUNTRIES = [
  { code: "NL", name: "Holandia (NL)" },
  { code: "PL", name: "Polska (PL)" },
  { code: "DE", name: "Niemcy (DE)" },
  { code: "BE", name: "Belgia (BE)" },
  { code: "FR", name: "Francja (FR)" },
  { code: "ES", name: "Hiszpania (ES)" },
  { code: "IT", name: "Włochy (IT)" },
  { code: "GB", name: "Wielka Brytania (UK)" },
  { code: "US", name: "Stany Zjednoczone (US)" },
  { code: "Other", name: "Inne" },
];

interface ClientsProps {
  onNavigate: (page: string, clientId?: string) => void;
}

export default function Clients({ onNavigate }: ClientsProps) {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { clients, createClient, updateClient, deleteClient } =
    useSupabaseClients(user?.id || "");

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Success celebration state
  const [showSuccess, setShowSuccess] = useState(false);
  const [successData, setSuccessData] = useState<{
    title: string;
    message: string;
    icon: "🎉" | "✅" | "🏆" | "⭐" | "💰" | "📄" | "👤";
  }>({ title: "", message: "", icon: "🎉" });

  const [formData, setFormData] = useState<{
    name: string;
    type: ClientType;
    contact_person?: string;
    email?: string;
    phone?: string;
    address?: string;
    postal_code?: string;
    city?: string;
    country: string;
    kvk_number?: string;
    vat_number?: string;
    nip_number?: string;
    tax_id?: string;
    payment_term_days: number;
    notes?: string;
  }>({
    name: "",
    type: "company",
    country: "NL",
    payment_term_days: 14,
  });

  // Statistics for 3D cards
  const stats = useMemo(() => {
    const total = clients?.length || 0;
    const companies = clients?.filter((c) => c.type === "company").length || 0;
    const individuals =
      clients?.filter((c) => c.type === "individual").length || 0;
    return { total, companies, individuals };
  }, [clients]);

  const filteredClients = useMemo(() => {
    if (!searchTerm) return clients || [];
    const term = searchTerm.toLowerCase();
    return (clients || []).filter(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        (c.email && c.email.toLowerCase().includes(term)) ||
        (c.vat_number && c.vat_number.toLowerCase().includes(term)) ||
        (c.nip_number && c.nip_number.toLowerCase().includes(term)) ||
        (c.kvk_number && c.kvk_number.toLowerCase().includes(term)) ||
        (c.city && c.city.toLowerCase().includes(term))
    );
  }, [clients, searchTerm]);

  const handleOpenDialog = (client?: Client) => {
    if (client) {
      setEditingClient(client);
      setFormData({
        name: client.name,
        type: client.type,
        contact_person: client.contact_person,
        email: client.email,
        phone: client.phone,
        address: client.address,
        postal_code: client.postal_code,
        city: client.city,
        country: client.country,
        kvk_number: client.kvk_number,
        vat_number: client.vat_number,
        nip_number: client.nip_number,
        tax_id: client.tax_id,
        payment_term_days: client.payment_term_days,
        notes: client.notes,
      });
    } else {
      setEditingClient(null);
      setFormData({
        name: "",
        type: "company",
        country: "NL",
        payment_term_days: 14,
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name) {
      alert("Nazwa jest wymagana");
      return;
    }

    try {
      const clientData = {
        ...formData,
        user_id: user?.id || "",
        is_active: true,
      };

      if (editingClient) {
        await updateClient(editingClient.id, clientData);
        setSuccessData({
          title: "Zaktualizowano! 🎊",
          message: `Dane klienta "${formData.name}" zostały pomyślnie zaktualizowane`,
          icon: "✅",
        });
        setShowSuccess(true);
      } else {
        await createClient(clientData);
        setSuccessData({
          title: "Nowy Klient! 🎉",
          message: `Klient "${formData.name}" został pomyślnie dodany do bazy`,
          icon: "👤",
        });
        setShowSuccess(true);
      }
      setIsDialogOpen(false);
    } catch (error) {
      alert("Błąd zapisu klienta: " + (error as Error).message);
      console.error("Save error:", error);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Czy na pewno usunąć klienta "${name}"?`)) {
      try {
        await deleteClient(id);
        alert("Klient usunięty");
      } catch (error) {
        alert("Błąd usuwania klienta");
        console.error("Delete error:", error);
      }
    }
  };

  // Export CSV function
  const exportCSV = () => {
    const headers = [
      "ID",
      "Name",
      "Type",
      "Email",
      "Phone",
      "City",
      "KVK/NIP",
      "VAT",
    ];
    const csvContent = [
      headers.join(","),
      ...(clients || []).map((c) =>
        [
          c.id,
          c.name,
          c.type,
          c.email || "",
          c.phone || "",
          c.city || "",
          c.kvk_number || c.nip_number || "",
          c.vat_number || "",
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "klienci_export.csv";
    link.click();
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      {/* --- Header Section (Premium Gradient Text) --- */}
      <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-6">
        <div>
          <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-slate-800 to-slate-600 tracking-tight">
            👥 {t.clients.title}
          </h2>
          <p className="text-slate-500 mt-2 font-medium text-lg">
            Twoje centrum relacji biznesowych
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={exportCSV}
            className="hidden md:flex items-center gap-2 px-5 py-3 bg-white text-slate-600 rounded-2xl font-bold border border-slate-200 shadow-sm hover:shadow-md hover:text-teal-600 transition-all"
          >
            <FileSpreadsheet size={20} />
            <span>Eksport CSV</span>
          </button>
          <button
            onClick={() => handleOpenDialog()}
            className="group relative overflow-hidden bg-gradient-to-r from-teal-600 to-emerald-600 text-white px-8 py-3 rounded-2xl flex items-center gap-3 shadow-xl shadow-teal-500/30 hover:shadow-teal-500/50 transition-all hover:-translate-y-1 active:translate-y-0"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
            <Plus size={24} className="relative z-10" />
            <span className="font-bold text-lg relative z-10">
              Dodaj Klienta
            </span>
          </button>
        </div>
      </div>

      {/* --- 3D Stats Grid --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Total Clients */}
        <div className="relative bg-white p-8 rounded-[2rem] border border-slate-100 shadow-[0_20px_50px_-12px_rgba(99,102,241,0.15)] overflow-hidden group hover:-translate-y-2 transition-transform duration-500">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-400/20 to-violet-600/20 rounded-bl-full -mr-8 -mt-8 blur-2xl"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3.5 bg-indigo-50 text-indigo-600 rounded-2xl">
                <Briefcase size={28} />
              </div>
              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
                Total
              </span>
            </div>
            <h3 className="text-4xl font-black text-slate-800">
              {stats.total}
            </h3>
            <p className="text-slate-500 font-medium mt-1">
              Wszystkich klientów
            </p>
          </div>
        </div>

        {/* Companies */}
        <div className="relative bg-white p-8 rounded-[2rem] border border-slate-100 shadow-[0_20px_50px_-12px_rgba(14,165,233,0.15)] overflow-hidden group hover:-translate-y-2 transition-transform duration-500">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-sky-400/20 to-cyan-600/20 rounded-bl-full -mr-8 -mt-8 blur-2xl"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3.5 bg-sky-50 text-sky-600 rounded-2xl">
                <Building2 size={28} />
              </div>
              <span className="text-xs font-bold text-sky-600 bg-sky-50 px-3 py-1 rounded-full border border-sky-100">
                B2B
              </span>
            </div>
            <h3 className="text-4xl font-black text-slate-800">
              {stats.companies}
            </h3>
            <p className="text-slate-500 font-medium mt-1">Firmy i Spółki</p>
          </div>
        </div>

        {/* Individuals */}
        <div className="relative bg-white p-8 rounded-[2rem] border border-slate-100 shadow-[0_20px_50px_-12px_rgba(168,85,247,0.15)] overflow-hidden group hover:-translate-y-2 transition-transform duration-500">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-400/20 to-fuchsia-600/20 rounded-bl-full -mr-8 -mt-8 blur-2xl"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3.5 bg-purple-50 text-purple-600 rounded-2xl">
                <User size={28} />
              </div>
              <span className="text-xs font-bold text-purple-600 bg-purple-50 px-3 py-1 rounded-full border border-purple-100">
                B2C
              </span>
            </div>
            <h3 className="text-4xl font-black text-slate-800">
              {stats.individuals}
            </h3>
            <p className="text-slate-500 font-medium mt-1">
              Klienci Indywidualni
            </p>
          </div>
        </div>
      </div>

      {/* --- Glassmorphic Search Bar --- */}
      <div className="sticky top-20 z-20 bg-white/70 backdrop-blur-xl p-3 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/50 mt-8">
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400 group-focus-within:text-teal-500 transition-colors" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Wyszukaj klienta (nazwa, NIP, email, miasto)..."
            className="block w-full pl-12 pr-4 py-4 border-0 bg-transparent rounded-2xl text-slate-700 placeholder-slate-400 focus:ring-0 transition-all"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded-lg border border-slate-200 hidden md:block">
            CMD + K
          </div>
        </div>
      </div>

      {/* --- Client Cards Grid (Premium 3D) --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredClients.length === 0 ? (
          <div className="col-span-full py-20 text-center">
            <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
              <Search size={48} />
            </div>
            <h3 className="text-2xl font-bold text-slate-800">Brak wyników</h3>
            <p className="text-slate-500 mb-6">
              Nie znaleziono klientów spełniających kryteria.
            </p>
            <button
              onClick={() => handleOpenDialog()}
              className="inline-flex items-center gap-2 px-6 py-3 bg-teal-600 text-white rounded-2xl font-bold hover:bg-teal-700 transition-colors"
            >
              <Plus size={20} />
              Dodaj pierwszego klienta
            </button>
          </div>
        ) : (
          filteredClients.map((client) => (
            <div
              key={client.id}
              className="group relative bg-white p-8 rounded-[2rem] shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05)] border border-slate-100 hover:shadow-[0_25px_50px_-12px_rgba(14,165,233,0.2)] hover:border-teal-200 hover:-translate-y-2 transition-all duration-500 overflow-hidden"
            >
              {/* Decorative Header Gradient */}
              <div
                className={`absolute top-0 left-0 right-0 h-2 bg-gradient-to-r ${
                  client.type === "company"
                    ? "from-sky-400 to-blue-600"
                    : "from-purple-400 to-pink-600"
                }`}
              />

              {/* Quick Actions Overlay (Visible on Hover) */}
              <div className="absolute top-6 right-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                <button
                  onClick={() => handleOpenDialog(client)}
                  className="p-2.5 bg-white text-slate-500 hover:text-teal-600 hover:bg-teal-50 rounded-xl border border-slate-200 shadow-sm hover:shadow transition-colors"
                  title="Edytuj"
                >
                  <Edit size={18} />
                </button>
                <button
                  onClick={() => handleDelete(client.id, client.name)}
                  className="p-2.5 bg-white text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl border border-slate-200 shadow-sm hover:shadow transition-colors"
                  title="Usuń"
                >
                  <Trash2 size={18} />
                </button>
              </div>

              {/* Content */}
              <div className="mt-2">
                <div className="flex justify-between items-start mb-6">
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg ${
                      client.type === "company"
                        ? "bg-gradient-to-br from-sky-400 to-blue-600 shadow-blue-200"
                        : "bg-gradient-to-br from-purple-400 to-pink-600 shadow-purple-200"
                    }`}
                  >
                    {client.type === "company" ? (
                      <Building2 size={28} />
                    ) : (
                      <User size={28} />
                    )}
                  </div>
                  <span className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 bg-slate-50 rounded-full text-slate-600 border border-slate-100">
                    <Globe size={12} /> {client.country}
                  </span>
                </div>

                <h3 className="text-xl font-black text-slate-800 mb-1 group-hover:text-teal-600 transition-colors">
                  {client.name}
                </h3>
                <div className="flex items-center gap-2 text-sm text-slate-500 mb-6 font-mono bg-slate-50 w-fit px-2 py-0.5 rounded border border-slate-100">
                  <span className="font-bold text-slate-400">
                    {client.country === "PL" ? "NIP" : "KVK"}:
                  </span>
                  {client.country === "PL"
                    ? client.nip_number || "-"
                    : client.kvk_number || "-"}
                </div>

                <div className="space-y-3 pt-4 border-t border-slate-50">
                  <div className="flex items-center gap-3 text-slate-600 group-hover:text-slate-800 transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                      <Mail size={16} />
                    </div>
                    <span className="text-sm font-medium truncate">
                      {client.email || "-"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-600 group-hover:text-slate-800 transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                      <Phone size={16} />
                    </div>
                    <span className="text-sm font-medium">
                      {client.phone || "-"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-600 group-hover:text-slate-800 transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                      <MapPin size={16} />
                    </div>
                    <span className="text-sm font-medium truncate">
                      {client.address || client.city
                        ? `${client.address || ""}${
                            client.address && client.city ? ", " : ""
                          }${client.city || ""}`
                        : "-"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Dialog (Modal) - Premium Styled */}
      {isDialogOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2rem] max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b sticky top-0 bg-white z-10 rounded-t-[2rem]">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-600">
                    {editingClient ? "✏️ Edytuj klienta" : "➕ Nowy klient"}
                  </h2>
                  <p className="text-slate-500 mt-1">
                    {editingClient
                      ? "Zmień dane klienta"
                      : "Dodaj nowego klienta do bazy"}
                  </p>
                </div>
                <button
                  onClick={() => setIsDialogOpen(false)}
                  className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  <X size={24} className="text-slate-400" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Type & Country Toggle */}
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-slate-50 p-1.5 rounded-xl flex">
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, type: "company" })
                    }
                    className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
                      formData.type === "company"
                        ? "bg-white shadow-sm text-teal-600"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    <Building2 size={16} /> Firma
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, type: "individual" })
                    }
                    className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
                      formData.type === "individual"
                        ? "bg-white shadow-sm text-teal-600"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    <User size={16} /> Osoba
                  </button>
                </div>
                <div>
                  <div className="relative">
                    <Globe
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                      size={18}
                    />
                    <select
                      value={formData.country}
                      onChange={(e) =>
                        setFormData({ ...formData, country: e.target.value })
                      }
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 outline-none bg-white appearance-none font-medium text-slate-700"
                    >
                      {COUNTRIES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Main Info */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">
                    Nazwa / Imię i Nazwisko{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                    placeholder="np. Jansen Bouw B.V."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {formData.country === "PL" ? (
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1.5">
                        NIP
                      </label>
                      <input
                        type="text"
                        value={formData.nip_number || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            nip_number: e.target.value,
                          })
                        }
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:ring-2 focus:ring-teal-500 outline-none font-mono text-sm"
                        placeholder="PL..."
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1.5">
                        KVK (Holandia)
                      </label>
                      <input
                        type="text"
                        value={formData.kvk_number || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            kvk_number: e.target.value,
                          })
                        }
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:ring-2 focus:ring-teal-500 outline-none font-mono text-sm"
                        placeholder="12345678"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">
                      VAT ID (BTW)
                    </label>
                    <input
                      type="text"
                      value={formData.vat_number || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, vat_number: e.target.value })
                      }
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:ring-2 focus:ring-teal-500 outline-none font-mono text-sm"
                      placeholder="NL..."
                    />
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 space-y-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Dane Kontaktowe
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                        size={16}
                      />
                      <input
                        type="email"
                        value={formData.email || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 outline-none text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">
                      Telefon
                    </label>
                    <div className="relative">
                      <Phone
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                        size={16}
                      />
                      <input
                        type="text"
                        value={formData.phone || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, phone: e.target.value })
                        }
                        className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 outline-none text-sm"
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">
                    Osoba kontaktowa
                  </label>
                  <input
                    type="text"
                    placeholder="Jan Kowalski"
                    value={formData.contact_person || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        contact_person: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 focus:ring-2 focus:ring-teal-500 outline-none text-sm"
                  />
                </div>
              </div>

              {/* Address */}
              <div className="space-y-4">
                <div className="grid grid-cols-12 gap-4">
                  <div className="col-span-8">
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">
                      Ulica i numer
                    </label>
                    <input
                      type="text"
                      value={formData.address || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, address: e.target.value })
                      }
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:ring-2 focus:ring-teal-500 outline-none"
                    />
                  </div>
                  <div className="col-span-4">
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">
                      Kod
                    </label>
                    <input
                      type="text"
                      value={formData.postal_code || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          postal_code: e.target.value,
                        })
                      }
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:ring-2 focus:ring-teal-500 outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">
                    Miasto
                  </label>
                  <input
                    type="text"
                    value={formData.city || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, city: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                </div>
              </div>

              {/* Payment Terms & Notes */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">
                    Termin płatności (dni)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.payment_term_days}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        payment_term_days: parseInt(e.target.value) || 14,
                      })
                    }
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                  {t.clients.notes}
                </label>
                <Textarea
                  placeholder="Dodatkowe informacje o kliencie..."
                  value={formData.notes || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:ring-2 focus:ring-teal-500 outline-none resize-none"
                />
              </div>

              <button
                onClick={handleSave}
                className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 text-white py-4 rounded-xl font-bold hover:from-teal-700 hover:to-emerald-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-teal-200 hover:shadow-xl hover:scale-[1.01] active:scale-[0.98] duration-200"
              >
                <Save size={20} />
                {editingClient ? "Zapisz Zmiany" : "Dodaj Klienta"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Celebration Modal */}
      <SuccessCelebration
        isOpen={showSuccess}
        onClose={() => setShowSuccess(false)}
        title={successData.title}
        message={successData.message}
        icon={successData.icon}
      />
    </div>
  );
}
