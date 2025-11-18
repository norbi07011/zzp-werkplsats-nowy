-- =============================================================================
-- MIGRACJA: Optymalizacja RLS Policies
-- Data: 2025-11-17
-- Cel: Zamiana auth.uid() na (select auth.uid()) w policies dla lepszej wydajności
-- Problem: auth.uid() jest wykonywane dla KAŻDEGO wiersza (per-row evaluation)
-- Rozwiązanie: (select auth.uid()) jest wykonywane RAZ na całe zapytanie
-- =============================================================================

-- 1. EMPLOYER_REVIEWS POLICIES
-- =============================================================================

-- 1a. employer_reviews_insert
DROP POLICY IF EXISTS employer_reviews_insert ON public.employer_reviews;
CREATE POLICY employer_reviews_insert ON public.employer_reviews
  FOR INSERT
  WITH CHECK (
    -- Worker może dodać review
    EXISTS (
      SELECT 1 FROM public.workers 
      WHERE user_id = (select auth.uid()) AND id = worker_id
    )
    OR
    -- Cleaning company może dodać review
    EXISTS (
      SELECT 1 FROM public.cleaning_companies 
      WHERE user_id = (select auth.uid()) AND id = cleaning_company_id
    )
    OR
    -- Accountant może dodać review
    EXISTS (
      SELECT 1 FROM public.accountants 
      WHERE user_id = (select auth.uid()) AND id = accountant_id
    )
  );

-- =============================================================================
-- 2. ACCOUNTANT_REVIEWS POLICIES
-- =============================================================================

-- 2a. accountant_reviews_insert
DROP POLICY IF EXISTS accountant_reviews_insert ON public.accountant_reviews;
CREATE POLICY accountant_reviews_insert ON public.accountant_reviews
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workers 
      WHERE user_id = (select auth.uid()) AND id = worker_id
    )
  );

-- =============================================================================
-- 3. CLEANING_REVIEWS POLICIES
-- =============================================================================

-- 3a. cleaning_reviews_insert
DROP POLICY IF EXISTS cleaning_reviews_insert ON public.cleaning_reviews;
CREATE POLICY cleaning_reviews_insert ON public.cleaning_reviews
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.employers 
      WHERE user_id = (select auth.uid()) AND id = employer_id
    )
  );

-- 3b. reviews_insert_v2 (jeśli istnieje)
DROP POLICY IF EXISTS reviews_insert_v2 ON public.cleaning_reviews;
CREATE POLICY reviews_insert_v2 ON public.cleaning_reviews
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.employers 
      WHERE user_id = (select auth.uid()) AND id = employer_id
    )
  );

-- 3c. cleaning_reviews_update_v2
DROP POLICY IF EXISTS cleaning_reviews_update_v2 ON public.cleaning_reviews;
CREATE POLICY cleaning_reviews_update_v2 ON public.cleaning_reviews
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.employers 
      WHERE user_id = (select auth.uid()) AND id = employer_id
    )
  );

-- 3d. cleaning_reviews_delete_v2
DROP POLICY IF EXISTS cleaning_reviews_delete_v2 ON public.cleaning_reviews;
CREATE POLICY cleaning_reviews_delete_v2 ON public.cleaning_reviews
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.employers 
      WHERE user_id = (select auth.uid()) AND id = employer_id
    )
  );

-- =============================================================================
-- 4. REVIEWS TABLE (generic)
-- =============================================================================

-- 4a. reviews_insert
DROP POLICY IF EXISTS reviews_insert ON public.reviews;
CREATE POLICY reviews_insert ON public.reviews
  FOR INSERT
  WITH CHECK (
    reviewer_id = (select auth.uid())
  );

-- =============================================================================
-- 5. WERYFIKACJA
-- =============================================================================

-- Sprawdź policies które używają auth.uid() (powinno być 0 w review tables)
SELECT 
  schemaname,
  tablename,
  policyname,
  CASE 
    WHEN definition LIKE '%auth.uid()%' AND definition NOT LIKE '%(select auth.uid())%' 
    THEN '⚠️ NEEDS FIX'
    ELSE '✅ OK'
  END as status,
  definition
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('employer_reviews', 'accountant_reviews', 'cleaning_reviews', 'reviews')
ORDER BY tablename, policyname;

-- Pokaż wszystkie policies dla review tables
SELECT 
  tablename,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename LIKE '%review%'
ORDER BY tablename, policyname;

-- =============================================================================
-- KONIEC MIGRACJI
-- Następny krok: Uruchom w Supabase SQL Editor
-- Potem sprawdź: mcp_supabase_get_advisors "performance"
-- Liczba warnings powinna się zmniejszyć
-- =============================================================================
