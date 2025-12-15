/**
 * ================================================================
 * PDF REPORT GENERATOR - Generowanie raportów PDF
 * ================================================================
 *
 * Uses browser-native approach with print-to-PDF
 * For more advanced PDF generation, consider adding jspdf or @react-pdf/renderer
 */

import React, { useState, useRef } from "react";
import {
  FileText,
  Download,
  Calendar,
  Clock,
  Loader2,
  AlertCircle,
  CheckCircle,
  ChevronDown,
  User,
  DollarSign,
  Briefcase,
  Users,
} from "lucide-react";

import { supabase } from "../../../../lib/supabase";
import { toast } from "sonner";

interface ReportGeneratorProps {
  teamId: string;
  teamName: string;
}

type ReportType = "timesheet" | "expense" | "project" | "team-summary";

interface ReportOptions {
  type: ReportType;
  dateFrom: string;
  dateTo: string;
  includeDetails: boolean;
  groupBy: "user" | "project" | "date";
}

export const ReportGenerator: React.FC<ReportGeneratorProps> = ({
  teamId,
  teamName,
}) => {
  const printRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [reportData, setReportData] = useState<any>(null);

  const [options, setOptions] = useState<ReportOptions>({
    type: "timesheet",
    dateFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    dateTo: new Date().toISOString().split("T")[0],
    includeDetails: true,
    groupBy: "user",
  });

  const reportTypes = [
    {
      value: "timesheet",
      label: "Raport godzin",
      icon: Clock,
      description: "Zestawienie przepracowanych godzin",
    },
    {
      value: "expense",
      label: "Raport wydatków",
      icon: Euro,
      description: "Zestawienie kosztów i declaraties",
    },
    {
      value: "project",
      label: "Raport projektu",
      icon: Briefcase,
      description: "Status projektów i zadań",
    },
    {
      value: "team-summary",
      label: "Podsumowanie zespołu",
      icon: Users,
      description: "Ogólne statystyki zespołu",
    },
  ];

  const generateReport = async () => {
    setIsGenerating(true);

    try {
      let data: any = {
        generatedAt: new Date().toISOString(),
        teamName,
        options,
      };

      switch (options.type) {
        case "timesheet":
          const { data: timesheets } = await supabase
            .from("team_timesheets")
            .select(
              `
              *,
              profiles:user_id (full_name),
              team_projects:project_id (title)
            `
            )
            .eq("team_id", teamId)
            .gte("date", options.dateFrom)
            .lte("date", options.dateTo)
            .order("date", { ascending: false });

          data.entries = timesheets || [];
          data.summary = {
            totalHours:
              timesheets?.reduce((sum, t) => sum + (t.total_hours || 0), 0) ||
              0,
            totalAmount:
              timesheets?.reduce((sum, t) => sum + (t.total_amount || 0), 0) ||
              0,
            approved:
              timesheets?.filter((t) => t.status === "approved").length || 0,
            pending:
              timesheets?.filter((t) => t.status === "pending").length || 0,
          };
          break;

        case "expense":
          const { data: expenses } = await supabase
            .from("team_expense_claims")
            .select(
              `
              *,
              profiles:user_id (full_name),
              team_projects:project_id (title)
            `
            )
            .eq("team_id", teamId)
            .gte("date", options.dateFrom)
            .lte("date", options.dateTo)
            .order("date", { ascending: false });

          data.entries = expenses || [];
          data.summary = {
            totalAmount:
              expenses?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0,
            totalVat:
              expenses?.reduce((sum, e) => sum + (e.vat_amount || 0), 0) || 0,
            approved:
              expenses?.filter(
                (e) => e.status === "approved" || e.status === "paid"
              ).length || 0,
            pending:
              expenses?.filter((e) => e.status === "pending").length || 0,
          };
          break;

        case "project":
          const { data: projects } = await supabase
            .from("team_projects")
            .select("*")
            .eq("team_id", teamId)
            .order("created_at", { ascending: false });

          data.entries = projects || [];
          data.summary = {
            total: projects?.length || 0,
            active: projects?.filter((p) => p.status === "ACTIVE").length || 0,
            completed:
              projects?.filter((p) => p.status === "COMPLETED").length || 0,
          };
          break;

        case "team-summary":
          // Get all summary data
          const [timesheetRes, expenseRes, projectRes, memberRes] =
            await Promise.all([
              supabase
                .from("team_timesheets")
                .select("total_hours, total_amount, status")
                .eq("team_id", teamId)
                .gte("date", options.dateFrom)
                .lte("date", options.dateTo),
              supabase
                .from("team_expense_claims")
                .select("amount, status")
                .eq("team_id", teamId)
                .gte("date", options.dateFrom)
                .lte("date", options.dateTo),
              supabase
                .from("team_projects")
                .select("status")
                .eq("team_id", teamId),
              supabase
                .from("employer_team_members")
                .select("*")
                .eq("team_id", teamId),
            ]);

          data.summary = {
            timesheets: {
              totalHours:
                timesheetRes.data?.reduce(
                  (sum, t) => sum + (t.total_hours || 0),
                  0
                ) || 0,
              totalAmount:
                timesheetRes.data?.reduce(
                  (sum, t) => sum + (t.total_amount || 0),
                  0
                ) || 0,
            },
            expenses: {
              totalAmount:
                expenseRes.data?.reduce((sum, e) => sum + (e.amount || 0), 0) ||
                0,
              count: expenseRes.data?.length || 0,
            },
            projects: {
              total: projectRes.data?.length || 0,
              active:
                projectRes.data?.filter((p) => p.status === "ACTIVE").length ||
                0,
            },
            members: memberRes.data?.length || 0,
          };
          break;
      }

      setReportData(data);
      setShowPreview(true);
    } catch (error) {
      console.error("Error generating report:", error);
      toast.error("Błąd generowania raportu");
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const formatCurrency = (amount: number) => `€${amount.toFixed(2)}`;
  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("pl-PL", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
            <FileText className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              Generator raportów
            </h2>
            <p className="text-sm text-gray-500">Rapportage genereren</p>
          </div>
        </div>
      </div>

      {!showPreview ? (
        <div className="p-6 space-y-6">
          {/* Report Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Typ raportu
            </label>
            <div className="grid grid-cols-2 gap-3">
              {reportTypes.map((rt) => {
                const Icon = rt.icon;
                const isSelected = options.type === rt.value;
                return (
                  <button
                    key={rt.value}
                    onClick={() =>
                      setOptions((prev) => ({
                        ...prev,
                        type: rt.value as ReportType,
                      }))
                    }
                    className={`p-4 rounded-lg border-2 text-left transition-all ${
                      isSelected
                        ? "border-indigo-500 bg-indigo-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon
                        className={`w-5 h-5 ${
                          isSelected ? "text-indigo-600" : "text-gray-400"
                        }`}
                      />
                      <div>
                        <p
                          className={`font-medium ${
                            isSelected ? "text-indigo-900" : "text-gray-900"
                          }`}
                        >
                          {rt.label}
                        </p>
                        <p className="text-xs text-gray-500">
                          {rt.description}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Zakres dat
            </label>
            <div className="flex items-center gap-3">
              <input
                type="date"
                value={options.dateFrom}
                onChange={(e) =>
                  setOptions((prev) => ({ ...prev, dateFrom: e.target.value }))
                }
                className="flex-1 border border-gray-300 rounded-lg px-4 py-2"
              />
              <span className="text-gray-400">–</span>
              <input
                type="date"
                value={options.dateTo}
                onChange={(e) =>
                  setOptions((prev) => ({ ...prev, dateTo: e.target.value }))
                }
                className="flex-1 border border-gray-300 rounded-lg px-4 py-2"
              />
            </div>
          </div>

          {/* Options */}
          <div className="space-y-3">
            <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <input
                type="checkbox"
                checked={options.includeDetails}
                onChange={(e) =>
                  setOptions((prev) => ({
                    ...prev,
                    includeDetails: e.target.checked,
                  }))
                }
                className="w-5 h-5 text-indigo-600 rounded"
              />
              <span>Uwzględnij szczegółowe wpisy</span>
            </label>
          </div>

          {/* Generate Button */}
          <button
            onClick={generateReport}
            disabled={isGenerating}
            className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all ${
              isGenerating
                ? "bg-gray-100 text-gray-400"
                : "bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95"
            }`}
          >
            {isGenerating ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Eye className="w-5 h-5" />
            )}
            Generuj podgląd
          </button>
        </div>
      ) : (
        <>
          {/* Action Bar */}
          <div className="px-6 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
            <button
              onClick={() => setShowPreview(false)}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              ← Wróć do opcji
            </button>
            <div className="flex gap-2">
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700"
              >
                <Printer className="w-4 h-4" />
                Drukuj / Zapisz PDF
              </button>
            </div>
          </div>

          {/* Report Preview */}
          <div ref={printRef} className="p-8 print:p-4" id="report-content">
            {/* Report Header */}
            <div className="mb-8 pb-4 border-b-2 border-indigo-600">
              <h1 className="text-2xl font-bold text-gray-900">
                {reportTypes.find((r) => r.value === options.type)?.label}
              </h1>
              <p className="text-gray-600 mt-1">{teamName}</p>
              <p className="text-sm text-gray-500 mt-2">
                Okres: {formatDate(options.dateFrom)} –{" "}
                {formatDate(options.dateTo)}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Wygenerowano: {new Date().toLocaleString("pl-PL")}
              </p>
            </div>

            {/* Summary Section */}
            {reportData?.summary && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Podsumowanie
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {options.type === "timesheet" && (
                    <>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-500">Suma godzin</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {reportData.summary.totalHours.toFixed(1)}h
                        </p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-500">Wartość</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {formatCurrency(reportData.summary.totalAmount)}
                        </p>
                      </div>
                      <div className="p-4 bg-emerald-50 rounded-lg">
                        <p className="text-sm text-emerald-700">Zatwierdzone</p>
                        <p className="text-2xl font-bold text-emerald-600">
                          {reportData.summary.approved}
                        </p>
                      </div>
                      <div className="p-4 bg-amber-50 rounded-lg">
                        <p className="text-sm text-amber-700">Oczekujące</p>
                        <p className="text-2xl font-bold text-amber-600">
                          {reportData.summary.pending}
                        </p>
                      </div>
                    </>
                  )}
                  {options.type === "expense" && (
                    <>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-500">Suma wydatków</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {formatCurrency(reportData.summary.totalAmount)}
                        </p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-500">Suma BTW</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {formatCurrency(reportData.summary.totalVat)}
                        </p>
                      </div>
                    </>
                  )}
                  {options.type === "team-summary" && (
                    <>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-500">Godziny</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {reportData.summary.timesheets.totalHours.toFixed(1)}h
                        </p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-500">Wydatki</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {formatCurrency(
                            reportData.summary.expenses.totalAmount
                          )}
                        </p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-500">Projekty</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {reportData.summary.projects.total}
                        </p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-500">Członkowie</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {reportData.summary.members}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Details Table */}
            {options.includeDetails && reportData?.entries?.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Szczegóły
                </h2>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-gray-200">
                      <th className="text-left py-2">Data</th>
                      <th className="text-left py-2">Osoba</th>
                      {options.type === "timesheet" && (
                        <>
                          <th className="text-left py-2">Projekt</th>
                          <th className="text-right py-2">Godziny</th>
                          <th className="text-right py-2">Kwota</th>
                        </>
                      )}
                      {options.type === "expense" && (
                        <>
                          <th className="text-left py-2">Opis</th>
                          <th className="text-right py-2">Kwota</th>
                        </>
                      )}
                      <th className="text-center py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.entries
                      .slice(0, 50)
                      .map((entry: any, idx: number) => (
                        <tr key={idx} className="border-b border-gray-100">
                          <td className="py-2">
                            {new Date(entry.date).toLocaleDateString("pl-PL")}
                          </td>
                          <td className="py-2">
                            {entry.profiles?.full_name || "-"}
                          </td>
                          {options.type === "timesheet" && (
                            <>
                              <td className="py-2">
                                {entry.team_projects?.title || "-"}
                              </td>
                              <td className="py-2 text-right">
                                {entry.total_hours}h
                              </td>
                              <td className="py-2 text-right">
                                {entry.total_amount
                                  ? formatCurrency(entry.total_amount)
                                  : "-"}
                              </td>
                            </>
                          )}
                          {options.type === "expense" && (
                            <>
                              <td className="py-2">{entry.description}</td>
                              <td className="py-2 text-right">
                                {formatCurrency(entry.amount)}
                              </td>
                            </>
                          )}
                          <td className="py-2 text-center">
                            <span
                              className={`px-2 py-1 text-xs rounded-full ${
                                entry.status === "approved" ||
                                entry.status === "paid"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : entry.status === "pending"
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
                              {entry.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
                {reportData.entries.length > 50 && (
                  <p className="text-sm text-gray-500 mt-2">
                    Pokazano pierwsze 50 z {reportData.entries.length} wpisów
                  </p>
                )}
              </div>
            )}

            {/* Footer */}
            <div className="mt-12 pt-4 border-t border-gray-200 text-center text-xs text-gray-400">
              <p>ZZP Werkplaats • Raport wygenerowany automatycznie</p>
            </div>
          </div>
        </>
      )}

      {/* Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #report-content, #report-content * {
            visibility: visible;
          }
          #report-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default ReportGenerator;
