-- ============================================================================
-- MIGRACJA: System Zespołów Księgowych (Drużyna Księgowych)
-- Data: 2025-12-19
-- Autor: AI Assistant
-- Opis: Kompletny system zespołów dla księgowych - wzorowany na employer_teams
-- ============================================================================

-- ============================================================================
-- 1. TABELA: accountant_teams - Zespoły/Grupy księgowych
-- ============================================================================
CREATE TABLE IF NOT EXISTS accountant_teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Właściciel zespołu (księgowy który stworzył)
    owner_id UUID NOT NULL REFERENCES accountants(id) ON DELETE CASCADE,
    
    -- Podstawowe dane
    name VARCHAR(100) NOT NULL,
    description TEXT,
    
    -- Wygląd
    color_hex VARCHAR(7) DEFAULT '#6366F1', -- Indigo dla księgowych
    icon VARCHAR(50) DEFAULT 'users',
    avatar_url TEXT,
    
    -- Limity i status
    max_members INTEGER DEFAULT 20 CHECK (max_members BETWEEN 1 AND 100),
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Ustawienia zespołu
    settings JSONB DEFAULT '{
        "allow_member_invite": false,
        "require_approval": true,
        "shared_calendar": true,
        "shared_tasks": true,
        "shared_documents": true,
        "shared_clients": false
    }'::jsonb,
    
    -- Audyt
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indeksy
CREATE INDEX IF NOT EXISTS idx_accountant_teams_owner ON accountant_teams(owner_id);
CREATE INDEX IF NOT EXISTS idx_accountant_teams_active ON accountant_teams(is_active) WHERE is_active = TRUE;

-- Komentarz
COMMENT ON TABLE accountant_teams IS 'Zespoły/Grupy księgowych do współpracy';

-- ============================================================================
-- 2. TABELA: accountant_team_members - Członkowie zespołów
-- ============================================================================
CREATE TABLE IF NOT EXISTS accountant_team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Relacje
    team_id UUID NOT NULL REFERENCES accountant_teams(id) ON DELETE CASCADE,
    accountant_id UUID NOT NULL REFERENCES accountants(id) ON DELETE CASCADE,
    
    -- Rola w zespole
    role VARCHAR(50) DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
    
    -- Specjalizacja/opis w zespole
    specialization VARCHAR(100),
    notes TEXT,
    
    -- Status członkostwa
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'on_leave', 'suspended')),
    
    -- Daty
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    left_at TIMESTAMPTZ,
    
    -- Uprawnienia (nadpisują ustawienia zespołu)
    permissions JSONB DEFAULT '{
        "can_invite": false,
        "can_remove_members": false,
        "can_edit_tasks": true,
        "can_view_financials": true,
        "can_manage_clients": false
    }'::jsonb,
    
    -- Audyt
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Unikalność - jeden księgowy może być tylko raz w zespole
    CONSTRAINT unique_team_member UNIQUE (team_id, accountant_id)
);

