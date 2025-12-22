// =====================================================
// ACCOUNTANT FORM SUBMISSIONS VIEWER
// =====================================================
// Component for viewing and managing form submissions
// from clients on the public profile
// =====================================================

import React, { useState, useEffect } from "react";
import {
  Mail,
  Clock,
  CheckCircle,
  XCircle,
  Trash2,
  ChevronDown,
  ChevronUp,
  Phone,
  User,
  Calendar,
  FileText,
  RefreshCw,
  Filter,
  MessageCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  FormSubmission,
  SubmissionStatus,
  fetchAccountantSubmissions,
  updateSubmissionStatus,
  markSubmissionAsRead,
  deleteSubmission,
} from "../../services/accountantFormService";

interface AccountantFormSubmissionsProps {
  accountantId: string;
}

const STATUS_CONFIG: Record<
  SubmissionStatus,
  { label: string; color: string; bgColor: string; icon: React.ReactNode }
> = {
  new: {
    label: "Nowe",
    color: "text-blue-600",
    bgColor: "bg-blue-100",
    icon: <Mail className="w-4 h-4" />,
  },
  in_progress: {
    label: "W trakcie",
    color: "text-amber-600",
    bgColor: "bg-amber-100",
    icon: <Clock className="w-4 h-4" />,
  },
  completed: {
    label: "Zakończone",
    color: "text-green-600",
    bgColor: "bg-green-100",
    icon: <CheckCircle className="w-4 h-4" />,
  },
  rejected: {
    label: "Odrzucone",
    color: "text-red-600",
    bgColor: "bg-red-100",
    icon: <XCircle className="w-4 h-4" />,
  },
};

const FORM_TYPE_LABELS: Record<string, string> = {
  callback: "📞 Prośba o telefon",
  registration: "📝 Rejestracja firmy",
  administration: "📊 Administracja",
  vat: "🧾 Deklaracja VAT",
  annual: "📅 Rozliczenie roczne",
  payroll: "💰 Kadry i płace",
  consultation: "💬 Konsultacja",
  audit: "🔍 Kontrola księgowości",
  financing: "🏦 Zasiłki i dodatki",
};

export const AccountantFormSubmissions: React.FC<
  AccountantFormSubmissionsProps
