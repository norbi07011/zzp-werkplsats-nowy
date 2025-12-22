// =====================================================
// PRODUCTS PAGE - PREMIUM 3D DESIGN
// =====================================================
// Product/service catalog management with images
// Premium styling with 3D cards, glassmorphic elements
// =====================================================

import { useState, useMemo, useRef, useCallback } from "react";
import { useTranslation } from "../i18n";
import { useSupabaseProducts } from "../hooks";
import { formatCurrency } from "../lib";
import { useAuth } from "../../../../contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import {
  Package,
  Trash2,
  Edit3,
  Plus,
  Search,
  X,
  Upload,
  Save,
  Settings,
  Menu,
  Briefcase,
  Wrench,
  Clock,
  Zap,
  CheckCircle2,
  Star,
  Image as ImageIcon,
} from "lucide-react";
import type { Product } from "../types";

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
    const x = (e.clientX - left - width / 2) / 25;
    const y = (e.clientY - top - height / 2) / 25;
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

const CATEGORIES = [
  {
    id: "SERVICES",
    label: "Usługi",
    icon: Wrench,
    color: "bg-blue-100 text-blue-600",
  },
  {
    id: "MATERIALS",
    label: "Materiały",
    icon: Clock,
    color: "bg-amber-100 text-amber-600",
  },
  {
    id: "EQUIPMENT",
    label: "Sprzęt",
    icon: Zap,
    color: "bg-purple-100 text-purple-600",
  },
  {
    id: "GOODS",
    label: "Towary",
    icon: Briefcase,
    color: "bg-emerald-100 text-emerald-600",
  },
];

interface ProductsProps {
  onNavigate: (page: string, productId?: string) => void;
}

