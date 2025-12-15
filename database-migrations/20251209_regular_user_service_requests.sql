-- ============================================================================
-- MIGRACJA: Regular User + Service Requests (Zlecenia od Użytkowników)
-- Data: 2025-12-09
-- Status: ⏳ DO WYKONANIA
-- Opis: Dodaje nową rolę regular_user i typ postu service_request
-- ============================================================================

-- ============================================================================
-- CZĘŚĆ 1: PROFILES - Dodaj regular_user do constraint
-- ============================================================================

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('worker', 'employer', 'admin', 'accountant', 'cleaning_company', 'regular_user'));

COMMENT ON CONSTRAINT profiles_role_check ON profiles IS 'Allowed roles: worker, employer, admin, accountant, cleaning_company, regular_user';

-- ============================================================================
-- CZĘŚĆ 2: POSTS - Dodaj regular_user do author_type
-- ============================================================================

ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_author_type_check;
ALTER TABLE posts 
ADD CONSTRAINT posts_author_type_check 
CHECK (author_type IN ('employer', 'accountant', 'admin', 'regular_user'));

COMMENT ON CONSTRAINT posts_author_type_check ON posts IS 'Only employer, accountant, admin, regular_user can create posts';

-- ============================================================================
-- CZĘŚĆ 3: POSTS - Dodaj service_request do type
-- ============================================================================

ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_type_check;
ALTER TABLE posts 
ADD CONSTRAINT posts_type_check 
CHECK (type IN ('job_offer', 'ad', 'announcement', 'service_request'));

COMMENT ON CONSTRAINT posts_type_check ON posts IS 'Post types: job_offer, ad, announcement, service_request';

-- ============================================================================
-- CZĘŚĆ 4: POSTS - Dodaj kolumny dla service_request
-- ============================================================================

ALTER TABLE posts
ADD COLUMN IF NOT EXISTS request_category VARCHAR(50),
ADD COLUMN IF NOT EXISTS request_location VARCHAR(255),
ADD COLUMN IF NOT EXISTS request_budget_min NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS request_budget_max NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS request_urgency VARCHAR(20) CHECK (request_urgency IN ('low', 'normal', 'high', 'urgent')) DEFAULT 'normal',
ADD COLUMN IF NOT EXISTS request_preferred_date DATE,
ADD COLUMN IF NOT EXISTS request_contact_method VARCHAR(20) CHECK (request_contact_method IN ('phone', 'email', 'both')) DEFAULT 'both',
ADD COLUMN IF NOT EXISTS request_status VARCHAR(20) CHECK (request_status IN ('open', 'in_progress', 'completed', 'cancelled')) DEFAULT 'open',
ADD COLUMN IF NOT EXISTS request_responses_count INTEGER DEFAULT 0 CHECK (request_responses_count >= 0),
ADD COLUMN IF NOT EXISTS request_selected_worker_id UUID REFERENCES workers(id);

-- Komentarze dla nowych kolumn
COMMENT ON COLUMN posts.request_category IS 'Kategoria zlecenia: plumbing, electrical, cleaning, moving, repair, gardening, painting, other';
COMMENT ON COLUMN posts.request_location IS 'Lokalizacja/adres gdzie ma być wykonane zlecenie';
COMMENT ON COLUMN posts.request_budget_min IS 'Minimalny budżet w EUR';
COMMENT ON COLUMN posts.request_budget_max IS 'Maksymalny budżet w EUR';
COMMENT ON COLUMN posts.request_urgency IS 'Pilność: low, normal, high, urgent';
COMMENT ON COLUMN posts.request_preferred_date IS 'Preferowana data wykonania zlecenia';
COMMENT ON COLUMN posts.request_contact_method IS 'Preferowana metoda kontaktu: phone, email, both';
COMMENT ON COLUMN posts.request_status IS 'Status zlecenia: open (otwarte), in_progress (w realizacji), completed (zakończone), cancelled (anulowane)';
COMMENT ON COLUMN posts.request_responses_count IS 'Liczba ofert od workerów (auto-updated by trigger)';
COMMENT ON COLUMN posts.request_selected_worker_id IS 'ID workera który został wybrany do realizacji zlecenia';