> = ({ accountantId }) => {
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<SubmissionStatus | "all">(
    "all"
  );
  const [notesInput, setNotesInput] = useState<Record<string, string>>({});

  useEffect(() => {
    loadSubmissions();
  }, [accountantId]);

  const loadSubmissions = async () => {
    try {
      setLoading(true);
      const data = await fetchAccountantSubmissions(accountantId);
      setSubmissions(data);
    } catch (error) {
      console.error("Error loading submissions:", error);
      toast.error("Nie udało się załadować zgłoszeń");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (submission: FormSubmission) => {
    if (submission.read_at) return;

    try {
      await markSubmissionAsRead(submission.id);
      setSubmissions((prev) =>
        prev.map((s) =>
          s.id === submission.id
            ? { ...s, read_at: new Date().toISOString() }
            : s
        )
      );
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  const handleStatusChange = async (
    submissionId: string,
    status: SubmissionStatus
  ) => {
    try {
      const notes = notesInput[submissionId];
      await updateSubmissionStatus(submissionId, status, notes);
      setSubmissions((prev) =>
        prev.map((s) =>
          s.id === submissionId
            ? {
                ...s,
                status,
                accountant_notes: notes || s.accountant_notes,
                responded_at: new Date().toISOString(),
              }
            : s
        )
      );
      toast.success(`Status zmieniony na: ${STATUS_CONFIG[status].label}`);
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Nie udało się zmienić statusu");
    }
  };

  const handleDelete = async (submissionId: string) => {
    if (!confirm("Czy na pewno chcesz usunąć to zgłoszenie?")) return;

    try {
      await deleteSubmission(submissionId);
      setSubmissions((prev) => prev.filter((s) => s.id !== submissionId));
      toast.success("Zgłoszenie zostało usunięte");
    } catch (error) {
      console.error("Error deleting submission:", error);
      toast.error("Nie udało się usunąć zgłoszenia");
    }
  };

  const toggleExpand = (submission: FormSubmission) => {
    if (expandedId === submission.id) {
      setExpandedId(null);
    } else {
      setExpandedId(submission.id);
      handleMarkAsRead(submission);
    }
  };

  const filteredSubmissions =
    statusFilter === "all"
      ? submissions
      : submissions.filter((s) => s.status === statusFilter);

  const unreadCount = submissions.filter((s) => !s.read_at).length;
  const newCount = submissions.filter((s) => s.status === "new").length;

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-100 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <MessageCircle className="w-6 h-6 text-purple-600" />
              Otrzymane Zgłoszenia
              {unreadCount > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-sm rounded-full">
                  {unreadCount} nowe
                </span>
              )}
            </h2>
            <p className="text-gray-500 mt-1">
              Przeglądaj i zarządzaj zgłoszeniami od klientów
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Filter */}
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as SubmissionStatus | "all")
              }
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">Wszystkie ({submissions.length})</option>
              <option value="new">
                Nowe ({submissions.filter((s) => s.status === "new").length})
              </option>
              <option value="in_progress">
                W trakcie (
                {submissions.filter((s) => s.status === "in_progress").length})
              </option>
              <option value="completed">
                Zakończone (
                {submissions.filter((s) => s.status === "completed").length})
              </option>
              <option value="rejected">
                Odrzucone (
                {submissions.filter((s) => s.status === "rejected").length})
              </option>
            </select>
            <button
              onClick={loadSubmissions}
              className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
              title="Odśwież"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Submissions List */}
      <div className="divide-y divide-gray-100">
        {filteredSubmissions.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">
              {statusFilter === "all"
                ? "Brak zgłoszeń"
                : `Brak zgłoszeń o statusie "${
                    STATUS_CONFIG[statusFilter as SubmissionStatus]?.label
                  }"`}
            </h3>
            <p className="text-gray-500">
              Gdy klient wypełni formularz na Twoim profilu, pojawi się tutaj
            </p>
          </div>
        ) : (
          filteredSubmissions.map((submission) => {
            const isExpanded = expandedId === submission.id;
            const statusConfig = STATUS_CONFIG[submission.status];
            const formType = (submission.form as any)?.form_type || "unknown";
            const formName = (submission.form as any)?.form_name || "Formularz";

            return (
              <div
                key={submission.id}
                className={`transition-colors ${
                  !submission.read_at ? "bg-blue-50" : ""
                }`}
              >
                {/* Submission Header */}
                <button
                  onClick={() => toggleExpand(submission)}
                  className="w-full p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors text-left"
                >
                  {/* Unread indicator */}
                  <div className="flex-shrink-0">
                    {submission.read_at ? (
                      <Mail className="w-5 h-5 text-gray-400" />
                    ) : (
                      <Mail className="w-5 h-5 text-blue-600" />
                    )}
                  </div>

                  {/* Main info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-gray-900 truncate">
                        {submission.submitter_name}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${statusConfig.bgColor} ${statusConfig.color}`}
                      >
                        {statusConfig.icon}
                        {statusConfig.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      <span>{FORM_TYPE_LABELS[formType] || formName}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(submission.created_at).toLocaleDateString(
                          "pl-PL",
                          {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Expand button */}
                  <div className="flex-shrink-0">
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </button>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="px-4 pb-4 space-y-4">
                    {/* Contact Info */}
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                      <h4 className="font-semibold text-gray-700 flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Dane kontaktowe
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                        <div>
                          <span className="text-gray-500">Email:</span>
                          <a
                            href={`mailto:${submission.submitter_email}`}
                            className="ml-2 text-purple-600 hover:underline"
                          >
                            {submission.submitter_email}
                          </a>
                        </div>
                        {submission.submitter_phone && (
                          <div>
                            <span className="text-gray-500">Telefon:</span>
                            <a
                              href={`tel:${submission.submitter_phone}`}
                              className="ml-2 text-purple-600 hover:underline"
                            >
                              {submission.submitter_phone}
                            </a>
                          </div>
                        )}
                        <div>
                          <span className="text-gray-500">
                            Data zgłoszenia:
                          </span>
                          <span className="ml-2">
                            {new Date(submission.created_at).toLocaleString(
                              "pl-PL"
                            )}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Form Data */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-700 flex items-center gap-2 mb-3">
                        <FileText className="w-4 h-4" />
                        Dane formularza
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        {Object.entries(submission.form_data || {}).map(
                          ([key, value]) => (
                            <div key={key} className="flex flex-col">
                              <span className="text-gray-500 text-xs uppercase">
                                {key}
                              </span>
                              <span className="text-gray-900">
                                {String(value) || "-"}
                              </span>
                            </div>
                          )
                        )}
                      </div>
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Twoje notatki (opcjonalne)
                      </label>
                      <textarea
                        value={
                          notesInput[submission.id] ??
                          submission.accountant_notes ??
                          ""
                        }
                        onChange={(e) =>
                          setNotesInput((prev) => ({
                            ...prev,
                            [submission.id]: e.target.value,
                          }))
                        }
                        placeholder="Dodaj notatki do tego zgłoszenia..."
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-200">
                      <span className="text-sm text-gray-500 mr-2">
                        Zmień status:
                      </span>
                      {submission.status !== "in_progress" && (
                        <button
                          onClick={() =>
                            handleStatusChange(submission.id, "in_progress")
                          }
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-100 text-amber-700 rounded-lg text-sm hover:bg-amber-200 transition-colors"
                        >
                          <Clock className="w-4 h-4" />W trakcie
                        </button>
                      )}
                      {submission.status !== "completed" && (
                        <button
                          onClick={() =>
                            handleStatusChange(submission.id, "completed")
                          }
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm hover:bg-green-200 transition-colors"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Zakończone
                        </button>
                      )}
                      {submission.status !== "rejected" && (
                        <button
                          onClick={() =>
                            handleStatusChange(submission.id, "rejected")
                          }
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-sm hover:bg-red-200 transition-colors"
                        >
                          <XCircle className="w-4 h-4" />
                          Odrzuć
                        </button>
                      )}
                      <div className="flex-1" />
                      <button
                        onClick={() => handleDelete(submission.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg text-sm transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        Usuń
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AccountantFormSubmissions;
