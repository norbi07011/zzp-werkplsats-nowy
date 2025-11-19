# 🔴 RAPORT: KOD NIE ZGRYWA SIĘ Z BAZĄ DANYCH

## ❌ GŁÓWNE PROBLEMY

### 1️⃣ **NIEISTNIEJĄCA TABELA: `companies`**

**Lokalizacja:** Wiele plików w `/src/services/`

**Kod używa:**

```typescript
.from('companies')  // ❌ TA TABELA NIE ISTNIEJE
```

**Baza danych ma:**

```sql
employers (2 wiersze)  ✅ POPRAWNA NAZWA
```

**Naprawione w:**

- ✅ `src/services/companies.ts` (używa `employers`)
- ❌ Inne pliki mogą mieć referencje do `companies`

---

### 2️⃣ **NIEZGODNOŚĆ NAZW KOLUMN**

#### **Tabela `employers` - Kod vs Baza**

| Kod używa       | Baza ma                                | Status  |
| --------------- | -------------------------------------- | ------- |
| `company_name`  | `company_name`                         | ✅ OK   |
| `contact_email` | `contact_email`                        | ✅ OK   |
| `logo_url`      | `logo_url`                             | ✅ OK   |
| `company_nip`   | ❌ **BRAK** (powinno być `kvk_number`) | 🔴 BŁĄD |
| `company_regon` | ❌ **BRAK**                            | 🔴 BŁĄD |

**Faktyczne kolumny w `employers`:**

```sql
- kvk_number (text, unique)
- btw_number (text)
- rsin_number (text)
- google_place_id (text)
- phone (text)
- email (text)
```

---

### 3️⃣ **WORKERS + PROFILES JOIN PROBLEM**

**Kod w `src/services/workers.ts` (linia 24-31):**

```typescript
.from('workers')
.select(`
  *,
  profile:profiles!workers_profile_id_fkey (
    id,
    full_name,
    email,
    avatar_url,
    role
  )
`)
```

**Problem:**

- ✅ Nazwa FK `workers_profile_id_fkey` jest **POPRAWNA**
- ❌ **RLS policy blokuje SELECT na `profiles`** dla użytkownika admin

**Struktura faktyczna:**

```sql
workers.profile_id → profiles.id (FK)
profiles: 6 wierszy (full_name, email, avatar_url, role)
workers: 2 wierszy
```

**Dlaczego zwraca NULL:**

```
RLS Policy blokuje:
SELECT profiles.full_name FROM profiles WHERE role = 'worker'
WHEN current_user_role = 'admin'
```

---

### 4️⃣ **FALLBACK "Unknown User"**

**Lokalizacja:** `pages/Admin/WorkersManager.tsx` (linia 61)

```typescript
const nameParts = (w.profile?.full_name || "Unknown User").split(" ");
```

**Przyczyna:**

- `w.profile` jest `undefined` lub `null`
- JOIN nie zwraca danych z `profiles` przez RLS

---

### 5️⃣ **PROFILE AVATAR - ROLE-BASED vs PROFILE-BASED**

**Problem:** Kod używa `profiles.avatar_url`, ale baza ma:

```sql
workers.avatar_url (text)           ✅ Worker-specific
employers.logo_url (text)           ✅ Employer-specific
cleaning_companies.avatar_url (text) ✅ Company-specific
accountants.avatar_url (text)       ✅ Accountant-specific
profiles.avatar_url (text)          ⚠️ Generic fallback
```

**Poprawna logika:**

```typescript
const avatar =
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

---

## 🔧 PLAN NAPRAWY

### ✅ CHECKPOINT 1: Napraw RLS Policy

```sql
-- sql/fix-admin-rls-workers-profiles-join.sql
CREATE POLICY "admin_bypass_workers_read"
ON workers FOR SELECT
TO authenticated
USING (
  auth.jwt() ->> 'role' = 'admin'
  OR auth.uid() = profile_id
);

CREATE POLICY "admin_bypass_profiles_read"
ON profiles FOR SELECT
TO authenticated
USING (
  auth.jwt() ->> 'role' = 'admin'
  OR auth.uid() = id
);
```

### ✅ CHECKPOINT 2: Usuń referencje do `companies`

```bash
grep -r "from.*companies" src/
grep -r "\.companies" src/
```

### ✅ CHECKPOINT 3: Zmień `company_nip` → `kvk_number`

```typescript
// src/services/companies.ts
- company_nip?: string;
+ kvk_number?: string;
```

### ✅ CHECKPOINT 4: Popraw avatar_url logic

```typescript
// src/services/workers.ts
const avatar = worker.avatar_url || profile.avatar_url || defaultAvatar;
```

---

## 📊 STATYSTYKI NIEZGODNOŚCI

| Kategoria     | Kod ma                    | Baza ma         | Status       |
| ------------- | ------------------------- | --------------- | ------------ |
| Tabele        | `companies`               | `employers`     | 🔴 NIEZGODNE |
| Kolumny NIP   | `company_nip`             | `kvk_number`    | 🔴 NIEZGODNE |
| Kolumny REGON | `company_regon`           | ❌ BRAK         | 🔴 NIEZGODNE |
| Foreign Keys  | `workers_profile_id_fkey` | ✅ OK           | ✅ ZGODNE    |
| RLS Policies  | ❌ Brak admin bypass      | ❌ Blokuje JOIN | 🔴 NIEZGODNE |

---

## 🎯 PRIORYTET NAPRAWY

1. **KRYTYCZNE** - RLS Policy (blokuje cały panel admina)
2. **WYSOKIE** - Zmiana `companies` → `employers`
3. **ŚREDNIE** - Zmiana `company_nip` → `kvk_number`
4. **NISKIE** - Optymalizacja avatar_url logic

---

**Data:** 2025-11-13  
**Baza:** dtnotuyagygexmkyqtgb.supabase.co  
**Tabele:** 79 (zweryfikowane)
