// =====================================================
// SETTINGS PAGE (SIMPLIFIED)
// =====================================================
// Company settings and configuration
// Adapted from NORBS for ZZP Werkplaats
// =====================================================

import { useState, useEffect } from "react";
import { useTranslation } from "../i18n";
import { useSupabaseCompany } from "../hooks";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card } from "../components/ui/card";
import { useAuth } from "../../../../contexts/AuthContext";
import type { Company } from "../types";

interface SettingsProps {
  onNavigate: (page: string) => void;
}

export default function Settings({ onNavigate }: SettingsProps) {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { company, updateCompany, createCompany, loading } = useSupabaseCompany(
    user?.id || ""
  );
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<Company>>({
    name: "",
    address: "",
    city: "",
    postal_code: "",
    country: "NL",
    kvk_number: "",
    vat_number: "",
    iban: "",
    bic: "",
    email: "",
    phone: "",
    website: "",
    default_payment_term_days: 14,
    default_vat_rate: 21,
    currency: "EUR",
    logo_base64: undefined,
  });

  // Load company data
  useEffect(() => {
    if (company) {
      setFormData({
        name: company.name || "",
        address: company.address || "",
        city: company.city || "",
        postal_code: company.postal_code || "",
        country: company.country || "NL",
        kvk_number: company.kvk_number || "",
        vat_number: company.vat_number || "",
        iban: company.iban || "",
        bic: company.bic || "",
        email: company.email || "",
        phone: company.phone || "",
        website: company.website || "",
        default_payment_term_days: company.default_payment_term_days || 14,
        default_vat_rate: company.default_vat_rate || 21,
        currency: company.currency || "EUR",
        logo_base64: company.logo_base64 || undefined,
      });

      // Set logo preview
      if (company.logo_base64) {
        setLogoPreview(company.logo_base64);
      }
    }
  }, [company]);

  // Handle logo upload
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("❌ Proszę wybrać plik obrazu (JPG, PNG, SVG)");
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert("❌ Plik jest za duży. Maksymalny rozmiar to 2MB");
      return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setLogoPreview(base64);
      setFormData({ ...formData, logo_base64: base64 });
    };
    reader.readAsDataURL(file);
  };

  // Remove logo
  const handleRemoveLogo = () => {
    setLogoPreview(null);
    setFormData({ ...formData, logo_base64: undefined });
  };

  const handleSave = async () => {
    if (!formData.name || !formData.vat_number) {
      alert("Nazwa firmy i numer VAT są wymagane");
      return;
    }

    try {
      // Jeśli firma nie istnieje, utwórz nową
      if (!company) {
        await createCompany({
          name: formData.name,
          address: formData.address || "",
          city: formData.city || "",
          postal_code: formData.postal_code || "",
          country: formData.country || "NL",
          kvk_number: formData.kvk_number || "",
          vat_number: formData.vat_number || "",
          iban: formData.iban || "",
          bic: formData.bic || "",
          email: formData.email || "",
          phone: formData.phone || "",
          website: formData.website || "",
          default_payment_term_days: formData.default_payment_term_days || 14,
          default_vat_rate: formData.default_vat_rate || 21,
          currency: formData.currency || "EUR",
          logo_base64: formData.logo_base64 || undefined,
        });
        alert("✅ Profil firmy utworzony pomyślnie!");
      } else {
        // Jeśli istnieje, zaktualizuj
        await updateCompany(formData);
        alert("✅ Ustawienia zaktualizowane pomyślnie!");
      }
    } catch (error) {
      alert("❌ Błąd zapisu ustawień");
      console.error("Error updating company:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-8 text-white shadow-2xl">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative">
            <h1 className="text-4xl font-bold tracking-tight mb-2">
              ⚙️ {t.settings.title}
            </h1>
            <p className="text-indigo-100 text-lg">
              Ustawienia firmy i konfiguracja
            </p>
          </div>
        </div>

        {/* Info jeśli brak firmy */}
        {!company && !loading && (
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-400 rounded-2xl p-6 shadow-lg">
            <div className="flex items-start gap-4">
              <div className="text-4xl">⚠️</div>
              <div>
                <h3 className="text-xl font-bold text-yellow-900 mb-2">
                  Brak profilu firmy
                </h3>
                <p className="text-yellow-800 mb-3">
                  Musisz najpierw utworzyć profil firmy, aby móc wystawiać
                  faktury. Wypełnij poniższy formularz i kliknij "Zapisz
                  ustawienia".
                </p>
                <p className="text-sm text-yellow-700">
                  <strong>Wymagane pola:</strong> Nazwa firmy i Numer VAT
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Logo Upload */}
        <Card className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            🖼️ Logo firmy
          </h2>

          <div className="bg-blue-50 p-4 rounded-xl border-2 border-blue-200 mb-6">
            <div className="flex items-start gap-3">
              <span className="text-2xl">💡</span>
              <div>
                <div className="font-bold text-gray-900">Logo na fakturach</div>
                <div className="text-sm text-gray-700 mt-1">
                  Dodaj logo swojej firmy, które będzie wyświetlane na
                  wszystkich fakturach w lewym górnym rogu. Zalecany format:{" "}
                  <strong>PNG lub JPG</strong>, maksymalny rozmiar:{" "}
                  <strong>2MB</strong>.
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-6 items-start">
            {/* Logo Preview */}
            <div className="flex-shrink-0">
              <div className="w-48 h-48 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center bg-gray-50 overflow-hidden">
                {logoPreview ? (
                  <img
                    src={logoPreview}
                    alt="Logo firmy"
                    className="max-w-full max-h-full object-contain p-4"
                  />
                ) : (
                  <div className="text-center p-4">
                    <div className="text-4xl mb-2">📷</div>
                    <div className="text-sm text-gray-500">Brak logo</div>
                  </div>
                )}
              </div>
            </div>

            {/* Upload Controls */}
            <div className="flex-1 space-y-4">
              <div>
                <label className="block mb-2">
                  <span className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all cursor-pointer inline-flex items-center gap-2 font-medium shadow-lg">
                    📁 Wybierz logo
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                  </span>
                </label>
                <p className="text-sm text-gray-500 mt-2">
                  Akceptowane formaty: JPG, PNG, SVG (max 2MB)
                </p>
              </div>

              {logoPreview && (
                <button
                  onClick={handleRemoveLogo}
                  className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-medium"
                >
                  🗑️ Usuń logo
                </button>
              )}

              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-2">
                  📋 Wskazówki:
                </h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>✓ Używaj logo w dobrej jakości (min. 300x300px)</li>
                  <li>✓ Najlepiej na przezroczystym tle (PNG)</li>
                  <li>✓ Logo będzie proporcjonalnie skalowane na fakturze</li>
                  <li>✓ Zmiana logo zaktualizuje wszystkie przyszłe faktury</li>
                </ul>
              </div>
            </div>
          </div>
        </Card>

        {/* Company Info */}
        <Card className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            🏢 Dane firmy
          </h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Nazwa firmy *
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="NORBS SERVICE"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Email
                </label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="info@norbsservice.nl"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Adres</label>
              <Input
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                placeholder="Straat 123"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Kod pocztowy
                </label>
                <Input
                  value={formData.postal_code}
                  onChange={(e) =>
                    setFormData({ ...formData, postal_code: e.target.value })
                  }
                  placeholder="1012 AB"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Miasto
                </label>
                <Input
                  value={formData.city}
                  onChange={(e) =>
                    setFormData({ ...formData, city: e.target.value })
                  }
                  placeholder="Amsterdam"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Kraj
                </label>
                <select
                  value={formData.country}
                  onChange={(e) =>
                    setFormData({ ...formData, country: e.target.value })
                  }
                  className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                >
                  <option value="NL">🇳🇱 Niderlandy</option>
                  <option value="PL">🇵🇱 Polska</option>
                  <option value="DE">🇩🇪 Niemcy</option>
                  <option value="BE">🇧🇪 Belgia</option>
                  <option value="FR">🇫🇷 Francja</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Telefon
                </label>
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  placeholder="+31 6 12345678"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Strona internetowa
                </label>
                <Input
                  type="url"
                  value={formData.website}
                  onChange={(e) =>
                    setFormData({ ...formData, website: e.target.value })
                  }
                  placeholder="https://norbsservice.nl"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Tax & Legal Info */}
        <Card className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            📋 Dane podatkowe i prawne
          </h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Numer KVK (NL)
                </label>
                <Input
                  value={formData.kvk_number}
                  onChange={(e) =>
                    setFormData({ ...formData, kvk_number: e.target.value })
                  }
                  placeholder="12345678"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Numer VAT/BTW *
                </label>
                <Input
                  value={formData.vat_number}
                  onChange={(e) =>
                    setFormData({ ...formData, vat_number: e.target.value })
                  }
                  placeholder="NL123456789B01"
                />
              </div>
            </div>

            <div className="bg-yellow-50 p-4 rounded-xl border-2 border-yellow-200">
              <div className="flex items-start gap-3">
                <span className="text-2xl">ℹ️</span>
                <div>
                  <div className="font-bold text-gray-900">
                    Format numeru VAT
                  </div>
                  <div className="text-sm text-gray-700 mt-1">
                    NL:{" "}
                    <code className="bg-white px-2 py-1 rounded">
                      NL123456789B01
                    </code>{" "}
                    • PL:{" "}
                    <code className="bg-white px-2 py-1 rounded">
                      PL1234567890
                    </code>{" "}
                    • DE:{" "}
                    <code className="bg-white px-2 py-1 rounded">
                      DE123456789
                    </code>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Bank Details */}
        <Card className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            🏦 Dane bankowe
          </h2>

          <div className="bg-blue-50 p-4 rounded-xl border-2 border-blue-200 mb-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">📱</span>
              <div>
                <div className="font-bold text-gray-900">
                  QR kod płatności SEPA
                </div>
                <div className="text-sm text-gray-700 mt-1">
                  Gdy podasz IBAN, na fakturach pojawi się{" "}
                  <strong>kolorowy QR kod</strong> do szybkiej płatności.
                  Klienci mogą zeskanować kod telefonem i zapłacić bez
                  przepisywania danych!
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  IBAN
                </label>
                <Input
                  value={formData.iban}
                  onChange={(e) =>
                    setFormData({ ...formData, iban: e.target.value })
                  }
                  placeholder="NL91ABNA0417164300"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  BIC/SWIFT
                </label>
                <Input
                  value={formData.bic}
                  onChange={(e) =>
                    setFormData({ ...formData, bic: e.target.value })
                  }
                  placeholder="ABNANL2A"
                />
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-xl border-2 border-blue-200">
              <div className="flex items-start gap-3">
                <span className="text-2xl">💡</span>
                <div>
                  <div className="font-bold text-gray-900">SEPA QR Code</div>
                  <div className="text-sm text-gray-700 mt-1">
                    Dane IBAN i BIC są używane do generowania kodów QR SEPA na
                    fakturach dla szybkich płatności
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Invoice Defaults */}
        <Card className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            📄 Domyślne ustawienia faktur
          </h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Termin płatności (dni)
                </label>
                <select
                  value={formData.default_payment_term_days}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      default_payment_term_days: parseInt(e.target.value),
                    })
                  }
                  className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                >
                  <option value={7}>7 dni</option>
                  <option value={14}>14 dni</option>
                  <option value={30}>30 dni</option>
                  <option value={45}>45 dni</option>
                  <option value={60}>60 dni</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Domyślna stawka VAT (%)
                </label>
                <select
                  value={formData.default_vat_rate}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      default_vat_rate: parseInt(e.target.value),
                    })
                  }
                  className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                >
                  <option value={0}>0% (export, reverse charge)</option>
                  <option value={9}>9% (obniżona NL)</option>
                  <option value={21}>21% (standardowa NL)</option>
                  <option value={23}>23% (standardowa PL)</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Waluta
                </label>
                <select
                  value={formData.currency}
                  onChange={(e) =>
                    setFormData({ ...formData, currency: e.target.value })
                  }
                  className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                >
                  <option value="EUR">EUR (€)</option>
                  <option value="PLN">PLN (zł)</option>
                  <option value="USD">USD ($)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>
            </div>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4 sticky bottom-6 z-10">
          <Button
            onClick={handleSave}
            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-2xl text-lg font-bold shadow-2xl hover:shadow-3xl transition-all"
          >
            💾 {t.common.save}
          </Button>
        </div>
      </div>
    </div>
  );
}
