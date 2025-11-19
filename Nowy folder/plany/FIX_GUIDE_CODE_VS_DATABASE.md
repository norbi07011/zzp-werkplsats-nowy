# 🔴 PODSUMOWANIE: DLACZEGO KOD SIĘ NIE ZGRYWA Z BAZĄ DANYCH

## ❌ GŁÓWNY PROBLEM: RLS POLICY BLOKUJE JOIN

### SYMPTOM:

```
Panel Admina → Workers Manager → "Unknown User" zamiast imion pracowników
```

### PRZYCZYNA:

```typescript
// src/services/workers.ts (linia 24-31)
const { data, error } = await supabase.from("workers").select(`
    *,
    profile:profiles!workers_profile_id_fkey (
      id,
      full_name,  // ❌ ZWRACA NULL
      email,
      avatar_url,
      role
    )
  `);
```

**Dlaczego `full_name` jest NULL?**

1. ✅ Foreign Key `workers_profile_id_fkey` ISTNIEJE i jest POPRAWNY
2. ✅ Dane w `profiles` istnieją (6 wierszy, w tym workers)
3. ❌ **RLS Policy na tabeli `profiles` BLOKUJE dostęp dla admin**

### WERYFIKACJA:

```sql
-- Sprawdź aktualny RLS na profiles:
SELECT * FROM pg_policies
WHERE tablename = 'profiles' AND schemaname = 'public';

-- Test dostępu jako admin:
SELECT w.*, p.full_name
FROM workers w
LEFT JOIN profiles p ON w.profile_id = p.id
WHERE p.role = 'admin';  -- ❌ Może zwrócić 0 wierszy przez RLS
```

---

## 🔧 NAPRAW TO TERAZ!

### ✅ KROK 1: WYKONAJ SQL FIX (już istnieje!)

**Metoda A - Supabase Studio (ZALECANA):**

```
1. Otwórz: https://supabase.com/dashboard/project/dtnotuyagygexmkyqtgb/sql
2. Wklej zawartość: sql/fix-admin-rls-workers-profiles-join.sql
3. Kliknij "RUN"
4. Sprawdź logi - powinno być "Admin policy created"
```

**Metoda B - PowerShell/Terminal:**

```powershell
cd 'c:\AI PROJEKT\zzp-werkplaats (3)'
supabase db execute --file sql/fix-admin-rls-workers-profiles-join.sql
```

**Metoda C - Włącz `mcp_supabase_execute_sql`:**

```
VS Code → MCP Configure Tools → Włącz "mcp_supabase_execute_sql"
Potem agent automatycznie wykona migrację
```

---

### ✅ KROK 2: WERYFIKUJ NAPRAWĘ

**Test 1 - Supabase Studio SQL:**

```sql
-- Zaloguj się jako admin profile i sprawdź:
SELECT
  w.id,
  w.specialization,
  p.full_name,
  p.email,
  p.role
FROM workers w
LEFT JOIN profiles p ON w.profile_id = p.id
WHERE p.role IN ('worker', 'admin')
LIMIT 5;

-- ✅ Powinno zwrócić: full_name != NULL
```

**Test 2 - Kod aplikacji:**

```typescript
// src/services/workers.ts
const result = await fetchWorkers();
console.log("First worker profile:", result[0]?.profile);

// ✅ Oczekiwane:
// { id: "...", full_name: "Jan Kowalski", email: "...", avatar_url: "...", role: "worker" }

// ❌ Przed fixem:
// null lub undefined
```

---

## 📋 DODATKOWE NIEZGODNOŚCI (NISKI PRIORYTET)

### 1. Avatar URL Logic

**Problem:** Kod używa `profiles.avatar_url`, ale powinien sprawdzać role-specific:

```typescript
// ❌ AKTUALNIE:
avatar_url = profile.avatar_url;

// ✅ POWINNO BYĆ:
avatar_url =
  role === "worker"
    ? workers.avatar_url
    : role === "employer"
    ? employers.logo_url
    : role === "cleaning_company"
    ? cleaning_companies.avatar_url
    : role === "accountant"
    ? accountants.avatar_url
    : profiles.avatar_url;
```

**Baza danych ma:**

```sql
workers.avatar_url          -- ✅ Worker-specific
employers.logo_url          -- ✅ Employer logo
cleaning_companies.avatar_url -- ✅ Company avatar
accountants.avatar_url      -- ✅ Accountant avatar
profiles.avatar_url         -- ⚠️ Generic fallback
```

---

### 2. Nieużywane kolumny w TypeScript types

