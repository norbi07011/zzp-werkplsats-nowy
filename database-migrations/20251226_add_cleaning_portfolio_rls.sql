-- Migration: Add RLS Policies for all portfolio tables
-- Date: 2024-12-26
-- Description: Dodaje Row Level Security policies dla tabel:
--              - accountant_portfolio
--              - employer_portfolio
--              - cleaning_company_portfolio
--              Umożliwia każdej roli zarządzanie własnym portfolio projektów

-- ============================================================================
-- ACCOUNTANT_PORTFOLIO - WŁĄCZ RLS
-- ============================================================================

ALTER TABLE IF EXISTS public.accountant_portfolio ENABLE ROW LEVEL SECURITY;

-- ADMIN POLICIES
DROP POLICY IF EXISTS "admin_full_access_accountant_portfolio" ON public.accountant_portfolio;
CREATE POLICY "admin_full_access_accountant_portfolio"
  ON public.accountant_portfolio FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ACCOUNTANT POLICIES (Own Portfolio)
DROP POLICY IF EXISTS "accountants_view_own_portfolio" ON public.accountant_portfolio;
CREATE POLICY "accountants_view_own_portfolio"
  ON public.accountant_portfolio FOR SELECT
  USING (
    accountant_id IN (
      SELECT id FROM public.accountants
      WHERE profile_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "accountants_create_own_portfolio" ON public.accountant_portfolio;
CREATE POLICY "accountants_create_own_portfolio"
  ON public.accountant_portfolio FOR INSERT
  WITH CHECK (
    accountant_id IN (
      SELECT id FROM public.accountants
      WHERE profile_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "accountants_update_own_portfolio" ON public.accountant_portfolio;
CREATE POLICY "accountants_update_own_portfolio"
  ON public.accountant_portfolio FOR UPDATE
  USING (
    accountant_id IN (
      SELECT id FROM public.accountants
      WHERE profile_id = auth.uid()
    )
  )
  WITH CHECK (
    accountant_id IN (
      SELECT id FROM public.accountants
      WHERE profile_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "accountants_delete_own_portfolio" ON public.accountant_portfolio;
CREATE POLICY "accountants_delete_own_portfolio"
  ON public.accountant_portfolio FOR DELETE
  USING (
    accountant_id IN (
      SELECT id FROM public.accountants
      WHERE profile_id = auth.uid()
    )
  );

-- PUBLIC POLICIES (View Public Projects)
DROP POLICY IF EXISTS "public_view_published_accountant_portfolio" ON public.accountant_portfolio;
CREATE POLICY "public_view_published_accountant_portfolio"
  ON public.accountant_portfolio FOR SELECT
  USING (
    is_public = true
  );

-- ============================================================================
-- EMPLOYER_PORTFOLIO - WŁĄCZ RLS
-- ============================================================================

ALTER TABLE IF EXISTS public.employer_portfolio ENABLE ROW LEVEL SECURITY;

-- ADMIN POLICIES
DROP POLICY IF EXISTS "admin_full_access_employer_portfolio" ON public.employer_portfolio;
CREATE POLICY "admin_full_access_employer_portfolio"
  ON public.employer_portfolio FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- EMPLOYER POLICIES (Own Portfolio)
DROP POLICY IF EXISTS "employers_view_own_portfolio" ON public.employer_portfolio;
CREATE POLICY "employers_view_own_portfolio"
  ON public.employer_portfolio FOR SELECT
  USING (
    employer_id IN (
      SELECT id FROM public.employers
      WHERE profile_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "employers_create_own_portfolio" ON public.employer_portfolio;
CREATE POLICY "employers_create_own_portfolio"
  ON public.employer_portfolio FOR INSERT
  WITH CHECK (
    employer_id IN (
      SELECT id FROM public.employers
      WHERE profile_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "employers_update_own_portfolio" ON public.employer_portfolio;
CREATE POLICY "employers_update_own_portfolio"
  ON public.employer_portfolio FOR UPDATE
  USING (
    employer_id IN (
      SELECT id FROM public.employers
      WHERE profile_id = auth.uid()
    )
  )
  WITH CHECK (
    employer_id IN (
      SELECT id FROM public.employers
      WHERE profile_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "employers_delete_own_portfolio" ON public.employer_portfolio;
CREATE POLICY "employers_delete_own_portfolio"
  ON public.employer_portfolio FOR DELETE
  USING (
    employer_id IN (
      SELECT id FROM public.employers
      WHERE profile_id = auth.uid()
    )
  );

-- PUBLIC POLICIES (View Public Projects)
DROP POLICY IF EXISTS "public_view_published_employer_portfolio" ON public.employer_portfolio;
CREATE POLICY "public_view_published_employer_portfolio"
  ON public.employer_portfolio FOR SELECT
  USING (
    is_public = true
  );

-- ============================================================================
-- CLEANING_COMPANY_PORTFOLIO - WŁĄCZ RLS
-- ============================================================================

ALTER TABLE public.cleaning_company_portfolio ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- ADMIN POLICIES (Full Access)
-- ============================================================================

DROP POLICY IF EXISTS "admin_full_access_cleaning_portfolio" ON public.cleaning_company_portfolio;
CREATE POLICY "admin_full_access_cleaning_portfolio"
  ON public.cleaning_company_portfolio FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ============================================================================
-- CLEANING COMPANY POLICIES (Own Portfolio)
-- ============================================================================

-- SELECT: Firma sprzątająca widzi swoje projekty
DROP POLICY IF EXISTS "cleaning_companies_view_own_portfolio" ON public.cleaning_company_portfolio;
CREATE POLICY "cleaning_companies_view_own_portfolio"
  ON public.cleaning_company_portfolio FOR SELECT
  USING (
    company_id IN (
      SELECT id FROM public.cleaning_companies
      WHERE profile_id = auth.uid()
    )
  );

-- INSERT: Firma sprzątająca może dodawać projekty
DROP POLICY IF EXISTS "cleaning_companies_create_own_portfolio" ON public.cleaning_company_portfolio;
CREATE POLICY "cleaning_companies_create_own_portfolio"
  ON public.cleaning_company_portfolio FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT id FROM public.cleaning_companies
      WHERE profile_id = auth.uid()
    )
  );

-- UPDATE: Firma sprzątająca może edytować swoje projekty
DROP POLICY IF EXISTS "cleaning_companies_update_own_portfolio" ON public.cleaning_company_portfolio;
CREATE POLICY "cleaning_companies_update_own_portfolio"
  ON public.cleaning_company_portfolio FOR UPDATE
  USING (
    company_id IN (
      SELECT id FROM public.cleaning_companies
      WHERE profile_id = auth.uid()
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT id FROM public.cleaning_companies
      WHERE profile_id = auth.uid()
    )
  );

-- DELETE: Firma sprzątająca może usuwać swoje projekty
DROP POLICY IF EXISTS "cleaning_companies_delete_own_portfolio" ON public.cleaning_company_portfolio;
CREATE POLICY "cleaning_companies_delete_own_portfolio"
  ON public.cleaning_company_portfolio FOR DELETE
  USING (
    company_id IN (
      SELECT id FROM public.cleaning_companies
      WHERE profile_id = auth.uid()
    )
  );

-- ============================================================================
-- PUBLIC POLICIES (View Public Projects)
-- ============================================================================

-- SELECT: Wszyscy authenticated użytkownicy widzą publiczne projekty
DROP POLICY IF EXISTS "public_view_published_cleaning_portfolio" ON public.cleaning_company_portfolio;
CREATE POLICY "public_view_published_cleaning_portfolio"
  ON public.cleaning_company_portfolio FOR SELECT
  USING (
    is_public = true
  );

-- ============================================================================
-- INDEKSY (dla optymalizacji zapytań z RLS)
-- ============================================================================

-- Accountant Portfolio Indeksy
CREATE INDEX IF NOT EXISTS idx_accountant_portfolio_accountant_id 
  ON public.accountant_portfolio(accountant_id);
CREATE INDEX IF NOT EXISTS idx_accountant_portfolio_is_public 
  ON public.accountant_portfolio(is_public) 
  WHERE is_public = true;

-- Employer Portfolio Indeksy
CREATE INDEX IF NOT EXISTS idx_employer_portfolio_employer_id 
  ON public.employer_portfolio(employer_id);
CREATE INDEX IF NOT EXISTS idx_employer_portfolio_is_public 
  ON public.employer_portfolio(is_public) 
  WHERE is_public = true;

-- Cleaning Company Portfolio Indeksy
CREATE INDEX IF NOT EXISTS idx_cleaning_portfolio_company_id 
  ON public.cleaning_company_portfolio(company_id);
CREATE INDEX IF NOT EXISTS idx_cleaning_portfolio_is_public 
  ON public.cleaning_company_portfolio(is_public) 
  WHERE is_public = true;

-- ============================================================================
-- WERYFIKACJA
-- ============================================================================

-- Sprawdź utworzone policies dla wszystkich tabel portfolio
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies 
WHERE tablename IN ('accountant_portfolio', 'employer_portfolio', 'cleaning_company_portfolio')
ORDER BY tablename, cmd, policyname;

-- Sprawdź czy RLS jest włączone dla wszystkich tabel
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename IN ('accountant_portfolio', 'employer_portfolio', 'cleaning_company_portfolio');
