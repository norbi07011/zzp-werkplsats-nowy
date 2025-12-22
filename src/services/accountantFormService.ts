// =====================================================
// ACCOUNTANT FORM SERVICE
// =====================================================
// Service for managing accountant service forms
// Used for CRUD operations on accountant_forms table
// =====================================================

import { supabase } from "@/lib/supabase";

// Form field type definitions (matching hut-services form config)
export interface FormFieldOption {
  value: string;
  labelKey: string;
}

export interface FormField {
  name: string;
  labelKey: string;
  type:
    | "text"
    | "email"
    | "tel"
    | "number"
    | "textarea"
    | "select"
    | "checkbox-group"
    | "radio-group"
    | "date"
    | "time";
  placeholderKey?: string;
  tooltipKey?: string;
  required?: boolean;
  pattern?: string; // Regex as string for JSON storage
  patternErrorKey?: string;
  options?: FormFieldOption[];
  gridClass?: string;
}

export interface AccountantForm {
  id: string;
  accountant_id: string;
  form_type: string;
  form_name: string;
  form_fields: FormField[];
  is_active: boolean;
  requires_approval: boolean;
  whatsapp_enabled: boolean;
  whatsapp_number: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateAccountantFormData {
  accountant_id: string;
  form_type: string;
  form_name: string;
  form_fields: FormField[];
  is_active?: boolean;
  requires_approval?: boolean;
  whatsapp_enabled?: boolean;
  whatsapp_number?: string;
}

// Pre-defined form templates (from hut-services)
export const DEFAULT_FORM_TEMPLATES: Record<
  string,
  { name: string; type: string; fields: FormField[] }
> = {
  callback: {
    name: "Prośba o telefon",
    type: "callback",
    fields: [
      {
        name: "name",
        labelKey: "Imię i nazwisko",
        type: "text",
        required: true,
        gridClass: "md:col-span-1",
      },
      {
        name: "phone",
        labelKey: "Telefon",
        type: "tel",
        required: true,
        gridClass: "md:col-span-1",
      },
      {
        name: "email",
        labelKey: "Email",
        type: "email",
        required: true,
        gridClass: "md:col-span-2",
      },
      {
        name: "appointmentDate",
        labelKey: "Preferowana data",
        type: "date",
        gridClass: "md:col-span-1",
      },
      {
        name: "appointmentTime",
        labelKey: "Preferowana godzina",
        type: "time",
        gridClass: "md:col-span-1",
      },
    ],
  },
  registration: {
    name: "Rejestracja firmy (ZZP/BV)",
    type: "registration",
    fields: [
      {
        name: "name",
        labelKey: "Imię i nazwisko",
        type: "text",
        required: true,
      },
      { name: "phone", labelKey: "Telefon", type: "tel", required: true },
      {
        name: "email",
        labelKey: "Email",
        type: "email",
        required: true,
        gridClass: "md:col-span-2",
      },
      {
        name: "legalForm",
        labelKey: "Forma prawna",
        type: "select",
        required: true,
        options: [
          { value: "zzp", labelKey: "ZZP (Jednoosobowa)" },
          { value: "bv", labelKey: "BV (Spółka z o.o.)" },
        ],
        gridClass: "md:col-span-2",
      },
      {
        name: "bsn",
        labelKey: "BSN",
        type: "text",
        placeholderKey: "9 cyfr",
        tooltipKey: "Numer BSN potrzebny do rejestracji",
        required: true,
        pattern: "^\\d{9}$",
        patternErrorKey: "BSN musi mieć 9 cyfr",
        gridClass: "md:col-span-2",
      },
      {
        name: "appointmentDate",
        labelKey: "Preferowana data",
        type: "date",
        gridClass: "md:col-span-1",
      },
      {
        name: "appointmentTime",
        labelKey: "Preferowana godzina",
        type: "time",
        gridClass: "md:col-span-1",
      },
    ],
  },
  administration: {
    name: "Administracja miesięczna/kwartalna",
    type: "administration",
    fields: [
      {
        name: "name",
        labelKey: "Imię i nazwisko",
        type: "text",
        required: true,
      },
      { name: "phone", labelKey: "Telefon", type: "tel", required: true },
      {
        name: "email",
        labelKey: "Email",
        type: "email",
        required: true,
        gridClass: "md:col-span-2",
      },
      {
        name: "company",
        labelKey: "Nazwa firmy",
        type: "text",
        required: true,
        gridClass: "md:col-span-2",
      },
      {
        name: "kvk",
        labelKey: "Numer KVK",
        type: "text",
        placeholderKey: "8 cyfr",
        tooltipKey: "Numer Kamer van Koophandel",
        required: true,
        pattern: "^\\d{8}$",
        patternErrorKey: "KVK musi mieć 8 cyfr",
      },
      {
        name: "btw",
        labelKey: "Numer BTW",
        type: "text",
        placeholderKey: "NL000000000B01",
        tooltipKey: "Holenderski numer VAT",
        required: true,
        pattern: "^NL\\d{9}B\\d{2}$",
        patternErrorKey: "Format: NL + 9 cyfr + B + 2 cyfry",
      },
      {
        name: "invoices",
        labelKey: "Szacowana ilość faktur/miesiąc",
        type: "number",
        gridClass: "md:col-span-2",
      },
      {
        name: "appointmentDate",
        labelKey: "Preferowana data",
        type: "date",
        gridClass: "md:col-span-1",
      },
      {
        name: "appointmentTime",
        labelKey: "Preferowana godzina",
        type: "time",
        gridClass: "md:col-span-1",
      },
    ],
  },
  vat: {
    name: "Deklaracja VAT (BTW-aangifte)",
    type: "vat",
    fields: [
      {
        name: "name",
        labelKey: "Imię i nazwisko",
        type: "text",
        required: true,
      },
      { name: "phone", labelKey: "Telefon", type: "tel", required: true },
      {
        name: "email",
        labelKey: "Email",
        type: "email",
        required: true,
        gridClass: "md:col-span-2",
      },
      {
        name: "company",
        labelKey: "Nazwa firmy",
        type: "text",
        required: true,
        gridClass: "md:col-span-2",
      },
      {
        name: "btw",
        labelKey: "Numer BTW",
        type: "text",
        placeholderKey: "NL000000000B01",
        required: true,
        pattern: "^NL\\d{9}B\\d{2}$",
        patternErrorKey: "Format: NL + 9 cyfr + B + 2 cyfry",
        gridClass: "md:col-span-2",
      },
      {
        name: "year",
        labelKey: "Rok podatkowy",
        type: "number",
        required: true,
      },
      {
        name: "filingPeriod",
        labelKey: "Okres rozliczeniowy",
        type: "select",
        required: true,
        options: [
          { value: "monthly", labelKey: "Miesięcznie" },
          { value: "quarterly", labelKey: "Kwartalnie" },
        ],
      },
      {
        name: "appointmentDate",
        labelKey: "Preferowana data",
        type: "date",
        gridClass: "md:col-span-1",
      },
      {
        name: "appointmentTime",
        labelKey: "Preferowana godzina",
        type: "time",
        gridClass: "md:col-span-1",
      },
    ],
  },
  annual: {
    name: "Rozliczenie roczne",
    type: "annual",
    fields: [
      {
        name: "name",
        labelKey: "Imię i nazwisko",
        type: "text",
        required: true,
      },
      { name: "phone", labelKey: "Telefon", type: "tel", required: true },
      {
        name: "email",
        labelKey: "Email",
        type: "email",
        required: true,
        gridClass: "md:col-span-2",
      },
      {
        name: "company",
        labelKey: "Nazwa firmy",
        type: "text",
        required: true,
        gridClass: "md:col-span-2",
      },
      {
        name: "kvk",
        labelKey: "Numer KVK",
        type: "text",
        placeholderKey: "8 cyfr",
        pattern: "^\\d{8}$",
        patternErrorKey: "KVK musi mieć 8 cyfr",
      },
      {
        name: "bsn",
        labelKey: "BSN",
        type: "text",
        placeholderKey: "9 cyfr",
        pattern: "^\\d{9}$",
        patternErrorKey: "BSN musi mieć 9 cyfr",
      },
      {
        name: "year",
        labelKey: "Rok podatkowy",
        type: "number",
        required: true,
      },
      {
        name: "appointmentDate",
        labelKey: "Preferowana data",
        type: "date",
        gridClass: "md:col-span-1",
      },
      {
        name: "appointmentTime",
        labelKey: "Preferowana godzina",
        type: "time",
        gridClass: "md:col-span-1",
      },
    ],
  },
  payroll: {
    name: "Kadry i płace (Salarisadministratie)",
    type: "payroll",
    fields: [
      {
        name: "name",
        labelKey: "Imię i nazwisko",
        type: "text",
        required: true,
      },
      { name: "phone", labelKey: "Telefon", type: "tel", required: true },
      {
        name: "email",
        labelKey: "Email",
        type: "email",
        required: true,
        gridClass: "md:col-span-2",
      },
      {
        name: "company",
        labelKey: "Nazwa firmy",
        type: "text",
        required: true,
        gridClass: "md:col-span-2",
      },
      {
        name: "kvk",
        labelKey: "Numer KVK",
        type: "text",
        placeholderKey: "8 cyfr",
        required: true,
        pattern: "^\\d{8}$",
        patternErrorKey: "KVK musi mieć 8 cyfr",
      },
      {
        name: "payrollTaxNumber",
        labelKey: "Numer loonheffingennummer",
        type: "text",
        placeholderKey: "Numer podatkowy pracodawcy",
        required: true,
      },
      {
        name: "employees",
        labelKey: "Liczba pracowników",
        type: "number",
        required: true,
        gridClass: "md:col-span-2",
      },
      {
        name: "appointmentDate",
        labelKey: "Preferowana data",
        type: "date",
        gridClass: "md:col-span-1",
      },
      {
        name: "appointmentTime",
        labelKey: "Preferowana godzina",
        type: "time",
        gridClass: "md:col-span-1",
      },
    ],
  },
  consultation: {
    name: "Konsultacja podatkowa i biznesowa",
    type: "consultation",
    fields: [
      {
        name: "name",
        labelKey: "Imię i nazwisko",
        type: "text",
        required: true,
      },
      { name: "phone", labelKey: "Telefon", type: "tel", required: true },
      {
        name: "email",
        labelKey: "Email",
        type: "email",
        required: true,
        gridClass: "md:col-span-2",
      },
      {
        name: "company",
        labelKey: "Nazwa firmy (opcjonalnie)",
        type: "text",
        gridClass: "md:col-span-2",
      },
      {
        name: "message",
        labelKey: "Temat konsultacji",
        type: "textarea",
        required: true,
        gridClass: "md:col-span-2",
      },
      {
        name: "appointmentDate",
        labelKey: "Preferowana data",
        type: "date",
        gridClass: "md:col-span-1",
      },
      {
        name: "appointmentTime",
        labelKey: "Preferowana godzina",
        type: "time",
        gridClass: "md:col-span-1",
      },
    ],
  },
  audit: {
    name: "Kontrola i korekta księgowości",
    type: "audit",
    fields: [
      {
        name: "name",
        labelKey: "Imię i nazwisko",
        type: "text",
        required: true,
      },
      { name: "phone", labelKey: "Telefon", type: "tel", required: true },
      {
        name: "email",
        labelKey: "Email",
        type: "email",
        required: true,
        gridClass: "md:col-span-2",
      },
      {
        name: "company",
        labelKey: "Nazwa firmy",
        type: "text",
        gridClass: "md:col-span-2",
      },
      {
        name: "message",
        labelKey: "Opis problemu",
        type: "textarea",
        required: true,
        gridClass: "md:col-span-2",
      },
      {
        name: "appointmentDate",
        labelKey: "Preferowana data",
        type: "date",
        gridClass: "md:col-span-1",
      },
      {
        name: "appointmentTime",
        labelKey: "Preferowana godzina",
        type: "time",
        gridClass: "md:col-span-1",
      },
    ],
  },
  financing: {
    name: "Zasiłki i dodatki (Toeslagen)",
    type: "financing",
    fields: [
      {
        name: "name",
        labelKey: "Imię i nazwisko",
        type: "text",
        required: true,
      },
      { name: "email", labelKey: "Email", type: "email", required: true },
      { name: "phone", labelKey: "Telefon", type: "tel", required: true },
      { name: "company", labelKey: "Nazwa firmy (opcjonalnie)", type: "text" },
      {
        name: "financingType",
        labelKey: "Rodzaj zasiłku",
        type: "checkbox-group",
        required: true,
        gridClass: "md:col-span-2",
        options: [
          { value: "zorgtoeslag", labelKey: "Zorgtoeslag (dodatek zdrowotny)" },
          {
            value: "huurtoeslag",
            labelKey: "Huurtoeslag (dodatek mieszkaniowy)",
          },
          {
            value: "kinderopvangtoeslag",
            labelKey: "Kinderopvangtoeslag (opieka nad dziećmi)",
          },
          {
            value: "kindgebonden_budget",
            labelKey: "Kindgebonden budget (budżet na dzieci)",
          },
        ],
      },
      {
        name: "bsn",
        labelKey: "BSN",
        type: "text",
        placeholderKey: "9 cyfr",
        required: true,
        pattern: "^\\d{9}$",
        patternErrorKey: "BSN musi mieć 9 cyfr",
      },
      {
        name: "annualIncome",
        labelKey: "Szacowany roczny dochód (€)",
        type: "number",
        required: true,
      },
      {
        name: "hasPartner",
        labelKey: "Czy masz partnera/współmałżonka?",
        type: "radio-group",
        required: true,
        gridClass: "md:col-span-2",
        options: [
          { value: "yes", labelKey: "Tak" },
          { value: "no", labelKey: "Nie" },
        ],
      },
      {
        name: "appointmentDate",
        labelKey: "Preferowana data",
        type: "date",
        gridClass: "md:col-span-1",
      },
      {
        name: "appointmentTime",
        labelKey: "Preferowana godzina",
        type: "time",
        gridClass: "md:col-span-1",
      },
      {
        name: "message",
        labelKey: "Dodatkowe informacje",
        type: "textarea",
        gridClass: "md:col-span-2",
      },
    ],
  },
};

// =====================================================
// CRUD OPERATIONS
// =====================================================

export async function fetchAccountantForms(
  accountantId: string
): Promise<AccountantForm[]> {
  const { data, error } = await supabase
    .from("accountant_forms")
    .select("*")
    .eq("accountant_id", accountantId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data || []).map((form) => ({
    ...form,
    form_fields:
      typeof form.form_fields === "string"
        ? JSON.parse(form.form_fields)
        : form.form_fields,
  })) as AccountantForm[];
}

export async function fetchPublicAccountantForms(
  accountantId: string
): Promise<AccountantForm[]> {
  const { data, error } = await supabase
    .from("accountant_forms")
    .select("*")
    .eq("accountant_id", accountantId)
    .eq("is_active", true)
    .order("form_name", { ascending: true });

  if (error) throw error;
  return (data || []).map((form) => ({
    ...form,
    form_fields:
      typeof form.form_fields === "string"
        ? JSON.parse(form.form_fields)
        : form.form_fields,
  })) as AccountantForm[];
}

export async function createAccountantForm(
  data: CreateAccountantFormData
): Promise<AccountantForm> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const insertData: any = {
    accountant_id: data.accountant_id,
    form_type: data.form_type,
    form_name: data.form_name,
    form_fields: data.form_fields,
    is_active: data.is_active ?? true,
    requires_approval: data.requires_approval ?? false,
  };
  const { data: form, error } = await supabase
    .from("accountant_forms")
    .insert(insertData)
    .select()
    .single();

