// =====================================================
// ACCOUNTANT SERVICES MANAGER
// =====================================================
// Component for managing accountant service forms
// Allows creating, editing, and toggling service forms
// =====================================================

import React, { useState, useEffect } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Copy,
  FileText,
  CheckCircle,
  AlertCircle,
  Briefcase,
  Settings,
  ChevronDown,
  ChevronUp,
  Menu,
  Save,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  AccountantForm,
  FormField,
  DEFAULT_FORM_TEMPLATES,
  fetchAccountantForms,
  createAccountantForm,
  updateAccountantForm,
  deleteAccountantForm,
  toggleAccountantFormActive,
  createDefaultFormsForAccountant,
} from "../../services/accountantFormService";
import { AccountantFormSubmissions } from "./AccountantFormSubmissions";

interface AccountantServicesManagerProps {
  accountantId: string;
}

const FORM_TYPE_ICONS: Record<string, React.ReactNode> = {
  callback: <span>📞</span>,
  registration: <span>📝</span>,
  administration: <span>📊</span>,
  vat: <span>🧾</span>,
  annual: <span>📅</span>,
  payroll: <span>💰</span>,
  consultation: <span>💬</span>,
  audit: <span>🔍</span>,
  financing: <span>🏦</span>,
};

const FORM_TYPE_LABELS: Record<string, string> = {
  callback: "Prośba o telefon",
  registration: "Rejestracja firmy",
  administration: "Administracja",
  vat: "Deklaracja VAT",
  annual: "Rozliczenie roczne",
  payroll: "Kadry i płace",
  consultation: "Konsultacja",
  audit: "Kontrola księgowości",
  financing: "Zasiłki i dodatki",
};

export const AccountantServicesManager: React.FC<
  AccountantServicesManagerProps
