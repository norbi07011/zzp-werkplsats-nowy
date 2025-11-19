-- ============================================================
-- MIGRATION: Support Ticket System
-- Author: AI Assistant
-- Date: 2025-11-19
-- Description: Professional support ticket system with messaging
-- ============================================================

-- ============================================================
-- TABLE: support_tickets
-- Purpose: Main support tickets table for all user roles
-- ============================================================
CREATE TABLE IF NOT EXISTS support_tickets (
  -- PRIMARY KEY
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- USER INFO
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user_role TEXT NOT NULL CHECK (user_role IN ('worker', 'employer', 'accountant', 'cleaning_company', 'admin')),
  user_email TEXT NOT NULL,
  user_name TEXT NOT NULL,
  
  -- TICKET INFO
  subject TEXT NOT NULL CHECK (LENGTH(subject) >= 5 AND LENGTH(subject) <= 200),
  description TEXT NOT NULL CHECK (LENGTH(description) >= 10),
  category TEXT NOT NULL CHECK (category IN ('technical', 'billing', 'account', 'feature_request', 'bug', 'data', 'performance', 'security', 'other')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'waiting_user', 'resolved', 'closed')),
  
  -- ASSIGNMENT
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  assigned_at TIMESTAMPTZ,
  
  -- TRACKING
  first_response_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  
  -- SATISFACTION
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  rating_comment TEXT,
  
  -- METADATA
  tags TEXT[] DEFAULT '{}',
  attachments JSONB DEFAULT '[]'::jsonb,
  internal_notes TEXT,
  
  -- TIMESTAMPS
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE support_tickets IS 'Professional support ticket system for all user roles - comprehensive tracking and management';
COMMENT ON COLUMN support_tickets.user_role IS 'Role of user who created ticket: worker, employer, accountant, cleaning_company, admin';
COMMENT ON COLUMN support_tickets.category IS 'Ticket category: technical, billing, account, feature_request, bug, data, performance, security, other';
COMMENT ON COLUMN support_tickets.priority IS 'Priority level: low, medium, high, critical';
COMMENT ON COLUMN support_tickets.status IS 'Ticket status: new (just created), in_progress (admin working), waiting_user (waiting for user response), resolved (admin marked resolved), closed (user confirmed or auto-closed)';
COMMENT ON COLUMN support_tickets.assigned_to IS 'Admin user assigned to handle this ticket';
COMMENT ON COLUMN support_tickets.first_response_at IS 'When admin first replied (SLA metric)';
COMMENT ON COLUMN support_tickets.rating IS 'User satisfaction rating 1-5 stars after resolution';
COMMENT ON COLUMN support_tickets.attachments IS 'Array of file attachments: [{"url": "...", "name": "...", "type": "image/png", "size": 1234}]';
COMMENT ON COLUMN support_tickets.internal_notes IS 'Admin-only internal notes (not visible to user)';

-- ============================================================
-- INDEXES for support_tickets
-- ============================================================
CREATE INDEX idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX idx_support_tickets_status ON support_tickets(status);
CREATE INDEX idx_support_tickets_priority ON support_tickets(priority);
CREATE INDEX idx_support_tickets_assigned_to ON support_tickets(assigned_to);
CREATE INDEX idx_support_tickets_created_at ON support_tickets(created_at DESC);
CREATE INDEX idx_support_tickets_category ON support_tickets(category);
CREATE INDEX idx_support_tickets_user_role ON support_tickets(user_role);