-- ============================================================================
-- CZĘŚĆ 5: TABELA regular_users
-- ============================================================================

CREATE TABLE IF NOT EXISTS regular_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Basic info
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(20),
  
  -- Location
  city VARCHAR(100),
  postal_code VARCHAR(20),
  address VARCHAR(255),
  
  -- Stats
  requests_posted INTEGER DEFAULT 0 CHECK (requests_posted >= 0),
  requests_completed INTEGER DEFAULT 0 CHECK (requests_completed >= 0),
  average_rating NUMERIC(3,2) DEFAULT 0 CHECK (average_rating >= 0 AND average_rating <= 5),
  
  -- Subscription (freemium)
  is_premium BOOLEAN DEFAULT FALSE,
  premium_until TIMESTAMPTZ,
  requests_this_month INTEGER DEFAULT 0 CHECK (requests_this_month >= 0), -- Reset monthly
  free_requests_limit INTEGER DEFAULT 3, -- 3 zlecenia/miesiąc za darmo
  
  -- Settings
  email_notifications BOOLEAN DEFAULT TRUE,
  sms_notifications BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indeksy
CREATE INDEX IF NOT EXISTS idx_regular_users_profile_id ON regular_users(profile_id);
CREATE INDEX IF NOT EXISTS idx_regular_users_premium ON regular_users(is_premium) WHERE is_premium = TRUE;

-- Komentarze
COMMENT ON TABLE regular_users IS 'Zwykli użytkownicy (nie ZZP) którzy mogą dodawać zlecenia';
COMMENT ON COLUMN regular_users.is_premium IS 'Premium subscription (€9.99/miesiąc) = unlimited requests + priority listing';
COMMENT ON COLUMN regular_users.requests_this_month IS 'Liczba zleceń dodanych w bieżącym miesiącu (reset 1-go dnia miesiąca)';
COMMENT ON COLUMN regular_users.free_requests_limit IS 'Limit darmowych zleceń na miesiąc (default 3)';

-- ============================================================================
-- CZĘŚĆ 6: TABELA service_request_responses (oferty od workerów)
-- ============================================================================

CREATE TABLE IF NOT EXISTS service_request_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  
  -- Worker's offer
  offered_price NUMERIC(10,2) CHECK (offered_price >= 0),
  estimated_hours NUMERIC(5,2) CHECK (estimated_hours > 0),
  message TEXT NOT NULL,
  availability_date DATE,
  
  -- Status
  status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn')) DEFAULT 'pending',
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Unique constraint: jeden worker = jedna oferta na zlecenie
  UNIQUE(post_id, worker_id)
);

-- Indeksy
CREATE INDEX IF NOT EXISTS idx_service_request_responses_post ON service_request_responses(post_id);
CREATE INDEX IF NOT EXISTS idx_service_request_responses_worker ON service_request_responses(worker_id);
CREATE INDEX IF NOT EXISTS idx_service_request_responses_status ON service_request_responses(status);

-- Komentarze
COMMENT ON TABLE service_request_responses IS 'Oferty od workerów na zlecenia od regular users';
COMMENT ON COLUMN service_request_responses.offered_price IS 'Cena oferowana przez workera w EUR';
COMMENT ON COLUMN service_request_responses.estimated_hours IS 'Szacowany czas pracy w godzinach';
COMMENT ON COLUMN service_request_responses.status IS 'pending (oczekuje), accepted (zaakceptowana), rejected (odrzucona), withdrawn (wycofana przez workera)';

-- ============================================================================
-- CZĘŚĆ 7: TRIGGER - Auto-update request_responses_count
-- ============================================================================

