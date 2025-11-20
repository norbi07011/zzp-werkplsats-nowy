-- =====================================================
-- JOBS TABLE MIGRATION
-- System ofert pracy dla pracodawców i workerów
-- =====================================================

-- 1. Tabela: jobs (oferty pracy)
CREATE TABLE IF NOT EXISTS public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.employers(id) ON DELETE CASCADE,
  
  -- Podstawowe informacje
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  requirements TEXT,
  responsibilities TEXT,
  benefits TEXT,
  
  -- Kategoryzacja
  category VARCHAR(100) NOT NULL,
  subcategory VARCHAR(100),
  industry VARCHAR(100),
  
  -- Typ pracy
  job_type VARCHAR(50) NOT NULL CHECK (job_type IN ('freelance', 'contract', 'project', 'part-time')),
  experience_level VARCHAR(50) NOT NULL CHECK (experience_level IN ('junior', 'medior', 'senior', 'expert')),
  
  -- Wynagrodzenie
  hourly_rate_min NUMERIC(10, 2),
  hourly_rate_max NUMERIC(10, 2),
  
  -- Lokalizacja
  work_location VARCHAR(50) NOT NULL CHECK (work_location IN ('remote', 'onsite', 'hybrid')),
  city VARCHAR(100),
  province VARCHAR(100),
  
  -- Umiejętności
  required_skills TEXT[] DEFAULT ARRAY[]::TEXT[],
  preferred_skills TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- Status i statystyki
  status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'filled', 'cancelled', 'expired')),
  applications_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  featured BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  
  -- Constraints
  CONSTRAINT valid_hourly_rate CHECK (hourly_rate_min IS NULL OR hourly_rate_max IS NULL OR hourly_rate_min <= hourly_rate_max)
);

-- 2. Tabela: job_applications (aplikacje workerów)
CREATE TABLE IF NOT EXISTS public.job_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  worker_id UUID NOT NULL REFERENCES public.workers(id) ON DELETE CASCADE,
  
  -- Dane aplikacji
  cover_letter TEXT,
  resume_url TEXT,
  
  -- Status
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'accepted', 'rejected', 'withdrawn')),
  
  -- Notatki pracodawcy
  employer_notes TEXT,
  
  -- Timestamps
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraint: worker może aplikować tylko raz do tej samej oferty
  UNIQUE(job_id, worker_id)
);

-- 3. Indeksy dla wydajności
CREATE INDEX IF NOT EXISTS idx_jobs_company_id ON public.jobs(company_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON public.jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_category ON public.jobs(category);
CREATE INDEX IF NOT EXISTS idx_jobs_job_type ON public.jobs(job_type);
CREATE INDEX IF NOT EXISTS idx_jobs_work_location ON public.jobs(work_location);
CREATE INDEX IF NOT EXISTS idx_jobs_city ON public.jobs(city);
CREATE INDEX IF NOT EXISTS idx_jobs_featured ON public.jobs(featured) WHERE featured = TRUE;
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON public.jobs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_job_applications_job_id ON public.job_applications(job_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_worker_id ON public.job_applications(worker_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_status ON public.job_applications(status);

-- 4. RLS Policies dla bezpieczeństwa

-- Enable RLS
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

-- Policy: Workers mogą czytać tylko ACTIVE jobs
CREATE POLICY "workers_read_active_jobs" ON public.jobs
  FOR SELECT
  TO authenticated
  USING (
    status = 'active' 
    OR company_id IN (
      SELECT id FROM public.employers WHERE profile_id = auth.uid()
    )
  );

-- Policy: Employers mogą zarządzać swoimi ofertami
CREATE POLICY "employers_manage_own_jobs" ON public.jobs
  FOR ALL
  TO authenticated
  USING (
    company_id IN (
      SELECT id FROM public.employers WHERE profile_id = auth.uid()
    )
  );

-- Policy: Workers mogą aplikować do ofert
CREATE POLICY "workers_create_applications" ON public.job_applications
  FOR INSERT
  TO authenticated
  WITH CHECK (
    worker_id IN (
      SELECT id FROM public.workers WHERE profile_id = auth.uid()
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.job_applications
      WHERE job_id = job_applications.job_id 
        AND worker_id = job_applications.worker_id
    )
  );

-- Policy: Workers widzą swoje aplikacje
CREATE POLICY "workers_read_own_applications" ON public.job_applications
  FOR SELECT
  TO authenticated
  USING (
    worker_id IN (
      SELECT id FROM public.workers WHERE profile_id = auth.uid()
    )
  );

-- Policy: Employers widzą aplikacje do swoich ofert
CREATE POLICY "employers_read_job_applications" ON public.job_applications
  FOR SELECT
  TO authenticated
  USING (
    job_id IN (
      SELECT id FROM public.jobs 
      WHERE company_id IN (
        SELECT id FROM public.employers WHERE profile_id = auth.uid()
      )
    )
  );

-- Policy: Employers mogą aktualizować status aplikacji
CREATE POLICY "employers_update_application_status" ON public.job_applications
  FOR UPDATE
  TO authenticated
  USING (
    job_id IN (
      SELECT id FROM public.jobs 
      WHERE company_id IN (
        SELECT id FROM public.employers WHERE profile_id = auth.uid()
      )
    )
  );

-- 5. Funkcja: Auto-update updated_at
CREATE OR REPLACE FUNCTION update_jobs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER jobs_updated_at_trigger
  BEFORE UPDATE ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_jobs_updated_at();

CREATE TRIGGER job_applications_updated_at_trigger
  BEFORE UPDATE ON public.job_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_jobs_updated_at();

-- 6. Funkcja: Auto-increment applications_count
CREATE OR REPLACE FUNCTION increment_job_applications_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.jobs 
    SET applications_count = applications_count + 1
    WHERE id = NEW.job_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.jobs 
    SET applications_count = GREATEST(applications_count - 1, 0)
    WHERE id = OLD.job_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER job_applications_count_trigger
  AFTER INSERT OR DELETE ON public.job_applications
  FOR EACH ROW
  EXECUTE FUNCTION increment_job_applications_count();

-- =====================================================
-- KONIEC MIGRACJI
-- =====================================================

-- Testowe sprawdzenie:
-- SELECT * FROM public.jobs LIMIT 5;
-- SELECT * FROM public.job_applications LIMIT 5;
