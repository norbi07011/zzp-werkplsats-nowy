# 🚨 INSTRUKCJA NAPRAWY RLS DLA PORTFOLIO

## Problem

Błąd: **403 Forbidden** - "new row violates row-level security policy for table cleaning_company_portfolio"

## Rozwiązanie

Brakują RLS policies dla tabel portfolio. Migracja `20251226_add_cleaning_portfolio_rls.sql` dodaje policies dla **wszystkich 3 tabel portfolio**:

- `accountant_portfolio`
- `employer_portfolio`
- `cleaning_company_portfolio`

## Krok 1: Wykonaj migrację SQL

### Opcja A: Przez Supabase Dashboard (ZALECANE)

1. Otwórz https://supabase.com/dashboard
2. Wybierz projekt: `zzp-werkplaats`
3. Kliknij **SQL Editor** w menu po lewej
4. Kliknij **New query**
5. Skopiuj CAŁĄ zawartość pliku:
   ```
   database-migrations/20251226_add_cleaning_portfolio_rls.sql
   ```
6. Wklej do SQL Editor
7. Kliknij **Run** (lub Ctrl+Enter)
8. Sprawdź output - powinno być:
   - `ALTER TABLE` (3x) ✅
   - `CREATE POLICY` (18x - 6 per table) ✅
   - `CREATE INDEX` (6x - 2 per table) ✅
   - Query z wynikami policies ✅

### Opcja B: Przez Supabase CLI

```powershell
cd "c:\AI PROJEKT\zzp-werkplaats (3)"
supabase db push --file database-migrations/20251226_add_cleaning_portfolio_rls.sql
```

## Krok 2: Weryfikacja

### Sprawdź czy RLS jest włączone:

```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename IN ('accountant_portfolio', 'employer_portfolio', 'cleaning_company_portfolio');
```

**Oczekiwany wynik:**
| tablename | rowsecurity |
|-----------|-------------|
| accountant_portfolio | true |
| employer_portfolio | true |
| cleaning_company_portfolio | true |

### Sprawdź utworzone policies:

```sql
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE tablename IN ('accountant_portfolio', 'employer_portfolio', 'cleaning_company_portfolio')
ORDER BY tablename, cmd;
```

**Oczekiwane policies (18 total):**

**Accountant Portfolio (6):**

- `admin_full_access_accountant_portfolio` - ALL
- `accountants_view_own_portfolio` - SELECT
- `accountants_create_own_portfolio` - INSERT
- `accountants_update_own_portfolio` - UPDATE
- `accountants_delete_own_portfolio` - DELETE
- `public_view_published_accountant_portfolio` - SELECT

**Employer Portfolio (6):**

- `admin_full_access_employer_portfolio` - ALL
- `employers_view_own_portfolio` - SELECT
- `employers_create_own_portfolio` - INSERT
- `employers_update_own_portfolio` - UPDATE
- `employers_delete_own_portfolio` - DELETE
- `public_view_published_employer_portfolio` - SELECT

**Cleaning Company Portfolio (6):**

- `admin_full_access_cleaning_portfolio` - ALL
- `cleaning_companies_view_own_portfolio` - SELECT
- `cleaning_companies_create_own_portfolio` - INSERT
- `cleaning_companies_update_own_portfolio` - UPDATE
- `cleaning_companies_delete_own_portfolio` - DELETE
- `public_view_published_cleaning_portfolio` - SELECT

## Krok 3: Test w aplikacji

### Test 1: Dodaj projekt (cleaning company)

1. Zaloguj się jako firma sprzątająca
2. Przejdź do dashboardu → Portfolio
3. Kliknij "Dodaj projekt"
4. Wypełnij formularz i zapisz
5. ✅ Powinno zapisać bez błędu 403

### Test 2: Edytuj projekt

1. Kliknij "Edytuj" na istniejącym projekcie
2. Zmień tytuł lub opis
3. Zapisz
4. ✅ Powinno zaktualizować bez błędu

### Test 3: Usuń projekt

1. Kliknij "Usuń" na projekcie
2. Potwierdź
3. ✅ Powinno usunąć bez błędu

### Test 4: Publiczny widok

1. Otwórz publiczny profil firmy: `/cleaning-company/:id`
2. Przejdź do zakładki Portfolio
3. ✅ Powinny być widoczne tylko projekty z `is_public = true`

## Diagnoza problemów

### Błąd nadal występuje po migracji?

```sql
-- Sprawdź czy policies są aktywne
SELECT * FROM pg_policies
WHERE tablename = 'cleaning_company_portfolio'
AND policyname = 'cleaning_companies_create_own_portfolio';
```

### Sprawdź auth.uid():

```sql
-- W SQL Editor jako zalogowany użytkownik:
SELECT auth.uid();
-- Powinno zwrócić UUID, nie NULL
```

### Sprawdź cleaning_companies.profile_id:

```sql
SELECT id, profile_id, company_name
FROM cleaning_companies
WHERE profile_id = auth.uid();
-- Powinno zwrócić wiersz dla zalogowanego użytkownika
```

### Sprawdź company_id w zapytaniu:

```sql
-- W Chrome DevTools Console:
console.log('company_id:', companyData.id);
console.log('user.id:', user.id);
```

## Co robi migracja?

1. **Włącza RLS** na 3 tabelach portfolio
2. **Dodaje policies dla adminów** - pełny dostęp do wszystkich projektów
3. **Dodaje policies dla właścicieli** - CRUD na własnych projektach
   - `accountants` → `accountant_portfolio`
   - `employers` → `employer_portfolio`
   - `cleaning_companies` → `cleaning_company_portfolio`
4. **Dodaje public policies** - wszyscy widzą publiczne projekty (`is_public = true`)
5. **Optymalizuje zapytania** - indeksy na foreign keys i is_public

## Rollback (gdyby coś poszło nie tak)

```sql
-- Usuń wszystkie policies
DROP POLICY IF EXISTS "admin_full_access_cleaning_portfolio" ON cleaning_company_portfolio;
DROP POLICY IF EXISTS "cleaning_companies_view_own_portfolio" ON cleaning_company_portfolio;
DROP POLICY IF EXISTS "cleaning_companies_create_own_portfolio" ON cleaning_company_portfolio;
DROP POLICY IF EXISTS "cleaning_companies_update_own_portfolio" ON cleaning_company_portfolio;
DROP POLICY IF EXISTS "cleaning_companies_delete_own_portfolio" ON cleaning_company_portfolio;
DROP POLICY IF EXISTS "public_view_published_cleaning_portfolio" ON cleaning_company_portfolio;

-- Wyłącz RLS (UWAGA: to sprawi że tabela będzie dostępna dla wszystkich!)
ALTER TABLE cleaning_company_portfolio DISABLE ROW LEVEL SECURITY;
```

## Status po naprawie

✅ **Naprawione:**

- CleaningCompanyDashboard - usuniętowy stary kod portfolio
- Build sukces (19.45s)
- RLS policies dodane (migration ready)

⏳ **Do zrobienia:**

- Uruchomić migrację SQL w Supabase
- Przetestować dodawanie/edycję/usuwanie projektów
- Sprawdzić widoczność publicznych projektów

🔜 **Po naprawie RLS:**

- System portfolio działa dla wszystkich 3 ról
- Można dodawać projekty z dashboardu
- Publiczne projekty widoczne na profilach
- Prywatne projekty widoczne tylko dla właściciela
