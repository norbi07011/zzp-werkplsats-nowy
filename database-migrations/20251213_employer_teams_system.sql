-- ================================================================
-- EMPLOYER TEAMS SYSTEM
-- ================================================================
-- System zespołów pracodawców z zaproszeniami
-- Pracodawca może mieć zespół (ekipę) pracowników i sprzątaczy
-- Pracownik/Sprzątacz może być w wielu zespołach różnych pracodawców
-- ================================================================

-- 1. TABELA: Zespoły pracodawców (employer_teams)
-- Każdy pracodawca może mieć wiele zespołów
CREATE TABLE IF NOT EXISTS employer_teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employer_id UUID NOT NULL REFERENCES employers(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    color_hex VARCHAR(7) DEFAULT '#3B82F6',
    icon VARCHAR(50) DEFAULT 'users',
    is_active BOOLEAN DEFAULT TRUE,
    max_members INTEGER DEFAULT 50 CHECK (max_members > 0 AND max_members <= 200),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indeks dla szybkiego wyszukiwania zespołów pracodawcy
CREATE INDEX IF NOT EXISTS idx_employer_teams_employer_id ON employer_teams(employer_id);

-- 2. TABELA: Członkowie zespołu (employer_team_members)
-- Relacja wiele-do-wielu między zespołami a pracownikami/sprzątaczami
CREATE TABLE IF NOT EXISTS employer_team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES employer_teams(id) ON DELETE CASCADE,
    
    -- Członek może być pracownikiem LUB firmą sprzątającą (jeden z dwóch)
    worker_id UUID REFERENCES workers(id) ON DELETE CASCADE,
    cleaning_company_id UUID REFERENCES cleaning_companies(id) ON DELETE CASCADE,
    
    -- Rola w zespole
    role VARCHAR(50) DEFAULT 'member' CHECK (role IN ('member', 'leader', 'supervisor')),
    
    -- Specjalizacja w zespole (np. "Malarz", "Kierownik placu")
    team_specialization VARCHAR(100),
    
    -- Status członkostwa
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'on_leave')),
    
    -- Daty
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    left_at TIMESTAMPTZ,
    
    -- Notatki pracodawcy o członku
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraint: musi być albo worker_id albo cleaning_company_id (nie oba)
    CONSTRAINT check_member_type CHECK (
        (worker_id IS NOT NULL AND cleaning_company_id IS NULL) OR
        (worker_id IS NULL AND cleaning_company_id IS NOT NULL)
    ),
    
    -- Unikalność: jeden członek może być tylko raz w danym zespole
    CONSTRAINT unique_team_worker UNIQUE (team_id, worker_id),
    CONSTRAINT unique_team_cleaning UNIQUE (team_id, cleaning_company_id)
);

-- Indeksy dla szybkiego wyszukiwania
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON employer_team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_worker_id ON employer_team_members(worker_id);
CREATE INDEX IF NOT EXISTS idx_team_members_cleaning_id ON employer_team_members(cleaning_company_id);
CREATE INDEX IF NOT EXISTS idx_team_members_status ON employer_team_members(status);

-- 3. TABELA: Zaproszenia do zespołu (team_invitations)
-- System zaproszeń jak na Facebooku
CREATE TABLE IF NOT EXISTS team_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES employer_teams(id) ON DELETE CASCADE,
    
    -- Kto zaprasza (pracodawca przez swój profil)
    invited_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Kogo zapraszamy (worker lub cleaning_company)
    invited_worker_id UUID REFERENCES workers(id) ON DELETE CASCADE,
    invited_cleaning_company_id UUID REFERENCES cleaning_companies(id) ON DELETE CASCADE,
    
    -- Wiadomość zaproszenia
    message TEXT,
    
    -- Proponowana rola
    proposed_role VARCHAR(50) DEFAULT 'member',
    
    -- Status zaproszenia
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired', 'cancelled')),
    
    -- Daty
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
    responded_at TIMESTAMPTZ,
    
    -- Powód odrzucenia (opcjonalny)
    decline_reason TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraint: musi być albo worker albo cleaning_company
    CONSTRAINT check_invited_type CHECK (
        (invited_worker_id IS NOT NULL AND invited_cleaning_company_id IS NULL) OR
        (invited_worker_id IS NULL AND invited_cleaning_company_id IS NOT NULL)
    ),
    
    -- Nie można mieć dwóch pending zaproszeń dla tej samej osoby do tego samego zespołu
    CONSTRAINT unique_pending_invitation_worker UNIQUE (team_id, invited_worker_id, status) 
        WHERE status = 'pending',
    CONSTRAINT unique_pending_invitation_cleaning UNIQUE (team_id, invited_cleaning_company_id, status)
        WHERE status = 'pending'
);

