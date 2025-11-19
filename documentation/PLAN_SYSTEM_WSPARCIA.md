# 🎯 PLAN: PROFESJONALNY SYSTEM WSPARCIA (SUPPORT TICKETS)

**Data utworzenia:** 2025-11-19  
**Status:** 📋 PLANOWANIE  
**Priorytet:** 🔴 HIGH (user experience critical)

---

## 📊 ANALIZA OBECNEGO STANU

### ✅ CO JEST TERAZ (PRYMITYWNE):

**Obecna implementacja:**

```typescript
const handleContactSupport = () => {
  window.location.href =
    "mailto:support@zzpwerkplaats.nl?subject=Wsparcie dla administratora";
};
```

**Przyciski "Wsparcie" w dashboardach:**

- ✅ AdminDashboard - przycisk w Quick Actions
- ✅ WorkerDashboard - przycisk w Quick Actions
- ✅ EmployerDashboard - przycisk w Quick Actions
- ✅ AccountantDashboard - przycisk w Quick Actions
- ✅ CleaningCompanyDashboard - przycisk w Quick Actions

**PROBLEMY z obecnym rozwiązaniem:**

- ❌ Wymaga klienta email (co jeśli użytkownik nie ma skonfigurowanego?)
- ❌ Brak trackingu zgłoszeń (nie widzimy co użytkownik zgłasza)
- ❌ Brak priorytetów (wszystkie zgłoszenia równe)
- ❌ Brak statusów (czy admin odpowiedział? czy problem rozwiązany?)
- ❌ Brak historii (użytkownik nie widzi swoich starych zgłoszeń)
- ❌ Brak załączników (screenshot, video problemu)
- ❌ Admin musi ręcznie sortować emaile
- ❌ Brak SLA (Service Level Agreement - czasu odpowiedzi)

---

## 🎯 CEL: PROFESJONALNY SYSTEM TICKETÓW

### WYMAGANIA FUNKCJONALNE:

**1. DLA UŻYTKOWNIKA (Worker, Employer, Accountant, Cleaning):**

- 📝 Formularz zgłoszenia z kategoriami problemu
- 📎 Możliwość załączania plików (screenshot, PDF, video)
- 🔍 Historia wszystkich swoich zgłoszeń
- 📊 Status każdego zgłoszenia (New, In Progress, Resolved, Closed)
- 💬 Chat z adminem w ramach ticketa
- 🔔 Powiadomienia email gdy admin odpowie
- ⭐ Ocena jakości wsparcia (1-5 stars)

**2. DLA ADMINA:**

