import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useToasts } from "../../contexts/ToastContext";
import { supabase } from "../../src/lib/supabase";
import { CertificateTemplate } from "../../components/CertificateTemplate";

export default function CertificateGenerator() {
  const navigate = useNavigate();
  const { addToast } = useToasts();
  const [isLoading, setIsLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [currentAdmin, setCurrentAdmin] = useState<any>(null);

  // Worker selection (przywrócone)
  const [workers, setWorkers] = useState<any[]>([]);
  const [selectedWorkerId, setSelectedWorkerId] = useState("");
  const [isLoadingWorkers, setIsLoadingWorkers] = useState(true);

  // Form fields - pełna kontrola nad każdym polem (edytowalne po wyborze pracownika)
  const [workerFullName, setWorkerFullName] = useState("");
  const [workerBtwSofi, setWorkerBtwSofi] = useState("");
  const [workerKvk, setWorkerKvk] = useState("");
  const [workerSpecialization, setWorkerSpecialization] = useState("");
  const [verificationReason, setVerificationReason] = useState("");
  const [issueDate, setIssueDate] = useState(
    new Date().toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  );
  const [certificateId, setCertificateId] = useState(
    `ZZP-${new Date().getFullYear()}-${
      Math.floor(Math.random() * 90000) + 10000
    }`
  );

  // Opcje konfiguracji
  const [language, setLanguage] = useState<"en" | "nl" | "pl">("en");
  const [colorScheme, setColorScheme] = useState<"gold" | "blue" | "silver">(
    "gold"
  );
  const [fontStyle, setFontStyle] = useState<"elegant" | "modern" | "classic">(
    "elegant"
  );

  useEffect(() => {
    loadWorkers();
    loadCurrentAdmin();
  }, []);

  // Auto-fill fields when worker is selected
  useEffect(() => {
    if (selectedWorkerId) {
      const worker = workers.find((w) => w.id === selectedWorkerId);
      if (worker) {
        setWorkerFullName(worker.full_name || "");
        setWorkerBtwSofi(worker.btw_number || worker.btw_sofi_number || "");
        setWorkerKvk(worker.kvk_number || "");
        setWorkerSpecialization(worker.specialization || "");
      }
    }
  }, [selectedWorkerId, workers]);

  const loadWorkers = async () => {
    try {
      setIsLoadingWorkers(true);

      // Fetch workers (budowlani, elektrycy, etc.)
      const { data: workersData, error: workersError } = await supabase
        .from("workers")
        .select(
          `
          *,
          profile:profiles!workers_profile_id_fkey(
            id,
            full_name,
            email,
            avatar_url
          )
        `
        )
        .order("created_at", { ascending: false });

      if (workersError) throw workersError;

      // Fetch cleaning companies (sprzątaczki)
      const { data: cleaningData, error: cleaningError } = await supabase
        .from("cleaning_companies")
        .select(
          `
          *,
          profile:profiles!cleaning_companies_profile_id_fkey(
            id,
            full_name,
            email,
            avatar_url
          )
        `
        )
        .order("created_at", { ascending: false });

      if (cleaningError) throw cleaningError;

      // Map workers data
      const workersWithNames = (workersData || []).map((worker: any) => ({
        ...worker,
        full_name: worker.profile?.full_name || "Unknown Worker",
        email: worker.profile?.email || "",
        avatar_url: worker.profile?.avatar_url || null,
        worker_type: "worker",
        btw_sofi_number: worker.btw_number,
        display_name: `${worker.profile?.full_name || "Unknown"} - ${
          worker.specialization || "General"
        }`,
      }));

      // Map cleaning companies data
      const cleaningWithNames = (cleaningData || []).map((company: any) => ({
        ...company,
        full_name:
          company.profile?.full_name ||
          company.company_name ||
          "Unknown Company",
        email: company.profile?.email || "",
        avatar_url: company.profile?.avatar_url || null,
        worker_type: "cleaning_company",
        btw_number: company.btw_number,
        btw_sofi_number: company.btw_number,
        specialization: Array.isArray(company.specialization)
          ? company.specialization.join(", ")
          : company.specialization || "Cleaning Services",
        display_name: `${
          company.company_name || company.profile?.full_name || "Unknown"
        } - Sprzątanie`,
      }));

      const allWorkers = [...workersWithNames, ...cleaningWithNames];

      console.log("✅ Loaded workers:", {
        workers: workersWithNames.length,
        cleaning: cleaningWithNames.length,
        total: allWorkers.length,
      });

      setWorkers(allWorkers);
    } catch (error: any) {
      console.error("❌ Failed to load workers:", error);
      addToast("Failed to load workers list", "error");
    } finally {
      setIsLoadingWorkers(false);
    }
  };

  const loadCurrentAdmin = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      setCurrentAdmin(data);
    } catch (error: any) {
      console.error("❌ Failed to load admin profile:", error);
      addToast("Failed to load admin data", "error");
    }
  };

  const mockCertificateData = {
    worker_full_name: workerFullName || "Jan Kowalski",
    worker_btw_sofi: workerBtwSofi || "123456789B01",
    worker_kvk: workerKvk || "12345678",
    worker_specialization: workerSpecialization || "General Labor",
    verification_reason:
      verificationReason || "Professional skill verification pending.",
    issue_date: issueDate,
    certificate_id: certificateId,
  };

  const handleGenerate = async () => {
    console.log("🔥🔥🔥 GENERATE BUTTON CLICKED! 🔥🔥🔥");
    console.log("Certificate data:", mockCertificateData);
    console.log("Current admin:", currentAdmin);

    if (!workerFullName.trim()) {
      addToast("Please enter worker full name", "error");
      return;
    }

    if (!verificationReason.trim()) {
      addToast("Please enter a verification reason", "error");
      return;
    }

    if (verificationReason.length > 500) {
      addToast("Verification reason must be max 500 characters", "error");
      return;
    }

    if (!currentAdmin) {
      addToast("Admin data not loaded", "error");
      return;
    }

    try {
      setIsLoading(true);
      console.log("🚀 Starting certificate generation...", mockCertificateData);

      addToast(
        "⏳ Generating PDF with Puppeteer... This may take 10-20 seconds",
        "info"
      );

      // Get auth session for authorization header
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;

      if (!accessToken) {
        throw new Error("No authentication token found. Please login again.");
      }

      // Direct fetch() call to Edge Function (bypass Supabase client)
      const functionUrl = `${
        import.meta.env.VITE_SUPABASE_URL
      }/functions/v1/generate-certificate-simple`;

      console.log("📡 Calling Edge Function:", functionUrl);

      const response = await fetch(functionUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          worker_full_name: workerFullName,
          worker_btw_sofi: workerBtwSofi,
          worker_kvk: workerKvk,
          worker_specialization: workerSpecialization,
          verification_reason: verificationReason,
          issue_date: issueDate,
          certificate_id: certificateId,
          issued_by_admin_id: currentAdmin.id,
          issued_by_admin_name: currentAdmin.full_name || "Administrator",
        }),
      });

      console.log("📡 Response status:", response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Edge Function HTTP error:", {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
        });
        throw new Error(
          `Edge Function failed: ${response.status} ${response.statusText} - ${errorText}`
        );
      }

      const data = await response.json();
      console.log("✅ Certificate generated:", data);

      if (data.certificate?.certificate_id) {
        // NOTE: Don't try to download placeholder PDF - it will fail
        // Only navigate to the generated certificates list
        addToast(
          `Certyfikat ${data.certificate.certificate_id} został wygenerowany`,
          "success"
        );

        // Reset formularza
        setWorkerFullName("");
        setWorkerBtwSofi("");
        setWorkerKvk("");
        setWorkerSpecialization("");
        setVerificationReason("");
        setCertificateId(
          `ZZP-${new Date().getFullYear()}-${
            Math.floor(Math.random() * 90000) + 10000
          }`
        );

        // Navigate to generated certificates list, not main certificates manager
        setTimeout(() => {
          navigate("/admin/certificates/generated");
        }, 800);
      } else {
        throw new Error("Certificate ID not returned");
      }
    } catch (error: any) {
      console.error("❌ Certificate generation failed:", error);
      addToast(error.message || "Failed to generate certificate", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Certificate Generator
              </h1>
              <p className="text-gray-600 mt-1">
                Issue professional skill verification certificates
              </p>
            </div>
            <Link
              to="/admin/certificates/generated"
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              Pokaż Wszystkie
            </Link>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="space-y-6">
            {/* Worker Selection - AUTO-FILL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🔍 Wyszukaj pracownika (opcjonalne - auto-wypełni pola poniżej)
              </label>
              {isLoadingWorkers ? (
                <div className="flex items-center gap-2 text-gray-500">
                  <svg
                    className="animate-spin h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  <span>Ładowanie pracowników...</span>
                </div>
              ) : (
                <select
                  value={selectedWorkerId}
                  onChange={(e) => setSelectedWorkerId(e.target.value)}
                  disabled={isLoading}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                >
                  <option value="">
                    -- Wybierz z listy lub wypełnij ręcznie --
                  </option>
                  {workers.map((worker) => (
                    <option key={worker.id} value={worker.id}>
                      {worker.display_name}
                    </option>
                  ))}
                </select>
              )}
              <p className="text-xs text-gray-500 mt-1">
                💡 Wybór pracownika automatycznie wypełni pola poniżej (możesz
                je później edytować)
              </p>
            </div>

            <div className="border-t pt-4" />

            {/* Worker Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pełna nazwa pracownika <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={workerFullName}
                onChange={(e) => setWorkerFullName(e.target.value)}
                disabled={isLoading}
                placeholder="np. Jan Kowalski"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              />
            </div>

            {/* BTW Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Numer BTW <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={workerBtwSofi}
                onChange={(e) => setWorkerBtwSofi(e.target.value)}
                disabled={isLoading}
                placeholder="np. 123456789B01"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              />
            </div>

            {/* KVK Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Numer KVK <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={workerKvk}
                onChange={(e) => setWorkerKvk(e.target.value)}
                disabled={isLoading}
                placeholder="np. 12345678"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              />
            </div>

            {/* Specialization */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Specjalizacja <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={workerSpecialization}
                onChange={(e) => setWorkerSpecialization(e.target.value)}
                disabled={isLoading}
                placeholder="np. Sprzątanie po budowie / Konstrukcje stalowe"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              />
            </div>

            {/* Issue Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data wydania certyfikatu <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                disabled={isLoading}
                placeholder="np. 15 November 2025"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              />
              <p className="text-xs text-gray-500 mt-1">
                Format: DD Month YYYY (np. 15 November 2025)
              </p>
            </div>

            {/* Certificate ID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ID Certyfikatu <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={certificateId}
                onChange={(e) => setCertificateId(e.target.value)}
                disabled={isLoading}
                placeholder="np. ZZP-2025-12345"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              />
              <p className="text-xs text-gray-500 mt-1">
                Format: ZZP-YYYY-XXXXX (auto-generated, editable)
              </p>
            </div>

            {/* Configuration Options */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Opcje konfiguracji
              </h3>

              {/* Language */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Język certyfikatu
                </label>
                <select
                  value={language}
                  onChange={(e) =>
                    setLanguage(e.target.value as "en" | "nl" | "pl")
                  }
                  disabled={isLoading}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                >
                  <option value="en">🇬🇧 Angielski (English)</option>
                  <option value="nl">🇳🇱 Holenderski (Nederlands)</option>
                  <option value="pl">🇵🇱 Polski</option>
                </select>
              </div>

              {/* Color Scheme */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Schemat kolorów
                </label>
                <select
                  value={colorScheme}
                  onChange={(e) =>
                    setColorScheme(e.target.value as "gold" | "blue" | "silver")
                  }
                  disabled={isLoading}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                >
                  <option value="gold">🟡 Złoty (Elegancki)</option>
                  <option value="blue">🔵 Niebieski (Nowoczesny)</option>
                  <option value="silver">⚪ Srebrny (Klasyczny)</option>
                </select>
              </div>

              {/* Font Style */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Styl czcionek
                </label>
                <select
                  value={fontStyle}
                  onChange={(e) =>
                    setFontStyle(
                      e.target.value as "elegant" | "modern" | "classic"
                    )
                  }
                  disabled={isLoading}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                >
                  <option value="elegant">
                    📜 Elegancki (Playfair Display)
                  </option>
                  <option value="modern">🔤 Nowoczesny (Inter)</option>
                  <option value="classic">
                    📖 Klasyczny (Times New Roman)
                  </option>
                </select>
              </div>
            </div>

            {/* Verification Reason */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Verification Statement <span className="text-red-500">*</span>
              </label>
              <textarea
                value={verificationReason}
                onChange={(e) => setVerificationReason(e.target.value)}
                disabled={isLoading}
                placeholder="Enter the reason for issuing this certificate (e.g., 'Successfully completed 50+ cleaning projects with 4.8/5 average rating. Verified professional skills in commercial cleaning and sanitation.')"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none disabled:bg-gray-100"
                rows={4}
                maxLength={500}
              />
              <div className="flex justify-between items-center mt-2">
                <p className="text-sm text-gray-500">
                  This statement will appear on the certificate
                </p>
                <span
                  className={`text-sm ${
                    verificationReason.length > 450
                      ? "text-red-500"
                      : "text-gray-500"
                  }`}
                >
                  {verificationReason.length}/500
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                onClick={() => setShowPreview(true)}
                disabled={!workerFullName.trim() || isLoading}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
                Podgląd certyfikatu
              </button>

              <button
                onClick={handleGenerate}
                disabled={
                  !workerFullName.trim() ||
                  !workerBtwSofi.trim() ||
                  !workerKvk.trim() ||
                  !workerSpecialization.trim() ||
                  !verificationReason.trim() ||
                  isLoading ||
                  !currentAdmin
                }
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <svg
                      className="animate-spin h-4 w-4"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Generating...
                  </>
                ) : (
                  <>
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                      />
                    </svg>
                    Generate & Download PDF
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6">
          <h3 className="font-semibold text-blue-900 mb-2">
            📋 Certificate Details
          </h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Format: A4 Landscape (297mm × 210mm)</li>
            <li>• Valid for: 1 year from issue date</li>
            <li>• Includes: QR code for public verification</li>
            <li>• Certificate ID: Auto-generated (ZZP-YYYY-XXXXX)</li>
            <li>• Storage: Secured in Supabase Storage</li>
          </ul>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && mockCertificateData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-[95vw] max-h-[95vh] overflow-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-bold">Certificate Preview</h2>
              <button
                onClick={() => setShowPreview(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="p-4 bg-gray-100 overflow-auto">
              <div
                style={{
                  transform: "scale(0.5)",
                  transformOrigin: "top left",
                  width: "200%",
                  height: "200%",
                }}
              >
                <CertificateTemplate
                  data={mockCertificateData}
                  isPreview={true}
                />
              </div>
            </div>
            <div className="p-4 text-sm text-gray-600 text-center border-t border-gray-200">
              <p>
                This is a preview. The actual PDF will be generated with the
                final Certificate ID.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