-- Indeksy
CREATE INDEX IF NOT EXISTS idx_atm_team ON accountant_team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_atm_accountant ON accountant_team_members(accountant_id);
CREATE INDEX IF NOT EXISTS idx_atm_status ON accountant_team_members(status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_atm_role ON accountant_team_members(role);

-- Komentarz
COMMENT ON TABLE accountant_team_members IS 'Członkowie zespołów księgowych z rolami i uprawnieniami';

-- ============================================================================
-- 3. TABELA: accountant_team_invitations - Zaproszenia do zespołów
-- ============================================================================
CREATE TABLE IF NOT EXISTS accountant_team_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Zespół do którego zapraszamy
    team_id UUID NOT NULL REFERENCES accountant_teams(id) ON DELETE CASCADE,
    
    -- Kto zaprosił
    invited_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Zaproszony księgowy (opcjonalnie - może być tylko email)
    invited_accountant_id UUID REFERENCES accountants(id) ON DELETE SET NULL,
    
    -- Email zaproszenia (dla niezarejestrowanych)
    invited_email VARCHAR(255) NOT NULL,
    
    -- Token dla linku zaproszenia
    token VARCHAR(100) UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
    
    -- Wiadomość od zapraszającego
    message TEXT,
    
    -- Proponowana rola
    proposed_role VARCHAR(50) DEFAULT 'member' CHECK (proposed_role IN ('admin', 'member', 'viewer')),
    
    -- Status zaproszenia
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired', 'cancelled')),
    
    -- Daty
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
    responded_at TIMESTAMPTZ,
    
    -- Powód odrzucenia
    decline_reason TEXT,
    
    -- Audyt
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indeksy
CREATE INDEX IF NOT EXISTS idx_ati_team ON accountant_team_invitations(team_id);
CREATE INDEX IF NOT EXISTS idx_ati_email ON accountant_team_invitations(invited_email);
CREATE INDEX IF NOT EXISTS idx_ati_accountant ON accountant_team_invitations(invited_accountant_id) WHERE invited_accountant_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ati_status ON accountant_team_invitations(status);
CREATE INDEX IF NOT EXISTS idx_ati_token ON accountant_team_invitations(token);
CREATE INDEX IF NOT EXISTS idx_ati_expires ON accountant_team_invitations(expires_at) WHERE status = 'pending';

-- Komentarz
COMMENT ON TABLE accountant_team_invitations IS 'Zaproszenia do zespołów księgowych';

-- ============================================================================
-- 4. TABELA: accountant_team_tasks - Wspólne zadania zespołu
-- ============================================================================
CREATE TABLE IF NOT EXISTS accountant_team_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Zespół
    team_id UUID NOT NULL REFERENCES accountant_teams(id) ON DELETE CASCADE,
    
    -- Twórca zadania
    created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Przypisany do (opcjonalnie)
    assigned_to UUID REFERENCES accountants(id) ON DELETE SET NULL,
    
    -- Dane zadania
    title VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Status i priorytet
    status VARCHAR(30) DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'review', 'done', 'blocked', 'cancelled')),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('urgent', 'high', 'medium', 'low')),
    
    -- Kategoria zadania księgowego
    category VARCHAR(50) DEFAULT 'general' CHECK (category IN (
        'general', 'vat', 'income_tax', 'payroll', 'annual_report', 
        'audit', 'client_meeting', 'deadline', 'administration', 'other'
    )),
    
    -- Daty
    due_date DATE,
    start_date DATE,
    completed_at TIMESTAMPTZ,
    
    -- Powiązanie z klientem (opcjonalnie)
    client_id UUID, -- Może być worker_id, employer_id itp.
    client_type VARCHAR(50), -- 'worker', 'employer', 'cleaning_company', 'regular_user'
    client_name VARCHAR(255), -- Dla szybkiego dostępu
    
    -- Tagi i notatki
    tags TEXT[] DEFAULT '{}',
    notes TEXT,
    
    -- Szacowany czas (w minutach)
    estimated_time INTEGER,
    actual_time INTEGER,
    
    -- Załączniki (linki do storage)
    attachments JSONB DEFAULT '[]'::jsonb,
    
    -- Audyt
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indeksy
CREATE INDEX IF NOT EXISTS idx_att_team ON accountant_team_tasks(team_id);
CREATE INDEX IF NOT EXISTS idx_att_assigned ON accountant_team_tasks(assigned_to) WHERE assigned_to IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_att_status ON accountant_team_tasks(status);
CREATE INDEX IF NOT EXISTS idx_att_priority ON accountant_team_tasks(priority);
CREATE INDEX IF NOT EXISTS idx_att_due_date ON accountant_team_tasks(due_date) WHERE due_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_att_category ON accountant_team_tasks(category);
CREATE INDEX IF NOT EXISTS idx_att_client ON accountant_team_tasks(client_id, client_type) WHERE client_id IS NOT NULL;

-- Komentarz
COMMENT ON TABLE accountant_team_tasks IS 'Zadania zespołów księgowych - wspólny Kanban';