- 📋 Dashboard wszystkich ticketów (live view)
- 🎨 Filtry: status, priorytet, kategoria, user role
- 🔴 Priorytety: Low, Medium, High, Critical
- 💬 Odpowiadanie na tickety (internal chat)
- 📎 Możliwość załączania plików w odpowiedzi
- ⏱️ SLA tracking (czas odpowiedzi, czas rozwiązania)
- 📊 Statystyki: ile ticketów, średni czas, satisfaction score
- 🏷️ Tagowanie ticketów (#bug, #feature-request, #billing, etc.)

**3. AUTOMATION:**

- 🤖 Auto-assign do admin (round-robin lub based on category)
- 📧 Auto email notifications (new ticket, response, resolved)
- ⏰ Auto-close po 7 dniach bez aktywności (jeśli resolved)
- 🔔 Reminder dla admina (ticket bez odpowiedzi >24h)

---

## 🗄️ STRUKTURA BAZY DANYCH

### TABELA: `support_tickets`

```sql
CREATE TABLE support_tickets (
  -- PRIMARY KEY
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- USER INFO
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user_role TEXT NOT NULL, -- 'worker', 'employer', 'accountant', 'cleaning_company', 'admin'
  user_email TEXT NOT NULL,
  user_name TEXT NOT NULL,

  -- TICKET INFO
  subject TEXT NOT NULL, -- max 200 chars
  description TEXT NOT NULL, -- detailed problem description
  category TEXT NOT NULL, -- 'technical', 'billing', 'account', 'feature_request', 'bug', 'other'
  priority TEXT NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  status TEXT NOT NULL DEFAULT 'new', -- 'new', 'in_progress', 'waiting_user', 'resolved', 'closed'

  -- ASSIGNMENT
  assigned_to UUID REFERENCES profiles(id), -- admin user_id
  assigned_at TIMESTAMPTZ,

  -- TRACKING
  first_response_at TIMESTAMPTZ, -- when admin first replied
  resolved_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,

  -- SATISFACTION
  rating INTEGER CHECK (rating >= 1 AND rating <= 5), -- user rates support quality
  rating_comment TEXT,

  -- METADATA
  tags TEXT[], -- ['bug', 'payment-issue', 'urgent']
  attachments JSONB DEFAULT '[]'::jsonb, -- [{ "url": "...", "name": "...", "type": "..." }]
  internal_notes TEXT, -- admin-only notes

  -- TIMESTAMPS
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES dla performance
CREATE INDEX idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX idx_support_tickets_status ON support_tickets(status);
CREATE INDEX idx_support_tickets_assigned_to ON support_tickets(assigned_to);
CREATE INDEX idx_support_tickets_created_at ON support_tickets(created_at DESC);
CREATE INDEX idx_support_tickets_priority ON support_tickets(priority);

-- RLS POLICIES
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

-- User can see only their own tickets
CREATE POLICY "Users can view own tickets"
  ON support_tickets FOR SELECT
  USING (auth.uid() = user_id);

-- User can create new tickets
CREATE POLICY "Users can create tickets"
  ON support_tickets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- User can update own tickets (only specific fields)
CREATE POLICY "Users can update own tickets"
  ON support_tickets FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Admin can see all tickets
CREATE POLICY "Admins can view all tickets"
  ON support_tickets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Admin can update all tickets
CREATE POLICY "Admins can update all tickets"
  ON support_tickets FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );
```

### TABELA: `support_messages`

```sql
CREATE TABLE support_messages (
  -- PRIMARY KEY
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- RELATIONS
  ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  sender_role TEXT NOT NULL, -- 'worker', 'employer', 'admin', etc.
  sender_name TEXT NOT NULL,

  -- MESSAGE
  message TEXT NOT NULL,
  attachments JSONB DEFAULT '[]'::jsonb, -- [{ "url": "...", "name": "...", "type": "..." }]
  is_internal BOOLEAN DEFAULT FALSE, -- internal admin notes (not visible to user)

  -- METADATA
  read_at TIMESTAMPTZ, -- when user/admin read the message
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES
CREATE INDEX idx_support_messages_ticket_id ON support_messages(ticket_id);
CREATE INDEX idx_support_messages_sender_id ON support_messages(sender_id);
CREATE INDEX idx_support_messages_created_at ON support_messages(created_at);

-- RLS POLICIES
ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;

-- User can see messages from their tickets (non-internal)
CREATE POLICY "Users can view ticket messages"
  ON support_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM support_tickets
      WHERE support_tickets.id = support_messages.ticket_id
        AND support_tickets.user_id = auth.uid()
        AND support_messages.is_internal = FALSE
    )
  );

-- User can create messages on their tickets
CREATE POLICY "Users can create messages"
  ON support_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM support_tickets
      WHERE support_tickets.id = ticket_id
        AND support_tickets.user_id = auth.uid()
    )
  );

-- Admin can see all messages (including internal)
CREATE POLICY "Admins can view all messages"
  ON support_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Admin can create messages (including internal notes)
CREATE POLICY "Admins can create messages"
  ON support_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );
```

---

## 🎨 UI/UX DESIGN

### 1. PRZYCISK "WSPARCIE" (we wszystkich dashboardach)

**PRZED:**

```tsx
<button onClick={handleContactSupport}>Wsparcie</button>
```

**PO:**

```tsx
<button onClick={() => setShowSupportModal(true)}>
  🆘 Wsparcie
  {unreadTicketReplies > 0 && <Badge>{unreadTicketReplies}</Badge>}
</button>
```

### 2. MODAL: SupportTicketModal.tsx

**Widok dla użytkownika:**

```
┌─────────────────────────────────────────────────┐
│  🆘 Centrum Wsparcia                      [X]   │
├─────────────────────────────────────────────────┤
│  [➕ Nowe Zgłoszenie]  [📋 Moje Zgłoszenia]     │
├─────────────────────────────────────────────────┤
│                                                 │
│  📝 NOWE ZGŁOSZENIE:                            │
│                                                 │
│  Kategoria: [▼ Wybierz problem]                │
│    ├── 🐛 Problem techniczny                    │
│    ├── 💰 Pytanie o płatności                   │
│    ├── 👤 Konto i profil                        │
│    ├── ✨ Propozycja funkcji                    │
│    └── ❓ Inne                                   │
│                                                 │
│  Temat:                                         │
│  [_____________________________________]        │
│                                                 │
│  Opis problemu:                                 │
│  [                                       ]      │
│  [                                       ]      │
│  [                                       ]      │
│                                                 │
│  📎 Załączniki (opcjonalnie):                   │
│  [Przeciągnij pliki lub kliknij]               │
│  - screenshot.png (1.2 MB)            [usuń]   │
│                                                 │
│  [Wyślij Zgłoszenie]                            │
│                                                 │
└─────────────────────────────────────────────────┘
```

**Widok: Moje Zgłoszenia**

```
┌─────────────────────────────────────────────────┐
│  📋 MOJE ZGŁOSZENIA                              │
├─────────────────────────────────────────────────┤
│                                                 │
│  🟢 #T-001: Nie mogę zalogować się na konto     │
│     Status: Rozwiązane  •  Utworzone: 2h temu  │
│     Ostatnia odpowiedź: Admin - 30 min temu    │
│     [Zobacz szczegóły]                          │
│                                                 │
│  🟡 #T-002: Pytanie o fakturę                   │
│     Status: W trakcie  •  Utworzone: wczoraj   │
│     Oczekuje na odpowiedź admina...             │
│     [Zobacz szczegóły]                          │
│                                                 │
│  ⚫ #T-003: Propozycja: Dark mode                │
│     Status: Zamknięte  •  Utworzone: 5 dni     │
│     [Zobacz szczegóły]                          │
│                                                 │
└─────────────────────────────────────────────────┘
```

**Widok: Szczegóły Ticketa (Chat)**

```
┌─────────────────────────────────────────────────┐
│  ← Wróć      #T-001: Nie mogę zalogować się     │
│  Status: 🟢 Rozwiązane  •  Priorytet: Wysoki    │
├─────────────────────────────────────────────────┤
│                                                 │
│  👤 TY (Pracownik) - 2h temu                    │
│  Witam, nie mogę się zalogować. Pojawia się     │
│  błąd "Invalid credentials". Resetowałem        │
│  hasło ale nadal nie działa.                    │
│  📎 screenshot_error.png                        │
│                                                 │
│  👨‍💼 ADMIN (Support) - 1.5h temu                 │
│  Dziękujemy za zgłoszenie! Sprawdzam log-i...   │
│                                                 │
│  👨‍💼 ADMIN (Support) - 30 min temu               │
│  Problem znaleziony! Twoje konto było           │
│  tymczasowo zablokowane z powodu wielu          │
│  nieudanych prób logowania. Odblokowałem        │
│  konto. Spróbuj zalogować się ponownie.         │
│                                                 │
│  👤 TY (Pracownik) - 10 min temu                │
│  Działa! Dziękuję bardzo! 🎉                    │
│                                                 │
├─────────────────────────────────────────────────┤
│  Oceń jakość wsparcia:  ⭐⭐⭐⭐⭐               │
│  [Zamknij zgłoszenie]                           │
└─────────────────────────────────────────────────┘
```

### 3. ADMIN PANEL: Support Tickets Manager

**Route:** `/admin/support-tickets`

**Widok listy:**

```
┌─────────────────────────────────────────────────────────────┐
│  🆘 Support Tickets Manager                                 │
├─────────────────────────────────────────────────────────────┤
│  [🟢 New: 5] [🟡 In Progress: 12] [⚫ Resolved: 45]        │
│                                                             │
│  Filtry:                                                    │
│  Status: [All ▼]  Priorytet: [All ▼]  Role: [All ▼]       │
│  Search: [_______________________] 🔍                       │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ #T-005  🔴 CRITICAL                                 │   │
│  │ ❌ Błąd płatności - nie mogę wykupić subskrypcji    │   │
│  │ 👷 Worker: Jan Kowalski • 5 min temu                │   │
│  │ Status: 🟢 NEW • Assigned: Unassigned               │   │
│  │ [Assign to me] [View Details]                       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ #T-004  🟡 HIGH                                     │   │
│  │ 🐛 Dashboard nie ładuje certyfikatów                │   │
│  │ 🏢 Employer: ABC Firma • 1h temu                    │   │
│  │ Status: 🟡 IN PROGRESS • Assigned: Admin (You)      │   │
│  │ Last response: 30 min ago                           │   │
│  │ [View Details] [Mark Resolved]                      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  [Load More...]                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 PLAN IMPLEMENTACJI (ETAPY)

### ETAP 1: DATABASE SETUP (1-2h)

**Files to create:**

- `database-migrations/2025-11-19_support_tickets.sql`
- `database-migrations/2025-11-19_support_messages.sql`

**Tasks:**

- [ ] Stwórz tabelę `support_tickets` z indexes i RLS policies
- [ ] Stwórz tabelę `support_messages` z indexes i RLS policies
- [ ] Uruchom migracje w Supabase
- [ ] Test RLS policies (user vs admin access)
- [ ] Regeneruj TypeScript types: `npx supabase gen types typescript`

---

### ETAP 2: SERVICES LAYER (2-3h)

**Files to create:**

- `src/services/supportTicketService.ts`

**Functions needed:**

```typescript
// USER FUNCTIONS:
- createTicket(data: CreateTicketData): Promise<SupportTicket>
- getUserTickets(userId: string): Promise<SupportTicket[]>
- getTicketDetails(ticketId: string): Promise<TicketWithMessages>
- sendMessage(ticketId: string, message: string): Promise<void>
- closeTicket(ticketId: string, rating?: number): Promise<void>
- uploadAttachment(ticketId: string, file: File): Promise<string>

// ADMIN FUNCTIONS:
- getAllTickets(filters?: TicketFilters): Promise<SupportTicket[]>
- assignTicket(ticketId: string, adminId: string): Promise<void>
- updateTicketStatus(ticketId: string, status: TicketStatus): Promise<void>
- sendAdminMessage(ticketId: string, message: string, isInternal?: boolean): Promise<void>
- getTicketStats(): Promise<TicketStats>
```

**Example implementation:**

```typescript
// src/services/supportTicketService.ts
import { supabase } from "../lib/supabase";
import type { Database } from "../lib/database.types";

type SupportTicket = Database["public"]["Tables"]["support_tickets"]["Row"];
type CreateTicketData =
  Database["public"]["Tables"]["support_tickets"]["Insert"];

export const createTicket = async (
  data: CreateTicketData
): Promise<SupportTicket> => {
  const { data: ticket, error } = await supabase
    .from("support_tickets")
    .insert(data)
    .select()
    .single();

  if (error) throw error;
  return ticket;
};

export const getUserTickets = async (
  userId: string
): Promise<SupportTicket[]> => {
  const { data, error } = await supabase
    .from("support_tickets")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
};

// ... more functions
```

---

### ETAP 3: COMPONENTS (4-6h)

**Files to create:**

1. **`components/SupportTicketModal.tsx`** (główny modal)

   - Tab 1: Nowe zgłoszenie (form)
   - Tab 2: Moje zgłoszenia (list)
   - Tab 3: Szczegóły ticketa (chat view)

2. **`components/SupportTicketForm.tsx`** (formularz nowego ticketa)

   - Category select
   - Subject input
   - Description textarea
   - File upload (drag & drop)
   - Submit button

3. **`components/SupportTicketList.tsx`** (lista ticketów użytkownika)

   - Ticket card (summary)
   - Status badge
   - Click → open details

4. **`components/SupportTicketChat.tsx`** (chat view ticketa)

   - Message list (user vs admin)
   - Message input
   - File attachment
   - Rating form (when resolved)

5. **`components/Admin/SupportTicketsManager.tsx`** (admin panel)
   - Filters (status, priority, role)
   - Ticket list (admin view)
   - Assign button
   - Stats dashboard

**Example SupportTicketModal.tsx:**

```typescript
import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { SupportTicketForm } from "./SupportTicketForm";
import { SupportTicketList } from "./SupportTicketList";
import { SupportTicketChat } from "./SupportTicketChat";

interface SupportTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupportTicketModal: React.FC<SupportTicketModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"new" | "list" | "details">(
    "list"
  );
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🆘</span>
            <h2 className="text-2xl font-bold">Centrum Wsparcia</h2>
          </div>
          <button onClick={onClose} className="text-white hover:text-gray-200">
            <span className="text-2xl">✕</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 bg-gray-50">
          <button
            onClick={() => setActiveTab("list")}
            className={`px-6 py-3 font-semibold ${
              activeTab === "list"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-600"
            }`}
          >
            📋 Moje Zgłoszenia
          </button>
          <button
            onClick={() => setActiveTab("new")}
            className={`px-6 py-3 font-semibold ${
              activeTab === "new"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-600"
            }`}
          >
            ➕ Nowe Zgłoszenie
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {activeTab === "new" && (
            <SupportTicketForm
              onSuccess={() => {
                setActiveTab("list");
              }}
            />
          )}
          {activeTab === "list" && (
            <SupportTicketList
              onSelectTicket={(ticketId) => {
                setSelectedTicketId(ticketId);
                setActiveTab("details");
              }}
            />
          )}
          {activeTab === "details" && selectedTicketId && (
            <SupportTicketChat
              ticketId={selectedTicketId}
              onBack={() => setActiveTab("list")}
            />
          )}
        </div>
      </div>
    </div>
  );
};
```

---

### ETAP 4: INTEGRATION (2-3h)

**Modyfikacje w istniejących dashboardach:**

**AdminDashboard.tsx:**

```typescript
// Import
import { SupportTicketModal } from "../components/SupportTicketModal";