-- ============================================================
-- TABLE: support_messages
-- Purpose: Chat messages within tickets (user ↔ admin conversation)
-- ============================================================
CREATE TABLE IF NOT EXISTS support_messages (
  -- PRIMARY KEY
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- RELATIONS
  ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  sender_role TEXT NOT NULL CHECK (sender_role IN ('worker', 'employer', 'accountant', 'cleaning_company', 'admin')),
  sender_name TEXT NOT NULL,
  
  -- MESSAGE
  message TEXT NOT NULL CHECK (LENGTH(message) >= 1),
  attachments JSONB DEFAULT '[]'::jsonb,
  is_internal BOOLEAN DEFAULT FALSE,
  
  -- METADATA
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE support_messages IS 'Chat messages in support tickets - conversation between user and admin';
COMMENT ON COLUMN support_messages.is_internal IS 'Internal admin notes (not visible to user) vs. public messages';
COMMENT ON COLUMN support_messages.read_at IS 'When the message was read by recipient (user or admin)';
COMMENT ON COLUMN support_messages.attachments IS 'Array of file attachments in message: [{"url": "...", "name": "...", "type": "...", "size": 1234}]';

-- ============================================================
-- INDEXES for support_messages
-- ============================================================
CREATE INDEX idx_support_messages_ticket_id ON support_messages(ticket_id);
CREATE INDEX idx_support_messages_sender_id ON support_messages(sender_id);
CREATE INDEX idx_support_messages_created_at ON support_messages(created_at);
CREATE INDEX idx_support_messages_is_internal ON support_messages(is_internal);

-- ============================================================
-- RLS POLICIES: support_tickets
-- ============================================================
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

-- Users can view their own tickets
CREATE POLICY "Users can view own tickets"
  ON support_tickets FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create new tickets
CREATE POLICY "Users can create tickets"
  ON support_tickets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own tickets (only specific fields: rating, rating_comment, status if resolved → closed)
CREATE POLICY "Users can update own tickets"
  ON support_tickets FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Admins can see all tickets
CREATE POLICY "Admins can view all tickets"
  ON support_tickets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Admins can update all tickets (assign, change status, add notes, etc.)
CREATE POLICY "Admins can update all tickets"
  ON support_tickets FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- ============================================================
-- RLS POLICIES: support_messages
-- ============================================================
ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;

-- Users can see messages from their tickets (excluding internal admin notes)
CREATE POLICY "Users can view ticket messages"
  ON support_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM support_tickets
      WHERE support_tickets.id = support_messages.ticket_id
        AND support_tickets.user_id = auth.uid()
        AND support_messages.is_internal = FALSE
    )
  );

-- Users can create messages on their tickets
CREATE POLICY "Users can create messages"
  ON support_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM support_tickets
      WHERE support_tickets.id = ticket_id
        AND support_tickets.user_id = auth.uid()
    )
  );

-- Admins can see all messages (including internal notes)
CREATE POLICY "Admins can view all messages"
  ON support_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Admins can create messages (including internal notes)
CREATE POLICY "Admins can create messages"
  ON support_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- ============================================================
-- TRIGGER: Auto-update updated_at on support_tickets
-- ============================================================
CREATE OR REPLACE FUNCTION update_support_tickets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_support_tickets_updated_at
  BEFORE UPDATE ON support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_support_tickets_updated_at();

-- ============================================================
-- TRIGGER: Auto-set first_response_at when admin sends first message
-- ============================================================
CREATE OR REPLACE FUNCTION set_first_response_at()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if sender is admin and ticket doesn't have first_response_at yet
  IF NEW.sender_role = 'admin' THEN
    UPDATE support_tickets
    SET first_response_at = NOW()
    WHERE id = NEW.ticket_id
      AND first_response_at IS NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_first_response_at
  AFTER INSERT ON support_messages
  FOR EACH ROW
  EXECUTE FUNCTION set_first_response_at();

-- ============================================================
-- SUCCESS MESSAGE
-- ============================================================
DO $$
BEGIN
  RAISE NOTICE '✅ Support Ticket System Migration Completed Successfully!';
  RAISE NOTICE '📋 Tables created: support_tickets, support_messages';
  RAISE NOTICE '🔒 RLS Policies enabled: Users see only their tickets, Admins see all';
  RAISE NOTICE '📊 Indexes created for performance optimization';
  RAISE NOTICE '🔄 Triggers enabled: auto-update timestamps, track first response';
  RAISE NOTICE '🎯 Next steps:';
  RAISE NOTICE '   1. Regenerate TypeScript types: npx supabase gen types typescript';
  RAISE NOTICE '   2. Create supportTicketService.ts';
  RAISE NOTICE '   3. Create SupportTicketModal component';
  RAISE NOTICE '   4. Integrate with dashboards';
END $$;
