-- Migration: Add location, address, and completion_date fields to worker_portfolio
-- Date: 2024-12-26
-- Description: Rozszerza tabelę worker_portfolio o szczegółowe informacje o lokalizacji i dacie oddania projektu

-- ✅ Dodaj nowe kolumny do tabeli worker_portfolio
ALTER TABLE public.worker_portfolio
  ADD COLUMN IF NOT EXISTS location text,
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS completion_date date;

-- ✅ Dodaj komentarze dokumentujące nowe kolumny
COMMENT ON COLUMN public.worker_portfolio.location IS 'Lokalizacja projektu (miasto, region)';
COMMENT ON COLUMN public.worker_portfolio.address IS 'Pełny adres realizacji projektu';
COMMENT ON COLUMN public.worker_portfolio.completion_date IS 'Data oddania/zakończenia projektu (może różnić się od end_date)';

-- ✅ Utworz indeks dla częstych zapytań po lokalizacji
CREATE INDEX IF NOT EXISTS idx_worker_portfolio_location 
  ON public.worker_portfolio USING btree (location) 
  WHERE location IS NOT NULL;

-- ✅ Opcjonalnie: Dodaj trigger automatycznie ustawiający completion_date = end_date jeśli nie podano
CREATE OR REPLACE FUNCTION auto_set_completion_date()
RETURNS TRIGGER AS $$
BEGIN
  -- Jeśli completion_date jest NULL a end_date jest ustawione, skopiuj end_date
  IF NEW.completion_date IS NULL AND NEW.end_date IS NOT NULL THEN
    NEW.completion_date := NEW.end_date;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Usuń stary trigger jeśli istnieje
DROP TRIGGER IF EXISTS trg_auto_completion_date ON public.worker_portfolio;

-- Utwórz nowy trigger
CREATE TRIGGER trg_auto_completion_date
  BEFORE INSERT OR UPDATE ON public.worker_portfolio
  FOR EACH ROW
  EXECUTE FUNCTION auto_set_completion_date();

-- ✅ Przykład danych testowych (opcjonalnie - zakomentowane)
-- UPDATE public.worker_portfolio 
-- SET 
--   location = 'Warszawa, Mazowieckie',
--   address = 'ul. Marszałkowska 123/45, 00-001 Warszawa',
--   completion_date = end_date
-- WHERE id IN (SELECT id FROM public.worker_portfolio LIMIT 1);

-- ✅ Sprawdzenie struktury tabeli
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'worker_portfolio'
-- ORDER BY ordinal_position;