-- Indeksy dla szybkiego wyszukiwania zaproszeń
CREATE INDEX IF NOT EXISTS idx_invitations_team_id ON team_invitations(team_id);
CREATE INDEX IF NOT EXISTS idx_invitations_worker_id ON team_invitations(invited_worker_id);
CREATE INDEX IF NOT EXISTS idx_invitations_cleaning_id ON team_invitations(invited_cleaning_company_id);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON team_invitations(status);
CREATE INDEX IF NOT EXISTS idx_invitations_pending ON team_invitations(status) WHERE status = 'pending';

-- ================================================================
-- RLS POLICIES
-- ================================================================

-- Włącz RLS
ALTER TABLE employer_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE employer_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;

-- Polityki dla employer_teams
-- Pracodawca widzi tylko swoje zespoły
CREATE POLICY "employer_teams_select_own"
    ON employer_teams FOR SELECT
    USING (
        employer_id IN (
            SELECT id FROM employers WHERE profile_id = (SELECT auth.uid())
        )
    );

-- Pracodawca może tworzyć własne zespoły
CREATE POLICY "employer_teams_insert_own"
    ON employer_teams FOR INSERT
    WITH CHECK (
        employer_id IN (
            SELECT id FROM employers WHERE profile_id = (SELECT auth.uid())
        )
    );

-- Pracodawca może aktualizować własne zespoły
CREATE POLICY "employer_teams_update_own"
    ON employer_teams FOR UPDATE
    USING (
        employer_id IN (
            SELECT id FROM employers WHERE profile_id = (SELECT auth.uid())
        )
    );

-- Pracodawca może usuwać własne zespoły
CREATE POLICY "employer_teams_delete_own"
    ON employer_teams FOR DELETE
    USING (
        employer_id IN (
            SELECT id FROM employers WHERE profile_id = (SELECT auth.uid())
        )
    );

-- Admin ma pełny dostęp
CREATE POLICY "employer_teams_admin_full"
    ON employer_teams FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = (SELECT auth.uid()) AND role = 'admin'
        )
    );

-- Polityki dla employer_team_members
-- Pracodawca widzi członków swoich zespołów
CREATE POLICY "team_members_select_employer"
    ON employer_team_members FOR SELECT
    USING (
        team_id IN (
            SELECT et.id FROM employer_teams et
            JOIN employers e ON et.employer_id = e.id
            WHERE e.profile_id = (SELECT auth.uid())
        )
    );

-- Pracownik/Sprzątacz widzi zespoły, do których należy
CREATE POLICY "team_members_select_member"
    ON employer_team_members FOR SELECT
    USING (
        worker_id IN (SELECT id FROM workers WHERE profile_id = (SELECT auth.uid()))
        OR cleaning_company_id IN (SELECT id FROM cleaning_companies WHERE profile_id = (SELECT auth.uid()))
    );

-- Pracodawca może dodawać członków do swoich zespołów
CREATE POLICY "team_members_insert_employer"
    ON employer_team_members FOR INSERT
    WITH CHECK (
        team_id IN (
            SELECT et.id FROM employer_teams et
            JOIN employers e ON et.employer_id = e.id
            WHERE e.profile_id = (SELECT auth.uid())
        )
    );

-- Pracodawca może aktualizować członków swoich zespołów
CREATE POLICY "team_members_update_employer"
    ON employer_team_members FOR UPDATE
    USING (
        team_id IN (
            SELECT et.id FROM employer_teams et
            JOIN employers e ON et.employer_id = e.id
            WHERE e.profile_id = (SELECT auth.uid())
        )
    );

-- Pracodawca może usuwać członków z zespołów
CREATE POLICY "team_members_delete_employer"
    ON employer_team_members FOR DELETE
    USING (
        team_id IN (
            SELECT et.id FROM employer_teams et
            JOIN employers e ON et.employer_id = e.id
            WHERE e.profile_id = (SELECT auth.uid())
        )
    );

-- Admin ma pełny dostęp
CREATE POLICY "team_members_admin_full"
    ON employer_team_members FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = (SELECT auth.uid()) AND role = 'admin'
        )
    );

-- Polityki dla team_invitations
-- Pracodawca widzi zaproszenia do swoich zespołów
CREATE POLICY "invitations_select_employer"
    ON team_invitations FOR SELECT
    USING (
        team_id IN (
            SELECT et.id FROM employer_teams et
            JOIN employers e ON et.employer_id = e.id
            WHERE e.profile_id = (SELECT auth.uid())
        )
    );