CREATE OR REPLACE FUNCTION update_request_responses_count()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    -- Zwiększ counter przy nowej ofercie
    UPDATE posts
    SET request_responses_count = request_responses_count + 1
    WHERE id = NEW.post_id;
    RETURN NEW;
    
  ELSIF (TG_OP = 'DELETE') THEN
    -- Zmniejsz counter przy usunięciu oferty
    UPDATE posts
    SET request_responses_count = GREATEST(0, request_responses_count - 1)
    WHERE id = OLD.post_id;
    RETURN OLD;
    
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_update_request_responses_count ON service_request_responses;
CREATE TRIGGER trigger_update_request_responses_count
  AFTER INSERT OR DELETE ON service_request_responses
  FOR EACH ROW
  EXECUTE FUNCTION update_request_responses_count();

-- ============================================================================
-- CZĘŚĆ 8: TRIGGER - Auto-update regular_users stats
-- ============================================================================

CREATE OR REPLACE FUNCTION update_regular_user_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    -- Zwiększ requests_posted i requests_this_month
    UPDATE regular_users
    SET 
      requests_posted = requests_posted + 1,
      requests_this_month = requests_this_month + 1
    WHERE profile_id = (
      SELECT author_id FROM posts WHERE id = NEW.id
    );
    RETURN NEW;
    
  ELSIF (TG_OP = 'UPDATE') THEN
    -- Jeśli zlecenie zostało completed, zwiększ requests_completed
    IF NEW.request_status = 'completed' AND OLD.request_status != 'completed' THEN
      UPDATE regular_users
      SET requests_completed = requests_completed + 1
      WHERE profile_id = (
        SELECT author_id FROM posts WHERE id = NEW.id
      );
    END IF;
    RETURN NEW;
    
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_update_regular_user_stats ON posts;
CREATE TRIGGER trigger_update_regular_user_stats
  AFTER INSERT OR UPDATE ON posts
  FOR EACH ROW
  WHEN (NEW.type = 'service_request')
  EXECUTE FUNCTION update_regular_user_stats();

-- ============================================================================
-- CZĘŚĆ 9: FUNCTION - Reset monthly requests counter (cron job)
-- ============================================================================

CREATE OR REPLACE FUNCTION reset_monthly_requests()
RETURNS VOID AS $$
BEGIN
  UPDATE regular_users
  SET requests_this_month = 0
  WHERE requests_this_month > 0;
  
  RAISE NOTICE 'Monthly requests counter reset for all regular users';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION reset_monthly_requests IS 'Reset requests_this_month to 0 (call on 1st day of month via cron)';

-- ============================================================================
-- CZĘŚĆ 10: RLS POLICIES - regular_users table
-- ============================================================================

ALTER TABLE regular_users ENABLE ROW LEVEL SECURITY;

-- Regular users can view own profile
DROP POLICY IF EXISTS "Regular users can view own profile" ON regular_users;
CREATE POLICY "Regular users can view own profile"
  ON regular_users FOR SELECT
  USING (auth.uid() = profile_id);

-- Regular users can update own profile
DROP POLICY IF EXISTS "Regular users can update own profile" ON regular_users;
CREATE POLICY "Regular users can update own profile"
  ON regular_users FOR UPDATE
  USING (auth.uid() = profile_id);

-- Admin can view all regular users
DROP POLICY IF EXISTS "Admin can view all regular users" ON regular_users;
CREATE POLICY "Admin can view all regular users"
  ON regular_users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- ============================================================================
-- CZĘŚĆ 11: RLS POLICIES - posts (service_request)
-- ============================================================================

-- Regular users can create service requests (with freemium limit check)
DROP POLICY IF EXISTS "Regular users can create service requests" ON posts;
CREATE POLICY "Regular users can create service requests"
  ON posts FOR INSERT
  WITH CHECK (
    author_type = 'regular_user' AND 
    type = 'service_request' AND
    EXISTS (
      SELECT 1 FROM regular_users 
      WHERE regular_users.profile_id = auth.uid()
      AND (
        is_premium = TRUE OR 
        requests_this_month < free_requests_limit
      )
    )
  );

