# 🗄️ SUPABASE DATABASE - PEŁNA ANALIZA POPRZEZ MCP

**Data analizy:** 10 listopada 2025  
**Metoda:** Supabase Model Context Protocol (MCP)  
**Cel:** Weryfikacja struktury, relacji, migracji i RLS policies

---

## 📊 PODSUMOWANIE WYKONAWCZE

### Struktura Bazy Danych

- **Liczba tabel:** 80+ tabel w schemacie `public`
- **Relacje:** 100+ foreign keys między tabelami
- **Migracje:** 20 migracji wykonanych
- **RLS włączone:** TAK na wszystkich głównych tabelach
- **Security Issues:** 2 CRITICAL (SECURITY DEFINER views)

### Kluczowe Tabele (Ekosystem)

1. **`profiles`** - Centralna tabela użytkowników (7 rekordów)
2. **`workers`** - Profil pracowników ZZP (2 rekordy)
3. **`employers`** - Profil pracodawców (2 rekordy)
4. **`cleaning_companies`** - Firmy sprzątające (2 rekordy)
5. **`accountants`** - Księgowi (1 rekord)
6. **`communication_projects`** - Projekty budowlane/komunikacyjne (3 projekty)

---

## 🏗️ 1. GŁÓWNE TABELE - STRUKTURA I POŁĄCZENIA

### 1.1 **PROFILES** (Tabela Centralna - Auth Hub)

**Powiązania:**

```
profiles.id (uuid)
├── auth.users.id (PRIMARY KEY FOREIGN KEY)
├── workers.profile_id (CASCADE DELETE)
├── workers.user_id (CASCADE DELETE)
├── employers.profile_id (CASCADE DELETE)
├── employers.user_id (CASCADE DELETE)
├── cleaning_companies.profile_id (CASCADE DELETE)
├── accountants.profile_id (CASCADE DELETE)
├── messages.sender_id (CASCADE DELETE)
├── messages.recipient_id (CASCADE DELETE)
├── reviews.reviewer_id (NO ACTION)
├── reviews.reviewee_id (NO ACTION)
├── notifications.user_id (CASCADE DELETE)
├── project_members.profile_id (CASCADE DELETE)
└── [30+ innych relacji]
```

**Kolumny:**

- `id` (uuid, PK) - Linked do auth.users
- `email` (text, UNIQUE)
- `full_name` (text, nullable)
- `role` (text) - CHECK: `'worker' | 'employer' | 'accountant' | 'cleaning_company'`
- `phone`, `avatar_url`, `created_at`, `updated_at`

**RLS:** ✅ WŁĄCZONE (rls_enabled: true)

---

### 1.2 **WORKERS** (Pracownicy ZZP)

**Struktura:** 79 kolumn (!), **2 rekordy**

**Kluczowe Kolumny:**

```sql
-- Identyfikacja
id (uuid, PK)
profile_id (uuid, FK -> profiles.id, CASCADE DELETE)
user_id (uuid, FK -> profiles.id, CASCADE DELETE)

-- Dashboard Worker Panel (NEW COLUMNS)
availability (jsonb) - DEFAULT: {"friday": true, "monday": true, ...}
preferred_days_per_week (integer) - DEFAULT: 5, CHECK 1-7
unavailable_dates (jsonb) - Array: [{date, reason, type}]
portfolio_images (jsonb) - Array URLs (max 20)
is_available (boolean) - DEFAULT: true - Toggle dostępności
rate_negotiable (boolean) - DEFAULT: false

-- Subskrypcja
subscription_tier (text) - 'basic' | 'premium'
subscription_status (text) - 'active' | 'cancelled' | 'expired' | 'trial'
subscription_start_date (timestamptz)
subscription_end_date (timestamptz)
monthly_fee (numeric) - DEFAULT: 13.00

-- Certyfikaty ZZP
zzp_certificate_issued (boolean)
zzp_certificate_number (text, UNIQUE)
zzp_certificate_expires_at (timestamptz)

-- Profil
specialization, experience_years, verified
hourly_rate, hourly_rate_max
radius_km (DEFAULT: 50)
rating (0-5), rating_count
bio, languages (array)
kvk_number, btw_number
skills (array), certifications (array)

-- Lokalizacja
location_city, postal_code, latitude, longitude
address

-- Zespół
worker_type ('individual' | 'team')
team_size, team_description, team_hourly_rate

-- Statystyki
total_jobs_completed (DEFAULT: 0)
total_earnings (DEFAULT: 0)
completed_jobs, response_rate (DEFAULT: 100)
profile_views, last_active
```

**Relacje (Foreign Keys DO workers):**

```
workers.id jest używane przez:
├── jobs.worker_id (SET NULL on delete)
├── applications.worker_id (CASCADE DELETE)
├── worker_skills.worker_id (CASCADE DELETE)
├── reviews.worker_id (CASCADE DELETE)
├── worker_portfolio.worker_id (CASCADE DELETE)
├── employer_saved_workers.worker_id (CASCADE DELETE)
├── worker_availability.worker_id (CASCADE DELETE)
├── earnings.worker_id (CASCADE DELETE)
├── certificates.worker_id (CASCADE DELETE)
├── profile_views.worker_id (CASCADE DELETE)
├── job_applications.worker_id (CASCADE DELETE)
└── saved_workers.worker_id (CASCADE DELETE)
```

**Migracja Worker Dashboard:**

```sql
-- Migracja: 20251110093432_worker_dashboard_unification
Dodane kolumny:
- availability (jsonb)
- preferred_days_per_week (integer)
- unavailable_dates (jsonb)
- portfolio_images (jsonb)
- is_available (boolean)
- rate_negotiable (boolean)
- service_radius_km (integer, CHECK > 0 AND <= 200)
```

**RLS:** ✅ WŁĄCZONE  
**Koment:** "Extended worker profiles with complete information for Worker Dashboard"

---

### 1.3 **EMPLOYERS** (Pracodawcy)

**Struktura:** 41 kolumn, **2 rekordy**

**Kluczowe Kolumny:**

