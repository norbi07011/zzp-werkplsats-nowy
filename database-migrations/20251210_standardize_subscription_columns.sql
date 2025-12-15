-- ============================================================================
-- MIGRACJA: Standaryzacja nazw kolumn subskrypcji
-- Data: 2025-12-10
-- Status: ⏳ DO WYKONANIA
-- Opis: Ujednolica nazwy kolumn daty końca subskrypcji we wszystkich tabelach
--       do wspólnej nazwy: subscription_end_date
-- ============================================================================

-- PROBLEM:
-- - employers używa: subscription_expires_at
-- - workers używa: subscription_end_date ✅ (już dobra nazwa)
-- - regular_users używa: premium_until
-- 
-- ROZWIĄZANIE: Wszyscy używają subscription_end_date

BEGIN;

-- ============================================================================
-- CZĘŚĆ 1: EMPLOYERS - Zmień subscription_expires_at → subscription_end_date
-- ============================================================================

-- Sprawdź czy nowa kolumna już istnieje (dla bezpieczeństwa przy re-run)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'employers' 
        AND column_name = 'subscription_end_date'
    ) THEN
        -- Dodaj nową kolumnę
        ALTER TABLE employers 
        ADD COLUMN subscription_end_date TIMESTAMPTZ;
        
        -- Skopiuj dane ze starej kolumny
        UPDATE employers 
        SET subscription_end_date = subscription_expires_at
        WHERE subscription_expires_at IS NOT NULL;
        
        -- Usuń starą kolumnę
        ALTER TABLE employers 
        DROP COLUMN subscription_expires_at;
        
        RAISE NOTICE 'employers: subscription_expires_at → subscription_end_date ✅';
    ELSE
        RAISE NOTICE 'employers: subscription_end_date już istnieje, pomijam';
    END IF;
END $$;

-- Dodaj komentarz
COMMENT ON COLUMN employers.subscription_end_date IS 'When the current subscription expires (standardized column name)';

-- Zaktualizuj indeks
DROP INDEX IF EXISTS idx_employers_subscription;
CREATE INDEX idx_employers_subscription ON employers(subscription_status, subscription_end_date);

COMMENT ON INDEX idx_employers_subscription IS 'Index for subscription queries (using standardized column name)';

-- ============================================================================
-- CZĘŚĆ 2: REGULAR_USERS - Zmień premium_until → subscription_end_date
-- ============================================================================

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'regular_users' 
        AND column_name = 'premium_until'
    ) THEN
        -- Dodaj nową kolumnę (jeśli nie istnieje)
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'regular_users' 
            AND column_name = 'subscription_end_date'
        ) THEN
            ALTER TABLE regular_users 
            ADD COLUMN subscription_end_date TIMESTAMPTZ;
        END IF;
        
        -- Skopiuj dane ze starej kolumny
        UPDATE regular_users 
        SET subscription_end_date = premium_until
        WHERE premium_until IS NOT NULL;
        
        -- Usuń starą kolumnę
        ALTER TABLE regular_users 
        DROP COLUMN premium_until;
        
        RAISE NOTICE 'regular_users: premium_until → subscription_end_date ✅';
    ELSE
        RAISE NOTICE 'regular_users: premium_until już nie istnieje lub subscription_end_date już istnieje, pomijam';
    END IF;
END $$;

-- Dodaj komentarz
COMMENT ON COLUMN regular_users.subscription_end_date IS 'Premium subscription expiry date (standardized column name)';

-- Utwórz indeks dla częstych zapytań
CREATE INDEX IF NOT EXISTS idx_regular_users_subscription 
ON regular_users(is_premium, subscription_end_date)
WHERE is_premium = TRUE;

COMMENT ON INDEX idx_regular_users_subscription IS 'Index for premium users with active subscriptions';

-- ============================================================================
-- CZĘŚĆ 3: WORKERS - Potwierdzenie że używa już subscription_end_date
-- ============================================================================

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'workers' 
        AND column_name = 'subscription_end_date'
    ) THEN
        RAISE NOTICE 'workers: już używa subscription_end_date ✅';
    ELSE
        RAISE WARNING 'workers: BRAK kolumny subscription_end_date!';
    END IF;