-- Regular users can update own service requests
DROP POLICY IF EXISTS "Regular users can update own requests" ON posts;
CREATE POLICY "Regular users can update own requests"
  ON posts FOR UPDATE
  USING (
    type = 'service_request' AND
    author_type = 'regular_user' AND
    auth.uid() IN (
      SELECT profile_id FROM regular_users WHERE id = author_id
    )
  );

-- Everyone can view active service requests
DROP POLICY IF EXISTS "Public can view service requests" ON posts;
CREATE POLICY "Public can view service requests"
  ON posts FOR SELECT
  USING (
    type = 'service_request' AND
    is_active = TRUE AND
    deleted_at IS NULL
  );

-- ============================================================================
-- CZĘŚĆ 12: RLS POLICIES - service_request_responses
-- ============================================================================

ALTER TABLE service_request_responses ENABLE ROW LEVEL SECURITY;

-- Workers can create responses
DROP POLICY IF EXISTS "Workers can respond to service requests" ON service_request_responses;
CREATE POLICY "Workers can respond to service requests"
  ON service_request_responses FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workers 
      WHERE workers.profile_id = auth.uid()
      AND workers.id = worker_id
    )
  );

-- Workers can view own responses
DROP POLICY IF EXISTS "Workers can view own responses" ON service_request_responses;
CREATE POLICY "Workers can view own responses"
  ON service_request_responses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workers 
      WHERE workers.profile_id = auth.uid()
      AND workers.id = worker_id
    )
  );

-- Workers can update own responses (withdraw)
DROP POLICY IF EXISTS "Workers can update own responses" ON service_request_responses;
CREATE POLICY "Workers can update own responses"
  ON service_request_responses FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM workers 
      WHERE workers.profile_id = auth.uid()
      AND workers.id = worker_id
    )
  );

-- Regular users can view responses to own requests
DROP POLICY IF EXISTS "Regular users can view responses to own requests" ON service_request_responses;
CREATE POLICY "Regular users can view responses to own requests"
  ON service_request_responses FOR SELECT
  USING (
    post_id IN (
      SELECT p.id FROM posts p
      JOIN regular_users ru ON p.author_id = ru.id
      WHERE ru.profile_id = auth.uid()
      AND p.type = 'service_request'
    )
  );

-- Regular users can update responses to own requests (accept/reject)
DROP POLICY IF EXISTS "Regular users can update responses" ON service_request_responses;
CREATE POLICY "Regular users can update responses"
  ON service_request_responses FOR UPDATE
  USING (
    post_id IN (
      SELECT p.id FROM posts p
      JOIN regular_users ru ON p.author_id = ru.id
      WHERE ru.profile_id = auth.uid()
      AND p.type = 'service_request'
    )
  );

-- Admin can view all responses
DROP POLICY IF EXISTS "Admin can view all responses" ON service_request_responses;
CREATE POLICY "Admin can view all responses"
  ON service_request_responses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- ============================================================================
-- CZĘŚĆ 13: INDEKSY dla wydajności
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_posts_service_request ON posts(type) WHERE type = 'service_request';
CREATE INDEX IF NOT EXISTS idx_posts_request_status ON posts(request_status) WHERE type = 'service_request';
CREATE INDEX IF NOT EXISTS idx_posts_request_category ON posts(request_category) WHERE request_category IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_posts_request_urgency ON posts(request_urgency) WHERE request_urgency IN ('high', 'urgent');