```sql
-- Identyfikacja
id (uuid, PK)
profile_id (uuid, FK -> profiles.id, CASCADE DELETE)
user_id (uuid, FK -> profiles.id, CASCADE DELETE)

-- Firma
company_name, kvk_number (UNIQUE)
company_type - B.V., Uitzendbureau, ZZP, Eenmanszaak
btw_number, rsin_number

-- Subskrypcja
subscription_tier - 'basic' | 'premium' | 'enterprise'
subscription_status - 'active' | 'inactive' | 'cancelled' | 'expired'
subscription_started_at, subscription_expires_at

-- Lokalizacja i Kontakt
address, city, postal_code, country (DEFAULT: 'NL')
latitude, longitude
contact_person, contact_phone, contact_email
website, logo_url

-- Google Integration
google_place_id, google_rating (0-5)
google_review_count, google_maps_url

-- Statystyki
total_jobs_posted (DEFAULT: 0)
total_hires (DEFAULT: 0)
avg_rating (0-5)
rating, rating_count
profile_completed (boolean)

-- Weryfikacja
verified (boolean), verified_at
```

**Relacje (Foreign Keys DO employers):**

```
employers.id jest używane przez:
├── jobs.employer_id (CASCADE DELETE)
├── applications.employer_id (NO ACTION)
├── reviews.employer_id (CASCADE DELETE)
├── employer_saved_workers.employer_id (CASCADE DELETE)
├── employer_search_history.employer_id (CASCADE DELETE)
├── employer_stats.employer_id (CASCADE DELETE)
├── earnings.employer_id (NO ACTION)
├── profile_views.employer_id (SET NULL)
├── cleaning_reviews.employer_id (CASCADE DELETE)
├── contact_attempts.employer_id (CASCADE DELETE)
└── communication_projects.employer_id (CASCADE DELETE)
```

**RLS:** ✅ WŁĄCZONE  
**Koment:** "Extended employer profiles with complete company information"

---

### 1.4 **CLEANING_COMPANIES** (Firmy Sprzątające)

**Struktura:** 34 kolumny, **2 rekordy**

**Kluczowe Kolumny:**

```sql
-- Identyfikacja
id (uuid, PK)
profile_id (uuid, FK -> profiles.id, CASCADE DELETE)

-- Firma
company_name, owner_name
phone, email, kvk_number

-- Lokalizacja i Zasięg
location_city, location_province
service_radius_km (DEFAULT: 20, CHECK: 1-200)

-- Specjalizacja
specialization (array) - DEFAULT: ['cleaning_after_construction']
additional_services (array)

-- Dostępność (PODOBNIE JAK WORKERS!)
availability (jsonb) - DEFAULT: {"friday": false, "monday": false, ...}
preferred_days_per_week (integer, DEFAULT: 2)
unavailable_dates (jsonb) - Array: [{date, reason, type}]

-- Cennik
hourly_rate_min, hourly_rate_max
rate_negotiable (boolean, DEFAULT: true)

-- Zespół
years_experience (DEFAULT: 0)
team_size (DEFAULT: 1, CHECK > 0)
bio

-- Portfolio i Zdjęcia
portfolio_images (array) - text[] URLs
avatar_url - Logo firmy
cover_image_url - Okładka profilu

-- Oceny
average_rating (0-5)
total_reviews (DEFAULT: 0)

-- Subskrypcja
subscription_tier - 'basic' | 'premium'
subscription_status - 'active' | ...
profile_visibility - 'public' | 'private'
accepting_new_clients (boolean, DEFAULT: true)

-- Aktywność
last_active, created_at, updated_at
```

**Relacje (Foreign Keys DO cleaning_companies):**

```
cleaning_companies.id jest używane przez:
├── cleaning_reviews.cleaning_company_id (CASCADE DELETE)
├── project_cleaning_assignments.company_id (CASCADE DELETE)
├── profile_views.cleaning_company_id (CASCADE DELETE)
└── contact_attempts.cleaning_company_id (CASCADE DELETE)
```

**Migracje związane:**

```sql
-- 20251109071512_add_unavailable_dates_to_cleaning_companies
-- 20251109100249_create_project_cleaning_assignments
-- 20251109104730_add_cleaning_company_role_to_profiles
-- 20251110001207_add_cleaning_company_to_profile_views
```

**RLS:** ✅ WŁĄCZONE

---

### 1.5 **MESSAGES** (System Wiadomości)

**Struktura:** 15 kolumn, **16 rekordów**

**Kluczowe Kolumny:**

```sql
id (uuid, PK)
sender_id (uuid, FK -> profiles.id, CASCADE DELETE)
recipient_id (uuid, FK -> profiles.id, CASCADE DELETE)
job_id (uuid, FK -> jobs.id, SET NULL) - Opcjonalne powiązanie z ofertą

subject, content
read_at, is_read (DEFAULT: false)
attachments (array)
message_type (DEFAULT: 'direct')

-- Projekty budowlane
project_id (uuid)
task_id (uuid)
location_data (jsonb)
priority ('normal' | 'low' | 'high' | 'urgent')

created_at
```

**Relacje:**

```
messages.sender_id -> profiles.id (CASCADE DELETE)
messages.recipient_id -> profiles.id (CASCADE DELETE)
messages.job_id -> jobs.id (SET NULL)
```

**RLS:** ✅ WŁĄCZONE  
**Migracja Fix:** `20251110074720_fix_rls_messages_reviews`

---

### 1.6 **REVIEWS** (System Opinii)

**Struktura:** 21 kolumn, **2 rekordy**

**Kluczowe Kolumny:**

```sql
id (uuid, PK)
job_id (uuid, FK -> jobs.id, SET NULL)
worker_id (uuid, FK -> workers.id, CASCADE DELETE)
employer_id (uuid, FK -> employers.id, CASCADE DELETE)
reviewer_id (uuid, FK -> profiles.id, NO ACTION)
reviewee_id (uuid, FK -> profiles.id, NO ACTION)

rating (integer, CHECK: 1-5)
comment (text)

-- Szczegółowe oceny
quality_rating (1-5)
punctuality_rating (1-5)
communication_rating (1-5)
safety_rating (1-5)

photos (array)
would_recommend (boolean, DEFAULT: true)

-- Status i weryfikacja
status - 'pending' | 'approved' | 'rejected' | 'hidden'
verified_by_platform (boolean, DEFAULT: false)
reviewed_by_admin (uuid, FK -> profiles.id)

-- Daty
created_at, updated_at, approved_at

-- Odpowiedź pracownika
job_title (text)
response (text) - Worker response to employer review
response_date (timestamptz)
```

