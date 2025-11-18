-- =============================================================================
-- MIGRACJA: Dodanie indeksów do tabel review i payments
-- Data: 2025-11-17
-- Cel: Przyspieszenie zapytań poprzez dodanie indeksów do foreign keys
-- =============================================================================

-- 1. INDEKSY DLA EMPLOYER_REVIEWS
-- Problem: Brak indeksów na FK powoduje wolne zapytania JOIN

-- 1a. Indeks na reviewed_by_admin (kto zatwierdził ocenę)
CREATE INDEX IF NOT EXISTS idx_employer_reviews_reviewed_by_admin 
ON public.employer_reviews(reviewed_by_admin)
WHERE reviewed_by_admin IS NOT NULL;

-- 1b. Indeks na reviewee_id (kto otrzymał ocenę)
CREATE INDEX IF NOT EXISTS idx_employer_reviews_reviewee_id 
ON public.employer_reviews(reviewee_id)
WHERE reviewee_id IS NOT NULL;

-- 1c. Indeks composite dla filtrowania (employer + status)
CREATE INDEX IF NOT EXISTS idx_employer_reviews_employer_status 
ON public.employer_reviews(employer_id, status);

-- 1d. Indeks dla sortowania chronologicznego
CREATE INDEX IF NOT EXISTS idx_employer_reviews_created_desc 
ON public.employer_reviews(created_at DESC);

-- =============================================================================
-- 2. INDEKSY DLA PAYMENTS
-- Problem: 6 foreign keys bez indeksów
-- =============================================================================

-- 2a. profile_id (główny FK)
CREATE INDEX IF NOT EXISTS idx_payments_profile_id 
ON public.payments(profile_id)
WHERE profile_id IS NOT NULL;

-- 2b. refunded_by (admin który zwrócił płatność)
CREATE INDEX IF NOT EXISTS idx_payments_refunded_by 
ON public.payments(refunded_by)
WHERE refunded_by IS NOT NULL;

-- 2c. related_earning_id (powiązane zarobki)
CREATE INDEX IF NOT EXISTS idx_payments_related_earning 
ON public.payments(related_earning_id)
WHERE related_earning_id IS NOT NULL;

-- 2d. related_invoice_id (powiązana faktura)
CREATE INDEX IF NOT EXISTS idx_payments_related_invoice 
ON public.payments(related_invoice_id)
WHERE related_invoice_id IS NOT NULL;

-- 2e. related_job_id (powiązana praca)
CREATE INDEX IF NOT EXISTS idx_payments_related_job 
ON public.payments(related_job_id)
WHERE related_job_id IS NOT NULL;

-- 2f. related_subscription_id (powiązana subskrypcja)
CREATE INDEX IF NOT EXISTS idx_payments_related_subscription 
ON public.payments(related_subscription_id)
WHERE related_subscription_id IS NOT NULL;

-- 2g. Composite index dla admin queries (status + created_at)
CREATE INDEX IF NOT EXISTS idx_payments_status_created 
ON public.payments(status, created_at DESC);

-- =============================================================================
-- 3. INDEKSY DLA GENERATED_CERTIFICATES
-- =============================================================================

-- 3a. issued_by_admin_id
CREATE INDEX IF NOT EXISTS idx_generated_certificates_issued_by 
ON public.generated_certificates(issued_by_admin_id)
WHERE issued_by_admin_id IS NOT NULL;

-- =============================================================================
-- 4. WERYFIKACJA
-- =============================================================================

-- Sprawdź utworzone indeksy
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('employer_reviews', 'payments', 'generated_certificates')
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- Sprawdź rozmiar indeksów
SELECT 
  schemaname,
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND tablename IN ('employer_reviews', 'payments', 'generated_certificates')
ORDER BY pg_relation_size(indexrelid) DESC;

-- =============================================================================
-- KONIEC MIGRACJI
-- Następny krok: Uruchom w Supabase SQL Editor
-- Potem sprawdź: mcp_supabase_get_advisors "performance"
-- =============================================================================
