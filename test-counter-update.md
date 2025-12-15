# Test Planu - Liczniki Homepage

## Aktualny Stan (przed testem)

- **Aktywni ZZP'erzy**: 5 (1 worker + 4 cleaning_company)
- **Aktywni Pracodawcy**: 1
- **Aktywni Księgowi**: 1
- **Total users**: 8 (including 1 admin)

## Test Scenariusz

### Krok 1: Sprawdź aktualną wartość

✅ HomePage pokazuje: 5 | 1 | 1

### Krok 2: Zarejestruj nowego workera

1. Przejdź do http://localhost:3006/register/worker
2. Wypełnij formularz rejestracji
3. Potwierdź email (jeśli wymagane)

### Krok 3: Sprawdź liczniki

- Odśwież stronę główną (F5)
- **Oczekiwany wynik**: 6 | 1 | 1 (zwiększone o 1 worker)

### Krok 4: Zarejestruj nowego pracodawcę

1. Przejdź do http://localhost:3006/register/employer
2. Wypełnij formularz
3. Potwierdź email

### Krok 5: Sprawdź liczniki

- Odśwież stronę główną
- **Oczekiwany wynik**: 6 | 2 | 1 (zwiększone o 1 employer)

### Krok 6: Zarejestruj księgowego

1. Przejdź do http://localhost:3006/register/accountant
2. Wypełnij formularz
3. Potwierdź email

### Krok 7: Finalne sprawdzenie

- Odśwież stronę główną
- **Oczekiwany wynik**: 6 | 2 | 2 (zwiększone o 1 accountant)

## Uwagi techniczne

- Liczniki pobierają dane przy każdym załadowaniu HomePage (useEffect)
- Dane są cachowane przez Supabase client
- Przy braku danych pokazuje "..." (loading state)
- Przy błędzie pokazuje "0"
- Admin nie jest liczony w statystykach (tylko: worker, employer, accountant, cleaning_company)