**Relacje:**

```
reviews.job_id -> jobs.id (SET NULL)
reviews.worker_id -> workers.id (CASCADE DELETE)
reviews.employer_id -> employers.id (CASCADE DELETE)
reviews.reviewer_id -> profiles.id (NO ACTION)
reviews.reviewee_id -> profiles.id (NO ACTION)
reviews.reviewed_by_admin -> profiles.id (NO ACTION)
```

**RLS:** ✅ WŁĄCZONE  
**Migracja Fix:** `20251110074720_fix_rls_messages_reviews`

---

### 1.7 **COMMUNICATION_PROJECTS** (Projekty Budowlane)

**Struktura:** 23 kolumny, **3 projekty aktywne**

**Kluczowe Kolumny:**

```sql
id (uuid, PK)
name, description
employer_id (uuid, FK -> employers.id, CASCADE DELETE)
employer_name

-- Status
status - 'active' | 'completed' | 'paused' | 'cancelled'

-- Twórca i zespół
created_by (uuid, FK -> auth.users.id)
project_members (jsonb) - Array członków
assigned_accountants (jsonb)
assigned_workers (jsonb)

-- Lokalizacja i harmonogram
project_type (DEFAULT: 'construction')
location_address, location_coordinates (jsonb)
start_date, end_date
budget (numeric)

-- Komunikacja
default_language (DEFAULT: 'nl')
communication_channels (jsonb) - {chat: true, video: false, voice: false}

-- Uprawnienia
max_members (DEFAULT: 50)
allow_worker_invite (boolean, DEFAULT: false)
require_approval (boolean, DEFAULT: true)

-- Wyszukiwanie
search_vector (tsvector)

created_at, updated_at
```

**Relacje (Foreign Keys DO communication_projects):**

```
communication_projects.id jest używane przez:
├── project_members.project_id (CASCADE DELETE)
├── project_communication_rooms.project_id (CASCADE DELETE)
├── project_tasks.project_id (CASCADE DELETE)
├── project_invites.project_id (CASCADE DELETE)
├── project_events.project_id (CASCADE DELETE)
└── project_cleaning_assignments.project_id (CASCADE DELETE)
```

**Tabele powiązane (ekosystem projektów):**

- `project_members` (8 rekordów)
- `project_communication_rooms` (3 pokoje)
- `project_tasks` (8 zadań)
- `project_events` (2 wydarzenia)
- `project_cleaning_assignments` (przypisania firm sprzątających)

**RLS:** ✅ WŁĄCZONE

---

## 🔗 2. RELACJE MIĘDZY TABELAMI - MAPA POŁĄCZEŃ

### 2.1 **Profile Ecosystem (profiles → role-specific tables)**

```
┌─────────────┐
│  profiles   │ (Central Auth Table)
│  id (uuid)  │
└──────┬──────┘
       │
       ├──────────────────────────────────────┐
       │                                      │
       ▼                                      ▼
┌──────────────┐                      ┌──────────────┐
│   workers    │                      │  employers   │
│  profile_id  │◄────CASCADE DELETE   │  profile_id  │
│  user_id     │                      │  user_id     │
└──────────────┘                      └──────────────┘
       │                                      │
       ▼ (CASCADE DELETE)                    ▼ (CASCADE DELETE)
 ┌───────────────────┐                ┌─────────────────┐
 │ worker_skills     │                │ employer_stats  │
 │ worker_portfolio  │                │ saved_workers   │
 │ worker_availability│               │ search_history  │
 │ certificates      │                └─────────────────┘
 │ earnings          │
 └───────────────────┘

       │
       ▼
┌──────────────────┐                 ┌──────────────────────┐
│cleaning_companies│                 │   accountants        │
│   profile_id     │                 │   profile_id         │
└──────────────────┘                 └──────────────────────┘
       │
       ▼ (CASCADE DELETE)
┌──────────────────┐
│cleaning_reviews  │
│contact_attempts  │
└──────────────────┘
```

### 2.2 **Jobs & Applications Workflow**

```
┌──────────────┐
│  employers   │
│   id (uuid)  │
└──────┬───────┘
       │ (CASCADE DELETE)
       ▼
┌──────────────┐
│     jobs     │ (0 rekordów - brak aktywnych ofert!)
│ employer_id  │
│ worker_id    │◄────(SET NULL on delete)
└──────┬───────┘
       │
       ├────────────────────┬──────────────────┐
       │                    │                  │
       ▼ (CASCADE DELETE)   ▼ (SET NULL)      ▼
┌──────────────┐     ┌──────────────┐  ┌──────────────┐
│ applications │     │  messages    │  │   reviews    │
│  job_id      │     │   job_id     │  │   job_id     │
│  worker_id   │     └──────────────┘  └──────────────┘
│  employer_id │
└──────────────┘
```

### 2.3 **Communication & Projects System**

```
┌────────────────────────┐
│ communication_projects │
│       id (uuid)        │
└───────────┬────────────┘
            │
            ├──────────────────────┬─────────────────┬─────────────────────┐
            │                      │                 │                     │
            ▼ (CASCADE DELETE)     ▼                 ▼                     ▼
    ┌───────────────┐      ┌──────────────┐  ┌──────────────┐   ┌──────────────────┐
    │project_members│      │project_tasks │  │project_events│   │project_cleaning_ │
    │  project_id   │      │  project_id  │  │  project_id  │   │   assignments    │
    └───────────────┘      └──────────────┘  └──────────────┘   │   company_id     │
                                    │                  │          └──────────────────┘
                                    ▼                  ▼
                           ┌──────────────┐    ┌─────────────────┐
                           │task_comments │    │event_participants│
                           │task_attachments    │event_notifications
                           │task_checklists│    └─────────────────┘
                           └──────────────┘
```