  if (error) throw error;
  return {
    ...form,
    form_fields:
      typeof form.form_fields === "string"
        ? JSON.parse(form.form_fields)
        : form.form_fields,
  } as AccountantForm;
}

export async function updateAccountantForm(
  formId: string,
  updates: Partial<Omit<AccountantForm, "id" | "accountant_id" | "created_at">>
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateData: any = {
    ...updates,
    updated_at: new Date().toISOString(),
  };
  // Convert form_fields to JSON-compatible format
  if (updates.form_fields) {
    updateData.form_fields = updates.form_fields as unknown as Record<
      string,
      unknown
    >[];
  }
  const { error } = await supabase
    .from("accountant_forms")
    .update(updateData)
    .eq("id", formId);

  if (error) throw error;
}

export async function deleteAccountantForm(formId: string): Promise<void> {
  const { error } = await supabase
    .from("accountant_forms")
    .delete()
    .eq("id", formId);

  if (error) throw error;
}

export async function toggleAccountantFormActive(
  formId: string,
  isActive: boolean
): Promise<void> {
  const { error } = await supabase
    .from("accountant_forms")
    .update({
      is_active: isActive,
      updated_at: new Date().toISOString(),
    })
    .eq("id", formId);

  if (error) throw error;
}

// Create default forms for new accountant
export async function createDefaultFormsForAccountant(
  accountantId: string
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const formsToCreate: any[] = Object.values(DEFAULT_FORM_TEMPLATES).map(
    (template) => ({
      accountant_id: accountantId,
      form_type: template.type,
      form_name: template.name,
      form_fields: template.fields,
      is_active: true,
      requires_approval: false,
    })
  );

  const { error } = await supabase
    .from("accountant_forms")
    .insert(formsToCreate);

  if (error) throw error;
}

