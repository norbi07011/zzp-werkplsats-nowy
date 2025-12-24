/**
 * Certificate Master 13.0
 * Advanced certificate generator integrated with ZZP Werkplaats
 */

import React, { useState, useEffect } from "react";
import { Certificate, CertificateDesign, Language } from "./types";
import { CertificateForm } from "./components/CertificateForm";
import { CertificatePreview } from "./components/CertificatePreview";
import {
  saveDesign,
  getDesign,
  getAllCertificatesFromDb,
  deleteCertificateFromDb,
  generateCertificateNumber,
} from "./services/certificateStorage";
import { toast } from "sonner";
import {
  FileText,
  CreditCard,
  Palette,
  Plus,
  Settings2,
  Globe,
  ArrowRight,
  Sparkles,
  RotateCcw,
  Clock,
  Trash2,
  Award,
  ChevronDown,
  Check,
  X,
  Eye,
} from "lucide-react";
const History = Clock;

// Default design configuration - cast as CertificateDesign
const defaultDesign: CertificateDesign = {
  themeMode: "modern",
  primaryColor: "#0d5c91",
  accentColor: "#1a73e8",
  fontFamily: "modern",
  isBilingual: false,
  orientation: "portrait",
  // Typography scales
  scaleTitle: 1.0,
  fontWeightTitle: "900",
  letterSpacingTitle: 0,
  scaleName: 1.0,
  fontWeightName: "800",
  letterSpacingName: 0,
  scaleDetails: 1.0,
  fontWeightDetails: "400",
  lineHeightDetails: 1.75,
  descriptionAlign: "center",
  // Seals & Ribbons
  sealStyle: "none",
  showRibbon: false,
  ribbonColor: "#dc2626",
  ribbonPosition: "top-right",
  // Stamp
  stampDataUrl: null,
  stampRotation: 0,
  stampOpacity: 0.8,
  stampScale: 1.0,
  stampOffsetX: 0,
  stampOffsetY: 0,
  // Paper & Security
  paperTexture: "none",
  guillocheComplexity: 2,
  guillocheOpacity: 0.04,
  useMicrotextBorder: false,
  ghostPhotoOpacity: 0.1,
  securityFibersOpacity: 0.05,
  watermarkText: "",
  watermarkOpacity: 0.1,
  // Gradient background
  useGradientBackground: true,
  gradientType: "linear",
  gradientColors: ["#fdfbfb", "#ebedee", "#e8f5ff"],
  // Overlay
  overlayShape: "none",
  overlayOpacity: 0.08,
  overlayColor: "#0d5c91",
  // Border
  borderStyle: "solid",
  borderWidth: 2,
  borderColor: "#0d5c91",
  // === CARD-SPECIFIC SETTINGS ===
  cardCornerRadius: 12,
  cardHologramIntensity: 0.5,
  cardShowChip: false,
  cardChipStyle: "gold",
  cardChipPositionX: 8,
  cardChipPositionY: 50,
  cardShowBarcode: false,
  cardBarcodeType: "code128",
  cardShowMagStripe: false,
  cardMagStripeColor: "#1a1a1a",
  cardSecurityPattern: "none",
  cardBackGradientType: "linear",
  cardBackGradientColors: ["#1a1a2e", "#16213e", "#0f3460"],
  // Card photo settings
  cardPhotoShape: "rounded",
  cardPhotoBorderWidth: 2,
  cardPhotoBorderColor: "#ffffff",
  cardPhotoShadow: true,
  // Card text settings
  cardNameColor: "#0f172a",
  cardRoleColor: "#ffffff",
  cardRoleBgColor: "#0d5c91",
  cardDetailsColor: "#64748b",
  // Card front gradient
  cardFrontGradientColors: ["#f8fafc", "#e2e8f0", "#cbd5e1"],
  cardUseCustomFrontGradient: false,
  // Logo positioning
  logoDataUrl: null,
  logoScale: 1.0,
  logoOpacity: 1.0,
  logoOffsetX: 0,
  logoOffsetY: 0,
  // Signature positioning
  signatureDataUrl: null,
  signatureScale: 1.0,
  signatureOpacity: 1.0,
  signatureOffsetX: 0,
  signatureOffsetY: 0,
  // QR Code positioning
  qrCodeScale: 1.0,
  qrCodeOpacity: 1.0,
  qrCodeOffsetX: 0,
  qrCodeOffsetY: 0,
  // Sticker positioning
  stickerDataUrl: null,
  stickerScale: 1.0,
  stickerOpacity: 1.0,
  stickerOffsetX: 0,
  stickerOffsetY: 0,
  // Shadow
  shadowColor: "#000000",
  shadowOpacity: 0.15,
  shadowBlur: 20,
};