END $$;

-- ============================================================================
-- CZĘŚĆ 4: FUNKCJE/TRIGGERY - Sprawdź czy wymagają aktualizacji
-- ============================================================================

-- Lista funkcji które mogą używać starych nazw kolumn
DO $$
DECLARE
    func_record RECORD;
BEGIN
    RAISE NOTICE '=== Funkcje do sprawdzenia ===';
    FOR func_record IN 
        SELECT routine_name, routine_definition
        FROM information_schema.routines
        WHERE routine_schema = 'public'
        AND routine_type = 'FUNCTION'
        AND (
            routine_definition LIKE '%subscription_expires_at%' 
            OR routine_definition LIKE '%premium_until%'
        )
    LOOP
        RAISE NOTICE 'Funkcja: % (zawiera starą nazwę kolumny)', func_record.routine_name;
    END LOOP;
END $$;

-- ============================================================================
-- CZĘŚĆ 5: VIEWS - Sprawdź czy wymagają aktualizacji
-- ============================================================================

DO $$
DECLARE
    view_record RECORD;
BEGIN
    RAISE NOTICE '=== Views do sprawdzenia ===';
    FOR view_record IN 
        SELECT table_name, view_definition
        FROM information_schema.views
        WHERE table_schema = 'public'
        AND (
            view_definition LIKE '%subscription_expires_at%' 
            OR view_definition LIKE '%premium_until%'
        )
    LOOP
        RAISE NOTICE 'View: % (zawiera starą nazwę kolumny)', view_record.table_name;
    END LOOP;
END $$;

-- ============================================================================
-- CZĘŚĆ 6: WERYFIKACJA
-- ============================================================================

DO $$
DECLARE
    employers_col TEXT;
    workers_col TEXT;
    regular_users_col TEXT;
BEGIN
    -- Sprawdź employers
    SELECT column_name INTO employers_col
    FROM information_schema.columns
    WHERE table_name = 'employers'
    AND column_name = 'subscription_end_date';
    
    -- Sprawdź workers
    SELECT column_name INTO workers_col
    FROM information_schema.columns
    WHERE table_name = 'workers'
    AND column_name = 'subscription_end_date';
    
    -- Sprawdź regular_users
    SELECT column_name INTO regular_users_col
    FROM information_schema.columns
    WHERE table_name = 'regular_users'
    AND column_name = 'subscription_end_date';
    
    RAISE NOTICE '';
    RAISE NOTICE '=== WERYFIKACJA MIGRACJI ===';
    RAISE NOTICE 'employers.subscription_end_date: %', COALESCE(employers_col, '❌ BRAK');
    RAISE NOTICE 'workers.subscription_end_date: %', COALESCE(workers_col, '❌ BRAK');
    RAISE NOTICE 'regular_users.subscription_end_date: %', COALESCE(regular_users_col, '❌ BRAK');
    
    IF employers_col IS NOT NULL AND workers_col IS NOT NULL AND regular_users_col IS NOT NULL THEN
        RAISE NOTICE '';
        RAISE NOTICE '✅ MIGRACJA ZAKOŃCZONA SUKCESEM - Wszystkie tabele używają subscription_end_date';
    ELSE
        RAISE WARNING '⚠️ MIGRACJA NIEKOMPLETNA - Sprawdź logi powyżej';
    END IF;
END $$;

COMMIT;

-- ============================================================================
-- PODSUMOWANIE
-- ============================================================================

-- Po tej migracji wszystkie tabele używają:
-- ✅ employers.subscription_end_date
-- ✅ workers.subscription_end_date  
-- ✅ regular_users.subscription_end_date
--
-- NASTĘPNE KROKI:
-- 1. Zaktualizuj TypeScript types (database.types.ts)
-- 2. Zaktualizuj wszystkie queries w kodzie:
--    - src/components/subscription/SubscriptionPanel.tsx
--    - src/hooks/useCompanies.ts
--    - src/pages/employer/EmployerDashboard.tsx
--    - supabase/functions/stripe-webhook/index.ts
-- 3. Przetestuj wszystkie dashboardy (employer, worker, regular_user)
-- 4. Sprawdź czy payment flow działa poprawnie
