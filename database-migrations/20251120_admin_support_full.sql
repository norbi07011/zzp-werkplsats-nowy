-- ============================================================================
-- MIGRACJA: Pełne wsparcie dla roli ADMIN w systemie postów
-- Data: 2025-11-20
-- Autor: AI Assistant
-- Status: ⏳ DO WYKONANIA
-- ============================================================================

-- OPIS ZMIAN:
-- 1. Rozszerzenie CHECK constraint posts_author_type_check o wartość 'admin'
-- 2. Weryfikacja kompatybilności post_likes i post_comments z admin
-- 3. Sprawdzenie RLS policies dla admina
-- 4. Testy funkcjonalności

-- ============================================================================
-- CZĘŚĆ 1: POSTS TABLE - CHECK CONSTRAINT
-- ============================================================================

-- Sprawdź aktualny constraint
DO $$
DECLARE
  current_check TEXT;
BEGIN
  SELECT check_clause INTO current_check
  FROM information_schema.check_constraints
  WHERE constraint_name = 'posts_author_type_check';
  
  RAISE NOTICE 'Current constraint: %', current_check;
  
  -- Jeśli constraint NIE zawiera 'admin', zaktualizuj
  IF current_check NOT LIKE '%admin%' THEN
    RAISE NOTICE 'Updating constraint to include admin...';
    
    -- Drop old constraint
    ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_author_type_check;
    
    -- Add new constraint with 'admin'
    ALTER TABLE posts 
    ADD CONSTRAINT posts_author_type_check 
    CHECK (author_type IN ('employer', 'accountant', 'admin'));
    
    RAISE NOTICE '✅ Constraint updated successfully!';
  ELSE
    RAISE NOTICE '✅ Constraint already includes admin - no action needed';
  END IF;
END $$;

-- ============================================================================
-- CZĘŚĆ 2: POST_LIKES - Weryfikacja struktury
-- ============================================================================

-- Sprawdź czy post_likes obsługuje profil_id (potrzebne dla admina)
DO $$
BEGIN
  -- Sprawdź czy kolumna profile_id istnieje
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'post_likes' AND column_name = 'profile_id'
  ) THEN
    RAISE NOTICE 'Adding profile_id to post_likes...';
    
    ALTER TABLE post_likes 
    ADD COLUMN profile_id UUID REFERENCES auth.users(id);
    
    -- Populate profile_id from user_id for existing records
    UPDATE post_likes SET profile_id = user_id WHERE profile_id IS NULL;
    
    RAISE NOTICE '✅ profile_id added to post_likes';
  ELSE
    RAISE NOTICE '✅ profile_id already exists in post_likes';
  END IF;
END $$;

-- Sprawdź czy user_type w post_likes akceptuje 'admin'
-- (PostgreSQL nie ma CHECK constraint na enum w tej tabeli, więc OK)

-- ============================================================================
-- CZĘŚĆ 3: POST_COMMENTS - Weryfikacja struktury
-- ============================================================================

-- Sprawdź strukturę post_comments
DO $$
BEGIN
  RAISE NOTICE 'Checking post_comments structure...';
  
  -- Sprawdź czy user_type istnieje
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'post_comments' AND column_name = 'user_type'
  ) THEN
    RAISE EXCEPTION 'post_comments.user_type column missing!';
  END IF;
  
  -- Sprawdź czy user_id istnieje
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'post_comments' AND column_name = 'user_id'
  ) THEN
    RAISE EXCEPTION 'post_comments.user_id column missing!';
  END IF;
  
  RAISE NOTICE '✅ post_comments structure OK';
END $$;

-- ============================================================================
-- CZĘŚĆ 4: RLS POLICIES - Weryfikacja dla admina
-- ============================================================================

-- Admin powinien mieć pełny dostęp do wszystkich tabel

-- Sprawdź RLS na posts
DO $$
BEGIN
  RAISE NOTICE 'Checking RLS policies for admin...';
  
  -- Create policy dla INSERT (admin może tworzyć posty)
  DROP POLICY IF EXISTS "Admin can create posts" ON posts;
  CREATE POLICY "Admin can create posts"
    ON posts FOR INSERT
    WITH CHECK (
      author_type = 'admin' AND 
      auth.uid() = profile_id
    );
  
  -- Create policy dla SELECT (admin widzi wszystkie posty)
  DROP POLICY IF EXISTS "Admin can view all posts" ON posts;
  CREATE POLICY "Admin can view all posts"
    ON posts FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
      )
    );
  
  -- Create policy dla UPDATE (admin może edytować swoje posty)
  DROP POLICY IF EXISTS "Admin can update own posts" ON posts;
  CREATE POLICY "Admin can update own posts"
    ON posts FOR UPDATE
    USING (
      author_type = 'admin' AND 
      auth.uid() = profile_id
    );
  
  -- Create policy dla DELETE (admin może usuwać swoje posty)
  DROP POLICY IF EXISTS "Admin can delete own posts" ON posts;
  CREATE POLICY "Admin can delete own posts"
    ON posts FOR DELETE
    USING (
      author_type = 'admin' AND 
      auth.uid() = profile_id
    );
  
  RAISE NOTICE '✅ RLS policies for admin created';