### 2.4 **Reviews System (Multi-Entity)**

```
┌─────────────┐
│   reviews   │
│  id (uuid)  │
└──────┬──────┘
       │
       ├──────────────────────────────────────────────────┐
       │                                                   │
       │ Foreign Keys:                                    │
       ├─► job_id (jobs.id) - SET NULL                   │
       ├─► worker_id (workers.id) - CASCADE DELETE       │
       ├─► employer_id (employers.id) - CASCADE DELETE   │
       ├─► reviewer_id (profiles.id) - NO ACTION         │
       ├─► reviewee_id (profiles.id) - NO ACTION         │
       └─► reviewed_by_admin (profiles.id) - NO ACTION   │
```

**Podobnie:**

```
┌──────────────────┐
│cleaning_reviews  │
└──────┬───────────┘
       ├─► cleaning_company_id (CASCADE DELETE)
       └─► employer_id (CASCADE DELETE)
```

### 2.5 **Messaging System (profiles-based)**

```
┌─────────────┐
│  messages   │
│  id (uuid)  │
└──────┬──────┘
       │
       ├─► sender_id (profiles.id) - CASCADE DELETE
       ├─► recipient_id (profiles.id) - CASCADE DELETE
       ├─► job_id (jobs.id) - SET NULL
       ├─► project_id (uuid) - brak FK constraint
       └─► task_id (uuid) - brak FK constraint
```

### 2.6 **Invoice System (profiles-based, isolated)**

```
┌─────────────────┐
│     profiles    │
│     id (uuid)   │
└────────┬────────┘
         │ (CASCADE DELETE na wszystkich)
         │
         ├──────────────────────────────────────────┐
         │                                          │
         ▼                                          ▼
┌──────────────────┐                     ┌──────────────────┐
│invoice_companies │                     │invoice_clients   │
│    user_id       │                     │    user_id       │
└──────────────────┘                     └────────┬─────────┘
                                                  │
         ┌────────────────────────────────────────┤
         │                                        │
         ▼                                        ▼
┌──────────────────┐                     ┌──────────────────┐
│invoice_products  │                     │invoice_invoices  │
│    user_id       │                     │    user_id       │
└──────────────────┘                     │    client_id     │
         │                                └────────┬─────────┘
         │                                         │
         │                                         ▼
         │                              ┌──────────────────────┐
         └─────────────────────────────►│invoice_invoice_lines │
                                        │    invoice_id        │
                                        │    product_id        │
                                        └──────────────────────┘
```

**Inne tabele invoice:**

- `invoice_expenses` (1 rekord)
- `invoice_kilometer_entries` (3 rekordy)
- `invoice_btw_declarations` (0 rekordów)

---

## 🔒 3. ROW LEVEL SECURITY (RLS) - STATUS

### 3.1 **RLS WŁĄCZONE na wszystkich kluczowych tabelach:**

✅ **Tabele z RLS:**

- `profiles` (7 rekordów)
- `workers` (2 rekordy)
- `employers` (2 rekordy)
- `cleaning_companies` (2 rekordy)
- `accountants` (1 rekord)
- `jobs` (0 rekordów)
- `applications` (0 rekordów)
- `worker_skills` (0 rekordów)
- `messages` (16 rekordów)
- `reviews` (2 rekordy)
- `worker_portfolio` (0 rekordów)
- `employer_saved_workers` (1 rekord)
- `employer_stats` (2 rekordy)
- `notifications` (8 rekordów)
- `worker_availability` (0 rekordów)
- `earnings` (0 rekordów)
- `employer_search_history` (0 rekordów)
- `certificates` (0 rekordów)
- `admin_logs` (0 rekordów)
- `analytics_events` (0 rekordów)
- `profile_views` (40 rekordów)
- `job_applications` (1 rekord)
- `saved_workers` (0 rekordów)
- `subscriptions` (0 rekordów)
- `accountant_services` (0 rekordów)
- `accountant_forms` (0 rekordów)
- `form_submissions` (0 rekordów)
- `accountant_reviews` (0 rekordów)
- `posts` (3 rekordy)
- `post_likes` (6 rekordów)
- `post_comments` (3 rekordy)
- `comment_likes` (0 rekordów)
- `post_shares` (1 rekord)
- `post_views` (0 rekordów)
- `invoice_*` (wszystkie tabele faktury)
- `communication_projects` (3 projekty)
- `project_members` (8 członków)
- `project_communication_rooms` (3 pokoje)
- `project_tasks` (8 zadań)
- `project_events` (2 wydarzenia)
- `cleaning_reviews` (2 opinie)
- `project_cleaning_assignments` (0 przypisań)
- `contact_attempts` (0 prób kontaktu)
- I wiele innych...

### 3.2 **Tabele BEZ RLS (System/Infrastructure):**

- Żadne tabele w `public` schema nie mają wyłączonego RLS
- **Wszystkie 80+ tabel mają `rls_enabled: true`**

---

## 🚨 4. SECURITY ADVISORS - WYKRYTE PROBLEMY

### 4.1 **CRITICAL ISSUES (2)**

#### ⚠️ **Security Definer Views**

**Problem 1: `task_templates` view**

```
View: public.task_templates
Level: ERROR
Category: SECURITY
Issue: SECURITY DEFINER property
```

**Opis:** View używa uprawnień twórcy zamiast użytkownika wykonującego zapytanie, co może ominąć RLS.

**Remediation:** https://supabase.com/docs/guides/database/database-linter?lint=0010_security_definer_view

---

**Problem 2: `v_workers` view**

```
View: public.v_workers
Level: ERROR
Category: SECURITY
Issue: SECURITY DEFINER property
```

**Opis:** Podobny problem - view wykonuje się z uprawnieniami twórcy.

**Remediation:** https://supabase.com/docs/guides/database/database-linter?lint=0010_security_definer_view

---

### 4.2 **WARNINGS (50+)**

#### ⚠️ **Function Search Path Mutable**

**Wykryte funkcje (przykłady):**

```sql
- get_worker_stats()
- update_worker_rating()
- update_cleaning_company_rating()
- initialize_employer_stats()
- create_notification()
- log_project_activity()
- mark_message_as_read()
- update_entity_ratings()
- [i 40+ innych funkcji]
```

