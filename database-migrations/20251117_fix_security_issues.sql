-- =============================================================================
-- MIGRACJA: Naprawa problemów bezpieczeństwa
-- Data: 2025-11-17
-- Cel: Usunięcie SECURITY DEFINER z views i dodanie search_path do funkcji
-- =============================================================================

-- 1. NAPRAW SECURITY DEFINER NA VIEWS
-- Problem: Views z SECURITY DEFINER pomijają RLS i mogą ujawnić dane
-- Rozwiązanie: Przebuduj views BEZ security definer

-- 1a. Napraw task_templates view
DROP VIEW IF EXISTS public.task_templates CASCADE;
CREATE OR REPLACE VIEW public.task_templates AS
SELECT * FROM public.project_tasks WHERE is_template = true;

COMMENT ON VIEW public.task_templates IS 
'View showing task templates - removed SECURITY DEFINER for RLS compliance';

-- 1b. Napraw v_workers view
DROP VIEW IF EXISTS public.v_workers CASCADE;
CREATE OR REPLACE VIEW public.v_workers AS
SELECT 
  w.*,
  p.email,
  p.full_name,
  p.role
FROM public.workers w
JOIN public.profiles p ON w.user_id = p.id;

COMMENT ON VIEW public.v_workers IS 
'View joining workers with profile data - removed SECURITY DEFINER for RLS compliance';

-- =============================================================================
-- 2. DODAJ SEARCH_PATH DO FUNKCJI
-- Problem: Funkcje bez search_path są podatne na SQL injection
-- Rozwiązanie: SET search_path = '' dla każdej funkcji
-- =============================================================================

-- 2a. set_certificate_id
ALTER FUNCTION public.set_certificate_id(UUID, TEXT) SET search_path = '';

-- 2b. revoke_certificate
ALTER FUNCTION public.revoke_certificate(UUID, TEXT) SET search_path = '';

-- 2c. generate_certificate_id
ALTER FUNCTION public.generate_certificate_id() SET search_path = '';

-- 2d. update_payments_updated_at
ALTER FUNCTION public.update_payments_updated_at() SET search_path = '';

-- 2e. update_generated_certificates_updated_at
ALTER FUNCTION public.update_generated_certificates_updated_at() SET search_path = '';

-- 2f. increment_certificate_scan
ALTER FUNCTION public.increment_certificate_scan(TEXT) SET search_path = '';

-- =============================================================================
-- 3. WERYFIKACJA
-- =============================================================================

-- Sprawdź czy views nie mają już security definer
SELECT 
  schemaname,
  viewname,
  viewowner,
  definition
FROM pg_views
WHERE schemaname = 'public' 
  AND viewname IN ('task_templates', 'v_workers');

-- Sprawdź czy funkcje mają poprawny search_path
SELECT 
  n.nspname as schema_name,
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as arguments,
  CASE 
    WHEN pg_get_function_result(p.oid) LIKE '%search_path%' THEN 'OK'
    ELSE 'MISSING'
  END as search_path_status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname IN (
    'set_certificate_id',
    'revoke_certificate', 
    'generate_certificate_id',
    'update_payments_updated_at',
    'update_generated_certificates_updated_at',
    'increment_certificate_scan'
  );

-- =============================================================================
-- KONIEC MIGRACJI
-- Następny krok: Uruchom w Supabase SQL Editor
-- Potem sprawdź: mcp_supabase_get_advisors "security" → powinno być 0 ERRORS
-- =============================================================================