// =====================================================
// FORM SUBMISSIONS
// =====================================================

export type SubmissionStatus = "new" | "in_progress" | "completed" | "rejected";

export interface FormSubmission {
  id: string;
  form_id: string;
  accountant_id: string;
  submitter_profile_id: string | null;
  submitter_name: string;
  submitter_email: string;
  submitter_phone: string | null;
  form_data: Record<string, any>;
  status: SubmissionStatus;
  accountant_notes: string | null;
  created_at: string;
  updated_at: string;
  read_at: string | null;
  responded_at: string | null;
  // Joined data
  form?: AccountantForm;
}

export interface CreateSubmissionData {
  form_id: string;
  accountant_id: string;
  submitter_profile_id?: string | null;
  submitter_name: string;
  submitter_email: string;
  submitter_phone?: string;
  form_data: Record<string, any>;
}

// Submit a form (public - anyone can submit)
export async function submitFormRequest(
  data: CreateSubmissionData
): Promise<FormSubmission> {
  const { data: submission, error } = await (supabase as any)
    .from("accountant_form_submissions")
    .insert({
      form_id: data.form_id,
      accountant_id: data.accountant_id,
      submitter_profile_id: data.submitter_profile_id || null,
      submitter_name: data.submitter_name,
      submitter_email: data.submitter_email,
      submitter_phone: data.submitter_phone || null,
      form_data: data.form_data,
      status: "new",
    })
    .select()
    .single();

  if (error) throw error;
  return submission as FormSubmission;
}

