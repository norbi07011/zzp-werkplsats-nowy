/**
 * ================================================================
 * DOCUMENT BUILDER SERVICE - Supabase Integration
 * ================================================================
 * Obsługuje CRUD dla szablonów dokumentów w bazie danych
 */

import { supabaseUntyped as supabase } from "../../../lib/supabase";
import type {
  QuoteTemplate,
  ResourceTemplate,
  CompanyProfile,
  Client,
  Quote,
  QuoteStyle,
} from "./types";
import { defaultQuoteStyle } from "./types";

// ============================================
// TYPES for Database
// ============================================

export interface DbQuoteTemplate {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  subject: string;
  intro_text: string | null;
  items: any[];
  materials: any[];
  tools: any[];
  category: string;
  tags: string[];
  is_public: boolean;
  is_system_template: boolean;
  usage_count: number;
  last_used_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbResourceTemplate {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  materials: any[];
  tools: any[];
  category: string;
  tags: string[];
  is_public: boolean;
  is_system_template: boolean;
  usage_count: number;
  last_used_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbCompanyProfile {
  id: string;
  user_id: string;
  name: string | null;
  address: string | null;
  postal_code: string | null;
  city: string | null;
  kvk: string | null;
  btw: string | null;
  iban: string | null;
  bank_name: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  logo_url: string | null;
  quote_style: QuoteStyle | null;
  created_at: string;
  updated_at: string;
}

export interface DbClient {
  id: string;
  user_id: string;
  name: string;
  address: string | null;
  postal_code: string | null;
  city: string | null;
  email: string | null;
  phone: string | null;
  kvk: string | null;
  contact_person: string | null;
  notes: string | null;
  usage_count: number;
  last_used_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbSavedQuote {
  id: string;
  user_id: string;
  reference_number: string;
  date: string;
  execution_date: string | null;
  status: "draft" | "sent" | "approved" | "completed" | "cancelled";
  client_id: string | null;
  client_data: any;
  location: string | null;
  subject: string;
  intro_text: string | null;
  notes: string | null;
  items: any[];
  materials: any[];
  tools: any[];
  images: any[];
  estimated_hours: number;
  hourly_rate: number;
  risk_buffer: number;
  show_item_prices: boolean;
  show_material_prices: boolean;
  show_tool_prices: boolean;
  language: string;
  pdf_url: string | null;
  pdf_generated_at: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================
// QUOTE TEMPLATES
// ============================================

export async function fetchQuoteTemplates(): Promise<QuoteTemplate[]> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) {
    console.warn(
      "[documentService] No session for fetchQuoteTemplates - returning empty"
    );
    return [];
  }

  const { data, error } = await supabase
    .from("quote_templates")
    .select("*")
    .or(`user_id.eq.${session.user.id},is_public.eq.true`)
    .order("usage_count", { ascending: false });

  if (error) {
    console.error("[documentService] fetchQuoteTemplates error:", error);
    throw error;
  }
  return (data || []).map(mapDbToQuoteTemplate);
}

export async function createQuoteTemplate(
  template: Omit<QuoteTemplate, "id">
): Promise<QuoteTemplate> {
  // Get session directly - faster than getUser() which makes a network request
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session?.user) {
    console.error("[documentService] No session found:", sessionError);
    throw new Error("Not authenticated - please log in again");
  }

  const userId = session.user.id;
  console.log("[documentService] Creating template for user:", userId);

  try {
    const { data, error } = await supabase
      .from("quote_templates")
      .insert({
        user_id: userId,
        name: template.name,
        subject: template.subject,
        intro_text: template.introText,
        items: template.items,
        materials: template.materials || [],
        tools: template.tools || [],
        category: "custom",
      })
      .select()
      .single();

    if (error) {
      console.error("[documentService] Insert error:", error);
      throw error;
    }

    console.log("[documentService] Template created successfully:", data.id);
    return mapDbToQuoteTemplate(data);
  } catch (error) {
    console.error("[documentService] createQuoteTemplate error:", error);
    throw error;
  }
}

export async function updateQuoteTemplate(
  id: string,
  template: Partial<QuoteTemplate>
): Promise<QuoteTemplate> {
  const { data, error } = await supabase
    .from("quote_templates")
    .update({
      name: template.name,
      subject: template.subject,
      intro_text: template.introText,
      items: template.items,
      materials: template.materials,
      tools: template.tools,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return mapDbToQuoteTemplate(data);
}

export async function deleteQuoteTemplate(id: string): Promise<void> {
  const { error } = await supabase
    .from("quote_templates")
    .delete()
    .eq("id", id);
  if (error) throw error;
}

export async function incrementTemplateUsage(id: string): Promise<void> {
  const { error } = await supabase.rpc("increment_template_usage", {
    template_id: id,
  });
  // Fallback if RPC doesn't exist
  if (error) {
    await supabase
      .from("quote_templates")
      .update({
        usage_count: supabase.rpc("increment", { x: 1 }) as any,
        last_used_at: new Date().toISOString(),
      })
      .eq("id", id);
  }
}

// ============================================
// RESOURCE TEMPLATES
// ============================================

export async function fetchResourceTemplates(): Promise<ResourceTemplate[]> {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("resource_templates")
    .select("*")
    .or(`user_id.eq.${user.user.id},is_public.eq.true`)
    .order("usage_count", { ascending: false });

  if (error) throw error;
  return (data || []).map(mapDbToResourceTemplate);
}

export async function createResourceTemplate(
  template: Omit<ResourceTemplate, "id">
): Promise<ResourceTemplate> {
  // Get user with timeout protection
  const getUserWithTimeout = async () => {
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Auth timeout")), 5000)
    );
    const userPromise = supabase.auth.getUser();
    return Promise.race([userPromise, timeoutPromise]);
  };

  try {
    const { data: user } = await getUserWithTimeout();
    if (!user?.user) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from("resource_templates")
      .insert({
        user_id: user.user.id,
        name: template.name,
        materials: template.materials,
        tools: template.tools,
      })
      .select()
      .single();

    if (error) throw error;
    return mapDbToResourceTemplate(data);
  } catch (error) {
    console.error("createResourceTemplate error:", error);
    throw error;
  }
}

export async function deleteResourceTemplate(id: string): Promise<void> {
  const { error } = await supabase
    .from("resource_templates")
    .delete()
    .eq("id", id);
  if (error) throw error;
}

// ============================================
// COMPANY PROFILE
// ============================================

export async function fetchCompanyProfile(): Promise<CompanyProfile | null> {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("document_company_profiles")
    .select("*")
    .eq("user_id", user.user.id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return mapDbToCompanyProfile(data);
}

export async function upsertCompanyProfile(
  profile: CompanyProfile
): Promise<CompanyProfile> {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("document_company_profiles")
    .upsert(
      {
        user_id: user.user.id,
        name: profile.name,
        address: profile.address,
        postal_code: profile.postalCode,
        city: profile.city,
        kvk: profile.kvk,
        btw: profile.btw,
        iban: profile.iban,
        bank_name: profile.bankName,
        email: profile.email,
        phone: profile.phone,
        website: profile.website,
        logo_url: profile.logoUrl,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    )
    .select()
    .single();

  if (error) throw error;
  return mapDbToCompanyProfile(data);
}

// ============================================
// QUOTE STYLE
// ============================================

export async function fetchQuoteStyle(): Promise<QuoteStyle> {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("document_company_profiles")
    .select("quote_style")
    .eq("user_id", user.user.id)
    .maybeSingle();

  if (error) throw error;

  // Jeśli nie ma profilu lub quote_style - zwróć domyślny styl
  if (!data || !data.quote_style) {
    return defaultQuoteStyle;
  }

  // Merge z defaultQuoteStyle żeby zapewnić wszystkie pola
  return { ...defaultQuoteStyle, ...data.quote_style };
}

export async function upsertQuoteStyle(style: QuoteStyle): Promise<QuoteStyle> {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("Not authenticated");

  // Najpierw sprawdź czy profil istnieje
  const { data: existingProfile } = await supabase
    .from("document_company_profiles")
    .select("id")
    .eq("user_id", user.user.id)
    .maybeSingle();

  if (existingProfile) {
    // Update istniejącego profilu
    const { data, error } = await supabase
      .from("document_company_profiles")
      .update({
        quote_style: style,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.user.id)
      .select("quote_style")
      .single();

    if (error) throw error;
    return { ...defaultQuoteStyle, ...data.quote_style };
  } else {
    // Utwórz nowy profil z quote_style
    const { data, error } = await supabase
      .from("document_company_profiles")
      .insert({
        user_id: user.user.id,
        quote_style: style,
      })
      .select("quote_style")
      .single();

    if (error) throw error;
    return { ...defaultQuoteStyle, ...data.quote_style };
  }
}

// ============================================
// CLIENTS
// ============================================

export async function fetchClients(): Promise<Client[]> {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("document_clients")
    .select("*")
    .eq("user_id", user.user.id)
    .order("usage_count", { ascending: false });

  if (error) throw error;
  return (data || []).map(mapDbToClient);
}

export async function createClient(
  client: Omit<Client, "id">
): Promise<Client> {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("document_clients")
    .insert({
      user_id: user.user.id,
      name: client.name,
      address: client.address,
      postal_code: client.postalCode,
      city: client.city,
    })
    .select()
    .single();

  if (error) throw error;
  return mapDbToClient(data);
}

export async function updateClient(
  id: string,
  client: Partial<Client>
): Promise<Client> {
  const { data, error } = await supabase
    .from("document_clients")
    .update({
      name: client.name,
      address: client.address,
      postal_code: client.postalCode,
      city: client.city,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return mapDbToClient(data);
}

export async function deleteClient(id: string): Promise<void> {
  const { error } = await supabase
    .from("document_clients")
    .delete()
    .eq("id", id);
  if (error) throw error;
}

// ============================================
// SAVED QUOTES
// ============================================

export async function fetchSavedQuotes(): Promise<Quote[]> {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("saved_quotes")
    .select("*")
    .eq("user_id", user.user.id)
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return (data || []).map(mapDbToQuote);
}

export async function saveQuote(quote: Quote): Promise<Quote> {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("Not authenticated");

  const dbQuote = {
    user_id: user.user.id,
    reference_number: quote.referenceNumber,
    date: quote.date,
    execution_date: quote.executionDate || null,
    status: quote.status.toLowerCase().replace(" ", "_"),
    client_data: quote.client,
    location: quote.location,
    subject: quote.subject,
    intro_text: quote.introText,
    notes: quote.notes,
    items: quote.items,
    materials: quote.materials,
    tools: quote.tools,
    images: quote.images,
    estimated_hours: quote.estimatedHours,
    hourly_rate: quote.hourlyRate,
    risk_buffer: quote.riskBuffer,
    show_item_prices: quote.showItemPrices,
    show_material_prices: quote.showMaterialPrices,
    show_tool_prices: quote.showToolPrices,
    updated_at: new Date().toISOString(),
  };

  // Check if quote exists (has valid UUID)
  const isNewQuote = !quote.id || quote.id === "1" || !isValidUUID(quote.id);

  if (isNewQuote) {
    const { data, error } = await supabase
      .from("saved_quotes")
      .insert(dbQuote)
      .select()
      .single();

    if (error) throw error;
    return mapDbToQuote(data);
  } else {
    const { data, error } = await supabase
      .from("saved_quotes")
      .update(dbQuote)
      .eq("id", quote.id)
      .select()
      .single();

    if (error) throw error;
    return mapDbToQuote(data);
  }
}

export async function deleteQuote(id: string): Promise<void> {
  const { error } = await supabase.from("saved_quotes").delete().eq("id", id);
  if (error) throw error;
}

// ============================================
// MAPPERS
// ============================================

function mapDbToQuoteTemplate(db: DbQuoteTemplate): QuoteTemplate {
  return {
    id: db.id,
    name: db.name,
    subject: db.subject,
    introText: db.intro_text || "",
    items: db.items || [],
    materials: db.materials || [],
    tools: db.tools || [],
  };
}

function mapDbToResourceTemplate(db: DbResourceTemplate): ResourceTemplate {
  return {
    id: db.id,
    name: db.name,
    materials: db.materials || [],
    tools: db.tools || [],
  };
}

function mapDbToCompanyProfile(db: DbCompanyProfile): CompanyProfile {
  return {
    name: db.name || "",
    address: db.address || "",
    postalCode: db.postal_code || "",
    city: db.city || "",
    kvk: db.kvk || "",
    btw: db.btw || "",
    iban: db.iban || "",
    bankName: db.bank_name || "",
    email: db.email || "",
    phone: db.phone || "",
    website: db.website || "",
    logoUrl: db.logo_url || undefined,
  };
}

function mapDbToClient(db: DbClient): Client {
  return {
    id: db.id,
    name: db.name,
    address: db.address || "",
    postalCode: db.postal_code || "",
    city: db.city || "",
  };
}

function mapDbToQuote(db: DbSavedQuote): Quote {
  const statusMap: Record<string, string> = {
    draft: "Draft",
    sent: "Verzonden",
    approved: "Goedgekeurd",
    completed: "Afgerond",
    cancelled: "Cancelled",
  };

  return {
    id: db.id,
    referenceNumber: db.reference_number,
    date: db.date,
    executionDate: db.execution_date || "",
    status: (statusMap[db.status] || "Draft") as any,
    client: db.client_data || {
      id: "",
      name: "",
      address: "",
      postalCode: "",
      city: "",
    },
    location: db.location || "",
    subject: db.subject,
    introText: db.intro_text || "",
    items: db.items || [],
    materials: db.materials || [],
    tools: db.tools || [],
    images: db.images || [],
    notes: db.notes || "",
    estimatedHours: db.estimated_hours,
    hourlyRate: db.hourly_rate,
    riskBuffer: db.risk_buffer,
    showItemPrices: db.show_item_prices,
    showMaterialPrices: db.show_material_prices,
    showToolPrices: db.show_tool_prices,
  };
}

function isValidUUID(str: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

// ============================================
// STORAGE SYNC HELPERS
// ============================================

/**
 * Migrate localStorage data to Supabase (one-time migration)
 */
export async function migrateLocalStorageToSupabase(): Promise<{
  templates: number;
  resourceTemplates: number;
  clients: number;
  company: boolean;
}> {
  const results = {
    templates: 0,
    resourceTemplates: 0,
    clients: 0,
    company: false,
  };

  try {
    // Migrate templates
    const localTemplates = localStorage.getItem("zzp_templates");
    if (localTemplates) {
      const templates = JSON.parse(localTemplates) as QuoteTemplate[];
      for (const t of templates) {
        await createQuoteTemplate(t);
        results.templates++;
      }
      localStorage.removeItem("zzp_templates");
    }

    // Migrate resource templates
    const localResourceTemplates = localStorage.getItem(
      "zzp_resource_templates"
    );
    if (localResourceTemplates) {
      const templates = JSON.parse(
        localResourceTemplates
      ) as ResourceTemplate[];
      for (const t of templates) {
        await createResourceTemplate(t);
        results.resourceTemplates++;
      }
      localStorage.removeItem("zzp_resource_templates");
    }

    // Migrate clients
    const localClients = localStorage.getItem("zzp_clients");
    if (localClients) {
      const clients = JSON.parse(localClients) as Client[];
      for (const c of clients) {
        await createClient(c);
        results.clients++;
      }
      localStorage.removeItem("zzp_clients");
    }

    // Migrate company profile
    const localCompany = localStorage.getItem("zzp_company_profile");
    if (localCompany) {
      const company = JSON.parse(localCompany) as CompanyProfile;
      await upsertCompanyProfile(company);
      results.company = true;
      localStorage.removeItem("zzp_company_profile");
    }
  } catch (error) {
    console.error("Migration error:", error);
  }

  return results;
}