**Problem:** Funkcje nie mają ustawionego `search_path`, co może prowadzić do exploitów.

**Remediation:** https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable

**Przykładowa naprawa:**

```sql
ALTER FUNCTION public.get_worker_stats()
SET search_path = public, pg_temp;
```

---

### 4.3 **PASSWORD SECURITY WARNING**

```
Level: WARN
Category: SECURITY
Issue: Leaked Password Protection Disabled
```

**Opis:** Supabase Auth nie sprawdza haseł w bazie HaveIBeenPwned.org

**Remediation:** https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

**Jak włączyć:**

1. Dashboard Supabase → Authentication → Policies
2. Enable "Leaked Password Protection"
3. Minimalna siła hasła: "Good" lub "Strong"

---

## 📋 5. MIGRACJE - HISTORIA ZMIAN

### 5.1 **Wszystkie Migracje (20)**

| **Version**      | **Name**                                      | **Opis**                                                 |
| ---------------- | --------------------------------------------- | -------------------------------------------------------- |
| `20250125000001` | `add_subscription_start_date`                 | Dodanie `subscription_start_date` dla subskrypcji        |
| `20251024000001` | `extend_workers_table`                        | Rozszerzenie tabeli `workers` (79 kolumn!)               |
| `20251024000002` | `extend_employers_table`                      | Rozszerzenie tabeli `employers`                          |
| `20251024000003` | `create_applications_table`                   | Tabela aplikacji worker→employer                         |
| `20251024000004` | `create_worker_skills_table`                  | Tabela umiejętności pracowników                          |
| `20251024000005` | `create_messages_table`                       | System wiadomości                                        |
| `20251024000006` | `create_reviews_table`                        | System opinii                                            |
| `20251024000007` | `create_worker_portfolio_table`               | Portfolio pracowników                                    |
| `20251024000008` | `create_employer_saved_workers_table`         | Zapisani pracownicy pracodawcy                           |
| `20251024000009` | `create_employer_stats_table`                 | Statystyki pracodawcy                                    |
| `20251024000010` | `create_notifications_table`                  | System powiadomień                                       |
| `20251024000011` | `create_remaining_p2_tables`                  | Pozostałe tabele P2                                      |
| `20251109071512` | `add_unavailable_dates_to_cleaning_companies` | **Cleaning Companies - unavailable_dates**               |
| `20251109100249` | `create_project_cleaning_assignments`         | **Przypisania firm sprzątających do projektów**          |
| `20251109104730` | `add_cleaning_company_role_to_profiles`       | **Role cleaning_company w profiles**                     |
| `20251109230125` | `improve_cleaning_reviews_rls_task6`          | **Fix RLS dla cleaning_reviews**                         |
| `20251109233135` | `create_contact_attempts_table_task7_v2`      | **Tabela prób kontaktu**                                 |
| `20251110001207` | `add_cleaning_company_to_profile_views`       | **Dodanie cleaning_company_id do profile_views**         |
| `20251110074720` | `fix_rls_messages_reviews`                    | **Fix RLS dla messages i reviews**                       |
| `20251110093432` | `worker_dashboard_unification`                | **🆕 WORKER DASHBOARD - Unifikacja z CleaningDashboard** |

---

### 5.2 **Ostatnia Migracja: Worker Dashboard Unification**

**Dodane kolumny do `workers`:**

```sql
ALTER TABLE public.workers
ADD COLUMN availability jsonb DEFAULT '{"friday": true, "monday": true, "sunday": false, "tuesday": true, "saturday": false, "thursday": true, "wednesday": true}'::jsonb,
ADD COLUMN preferred_days_per_week integer DEFAULT 5 CHECK (preferred_days_per_week >= 1 AND preferred_days_per_week <= 7),
ADD COLUMN unavailable_dates jsonb DEFAULT '[]'::jsonb,
ADD COLUMN portfolio_images jsonb DEFAULT '[]'::jsonb,
ADD COLUMN is_available boolean DEFAULT true,
ADD COLUMN rate_negotiable boolean DEFAULT false,
ADD COLUMN service_radius_km integer DEFAULT 50 CHECK (service_radius_km > 0 AND service_radius_km <= 200);

COMMENT ON COLUMN public.workers.availability IS 'Weekly availability calendar as JSON: {"monday": true, ...}';
COMMENT ON COLUMN public.workers.preferred_days_per_week IS 'Preferred number of working days per week (1-7)';
COMMENT ON COLUMN public.workers.unavailable_dates IS 'Array of unavailable dates: [{"date": "YYYY-MM-DD", "reason": "vacation", "type": "vacation|holiday|fully_booked"}]';
COMMENT ON COLUMN public.workers.portfolio_images IS 'Array of portfolio image URLs from Supabase Storage (max 20 images)';
COMMENT ON COLUMN public.workers.is_available IS 'Current availability status toggle (Dostępny do pracy)';
COMMENT ON COLUMN public.workers.rate_negotiable IS 'Whether hourly rate is negotiable';
```

**Cel:** Unifikacja Worker Dashboard z CleaningDashboard - identyczna funkcjonalność kalendarza, portfolio, dostępności.

---

## 🎯 6. KLUCZOWE RELACJE - SZCZEGÓŁY CASCADE

### 6.1 **CASCADE DELETE (Najważniejsze)**

**profiles.id → workers** (CASCADE DELETE)

```sql
DELETE FROM profiles WHERE id = '...'
  → Automatycznie usuwa rekord w workers.profile_id
  → Automatycznie usuwa rekord w workers.user_id
  → CASCADE propaguje do:
     - worker_skills
     - worker_portfolio
     - certificates
     - earnings
     - applications
     - reviews
     - saved_workers
     - profile_views
```

**profiles.id → employers** (CASCADE DELETE)

```sql
DELETE FROM profiles WHERE id = '...'
  → Automatycznie usuwa rekord w employers.profile_id
  → Automatycznie usuwa rekord in employers.user_id
  → CASCADE propaguje do:
     - employer_stats
     - employer_saved_workers
     - employer_search_history
     - cleaning_reviews (jako employer)
     - communication_projects
```

