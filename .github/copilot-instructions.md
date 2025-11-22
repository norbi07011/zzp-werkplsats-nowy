1. Zasada Nr 0 – Jak masz ze mną rozmawiać

1.1. Mów jak do człowieka
1.2. Najpierw zrozum, potem działaj
1.3. Nie używaj nazw plików w odpowiedziach
1.4. Potwierdź co zrozumiałeś
1.5. Nie pisz kodu, dopóki nie potwierdzę

2. ETAP 0 – Analiza Chirurgiczna Istniejącego Kodu

2.1. Obleć cały projekt
2.2. Zmapuj moduły i panele
2.3. Znajdź wszystkie pliki powiązane z danym panelem
2.4. Sprawdź istniejące funkcje i przyciski
2.5. Unikaj duplikatów logiki
2.6. Lista wszystkich funkcji karty
2.7. Cel i efekt każdego przycisku
2.8. Kompatybilność z innymi panelami
2.9. Struktury danych — tylko potrzebne
2.10. Rozbudowa karty na 200%
2.11. Lista MVP karty
2.12. Uruchomienie projektu lokalnie
2.13. Obserwacja logów — Console Ninja
2.14. Znalezienie błędów runtime
2.15. Zmapowanie requestów i logiki

3. ETAP MCP – Weryfikacja Bazy i Struktury

3.1. list_tables
3.2. get_table_structure
3.3. get_foreign_keys
3.4. get_table_policies (RLS)
3.5. SELECT * FROM tabela LIMIT 5
3.6. Sprawdzenie realnych rekordów
3.7. Sprawdzenie konfliktów typów i relacji
3.8. Checklist MCP + MVP dodana do planu

4. Planowanie Nowej Funkcji / Karty

4.1. Zmapowanie modułów i zależności
4.2. Lista plików powiązanych z panelem
4.3. Lista funkcji karty
4.4. Logika każdego przycisku
4.5. Powiązania danych
4.6. Kompatybilność między panelami
4.7. Minimalne MVP
4.8. Rozbudowa 200% (wersja docelowa)
4.9. Końcowy plan karty przed kodem

5. Raport Końcowy (po każdym zadaniu)

5.1. Co zrobiłem
5.2. Co działa
5.3. Co poprawić
5.4. Kolejne kroki (prosto, po ludzku)

6. ETAP 1 – Weryfikacja po Kodowaniu

6.1. TypeScript errors check
6.2. get_errors dla wszystkich plików
6.3. Nie ignorować warningów
6.4. Limit błędów > 5 = STOP

7. Console Ninja Runtime Check

7.1. Runtime logs before test
7.2. Kliknięcie w UI
7.3. Runtime logs after test
7.4. Porównanie timestamps
7.5. Analiza stack trace

8. Database Verification

8.1. SELECT nowego rekordu
8.2. created_at / updated_at
8.3. Test RLS: user vs admin
8.4. Sprawdzenie foreign keys

9. Git Diff Analysis

9.1. git status
9.2. git diff
9.3. >5 plików zmienionych?
9.4. Pliki niezwiązane z zadaniem?

10. Routing & Navigation Safety

10.1. Duplikaty route
10.2. Sprawdzenie path
10.3. Parent route → Outlet
10.4. Lazy import
10.5. Navigation test
10.6. Direct URL test
10.7. Lazy loading verification

11. Types & Imports Safety

11.1. Database types verification
11.2. Sprawdzenie tabel w database.types.ts
11.3. Supabase gen types
11.4. Poprawne import paths
11.5. @ts-nocheck zasady

12. Console Ninja – Debug Protocol

12.1. Dodawanie logów
12.2. Logs before, during, after
12.3. Analiza błędów
12.4. Wzorce błędów typowych