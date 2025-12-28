-- ⚡ QUICK FIX - RLS dla cleaning_company_portfolio
-- SKOPIUJ I WKLEJ DO SUPABASE SQL EDITOR

-- 1. Włącz RLS
ALTER TABLE public.cleaning_company_portfolio ENABLE ROW LEVEL SECURITY;

-- 2. Admin - pełny dostęp
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

-- 3. Cleaning Company - widzi swoje projekty
DROP POLICY IF EXISTS "cleaning_companies_view_own_portfolio" ON public.cleaning_company_portfolio;
CREATE POLICY "cleaning_companies_view_own_portfolio"
  ON public.cleaning_company_portfolio FOR SELECT
  USING (
    company_id IN (
      SELECT id FROM public.cleaning_companies
      WHERE profile_id = auth.uid()
    )
  );

-- 4. Cleaning Company - może dodawać projekty (INSERT)
DROP POLICY IF EXISTS "cleaning_companies_create_own_portfolio" ON public.cleaning_company_portfolio;
CREATE POLICY "cleaning_companies_create_own_portfolio"
  ON public.cleaning_company_portfolio FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT id FROM public.cleaning_companies
      WHERE profile_id = auth.uid()
    )
  );

-- 5. Cleaning Company - może edytować swoje projekty
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

-- 6. Cleaning Company - może usuwać swoje projekty
DROP POLICY IF EXISTS "cleaning_companies_delete_own_portfolio" ON public.cleaning_company_portfolio;
CREATE POLICY "cleaning_companies_delete_own_portfolio"
  ON public.cleaning_company_portfolio FOR DELETE
  USING (
    company_id IN (
      SELECT id FROM public.cleaning_companies
      WHERE profile_id = auth.uid()
    )
  );

-- 7. Public - wszyscy widzą publiczne projekty
DROP POLICY IF EXISTS "public_view_published_cleaning_portfolio" ON public.cleaning_company_portfolio;
CREATE POLICY "public_view_published_cleaning_portfolio"
  ON public.cleaning_company_portfolio FOR SELECT
  USING (
    is_public = true
  );

-- 8. Indeksy dla optymalizacji
CREATE INDEX IF NOT EXISTS idx_cleaning_portfolio_company_id 
  ON public.cleaning_company_portfolio(company_id);
CREATE INDEX IF NOT EXISTS idx_cleaning_portfolio_is_public 
  ON public.cleaning_company_portfolio(is_public) 
  WHERE is_public = true;

-- ✅ WERYFIKACJA
SELECT 'Policies created:' as status, count(*) as count
FROM pg_policies 
WHERE tablename = 'cleaning_company_portfolio';

SELECT 'RLS enabled:' as status, rowsecurity
FROM pg_tables
WHERE tablename = 'cleaning_company_portfolio';
