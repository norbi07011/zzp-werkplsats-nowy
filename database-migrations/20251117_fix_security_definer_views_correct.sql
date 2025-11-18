-- Migration: Fix SECURITY DEFINER views (CORRECT APPROACH)
-- Created: 2025-01-17
-- Issue: Views v_workers and task_templates use SECURITY DEFINER (security risk)
-- Fix: ALTER VIEW with security_invoker = true (Postgres 15+)
-- Reference: https://supabase.com/docs/guides/database/database-linter?lint=0010_security_definer_view

-- ==================================================================
-- SECURITY FIX: Remove SECURITY DEFINER from views
-- ==================================================================
-- SECURITY DEFINER views bypass RLS and run with creator's permissions
-- This is a security risk when views are in public schema (exposed via API)
-- Solution: Use security_invoker = true to respect RLS of querying user

-- Fix view: task_templates
-- This view filters project_tasks where is_template = true
ALTER VIEW public.task_templates
SET (security_invoker = true);

COMMENT ON VIEW public.task_templates IS 
  'View of project tasks that are templates. Uses security_invoker to respect RLS policies.';

-- Fix view: v_workers  
-- This view joins workers with profiles to expose worker data
ALTER VIEW public.v_workers
SET (security_invoker = true);

COMMENT ON VIEW public.v_workers IS 
  'View of workers with profile data. Uses security_invoker to respect RLS policies.';

-- ==================================================================
-- VERIFICATION QUERIES (run manually to check)
-- ==================================================================
-- Check view options (should show security_invoker = true):
-- SELECT relname, reloptions 
-- FROM pg_class 
-- WHERE relname IN ('task_templates', 'v_workers') AND relkind = 'v';

-- Check security advisors after migration:
-- Should show 0 ERROR for security_definer_view
