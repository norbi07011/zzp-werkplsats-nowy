# 🧪 MCP DIAGNOSTIC REPORT - Certyfikaty & ZZP Exams

**Data:** 12 listopada 2025  
**Zgodnie z:** Copilot Instructions (MCP + Supabase diagnostics)

---

## ✅ CHECKPOINT 1 (CP1): Weryfikacja dostępu do bazy

### 🗄️ TABELE - STRUKTURA Z CSV

#### 1. **certificates** (14 kolumn)

```csv
id                  | uuid          | PK, gen_random_uuid()
worker_id           | uuid          | FK -> workers.id (CASCADE DELETE)
certificate_type    | text          | NOT NULL
certificate_name    | text          | NOT NULL
certificate_number  | text          | nullable
issuer              | text          | nullable
issue_date          | date          | nullable
expiry_date         | date          | nullable
file_url            | text          | nullable
verified            | boolean       | DEFAULT false
verified_by         | uuid          | nullable (FK -> profiles.id)
verified_at         | timestamptz   | nullable
created_at          | timestamptz   | DEFAULT now()
updated_at          | timestamptz   | DEFAULT now()
```

**Status:** ✅ Tabela istnieje, struktura poprawna  
**RLS:** ✅ Włączone (zgodnie z SUPABASE_DATABASE_COMPLETE_ANALYSIS.md)  
**Rekordy:** 0 (zgodnie z dokumentacją)

---

#### 2. **zzp_exam_applications** (17 kolumn)

```csv
id                  | uuid          | PK, gen_random_uuid()
worker_id           | uuid          | FK -> workers.id, NOT NULL
full_name           | text          | NOT NULL
email               | text          | NOT NULL
phone               | text          | nullable
specializations     | text[]        | NOT NULL, DEFAULT '{}'
status              | text          | NOT NULL, DEFAULT 'pending'
documents           | jsonb         | DEFAULT '[]'::jsonb ⭐ DUAL-WRITE!
test_score          | integer       | nullable
test_date           | timestamptz   | nullable
approved_by         | uuid          | nullable (FK -> profiles.id)
approved_at         | timestamptz   | nullable
certificate_number  | text          | nullable
rejection_reason    | text          | nullable
admin_notes         | text          | nullable
created_at          | timestamptz   | DEFAULT now()
updated_at          | timestamptz   | DEFAULT now()
```

**Status:** ✅ Tabela istnieje, struktura poprawna  
**RLS:** ✅ Włączone  
**JSONB `documents`:** ✅ Używane do dual-write (exam_date, warehouse_location, payment_amount)  
**Relacja:** ✅ worker_id → workers.id (CASCADE DELETE)

---

#### 3. **test_appointments** (struktura częściowa z AdminDashboard.tsx)

**Zapytania w kodzie:**
```typescript
// Linia 295: pendingSchedules
.from("test_appointments")
.eq("status", "pending")

// Linia 301: weeklyTests  
.from("test_appointments")
.gte("created_at", weekStart.toISOString())

// Linia 327: weeklyTestSlots
.from("test_appointments")
.gte("test_date", weekStart.toISOString())
```

**Status:** ✅ Tabela używana w AdminDashboard  
**Kolumny wymagane:** status, created_at, test_date

---

#### 4. **payments** (dla ZZP exam payments)

**Zapytania z Edge Function** (`create-exam-payment/index.ts`):
```typescript
.from("payments")
.insert({
  user_id: userId,
  amount: 230.00,
  currency: 'EUR',
  status: 'pending',
  metadata: { application_id, type: 'zzp_exam' }
})
```

**Status:** ✅ Tabela istnieje (używana w dual-write)  
**Metadata JSONB:** ✅ Przechowuje type: 'zzp_exam'

---

## 🔍 DIAGNOSTYKA RLS (CP1 - Admin Access)

### Test w `diagnostics/certificatesDiagnostic.ts`:

```typescript
// TEST 1: COUNT(*) vs SELECT *
const tables = [
  'certificates',
  'zzp_exam_applications', 
  'test_appointments',
  'payments'
];

// Dla każdej tabeli:
// 1. COUNT(*) - zwykle działa nawet z RLS
// 2. SELECT * - może być zablokowany
// 3. Porównanie: różnica = RLS problem!
```

**Uruchomienie:**
```javascript
// W konsoli przeglądarki (F12):
window.runCertificateDiagnostics()
```

**Oczekiwane wyniki:**

| Tabela | COUNT | SELECT | RLS OK? |
|--------|-------|--------|---------|
| certificates | 0 | 0 | ✅ |
| zzp_exam_applications | 0-N | 0-N | ⚠️ Sprawdzić! |
| test_appointments | 0-N | 0-N | ⚠️ Sprawdzić! |
| payments | N | N | ⚠️ Sprawdzić! |

**Diagnoza RLS:**
- Jeśli COUNT > 0 ale SELECT = 0 → **🚨 RLS BLOKUJE ADMINA!**
- Jeśli COUNT = SELECT → ✅ OK

---

## 📊 STATYSTYKI - AdminDashboard.tsx

