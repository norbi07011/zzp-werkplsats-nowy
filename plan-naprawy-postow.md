# 🚀 PLAN ROZBUDOWY SYSTEMU POSTÓW - FUNKCJE DO IMPLEMENTACJI

**Data:** 20 listopada 2025  
**Status:** 🟢 Podstawy działają - czas na rozbudowę!

---

## ✅ CO JUŻ DZIAŁA (ZREALIZOWANE)

### 1. ✅ Frontend - Wyświetlanie szczegółów postów

**Plik:** `pages/FeedPage_PREMIUM.tsx`

#### Job Offer - wyświetlane pola:

- ✅ Typ zatrudnienia (Voltijd/Deeltijd/Contract/Tijdelijk)
- ✅ Liczba godzin na tydzień
- ✅ Data rozpoczęcia
- ✅ Wynagrodzenie (min-max)
- ✅ Lokalizacja
- ✅ Benefity (lista ze znaczkami 🚗💰🏥)
- ✅ Kontakt (email + telefon jako klikalne linki)

#### Ad (Reklama) - wyświetlane pola:

- ✅ Typ reklamy (Produkt/Usługa/Wydarzenie/Promocja)
- ✅ Budget reklamowy
- ✅ Czas trwania (w dniach)
- ✅ Strona internetowa (kliknij i przejdź)
- ✅ Docelowa grupa odbiorców (kolorowe znaczki)
- ✅ Przycisk Call-to-Action (duży przycisk z tekstem)
- ✅ Kontakt (email + telefon)

#### Announcement (Ogłoszenie) - wyświetlane pola:

- ✅ Kategoria z odpowiednim kolorem:
  - Pilne = czerwony gradient
  - Ostrzeżenie = żółty gradient
  - Sukces = zielony gradient
  - Info = niebieski gradient