export default function Products({ onNavigate }: ProductsProps) {
  const { user } = useAuth();
  const { t } = useTranslation();
  const {
    products,
    loading,
    createProduct,
    updateProduct,
    deleteProduct,
    refetch,
  } = useSupabaseProducts(user?.id || "");

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [uploadStatus, setUploadStatus] = useState<string>("");
  const [filterCategory, setFilterCategory] = useState<string>("ALL");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    code: "",
    name: "",
    description: "",
    unit_price: 0,
    vat_rate: 21,
    unit: "stuk",
    image_url: "",
  });

  // Statistics for 3D cards
  const stats = useMemo(() => {
    const total = products?.length || 0;
    const totalValue = products?.reduce((acc, p) => acc + p.unit_price, 0) || 0;
    const services =
      products?.filter((p) => p.unit === "uur" || p.unit === "dag").length || 0;
    const goods = total - services;
    return { total, totalValue, services, goods };
  }, [products]);

  const filteredProducts = useMemo(() => {
    let result = products || [];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          (p.code && p.code.toLowerCase().includes(term)) ||
          (p.description && p.description.toLowerCase().includes(term))
      );
    }

    return result;
  }, [products, searchTerm]);

  // Handle image upload to Supabase storage
  const handleImageUpload = useCallback(
    async (file: File) => {
      if (!user?.id || !file) return;

      setIsUploading(true);
      setUploadStatus("Przesyłanie...");

      try {
        const fileExt = file.name.split(".").pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("product-images")
          .upload(fileName, file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) {
          console.error("Upload error:", uploadError);
          setUploadStatus("Błąd: " + uploadError.message);
          setIsUploading(false);
          return;
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from("product-images").getPublicUrl(fileName);

        // Use functional update to avoid stale closure issues
        setFormData((prevData) => ({
          ...prevData,
          image_url: publicUrl,
        }));
        setUploadStatus("✅ Zdjęcie przesłane!");

        // Clear status after 3 seconds
        setTimeout(() => setUploadStatus(""), 3000);
      } catch (error) {
        console.error("Upload error:", error);
        setUploadStatus("Błąd przesyłania");
      } finally {
        setIsUploading(false);
      }
    },
    [user?.id]
  );

  const handleOpenDialog = useCallback((product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        code: product.code || "",
        name: product.name,
        description: product.description || "",
        unit_price: product.unit_price,
        vat_rate: product.vat_rate,
        unit: product.unit,
        image_url: product.image_url || "",
      });
    } else {
      setEditingProduct(null);
      setFormData({
        code: "",
        name: "",
        description: "",
        unit_price: 0,
        vat_rate: 21,
        unit: "stuk",
        image_url: "",
      });
    }
    setUploadStatus("");
    setIsDialogOpen(true);
  }, []);

  const handleCloseDialog = useCallback(() => {
    setIsDialogOpen(false);
    setEditingProduct(null);
    setUploadStatus("");
  }, []);

  const handleSave = useCallback(async () => {
    if (!formData.name) {
      setUploadStatus("Nazwa jest wymagana!");
      return;
    }

    try {
      const productData = {
        ...formData,
        user_id: user?.id || "",
        is_active: true,
      };

      if (editingProduct) {
        await updateProduct(editingProduct.id, productData);
        console.log("✅ Produkt zaktualizowany");
      } else {
        await createProduct(productData);
        console.log("✅ Produkt utworzony");
      }

      handleCloseDialog();
      await refetch();
    } catch (error) {
      console.error("❌ Błąd zapisu produktu:", error);
      setUploadStatus("Błąd zapisu produktu");
    }
  }, [
    formData,
    editingProduct,
    user?.id,
    updateProduct,
    createProduct,
    handleCloseDialog,
    refetch,
  ]);

  const handleDelete = useCallback(
    async (id: string, name: string) => {
      const confirmed = window.confirm(
        `Czy na pewno usunąć produkt "${name}"?`
      );
      if (confirmed) {
        try {
          await deleteProduct(id);
          console.log("✅ Produkt usunięty:", name);
        } catch (error) {
          console.error("❌ Błąd usuwania produktu:", error);
        }
      }
    },
    [deleteProduct]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleImageUpload(file);
      }
      // Reset input so same file can be selected again
      e.target.value = "";
    },
    [handleImageUpload]
  );

  const handleImageUrlChange = useCallback((url: string) => {
    setFormData((prev) => ({ ...prev, image_url: url }));
  }, []);

  const clearImageUrl = useCallback(() => {
    setFormData((prev) => ({ ...prev, image_url: "" }));
  }, []);

  // Loading state with premium loader
  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500 font-medium">Ładowanie produktów...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      {/* --- Header Section --- */}
      <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs font-bold uppercase tracking-wider flex items-center gap-1">
              <Briefcase size={14} /> Inventory Manager
            </span>
          </div>
          <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-slate-800 to-slate-600 tracking-tight">
            📦 {t.products.title}
          </h2>
          <p className="text-slate-500 mt-2 font-medium text-lg">
            Zarządzaj swoją ofertą usług i towarów
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
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-lg transition-all ${
                viewMode === "grid"
                  ? "bg-slate-100 text-slate-800 shadow-sm"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <Settings size={20} />
            </button>
          </div>

          <button
            onClick={() => handleOpenDialog()}
            className="group relative overflow-hidden bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-6 py-3 rounded-xl flex items-center gap-2 shadow-xl shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all hover:-translate-y-1"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
            <Plus size={20} className="relative z-10" />
            <span className="font-bold relative z-10">Dodaj Produkt</span>
          </button>
        </div>
      </div>

      {/* --- 3D Stats Cards --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <TiltCard>
          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-lg relative overflow-hidden group h-full">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
              <Package size={80} />
            </div>
            <div className="relative z-10">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                Wszystkie Pozycje
              </h3>
              <p className="text-4xl font-black text-slate-800">
                {stats.total}
              </p>
              <div className="flex gap-3 mt-3">
                <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-100">
                  {stats.goods} Towary
                </span>
                <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-100">
                  {stats.services} Usługi
                </span>
              </div>
            </div>
          </div>
        </TiltCard>

        <TiltCard>
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-[2rem] border border-slate-700 shadow-lg relative overflow-hidden text-white h-full">
            <div className="relative z-10">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                Katalog Online
              </h3>
              <p className="text-lg font-medium leading-tight mt-2 opacity-90">
                Twoje produkty są gotowe do użycia na fakturach i ofertach
                handlowych.
              </p>
              <div className="mt-4 flex items-center gap-2 text-emerald-400 text-sm font-bold">
                <CheckCircle2 size={16} /> Synchronizacja aktywna
              </div>
            </div>
          </div>
        </TiltCard>

        {/* Filter Bar (Integrated into grid) */}
        <div className="bg-white/60 backdrop-blur-xl border border-white/60 rounded-[2rem] p-6 flex flex-col justify-center gap-4 shadow-sm">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Szukaj po nazwie, SKU..."
              className="w-full pl-10 pr-4 py-3 bg-white rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setFilterCategory("ALL")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
                filterCategory === "ALL"
                  ? "bg-slate-800 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Wszystkie
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setFilterCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
                  filterCategory === cat.id
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* --- Content Grid --- */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="group bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 overflow-hidden flex flex-col h-full"
            >
              {/* Image Cover */}
              <div className="h-40 bg-slate-100 relative overflow-hidden">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-50 text-slate-300">
                    <ImageIcon size={40} />
                  </div>
                )}
                {/* Overlay Badges */}
                <div className="absolute top-3 left-3">
                  <span className="px-2 py-1 rounded-lg text-[10px] font-bold uppercase shadow-sm bg-emerald-100 text-emerald-700">
                    {product.unit}
                  </span>
                </div>
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleOpenDialog(product)}
                    className="p-2 bg-white rounded-full text-slate-400 hover:text-emerald-600 shadow-lg"
                  >
                    <Edit3 size={14} />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-[10px] font-mono text-slate-400 mb-1">
                      {product.code || "NO-SKU"}
                    </p>
                    <h3 className="font-bold text-slate-800 text-lg leading-tight">
                      {product.name}
                    </h3>
                  </div>
                </div>
                <p className="text-sm text-slate-500 mb-4 line-clamp-2 flex-1">
                  {product.description || "Brak opisu produktu."}
                </p>

                <div className="flex items-end justify-between pt-4 border-t border-slate-50">
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase font-bold">
                      Cena Netto
                    </p>
                    <p className="text-xl font-black text-emerald-600">
                      {formatCurrency(product.unit_price)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded">
                      {product.vat_rate}% VAT
                    </span>
                    <button
                      onClick={() => handleDelete(product.id, product.name)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Add New Card */}
          <button
            onClick={() => handleOpenDialog()}
            className="min-h-[300px] rounded-3xl border-2 border-dashed border-slate-200 hover:border-emerald-400 bg-slate-50/50 hover:bg-emerald-50/30 transition-all flex flex-col items-center justify-center gap-3 text-slate-400 hover:text-emerald-600"
          >
            <div className="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
              <Plus size={32} />
            </div>
            <span className="font-bold">Dodaj Nową Ofertę</span>
          </button>
        </div>
      ) : (
        /* --- List View --- */
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="p-4 pl-6">Produkt / Usługa</th>
                <th className="p-4">Kod</th>
                <th className="p-4">Jednostka</th>
                <th className="p-4 text-right">Cena Netto</th>
                <th className="p-4 text-right">VAT</th>
                <th className="p-4 pr-6 text-right">Akcje</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredProducts.map((product) => (
                <tr
                  key={product.id}
                  className="hover:bg-slate-50/80 transition-colors group"
                >
                  <td className="p-4 pl-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0 border border-slate-200">
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-300">
                            <Clock size={16} />
                          </div>
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800">
                          {product.name}
                        </h4>
                        <p className="text-xs text-slate-400 truncate max-w-[200px]">
                          {product.description}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-sm font-mono text-slate-500">
                    {product.code || "-"}
                  </td>
                  <td className="p-4">
                    <span className="px-2 py-1 rounded text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                      {product.unit}
                    </span>
                  </td>
                  <td className="p-4 text-right font-bold text-emerald-600">
                    {formatCurrency(product.unit_price)}
                  </td>
                  <td className="p-4 text-right text-sm text-slate-500">
                    {product.vat_rate}%
                  </td>
                  <td className="p-4 pr-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleOpenDialog(product)}
                        className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(product.id, product.name)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* --- Premium Modal --- */}
      {isDialogOpen ? (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleCloseDialog();
          }}
        >
          <div className="bg-white rounded-[2rem] max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b sticky top-0 bg-white z-10 flex items-center justify-between rounded-t-[2rem]">
              <div>
                <h2 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-600">
                  {editingProduct ? "✏️ Edytuj produkt" : "➕ Nowy produkt"}
                </h2>
                <p className="text-slate-500 mt-1">
                  {editingProduct
                    ? "Zmień dane produktu"
                    : "Dodaj nowy produkt lub usługę ze zdjęciem"}
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseDialog}
                className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <X size={24} className="text-slate-400" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Image Upload Section */}
              <div className="flex gap-6">
                {/* Image Preview */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-1/3 aspect-square rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 hover:border-emerald-500 hover:bg-emerald-50/30 transition-all cursor-pointer flex flex-col items-center justify-center relative overflow-hidden group"
                >
                  {formData.image_url ? (
                    <>
                      <img
                        src={formData.image_url}
                        alt="Podgląd produktu"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-white text-xs font-bold">
                          Zmień zdjęcie
                        </span>
                      </div>
                    </>
                  ) : (
                    <>
                      <Upload
                        size={24}
                        className="text-slate-400 mb-2 group-hover:text-emerald-600"
                      />
                      <span className="text-xs font-bold text-slate-500 text-center px-2">
                        Kliknij aby dodać zdjęcie
                      </span>
                    </>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>

                {/* Basic Info */}
                <div className="w-2/3 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
                      Nazwa produktu <span className="text-red-500">*</span>
                    </label>
                    <input
                      required
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, name: e.target.value }))
                      }
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-slate-800"
                      placeholder="np. Montaż instalacji"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
                        Kod produktu (SKU)
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={formData.code}
                          onChange={(e) =>
                            setFormData((p) => ({ ...p, code: e.target.value }))
                          }
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-mono"
                          placeholder="AUTO-GEN"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const prefix = "PRD";
                            const random = Math.floor(Math.random() * 10000)
                              .toString()
                              .padStart(4, "0");
                            setFormData((p) => ({
                              ...p,
                              code: `${prefix}-${random}`,
                            }));
                          }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-emerald-600"
                          title="Generuj SKU"
                        >
                          <Star size={16} />
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
                        Jednostka
                      </label>
                      <select
                        value={formData.unit}
                        onChange={(e) =>
                          setFormData((p) => ({ ...p, unit: e.target.value }))
                        }
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-medium"
                      >
                        <option value="stuk">stuk (sztuka)</option>
                        <option value="uur">uur (godzina)</option>
                        <option value="dag">dag (dzień)</option>
                        <option value="maand">maand (miesiąc)</option>
                        <option value="project">project (projekt)</option>
                        <option value="kg">kg (kilogram)</option>
                        <option value="m">m (metr)</option>
                        <option value="m2">m² (metr kwadratowy)</option>
                      </select>
                    </div>
                  </div>

                  {uploadStatus && (
                    <p
                      className={`text-sm ${
                        uploadStatus.includes("Błąd")
                          ? "text-red-600"
                          : "text-green-600"
                      }`}
                    >
                      {uploadStatus}
                    </p>
                  )}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
                  Opis (do faktury)
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, description: e.target.value }))
                  }
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                  placeholder="Opis produktu lub usługi..."
                />
              </div>

              {/* Pricing Section */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
                    Cena Netto (€)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.unit_price}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        unit_price: Number(e.target.value),
                      }))
                    }
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
                    VAT (%)
                  </label>
                  <select
                    value={formData.vat_rate}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        vat_rate: Number(e.target.value),
                      }))
                    }
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-medium"
                  >
                    <option value="0">0% (Export/Exempt)</option>
                    <option value="9">9% (Reduced rate NL)</option>
                    <option value="21">21% (Standard rate NL)</option>
                    <option value="23">23% (Poland)</option>
                  </select>
                </div>
              </div>

              {/* Price Preview */}
              <div className="flex justify-between items-center px-4 py-3 bg-emerald-50 rounded-xl border border-emerald-200">
                <span className="text-sm text-emerald-800 font-medium">
                  Cena Brutto (dla klienta indywidualnego):
                </span>
                <span className="text-xl font-black text-emerald-600">
                  {formatCurrency(
                    formData.unit_price * (1 + formData.vat_rate / 100)
                  )}
                </span>
              </div>

              {/* Submit Button */}
              <button
                onClick={handleSave}
                className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-200 hover:from-emerald-700 hover:to-teal-700 hover:scale-[1.01] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <Save size={20} />{" "}
                {editingProduct ? "Zapisz Zmiany" : "Zapisz w Katalogu"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
