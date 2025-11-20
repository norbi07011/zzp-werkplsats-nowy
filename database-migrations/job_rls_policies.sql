-- ===================================================================
-- JOB SYSTEM RLS POLICIES
-- ===================================================================
-- Security policies for jobs and job_applications tables
-- Created: November 19, 2025
-- ===================================================================

-- ===================================================================
-- JOBS TABLE POLICIES
-- ===================================================================

-- DROP existing policies if any
DROP POLICY IF EXISTS "workers_read_active_jobs" ON jobs;
DROP POLICY IF EXISTS "employers_manage_own_jobs" ON jobs;
DROP POLICY IF EXISTS "public_read_active_jobs" ON jobs;

-- Enable RLS on jobs table
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- Policy 1: Public can read active jobs (for job board)
CREATE POLICY "public_read_active_jobs" 
ON jobs 
FOR SELECT 
TO authenticated
USING (status = 'active');

-- Policy 2: Employers can manage their own jobs (all operations)
CREATE POLICY "employers_manage_own_jobs" 
ON jobs 
FOR ALL 
TO authenticated
USING (
  company_id = auth.uid() OR 
  company_id IN (
    SELECT id FROM employers WHERE profile_id = auth.uid()
  )
)
WITH CHECK (
  company_id = auth.uid() OR 
  company_id IN (
    SELECT id FROM employers WHERE profile_id = auth.uid()
  )
);

-- Policy 3: Employers can see their own jobs regardless of status
CREATE POLICY "employers_read_own_jobs_any_status" 
ON jobs 
FOR SELECT 
TO authenticated
USING (
  company_id IN (
    SELECT id FROM employers WHERE profile_id = auth.uid()
  )
);

-- ===================================================================
-- JOB_APPLICATIONS TABLE POLICIES
-- ===================================================================

-- DROP existing policies if any
DROP POLICY IF EXISTS "workers_apply_once" ON job_applications;
DROP POLICY IF EXISTS "workers_read_own_applications" ON job_applications;
DROP POLICY IF EXISTS "employers_read_applications_to_their_jobs" ON job_applications;
DROP POLICY IF EXISTS "workers_insert_application" ON job_applications;

-- Enable RLS on job_applications table
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;

-- Policy 1: Workers can insert applications (with duplicate check)
CREATE POLICY "workers_insert_application" 
ON job_applications 
FOR INSERT 
TO authenticated
WITH CHECK (
  worker_id = auth.uid() AND
  NOT EXISTS (
    SELECT 1 FROM job_applications
    WHERE job_id = job_applications.job_id 
    AND worker_id = auth.uid()
  )
);

-- Policy 2: Workers can read their own applications
CREATE POLICY "workers_read_own_applications" 
ON job_applications 
FOR SELECT 
TO authenticated
USING (worker_id = auth.uid());

-- Policy 3: Employers can read applications to their jobs
CREATE POLICY "employers_read_applications_to_their_jobs" 
ON job_applications 
FOR SELECT 
TO authenticated
USING (
  job_id IN (
    SELECT id FROM jobs 
    WHERE company_id IN (
      SELECT id FROM employers WHERE profile_id = auth.uid()
    )
  )
);

-- Policy 4: Employers can update application status for their jobs
CREATE POLICY "employers_update_application_status" 
ON job_applications 
FOR UPDATE 
TO authenticated
USING (
  job_id IN (
    SELECT id FROM jobs 
    WHERE company_id IN (
      SELECT id FROM employers WHERE profile_id = auth.uid()
    )
  )
)
WITH CHECK (
  job_id IN (
    SELECT id FROM jobs 
    WHERE company_id IN (
      SELECT id FROM employers WHERE profile_id = auth.uid()
    )
  )
);

-- ===================================================================
-- ADMIN OVERRIDE POLICIES
-- ===================================================================

-- Admin can do everything on jobs
CREATE POLICY "admin_full_access_jobs" 
ON jobs 
FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);

-- Admin can do everything on job_applications
CREATE POLICY "admin_full_access_applications" 
ON job_applications 
FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);

-- ===================================================================
-- VERIFICATION QUERIES (TEST AFTER APPLYING)
-- ===================================================================

-- Test 1: Worker should see only active jobs
-- SELECT * FROM jobs WHERE status = 'active';

-- Test 2: Employer should see all their jobs (any status)
-- SELECT * FROM jobs WHERE company_id = (SELECT id FROM employers WHERE profile_id = auth.uid());

-- Test 3: Worker should not be able to apply twice to same job
-- INSERT INTO job_applications (job_id, worker_id) VALUES ('job_uuid', auth.uid());
-- (should fail on second attempt)

-- Test 4: Employer should see applications to their jobs
-- SELECT * FROM job_applications WHERE job_id IN (SELECT id FROM jobs WHERE company_id IN (SELECT id FROM employers WHERE profile_id = auth.uid()));

-- ===================================================================
-- NOTES
-- ===================================================================
-- 1. Make sure to apply this migration in Supabase Dashboard SQL Editor
-- 2. Test each policy with different user roles (worker, employer, admin)
-- 3. Check that public job board works (active jobs visible to all authenticated users)
-- 4. Verify that workers can't see draft/paused jobs from other employers
-- 5. Confirm that duplicate application prevention works
-- ===================================================================