- ✅ Priorytet (wysoki/średni/niski)
- ✅ Tagi (z # jako znaczki)
- ✅ Data ważności
- ✅ Dla kogo (lista ról: Pracownicy/Pracodawcy/Księgowi)
- ✅ Przypięte ogłoszenie (specjalny znaczek 📌)

### 2. ✅ Komponenty formularzy

**Pliki:** `components/CreatePost/`

- ✅ `JobOfferForm.tsx` (289 linijek) - 8 pól (type, hours, start_date, benefits, contact)
- ✅ `AdForm.tsx` (255 linijek) - 9 pól (type, budget, duration, audience, CTA, contact)
- ✅ `AnnouncementForm.tsx` (297 linijek) - 7 pól (category, priority, tags, expires, target_roles)

### 3. ✅ Typy TypeScript

**Plik:** `src/services/feedService.ts`

- ✅ Interfejs `Post` rozszerzony o 51 pól dla wszystkich typów postów
- ✅ Typy: JobOfferForm, AdForm, AnnouncementForm zdefiniowane

---

## 🎯 FUNKCJE DO ZROBIENIA - PRIORITIES

### 🔥 PRIORITY 1 - BACKEND & DATABASE (fundamenty)

#### 📋 1.1 MIGRACJA SQL - Dodanie kolumn do tabeli `posts`

**Status:** ⏳ TODO  
**Czas:** 30 min  
**Cel:** Dodać brakujące kolumny w bazie danych

**Plik do wykonania:** `database-migrations/add-post-fields.sql`

```sql
-- ═══════════════════════════════════════════════════════════
-- MIGRATION: Rozbudowa tabeli posts
-- Data: 2025-11-20
-- Autor: AI Assistant
-- ═══════════════════════════════════════════════════════════

-- 1. JOB OFFER - nowe kolumny
ALTER TABLE posts
ADD COLUMN IF NOT EXISTS job_type VARCHAR(20) CHECK (job_type IN ('full_time', 'part_time', 'contract', 'temporary')),
ADD COLUMN IF NOT EXISTS job_hours_per_week INTEGER CHECK (job_hours_per_week > 0 AND job_hours_per_week <= 168),
ADD COLUMN IF NOT EXISTS job_start_date DATE,
ADD COLUMN IF NOT EXISTS job_benefits TEXT[],
ADD COLUMN IF NOT EXISTS job_contact_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS job_contact_phone VARCHAR(50),
ADD COLUMN IF NOT EXISTS job_experience_level VARCHAR(20) CHECK (job_experience_level IN ('junior', 'medior', 'senior', 'any')),
ADD COLUMN IF NOT EXISTS job_required_skills TEXT[],
ADD COLUMN IF NOT EXISTS job_education_level VARCHAR(20) CHECK (job_education_level IN ('MBO', 'HBO', 'WO', 'None')),
ADD COLUMN IF NOT EXISTS job_work_mode VARCHAR(20) CHECK (job_work_mode IN ('on-site', 'remote', 'hybrid')) DEFAULT 'on-site',
ADD COLUMN IF NOT EXISTS job_status VARCHAR(20) CHECK (job_status IN ('open', 'closed', 'filled')) DEFAULT 'open',
ADD COLUMN IF NOT EXISTS job_applications_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS job_cv_required BOOLEAN DEFAULT false;

-- 2. AD - nowe kolumny
ALTER TABLE posts
ADD COLUMN IF NOT EXISTS ad_type VARCHAR(20) CHECK (ad_type IN ('product', 'service', 'event', 'promotion')),
ADD COLUMN IF NOT EXISTS ad_budget NUMERIC(10, 2) CHECK (ad_budget >= 0),
ADD COLUMN IF NOT EXISTS ad_duration_days INTEGER DEFAULT 30 CHECK (ad_duration_days > 0),
ADD COLUMN IF NOT EXISTS ad_target_audience TEXT[],
ADD COLUMN IF NOT EXISTS ad_cta_text VARCHAR(100),
ADD COLUMN IF NOT EXISTS ad_cta_url TEXT,
ADD COLUMN IF NOT EXISTS ad_website VARCHAR(255),
ADD COLUMN IF NOT EXISTS ad_contact_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS ad_contact_phone VARCHAR(50),
ADD COLUMN IF NOT EXISTS ad_impressions_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS ad_clicks_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS ad_ctr_percent NUMERIC(5,2) GENERATED ALWAYS AS (
  CASE
    WHEN ad_impressions_count > 0 THEN (ad_clicks_count::numeric / ad_impressions_count::numeric) * 100
    ELSE 0
  END
) STORED;

-- 3. ANNOUNCEMENT - nowe kolumny
ALTER TABLE posts
ADD COLUMN IF NOT EXISTS announcement_category VARCHAR(20) CHECK (announcement_category IN ('info', 'warning', 'success', 'urgent')) DEFAULT 'info',
ADD COLUMN IF NOT EXISTS announcement_priority VARCHAR(20) CHECK (announcement_priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS announcement_expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS announcement_tags TEXT[],
ADD COLUMN IF NOT EXISTS announcement_pinned BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS announcement_notify_users BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS announcement_target_roles TEXT[],
ADD COLUMN IF NOT EXISTS announcement_read_by UUID[] DEFAULT '{}';

-- 4. Indeksy dla wydajności
CREATE INDEX IF NOT EXISTS idx_posts_type_status ON posts(type, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_posts_job_status ON posts(job_status) WHERE type = 'job_offer';
CREATE INDEX IF NOT EXISTS idx_posts_announcement_pinned ON posts(announcement_pinned) WHERE announcement_pinned = true;
CREATE INDEX IF NOT EXISTS idx_posts_announcement_expires ON posts(announcement_expires_at) WHERE announcement_expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_posts_ad_ctr ON posts(ad_ctr_percent DESC) WHERE type = 'ad';

-- 5. Komentarze dla dokumentacji
COMMENT ON COLUMN posts.job_type IS 'Typ zatrudnienia: full_time, part_time, contract, temporary';
COMMENT ON COLUMN posts.job_status IS 'Status rekrutacji: open (aktywna), closed (zakończona), filled (obsadzona)';
COMMENT ON COLUMN posts.ad_ctr_percent IS 'Click-Through Rate (%) - obliczany automatycznie';
COMMENT ON COLUMN posts.announcement_read_by IS 'Lista UUID użytkowników którzy przeczytali ogłoszenie';
```

**Test po migracji:**

```sql
-- Sprawdź czy kolumny zostały dodane
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'posts'
  AND (column_name LIKE 'job_%'
   OR column_name LIKE 'ad_%'
   OR column_name LIKE 'announcement_%')
ORDER BY column_name;
```

---

#### 📋 1.2 NOWA TABELA: `job_applications`

**Status:** ⏳ TODO  
**Czas:** 20 min  
**Cel:** Tracking aplikacji na oferty pracy

```sql
-- Tabela z aplikacjami na oferty pracy
CREATE TABLE IF NOT EXISTS job_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL CHECK (status IN ('applied', 'reviewed', 'interview', 'hired', 'rejected')) DEFAULT 'applied',
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  notes TEXT,
  cv_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(post_id, worker_id) -- Jeden worker może aplikować raz na ofertę
);

-- Indeksy
CREATE INDEX idx_job_applications_post ON job_applications(post_id);
CREATE INDEX idx_job_applications_worker ON job_applications(worker_id);
CREATE INDEX idx_job_applications_status ON job_applications(status);

-- RLS Policies
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;

-- Workers mogą dodawać aplikacje
CREATE POLICY "Workers can apply for jobs" ON job_applications
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'worker'
    )
  );

-- Employers widzą aplikacje na swoje oferty
CREATE POLICY "Employers see applications on their jobs" ON job_applications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM posts
      WHERE posts.id = job_applications.post_id
        AND posts.author_id = auth.uid()
    )
    OR auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );

-- Employer może update'ować status
CREATE POLICY "Employers can update applications" ON job_applications
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM posts
      WHERE posts.id = job_applications.post_id
        AND posts.author_id = auth.uid()
    )
    OR auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );

-- Trigger do update countera
CREATE OR REPLACE FUNCTION update_job_applications_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts
    SET job_applications_count = job_applications_count + 1
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts
    SET job_applications_count = job_applications_count - 1
    WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_job_applications_count
  AFTER INSERT OR DELETE ON job_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_job_applications_count();
```

---

#### 📋 1.3 BACKEND FUNKCJE - rozszerzenie feedService.ts

**Status:** ⏳ TODO  
**Czas:** 3h  
**Plik:** `src/services/feedService.ts`

**Funkcje do dodania:**

##### A) Job Applications

```typescript
/**
 * ═══════════════════════════════════════════════════════════
 * JOB APPLICATIONS
 * ═══════════════════════════════════════════════════════════
 */

export interface JobApplication {
  id: string;
  post_id: string;
  worker_id: string;
  status: "applied" | "reviewed" | "interview" | "hired" | "rejected";
  applied_at: string;
  reviewed_at?: string;
  notes?: string;
  cv_url?: string;
}

/**
 * Aplikuj na ofertę pracy (TYLKO workers)
 */
export async function applyForJob(
  postId: string,
  workerId: string,
  cvUrl?: string
): Promise<void> {
  const user = await getCurrentUser();
  if (!user || user.role !== "worker") {
    throw new Error("Only workers can apply for jobs");
  }

  // Check if already applied
  const { data: existing } = await supabaseAny
    .from("job_applications")
    .select("id")
    .eq("post_id", postId)
    .eq("worker_id", workerId)
    .single();

  if (existing) {
    throw new Error("You have already applied for this job");
  }

  const { error } = await supabaseAny.from("job_applications").insert({
    post_id: postId,
    worker_id: workerId,
    status: "applied",
    cv_url: cvUrl,
  });

  if (error) throw error;
}

/**
 * Pobierz aplikacje na moje oferty (employer/accountant)
 */
export async function getMyJobApplications(
  employerId: string
): Promise<JobApplication[]> {
  const { data, error } = await supabaseAny
    .from("job_applications")
    .select(
      `
      *,
      post:posts!inner(title, job_category),
      worker:workers(full_name, email, phone, avatar_url)
    `
    )
    .eq("post.author_id", employerId)
    .order("applied_at", { ascending: false });

  if (error) throw error;
  return data;
}

/**
 * Zmień status aplikacji
 */
export async function updateApplicationStatus(
  applicationId: string,
  newStatus: JobApplication["status"],
  notes?: string
): Promise<void> {
  const user = await getCurrentUser();
  if (!user || !["employer", "accountant", "admin"].includes(user.role)) {
    throw new Error("Unauthorized");
  }

  const { error } = await supabaseAny
    .from("job_applications")
    .update({
      status: newStatus,
      reviewed_at: new Date().toISOString(),
      notes: notes,
    })
    .eq("id", applicationId);

  if (error) throw error;
}
```

##### B) Ad Analytics

```typescript
/**
 * ═══════════════════════════════════════════════════════════
 * AD ANALYTICS
 * ═══════════════════════════════════════════════════════════
 */

/**
 * Zapisz wyświetlenie reklamy (impression)
 */
export async function trackAdImpression(postId: string): Promise<void> {
  const { error } = await supabaseAny
    .from("posts")
    .update({
      ad_impressions_count: supabaseAny.raw("ad_impressions_count + 1"),
    })
    .eq("id", postId)
    .eq("type", "ad");

  if (error) throw error;
}

/**
 * Zapisz kliknięcie w reklamę
 */
export async function trackAdClick(postId: string): Promise<void> {
  const { error } = await supabaseAny
    .from("posts")
    .update({
      ad_clicks_count: supabaseAny.raw("ad_clicks_count + 1"),
    })
    .eq("id", postId)
    .eq("type", "ad");

  if (error) throw error;
}

/**
 * Pobierz analytics dla reklamy
 */
export async function getAdAnalytics(postId: string) {
  const { data, error } = await supabaseAny
    .from("posts")
    .select(
      "ad_impressions_count, ad_clicks_count, ad_ctr_percent, ad_budget, created_at"
    )
    .eq("id", postId)
    .eq("type", "ad")
    .single();

  if (error) throw error;

  return {
    post_id: postId,
    impressions: data.ad_impressions_count,
    clicks: data.ad_clicks_count,
    ctr: data.ad_ctr_percent,
    budget: data.ad_budget,
    cost_per_click:
      data.ad_clicks_count > 0 ? data.ad_budget / data.ad_clicks_count : 0,
    duration_days: Math.ceil(
      (new Date().getTime() - new Date(data.created_at).getTime()) /
        (1000 * 60 * 60 * 24)
    ),
  };
}
```

---

### 🎨 PRIORITY 2 - NOWE KOMPONENTY UI

#### 📋 2.1 Job Applications Dashboard

**Status:** ⏳ TODO  
**Czas:** 4-5h  
**Plik:** `pages/employer/JobApplications.tsx`

**Cel:** Panel zarządzania aplikacjami na oferty pracy dla Employer/Accountant

**Funkcje:**

- ✅ Lista wszystkich aplikacji
- ✅ Filtry: status (applied/reviewed/interview/hired/rejected), oferta, data
- ✅ Sortowanie
- ✅ Akcje:
  - Zmień status (dropdown)
  - Dodaj notatki
  - Zobacz CV (download)
  - Kontakt z worker (mailto/tel links)
- ✅ Statystyki: liczba aplikacji per status

**UI wireframe:**

```
┌──────────────────────────────────────────────────────────────┐
│  📋 Aplikacje na oferty pracy (23)                           │
├──────────────────────────────────────────────────────────────┤
│  📊 Status: Applied (12) | Reviewed (5) | Interview (4) |    │
│             Hired (1) | Rejected (1)                         │
├──────────────────────────────────────────────────────────────┤
│  Filtry: [Status ▼] [Oferta ▼] [Data ▼]   [Export CSV]      │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ 💼 Senior Schoonmaker - Amsterdam                     │   │
│  │ 👤 Jan Kowalski                                       │   │
│  │ ✉ jan@example.com | ☎ +31 612 345 678               │   │
│  │ 📅 18 lis 2025, 14:32                                │   │
│  │ Status: [Applied ▼ Change]  |  📄 Zobacz CV           │   │
│  │ 📝 [Dodaj notatki...]                                 │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ 💼 Bouwvakker - Rotterdam                            │   │
│  │ ...                                                   │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

**Kod szkielet:**

```tsx
// pages/employer/JobApplications.tsx
import { useState, useEffect } from "react";
import {
  getMyJobApplications,
  updateApplicationStatus,
} from "@/services/feedService";

export default function JobApplications() {
  const [applications, setApplications] = useState([]);
  const [filterStatus, setFilterStatus] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    try {
      const data = await getMyJobApplications(user.id);
      setApplications(data);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (appId, newStatus) => {
    await updateApplicationStatus(appId, newStatus);
    await loadApplications();
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">📋 Aplikacje na oferty pracy</h1>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        <StatCard label="Applied" count={12} color="blue" />
        <StatCard label="Reviewed" count={5} color="yellow" />
        <StatCard label="Interview" count={4} color="purple" />
        <StatCard label="Hired" count={1} color="green" />
        <StatCard label="Rejected" count={1} color="red" />
      </div>

      {/* Filters */}
      <div className="filters mb-6">{/* ... */}</div>

      {/* Applications list */}
      <div className="space-y-4">
        {applications.map((app) => (
          <ApplicationCard
            key={app.id}
            application={app}
            onStatusChange={handleStatusChange}
          />
        ))}
      </div>
    </div>
  );
}
```

---

#### 📋 2.2 Ad Analytics Dashboard

**Status:** ⏳ TODO  
**Czas:** 4-5h  
**Plik:** `pages/employer/AdAnalytics.tsx`

**Cel:** Dashboard z metrykami dla reklam

**Funkcje:**

- ✅ Real-time impressions (wyświetlenia)
- ✅ Click count (kliknięcia w CTA)
- ✅ CTR (Click-Through Rate %)
- ✅ Cost per click
- ✅ Wykres trend (opcjonalnie)
- ✅ Export danych do CSV
- ✅ Porównanie reklam

**Metryki:**

```typescript
interface AdMetrics {
  post_id: string;
  title: string;
  impressions: number; // Wyświetlenia
  clicks: number; // Kliknięcia
  ctr: number; // CTR (%)
  budget: number; // Budżet
  cost_per_click: number; // Koszt/kliknięcie
  duration_days: number; // Dni aktywności
}
```

**UI wireframe:**

```
┌──────────────────────────────────────────────────────────────┐
│  📊 Analytics reklam                        [Export CSV]      │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ 📣 Promocja kursu VCA                                 │   │
│  │                                                       │   │
│  │ 👁️ Wyświetlenia:  1,234     💰 Budget: €500         │   │
│  │ 🖱️ Kliknięcia:    45         💵 Cost/Click: €11.11   │   │
│  │ 📈 CTR:          3.65%       ⏱️ Aktywna: 7 dni       │   │
│  │                                                       │   │
│  │ [Zobacz szczegóły]                                    │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ 📣 Nowa oferta szkolenia                             │   │
│  │ ...                                                   │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

---

#### 📋 2.3 Rich Text Editor (Tiptap)

**Status:** ⏳ TODO  
**Czas:** 6-8h  
**Cel:** Zastąpić zwykły textarea edytorem WYSIWYG

**Instalacja:**

```bash
npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-link @tiptap/extension-image
```

**Funkcje:**

- ✅ Bold, Italic, Underline, Strike
- ✅ Headings (H1, H2, H3)
- ✅ Bullet list, Ordered list
- ✅ Linki (z preview)
- ✅ Obrazy inline
- ✅ Code blocks
- ✅ Blockquotes
- ✅ Horizontal rule
- ✅ Markdown shortcuts (\*\*, \_\_, #, etc.)

**Komponent:**

```tsx
// components/RichTextEditor.tsx
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";

export function RichTextEditor({ content, onChange, placeholder }) {
  const editor = useEditor({
    extensions: [StarterKit, Link.configure({ openOnClick: false })],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  return (
    <div className="border rounded-xl overflow-hidden">
      {/* Toolbar */}
      <div className="bg-gray-50 border-b px-4 py-2 flex gap-2 flex-wrap">
        <ToolbarButton
          onClick={() => editor?.chain().focus().toggleBold().run()}
          active={editor?.isActive("bold")}
          icon={<Bold className="w-4 h-4" />}
        />
        <ToolbarButton
          onClick={() => editor?.chain().focus().toggleItalic().run()}
          active={editor?.isActive("italic")}
          icon={<Italic className="w-4 h-4" />}
        />
        {/* ... więcej przycisków */}
      </div>

      {/* Editor area */}
      <EditorContent
        editor={editor}
        className="prose max-w-none p-4 min-h-[300px]"
      />
    </div>
  );
}
```

**Użycie w formularzach:**

```tsx
// Zamień to:
<textarea value={content} onChange={(e) => setContent(e.target.value)} />

// Na to:
<RichTextEditor
  content={content}
  onChange={setContent}
  placeholder="Napisz treść posta..."
/>
```

---

### 🔔 PRIORITY 3 - NOTIFICATIONS

#### 📋 3.1 Email Notifications

**Status:** ⏳ TODO  
**Czas:** 4-5h  
**Narzędzie:** Resend API lub SendGrid

**Typy powiadomień:**

1. **Worker** → Nowa oferta pracy pasująca do profilu
2. **Employer** → Nowa aplikacja na ofertę
3. **All users** → Pilne ogłoszenie (urgent announcement)
4. **Advertiser** → Raport tygodniowy analytics

**Setup:**

```bash
npm install resend
```

**Kod:**

```typescript
// src/services/emailService.ts
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Wyślij email o nowej aplikacji
 */
export async function sendNewApplicationEmail(
  employerEmail: string,
  jobTitle: string,
  workerName: string,
  applicationUrl: string
) {
  await resend.emails.send({
    from: "ZZP Werkplaats <noreply@zzpwerkplaats.nl>",
    to: employerEmail,
    subject: `💼 Nowa aplikacja: ${jobTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif;">
        <h1>Nowa aplikacja!</h1>
        <p>Witaj,</p>
        <p>Otrzymałeś nową aplikację na ofertę: <strong>${jobTitle}</strong></p>
        <p>Kandydat: <strong>${workerName}</strong></p>
        <a href="${applicationUrl}" style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
          Zobacz aplikację
        </a>
      </div>
    `,
  });
}

/**
 * Wyślij email o pilnym ogłoszeniu
 */
export async function sendUrgentAnnouncementEmail(
  userEmail: string,
  title: string,
  content: string,
  postUrl: string
) {
  await resend.emails.send({
    from: "ZZP Werkplaats <alerts@zzpwerkplaats.nl>",
    to: userEmail,
    subject: `🚨 PILNE: ${title}`,
    html: `
      <div style="font-family: Arial, sans-serif; background: #fee2e2; padding: 20px; border-left: 4px solid #dc2626;">
        <h1 style="color: #dc2626;">🚨 Pilne ogłoszenie</h1>
        <h2>${title}</h2>
        <p>${content.substring(0, 200)}...</p>
        <a href="${postUrl}" style="background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
          Przeczytaj całość
        </a>
      </div>
    `,
  });
}
```

**Integracja z createPost:**

```typescript
// W feedService.ts po utworzeniu urgent announcement:
if (
  postData.type === "announcement" &&
  postData.announcement_category === "urgent"
) {
  // Pobierz wszystkich userów z target_roles
  const { data: users } = await supabaseAny
    .from("profiles")
    .select("email, full_name")
    .in("role", postData.announcement_target_roles);

  // Wyślij email do każdego
  for (const user of users) {
    await sendUrgentAnnouncementEmail(
      user.email,
      postData.title,
      postData.content,
      `https://zzpwerkplaats.nl/feed?post=${newPostId}`
    );
  }
}
```

---

### 🔐 PRIORITY 4 - SECURITY & AUDIT

#### 📋 4.1 RLS Policies - Full Audit

**Status:** ⏳ TODO  
**Czas:** 2-3h  
**Cel:** Sprawdź i napraw wszystkie RLS policies

**Checklist:**

1. **posts** table:

```sql
-- SELECT: wszyscy authenticated users
-- INSERT: tylko employer, accountant, admin
-- UPDATE: tylko author
-- DELETE: tylko author lub admin
```

2. **job_applications** table:

```sql
-- INSERT: tylko worker
-- SELECT: tylko employer (właściciel oferty) lub admin
-- UPDATE: tylko employer (właściciel oferty) lub admin
```

3. **post_comments** table:

```sql
-- INSERT: wszyscy authenticated users
-- SELECT: wszyscy authenticated users
-- UPDATE: tylko author
-- DELETE: tylko author lub admin
```

4. **post_likes** table:

```sql
-- INSERT/DELETE: wszyscy authenticated users (własne reakcje)
-- SELECT: wszyscy authenticated users
```

5. **post_saves** table:

```sql
-- INSERT/DELETE: wszyscy authenticated users (własne zapisy)
-- SELECT: tylko owner
```

---

#### 📋 4.2 Performance Optimization

**Status:** ⏳ TODO  
**Czas:** 3-4h

**Optymalizacje:**

1. **Pagination zamiast Infinite Scroll** (dla dużych dataset):

```typescript
// Dodaj do getPosts()
export async function getPosts(params: {
  page?: number;
  limit?: number;
  type?: PostType;
  status?: "open" | "closed";
}) {
  const page = params.page || 1;
  const limit = params.limit || 20;
  const offset = (page - 1) * limit;

  const { data, error, count } = await supabaseAny
    .from("posts")
    .select("*", { count: "exact" })
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  return {
    posts: data,
    total: count,
    page,
    totalPages: Math.ceil(count / limit),
  };
}
```

2. **Cache dla często używanych danych:**

```typescript
// lib/cache.ts
const cache = new Map();

export function getCached<T>(key: string): T | null {
  const cached = cache.get(key);
  if (!cached) return null;

  // Expire po 5 minutach
  if (Date.now() - cached.timestamp > 5 * 60 * 1000) {
    cache.delete(key);
    return null;
  }

  return cached.data;
}

export function setCache<T>(key: string, data: T) {
  cache.set(key, { data, timestamp: Date.now() });
}
```

3. **Lazy loading images:**

```tsx
<img src={post.media_urls[0]} loading="lazy" decoding="async" />
```

---

## 📅 TIMELINE & PRIORITIES

| Task                               | Priority | Czas        | Status  |
| ---------------------------------- | -------- | ----------- | ------- |
| 1.1 SQL Migration - posts kolumny  | 🔥 P1    | 30 min      | ⏳ TODO |
| 1.2 SQL - job_applications table   | 🔥 P1    | 20 min      | ⏳ TODO |
| 1.3 Backend - feedService funkcje  | 🔥 P1    | 3h          | ⏳ TODO |
| 2.1 UI - JobApplications Dashboard | 🟡 P2    | 4-5h        | ⏳ TODO |
| 2.2 UI - AdAnalytics Dashboard     | 🟡 P2    | 4-5h        | ⏳ TODO |
| 2.3 UI - Rich Text Editor (Tiptap) | 🟡 P2    | 6-8h        | ⏳ TODO |
| 3.1 Email Notifications            | 🟢 P3    | 4-5h        | ⏳ TODO |
| 4.1 RLS Policies Audit             | 🔐 P4    | 2-3h        | ⏳ TODO |
| 4.2 Performance Optimization       | 🔐 P4    | 3-4h        | ⏳ TODO |
| **TOTAL**                          |          | **~30-38h** |         |

---

## 🎯 IMMEDIATE NEXT STEPS

### Krok 1: Migracja bazy danych (1h)

```bash
# 1. Backup bazy
pg_dump -U postgres zzp_werkplaats > backup_$(date +%Y%m%d).sql

# 2. Wykonaj migracje (przez Supabase Dashboard lub psql)
psql -h YOUR_HOST -U postgres -d zzp_werkplaats < database-migrations/add-post-fields.sql

# 3. Test
SELECT column_name FROM information_schema.columns WHERE table_name = 'posts';
```

### Krok 2: Backend funkcje (3h)

- Dodaj funkcje do `feedService.ts`:
  - `applyForJob()`
  - `getMyJobApplications()`
  - `updateApplicationStatus()`
  - `trackAdImpression()`
  - `trackAdClick()`
  - `getAdAnalytics()`

### Krok 3: Pierwszy komponent UI (4h)

- Stwórz `JobApplications.tsx`
- Test flow: Worker aplikuje → Employer widzi → Zmienia status

---

## ✅ CHECKLIST PRZED ROZPOCZĘCIEM

- [ ] Backup bazy danych
- [ ] Git commit: `git commit -am "Przed rozbudową systemu postów"`
- [ ] Sprawdź dostęp do Supabase Dashboard
- [ ] Zainstaluj zależności: `npm install`
- [ ] Dev server działa: `npm run dev`
- [ ] Console Ninja aktywna

---

## 💬 PYTANIA DO OMÓWIENIA

1. **Job Applications:**

   - Czy worker może edytować/anulować swoją aplikację?
   - Czy wysyłać email notification od razu czy batch (raz dziennie)?

2. **Ad Analytics:**

   - Czy tracking impressions ma się dziać automatycznie (on view) czy trzeba kliknąć?
   - Czy pokazywać analytics wszystkim czy tylko płatnym reklamom?

3. **Rich Text Editor:**

   - Jakie maksymalne limity (znaków, obrazów)?
   - Czy pozwalać na embed video (YouTube/Vimeo)?

4. **Email Notifications:**
   - Jaki provider? (Resend, SendGrid, AWS SES)
   - Czy user może wyłączyć notyfikacje (settings)?

---

**Ostatnia aktualizacja:** 20 listopada 2025  
**Next review:** Po wykonaniu P1 tasków