**profiles.id → cleaning_companies** (CASCADE DELETE)

```sql
DELETE FROM profiles WHERE id = '...'
  → Automatycznie usuwa rekord w cleaning_companies.profile_id
  → CASCADE propaguje do:
     - cleaning_reviews
     - project_cleaning_assignments
     - contact_attempts
     - profile_views
```

---

### 6.2 **SET NULL (Bezpieczne usuwanie)**

**jobs.worker_id → workers.id** (SET NULL)

```sql
DELETE FROM workers WHERE id = '...'
  → jobs.worker_id = NULL (nie usuwa job!)
```

**jobs.id → messages.job_id** (SET NULL)

```sql
DELETE FROM jobs WHERE id = '...'
  → messages.job_id = NULL (nie usuwa wiadomości!)
```

**jobs.id → reviews.job_id** (SET NULL)

```sql
DELETE FROM jobs WHERE id = '...'
  → reviews.job_id = NULL (nie usuwa opinii!)
```

---

### 6.3 **NO ACTION (Wymaga ręcznej obsługi)**

**profiles.id → reviews.reviewer_id/reviewee_id** (NO ACTION)

```sql
DELETE FROM profiles WHERE id = '...'
  → BŁĄD jeśli istnieją reviews!
  → Trzeba najpierw usunąć powiązane reviews
```

**profiles.id → admin_logs.admin_id** (NO ACTION)

```sql
DELETE FROM profiles WHERE id = '...'
  → BŁĄD jeśli admin wykonał jakieś akcje!
```

---

## 📊 7. STATYSTYKI BAZY DANYCH

### 7.1 **Liczba Rekordów (TOP 10)**

| **Tabela**                    | **Rekordy** |
| ----------------------------- | ----------- |
| `profile_views`               | 40          |
| `messages`                    | 16          |
| `notifications`               | 8           |
| `project_members`             | 8           |
| `project_tasks`               | 8           |
| `profiles`                    | 7           |
| `post_likes`                  | 6           |
| `post_comments`               | 3           |
| `posts`                       | 3           |
| `communication_projects`      | 3           |
| `project_communication_rooms` | 3           |
| `invoice_kilometer_entries`   | 3           |
| `employers`                   | 2           |
| `workers`                     | 2           |
| `cleaning_companies`          | 2           |
| `reviews`                     | 2           |
| `cleaning_reviews`            | 2           |
| `employer_stats`              | 2           |
| `project_events`              | 2           |

**Pozostałe tabele:** 0-1 rekordów lub puste

---

### 7.2 **Najpopularniejsze Foreign Keys**

**profiles.id** (Central Hub):

- 30+ foreign keys wskazujących na profiles.id
- Każdy user może mieć wiele ról jednocześnie (worker + employer możliwe!)

**workers.id**:

- 13 foreign keys z innych tabel
- Najważniejsze: applications, reviews, earnings, portfolio

**employers.id**:

- 12 foreign keys z innych tabel
- Najważniejsze: jobs, applications, employer_stats, saved_workers

**communication_projects.id**:

- 6 foreign keys (members, tasks, events, rooms, assignments)

---

## 🔍 8. PUSTE TABELE (Nieużywane Funkcje)

**Główne systemy bez danych:**

- `jobs` (0) - **Brak ofert pracy!**
- `applications` (0) - Brak aplikacji
- `worker_skills` (0) - Brak dodanych umiejętności
- `worker_portfolio` (0) - Brak portfolio projektów
- `worker_availability` (0) - Brak kalendarza dostępności (NOWA funkcja!)
- `earnings` (0) - Brak zarobków
- `certificates` (0) - Brak certyfikatów
- `subscriptions` (0) - Brak aktywnych subskrypcji (dane w workers/employers)
- `saved_workers` (0) - Brak zapisanych pracowników
- `employer_search_history` (0) - Brak historii wyszukiwań
- `accountant_*` (0) - System księgowych nieużywany
- `invoice_btw_declarations` (0) - Brak deklaracji VAT
- `project_cleaning_assignments` (0) - Brak przypisanych firm sprzątających

**Aktywne systemy:**

- ✅ Communication Projects (3 projekty, 8 tasków, 8 członków)
- ✅ Messages (16 wiadomości)
- ✅ Notifications (8 powiadomień)
- ✅ Reviews (4 opinie: 2 workers + 2 cleaning)
- ✅ Posts/Feed (3 posty, 6 polubień, 3 komentarze)
- ✅ Invoice Products (1), Clients (1), Companies (1), Invoices (4)
- ✅ Profile Views (40 wyświetleń)

---

## ✅ 9. REKOMENDACJE I AKCJE DO WYKONANIA

### 9.1 **SECURITY FIXES (Priorytet: CRITICAL)**

#### 🔴 **Fix Security Definer Views**

```sql
-- 1. Sprawdź definicję views
SELECT definition FROM pg_views WHERE viewname = 'task_templates';
SELECT definition FROM pg_views WHERE viewname = 'v_workers';

-- 2. Usuń SECURITY DEFINER lub przeprojektuj jako funkcję
DROP VIEW IF EXISTS public.task_templates;
DROP VIEW IF EXISTS public.v_workers;

-- 3. Stwórz na nowo bez SECURITY DEFINER
-- lub użyj SECURITY INVOKER (PostgreSQL 15+)
```

#### 🟡 **Fix Function Search Paths**

```sql
-- Przykład dla wszystkich funkcji
ALTER FUNCTION public.get_worker_stats()
SET search_path = public, pg_temp;

ALTER FUNCTION public.update_worker_rating(uuid, integer)
SET search_path = public, pg_temp;

ALTER FUNCTION public.update_cleaning_company_rating(uuid, numeric, integer)
SET search_path = public, pg_temp;

-- Powtórz dla wszystkich 50+ funkcji
```

#### 🟡 **Enable Leaked Password Protection**

```
Dashboard → Authentication → Policies
→ Enable "Leaked Password Protection"
→ Minimum Password Strength: "Strong"
```

---

### 9.2 **DATABASE OPTIMIZATION**