-- ============================================================================
-- 5. TABELA: accountant_team_messages - Czat zespołowy
-- ============================================================================
CREATE TABLE IF NOT EXISTS accountant_team_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Zespół
    team_id UUID NOT NULL REFERENCES accountant_teams(id) ON DELETE CASCADE,
    
    -- Autor wiadomości
    sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Treść
    content TEXT NOT NULL,
    
    -- Typ wiadomości
    message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'file', 'image', 'system', 'task_update')),
    
    -- Załączniki
    attachments JSONB DEFAULT '[]'::jsonb,
    
    -- Odpowiedź na (dla wątków)
    reply_to UUID REFERENCES accountant_team_messages(id) ON DELETE SET NULL,
    
    -- Reakcje
    reactions JSONB DEFAULT '{}'::jsonb,
    
    -- Edycja
    is_edited BOOLEAN DEFAULT FALSE,
    edited_at TIMESTAMPTZ,
    
    -- Usunięte (soft delete)
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMPTZ,
    
    -- Audyt
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indeksy
CREATE INDEX IF NOT EXISTS idx_atm_msg_team ON accountant_team_messages(team_id);
CREATE INDEX IF NOT EXISTS idx_atm_msg_sender ON accountant_team_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_atm_msg_created ON accountant_team_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_atm_msg_reply ON accountant_team_messages(reply_to) WHERE reply_to IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_atm_msg_active ON accountant_team_messages(team_id, created_at DESC) WHERE is_deleted = FALSE;

-- Komentarz
COMMENT ON TABLE accountant_team_messages IS 'Wiadomości czatu zespołowego księgowych';

-- ============================================================================
-- 6. TABELA: accountant_team_events - Kalendarz zespołowy
-- ============================================================================
CREATE TABLE IF NOT EXISTS accountant_team_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Zespół
    team_id UUID NOT NULL REFERENCES accountant_teams(id) ON DELETE CASCADE,
    
    -- Twórca
    created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Dane wydarzenia
    title VARCHAR(255) NOT NULL,
    description TEXT,
    location VARCHAR(255),
    
    -- Typ wydarzenia
    event_type VARCHAR(50) DEFAULT 'meeting' CHECK (event_type IN (
        'meeting', 'deadline', 'reminder', 'client_call', 
        'training', 'holiday', 'out_of_office', 'other'
    )),
    
    -- Czas
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    all_day BOOLEAN DEFAULT FALSE,
    
    -- Cykliczność
    is_recurring BOOLEAN DEFAULT FALSE,
    recurrence_rule TEXT, -- iCal RRULE format
    
    -- Uczestnicy (IDs księgowych)
    attendees UUID[] DEFAULT '{}',
    
    -- Powiązanie z klientem
    client_id UUID,
    client_type VARCHAR(50),
    client_name VARCHAR(255),
    
    -- Status
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'cancelled', 'completed')),
    
    -- Wygląd
    color VARCHAR(7) DEFAULT '#6366F1',
    
    -- Przypomnienia (minuty przed)
    reminders INTEGER[] DEFAULT '{60, 1440}', -- 1h i 1 dzień
    
    -- Audyt
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Walidacja
    CONSTRAINT valid_event_times CHECK (end_time > start_time)
);