// State
const [showSupportModal, setShowSupportModal] = useState(false);

// Replace handleContactSupport:
const handleContactSupport = () => {
  setShowSupportModal(true);
};

// Add modal before closing </div>:
{
  showSupportModal && (
    <SupportTicketModal
      isOpen={showSupportModal}
      onClose={() => setShowSupportModal(false)}
    />
  );
}
```

**Repeat for:**

- WorkerDashboard.tsx
- EmployerDashboard.tsx
- AccountantDashboard.tsx
- CleaningCompanyDashboard.tsx

**Add admin route in App.tsx:**

```tsx
<Route path="/admin/support-tickets" element={<SupportTicketsManager />} />
```

**Add module card in AdminDashboard:**

```typescript
{
  title: "Support Tickets",
  description: "Zarządzaj zgłoszeniami użytkowników, odpowiadaj na pytania",
  path: "/admin/support-tickets",
  icon: "🆘",
  color: "cyber" as const,
  stats: {
    label: "Open",
    value: stats.openTickets?.toString() || "0",
    trend: `${stats.newTicketsToday || 0} new today`,
  },
}
```

---

### ETAP 5: NOTIFICATIONS & AUTOMATION (2-3h)

**Files to create:**

- `src/services/supportNotificationService.ts`

**Functions:**

- Send email when new ticket created (to admin)
- Send email when admin responds (to user)
- Send email when ticket resolved (to user)
- Auto-close resolved tickets after 7 days
- Reminder emails for tickets without response >24h

**Example Supabase Edge Function:**

```typescript
// supabase/functions/support-ticket-notifications/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  const { type, ticketId, userId } = await req.json();

  // Send email based on type:
  // - 'ticket_created'
  // - 'admin_replied'
  // - 'ticket_resolved'

  return new Response(JSON.stringify({ success: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
```

---

### ETAP 6: STATISTICS & ANALYTICS (1-2h)

**Admin Dashboard - Ticket Stats:**

```typescript
interface TicketStats {
  total: number;
  new: number;
  inProgress: number;
  resolved: number;
  closed: number;
  averageResponseTime: number; // in hours
  averageResolutionTime: number; // in hours
  satisfactionScore: number; // average rating 1-5
  ticketsByCategory: { [key: string]: number };
  ticketsByPriority: { [key: string]: number };
}
```

**Charts to add:**

- Line chart: Tickets over time (last 30 days)
- Pie chart: Tickets by category
- Bar chart: Tickets by status
- Gauge: Average satisfaction score

---

## 🎨 KATEGORIE PROBLEMÓW (PREDEFINED)

```typescript
export const TICKET_CATEGORIES = [
  {
    id: "technical",
    label: "🐛 Problem techniczny",
    description: "Błędy, crashe, funkcje nie działają",
    priority: "high",
  },
  {
    id: "billing",
    label: "💰 Pytanie o płatności",
    description: "Faktury, subskrypcje, refundy",
    priority: "high",
  },
  {
    id: "account",
    label: "👤 Konto i profil",
    description: "Logowanie, hasło, dane profilowe",
    priority: "medium",
  },
  {
    id: "feature_request",
    label: "✨ Propozycja funkcji",
    description: "Pomysły na nowe funkcjonalności",
    priority: "low",
  },
  {
    id: "data",
    label: "📊 Problem z danymi",
    description: "Dane się nie zapisują, brakuje danych",
    priority: "high",
  },
  {
    id: "performance",
    label: "⚡ Wydajność",
    description: "Aplikacja działa wolno",
    priority: "medium",
  },
  {
    id: "security",
    label: "🔒 Bezpieczeństwo",
    description: "Podejrzana aktywność, spam",
    priority: "critical",
  },
  {
    id: "other",
    label: "❓ Inne",
    description: "Inne pytania",
    priority: "low",
  },
] as const;
```

---

## 📊 METRYKI SUKCESU

**KPI (Key Performance Indicators):**

- ✅ **First Response Time:** < 2 hours (business hours)
- ✅ **Resolution Time:** < 24 hours (for high priority)
- ✅ **Satisfaction Score:** > 4.5 / 5.0
- ✅ **Ticket Volume:** Track trend (increase = more users OR more problems?)
- ✅ **Self-Service Rate:** % users who found solution in FAQ
- ✅ **Repeat Tickets:** % users who open >1 ticket for same issue

---

## 🔐 SECURITY CONSIDERATIONS

**Data Protection:**

- ✅ RLS policies prevent users from seeing other users' tickets
- ✅ Admin-only access to internal notes
- ✅ File upload: validate file type, scan for malware
- ✅ Rate limiting: max 10 tickets per user per day (prevent spam)
- ✅ Sanitize user input (prevent XSS)

**Privacy:**

- ✅ GDPR compliant: user can delete their tickets
- ✅ Data retention: auto-delete closed tickets after 1 year
- ✅ Encryption: files stored encrypted in Supabase Storage

---

## 📅 TIMELINE ESTIMATE

| Etap              | Czas       | Priorytet   |
| ----------------- | ---------- | ----------- |
| 1. Database Setup | 1-2h       | 🔴 CRITICAL |
| 2. Services Layer | 2-3h       | 🔴 CRITICAL |
| 3. Components     | 4-6h       | 🔴 CRITICAL |
| 4. Integration    | 2-3h       | 🔴 CRITICAL |
| 5. Notifications  | 2-3h       | 🟡 HIGH     |
| 6. Analytics      | 1-2h       | 🟢 MEDIUM   |
| **TOTAL**         | **12-19h** |             |

**Sprint plan:**

- **Week 1 (MVP):** Etap 1-4 (podstawowy system ticketów)
- **Week 2 (Enhancements):** Etap 5-6 (automation + analytics)

---

## ✅ CHECKLIST PRZED STARTEM

**Prerequisites:**

- [ ] Supabase project configured
- [ ] Supabase Storage bucket created (`support-attachments`)
- [ ] Email service configured (for notifications)
- [ ] Admin role verified in database
- [ ] TypeScript types up-to-date

**Design approval:**

- [ ] UI mockups approved by stakeholders
- [ ] UX flow tested (user journey)
- [ ] Mobile responsiveness verified

**Testing plan:**

- [ ] Unit tests for services
- [ ] Integration tests for API
- [ ] E2E tests for user flows
- [ ] Load testing (100+ concurrent tickets)

---

## 🚀 NEXT STEPS

**IMMEDIATE (do this now):**

1. Review this plan with team
2. Approve database schema
3. Create GitHub issues for each etap
4. Assign developers to tasks

**AFTER APPROVAL:**

1. Start with Etap 1 (Database Setup)
2. Daily standups to track progress
3. Code reviews for each PR
4. Deploy to staging first, then production

---

**Status:** 📋 **READY FOR IMPLEMENTATION**  
**Approval needed from:** Product Owner, Tech Lead, UX Designer

---

## 📝 NOTES & CONSIDERATIONS

**Alternative solutions considered:**

- ❌ Third-party tools (Zendesk, Intercom) - expensive, overkill
- ❌ Email-only system - no tracking, poor UX
- ✅ **Custom in-app solution** - full control, integrated, scalable

**Future enhancements (v2):**

- 🤖 AI-powered auto-responses for common issues
- 📚 Knowledge Base / FAQ integration
- 🎥 Screen recording for bug reports
- 📞 Live chat with admin (real-time)
- 📊 Advanced analytics dashboard
- 🌍 Multi-language support

---

**END OF PLAN**
