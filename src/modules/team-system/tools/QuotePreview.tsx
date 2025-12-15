import React from "react";
import { Quote, CompanyProfile, QuoteStyle, defaultQuoteStyle } from "./types";
import {
  Phone,
  Mail,
  Globe,
  MapPin,
  Building2,
  Calendar,
  FileText,
  Package,
  Wrench,
} from "lucide-react";

interface Props {
  quote: Quote;
  companyProfile?: CompanyProfile;
  style?: QuoteStyle;
}

export const QuotePreview: React.FC<Props> = ({
  quote,
  companyProfile,
  style = defaultQuoteStyle,
}) => {
  // Group items by category
  const categories = Array.from(
    new Set(quote.items.map((i) => i.category || "Algemeen"))
  );

  const calculateTotal = (rate: number | null) => {
    return quote.items.reduce((acc, item) => {
      if (rate !== null && item.vatRate !== rate) return acc;
      return acc + item.quantity * item.pricePerUnit;
    }, 0);
  };

  const totalNet = calculateTotal(null);
  const totalVat9 = calculateTotal(9) * 0.09;
  const totalVat21 = calculateTotal(21) * 0.21;
  const grandTotal = totalNet + totalVat9 + totalVat21;

  // Internal Cost Calculations
  const totalMaterialCost = quote.materials.reduce(
    (acc, m) => acc + m.quantity * (m.estimatedCost || 0),
    0
  );
  const totalToolCost = quote.tools.reduce(
    (acc, t) => acc + t.quantity * (t.estimatedCost || 0),
    0
  );
  const totalInternalCost = totalMaterialCost + totalToolCost;

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("nl-NL", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Helper to get company data or defaults
  const comp = {
    name: companyProfile?.name || "Vakman Bouw B.V.",
    address: companyProfile?.address || "Bouwstraat 123",
    city:
      companyProfile?.postalCode && companyProfile?.city
        ? `${companyProfile.postalCode} ${companyProfile.city}`
        : "1000 AA Amsterdam",
    kvk: companyProfile?.kvk || "12345678",
    btw: companyProfile?.btw || "NL123456789B01",
    iban: companyProfile?.iban || "",
    bank: companyProfile?.bankName || "",
    logo: companyProfile?.logoUrl || null,
    email: companyProfile?.email || "",
    phone: companyProfile?.phone || "",
    website: companyProfile?.website || "",
  };

  const showPrices = quote.showItemPrices !== false; // Default to true if undefined

  // Dynamic style variables from props
  const dynamicStyles = {
    primaryColor: style.primaryColor,
    secondaryColor: style.secondaryColor,
    accentColor: style.accentColor,
    textColor: style.textColor,
    backgroundColor: style.backgroundColor,
    headerBgColor: style.headerBgColor,
    fontFamily: style.fontFamily,
    headingSize: `${style.headingSize}px`,
    bodySize: `${style.bodySize}px`,
    smallSize: `${style.smallSize}px`,
    logoSize: `${style.logoSize}%`,
    headerHeight: `${style.headerHeight}px`,
    borderRadius: `${style.borderRadius}px`,
    imageSize: `${style.imageSize}%`,
  };

  return (
    <div
      className="print:block print:w-full"
      style={{ fontFamily: dynamicStyles.fontFamily }}
    >
      {/* PAGE 1: CLIENT QUOTE */}
      <div
        className="mx-auto shadow-2xl print:shadow-none max-w-[210mm] min-h-[297mm] relative overflow-hidden flex flex-col"
        style={{ backgroundColor: dynamicStyles.backgroundColor }}
      >
        {/* --- GEOMETRIC BACKGROUND ACCENTS --- */}
        {/* Top Right Gradient Shape */}
        {style.showHeader && (
          <div
            className="absolute top-0 right-0 w-[80%]"
            style={{
              height: dynamicStyles.headerHeight,
              background: `linear-gradient(to bottom left, ${style.headerBgColor}, ${style.secondaryColor}, ${style.primaryColor})`,
              clipPath: "polygon(20% 0%, 100% 0, 100% 100%, 0% 100%)",
            }}
          />
        )}
        {/* Subtle Texture Overlay */}
        {style.showHeader && (
          <div
            className="absolute top-0 right-0 w-[80%] opacity-10"
            style={{
              height: dynamicStyles.headerHeight,
              clipPath: "polygon(20% 0%, 100% 0, 100% 100%, 0% 100%)",
              backgroundImage:
                "radial-gradient(circle, #ffffff 1px, transparent 1px)",
              backgroundSize: "20px 20px",
            }}
          />
        )}

        {/* Bottom Left Accent */}
        <div
          className="absolute bottom-0 left-0 w-[300px] h-[100px] bg-gray-50"
          style={{ clipPath: "polygon(0 0, 0% 100%, 100% 100%)" }}
        />

        {/* --- CONTENT CONTAINER --- */}
        <div className="relative z-10 p-[15mm] flex flex-col flex-1 h-full">
          {/* 1. HEADER SECTION */}
          <div className="flex justify-between items-start mb-16 pt-8">
            {/* Left: Company Logo/Name */}
            <div className="w-1/2 pt-4">
              {style.showLogo &&
                (comp.logo ? (
                  <img
                    src={comp.logo}
                    alt="Logo"
                    className="w-auto object-contain mb-4"
                    style={{
                      height: `${style.logoSize}px`,
                      maxHeight: "120px",
                    }}
                  />
                ) : (
                  <div className="flex items-center gap-2 mb-6">
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-2xl shadow-lg"
                      style={{
                        backgroundColor: style.primaryColor,
                        borderRadius: dynamicStyles.borderRadius,
                      }}
                    >
                      {comp.name.charAt(0)}
                    </div>
                    <div
                      className="text-2xl font-bold tracking-tight leading-none"
                      style={{ color: style.textColor }}
                    >
                      {comp.name}
                    </div>
                  </div>
                ))}
              <div className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-2">
                Uw Partner
              </div>
              <div
                className="text-xs space-y-1 font-medium leading-relaxed"
                style={{ color: style.textColor, opacity: 0.7 }}
              >
                <div className="flex items-center gap-2">
                  <MapPin size={12} style={{ color: style.accentColor }} />{" "}
                  {comp.address}, {comp.city}
                </div>
                {comp.phone && (
                  <div className="flex items-center gap-2">
                    <Phone size={12} style={{ color: style.accentColor }} />{" "}
                    {comp.phone}
                  </div>
                )}
                {comp.email && (
                  <div className="flex items-center gap-2">
                    <Mail size={12} style={{ color: style.accentColor }} />{" "}
                    {comp.email}
                  </div>
                )}
                {comp.website && (
                  <div className="flex items-center gap-2">
                    <Globe size={12} style={{ color: style.accentColor }} />{" "}
                    {comp.website}
                  </div>
                )}
              </div>
            </div>

            {/* Right: Big Title & Meta */}
            <div className="w-1/2 text-right text-white">
              <h1 className="text-6xl font-black tracking-tighter mb-6 opacity-95">
                OFFERTE
              </h1>

              <div className="flex flex-col items-end gap-3">
                <div className="bg-white/10 backdrop-blur-sm p-3 rounded-lg border border-white/20 w-fit">
                  <div className="text-[10px] uppercase tracking-widest opacity-70 mb-0.5">
                    Offertenummer
                  </div>
                  <div className="text-xl font-bold font-mono">
                    {quote.referenceNumber}
                  </div>
                </div>
                <div className="flex gap-6 text-sm font-medium opacity-90">
                  <div>
                    <span className="opacity-60 block text-[10px] uppercase">
                      Datum
                    </span>
                    {formatDate(quote.date)}
                  </div>
                  {quote.executionDate && (
                    <div>
                      <span className="opacity-60 block text-[10px] uppercase">
                        Uitvoering
                      </span>
                      {formatDate(quote.executionDate)}
                    </div>
                  )}
                  <div>
                    <span className="opacity-60 block text-[10px] uppercase">
                      Geldig tot
                    </span>
                    {formatDate(
                      new Date(
                        new Date(quote.date).getTime() +
                          30 * 24 * 60 * 60 * 1000
                      ).toISOString()
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 2. CLIENT & PROJECT GRID */}
          <div
            className="rounded-2xl p-8 mb-12 border shadow-sm"
            style={{
              backgroundColor: `${style.secondaryColor}10`,
              borderColor: `${style.secondaryColor}30`,
              borderRadius: dynamicStyles.borderRadius,
            }}
          >
            <div className="grid grid-cols-2 gap-12 relative">
              {/* Center Divider Line */}
              <div
                className="absolute left-1/2 top-2 bottom-2 w-px transform -translate-x-1/2"
                style={{ backgroundColor: `${style.primaryColor}30` }}
              ></div>

              {/* Client */}
              <div>
                <div
                  className="flex items-center gap-2 font-bold text-xs uppercase tracking-widest mb-4"
                  style={{ color: style.primaryColor }}
                >
                  <Building2 size={14} /> Opdrachtgever
                </div>
                <div
                  className="text-lg font-bold mb-1"
                  style={{ color: style.textColor }}
                >
                  {quote.client.name}
                </div>
                <div
                  className="text-sm leading-relaxed"
                  style={{ color: style.textColor, opacity: 0.7 }}
                >
                  {quote.client.address}
                  <br />
                  {quote.client.postalCode} {quote.client.city}
                </div>
              </div>

              {/* Project */}
              <div>
                <div
                  className="flex items-center gap-2 font-bold text-xs uppercase tracking-widest mb-4"
                  style={{ color: style.primaryColor }}
                >
                  <FileText size={14} /> Projectdetails
                </div>
                <div
                  className="text-lg font-bold mb-1"
                  style={{ color: style.textColor }}
                >
                  {quote.subject}
                </div>
                <div
                  className="text-sm italic"
                  style={{ color: style.textColor, opacity: 0.7 }}
                >
                  Locatie: {quote.location || "Conform opdrachtgever"}
                </div>
              </div>
            </div>
          </div>

          {/* 3. INTRO */}
          <div
            className="mb-10 px-2"
            style={{ marginBottom: `${style.sectionSpacing}px` }}
          >
            <p
              className="text-sm leading-7 text-justify whitespace-pre-line"
              style={{
                color: style.textColor,
                fontSize: dynamicStyles.bodySize,
              }}
            >
              {quote.introText}
            </p>
          </div>

          {/* 4. ITEMS TABLE */}
          <div className="mb-8">
            {categories.map((cat, catIdx) => {
              const catItems = quote.items.filter(
                (i) => (i.category || "Algemeen") === cat
              );
              return (
                <div key={cat} className="mb-10 break-inside-avoid">
                  <div className="flex items-center gap-4 mb-4">
                    <div
                      className="w-2 h-8 rounded-full"
                      style={{ backgroundColor: style.primaryColor }}
                    ></div>
                    <h3
                      className="font-bold text-xl uppercase tracking-tight"
                      style={{
                        color: style.textColor,
                        fontSize: dynamicStyles.headingSize,
                      }}
                    >
                      {cat}
                    </h3>
                    <div
                      className="h-px flex-1"
                      style={{ backgroundColor: `${style.tableBorderColor}50` }}
                    ></div>
                  </div>

                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr
                        className="text-[10px] uppercase tracking-wider border-b"
                        style={{
                          borderColor: style.tableBorderColor,
                          color: `${style.textColor}80`,
                        }}
                      >
                        <th className="py-3 font-semibold w-2/3 pl-2">
                          Omschrijving
                        </th>
                        <th className="py-3 font-semibold text-right">
                          Aantal
                        </th>
                        <th className="py-3 font-semibold text-center">
                          Eenh.
                        </th>
                        {showPrices && (
                          <th className="py-3 font-semibold text-right">
                            Prijs
                          </th>
                        )}
                        {showPrices && (
                          <th className="py-3 font-semibold text-right pr-2">
                            Totaal
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {catItems.map((item, idx) => (
                        <tr
                          key={item.id}
                          className="border-b group hover:bg-slate-50/50 transition-colors"
                          style={{ borderColor: `${style.tableBorderColor}30` }}
                        >
                          <td
                            className="py-4 pl-2 pr-6 align-top leading-relaxed whitespace-pre-wrap transition-colors"
                            style={{
                              color: style.textColor,
                              fontSize: dynamicStyles.bodySize,
                            }}
                          >
                            <div>{item.description}</div>
                            {item.image && (
                              <div className="mt-3">
                                <img
                                  src={item.image}
                                  alt="detail"
                                  className="rounded border shadow-sm"
                                  style={{
                                    maxHeight: `${style.imageSize * 0.4}mm`,
                                    maxWidth: `${style.imageSize * 0.8}mm`,
                                    borderColor: style.tableBorderColor,
                                    borderRadius: `${style.borderRadius / 2}px`,
                                  }}
                                />
                              </div>
                            )}
                          </td>
                          <td
                            className="py-4 text-right align-top font-medium"
                            style={{ color: style.textColor }}
                          >
                            {item.quantity}
                          </td>
                          <td
                            className="py-4 text-center align-top text-xs uppercase"
                            style={{ color: `${style.textColor}80` }}
                          >
                            {item.unit}
                          </td>
                          {showPrices && (
                            <td
                              className="py-4 text-right align-top"
                              style={{ color: style.textColor }}
                            >
                              € {item.pricePerUnit.toFixed(2)}
                            </td>
                          )}
                          {showPrices && (
                            <td
                              className="py-4 text-right align-top font-bold pr-2"
                              style={{ color: style.textColor }}
                            >
                              € {(item.quantity * item.pricePerUnit).toFixed(2)}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })}
          </div>

          {/* 5. TOTALS CARD */}
          {/* Only show totals if we are showing prices generally */}
          {showPrices && (
            <div className="flex justify-end mb-16 break-inside-avoid relative z-10">
              <div
                className="text-white p-8 w-80 shadow-2xl relative overflow-hidden"
                style={{
                  backgroundColor: style.headerBgColor,
                  borderRadius: dynamicStyles.borderRadius,
                }}
              >
                {/* Decorative Circle */}
                <div
                  className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-50"
                  style={{ backgroundColor: style.primaryColor }}
                ></div>

                <div className="space-y-3 relative z-10">
                  <div className="flex justify-between text-white/70 text-sm">
                    <span>Subtotaal</span>
                    <span>€ {totalNet.toFixed(2)}</span>
                  </div>
                  {totalVat9 > 0 && (
                    <div className="flex justify-between text-white/70 text-sm">
                      <span>BTW 9%</span>
                      <span>€ {totalVat9.toFixed(2)}</span>
                    </div>
                  )}
                  {totalVat21 > 0 && (
                    <div className="flex justify-between text-white/70 text-sm">
                      <span>BTW 21%</span>
                      <span>€ {totalVat21.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="h-px bg-white/20 my-2"></div>
                  <div className="flex justify-between items-end">
                    <span
                      className="text-lg font-bold uppercase tracking-widest"
                      style={{ color: style.accentColor }}
                    >
                      Totaal
                    </span>
                    <span className="text-3xl font-black tracking-tight text-white">
                      € {grandTotal.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Spacer to push footer down */}
          <div className="flex-1"></div>

          {/* 6. FOOTER */}
          {style.showFooter && (
            <div
              className="border-t pt-8 pb-4 text-center relative"
              style={{ borderColor: `${style.tableBorderColor}50` }}
            >
              <div
                className="flex justify-center gap-8 text-[10px] uppercase tracking-widest font-medium mb-4"
                style={{
                  color: `${style.textColor}60`,
                  fontSize: dynamicStyles.smallSize,
                }}
              >
                <span>KvK: {comp.kvk}</span>
                <span>BTW: {comp.btw}</span>
                {comp.iban && (
                  <span className="flex items-center gap-1">
                    IBAN: {comp.iban}
                    {comp.bank && (
                      <span style={{ color: `${style.textColor}40` }}>
                        ({comp.bank})
                      </span>
                    )}
                  </span>
                )}
              </div>
              <p
                className="text-xs italic"
                style={{ color: `${style.textColor}60` }}
              >
                Op al onze werkzaamheden zijn onze algemene voorwaarden van
                toepassing.
              </p>
              <div
                className="w-full h-1 absolute bottom-0 left-0 opacity-30"
                style={{
                  background: `linear-gradient(to right, ${style.primaryColor}, ${style.accentColor}, ${style.primaryColor})`,
                }}
              ></div>
            </div>
          )}
        </div>
      </div>

      {/* PAGE 2: PHOTOS (Optional) */}
      {quote.images.length > 0 && (
        <div
          className="mx-auto shadow-2xl print:shadow-none max-w-[210mm] min-h-[297mm] p-[15mm] relative overflow-hidden break-before-page"
          style={{ backgroundColor: style.backgroundColor }}
        >
          {/* Header Minimal */}
          <div className="flex items-center gap-4 mb-12">
            <div
              className="w-2 h-12"
              style={{ backgroundColor: style.primaryColor }}
            ></div>
            <div>
              <h2
                className="text-3xl font-black uppercase tracking-tight"
                style={{
                  color: style.textColor,
                  fontSize: dynamicStyles.headingSize,
                }}
              >
                Fotodocumentatie
              </h2>
              <p
                style={{
                  color: `${style.textColor}60`,
                  fontSize: dynamicStyles.smallSize,
                }}
              >
                {quote.referenceNumber} - {quote.subject}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8">
            {quote.images.map((img) => (
              <div key={img.id} className="break-inside-avoid group">
                <div
                  className="border-8 shadow-lg overflow-hidden relative aspect-[4/3]"
                  style={{
                    borderColor: `${style.secondaryColor}20`,
                    backgroundColor: style.backgroundColor,
                    borderRadius: dynamicStyles.borderRadius,
                  }}
                >
                  <img
                    src={img.url}
                    className="object-cover w-full h-full"
                    alt={img.caption}
                  />
                </div>
                <div className="mt-4 px-2">
                  <h4
                    className="font-bold text-sm mb-1 pl-2 uppercase border-l-2"
                    style={{
                      color: style.textColor,
                      borderColor: style.primaryColor,
                    }}
                  >
                    {img.caption}
                  </h4>
                  {img.description && (
                    <p
                      className="text-xs pl-2.5 leading-relaxed"
                      style={{ color: `${style.textColor}70` }}
                    >
                      {img.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PAGE 3: INTERNAL WERKBON / COST SHEET */}
      {(quote.materials.length > 0 || quote.tools.length > 0) && (
        <div
          className="mx-auto shadow-2xl print:shadow-none max-w-[210mm] min-h-[297mm] relative overflow-hidden break-before-page flex flex-col"
          style={{ backgroundColor: style.backgroundColor }}
        >
          {/* Header Accent */}
          <div
            className="absolute top-0 left-0 w-full h-4"
            style={{ backgroundColor: style.headerBgColor }}
          ></div>

          <div className="p-[15mm] flex-1 flex flex-col">
            {/* Header Internal */}
            <div className="flex justify-between items-end mb-12 mt-4">
              <div>
                <div
                  className="text-[10px] uppercase tracking-[0.2em] font-bold mb-1"
                  style={{ color: style.accentColor }}
                >
                  Intern Document
                </div>
                <div
                  className="font-black text-4xl uppercase tracking-tighter"
                  style={{ color: style.textColor }}
                >
                  WERKBON & CALCULATIE
                </div>
              </div>
              <div className="text-right">
                <div
                  className="font-mono font-bold text-xl px-3 py-1"
                  style={{
                    color: style.textColor,
                    backgroundColor: `${style.secondaryColor}20`,
                    borderRadius: `${style.borderRadius / 2}px`,
                  }}
                >
                  {quote.referenceNumber}
                </div>
                <div
                  className="text-[10px] mt-1 uppercase"
                  style={{ color: `${style.textColor}60` }}
                >
                  Voor intern gebruik
                </div>
              </div>
            </div>

            {/* MATERIALS TABLE */}
            {quote.materials.length > 0 && (
              <div className="mb-10">
                <div className="flex items-center gap-4 mb-4">
                  <div
                    className="w-2 h-8 rounded-full"
                    style={{ backgroundColor: style.accentColor }}
                  ></div>
                  <h3
                    className="font-bold text-xl uppercase tracking-tight flex items-center gap-2"
                    style={{ color: style.textColor }}
                  >
                    <Package style={{ color: style.accentColor }} size={24} />{" "}
                    Materialen
                  </h3>
                  <div
                    className="h-px flex-1"
                    style={{ backgroundColor: `${style.tableBorderColor}50` }}
                  ></div>
                </div>

                <table className="w-full text-left text-sm border-collapse">
                  <thead
                    className="uppercase font-bold tracking-wider text-xs"
                    style={{
                      backgroundColor: `${style.accentColor}15`,
                      color: style.headerBgColor,
                    }}
                  >
                    <tr>
                      <th className="px-4 py-3 w-12 text-center">Img</th>
                      <th className="px-4 py-3">Artikel / Omschrijving</th>
                      <th className="px-4 py-3 text-right">Aantal</th>
                      <th className="px-4 py-3 text-center">Eenh.</th>
                      {quote.showMaterialPrices !== false && (
                        <th className="px-4 py-3 text-right">Kostprijs</th>
                      )}
                      {quote.showMaterialPrices !== false && (
                        <th className="px-4 py-3 text-right">Totaal</th>
                      )}
                      <th className="px-4 py-3 w-10 text-center">OK</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quote.materials.map((m, idx) => (
                      <tr
                        key={idx}
                        className="border-b"
                        style={{ borderColor: `${style.tableBorderColor}30` }}
                      >
                        <td className="px-4 py-3 text-center align-middle">
                          {m.imageUrl && !m.imageUrl.startsWith("blob:") ? (
                            <img
                              src={m.imageUrl}
                              className="h-8 w-8 object-cover rounded border"
                              style={{ borderColor: style.tableBorderColor }}
                              alt=""
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display =
                                  "none";
                              }}
                            />
                          ) : (
                            <div
                              className="h-8 w-8 rounded flex items-center justify-center text-[10px]"
                              style={{
                                backgroundColor: `${style.secondaryColor}20`,
                                color: `${style.textColor}40`,
                              }}
                            >
                              •
                            </div>
                          )}
                        </td>
                        <td
                          className="px-4 py-3 font-semibold"
                          style={{ color: style.textColor }}
                        >
                          {m.name}
                          {m.notes && (
                            <div
                              className="text-xs font-normal italic mt-0.5"
                              style={{ color: `${style.textColor}60` }}
                            >
                              {m.notes}
                            </div>
                          )}
                        </td>
                        <td
                          className="px-4 py-3 text-right font-mono"
                          style={{ color: `${style.textColor}90` }}
                        >
                          {m.quantity}
                        </td>
                        <td
                          className="px-4 py-3 text-center text-xs uppercase"
                          style={{ color: `${style.textColor}60` }}
                        >
                          {m.unit}
                        </td>
                        {quote.showMaterialPrices !== false && (
                          <td
                            className="px-4 py-3 text-right"
                            style={{ color: `${style.textColor}70` }}
                          >
                            € {(m.estimatedCost || 0).toFixed(2)}
                          </td>
                        )}
                        {quote.showMaterialPrices !== false && (
                          <td
                            className="px-4 py-3 text-right font-medium"
                            style={{ color: style.accentColor }}
                          >
                            € {(m.quantity * (m.estimatedCost || 0)).toFixed(2)}
                          </td>
                        )}
                        <td
                          className="px-4 py-3 text-center print:border-l"
                          style={{ borderColor: `${style.tableBorderColor}30` }}
                        >
                          <div
                            className="w-5 h-5 border-2 rounded mx-auto"
                            style={{ borderColor: `${style.textColor}40` }}
                          ></div>
                        </td>
                      </tr>
                    ))}
                    {quote.showMaterialPrices !== false && (
                      <tr
                        className="font-bold border-t-2"
                        style={{
                          backgroundColor: `${style.accentColor}10`,
                          borderColor: `${style.accentColor}30`,
                        }}
                      >
                        <td
                          colSpan={5}
                          className="px-4 py-3 text-right uppercase text-xs tracking-wider"
                          style={{ color: style.headerBgColor }}
                        >
                          Subtotaal Materialen
                        </td>
                        <td
                          className="px-4 py-3 text-right"
                          style={{ color: style.headerBgColor }}
                        >
                          € {totalMaterialCost.toFixed(2)}
                        </td>
                        <td></td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* TOOLS TABLE */}
            {quote.tools.length > 0 && (
              <div className="mb-10">
                <div className="flex items-center gap-4 mb-4">
                  <div
                    className="w-2 h-8 rounded-full"
                    style={{ backgroundColor: style.secondaryColor }}
                  ></div>
                  <h3
                    className="font-bold text-xl uppercase tracking-tight flex items-center gap-2"
                    style={{ color: style.textColor }}
                  >
                    <Wrench style={{ color: style.secondaryColor }} size={24} />{" "}
                    Gereedschap & Materieel
                  </h3>
                  <div
                    className="h-px flex-1"
                    style={{ backgroundColor: `${style.tableBorderColor}50` }}
                  ></div>
                </div>

                <table className="w-full text-left text-sm border-collapse">
                  <thead
                    className="uppercase font-bold tracking-wider text-xs"
                    style={{
                      backgroundColor: `${style.secondaryColor}15`,
                      color: style.headerBgColor,
                    }}
                  >
                    <tr>
                      <th className="px-4 py-3 w-12 text-center">Img</th>
                      <th className="px-4 py-3">Item / Omschrijving</th>
                      <th className="px-4 py-3 text-right">Aantal</th>
                      <th className="px-4 py-3 text-center">Eenh.</th>
                      {quote.showToolPrices !== false && (
                        <th className="px-4 py-3 text-right">Kostprijs</th>
                      )}
                      {quote.showToolPrices !== false && (
                        <th className="px-4 py-3 text-right">Totaal</th>
                      )}
                      <th className="px-4 py-3 w-10 text-center">OK</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quote.tools.map((t, idx) => (
                      <tr
                        key={idx}
                        className="border-b"
                        style={{ borderColor: `${style.tableBorderColor}30` }}
                      >
                        <td className="px-4 py-3 text-center align-middle">
                          {t.imageUrl && !t.imageUrl.startsWith("blob:") ? (
                            <img
                              src={t.imageUrl}
                              className="h-8 w-8 object-cover rounded border"
                              style={{ borderColor: style.tableBorderColor }}
                              alt=""
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display =
                                  "none";
                              }}
                            />
                          ) : (
                            <div
                              className="h-8 w-8 rounded flex items-center justify-center text-[10px]"
                              style={{
                                backgroundColor: `${style.secondaryColor}20`,
                                color: `${style.textColor}40`,
                              }}
                            >
                              •
                            </div>
                          )}
                        </td>
                        <td
                          className="px-4 py-3 font-semibold"
                          style={{ color: style.textColor }}
                        >
                          {t.name}
                          {t.notes && (
                            <div
                              className="text-xs font-normal italic mt-0.5"
                              style={{ color: `${style.textColor}60` }}
                            >
                              {t.notes}
                            </div>
                          )}
                        </td>
                        <td
                          className="px-4 py-3 text-right font-mono"
                          style={{ color: `${style.textColor}90` }}
                        >
                          {t.quantity}
                        </td>
                        <td
                          className="px-4 py-3 text-center text-xs uppercase"
                          style={{ color: `${style.textColor}60` }}
                        >
                          {t.unit}
                        </td>
                        {quote.showToolPrices !== false && (
                          <td
                            className="px-4 py-3 text-right"
                            style={{ color: `${style.textColor}70` }}
                          >
                            € {(t.estimatedCost || 0).toFixed(2)}
                          </td>
                        )}
                        {quote.showToolPrices !== false && (
                          <td
                            className="px-4 py-3 text-right font-medium"
                            style={{ color: style.secondaryColor }}
                          >
                            € {(t.quantity * (t.estimatedCost || 0)).toFixed(2)}
                          </td>
                        )}
                        <td
                          className="px-4 py-3 text-center print:border-l"
                          style={{ borderColor: `${style.tableBorderColor}30` }}
                        >
                          <div
                            className="w-5 h-5 border-2 rounded mx-auto"
                            style={{ borderColor: `${style.textColor}40` }}
                          ></div>
                        </td>
                      </tr>
                    ))}
                    {quote.showToolPrices !== false && (
                      <tr
                        className="font-bold border-t-2"
                        style={{
                          backgroundColor: `${style.secondaryColor}10`,
                          borderColor: `${style.secondaryColor}30`,
                        }}
                      >
                        <td
                          colSpan={5}
                          className="px-4 py-3 text-right uppercase text-xs tracking-wider"
                          style={{ color: style.headerBgColor }}
                        >
                          Subtotaal Gereedschap
                        </td>
                        <td
                          className="px-4 py-3 text-right"
                          style={{ color: style.headerBgColor }}
                        >
                          € {totalToolCost.toFixed(2)}
                        </td>
                        <td></td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            <div className="mt-auto">
              <div className="flex justify-end mb-8">
                <div
                  className="text-white p-4 w-64 shadow-lg"
                  style={{
                    backgroundColor: style.headerBgColor,
                    borderRadius: dynamicStyles.borderRadius,
                  }}
                >
                  <div className="flex justify-between items-center text-sm">
                    <span className="opacity-70">Totaal Inkoop/Kosten</span>
                    <span className="font-bold text-lg">
                      €{" "}
                      {(
                        (quote.showMaterialPrices !== false
                          ? totalMaterialCost
                          : 0) +
                        (quote.showToolPrices !== false ? totalToolCost : 0)
                      ).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <div
                className="border-2 border-dashed p-6 min-h-[120px]"
                style={{
                  borderColor: `${style.tableBorderColor}60`,
                  backgroundColor: `${style.secondaryColor}10`,
                  borderRadius: dynamicStyles.borderRadius,
                }}
              >
                <h4
                  className="font-bold text-xs uppercase tracking-widest mb-2"
                  style={{ color: `${style.textColor}60` }}
                >
                  Notities & Opmerkingen Uitvoering
                </h4>
                <div
                  className="text-sm whitespace-pre-wrap leading-relaxed"
                  style={{ color: style.textColor }}
                >
                  {quote.notes}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