> = ({ accountantId }) => {
  const [forms, setForms] = useState<AccountantForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingForm, setEditingForm] = useState<AccountantForm | null>(null);
  const [expandedFormId, setExpandedFormId] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<"forms" | "submissions">(
    "submissions"
  );

  // Load forms
  useEffect(() => {
    loadForms();
  }, [accountantId]);

  const loadForms = async () => {
    try {
      setLoading(true);
      const data = await fetchAccountantForms(accountantId);
      setForms(data);
    } catch (error) {
      console.error("Error loading forms:", error);
      toast.error("Nie udało się załadować formularzy");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (form: AccountantForm) => {
    try {
      await toggleAccountantFormActive(form.id, !form.is_active);
      setForms((prev) =>
        prev.map((f) =>
          f.id === form.id ? { ...f, is_active: !f.is_active } : f
        )
      );
      toast.success(
        form.is_active
          ? "Usługa ukryta z profilu publicznego"
          : "Usługa widoczna na profilu publicznym"
      );
    } catch (error) {
      console.error("Error toggling form:", error);
      toast.error("Nie udało się zmienić statusu");
    }
  };

  const handleDelete = async (formId: string) => {
    if (!confirm("Czy na pewno chcesz usunąć tę usługę?")) return;

    try {
      await deleteAccountantForm(formId);
      setForms((prev) => prev.filter((f) => f.id !== formId));
      toast.success("Usługa została usunięta");
    } catch (error) {
      console.error("Error deleting form:", error);
      toast.error("Nie udało się usunąć usługi");
    }
  };

  const handleCreateFromTemplate = async (templateKey: string) => {
    const template = DEFAULT_FORM_TEMPLATES[templateKey];
    if (!template) return;

    try {
      const newForm = await createAccountantForm({
        accountant_id: accountantId,
        form_type: template.type,
        form_name: template.name,
        form_fields: template.fields,
        is_active: true,
        requires_approval: false,
      });
      setForms((prev) => [newForm, ...prev]);
      setShowAddModal(false);
      toast.success("Usługa została dodana");
    } catch (error) {
      console.error("Error creating form:", error);
      toast.error("Nie udało się utworzyć usługi");
    }
  };

  const handleCreateAllDefaults = async () => {
    if (
      !confirm(
        "Czy chcesz dodać wszystkie domyślne usługi? Może to dodać duplikaty."
      )
    )
      return;

    try {
      await createDefaultFormsForAccountant(accountantId);
      await loadForms();
      setShowAddModal(false);
      toast.success("Wszystkie domyślne usługi zostały dodane");
    } catch (error) {
      console.error("Error creating default forms:", error);
      toast.error("Nie udało się utworzyć usług");
    }
  };

  const handleDuplicateForm = async (form: AccountantForm) => {
    try {
      const newForm = await createAccountantForm({
        accountant_id: accountantId,
        form_type: form.form_type,
        form_name: `${form.form_name} (kopia)`,
        form_fields: form.form_fields,
        is_active: false,
        requires_approval: form.requires_approval,
      });
      setForms((prev) => [newForm, ...prev]);
      toast.success("Usługa została zduplikowana");
    } catch (error) {
      console.error("Error duplicating form:", error);
      toast.error("Nie udało się zduplikować usługi");
    }
  };

  const activeCount = forms.filter((f) => f.is_active).length;
  const inactiveCount = forms.length - activeCount;

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-100 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tab Switcher */}
      <div className="bg-white rounded-lg shadow p-2 flex gap-2">
        <button
          onClick={() => setActiveView("submissions")}
          className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
            activeView === "submissions"
              ? "bg-purple-600 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
          Zgłoszenia od klientów
        </button>
        <button
          onClick={() => setActiveView("forms")}
          className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
            activeView === "forms"
              ? "bg-purple-600 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          <Settings className="w-5 h-5" />
          Zarządzaj formularzami
        </button>
      </div>

      {/* Submissions View */}
      {activeView === "submissions" && (
        <AccountantFormSubmissions accountantId={accountantId} />
      )}

      {/* Forms Management View */}
      {activeView === "forms" && (
        <>
          {/* Header */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                  <Briefcase className="w-6 h-6 text-purple-600" />
                  Zarządzanie Usługami
                </h2>
                <p className="text-gray-500 mt-1">
                  Twórz formularze usług, które klienci mogą wypełnić na Twoim
                  profilu publicznym
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Dodaj Usługę
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="bg-purple-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {forms.length}
                </div>
                <div className="text-sm text-purple-600">Wszystkie</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {activeCount}
                </div>
                <div className="text-sm text-green-600">Aktywne</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-gray-600">
                  {inactiveCount}
                </div>
                <div className="text-sm text-gray-600">Ukryte</div>
              </div>
            </div>
          </div>

          {/* Forms List */}
          {forms.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                Brak usług
              </h3>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">
                Dodaj swoje usługi, które klienci będą mogli wybrać na Twoim
                publicznym profilu
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Dodaj Pierwszą Usługę
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {forms.map((form) => (
                <div
                  key={form.id}
                  className={`bg-white rounded-lg shadow border-l-4 ${
                    form.is_active ? "border-l-green-500" : "border-l-gray-300"
                  } transition-all`}
                >
                  {/* Form Header */}
                  <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">
                        {FORM_TYPE_ICONS[form.form_type] || <FileText />}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800">
                          {form.form_name}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <span>
                            {FORM_TYPE_LABELS[form.form_type] || form.form_type}
                          </span>
                          <span>•</span>
                          <span>{form.form_fields.length} pól</span>
                          {form.is_active ? (
                            <span className="inline-flex items-center gap-1 text-green-600">
                              <CheckCircle className="w-3 h-3" /> Aktywna
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-gray-400">
                              <AlertCircle className="w-3 h-3" /> Ukryta
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleActive(form)}
                        className={`p-2 rounded-lg transition-colors ${
                          form.is_active
                            ? "bg-green-100 text-green-600 hover:bg-green-200"
                            : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                        }`}
                        title={form.is_active ? "Ukryj usługę" : "Pokaż usługę"}
                      >
                        {form.is_active ? (
                          <Eye className="w-4 h-4" />
                        ) : (
                          <EyeOff className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => setEditingForm(form)}
                        className="p-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
                        title="Edytuj"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDuplicateForm(form)}
                        className="p-2 rounded-lg bg-purple-100 text-purple-600 hover:bg-purple-200 transition-colors"
                        title="Duplikuj"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(form.id)}
                        className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                        title="Usuń"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() =>
                          setExpandedFormId(
                            expandedFormId === form.id ? null : form.id
                          )
                        }
                        className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                        title="Szczegóły"
                      >
                        {expandedFormId === form.id ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Fields Preview */}
                  {expandedFormId === form.id && (
                    <div className="border-t bg-gray-50 p-4">
                      <h4 className="text-sm font-semibold text-gray-600 mb-3">
                        Pola formularza:
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                        {form.form_fields.map(
                          (field: FormField, index: number) => (
                            <div
                              key={index}
                              className="bg-white px-3 py-2 rounded border text-sm flex items-center gap-2"
                            >
                              <span className="text-gray-400 text-xs">
                                {field.type}
                              </span>
                              <span className="text-gray-700 truncate">
                                {field.labelKey}
                                {field.required && (
                                  <span className="text-red-500 ml-1">*</span>
                                )}
                              </span>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Add Service Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-800">Dodaj Usługę</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <p className="text-gray-600 mb-4">
                Wybierz szablon usługi do dodania. Możesz później dostosować
                nazwę i pola.
              </p>

              {/* Quick add all */}
              <button
                onClick={handleCreateAllDefaults}
                className="w-full mb-6 p-4 border-2 border-dashed border-purple-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all text-center"
              >
                <Plus className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                <span className="font-semibold text-purple-600">
                  Dodaj wszystkie domyślne usługi naraz
                </span>
              </button>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(
                  Object.entries(DEFAULT_FORM_TEMPLATES) as [
                    string,
                    { name: string; type: string; fields: FormField[] }
                  ][]
                ).map(([key, template]) => (
                  <button
                    key={key}
                    onClick={() => handleCreateFromTemplate(key)}
                    className="p-4 border rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all text-left flex items-start gap-3"
                  >
                    <div className="text-2xl">
                      {FORM_TYPE_ICONS[key] || "📄"}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800">
                        {template.name}
                      </h4>
                      <p className="text-sm text-gray-500">
                        {template.fields.length} pól • Typ: {template.type}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Form Modal */}
      {editingForm && (
        <FormEditorModal
          form={editingForm}
          onClose={() => setEditingForm(null)}
          onSave={async (updates) => {
            try {
              await updateAccountantForm(editingForm.id, updates);
              setForms((prev) =>
                prev.map((f) =>
                  f.id === editingForm.id ? { ...f, ...updates } : f
                )
              );
              setEditingForm(null);
              toast.success("Usługa została zaktualizowana");
            } catch (error) {
              console.error("Error updating form:", error);
              toast.error("Nie udało się zaktualizować usługi");
            }
          }}
        />
      )}
    </div>
  );
};

// =====================================================
// FORM EDITOR MODAL
// =====================================================
interface FormEditorModalProps {
  form: AccountantForm;
  onClose: () => void;
  onSave: (updates: Partial<AccountantForm>) => Promise<void>;
}

const FormEditorModal: React.FC<FormEditorModalProps> = ({
  form,
  onClose,
  onSave,
}) => {
  const [formName, setFormName] = useState(form.form_name);
  const [requiresApproval, setRequiresApproval] = useState(
    form.requires_approval
  );
  const [whatsappEnabled, setWhatsappEnabled] = useState(
    form.whatsapp_enabled || false
  );
  const [whatsappNumber, setWhatsappNumber] = useState(
    form.whatsapp_number || ""
  );
  const [fields, setFields] = useState<FormField[]>(form.form_fields);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!formName.trim()) {
      toast.error("Nazwa usługi jest wymagana");
      return;
    }
    if (whatsappEnabled && !whatsappNumber.trim()) {
      toast.error("Podaj numer WhatsApp gdy opcja jest włączona");
      return;
    }
    setSaving(true);
    try {
      await onSave({
        form_name: formName.trim(),
        requires_approval: requiresApproval,
        whatsapp_enabled: whatsappEnabled,
        whatsapp_number: whatsappNumber.trim() || null,
        form_fields: fields,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleFieldChange = (
    index: number,
    key: keyof FormField,
    value: any
  ) => {
    setFields((prev) =>
      prev.map((field, i) => (i === index ? { ...field, [key]: value } : field))
    );
  };

  const handleAddField = () => {
    setFields((prev) => [
      ...prev,
      {
        name: `field_${Date.now()}`,
        labelKey: "Nowe pole",
        type: "text",
        required: false,
      },
    ]);
  };

  const handleRemoveField = (index: number) => {
    setFields((prev) => prev.filter((_, i) => i !== index));
  };

  const moveField = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= fields.length) return;

    const newFields = [...fields];
    [newFields[index], newFields[newIndex]] = [
      newFields[newIndex],
      newFields[index],
    ];
    setFields(newFields);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b flex items-center justify-between shrink-0">
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Settings className="w-5 h-5 text-purple-600" />
            Edytuj Usługę
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nazwa usługi *
              </label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="np. Rozliczenie roczne"
              />
            </div>
            <div className="flex items-center">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={requiresApproval}
                  onChange={(e) => setRequiresApproval(e.target.checked)}
                  className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                />
                <span className="text-sm text-gray-700">
                  Wymagaj zatwierdzenia przed kontaktem
                </span>
              </label>
            </div>
          </div>

          {/* WhatsApp Integration */}
          <div className="bg-green-50 rounded-lg p-4 mb-6 border border-green-200">
            <label className="flex items-center gap-3 cursor-pointer mb-3">
              <input
                type="checkbox"
                checked={whatsappEnabled}
                onChange={(e) => setWhatsappEnabled(e.target.checked)}
                className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
              />
              <div className="flex items-center gap-2">
                <svg
                  className="w-6 h-6 text-green-600"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                <span className="font-medium text-green-800">
                  Włącz przycisk WhatsApp
                </span>
              </div>
            </label>
            {whatsappEnabled && (
              <div className="ml-8">
                <label className="block text-sm font-medium text-green-700 mb-1">
                  Numer WhatsApp (format międzynarodowy)
                </label>
                <input
                  type="tel"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="+31612345678"
                />
                <p className="text-xs text-green-600 mt-1">
                  Klient będzie mógł wysłać dane formularza bezpośrednio na
                  WhatsApp
                </p>
              </div>
            )}
          </div>

          {/* Fields Editor */}
          <div className="border-t pt-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-gray-700">Pola formularza</h4>
              <button
                onClick={handleAddField}
                className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Dodaj pole
              </button>
            </div>

            <div className="space-y-3">
              {fields.map((field, index) => (
                <div
                  key={index}
                  className="bg-gray-50 rounded-lg p-4 border flex items-start gap-3"
                >
                  <div className="flex flex-col gap-1 text-gray-400">
                    <button
                      onClick={() => moveField(index, "up")}
                      disabled={index === 0}
                      className="p-1 hover:text-gray-600 disabled:opacity-30"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <Menu className="w-4 h-4" />
                    <button
                      onClick={() => moveField(index, "down")}
                      disabled={index === fields.length - 1}
                      className="p-1 hover:text-gray-600 disabled:opacity-30"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-3">
                    <input
                      type="text"
                      value={field.labelKey}
                      onChange={(e) =>
                        handleFieldChange(index, "labelKey", e.target.value)
                      }
                      className="px-2 py-1 border rounded text-sm"
                      placeholder="Etykieta"
                    />
                    <select
                      value={field.type}
                      onChange={(e) =>
                        handleFieldChange(
                          index,
                          "type",
                          e.target.value as FormField["type"]
                        )
                      }
                      className="px-2 py-1 border rounded text-sm"
                    >
                      <option value="text">Tekst</option>
                      <option value="email">Email</option>
                      <option value="tel">Telefon</option>
                      <option value="number">Liczba</option>
                      <option value="textarea">Tekst wieloliniowy</option>
                      <option value="select">Lista rozwijana</option>
                      <option value="date">Data</option>
                      <option value="time">Godzina</option>
                      <option value="checkbox-group">Checkboxy</option>
                      <option value="radio-group">Radio</option>
                    </select>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={field.required || false}
                        onChange={(e) =>
                          handleFieldChange(index, "required", e.target.checked)
                        }
                        className="w-4 h-4 text-purple-600 rounded"
                      />
                      Wymagane
                    </label>
                    <input
                      type="text"
                      value={field.placeholderKey || ""}
                      onChange={(e) =>
                        handleFieldChange(
                          index,
                          "placeholderKey",
                          e.target.value
                        )
                      }
                      className="px-2 py-1 border rounded text-sm"
                      placeholder="Placeholder"
                    />
                  </div>

                  <button
                    onClick={() => handleRemoveField(index)}
                    className="p-1 text-red-500 hover:bg-red-100 rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50 flex justify-end gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Anuluj
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? (
              <span>Zapisuję...</span>
            ) : (
              <span className="flex items-center gap-2">
                <Save className="w-4 h-4" />
                Zapisz
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AccountantServicesManager;
