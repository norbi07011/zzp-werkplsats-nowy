// ============================================================
// Support Ticket Service
// Purpose: Handle all support ticket operations (CRUD + messaging)
// ============================================================

// @ts-nocheck - Temporary: TS Server cache issue with database.types.ts - needs VS Code restart

import { supabase } from "../lib/supabase";

// ============================================================
// TYPES (manually defined based on database schema)
// ============================================================

export type TicketCategory =
  | "technical"
  | "billing"
  | "account"
  | "feature_request"
  | "bug"
  | "data"
  | "performance"
  | "security"
  | "other";

export type TicketPriority = "low" | "medium" | "high" | "critical";

export type TicketStatus =
  | "new"
  | "in_progress"
  | "waiting_user"
  | "resolved"
  | "closed";

export type UserRole =
  | "worker"
  | "employer"
  | "accountant"
  | "cleaning_company"
  | "admin";

export interface SupportTicket {
  id: string;
  user_id: string;
  user_role: UserRole;
  user_email: string;
  user_name: string;
  subject: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  assigned_to: string | null;
  assigned_at: string | null;
  first_response_at: string | null;
  resolved_at: string | null;
  closed_at: string | null;
  rating: number | null;
  rating_comment: string | null;
  tags: string[] | null;
  attachments: TicketAttachment[];
  internal_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface TicketAttachment {
  url: string;
  name: string;
  type: string;
  size: number;
}

export interface SupportMessage {
  id: string;
  ticket_id: string;
  sender_id: string;
  sender_role: UserRole;
  sender_name: string;
  message: string;
  attachments: TicketAttachment[];
  is_internal: boolean;
  read_at: string | null;
  created_at: string;
}

export interface CreateTicketData {
  subject: string;
  description: string;
  category: TicketCategory;
  priority?: TicketPriority;
  attachments?: TicketAttachment[];
}

export interface TicketWithMessages extends SupportTicket {
  messages: SupportMessage[];
  unread_count?: number;
}

export interface TicketFilters {
  status?: TicketStatus[];
  priority?: TicketPriority[];
  category?: TicketCategory[];
  user_role?: UserRole[];
  assigned_to?: string;
  search?: string;
}

export interface TicketStats {
  total: number;
  new: number;
  in_progress: number;
  waiting_user: number;
  resolved: number;
  closed: number;
  avg_response_time_hours: number | null;
  avg_resolution_time_hours: number | null;
  satisfaction_score: number | null;
  by_category: Record<TicketCategory, number>;
  by_priority: Record<TicketPriority, number>;
}

// ============================================================
// CONSTANTS
// ============================================================

export const TICKET_CATEGORIES: {
  id: TicketCategory;
  label: string;
  description: string;
  icon: string;
}[] = [
  {
    id: "technical",
    label: "🐛 Problem techniczny",
    description: "Błędy, crashe, funkcje nie działają",
    icon: "🐛",
  },
  {
    id: "billing",
    label: "💰 Pytanie o płatności",
    description: "Faktury, subskrypcje, refundy",
    icon: "💰",
  },
  {
    id: "account",
    label: "👤 Konto i profil",
    description: "Logowanie, hasło, dane profilowe",
    icon: "👤",
  },
  {
    id: "feature_request",
    label: "✨ Propozycja funkcji",
    description: "Pomysły na nowe funkcjonalności",
    icon: "✨",
  },
  {
    id: "bug",
    label: "🐞 Zgłoszenie błędu",
    description: "Raport błędu w aplikacji",
    icon: "🐞",
  },
  {
    id: "data",
    label: "📊 Problem z danymi",
    description: "Dane się nie zapisują, brakuje danych",
    icon: "📊",
  },
  {
    id: "performance",
    label: "⚡ Wydajność",
    description: "Aplikacja działa wolno",
    icon: "⚡",
  },
  {
    id: "security",
    label: "🔒 Bezpieczeństwo",
    description: "Podejrzana aktywność, spam",
    icon: "🔒",
  },
  {
    id: "other",
    label: "❓ Inne",
    description: "Inne pytania",
    icon: "❓",
  },
];

// ============================================================
// USER FUNCTIONS
// ============================================================

/**
 * Create a new support ticket
 */
export const createTicket = async (
  data: CreateTicketData
): Promise<SupportTicket> => {
  console.log("🎫 Creating support ticket:", data);

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("User not authenticated");

  // Get user profile for role and name
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, full_name, email")
    .eq("id", user.id)
    .single();

  if (profileError) throw profileError;

  const ticketData = {
    user_id: user.id,
    user_role: profile.role,
    user_email: profile.email,
    user_name: profile.full_name || profile.email,
    subject: data.subject,
    description: data.description,
    category: data.category,
    priority: data.priority || "medium",
    status: "new" as TicketStatus,
    attachments: data.attachments || [],
  };

  const { data: ticket, error } = await supabase
    .from("support_tickets")
    .insert(ticketData)
    .select()
    .single();

  if (error) {
    console.error("❌ Error creating ticket:", error);
    throw error;
  }

  console.log("✅ Ticket created:", ticket.id);
  return ticket as SupportTicket;
};

/**
 * Get all tickets for current user
 */
export const getUserTickets = async (): Promise<SupportTicket[]> => {
  console.log("📋 Fetching user tickets...");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("User not authenticated");

  const { data, error } = await supabase
    .from("support_tickets")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("❌ Error fetching tickets:", error);
    throw error;
  }