-- Indeksy
CREATE INDEX IF NOT EXISTS idx_ate_team ON accountant_team_events(team_id);
CREATE INDEX IF NOT EXISTS idx_ate_time ON accountant_team_events(start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_ate_created_by ON accountant_team_events(created_by);
CREATE INDEX IF NOT EXISTS idx_ate_type ON accountant_team_events(event_type);
CREATE INDEX IF NOT EXISTS idx_ate_status ON accountant_team_events(status);
CREATE INDEX IF NOT EXISTS idx_ate_upcoming ON accountant_team_events(team_id, start_time) 
    WHERE start_time > NOW() AND status = 'scheduled';

-- Komentarz
COMMENT ON TABLE accountant_team_events IS 'Wydarzenia kalendarza zespołu księgowych';

-- ============================================================================
-- 7. TRIGGERY I FUNKCJE
-- ============================================================================

-- Trigger: Aktualizacja updated_at
CREATE OR REPLACE FUNCTION update_accountant_team_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Dodaj triggery do tabel
DROP TRIGGER IF EXISTS update_accountant_teams_timestamp ON accountant_teams;
CREATE TRIGGER update_accountant_teams_timestamp
    BEFORE UPDATE ON accountant_teams
    FOR EACH ROW EXECUTE FUNCTION update_accountant_team_timestamp();

DROP TRIGGER IF EXISTS update_accountant_team_members_timestamp ON accountant_team_members;
CREATE TRIGGER update_accountant_team_members_timestamp
    BEFORE UPDATE ON accountant_team_members
    FOR EACH ROW EXECUTE FUNCTION update_accountant_team_timestamp();

DROP TRIGGER IF EXISTS update_accountant_team_invitations_timestamp ON accountant_team_invitations;
CREATE TRIGGER update_accountant_team_invitations_timestamp
    BEFORE UPDATE ON accountant_team_invitations
    FOR EACH ROW EXECUTE FUNCTION update_accountant_team_timestamp();

DROP TRIGGER IF EXISTS update_accountant_team_tasks_timestamp ON accountant_team_tasks;
CREATE TRIGGER update_accountant_team_tasks_timestamp
    BEFORE UPDATE ON accountant_team_tasks
    FOR EACH ROW EXECUTE FUNCTION update_accountant_team_timestamp();

DROP TRIGGER IF EXISTS update_accountant_team_events_timestamp ON accountant_team_events;
CREATE TRIGGER update_accountant_team_events_timestamp
    BEFORE UPDATE ON accountant_team_events
    FOR EACH ROW EXECUTE FUNCTION update_accountant_team_timestamp();

-- ============================================================================
-- 8. TRIGGER: Auto-dodanie właściciela jako członka
-- ============================================================================
CREATE OR REPLACE FUNCTION add_owner_as_team_member()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO accountant_team_members (team_id, accountant_id, role, status, permissions)
    VALUES (
        NEW.id,
        NEW.owner_id,
        'owner',
        'active',
        '{"can_invite": true, "can_remove_members": true, "can_edit_tasks": true, "can_view_financials": true, "can_manage_clients": true}'::jsonb
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS auto_add_owner_to_team ON accountant_teams;
CREATE TRIGGER auto_add_owner_to_team
    AFTER INSERT ON accountant_teams
    FOR EACH ROW EXECUTE FUNCTION add_owner_as_team_member();

-- ============================================================================
-- 9. TRIGGER: Obsługa akceptacji zaproszenia
-- ============================================================================
CREATE OR REPLACE FUNCTION handle_accountant_invitation_accepted()
RETURNS TRIGGER AS $$
BEGIN
    -- Tylko gdy status zmienia się na 'accepted'
    IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
        -- Dodaj członka do zespołu
        INSERT INTO accountant_team_members (team_id, accountant_id, role, status)
        VALUES (
            NEW.team_id,
            NEW.invited_accountant_id,
            NEW.proposed_role,
            'active'
        )
        ON CONFLICT (team_id, accountant_id) DO NOTHING;
        
        -- Ustaw datę odpowiedzi
        NEW.responded_at = NOW();
    END IF;
    
    -- Gdy odrzucone, też ustaw datę
    IF NEW.status = 'declined' AND OLD.status = 'pending' THEN
        NEW.responded_at = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_invitation_accepted ON accountant_team_invitations;
CREATE TRIGGER on_invitation_accepted
    BEFORE UPDATE ON accountant_team_invitations
    FOR EACH ROW EXECUTE FUNCTION handle_accountant_invitation_accepted();

-- ============================================================================
-- 10. FUNKCJE POMOCNICZE
-- ============================================================================

-- Funkcja: Pobierz zespoły dla księgowego
CREATE OR REPLACE FUNCTION get_accountant_teams(p_accountant_id UUID)
RETURNS TABLE (
    team_id UUID,
    team_name VARCHAR(100),
    role VARCHAR(50),
    member_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id,
        t.name,
        m.role,
        (SELECT COUNT(*) FROM accountant_team_members WHERE team_id = t.id AND status = 'active')
    FROM accountant_teams t
    INNER JOIN accountant_team_members m ON m.team_id = t.id
    WHERE m.accountant_id = p_accountant_id
    AND m.status = 'active'
    AND t.is_active = TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funkcja: Sprawdź czy księgowy jest członkiem zespołu
CREATE OR REPLACE FUNCTION is_accountant_team_member(p_team_id UUID, p_accountant_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM accountant_team_members
        WHERE team_id = p_team_id
        AND accountant_id = p_accountant_id
        AND status = 'active'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funkcja: Pobierz oczekujące zaproszenia dla księgowego
CREATE OR REPLACE FUNCTION get_pending_invitations_for_accountant(p_accountant_id UUID)
RETURNS TABLE (
    invitation_id UUID,
    team_id UUID,
    team_name VARCHAR(100),
    invited_by_name TEXT,
    message TEXT,
    proposed_role VARCHAR(50),
    expires_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        i.id,
        i.team_id,
        t.name,
        p.full_name,
        i.message,
        i.proposed_role,
        i.expires_at
    FROM accountant_team_invitations i
    INNER JOIN accountant_teams t ON t.id = i.team_id
    INNER JOIN profiles p ON p.id = i.invited_by
    WHERE i.invited_accountant_id = p_accountant_id
    AND i.status = 'pending'
    AND i.expires_at > NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 11. RLS (Row Level Security) POLICIES
-- ============================================================================

-- Włącz RLS
ALTER TABLE accountant_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE accountant_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE accountant_team_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE accountant_team_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE accountant_team_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE accountant_team_events ENABLE ROW LEVEL SECURITY;

-- TEAMS: Widoczne dla członków
CREATE POLICY "accountant_teams_view_for_members" ON accountant_teams
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM accountant_team_members m
            INNER JOIN accountants a ON a.id = m.accountant_id
            WHERE m.team_id = accountant_teams.id
            AND a.profile_id = (SELECT auth.uid())
            AND m.status = 'active'
        )
        OR
        EXISTS (
            SELECT 1 FROM accountants a
            WHERE a.id = accountant_teams.owner_id
            AND a.profile_id = (SELECT auth.uid())
        )
    );

-- TEAMS: Tworzenie przez księgowych
CREATE POLICY "accountant_teams_insert" ON accountant_teams
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM accountants
            WHERE id = owner_id
            AND profile_id = (SELECT auth.uid())
        )
    );

-- TEAMS: Edycja przez właściciela/admina
CREATE POLICY "accountant_teams_update" ON accountant_teams
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM accountant_team_members m
            INNER JOIN accountants a ON a.id = m.accountant_id
            WHERE m.team_id = accountant_teams.id
            AND a.profile_id = (SELECT auth.uid())
            AND m.role IN ('owner', 'admin')
        )
    );

