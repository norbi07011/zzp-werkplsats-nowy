# 🚨 DIAGNOZA: INCOMPATYBILNOŚĆ SYSTEMU CLEANING COMPANIES

**Data:** 16 listopada 2025  
**Problem:** Cleaning companies nie działają poprawnie z resztą systemu

---

## ❌ GŁÓWNE PROBLEMY

### 1. **PODWÓJNY SYSTEM - CLEANING_COMPANIES vs WORKERS**

#### ✅ CLEANING_COMPANIES (Istnieje w Supabase):

```typescript
// Tabela: cleaning_companies
- id, profile_id
- company_name, owner_name
- email, phone, kvk_number
- specialization[] (array)
- portfolio_images[] (array URL-i)
- availability (jsonb)
- average_rating, total_reviews
- accepting_new_clients
```

#### ✅ WORKERS (System główny - FINAL_SCHEMA.sql):

```typescript
// Tabela: workers
- id, profile_id
- specialization (text) ← pojedyncza wartość!
- experience_years
- certifications[]
- avatar_url, phone
- hourly_rate, hourly_rate_max
- bio, languages[]
- profile_views (integer counter) ← W TABELI!
- rating, rating_count
```

**KONFLIKT:**

- Sprzątaczki są w `cleaning_companies`
- Wyszukiwarka szuka w `workers`
- **REZULTAT:** Sprzątaczki NIE POJAWIAJĄ SIĘ w filtrach!

---

### 2. **BRAKUJĄCE TABELE**

#### ❌ `profile_views` - NIE ISTNIEJE!

```sql
-- Dashboard używa:
SELECT COUNT(*) FROM profile_views WHERE cleaning_company_id = ?

-- Ale tabela profile_views NIE MA w FINAL_SCHEMA.sql!
-- Workers mają profile_views jako INTEGER COUNTER w tabeli workers!
```

#### ❌ `contact_attempts` - NIE ISTNIEJE!

```sql
-- Dashboard używa:
SELECT COUNT(*) FROM contact_attempts WHERE cleaning_company_id = ?

-- Ale contact_attempts nie istnieje w schemacie!
```

#### ❌ `cleaning_reviews` - PRAWDOPODOBNIE NIE ISTNIEJE!

```sql
-- Dashboard używa:
SELECT * FROM cleaning_reviews WHERE cleaning_company_id = ?

-- Główna tabela: reviews (dla workers)
-- Czy cleaning_reviews istnieje osobno?
```

---

### 3. **MESSAGES - RELACJE NIEPRAWIDŁOWE**

```typescript
// Błąd w kodzie:
.select(`
  sender:sender_id (
    id,
    full_name,
    avatar_url
  )
`)

// ERROR: "more than one relationship was found for 'profiles' and 'messages'"
```

**Problem:**

- `messages` ma `sender_id` i `recipient_id` → oba FK do profiles
- Supabase nie wie którą relację wybrać
- Trzeba użyć: `sender:profiles!sender_id(...)`

---

### 4. **POWIADOMIENIA - SYSTEM ISTNIEJE ALE NIE JEST UŻYWANY**

```sql
-- Tabela notifications ISTNIEJE w FINAL_SCHEMA:
CREATE TABLE notifications (
  id uuid,
  user_id uuid FK → profiles.id,
  type text,
  title text,
  message text,
  read boolean DEFAULT false,
  ...
)

-- Funkcje helper:
- get_unread_notifications_count(p_user_id)
- create_notification(...)
```

**Problem:**

- CleaningCompanyDashboard w ogóle NIE ŁADUJE notifications!
- Brak badge nieprzeczytanych powiadomień
- System istnieje ale jest martwy

---

## 🔧 CO TRZEBA NAPRAWIĆ

### OPCJA A: **MIGRACJA CLEANING → WORKERS** (zalecane)

Przenieść cleaning companies do tabeli `workers`:

```sql
-- 1. Dodać kolumny do workers:
ALTER TABLE workers ADD COLUMN company_name TEXT;
ALTER TABLE workers ADD COLUMN owner_name TEXT;
ALTER TABLE workers ADD COLUMN kvk_number TEXT;
ALTER TABLE workers ADD COLUMN accepting_new_clients BOOLEAN DEFAULT true;
ALTER TABLE workers ADD COLUMN portfolio_images TEXT[] DEFAULT '{}';
ALTER TABLE workers ADD COLUMN availability JSONB;

-- 2. Migracja danych:
INSERT INTO workers (
  profile_id,
  specialization,
  company_name,
  phone,
  email,
  bio,
  portfolio_images,
  availability,
  hourly_rate,
  hourly_rate_max,
  rating,
  rating_count
)
SELECT
  profile_id,
  'cleaning' AS specialization,
  company_name,
  phone,
  email,
  bio,
  portfolio_images,
  availability,
  hourly_rate_min,
  hourly_rate_max,
  average_rating,
  total_reviews
FROM cleaning_companies;

-- 3. Update profiles.role:
UPDATE profiles
SET role = 'worker'
WHERE id IN (SELECT profile_id FROM cleaning_companies);

-- 4. Drop old table:
DROP TABLE cleaning_companies;
DROP TABLE cleaning_reviews;
DROP TABLE contact_attempts;
DROP TABLE profile_views; -- jeśli istnieje
```

**PLUSY:**

- ✅ Unified system (wszyscy w workers)
- ✅ Filtry będą działać
- ✅ Używamy istniejącego `reviews` table
- ✅ Używamy `workers.profile_views` counter
- ✅ Jedna ścieżka kodu

**MINUSY:**