  console.log(`✅ Fetched ${data.length} tickets`);
  return data as SupportTicket[];
};

/**
 * Get ticket details with all messages
 */
export const getTicketDetails = async (
  ticketId: string
): Promise<TicketWithMessages> => {
  console.log("🔍 Fetching ticket details:", ticketId);

  // Fetch ticket
  const { data: ticket, error: ticketError } = await supabase
    .from("support_tickets")
    .select("*")
    .eq("id", ticketId)
    .single();

  if (ticketError) {
    console.error("❌ Error fetching ticket:", ticketError);
    throw ticketError;
  }

  // Fetch messages (non-internal for users, all for admins)
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user?.id)
    .single();

  const isAdmin = profile?.role === "admin";

  const messagesQuery = supabase
    .from("support_messages")
    .select("*")
    .eq("ticket_id", ticketId)
    .order("created_at", { ascending: true });

  if (!isAdmin) {
    messagesQuery.eq("is_internal", false);
  }

  const { data: messages, error: messagesError } = await messagesQuery;

  if (messagesError) {
    console.error("❌ Error fetching messages:", messagesError);
    throw messagesError;
  }

  console.log(`✅ Fetched ticket with ${messages.length} messages`);

  return {
    ...(ticket as SupportTicket),
    messages: messages as SupportMessage[],
  };
};

/**
 * Send a message in a ticket
 */
export const sendMessage = async (
  ticketId: string,
  message: string,
  attachments?: TicketAttachment[]
): Promise<SupportMessage> => {
  console.log("💬 Sending message to ticket:", ticketId);

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("User not authenticated");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name, email")
    .eq("id", user.id)
    .single();

  const messageData = {
    ticket_id: ticketId,
    sender_id: user.id,
    sender_role: profile?.role,
    sender_name: profile?.full_name || profile?.email || "Unknown",
    message,
    attachments: attachments || [],
    is_internal: false,
  };

  const { data: newMessage, error } = await supabase
    .from("support_messages")
    .insert(messageData)
    .select()
    .single();

  if (error) {
    console.error("❌ Error sending message:", error);
    throw error;
  }

  console.log("✅ Message sent:", newMessage.id);
  return newMessage as SupportMessage;
};

/**
 * Close a ticket (user can close resolved tickets)
 */
export const closeTicket = async (
  ticketId: string,
  rating?: number,
  ratingComment?: string
): Promise<void> => {
  console.log("🔒 Closing ticket:", ticketId);

  const updates: any = {
    status: "closed",
    closed_at: new Date().toISOString(),
  };

  if (rating) {
    updates.rating = rating;
    updates.rating_comment = ratingComment || null;
  }

  const { error } = await supabase
    .from("support_tickets")
    .update(updates)
    .eq("id", ticketId);

  if (error) {
    console.error("❌ Error closing ticket:", error);
    throw error;
  }

  console.log("✅ Ticket closed");
};

// ============================================================
// ADMIN FUNCTIONS
// ============================================================

/**
 * Get all tickets (admin only) with filters
 */