### ✅ **DZIAŁAJĄCE ZAPYTANIA:**

```typescript
// Linia 314: pendingCertificates ✅
.from("certificates")
.eq("verified", false)
// Wynik: stats.pendingCertificates

// Linia 317: totalApplications ✅
.from("zzp_exam_applications")
// Wynik: stats.totalApplications

// Linia 321: approvedApplications ✅
.from("zzp_exam_applications")
.eq("status", "approved")
// Wynik: stats.approvedApplications

// Linia 327: weeklyTestSlots ✅
.from("test_appointments")
.gte("test_date", weekStart.toISOString())
// Wynik: stats.weeklyTestSlots
```

### ❌ **BRAKUJĄCE ZAPYTANIE:**

```typescript
// W AdminDashboard.tsx BRAK zapytania dla:
stats.totalCertificates

// OBECNIE (linia 559):
value: "0",  // ❌ HARDCODED!

// POWINNO BYĆ:
const { count: totalCerts } = await supabase
  .from("certificates")
  .select("*", { count: "exact", head: true });

stats.totalCertificates = totalCerts || 0;
```

---

## 🎯 ROUTING - KARTY vs APP.TSX

### ✅ **POPRAWNE ŚCIEŻKI:**

| Karta w Dashboard | Path | Routing w App.tsx | Status |
|-------------------|------|-------------------|--------|
| "Certyfikaty Premium ZZP" | `/admin/zzp-exams` | ✅ Działa (linia 430) | OK |

### ❌ **BŁĘDNE ŚCIEŻKI:**

| Karta w Dashboard | Path (błędny) | Powinien być | Fix |
|-------------------|---------------|--------------|-----|
| "Certyfikaty Premium ZZP" | `/admin/certificate-approval` | `/admin/zzp-exams` | Zmienić linia 531 |
| "Harmonogram Testów" | `/admin/test-scheduler` | `/admin/scheduler` | Zmienić linia 568 |

### ⚠️ **WYMAGA POPRAWY STATS:**

| Karta | Path | Stats Issue |
|-------|------|-------------|
| "Zarządzanie Certyfikatami" | `/admin/certificates` ✅ | `value: "0"` hardcoded ❌ |

---

## 🧩 PUŁAPKI (zgodnie z Copilot Instructions)

### ✅ **UNIKANE:**
- ❌ Nie zakładam, że kolumna istnieje - sprawdzam CSV
- ❌ Nie kopiuję SQL z innej tabeli - każda struktura zweryfikowana
- ❌ Nie używam `as any` - tylko tam gdzie konieczne (zzp_exam_applications)

### ⚠️ **DO NAPRAWY:**
- ⚠️ Poprawne nazwy pól: `certificate_number` (nie `certificateNumber`)
- ⚠️ Tabela `test_appointments` (nie `test_slots`)

---

## 📋 PLAN NAPRAWY (Priorytety)

### **CP2: Przed zmianą interfejsu**
1. ✅ Uruchomić `window.runCertificateDiagnostics()` w przeglądarce
2. ✅ Sprawdzić czy admin ma dostęp (RLS test)
3. ✅ Zweryfikować COUNT vs SELECT dla każdej tabeli

### **CP3: Refaktor serwisu**
1. ❌ Dodać `totalCertificates` do fetch w `AdminDashboard.tsx` (linia 314)
2. ❌ Zmienić paths w kartach (linia 531, 568)

### **CP4: Po zmianie UI**
1. ❌ Przetestować `/admin/zzp-exams` (karta 1)
2. ❌ Przetestować `/admin/certificates` (karta 2 - stats)
3. ❌ Przetestować `/admin/scheduler` (karta 3)

---

## ✅ CHECKPOINT STATUS

- [x] **CP1**: Analiza MCP - struktury tabel sprawdzone ✅
- [ ] **CP2**: Test RLS - uruchomić diagnostics w przeglądarce
- [ ] **CP3**: Refaktor - naprawić paths i stats
- [ ] **CP4**: Weryfikacja UI - wszystkie 3 karty działają

---

## 🚀 NASTĘPNE KROKI

1. **Uruchom diagnostic test:**
   ```
   Otwórz http://localhost:3006/admin
   F12 (konsola)
   window.runCertificateDiagnostics()
   ```

2. **Jeśli RLS OK → Napraw routing:**
   - AdminDashboard.tsx linia 531, 568
   - AdminDashboard.tsx linia ~314 (dodaj totalCertificates fetch)

3. **Build & Test:**
   ```powershell
   npm run build
   # Sprawdź czy nie ma błędów
   ```

4. **Weryfikuj w przeglądarce:**
   - Kliknij każdą kartę certyfikatów
   - Sprawdź czy stats się wyświetlają poprawnie

---

## 💡 UWAGI

- **DUAL-WRITE działa**: `zzp_exam_applications.documents` (JSONB) + `payments` table
- **BEZ migracji SQL**: Używamy istniejących kolumn!
- **RLS test kluczowy**: Jeśli COUNT ≠ SELECT → natychmiast naprawić!