-- TEAMS: Usuwanie przez właściciela
CREATE POLICY "accountant_teams_delete" ON accountant_teams
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM accountants a
            WHERE a.id = accountant_teams.owner_id
            AND a.profile_id = (SELECT auth.uid())
        )
    );

-- MEMBERS: Widoczne dla członków zespołu
CREATE POLICY "accountant_team_members_view" ON accountant_team_members
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM accountant_team_members m2
            INNER JOIN accountants a ON a.id = m2.accountant_id
            WHERE m2.team_id = accountant_team_members.team_id
            AND a.profile_id = (SELECT auth.uid())
            AND m2.status = 'active'
        )
    );

-- MEMBERS: Dodawanie przez admina/właściciela
CREATE POLICY "accountant_team_members_insert" ON accountant_team_members
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM accountant_team_members m
            INNER JOIN accountants a ON a.id = m.accountant_id
            WHERE m.team_id = accountant_team_members.team_id
            AND a.profile_id = (SELECT auth.uid())
            AND m.role IN ('owner', 'admin')
        )
    );

-- INVITATIONS: Widoczne dla zapraszającego i zaproszonego
CREATE POLICY "accountant_invitations_view" ON accountant_team_invitations
    FOR SELECT USING (
        invited_by = (SELECT auth.uid())
        OR
        EXISTS (
            SELECT 1 FROM accountants a
            WHERE a.id = accountant_team_invitations.invited_accountant_id
            AND a.profile_id = (SELECT auth.uid())
        )
        OR
        EXISTS (
            SELECT 1 FROM accountant_team_members m
            INNER JOIN accountants a ON a.id = m.accountant_id
            WHERE m.team_id = accountant_team_invitations.team_id
            AND a.profile_id = (SELECT auth.uid())
            AND m.role IN ('owner', 'admin')
        )
    );

-- INVITATIONS: Tworzenie przez admina/właściciela
CREATE POLICY "accountant_invitations_insert" ON accountant_team_invitations
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM accountant_team_members m
            INNER JOIN accountants a ON a.id = m.accountant_id
            WHERE m.team_id = accountant_team_invitations.team_id
            AND a.profile_id = (SELECT auth.uid())
            AND m.role IN ('owner', 'admin')
        )
    );

-- INVITATIONS: Aktualizacja (akceptacja/odrzucenie) przez zaproszonego
CREATE POLICY "accountant_invitations_update" ON accountant_team_invitations
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM accountants a
            WHERE a.id = accountant_team_invitations.invited_accountant_id
            AND a.profile_id = (SELECT auth.uid())
        )
        OR
        invited_by = (SELECT auth.uid())
    );