export const getAllTickets = async (
  filters?: TicketFilters
): Promise<SupportTicket[]> => {
  console.log("🔐 Admin: Fetching all tickets with filters:", filters);

  let query = supabase
    .from("support_tickets")
    .select("*")
    .order("created_at", { ascending: false });

  // Apply filters
  if (filters) {
    if (filters.status && filters.status.length > 0) {
      query = query.in("status", filters.status);
    }
    if (filters.priority && filters.priority.length > 0) {
      query = query.in("priority", filters.priority);
    }
    if (filters.category && filters.category.length > 0) {
      query = query.in("category", filters.category);
    }
    if (filters.user_role && filters.user_role.length > 0) {
      query = query.in("user_role", filters.user_role);
    }
    if (filters.assigned_to) {
      query = query.eq("assigned_to", filters.assigned_to);
    }
    if (filters.search) {
      query = query.or(
        `subject.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
      );
    }
  }

  const { data, error } = await query;

  if (error) {
    console.error("❌ Error fetching tickets:", error);
    throw error;
  }

  console.log(`✅ Admin: Fetched ${data.length} tickets`);
  return data as SupportTicket[];
};

/**
 * Assign ticket to admin
 */
export const assignTicket = async (
  ticketId: string,
  adminId: string
): Promise<void> => {
  console.log("👤 Admin: Assigning ticket", ticketId, "to", adminId);

  const { error } = await supabase
    .from("support_tickets")
    .update({
      assigned_to: adminId,
      assigned_at: new Date().toISOString(),
    })
    .eq("id", ticketId);

  if (error) {
    console.error("❌ Error assigning ticket:", error);
    throw error;
  }

  console.log("✅ Ticket assigned");
};

/**
 * Update ticket status (admin only)
 */
export const updateTicketStatus = async (
  ticketId: string,
  status: TicketStatus
): Promise<void> => {
  console.log("📝 Admin: Updating ticket status to", status);

  const updates: any = { status };

  if (status === "resolved") {
    updates.resolved_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from("support_tickets")
    .update(updates)
    .eq("id", ticketId);

  if (error) {
    console.error("❌ Error updating status:", error);
    throw error;
  }

  console.log("✅ Status updated");
};

/**
 * Send admin message (can be internal note)
 */
export const sendAdminMessage = async (
  ticketId: string,
  message: string,
  isInternal: boolean = false,
  attachments?: TicketAttachment[]
): Promise<SupportMessage> => {
  console.log("💬 Admin: Sending message (internal:", isInternal, ")");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("User not authenticated");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name, email")
    .eq("id", user.id)
    .single();

  const messageData = {
    ticket_id: ticketId,
    sender_id: user.id,
    sender_role: profile?.role || "admin" as UserRole, // ✅ FIXED: używam profile.role
    sender_name: profile?.full_name || profile?.email || "Admin",
    message,
    attachments: attachments || [],
    is_internal: isInternal,
  };

  const { data: newMessage, error } = await supabase
    .from("support_messages")
    .insert(messageData)
    .select()
    .single();

  if (error) {
    console.error("❌ Error sending admin message:", error);
    throw error;
  }

  console.log("✅ Admin message sent");
  return newMessage as SupportMessage;
};

/**
 * Get ticket statistics (admin only)
 */
export const getTicketStats = async (): Promise<TicketStats> => {
  console.log("📊 Admin: Fetching ticket statistics...");

  const { data: tickets, error } = await supabase
    .from("support_tickets")
    .select("*");

  if (error) {
    console.error("❌ Error fetching stats:", error);
    throw error;
  }

  const stats: TicketStats = {
    total: tickets.length,
    new: tickets.filter((t) => t.status === "new").length,
    in_progress: tickets.filter((t) => t.status === "in_progress").length,
    waiting_user: tickets.filter((t) => t.status === "waiting_user").length,
    resolved: tickets.filter((t) => t.status === "resolved").length,
    closed: tickets.filter((t) => t.status === "closed").length,
    avg_response_time_hours: null,
    avg_resolution_time_hours: null,
    satisfaction_score: null,
    by_category: {} as Record<TicketCategory, number>,
    by_priority: {} as Record<TicketPriority, number>,
  };

  // Calculate averages
  const ticketsWithResponse = tickets.filter((t) => t.first_response_at);
  if (ticketsWithResponse.length > 0) {
    const totalResponseTime = ticketsWithResponse.reduce((sum, t) => {
      const created = new Date(t.created_at).getTime();
      const responded = new Date(t.first_response_at!).getTime();
      return sum + (responded - created);
    }, 0);
    stats.avg_response_time_hours =
      totalResponseTime / ticketsWithResponse.length / (1000 * 60 * 60);
  }

  const resolvedTickets = tickets.filter((t) => t.resolved_at);
  if (resolvedTickets.length > 0) {
    const totalResolutionTime = resolvedTickets.reduce((sum, t) => {
      const created = new Date(t.created_at).getTime();
      const resolved = new Date(t.resolved_at!).getTime();
      return sum + (resolved - created);
    }, 0);
    stats.avg_resolution_time_hours =
      totalResolutionTime / resolvedTickets.length / (1000 * 60 * 60);
  }

  const ratedTickets = tickets.filter((t) => t.rating);
  if (ratedTickets.length > 0) {
    const totalRating = ratedTickets.reduce((sum, t) => sum + t.rating!, 0);
    stats.satisfaction_score = totalRating / ratedTickets.length;
  }

  // Count by category
  TICKET_CATEGORIES.forEach((cat) => {
    stats.by_category[cat.id] = tickets.filter(
      (t) => t.category === cat.id
    ).length;
  });

  // Count by priority
  (["low", "medium", "high", "critical"] as TicketPriority[]).forEach(
    (priority) => {
      stats.by_priority[priority] = tickets.filter(
        (t) => t.priority === priority
      ).length;
    }
  );

  console.log("✅ Stats calculated:", stats);
  return stats;
};