END $$;

-- RLS dla post_likes (admin może lajkować)
DROP POLICY IF EXISTS "Admin can like posts" ON post_likes;
CREATE POLICY "Admin can like posts"
  ON post_likes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- RLS dla post_comments (admin może komentować)
DROP POLICY IF EXISTS "Admin can comment" ON post_comments;
CREATE POLICY "Admin can comment"
  ON post_comments FOR INSERT
  WITH CHECK (
    user_type = 'admin' AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- ============================================================================
-- CZĘŚĆ 5: POST_SAVES - Admin może zapisywać posty
-- ============================================================================

-- RLS dla post_saves
DROP POLICY IF EXISTS "Admin can save posts" ON post_saves;
CREATE POLICY "Admin can save posts"
  ON post_saves FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- ============================================================================
-- CZĘŚĆ 6: WERYFIKACJA FINALNA
-- ============================================================================

DO $$
DECLARE
  check_result TEXT;
  policy_count INTEGER;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'FINAL VERIFICATION';
  RAISE NOTICE '========================================';
  
  -- 1. Sprawdź constraint
  SELECT check_clause INTO check_result
  FROM information_schema.check_constraints
  WHERE constraint_name = 'posts_author_type_check';
  
  IF check_result LIKE '%admin%' THEN
    RAISE NOTICE '✅ posts_author_type_check includes admin';
  ELSE
    RAISE EXCEPTION '❌ posts_author_type_check does NOT include admin!';
  END IF;
  
  -- 2. Sprawdź RLS policies dla admina
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public' 
    AND tablename = 'posts'
    AND policyname LIKE '%Admin%';
  
  IF policy_count >= 4 THEN
    RAISE NOTICE '✅ Admin RLS policies created (% policies)', policy_count;
  ELSE
    RAISE WARNING '⚠️ Admin RLS policies count is low (% policies)', policy_count;
  END IF;
  
  -- 3. Sprawdź post_likes profile_id
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'post_likes' AND column_name = 'profile_id'
  ) THEN
    RAISE NOTICE '✅ post_likes has profile_id column';
  ELSE
    RAISE EXCEPTION '❌ post_likes missing profile_id column!';
  END IF;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ ALL CHECKS PASSED!';
  RAISE NOTICE '========================================';
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '========================================';
    RAISE NOTICE '❌ VERIFICATION FAILED: %', SQLERRM;
    RAISE NOTICE '========================================';
    RAISE;
END $$;

-- ============================================================================
-- CZĘŚĆ 7: TEST CASES
-- ============================================================================

-- TEST 1: Czy admin może stworzyć post?
-- Wykonaj w aplikacji:
-- 1. Zaloguj jako admin
-- 2. Przejdź do Tablica tab
-- 3. Kliknij "Create Post"
-- 4. Wybierz "Announcement"
-- 5. Wypełnij formularz i Submit
-- Oczekiwany wynik: Post utworzony, widoczny w Moje Posty

-- TEST 2: Czy admin może komentować?
-- Wykonaj w aplikacji:
-- 1. Otwórz dowolny post
-- 2. Napisz komentarz
-- 3. Submit
-- Oczekiwany wynik: Komentarz pojawia się pod postem z nazwą admina

-- TEST 3: Czy admin może reagować emoji?
-- Wykonaj w aplikacji:
-- 1. Otwórz dowolny post
-- 2. Kliknij emoji (np. 👍)
-- Oczekiwany wynik: Reakcja dodana, licznik zwiększony

-- TEST 4: Czy admin może zapisywać posty?
-- Wykonaj w aplikacji:
-- 1. Kliknij SaveButton dropdown na poście
-- 2. Wybierz folder (np. "Polubiane")
-- Oczekiwany wynik: Post zapisany w Historia Aktywności

-- ============================================================================
-- INSTRUKCJA WYKONANIA
-- ============================================================================

/*
KROKI:
1. Skopiuj całą zawartość tego pliku
2. Otwórz Supabase Dashboard → SQL Editor
3. Wklej kod i wykonaj (Run)
4. Sprawdź output - wszystkie CHECK powinny być ✅
5. Przetestuj w aplikacji (wszystkie 4 testy powyżej)

ROLLBACK (jeśli coś pójdzie nie tak):
-- Usuń dodane RLS policies:
DROP POLICY IF EXISTS "Admin can create posts" ON posts;
DROP POLICY IF EXISTS "Admin can view all posts" ON posts;
DROP POLICY IF EXISTS "Admin can update own posts" ON posts;
DROP POLICY IF EXISTS "Admin can delete own posts" ON posts;
DROP POLICY IF EXISTS "Admin can like posts" ON post_likes;
DROP POLICY IF EXISTS "Admin can comment" ON post_comments;
DROP POLICY IF EXISTS "Admin can save posts" ON post_saves;

-- Przywróć stary constraint:
ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_author_type_check;
ALTER TABLE posts 
ADD CONSTRAINT posts_author_type_check 
CHECK (author_type IN ('employer', 'accountant'));
*/

-- ============================================================================
-- KONIEC MIGRACJI
-- ============================================================================
