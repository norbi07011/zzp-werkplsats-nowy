// =====================================================
// BTW AANGIFTE (VAT DECLARATIONS) PAGE
// =====================================================
// Quarterly VAT declarations with auto-calculation
// Adapted from NORBS for ZZP Werkplaats (SIMPLIFIED)
// =====================================================

import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from '../i18n';
import { useSupabaseBTW, useSupabaseInvoices, useSupabaseExpenses, useSupabaseKilometers } from '../hooks';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card } from '../components/ui/card';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { formatCurrency } from '../lib';
import { useAuth } from '../../../../contexts/AuthContext';
import type { BTWDeclaration, BTWPeriod, BTWStatus } from '../types';

interface BTWAangifteProps {
  onNavigate: (page: string, id?: string) => void;
}

const QUARTERS: BTWPeriod[] = ['Q1', 'Q2', 'Q3', 'Q4'];

const QUARTER_DATES = {
  Q1: { start: '-01-01', end: '-03-31' },
  Q2: { start: '-04-01', end: '-06-30' },
  Q3: { start: '-07-01', end: '-09-30' },
  Q4: { start: '-10-01', end: '-12-31' },
} as const;

export default function BTWAangifte({ onNavigate }: BTWAangifteProps) {
  const { user } = useAuth();
  const { t } = useTranslation();
  
  const currentYear = new Date().getFullYear();
  const currentQuarter = Math.ceil((new Date().getMonth() + 1) / 3) as 1 | 2 | 3 | 4;

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedPeriod, setSelectedPeriod] = useState<BTWPeriod>(`Q${currentQuarter}` as BTWPeriod);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDeclaration, setEditingDeclaration] = useState<BTWDeclaration | null>(null);

  const { declarations, createDeclaration, updateDeclaration, deleteDeclaration } = useSupabaseBTW(user?.id || '');
  const { invoices } = useSupabaseInvoices(user?.id || '');
  const { expenses } = useSupabaseExpenses(user?.id || '');
  const { entries: kilometers } = useSupabaseKilometers(user?.id || '', selectedYear);

  const [formData, setFormData] = useState({
    year: selectedYear,
    quarter: selectedPeriod,
    status: 'draft' as BTWStatus,
    revenue_21: 0,
    revenue_9: 0,
    revenue_0: 0,
    revenue_eu: 0,
    revenue_export: 0,
    input_vat: 0,
    output_vat_21: 0,
    output_vat_9: 0,
    total_output_vat: 0,
    balance: 0,
    notes: '',
  });

  // Calculate BTW data from invoices and expenses
  const calculatedData = useMemo(() => {
    const dates = QUARTER_DATES[selectedPeriod];
    const startDate = `${selectedYear}${dates.start}`;
    const endDate = `${selectedYear}${dates.end}`;

    console.log('🔍 BTW DEBUG - Filter params:', {
      selectedPeriod,
      selectedYear,
      startDate,
      endDate,
      totalInvoices: invoices?.length || 0,
      totalExpenses: expenses?.length || 0,
    });

    if (invoices && invoices.length > 0) {
      console.log('📋 Sample invoices:', invoices.slice(0, 3).map(inv => ({
        number: inv.invoice_number,
        date: inv.invoice_date,
        status: inv.status,
        net: inv.total_net,
        vat: inv.total_vat,
      })));
    }

    // Filter invoices for selected period (ALL invoices, like NORBS - no status filter)
    const periodInvoices = (invoices || []).filter((inv) => {
      const dateMatch = inv.invoice_date >= startDate && inv.invoice_date <= endDate;
      return dateMatch;
    });

    console.log('✅ Filtered invoices for BTW:', {
      count: periodInvoices.length,
      numbers: periodInvoices.map(i => i.invoice_number),
      totalNet: periodInvoices.reduce((sum, i) => sum + i.total_net, 0),
    });

    // Calculate revenue by VAT rate
    let vat21 = 0;
    let vat9 = 0;
    let vat0 = 0;
    let reverseCharge = 0;

    periodInvoices.forEach((inv) => {
      if (inv.is_reverse_charge) {
        reverseCharge += inv.total_net;
      } else {
        const vatRate = inv.total_net > 0 ? (inv.total_vat / inv.total_net) * 100 : 0;
        
        if (vatRate > 20) {
          vat21 += inv.total_net;
        } else if (vatRate > 8 && vatRate < 20) {
          vat9 += inv.total_net;
        } else {
          vat0 += inv.total_net;
        }
      }
    });

    // Filter expenses for selected period (ALL expenses, like NORBS)
    const periodExpenses = (expenses || []).filter((exp) => {
      return exp.date >= startDate && exp.date <= endDate;
    });

    // Calculate deductible VAT from expenses
    const deductibleVat = periodExpenses.reduce((sum, exp) => {
      if (exp.is_deductible) {
        return sum + exp.vat_amount * (exp.deductible_percentage / 100);
      }
      return sum;
    }, 0);

    // Filter kilometers for selected YEAR (annual data - "raz na rok do ksiegowego")
    const yearKilometers = (kilometers || []).filter((km) => {
      return km.date >= `${selectedYear}-01-01` && km.date <= `${selectedYear}-12-31`;
    });

    // Calculate VAT deduction from kilometers (21% VAT rate included in kilometer rate)
    const kilometerVatDeduction = yearKilometers.reduce((sum, km) => {
      // Kilometer rate already includes VAT component
      // For €0.23/km, approximately €0.04 is VAT (21%)
      const vatComponent = km.amount * 0.21; // 21% of total kilometer allowance
      return sum + vatComponent;
    }, 0);

    const totalKilometers = yearKilometers.reduce((sum, km) => sum + km.kilometers, 0);
    const totalKilometerAmount = yearKilometers.reduce((sum, km) => sum + km.amount, 0);

    // Total deductible VAT = expenses + kilometers
    const totalDeductibleVat = deductibleVat + kilometerVatDeduction;

    const vatToPay = vat21 * 0.21 + vat9 * 0.09;
    const balance = vatToPay - totalDeductibleVat;

    console.log('🚗 Kilometer BTW integration:', {
      yearKilometers: yearKilometers.length,
      totalKilometers,
      totalKilometerAmount,
      kilometerVatDeduction,
      expenseVat: deductibleVat,
      totalDeductibleVat,
    });

    return {
      invoices: { vat21, vat9, vat0, reverseCharge },
      expenses: { deductibleVat },
      kilometers: { 
        count: yearKilometers.length,
        totalKilometers, 
        totalAmount: totalKilometerAmount,
        vatDeduction: kilometerVatDeduction 
      },
      totalDeductibleVat,
      vatToPay,
      balance,
    };
  }, [selectedYear, selectedPeriod, invoices, expenses, kilometers]);

  // Get invoice count for selected quarter (ALL invoices, like NORBS)
  const quarterInvoiceCount = useMemo(() => {
    const dates = QUARTER_DATES[selectedPeriod];
    const startDate = `${selectedYear}${dates.start}`;
    const endDate = `${selectedYear}${dates.end}`;
    
    return (invoices || []).filter((inv) => {
      return inv.invoice_date >= startDate && 
             inv.invoice_date <= endDate;
    }).length;
  }, [selectedYear, selectedPeriod, invoices]);

  // Auto-fill form with calculated data
  const handleAutoFill = () => {
    // Validation warnings
    if (quarterInvoiceCount === 0) {
      const confirmProceed = confirm(
        `⚠️ UWAGA: Brak faktur w okresie ${selectedPeriod} ${selectedYear}.\n\n` +
        `System nie znalazł żadnych faktur w wybranym kwartale. ` +
        `Czy na pewno chcesz zapisać pustą deklarację?`
      );
      if (!confirmProceed) return;
    }

    const outputVat21 = Math.round(calculatedData.invoices.vat21 * 0.21 * 100) / 100;
    const outputVat9 = Math.round(calculatedData.invoices.vat9 * 0.09 * 100) / 100;
    const totalOutput = outputVat21 + outputVat9;
    const balance = totalOutput - calculatedData.totalDeductibleVat;

    setFormData({
      ...formData,
      year: selectedYear,
      quarter: selectedPeriod,
      revenue_21: Math.round(calculatedData.invoices.vat21 * 100) / 100,
      revenue_9: Math.round(calculatedData.invoices.vat9 * 100) / 100,
      revenue_0: Math.round(calculatedData.invoices.vat0 * 100) / 100,
      revenue_eu: Math.round(calculatedData.invoices.reverseCharge * 100) / 100,
      input_vat: Math.round(calculatedData.totalDeductibleVat * 100) / 100,
      output_vat_21: outputVat21,
      output_vat_9: outputVat9,
      total_output_vat: totalOutput,
      balance: balance,
    });
  };

  // Recalculate totals when form changes
  useEffect(() => {
    const outputVat21 = (formData.revenue_21 || 0) * 0.21;
    const outputVat9 = (formData.revenue_9 || 0) * 0.09;
    const totalOutput = outputVat21 + outputVat9;
    const balance = totalOutput - (formData.input_vat || 0);

    setFormData(prev => ({
      ...prev,
      output_vat_21: Math.round(outputVat21 * 100) / 100,
      output_vat_9: Math.round(outputVat9 * 100) / 100,
      total_output_vat: Math.round(totalOutput * 100) / 100,
      balance: Math.round(balance * 100) / 100,
    }));
  }, [formData.revenue_21, formData.revenue_9, formData.input_vat]);

  const handleOpenDialog = (declaration?: BTWDeclaration) => {
    if (declaration) {
      setEditingDeclaration(declaration);
      setFormData({
        year: declaration.year,
        quarter: declaration.quarter,
        status: declaration.status,
        revenue_21: declaration.revenue_21,
        revenue_9: declaration.revenue_9,
        revenue_0: declaration.revenue_0,
        revenue_eu: declaration.revenue_eu,
        revenue_export: declaration.revenue_export,
        input_vat: declaration.input_vat,
        output_vat_21: declaration.output_vat_21,
        output_vat_9: declaration.output_vat_9,
        total_output_vat: declaration.total_output_vat,
        balance: declaration.balance,
        notes: declaration.notes || '',
      });
    } else {
      setEditingDeclaration(null);
      setFormData({
        year: selectedYear,
        quarter: selectedPeriod,
        status: 'draft',
        revenue_21: 0,
        revenue_9: 0,
        revenue_0: 0,
        revenue_eu: 0,
        revenue_export: 0,
        input_vat: 0,
        output_vat_21: 0,
        output_vat_9: 0,
        total_output_vat: 0,
        balance: 0,
        notes: '',
      });
      handleAutoFill();
    }
    setIsDialogOpen(true);
  };

  const handleDownloadXML = () => {
    const quarterDates = QUARTER_DATES[selectedPeriod];
    
    // Generate XML in Dutch tax authority (Belastingdienst) format
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Aangifte xmlns="http://www.belastingdienst.nl/wus/btwv/2024">
  <Administratie>
    <Periode>
      <Kwartaal>${selectedPeriod}</Kwartaal>
      <Jaar>${selectedYear}</Jaar>
      <StartDatum>${selectedYear}${quarterDates.start}</StartDatum>
      <EindDatum>${selectedYear}${quarterDates.end}</EindDatum>
    </Periode>
  </Administratie>
  <Opgaaf>
    <!-- Prestaties belast met hoog tarief (21%) -->
    <Rubriek_1a>${calculatedData.invoices.vat21.toFixed(2)}</Rubriek_1a>
    <Rubriek_1b>${(calculatedData.invoices.vat21 * 0.21).toFixed(2)}</Rubriek_1b>
    
    <!-- Prestaties belast met laag tarief (9%) -->
    <Rubriek_1c>${calculatedData.invoices.vat9.toFixed(2)}</Rubriek_1c>
    <Rubriek_1d>${(calculatedData.invoices.vat9 * 0.09).toFixed(2)}</Rubriek_1d>
    
    <!-- Prestaties belast met 0% of niet bij u belast -->
    <Rubriek_3a>${calculatedData.invoices.vat0.toFixed(2)}</Rubriek_3a>
    
    <!-- Verlegd BTW (reverse charge) -->
    <Rubriek_1e>${calculatedData.invoices.reverseCharge.toFixed(2)}</Rubriek_1e>
    
    <!-- Voorbelasting (expenses + kilometers) -->
    <Rubriek_5b>${calculatedData.totalDeductibleVat.toFixed(2)}</Rubriek_5b>
    
    <!-- Te betalen/terug te ontvangen -->
    <Rubriek_5d>${calculatedData.vatToPay.toFixed(2)}</Rubriek_5d>
    <Rubriek_5e>${calculatedData.totalDeductibleVat.toFixed(2)}</Rubriek_5e>
    <Rubriek_5f>${calculatedData.balance.toFixed(2)}</Rubriek_5f>
  </Opgaaf>
  <Metadata>
    <GeneratedAt>${new Date().toISOString()}</GeneratedAt>
    <Source>ZZP Werkplaats Invoice System</Source>
    <KilometerDeduction>${calculatedData.kilometers.vatDeduction.toFixed(2)}</KilometerDeduction>
    <TotalKilometers>${calculatedData.kilometers.totalKilometers}</TotalKilometers>
  </Metadata>
</Aangifte>`;
    
    // Download as file
    const blob = new Blob([xml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `BTW_Aangifte_${selectedPeriod}_${selectedYear}.xml`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSave = async () => {
    try {
      const declarationData = {
        ...formData,
        user_id: user?.id || '',
        submitted_at: formData.status === 'submitted' || formData.status === 'paid' ? new Date().toISOString() : undefined,
        paid_at: formData.status === 'paid' ? new Date().toISOString() : undefined,
      };

      if (editingDeclaration) {
        await updateDeclaration(editingDeclaration.id, declarationData);
        alert('Deklaracja zaktualizowana');
      } else {
        await createDeclaration(declarationData);
        alert('Deklaracja utworzona');
      }
      
      setIsDialogOpen(false);
    } catch (error) {
      alert('Błąd zapisu deklaracji');
      console.error(error);
    }
  };

  const handleDelete = async (id: string, quarter: string) => {
    if (confirm(`Czy na pewno usunąć deklarację za ${quarter}/${formData.year}?`)) {
      try {
        await deleteDeclaration(id);
        alert('Deklaracja usunięta');
      } catch (error) {
        alert('Błąd usuwania');
        console.error(error);
      }
    }
  };

  const filteredDeclarations = useMemo(() => {
    return (declarations || [])
      .filter(d => d.year === selectedYear)
      .sort((a, b) => {
        const quarterA = parseInt(a.quarter.replace('Q', ''));
        const quarterB = parseInt(b.quarter.replace('Q', ''));
        return quarterB - quarterA;
      });
  }, [declarations, selectedYear]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 p-8 text-white shadow-2xl">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold tracking-tight mb-2">
                📊 {t.btw.title}
              </h1>
              <p className="text-blue-100 text-lg">Kwartalne rozliczenia VAT</p>
            </div>
            <Button 
              onClick={() => handleOpenDialog()}
              className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-2xl"
            >
              ➕ Nowa deklaracja
            </Button>
          </div>
        </div>

        {/* Calculation Summary - Auto-calculated from invoices & expenses */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-6 shadow-lg">
          <div className="flex items-start gap-4 mb-6">
            <span className="text-4xl">🤖</span>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Automatyczne Rozliczenie VAT - {selectedPeriod} / {selectedYear}
              </h3>
              <p className="text-gray-700 mb-3">
                System automatycznie zbiera dane ze <strong>wszystkich faktur</strong> i <strong>wydatków</strong> za wybrany kwartał.
                Sprawdź podsumowanie i pobierz plik XML do zgłoszenia.
              </p>
              {/* Data source info */}
              <div className="flex items-center gap-4 text-sm flex-wrap">
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full font-medium">
                  ✅ {quarterInvoiceCount} {quarterInvoiceCount === 1 ? 'faktura' : 'faktur'}
                </span>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full font-medium">
                  💳 {calculatedData.expenses.deductibleVat > 0 ? 'VAT do odliczenia dostępny' : 'Brak wydatków'}
                </span>
                <span className="px-3 py-1 bg-teal-100 text-teal-800 rounded-full font-medium">
                  🚗 {calculatedData.kilometers.totalKilometers.toLocaleString()} km (cały {selectedYear})
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card className="p-4 bg-gradient-to-br from-green-50 to-emerald-100 border-2 border-green-200">
              <div className="text-sm text-gray-600 mb-1">📈 Obroty 21% VAT</div>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(calculatedData.invoices.vat21)}</div>
              <div className="text-xs text-gray-500 mt-1">VAT: {formatCurrency(calculatedData.invoices.vat21 * 0.21)}</div>
            </Card>
            <Card className="p-4 bg-gradient-to-br from-blue-50 to-cyan-100 border-2 border-blue-200">
              <div className="text-sm text-gray-600 mb-1">📊 Obroty 9% VAT</div>
              <div className="text-2xl font-bold text-blue-600">{formatCurrency(calculatedData.invoices.vat9)}</div>
              <div className="text-xs text-gray-500 mt-1">VAT: {formatCurrency(calculatedData.invoices.vat9 * 0.09)}</div>
            </Card>
            <Card className="p-4 bg-gradient-to-br from-purple-50 to-pink-100 border-2 border-purple-200">
              <div className="text-sm text-gray-600 mb-1">💳 VAT wydatki</div>
              <div className="text-2xl font-bold text-purple-600">-{formatCurrency(calculatedData.expenses.deductibleVat)}</div>
              <div className="text-xs text-gray-500 mt-1">Z faktur kosztowych</div>
            </Card>
            <Card className="p-4 bg-gradient-to-br from-teal-50 to-cyan-100 border-2 border-teal-200">
              <div className="text-sm text-gray-600 mb-1">🚗 Kilometrówka {selectedYear}</div>
              <div className="text-2xl font-bold text-teal-600">-{formatCurrency(calculatedData.kilometers.vatDeduction)}</div>
              <div className="text-xs text-gray-500 mt-1">
                {calculatedData.kilometers.totalKilometers.toLocaleString()} km • {formatCurrency(calculatedData.kilometers.totalAmount)}
              </div>
              <div className="text-xs text-amber-600 mt-1 font-medium">
                📅 Dane roczne (cały {selectedYear})
              </div>
            </Card>
            <Card className="p-4 bg-gradient-to-br from-orange-50 to-red-100 border-2 border-orange-200">
              <div className="text-sm text-gray-600 mb-1">💰 Saldo do zapłaty</div>
              <div className="text-3xl font-bold text-red-600">{formatCurrency(calculatedData.balance)}</div>
              <div className="text-xs text-gray-500 mt-1">
                {calculatedData.balance > 0 ? 'Do zapłaty' : 'Do zwrotu'}
              </div>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="mt-6 flex gap-4">
            <Button 
              onClick={() => handleAutoFill()}
              className="flex-1 px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 font-bold text-lg shadow-xl"
            >
              💾 Zapisz Deklarację (Auto-wypełnione)
            </Button>
            <Button 
              onClick={handleDownloadXML}
              className="px-6 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 font-bold text-lg shadow-xl"
            >
              📥 Pobierz XML
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">Rok:</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="flex h-10 w-32 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
              >
                {[2024, 2025, 2026].map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">Kwartał:</label>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value as BTWPeriod)}
                className="flex h-10 w-32 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
              >
                {QUARTERS.map(q => (
                  <option key={q} value={q}>{q}</option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        {/* Declarations List */}
        <Card className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Deklaracje - {selectedYear}</h2>

          {filteredDeclarations.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">📊</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Brak deklaracji</h3>
              <p className="text-gray-600 mb-6">Utwórz pierwszą deklarację VAT dla roku {selectedYear}</p>
              <Button onClick={() => handleOpenDialog()} className="bg-blue-600 hover:bg-blue-700 text-white">
                ➕ Utwórz deklarację
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredDeclarations.map((declaration) => (
                <div
                  key={declaration.id}
                  className="grid grid-cols-6 gap-4 items-center p-4 bg-white/60 backdrop-blur-sm border border-white/50 rounded-xl hover:bg-white/80 hover:shadow-lg transition-all"
                >
                  <div className="font-bold text-lg text-gray-900">
                    {declaration.quarter} / {declaration.year}
                  </div>
                  <div>
                    <Badge variant={
                      declaration.status === 'paid' ? 'success' :
                      declaration.status === 'submitted' ? 'warning' : 
                      'secondary'
                    }>
                      {declaration.status === 'paid' ? '✅ Zapłacone' :
                       declaration.status === 'submitted' ? '📤 Wysłane' :
                       '📝 Draft'}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-600">Do zapłaty</div>
                    <div className="font-mono font-bold text-gray-900">{formatCurrency(declaration.total_output_vat)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-600">Do odliczenia</div>
                    <div className="font-mono font-bold text-purple-600">{formatCurrency(declaration.input_vat)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-600">Saldo</div>
                    <div className="font-mono font-bold text-red-600">{formatCurrency(declaration.balance)}</div>
                  </div>
                  <div className="text-right flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleOpenDialog(declaration)}
                      className="px-2 py-1 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors text-blue-700 text-xs font-medium"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(declaration.id, declaration.quarter)}
                      className="px-2 py-1 bg-red-100 hover:bg-red-200 rounded-lg transition-colors text-red-700 text-xs font-medium"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Dialog */}
      {isDialogOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b sticky top-0 bg-white z-10">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingDeclaration ? '✏️ Edytuj deklarację' : '➕ Nowa deklaracja VAT'}
              </h2>
              <p className="text-gray-600">{formData.quarter} / {formData.year}</p>
            </div>

            <div className="p-6 space-y-6">
              {/* Auto-fill button */}
              <Button onClick={handleAutoFill} className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                🔄 Autouzupełnij z faktur i wydatków
              </Button>

              {/* Revenue Section */}
              <div className="bg-green-50 p-4 rounded-xl border-2 border-green-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4">📈 Obroty (Sprzedaż)</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Obrót 21%</label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.revenue_21}
                      onChange={(e) => setFormData({ ...formData, revenue_21: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">VAT 21%</label>
                    <div className="flex h-10 items-center px-3 py-2 bg-gray-100 rounded-md font-mono font-bold">
                      {formatCurrency(formData.output_vat_21)}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Obrót 9%</label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.revenue_9}
                      onChange={(e) => setFormData({ ...formData, revenue_9: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">VAT 9%</label>
                    <div className="flex h-10 items-center px-3 py-2 bg-gray-100 rounded-md font-mono font-bold">
                      {formatCurrency(formData.output_vat_9)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Expenses Section */}
              <div className="bg-purple-50 p-4 rounded-xl border-2 border-purple-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4">📉 VAT do odliczenia</h3>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">VAT naliczony</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.input_vat}
                    onChange={(e) => setFormData({ ...formData, input_vat: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              {/* Totals */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl border-2 border-blue-300">
                <h3 className="text-lg font-bold text-gray-900 mb-4">💰 Podsumowanie</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700 font-medium">VAT do zapłaty:</span>
                    <span className="text-2xl font-mono font-bold text-red-600">{formatCurrency(formData.total_output_vat)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700 font-medium">VAT do odliczenia:</span>
                    <span className="text-2xl font-mono font-bold text-green-600">{formatCurrency(formData.input_vat)}</span>
                  </div>
                  <div className="flex justify-between items-center border-t-2 border-blue-300 pt-3">
                    <span className="text-gray-900 font-bold text-lg">Saldo:</span>
                    <span className="text-3xl font-mono font-bold text-blue-600">{formatCurrency(formData.balance)}</span>
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as BTWStatus })}
                  className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                >
                  <option value="draft">📝 Draft</option>
                  <option value="submitted">📤 Wysłane</option>
                  <option value="paid">✅ Zapłacone</option>
                </select>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Notatki</label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Dodatkowe informacje..."
                  rows={3}
                />
              </div>
            </div>

            <div className="p-6 border-t flex justify-end gap-4 sticky bottom-0 bg-white">
              <Button 
                onClick={() => setIsDialogOpen(false)}
                className="bg-gray-600 hover:bg-gray-700 text-white"
              >
                {t.common.cancel}
              </Button>
              <Button 
                onClick={handleSave}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {t.common.save}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