#### 🔄 **Cleanup nieużywanych tabel**

**Rozważ usunięcie lub archiwizację:**

```sql
-- Tabele bez danych przez długi czas
DROP TABLE IF EXISTS public.subscriptions; -- Dane w workers/employers
DROP TABLE IF EXISTS public.search_history; -- Duplikat employer_search_history

-- Lub zachowaj jako archiwum:
-- ALTER TABLE ... SET (autovacuum_enabled = false);
```

#### 📊 **Dodaj indeksy dla wydajności**

**Worker Dashboard - Kluczowe zapytania:**

```sql
-- Indeks na availability dla szybkiego wyszukiwania dostępnych
CREATE INDEX idx_workers_is_available ON workers(is_available)
WHERE is_available = true;

-- Indeks na portfolio_images dla pracowników z portfolio
CREATE INDEX idx_workers_has_portfolio ON workers
USING GIN (portfolio_images)
WHERE jsonb_array_length(portfolio_images) > 0;

-- Indeks na unavailable_dates (GIN dla JSONB)
CREATE INDEX idx_workers_unavailable_dates ON workers
USING GIN (unavailable_dates);

-- Podobnie dla cleaning_companies
CREATE INDEX idx_cleaning_unavailable_dates ON cleaning_companies
USING GIN (unavailable_dates);
```

**Messages & Reviews:**

```sql
-- Szybkie wyszukiwanie nieprzeczytanych wiadomości
CREATE INDEX idx_messages_unread ON messages(recipient_id, is_read)
WHERE is_read = false;

-- Szybkie wyszukiwanie oczekujących opinii
CREATE INDEX idx_reviews_pending ON reviews(status, worker_id)
WHERE status = 'pending';
```

---

### 9.3 **DATA INTEGRITY CHECKS**

#### 🔍 **Sprawdź duplikaty profile_id vs user_id**

```sql
-- Workers z różnymi profile_id i user_id?
SELECT * FROM workers
WHERE profile_id != user_id;

-- Employers z różnymi profile_id i user_id?
SELECT * FROM employers
WHERE profile_id != user_id;

-- DECISION: Czy potrzebne obie kolumny czy jedna wystarczy?
```

#### 🔍 **Sprawdź orphaned records**

```sql
-- Workers bez profilu (nie powinno być dzięki CASCADE)
SELECT * FROM workers w
LEFT JOIN profiles p ON w.profile_id = p.id
WHERE p.id IS NULL;

-- Messages z nieistniejącymi job_id (SET NULL działa?)
SELECT COUNT(*) FROM messages
WHERE job_id IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM jobs WHERE id = messages.job_id);
```

---

### 9.4 **WORKER DASHBOARD - TESTY PO MIGRACJI**

#### ✅ **Sprawdź nowe kolumny**

```sql
-- Test 1: Czy availability działa?
SELECT id, availability, is_available
FROM workers;

-- Test 2: Czy unavailable_dates jest poprawne?
SELECT id, unavailable_dates
FROM workers
WHERE jsonb_array_length(unavailable_dates) > 0;

-- Test 3: Czy portfolio_images się zapisuje?
SELECT id, portfolio_images
FROM workers
WHERE jsonb_array_length(portfolio_images) > 0;
```

#### 🧪 **Testy funkcjonalne (Frontend)**

**Worker Dashboard - Checklist:**

- [ ] Toggle "Dostępny do pracy" (`is_available`)
- [ ] Kalendarz tygodniowy (availability JSON)
- [ ] Dodawanie dat niedostępności (unavailable_dates)
- [ ] Upload portfolio images (portfolio_images)
- [ ] Zmiana promienia zasięgu (service_radius_km)
- [ ] Toggle "Stawka do negocjacji" (rate_negotiable)
- [ ] Zmiana preferowanych dni w tygodniu (preferred_days_per_week)

---

### 9.5 **MONITORING I ALERTY**

#### 📊 **Dodaj funkcje statystyczne**

```sql
-- Dashboard stats - Aktywność użytkowników
CREATE OR REPLACE FUNCTION get_platform_stats()
RETURNS TABLE (
    total_workers INTEGER,
    active_workers INTEGER,
    total_employers INTEGER,
    total_projects INTEGER,
    total_messages INTEGER,
    avg_response_time INTERVAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        (SELECT COUNT(*) FROM workers)::INTEGER,
        (SELECT COUNT(*) FROM workers WHERE last_active > NOW() - INTERVAL '7 days')::INTEGER,
        (SELECT COUNT(*) FROM employers)::INTEGER,
        (SELECT COUNT(*) FROM communication_projects WHERE status = 'active')::INTEGER,
        (SELECT COUNT(*) FROM messages WHERE created_at > NOW() - INTERVAL '30 days')::INTEGER,
        (SELECT AVG(read_at - created_at) FROM messages WHERE read_at IS NOT NULL)::INTERVAL;
END;
$$ LANGUAGE plpgsql STABLE;
```

#### 🔔 **Alerty dla admin**

```sql
-- Funkcja sprawdzająca problemy
CREATE OR REPLACE FUNCTION check_data_quality_issues()
RETURNS TABLE (
    issue_type TEXT,
    count INTEGER,
    description TEXT
) AS $$
BEGIN
    -- Workers bez profilu
    RETURN QUERY
    SELECT 'orphaned_workers'::TEXT,
           COUNT(*)::INTEGER,
           'Workers without valid profile_id'::TEXT
    FROM workers w
    LEFT JOIN profiles p ON w.profile_id = p.id
    WHERE p.id IS NULL;

    -- Nieprzeczytane wiadomości > 30 dni
    RETURN QUERY
    SELECT 'old_unread_messages'::TEXT,
           COUNT(*)::INTEGER,
           'Messages unread for more than 30 days'::TEXT
    FROM messages
    WHERE is_read = false
    AND created_at < NOW() - INTERVAL '30 days';

    -- Reviews pending > 7 dni
    RETURN QUERY
    SELECT 'pending_reviews'::TEXT,
           COUNT(*)::INTEGER,
           'Reviews pending approval for more than 7 days'::TEXT
    FROM reviews
    WHERE status = 'pending'
    AND created_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql STABLE;
```

