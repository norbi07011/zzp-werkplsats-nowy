-- Migration: Add 'regular_user_subscription' to payments.payment_type constraint
-- Author: AI Assistant
-- Date: 2025-12-10
-- Purpose: Allow regular_user_subscription payments for premium subscriptions (€9.99/month)

-- Drop existing constraint
ALTER TABLE payments 
DROP CONSTRAINT IF EXISTS payments_payment_type_check;

-- Recreate constraint with regular_user_subscription added
ALTER TABLE payments
ADD CONSTRAINT payments_payment_type_check
CHECK (
  payment_type = ANY (ARRAY[
    'worker_subscription'::text,
    'employer_subscription'::text,
    'worker_earning'::text,
    'invoice_payment'::text,
    'refund'::text,
    'regular_user_subscription'::text  -- ← NEW: Premium subscriptions for regular users
  ])
);

-- Verify constraint
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(c.oid) AS constraint_definition
FROM pg_constraint c
JOIN pg_namespace n ON n.oid = c.connamespace
WHERE c.conrelid = 'payments'::regclass
  AND n.nspname = 'public'
  AND conname = 'payments_payment_type_check';
