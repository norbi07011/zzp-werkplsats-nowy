/**
 * =====================================================
 * INVOICE TEMPLATE PREVIEW COMPONENT
 * =====================================================
 * Podgląd faktury na żywo z QR kodem SEPA
 * Wzorowany na MESSU-BOUW Classic Professional
 * =====================================================
 */

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { formatCurrency } from "../lib";
import { generateSEPAQRCode } from "../lib/sepa-qr-generator";
import type { Client, Company, InvoiceLine } from "../types/index";

interface InvoicePreviewProps {
  invoice: {
    invoice_number?: string;
    invoice_date?: string;
    due_date?: string;
    total_net?: number;
    total_vat?: number;
    total_gross?: number;
    notes?: string;
    is_reverse_charge?: boolean;
    lines?: InvoiceLine[];
  };
  client?: Client;
  company?: Company;
  showQRCode?: boolean;
  scale?: number;
  templateStyle?: {
    primaryColor?: string;
    secondaryColor?: string;
    textColor?: string;
    backgroundColor?: string;
    fontFamily?: string;
    // Design features
    logo_url?: string;
    logo_size?: number;
    holographic_logo?: boolean;
    paper_texture?: string;
    show_signature_line?: boolean;
  };
}

export function InvoiceTemplatePreview({
  invoice,
  client,
  company,
  showQRCode = true,
  scale = 0.5,
  templateStyle,
}: InvoicePreviewProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");

  // Extract template colors with defaults
  const primaryColor = templateStyle?.primaryColor || "#3b82f6"; // blue-500
  const secondaryColor = templateStyle?.secondaryColor || "#f1f5f9"; // slate-100
  const textColor = templateStyle?.textColor || "#1e293b"; // slate-800
  const backgroundColor = templateStyle?.backgroundColor || "#ffffff";
  const fontFamily =
    templateStyle?.fontFamily || "Inter, system-ui, sans-serif";

  // Design features
  const designLogoUrl = templateStyle?.logo_url;
  const logoSize = templateStyle?.logo_size || 80;
  const holographicLogo = templateStyle?.holographic_logo || false;
  const paperTexture = templateStyle?.paper_texture || "plain";
  const showSignatureLine = templateStyle?.show_signature_line || false;

  // Use design logo if available, otherwise company logo
  const logoSrc = designLogoUrl || company?.logo_base64 || company?.logo_url;

  // Generate background style based on paper_texture
  const getBackgroundStyle = (): React.CSSProperties => {
    switch (paperTexture) {
      case "holographic":
        return {
          background: `linear-gradient(135deg, ${secondaryColor} 0%, ${primaryColor}22 50%, ${secondaryColor} 100%)`,
        };
      case "gradient_tri":
        return {
          background: `linear-gradient(135deg, ${primaryColor}15 0%, ${secondaryColor} 30%, ${backgroundColor} 100%)`,
        };
      case "gradient_geo":
        return {
          background: `linear-gradient(145deg, ${secondaryColor} 0%, ${backgroundColor} 50%, ${primaryColor}10 100%)`,
        };
      case "gradient_soft":
        return {
          background: `linear-gradient(180deg, ${secondaryColor} 0%, ${backgroundColor} 100%)`,
        };
      case "dots":
        return {
          backgroundColor: backgroundColor,
          backgroundImage: `radial-gradient(${primaryColor}15 1px, transparent 1px)`,
          backgroundSize: "20px 20px",
        };
      case "lines":
        return {
          backgroundColor: backgroundColor,
          backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 19px, ${primaryColor}10 20px)`,
        };
      case "grain":
        return {
          backgroundColor: backgroundColor,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%' height='100%' filter='url(%23noise)' opacity='0.05'/%3E%3C/svg%3E")`,
        };
      default: // plain
        return { backgroundColor };
    }
  };

  useEffect(() => {
    if (showQRCode && company?.iban && invoice.total_gross) {
      const payload = generateSEPAQRCode({
        bic: company.bic || "",
        name: company.name || "Company",
        iban: company.iban,
        amount: invoice.total_gross,
        reference: invoice.invoice_number || "INVOICE",
        purpose: `Factuur ${invoice.invoice_number} – ${company.name}`,
      });

      QRCode.toDataURL(payload, { width: 150, margin: 1 })
        .then(setQrCodeUrl)
        .catch(console.error);
    }
  }, [invoice.total_gross, invoice.invoice_number, company, showQRCode]);

  const formatDate = (date?: string) => {
    if (!date) return "-";
    return new Intl.DateTimeFormat("nl-NL", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(date));
  };

  return (
    <div
      className="overflow-hidden"
      style={{
        // Container dimensions scaled down
        width: `${794 * scale}px`,
        height: `${1123 * scale}px`,
        ...getBackgroundStyle(),
      }}
    >
      <div
        className="shadow-xl border relative"
        style={{
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          width: "794px",
          minHeight: "1123px",
          fontFamily: fontFamily,
          color: textColor,
          ...getBackgroundStyle(),
        }}
      >
        <div className="w-[794px] min-h-[1123px] p-12 relative">
          {/* Holographic shimmer overlay */}
          {paperTexture === "holographic" && (
            <div
              className="absolute inset-0 pointer-events-none opacity-30"
              style={{
                background:
                  "linear-gradient(135deg, #ff6b6b 0%, #feca57 25%, #48dbfb 50%, #ff9ff3 75%, #ff6b6b 100%)",
                backgroundSize: "200% 200%",
                animation: "holographicShift 8s ease infinite",
              }}
            />
          )}

          {/* Header */}
          <div
            className="flex justify-between items-start pb-6 mb-8"
            style={{ borderBottom: `2px solid ${primaryColor}` }}
          >
            <div>
              {logoSrc ? (
                <div className="relative">
                  <img
                    src={logoSrc}
                    alt="Logo"
                    className="h-16 mb-4 object-contain"
                    style={
                      holographicLogo
                        ? {
                            filter:
                              "drop-shadow(0 0 8px rgba(168, 85, 247, 0.5))",
                          }
                        : {}
                    }
                    onError={(e) => {
                      // Hide broken image
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                  {holographicLogo && (
                    <div
                      className="absolute inset-0 pointer-events-none rounded"
                      style={{
                        background:
                          "linear-gradient(135deg, rgba(255,107,107,0.2) 0%, rgba(254,202,87,0.2) 25%, rgba(72,219,251,0.2) 50%, rgba(255,159,243,0.2) 75%)",
                        mixBlendMode: "overlay",
                      }}
                    />
                  )}
                </div>
              ) : (
                <div className="h-16 w-32 mb-4 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-xs">
                  Brak logo
                </div>
              )}
              <h1 className="text-2xl font-bold text-gray-900">
                {company?.name}
              </h1>
              <div className="text-sm mt-2 text-gray-700 space-y-1">
                <p>{company?.address}</p>
                <p>
                  {company?.postal_code} {company?.city}
                </p>
                {company?.kvk_number && <p>KVK: {company.kvk_number}</p>}
                {company?.vat_number && <p>BTW: {company.vat_number}</p>}
                <p>{company?.email}</p>
              </div>
            </div>
            <div className="text-right">
              <h2
                className="text-3xl font-bold"
                style={{ color: primaryColor }}
              >
                FACTUUR
              </h2>
              <p className="text-xl font-mono mt-2">
                {invoice.invoice_number || "FV-XXXX-XX-XXX"}
              </p>
            </div>
          </div>

          {/* Client & Invoice Details */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="font-semibold mb-2 text-gray-900 border-b border-gray-300 pb-1">
                Factuur aan
              </h3>
              <div className="space-y-1">
                <p className="font-medium text-gray-900">
                  {client?.name || "Klant selecteren..."}
                </p>
                <p className="text-sm text-gray-700">{client?.address}</p>
                <p className="text-sm text-gray-700">
                  {client?.postal_code} {client?.city}
                </p>
                {client?.vat_number && (
                  <p className="text-sm text-gray-700">
                    BTW: {client.vat_number}
                  </p>
                )}
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-2 text-gray-900 border-b border-gray-300 pb-1">
                Factuurgegevens
              </h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Factuurdatum:</span>
                  <span className="font-medium">
                    {formatDate(invoice.invoice_date)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Vervaldatum:</span>
                  <span className="font-medium">
                    {formatDate(invoice.due_date)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <table className="w-full mb-8 border-collapse">
            <thead>
              <tr
                className="border-b-2 border-gray-300"
                style={{ backgroundColor: secondaryColor }}
              >
                <th className="text-center py-3 px-2 font-semibold text-gray-900 w-16">
                  Foto
                </th>
                <th className="text-left py-3 px-2 font-semibold text-gray-900">
                  Omschrijving
                </th>
                <th className="text-right py-3 px-2 font-semibold text-gray-900 w-16">
                  Aantal
                </th>
                <th className="text-right py-3 px-2 font-semibold text-gray-900 w-20">
                  Prijs
                </th>
                <th className="text-right py-3 px-2 font-semibold text-gray-900 w-14">
                  BTW
                </th>
                <th className="text-right py-3 px-2 font-semibold text-gray-900 w-24">
                  Bedrag
                </th>
              </tr>
            </thead>
            <tbody>
              {(invoice.lines || []).map((line, index) => (
                <tr key={index} className="border-b border-gray-200">
                  <td className="py-2 px-2 text-center">
                    {line.image_url ? (
                      <img
                        src={line.image_url}
                        alt={line.description}
                        className="w-12 h-12 object-cover rounded border border-gray-200 mx-auto"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-100 rounded border border-gray-200 flex items-center justify-center mx-auto">
                        <span className="text-gray-400 text-xs">—</span>
                      </div>
                    )}
                  </td>
                  <td className="py-2 px-2 text-gray-800 text-sm">
                    {line.description}
                  </td>
                  <td className="text-right py-2 px-2 text-gray-700 text-sm">
                    {line.quantity} {line.unit}
                  </td>
                  <td className="text-right py-2 px-2 font-mono text-gray-700 text-sm">
                    {formatCurrency(line.unit_price)}
                  </td>
                  <td className="text-right py-2 px-2 text-gray-700 text-sm">
                    {line.vat_rate}%
                  </td>
                  <td className="text-right py-2 px-2 font-mono font-medium text-gray-900 text-sm">
                    {formatCurrency(
                      line.line_gross ||
                        line.quantity *
                          line.unit_price *
                          (1 + line.vat_rate / 100)
                    )}
                  </td>
                </tr>
              ))}
              {(!invoice.lines || invoice.lines.length === 0) && (
                <tr className="border-b border-gray-200">
                  <td
                    colSpan={6}
                    className="py-4 px-4 text-center text-gray-400 italic"
                  >
                    Geen items toegevoegd
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Totals */}
          <div className="flex justify-end mb-8">
            <div className="w-72">
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="text-gray-600">Subtotaal (excl. BTW):</span>
                <span className="font-mono">
                  {formatCurrency(invoice.total_net || 0)}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="text-gray-600">BTW:</span>
                <span className="font-mono">
                  {formatCurrency(invoice.total_vat || 0)}
                </span>
              </div>
              {invoice.is_reverse_charge && (
                <div className="py-2 text-xs text-amber-700 bg-amber-50 px-2 rounded border border-amber-200">
                  ⚠️ BTW verlegd (reverse charge)
                </div>
              )}
              <div className="flex justify-between py-3 border-t-2 border-gray-900 mt-2">
                <span className="text-lg font-bold text-gray-900">Totaal:</span>
                <span
                  className="text-lg font-bold font-mono"
                  style={{ color: primaryColor }}
                >
                  {formatCurrency(invoice.total_gross || 0)}
                </span>
              </div>
            </div>
          </div>

          {/* Bank Details & QR Code */}
          <div className="flex justify-between items-end mt-auto pt-8 border-t border-gray-200">
            <div className="space-y-2">
              <h3 className="font-semibold text-gray-900">Betalingsgegevens</h3>
              <div className="text-sm text-gray-700 space-y-1">
                <p>
                  <span className="text-gray-500">IBAN:</span>{" "}
                  <span className="font-mono font-medium">{company?.iban}</span>
                </p>
                {company?.bic && (
                  <p>
                    <span className="text-gray-500">BIC:</span>{" "}
                    <span className="font-mono">{company.bic}</span>
                  </p>
                )}
                <p>
                  <span className="text-gray-500">T.n.v.:</span> {company?.name}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Vermeld het factuurnummer bij betaling:{" "}
                  {invoice.invoice_number}
                </p>
              </div>
            </div>

            {showQRCode && qrCodeUrl && (
              <div className="text-center">
                <img src={qrCodeUrl} alt="SEPA QR" className="w-32 h-32" />
                <p className="text-xs text-gray-500 mt-1">Scan om te betalen</p>
              </div>
            )}
          </div>

          {/* Footer */}
          {invoice.notes && (
            <div className="mt-8 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">{invoice.notes}</p>
            </div>
          )}

          <div className="mt-8 text-center text-sm text-gray-500">
            Bedankt voor uw vertrouwen!
          </div>
        </div>
      </div>
    </div>
  );
}

export default InvoiceTemplatePreview;
