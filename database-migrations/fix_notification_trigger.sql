-- Fix notification trigger - zmiana NEW.read na NEW.is_read
-- Błąd: record "new" has no field "read"
-- Kolumna w bazie nazywa się is_read, nie read

CREATE OR REPLACE FUNCTION "public"."mark_notification_as_read"() 
RETURNS "trigger"
LANGUAGE "plpgsql"
AS $$
BEGIN
    -- Poprawka: użyj is_read zamiast read
    IF NEW.is_read = true AND OLD.is_read = false THEN
        NEW.read_at = NOW();
    END IF;
    RETURN NEW;
END;
$$;

-- Sprawdź czy trigger istnieje na tabeli notifications
-- Jeśli nie, utwórz go
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'mark_notification_as_read_trigger'
        AND tgrelid = 'notifications'::regclass
    ) THEN
        CREATE TRIGGER mark_notification_as_read_trigger
            BEFORE UPDATE ON notifications
            FOR EACH ROW
            EXECUTE FUNCTION mark_notification_as_read();
    END IF;
END $$;

COMMENT ON FUNCTION mark_notification_as_read() IS 'Automatycznie ustawia read_at gdy is_read zmienia się z false na true';