---

## 📌 10. PODSUMOWANIE - KLUCZOWE WNIOSKI

### ✅ **CO DZIAŁA DOBRZE:**

1. **RLS włączone wszędzie** - ✅ Bezpieczeństwo na poziomie wierszy
2. **Migracje uporządkowane** - ✅ 20 migracji, chronologiczna struktura
3. **Foreign Keys konsekwentne** - ✅ CASCADE DELETE gdzie trzeba, SET NULL gdzie bezpieczniej
4. **Worker Dashboard gotowy** - ✅ Migracja 20251110093432 dodała wszystkie kolumny
5. **Multi-entity system** - ✅ profiles→workers/employers/cleaning_companies/accountants
6. **Communication Projects aktywne** - ✅ 3 projekty, 8 zadań, 8 członków

### ⚠️ **CO WYMAGA NAPRAWY:**

1. **SECURITY DEFINER Views** - 🔴 CRITICAL (task_templates, v_workers)
2. **Function Search Paths** - 🟡 WARN (50+ funkcji)
3. **Leaked Password Protection** - 🟡 WARN (wyłączone)
4. **Duplikacja profile_id vs user_id** - 🔵 INFO (czy obie potrzebne?)
5. **Puste tabele** - 🔵 INFO (jobs, applications, subscriptions - do cleanup)

### 🎯 **PRIORYTETOWE AKCJE:**

1. **Fix Security Definer Views** (dzisiaj)
2. **Enable Password Protection** (dzisiaj)
3. **Add search_path to functions** (10 funkcji/dzień przez 5 dni)
4. **Test Worker Dashboard** (wszystkie nowe funkcje)
5. **Add performance indexes** (availability, portfolio, messages)

---

## 📝 ZAŁĄCZNIKI

### A. Lista wszystkich tabel (80+)

1. profiles
2. workers
3. employers
4. cleaning_companies
5. accountants
6. jobs
7. applications
8. worker_skills
9. messages
10. reviews
11. worker_portfolio
12. employer_saved_workers
13. employer_stats
14. notifications
15. worker_availability
16. earnings
17. employer_search_history
18. certificates
19. admin_logs
20. analytics_events
21. profile_views
22. job_applications
23. search_history
24. saved_workers
25. subscriptions
26. accountant_services
27. accountant_forms
28. form_submissions
29. accountant_reviews
30. posts
31. post_likes
32. post_comments
33. comment_likes
34. post_shares
35. post_views
36. invoice_companies
37. invoice_clients
38. invoice_products
39. invoice_invoices
40. invoice_invoice_lines
41. invoice_expenses
42. invoice_btw_declarations
43. invoice_kilometer_entries
44. project_messages
45. project_chat_groups
46. building_notifications
47. progress_reports
48. safety_alerts
49. communication_projects
50. project_members
51. project_communication_rooms
52. project_tasks
53. task_comments
54. task_attachments
55. project_events
56. event_participants
57. event_notifications
58. projects (oddzielny system!)
59. project_invitations
60. project_permissions
61. project_activity_log
62. project_notifications
63. project_chat_messages
64. task_dependencies
65. task_checklists
66. project_resources
67. resource_bookings
68. team_availability
69. automation_rules
70. project_webhooks
71. project_templates
72. project_kpi_snapshots
73. project_tags
74. task_tags
75. project_invites
76. cleaning_reviews
77. project_cleaning_assignments
78. contact_attempts
79. (i więcej...)

### B. Enums w bazie danych

```sql
-- task_status
CREATE TYPE task_status AS ENUM ('not_started', 'in_progress', 'review', 'completed', 'blocked', 'cancelled');

-- task_priority
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'urgent');

-- event_type
CREATE TYPE event_type AS ENUM ('meeting', 'deadline', 'inspection', 'delivery', 'milestone', 'safety_check', 'client_meeting', 'training', 'other');

-- event_status
CREATE TYPE event_status AS ENUM ('planned', 'confirmed', 'in_progress', 'completed', 'cancelled', 'postponed');

-- attendance_status
CREATE TYPE attendance_status AS ENUM ('invited', 'accepted', 'declined', 'tentative', 'attended', 'absent');

-- project_status
CREATE TYPE project_status AS ENUM ('planning', 'active', 'on_hold', 'completed', 'cancelled');

-- invitation_status
CREATE TYPE invitation_status AS ENUM ('pending', 'accepted', 'declined', 'expired', 'cancelled');

-- notification_status
CREATE TYPE notification_status AS ENUM ('unread', 'read', 'archived', 'dismissed');

-- notification_type
CREATE TYPE notification_type AS ENUM ('task_assigned', 'task_due_soon', 'task_overdue', 'event_reminder', 'event_cancelled', 'project_update', 'team_invitation', 'permission_granted', 'permission_revoked', 'budget_alert', 'deadline_alert', 'milestone_achieved', 'system_message', 'weekly_summary');

-- activity_type
CREATE TYPE activity_type AS ENUM ('project_created', 'project_updated', 'project_status_changed', 'task_created', 'task_updated', 'task_completed', 'task_assigned', 'task_comment_added', 'event_created', 'event_updated', 'event_cancelled', 'member_invited', 'member_joined', 'member_left', 'member_removed', 'permissions_changed', 'budget_updated', 'deadline_changed', 'file_uploaded', 'file_removed', 'milestone_reached', 'milestone_missed', 'report_generated', 'backup_created', 'system_maintenance');

-- permission_scope
CREATE TYPE permission_scope AS ENUM ('view_tasks', 'create_tasks', 'edit_tasks', 'delete_tasks', 'assign_tasks', 'view_events', 'create_events', 'edit_events', 'delete_events', 'view_team', 'manage_team', 'invite_members', 'remove_members', 'view_financials', 'edit_financials', 'view_reports', 'export_data', 'project_settings', 'full_admin');

-- invite_status
CREATE TYPE invite_status AS ENUM ('pending', 'accepted', 'rejected', 'expired');
```

---

**KONIEC RAPORTU**

_Wygenerowano przez Supabase MCP Tools_  
_Wszystkie dane aktualne na 10.11.2025_