-- Zaproszony widzi swoje zaproszenia
CREATE POLICY "invitations_select_invited"
    ON team_invitations FOR SELECT
    USING (
        invited_worker_id IN (SELECT id FROM workers WHERE profile_id = (SELECT auth.uid()))
        OR invited_cleaning_company_id IN (SELECT id FROM cleaning_companies WHERE profile_id = (SELECT auth.uid()))
    );

-- Pracodawca może tworzyć zaproszenia do swoich zespołów
CREATE POLICY "invitations_insert_employer"
    ON team_invitations FOR INSERT
    WITH CHECK (
        team_id IN (
            SELECT et.id FROM employer_teams et
            JOIN employers e ON et.employer_id = e.id
            WHERE e.profile_id = (SELECT auth.uid())
        )
        AND invited_by = (SELECT auth.uid())
    );

-- Zaproszony może aktualizować (akceptować/odrzucać) swoje zaproszenia
CREATE POLICY "invitations_update_invited"
    ON team_invitations FOR UPDATE
    USING (
        invited_worker_id IN (SELECT id FROM workers WHERE profile_id = (SELECT auth.uid()))
        OR invited_cleaning_company_id IN (SELECT id FROM cleaning_companies WHERE profile_id = (SELECT auth.uid()))
    );

-- Pracodawca może anulować swoje zaproszenia
CREATE POLICY "invitations_update_employer"
    ON team_invitations FOR UPDATE
    USING (
        invited_by = (SELECT auth.uid())
    );

-- Admin ma pełny dostęp
CREATE POLICY "invitations_admin_full"
    ON team_invitations FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = (SELECT auth.uid()) AND role = 'admin'
        )
    );

-- ================================================================
-- TRIGGERS
-- ================================================================

-- Funkcja do automatycznego dodania członka po akceptacji zaproszenia
CREATE OR REPLACE FUNCTION handle_invitation_accepted()
RETURNS TRIGGER AS $$
BEGIN
    -- Jeśli status zmienił się na 'accepted'
    IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
        -- Dodaj członka do zespołu
        INSERT INTO employer_team_members (
            team_id,
            worker_id,
            cleaning_company_id,
            role,
            joined_at
        ) VALUES (
            NEW.team_id,
            NEW.invited_worker_id,
            NEW.invited_cleaning_company_id,
            COALESCE(NEW.proposed_role, 'member'),
            NOW()
        )
        ON CONFLICT DO NOTHING;
        
        -- Ustaw responded_at
        NEW.responded_at := NOW();
    END IF;
    
    -- Jeśli status zmienił się na 'declined'
    IF NEW.status = 'declined' AND OLD.status = 'pending' THEN
        NEW.responded_at := NOW();
    END IF;
    
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger dla akceptacji zaproszenia
DROP TRIGGER IF EXISTS trigger_invitation_response ON team_invitations;
CREATE TRIGGER trigger_invitation_response
    BEFORE UPDATE ON team_invitations
    FOR EACH ROW
    EXECUTE FUNCTION handle_invitation_accepted();

-- Funkcja do aktualizacji updated_at
CREATE OR REPLACE FUNCTION update_team_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggery dla updated_at
DROP TRIGGER IF EXISTS trigger_employer_teams_updated ON employer_teams;
CREATE TRIGGER trigger_employer_teams_updated
    BEFORE UPDATE ON employer_teams
    FOR EACH ROW
    EXECUTE FUNCTION update_team_timestamp();

DROP TRIGGER IF EXISTS trigger_team_members_updated ON employer_team_members;
CREATE TRIGGER trigger_team_members_updated
    BEFORE UPDATE ON employer_team_members
    FOR EACH ROW
    EXECUTE FUNCTION update_team_timestamp();

-- ================================================================
-- KOMENTARZE
-- ================================================================
COMMENT ON TABLE employer_teams IS 'Zespoły pracodawców - pracodawca może mieć wiele zespołów dla różnych projektów';
COMMENT ON TABLE employer_team_members IS 'Członkowie zespołów - pracownicy i firmy sprzątające mogą być w wielu zespołach';
COMMENT ON TABLE team_invitations IS 'Zaproszenia do zespołów - system jak na Facebooku (pending → accepted/declined)';

COMMENT ON COLUMN employer_team_members.role IS 'Rola: member (zwykły członek), leader (lider zespołu), supervisor (nadzorca)';
COMMENT ON COLUMN team_invitations.status IS 'Status: pending (oczekuje), accepted (zaakceptowane), declined (odrzucone), expired (wygasłe), cancelled (anulowane)';