-- TASKS: Widoczne dla członków zespołu
CREATE POLICY "accountant_tasks_view" ON accountant_team_tasks
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM accountant_team_members m
            INNER JOIN accountants a ON a.id = m.accountant_id
            WHERE m.team_id = accountant_team_tasks.team_id
            AND a.profile_id = (SELECT auth.uid())
            AND m.status = 'active'
        )
    );

-- TASKS: CRUD dla członków zespołu
CREATE POLICY "accountant_tasks_insert" ON accountant_team_tasks
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM accountant_team_members m
            INNER JOIN accountants a ON a.id = m.accountant_id
            WHERE m.team_id = accountant_team_tasks.team_id
            AND a.profile_id = (SELECT auth.uid())
            AND m.status = 'active'
        )
    );

CREATE POLICY "accountant_tasks_update" ON accountant_team_tasks
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM accountant_team_members m
            INNER JOIN accountants a ON a.id = m.accountant_id
            WHERE m.team_id = accountant_team_tasks.team_id
            AND a.profile_id = (SELECT auth.uid())
            AND m.status = 'active'
        )
    );

-- MESSAGES: CRUD dla członków zespołu
CREATE POLICY "accountant_messages_view" ON accountant_team_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM accountant_team_members m
            INNER JOIN accountants a ON a.id = m.accountant_id
            WHERE m.team_id = accountant_team_messages.team_id
            AND a.profile_id = (SELECT auth.uid())
            AND m.status = 'active'
        )
    );

CREATE POLICY "accountant_messages_insert" ON accountant_team_messages
    FOR INSERT WITH CHECK (
        sender_id = (SELECT auth.uid())
        AND
        EXISTS (
            SELECT 1 FROM accountant_team_members m
            INNER JOIN accountants a ON a.id = m.accountant_id
            WHERE m.team_id = accountant_team_messages.team_id
            AND a.profile_id = (SELECT auth.uid())
            AND m.status = 'active'
        )
    );

-- EVENTS: CRUD dla członków zespołu
CREATE POLICY "accountant_events_view" ON accountant_team_events
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM accountant_team_members m
            INNER JOIN accountants a ON a.id = m.accountant_id
            WHERE m.team_id = accountant_team_events.team_id
            AND a.profile_id = (SELECT auth.uid())
            AND m.status = 'active'
        )
    );

CREATE POLICY "accountant_events_insert" ON accountant_team_events
    FOR INSERT WITH CHECK (
        created_by = (SELECT auth.uid())
        AND
        EXISTS (
            SELECT 1 FROM accountant_team_members m
            INNER JOIN accountants a ON a.id = m.accountant_id
            WHERE m.team_id = accountant_team_events.team_id
            AND a.profile_id = (SELECT auth.uid())
            AND m.status = 'active'
        )
    );

CREATE POLICY "accountant_events_update" ON accountant_team_events
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM accountant_team_members m
            INNER JOIN accountants a ON a.id = m.accountant_id
            WHERE m.team_id = accountant_team_events.team_id
            AND a.profile_id = (SELECT auth.uid())
            AND m.status = 'active'
        )
    );

-- ============================================================================
-- 12. ADMIN POLICIES (BYPASS RLS)
-- ============================================================================

-- Admini widzą wszystko
CREATE POLICY "admin_full_access_accountant_teams" ON accountant_teams
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = (SELECT auth.uid())
            AND role = 'admin'
        )
    );

CREATE POLICY "admin_full_access_accountant_team_members" ON accountant_team_members
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = (SELECT auth.uid())
            AND role = 'admin'
        )
    );

CREATE POLICY "admin_full_access_accountant_team_invitations" ON accountant_team_invitations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = (SELECT auth.uid())
            AND role = 'admin'
        )
    );

CREATE POLICY "admin_full_access_accountant_team_tasks" ON accountant_team_tasks
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = (SELECT auth.uid())
            AND role = 'admin'
        )
    );

CREATE POLICY "admin_full_access_accountant_team_messages" ON accountant_team_messages
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = (SELECT auth.uid())
            AND role = 'admin'
        )
    );

CREATE POLICY "admin_full_access_accountant_team_events" ON accountant_team_events
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = (SELECT auth.uid())
            AND role = 'admin'
        )
    );

-- ============================================================================
-- KONIEC MIGRACJI
-- ============================================================================