**Nieistniejące w bazie:**

```typescript
// src/services/companies.ts
company_nip?: string;     // ❌ BRAK - używaj: kvk_number
company_regon?: string;   // ❌ BRAK - używaj: btw_number lub rsin_number
```

**Poprawka:**

```typescript
export interface Company {
  kvk_number?: string; // ✅ Holenderski KvK (Chamber of Commerce)
  btw_number?: string; // ✅ VAT number (BTW = Belasting Toegevoegde Waarde)
  rsin_number?: string; // ✅ RSIN (Rechtspersonen Samenwerkingsverbanden Informatie Nummer)
}
```

---

## 🎯 PRIORYTETY NAPRAWY

| #   | Problem                   | Wpływ        | Pilność        | Status        |
| --- | ------------------------- | ------------ | -------------- | ------------- |
| 1   | RLS blokuje JOIN profiles | 🔴 KRYTYCZNY | NATYCHMIASTOWA | ⏳ Fix gotowy |
| 2   | "Unknown User" fallback   | 🟠 WYSOKI    | PILNA          | ⏳ Fix gotowy |
| 3   | Avatar URL logic          | 🟡 ŚREDNI    | NORMALNA       | ⏸️ TODO       |
| 4   | company_nip vs kvk_number | 🟢 NISKI     | NISKA          | ⏸️ TODO       |

---

## 📊 SZCZEGÓŁOWA ANALIZA BAZY

### Struktura `workers` (2 wiersze):

```sql
id               uuid PRIMARY KEY
profile_id       uuid REFERENCES profiles(id)  -- ✅ FK EXISTS
specialization   text
verified         bool DEFAULT false
subscription_tier text DEFAULT 'basic'
avatar_url       text                          -- ✅ WORKER-SPECIFIC
location_city    text
hourly_rate      numeric DEFAULT 0
rating           numeric DEFAULT 0
bio              text
-- ... 80+ kolumn total
```

### Struktura `profiles` (6 wierszy):

```sql
id          uuid PRIMARY KEY
email       text UNIQUE NOT NULL
full_name   text                    -- ✅ TO POWINNO BYĆ DOSTĘPNE
role        text CHECK IN ('worker', 'employer', 'accountant', 'cleaning_company', 'admin')
avatar_url  text                    -- ⚠️ Generic fallback
created_at  timestamptz
updated_at  timestamptz
```

### Struktura `employers` (2 wiersze):

```sql
id            uuid PRIMARY KEY
profile_id    uuid REFERENCES profiles(id)
company_name  text                  -- ✅ UŻYWANA W KODZIE
kvk_number    text UNIQUE           -- ✅ HOLENDERSKI NIP
btw_number    text                  -- ✅ VAT NUMBER
rsin_number   text                  -- ✅ BUSINESS REGISTRY
logo_url      text                  -- ✅ EMPLOYER LOGO
contact_email text                  -- ✅ UŻYWANA W KODZIE
contact_phone text
-- ... więcej kolumn
```

---

## ✅ CHECKPOINT TESTU

Po wykonaniu fix-admin-rls-workers-profiles-join.sql:

```bash
# Test 1: Panel Admin - Workers Manager
✅ Imiona pracowników widoczne (nie "Unknown User")
✅ Email widoczny
✅ Avatar_url załadowany
✅ Rola widoczna

# Test 2: Console logs
✅ console.log pokazuje pełny obiekt profile
✅ Brak błędów RLS w Network tab
✅ Brak NULL w profile.full_name

# Test 3: Supabase Dashboard
✅ RLS policies pokazują "admin_full_access_workers"
✅ RLS policies pokazują "admin_full_access_profiles"
```

---

## 📝 PLIKI DO NAPRAWY

### ✅ GOTOWE (nie wymagają zmian):

- ✅ `src/services/workers.ts` - używa poprawnego FK
- ✅ `src/services/companies.ts` - używa `employers` zamiast `companies`
- ✅ `sql/fix-admin-rls-workers-profiles-join.sql` - gotowy do wykonania

### ⏸️ TODO (niski priorytet):

- ⏸️ `src/services/profile.ts` - dodać role-based avatar logic
- ⏸️ `types.ts` - usunąć company_nip, company_regon
- ⏸️ Dodać testy integracyjne dla RLS policies

---

**Data raportu:** 2025-11-13  
**Baza:** dtnotuyagygexmkyqtgb.supabase.co (79 tabel, zweryfikowane)  
**Status:** 🔴 KRYTYCZNY - wymaga natychmiastowej naprawy RLS policy