const CertificateMaster: React.FC = () => {
  const [step, setStep] = useState<"form" | "preview">("form");
  const [formData, setFormData] = useState<Certificate | null>(null);
  const [design, setDesign] = useState<CertificateDesign>(defaultDesign);
  const [mode, setMode] = useState<"certificate" | "card">("certificate");
  const [language, setLanguage] = useState<Language>("nl");
  const [savedCertificates, setSavedCertificates] = useState<Certificate[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load saved design and certificates on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const saved = getDesign("cert");
        if (saved) setDesign(saved as CertificateDesign);

        const certs = await getAllCertificatesFromDb();
        setSavedCertificates(certs);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Save design when it changes
  useEffect(() => {
    saveDesign("cert", design as CertificateDesign);
  }, [design]);

  const handleFormSubmit = async (
    data: Omit<Certificate, "id" | "created_at" | "certificateNumber">
  ) => {
    const certNumber = generateCertificateNumber();
    const newCertificate: Certificate = {
      ...data,
      id: `cert_${Date.now()}`,
      certificateNumber: certNumber,
      created_at: new Date().toISOString(),
    };
    setFormData(newCertificate);
    setStep("preview");
  };

  const handleDeleteCertificate = async (id: string) => {
    const success = await deleteCertificateFromDb(id);
    if (success) {
      setSavedCertificates((prev) => prev.filter((c) => c.id !== id));
      toast.success("✅ Certyfikat usunięty");
    } else {
      toast.error("❌ Błąd podczas usuwania");
    }
  };

  const handleViewCertificate = (cert: Certificate) => {
    setFormData(cert);
    setStep("preview");
  };

  const handleBack = async () => {
    setStep("form");
    setFormData(null);
    // Refresh list
    const certs = await getAllCertificatesFromDb();
    setSavedCertificates(certs);
  };

  const resetDesign = () => {
    setDesign(defaultDesign);
    toast.success("✅ Design zresetowany do domyślnego");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-pulse text-slate-400 text-sm font-medium">
          Ładowanie...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* FORM VIEW */}
      {step === "form" && (
        <div className="container mx-auto px-4 py-8 max-w-5xl">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-3 bg-amber-500 text-white px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest mb-4 shadow-lg">
              <Award size={16} />
              <span>Certificate Master 13.0</span>
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">
              Generator Certyfikatów
            </h1>
            <p className="text-slate-500 font-medium">
              Wybierz pracownika i utwórz profesjonalny certyfikat
            </p>
          </div>

          {/* Mode & Language Selection */}
          <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8 mb-8">
            <div className="flex flex-wrap gap-4 items-center justify-between mb-8">
              {/* Mode Toggle */}
              <div className="flex bg-slate-100 p-1.5 rounded-2xl">
                <button
                  onClick={() => setMode("certificate")}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${
                    mode === "certificate"
                      ? "bg-white text-brand-700 shadow-md"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <FileText size={18} />
                  Certyfikat A4
                </button>
                <button
                  onClick={() => setMode("card")}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${
                    mode === "card"
                      ? "bg-white text-brand-700 shadow-md"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <CreditCard size={18} />
                  Karta ID
                </button>
              </div>

              {/* Language Toggle */}
              <div className="flex items-center gap-3">
                <Globe size={16} className="text-slate-400" />
                <div className="flex bg-slate-100 p-1 rounded-xl">
                  <button
                    onClick={() => setLanguage("nl")}
                    className={`px-4 py-2 rounded-lg text-xs font-black uppercase transition-all ${
                      language === "nl"
                        ? "bg-white text-brand-700 shadow"
                        : "text-slate-500"
                    }`}
                  >
                    🇳🇱 NL
                  </button>
                  <button
                    onClick={() => setLanguage("pl")}
                    className={`px-4 py-2 rounded-lg text-xs font-black uppercase transition-all ${
                      language === "pl"
                        ? "bg-white text-brand-700 shadow"
                        : "text-slate-500"
                    }`}
                  >
                    🇵🇱 PL
                  </button>
                </div>
                <label className="flex items-center gap-2 text-xs text-slate-500">
                  <input
                    type="checkbox"
                    checked={design.isBilingual}
                    onChange={(e) =>
                      setDesign({ ...design, isBilingual: e.target.checked })
                    }
                    className="rounded border-slate-300"
                  />
                  Dwujęzyczny
                </label>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border ${
                    showHistory
                      ? "bg-brand-50 border-brand-200 text-brand-700"
                      : "bg-white border-slate-200 text-slate-600 hover:border-brand-300"
                  }`}
                >
                  <History size={14} />
                  Historia ({savedCertificates.length})
                </button>
                <button
                  onClick={resetDesign}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-white border border-slate-200 text-slate-600 hover:border-slate-300 transition-all"
                >
                  <RotateCcw size={14} />
                  Reset
                </button>
              </div>
            </div>

            {/* History Panel */}
            {showHistory && savedCertificates.length > 0 && (
              <div className="mb-8 bg-slate-50 rounded-2xl p-6 border border-slate-100">
                <h3 className="text-sm font-black text-slate-700 uppercase tracking-wider mb-4">
                  Zapisane certyfikaty
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {savedCertificates.map((cert) => (
                    <div
                      key={cert.id}
                      className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm hover:shadow-md transition-all"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm">
                            {cert.candidateName}
                          </h4>
                          <p className="text-xs text-slate-500">{cert.role}</p>
                        </div>
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${
                            cert.status === "active"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {cert.status || "draft"}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mb-3">
                        <span className="font-mono">
                          {cert.certificateNumber}
                        </span>
                        <span className="mx-2">•</span>
                        <span>
                          {cert.created_at
                            ? new Date(cert.created_at).toLocaleDateString("pl")
                            : "-"}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleViewCertificate(cert)}
                          className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-brand-600 text-white rounded-lg text-xs font-bold hover:bg-brand-700 transition-all"
                        >
                          <Eye size={12} /> Podgląd
                        </button>
                        <button
                          onClick={() => handleDeleteCertificate(cert.id)}
                          className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Form */}
            <CertificateForm
              onSave={(cert) => {
                setFormData(cert);
                setStep("preview");
              }}
              onCancel={() => setShowHistory(false)}
              language={language}
            />
          </div>
        </div>
      )}

      {/* PREVIEW VIEW */}
      {step === "preview" && formData && (
        <CertificatePreview
          data={formData}
          design={design}
          onDesignChange={setDesign}
          mode={mode}
          language={language}
          onBack={handleBack}
        />
      )}

      {/* Print Styles */}
      <style>{`
        @media print {
          @page { 
            size: ${
              mode === "certificate"
                ? design.orientation === "landscape"
                  ? "297mm 210mm"
                  : "210mm 297mm"
                : "85.6mm 53.98mm"
            };
            margin: 0;
          }
          body * { visibility: hidden; }
          .print\\:shadow-none, .print\\:shadow-none * { visibility: visible; }
          .print\\:hidden { display: none !important; }
        }
      `}</style>
    </div>
  );
};

export default CertificateMaster;