-- ============================================================================
-- WERYFIKACJA
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'VERIFICATION CHECKLIST:';
  RAISE NOTICE '========================================';
  
  -- Check profiles constraint
  IF EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'profiles_role_check'
    AND check_clause LIKE '%regular_user%'
  ) THEN
    RAISE NOTICE '✅ profiles.role includes regular_user';
  ELSE
    RAISE EXCEPTION '❌ profiles.role does NOT include regular_user';
  END IF;
  
  -- Check posts author_type constraint
  IF EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'posts_author_type_check'
    AND check_clause LIKE '%regular_user%'
  ) THEN
    RAISE NOTICE '✅ posts.author_type includes regular_user';
  ELSE
    RAISE EXCEPTION '❌ posts.author_type does NOT include regular_user';
  END IF;
  
  -- Check posts type constraint
  IF EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'posts_type_check'
    AND check_clause LIKE '%service_request%'
  ) THEN
    RAISE NOTICE '✅ posts.type includes service_request';
  ELSE
    RAISE EXCEPTION '❌ posts.type does NOT include service_request';
  END IF;
  
  -- Check if regular_users table exists
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'regular_users'
  ) THEN
    RAISE NOTICE '✅ regular_users table created';
  ELSE
    RAISE EXCEPTION '❌ regular_users table does NOT exist';
  END IF;
  
  -- Check if service_request_responses table exists
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'service_request_responses'
  ) THEN
    RAISE NOTICE '✅ service_request_responses table created';
  ELSE
    RAISE EXCEPTION '❌ service_request_responses table does NOT exist';
  END IF;
  
  -- Check service_request columns
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'posts'
    AND column_name IN ('request_category', 'request_location', 'request_budget_min', 'request_status')
  ) THEN
    RAISE NOTICE '✅ posts table has service_request columns';
  ELSE
    RAISE EXCEPTION '❌ posts table is MISSING service_request columns';
  END IF;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ MIGRATION SUCCESSFUL!';
  RAISE NOTICE '========================================';
  
END $$;

-- ============================================================================
-- ROLLBACK (uncommment to revert changes)
-- ============================================================================

/*
-- Rollback: Usuń wszystko co dodaliśmy

DROP TRIGGER IF EXISTS trigger_update_request_responses_count ON service_request_responses;
DROP TRIGGER IF EXISTS trigger_update_regular_user_stats ON posts;
DROP FUNCTION IF EXISTS update_request_responses_count();
DROP FUNCTION IF EXISTS update_regular_user_stats();
DROP FUNCTION IF EXISTS reset_monthly_requests();

DROP TABLE IF EXISTS service_request_responses CASCADE;
DROP TABLE IF EXISTS regular_users CASCADE;

ALTER TABLE posts DROP COLUMN IF EXISTS request_category;
ALTER TABLE posts DROP COLUMN IF EXISTS request_location;
ALTER TABLE posts DROP COLUMN IF EXISTS request_budget_min;
ALTER TABLE posts DROP COLUMN IF EXISTS request_budget_max;
ALTER TABLE posts DROP COLUMN IF EXISTS request_urgency;
ALTER TABLE posts DROP COLUMN IF EXISTS request_preferred_date;
ALTER TABLE posts DROP COLUMN IF EXISTS request_contact_method;
ALTER TABLE posts DROP COLUMN IF EXISTS request_status;
ALTER TABLE posts DROP COLUMN IF EXISTS request_responses_count;
ALTER TABLE posts DROP COLUMN IF EXISTS request_selected_worker_id;

-- Przywróć stare constraints:
ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_author_type_check;
ALTER TABLE posts 
ADD CONSTRAINT posts_author_type_check 
CHECK (author_type IN ('employer', 'accountant', 'admin'));

ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_type_check;
ALTER TABLE posts 
ADD CONSTRAINT posts_type_check 
CHECK (type IN ('job_offer', 'ad', 'announcement'));

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('worker', 'employer', 'admin', 'accountant', 'cleaning_company'));
*/

-- ============================================================================
-- KONIEC MIGRACJI
-- ============================================================================