- ⚠️ Trzeba przebudować dashboard
- ⚠️ Trzeba przebudować services

---

### OPCJA B: **STWÓRZ BRAKUJĄCE TABELE** (szybkie, ale debt)

```sql
-- 1. Create profile_views:
CREATE TABLE profile_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cleaning_company_id UUID REFERENCES cleaning_companies(id),
  employer_id UUID REFERENCES employers(id),
  worker_id UUID REFERENCES workers(id),
  viewed_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT
);

-- 2. Create contact_attempts:
CREATE TABLE contact_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cleaning_company_id UUID REFERENCES cleaning_companies(id),
  employer_id UUID REFERENCES employers(id),
  contact_type TEXT CHECK (contact_type IN ('message', 'phone_call', 'email', 'profile_view')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create cleaning_reviews (lub zmienić na reviews):
CREATE TABLE cleaning_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cleaning_company_id UUID REFERENCES cleaning_companies(id),
  employer_id UUID REFERENCES employers(id),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  work_date DATE,
  work_duration_hours NUMERIC,
  work_type TEXT,
  response_text TEXT,
  response_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Add to worker search filters:
-- Modyfikacja CleaningCompanySearch.tsx:
// UNION cleaning_companies + workers
```

**PLUSY:**

- ✅ Szybkie
- ✅ Nie trzeba migrować danych
- ✅ Dashboard będzie działał

**MINUSY:**

- ❌ Technical debt (2 systemy równoległe)
- ❌ Duplikacja logiki (reviews, views, itp.)
- ❌ Filtry nadal nie będą pokazywać sprzątaczek z workers
- ❌ Trudne w utrzymaniu

---

### OPCJA C: **HYBRID - CLEANING W WORKERS + DEDYKOWANE POLA**

```sql
-- 1. workers.specialization zmień na ARRAY:
ALTER TABLE workers ALTER COLUMN specialization TYPE TEXT[];

-- 2. Dodaj flagę:
ALTER TABLE workers ADD COLUMN is_cleaning_company BOOLEAN DEFAULT false;

-- 3. Migracja:
UPDATE workers SET
  is_cleaning_company = true,
  specialization = ARRAY['cleaning_after_construction']
WHERE profile_id IN (SELECT profile_id FROM cleaning_companies);

-- 4. Filtry:
SELECT * FROM workers
WHERE
  'cleaning' = ANY(specialization) OR
  is_cleaning_company = true;
```

---

## 🎯 REKOMENDACJA

**WYBIERZ OPCJĘ A** (Migracja do workers)

**DLACZEGO:**

1. Jeden system = mniej bugów
2. Filtry zadziałają automatycznie
3. Wykorzystasz istniejące tabele (reviews, messages, notifications)
4. Long-term maintainability

**PLAN WDROŻENIA:**

1. ✅ Backup cleaning_companies data (export CSV)
2. ✅ Rozszerz workers table o brakujące kolumny
3. ✅ Migruj dane SQL script
4. ✅ Update CleaningCompanyDashboard → WorkerDashboard
5. ✅ Update services (usunąć cleaningCompanyService)
6. ✅ Test z vsvs user
7. ✅ Drop old tables

---

## 📝 PRZYKŁAD MIGRACJI DASHBOARD

### PRZED (cleaning_companies):

```typescript
const { data: company } = await supabase
  .from("cleaning_companies")
  .select("*")
  .eq("profile_id", user.id)
  .single();
```

### PO (workers):

```typescript
const { data: worker } = await supabase
  .from("workers")
  .select("*")
  .eq("profile_id", user.id)
  .single();

// Dla cleaning company:
if (worker.is_cleaning_company) {
  // Pokaż pola specyficzne dla sprzątaczek
}
```

---

## ⚠️ CRITICAL BUGS DO NAPRAWIENIA (niezależnie od opcji):

### 1. Messages relacje:

```typescript
// BYŁO (błąd):
.select(`sender:sender_id(...)`)

// POPRAWNIE:
.select(`sender:profiles!messages_sender_id_fkey(id, full_name)`)
```

### 2. Notifications - dodać do dashboard:

```typescript
const { data: notifications } = await supabase
  .from("notifications")
  .select("*")
  .eq("user_id", user.id)
  .eq("read", false)
  .order("created_at", { ascending: false })
  .limit(5);
```

### 3. Profile views - użyć countera:

```typescript
// Z cleaning_companies → workers:
workers.profile_views (INTEGER)

// Increment:
UPDATE workers
SET profile_views = profile_views + 1
WHERE id = ?;
```

---

## 📊 PODSUMOWANIE TABEL

| Tabela               | Status      | Używana przez | Problem                                        |
| -------------------- | ----------- | ------------- | ---------------------------------------------- |
| `cleaning_companies` | ✅ Istnieje | Dashboard     | Oddzielna od workers                           |
| `workers`            | ✅ Istnieje | Wyszukiwarka  | Nie ma cleaning companies                      |
| `profile_views`      | ❌ Brak     | Dashboard     | Trzeba stworzyć LUB użyć workers.profile_views |
| `contact_attempts`   | ❌ Brak     | Dashboard     | Trzeba stworzyć                                |
| `cleaning_reviews`   | ❓ Unknown  | Dashboard     | Użyć reviews?                                  |
| `messages`           | ✅ Istnieje | Dashboard     | Błąd w relacjach                               |
| `notifications`      | ✅ Istnieje | NIKT          | Nie jest używana!                              |

---

**NASTĘPNY KROK:** Zdecyduj którą opcję (A/B/C) implementować i wykonam migrację.