// Fetch submissions for accountant
export async function fetchAccountantSubmissions(
  accountantId: string
): Promise<FormSubmission[]> {
  const { data, error } = await (supabase as any)
    .from("accountant_form_submissions")
    .select(
      `
      *,
      form:accountant_forms(id, form_type, form_name)
    `
    )
    .eq("accountant_id", accountantId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data || []) as FormSubmission[];
}

// Update submission status
export async function updateSubmissionStatus(
  submissionId: string,
  status: SubmissionStatus,
  notes?: string
): Promise<void> {
  const updateData: any = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (notes !== undefined) {
    updateData.accountant_notes = notes;
  }

  if (
    status === "in_progress" ||
    status === "completed" ||
    status === "rejected"
  ) {
    updateData.responded_at = new Date().toISOString();
  }

  const { error } = await (supabase as any)
    .from("accountant_form_submissions")
    .update(updateData)
    .eq("id", submissionId);

  if (error) throw error;
}

// Mark submission as read
export async function markSubmissionAsRead(
  submissionId: string
): Promise<void> {
  const { error } = await (supabase as any)
    .from("accountant_form_submissions")
    .update({
      read_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", submissionId);

  if (error) throw error;
}

// Delete submission
export async function deleteSubmission(submissionId: string): Promise<void> {
  const { error } = await (supabase as any)
    .from("accountant_form_submissions")
    .delete()
    .eq("id", submissionId);

  if (error) throw error;
}

// Get unread submissions count
export async function getUnreadSubmissionsCount(
  accountantId: string
): Promise<number> {
  const { count, error } = await (supabase as any)
    .from("accountant_form_submissions")
    .select("*", { count: "exact", head: true })
    .eq("accountant_id", accountantId)
    .is("read_at", null);

  if (error) throw error;
  return count || 0;
}
