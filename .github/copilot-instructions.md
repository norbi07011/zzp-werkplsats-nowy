## 🚨 ZASADA ZERO - PYTAJ PRZED USUNIĘCIEM/PRZYWRÓCENIEM

### ⛔ ABSOLUTNY ZAKAZ BEZ PYTANIA UŻYTKOWNIKA:

**NIGDY nie wykonuj tych operacji bez wyraźnego potwierdzenia użytkownika:**

```bash
# ❌ ZABRONIONE bez pytania:
git checkout -- plik.ts          # Usuwa niezacommitowane zmiany
git checkout HEAD -- plik.ts     # Usuwa niezacommitowane zmiany
git reset --hard                 # Usuwa WSZYSTKIE niezacommitowane zmiany
git clean -fd                    # Usuwa nieśledzone pliki
git add .                        # Dodaje pliki do stage
git commit -m "..."              # Commituje zmiany
git push                         # Wypycha do remote
rm -rf katalog/                  # Usuwa katalog
```

### ✅ POPRAWNY WORKFLOW PRZED DESTRUKCYJNYMI OPERACJAMI:

**ZAWSZE pytaj użytkownika w jasny sposób:**

```
🚨 UWAGA! Planuję wykonać operację która może usunąć Twoją pracę:

ℹ️  Operacja: git checkout -- plik.ts
⚠️  Efekt: Straci wszystkie niezacommitowane zmiany w tym pliku
📊 Status: Plik ma 500+ linii niezacommitowanych zmian
❓ Pytanie: Czy chcesz żebym to zrobił? (tak/nie)

Jeśli masz tam ważną pracę - najpierw zrób commit:
git add plik.ts
git commit -m "work in progress"
```

---

## ⚠️ ABSOLUTNIE OBOWIĄZKOWE - PRZED JAKĄKOLWIEK ZMIANĄ

### WORKFLOW PRZED TWORZENIEM/MODYFIKACJĄ PLIKÓW:

**NIGDY nie generuj SQL/kodu bez tego workflow!**

#### � ETAP 0: ANALIZA CHIRURGICZNA ISTNIEJĄCEGO KODU (NAJPIERW!)

**ZASADA:** Zanim dotkniesz bazy danych, ZROZUM co już istnieje w kodzie!

Obleć cały projekt, zmapuj moduły i panele.

Zidentyfikuj wszystkie pliki związane z tym panelem.

Sprawdź, jakie przyciski i akcje już istnieją w innych panelach.

Upewnij się, że nie planujesz duplikatów funkcji ani widoków.

Opisz mi w punktach, jak widzisz funkcje tej karty.

Dla każdego przycisku określ dokładny cel i efekt.

Sprawdź kompatybilność nowych funkcji z resztą aplikacji.

Zaproponuj tylko potrzebne struktury danych i pola.

Rozplanuj rozbudowę karty na 200% (wersja docelowa + przyszłe rozszerzenia).

Wylistuj minimalne MVP tej karty, żeby była używalna.

Ran list tables Supabase (MCP Server) dla tego modułu.

MCP: get_table_structure dla każdej potrzebnej tabeli.

MCP: get_foreign_keys dla tych tabel i relacji.

MCP: get_table_policies i analiza RLS dostępu.

MCP: SELECT \* FROM tabela LIMIT 5 – test danych i zgodności.

Sprawdź, czy plan nie tworzy konfliktów z istniejącymi typami i relacjami.

Zrób pełny checklist MVP + Supabase i dopisz do planu.

Przedstaw mi końcowy plan karty w punktach przed napisaniem pierwszej linijki kodu.

Uruchom projekt lokalnie, obserwuj logi przez Console Ninja.

W Console Ninja złap wszystkie błędy, warningi i ważne zapytania.

Zmapuj, które akcje panelu wywołują jakie requesty i logi w konsoli.

Zanotuj konflikty, powtarzające się błędy i problemy w logice panelu.

Ran list_tables Supabase (MCP Server) dla modułów używanych przez panel.

MCP: get_table_structure dla każdej tabeli powiązanej z funkcjami tej karty.

MCP: get_foreign_keys dla tych tabel i ich relacji w systemie.

MCP: get_table_policies i analiza RLS dostępu dla każdego widoku panelu.

MCP: SELECT \* FROM tabela LIMIT 5 – test danych i realnych rekordów.

Sprawdź, czy plan nie tworzy duplikatów tabel, kolumn, kluczy ani relacji.

Zrób checklist MVP + Supabase + Console Ninja i dopisz ją do planu.

Przedstaw mi końcowy plan karty w punktach, zanim napiszesz pierwszą linijkę kodu.

tworzenie nowosci i od nowa

Obleć cały projekt, zmapuj moduły, panele i główne zależności.

Zidentyfikuj wszystkie pliki związane z tym panelem i jego logiką.

Sprawdź, jakie przyciski, akcje i wzorce już istnieją w innych panelach.

Upewnij się, że nie planujesz duplikatów funkcji, widoków ani typów.

Opisz mi w punktach wszystkie funkcje tej karty, jak je widzisz.

Dla każdego przycisku określ cel, wejście, wyjście i powiązane dane.

Sprawdź kompatybilność nowych funkcji z istniejącymi panelami i typami w całej appce.

Zaproponuj tylko naprawdę potrzebne struktury danych, pola i relacje.

Zaplanuj rozbudowę karty na 200% (stan docelowy + przyszłe rozszerzenia).

Wylistuj minimalne MVP tej karty, żeby była używalna i kompatybilna w przyszłości z systemem.

Po każdej swojej wykonanej pracy w naszej konwersaci i dodawaj sekcję: 'RAPORT KOŃCOWY'.  
W raporcie wyjaśniaj jasno i prosto:
1) co zrobiłeś,  
2) co jest teraz OK,  
3) co musimy poprawić,  
4) jakie są kolejne kroki i w jakiej kolejności.  
Zero tłumaczenia o liniach kodu — mów normalnie, ludzkim językiem. tumacz to jak bys tumaczyła dzecku 5 letniemu 


---

## 📋 ETAP 1: WERYFIKACJA PO KODOWANIU

**OBOWIĄZKOWE po każdej zmianie kodu:**

### ✅ TypeScript Errors Check

```
- [ ] Uruchom get_errors dla WSZYSTKICH zmienionych plików
- [ ] Przeczytaj każdy błąd - nie ignoruj warnings!
- [ ] Sprawdź czy @ts-nocheck jest TYLKO w plikach tymczasowych
- [ ] Jeśli >5 błędów = STOP i przemyśl podejście na nowo
```

### ✅ Console Ninja Runtime Check

```
- [ ] Uruchom console-ninja_runtimeLogsAndErrors PRZED testowaniem
- [ ] Wykonaj akcję w przeglądarce (kliknij, wyślij, zapisz)
- [ ] Uruchom console-ninja_runtimeLogsAndErrors PONOWNIE
- [ ] Sprawdź czy są NOWE błędy (porównaj timestamps)
- [ ] Przeczytaj CAŁY stack trace, nie tylko message
```

### ✅ Database Verification

```
- [ ] Jeśli dodałeś rekord: SELECT * FROM tabela WHERE id = 'nowy_id'
- [ ] Sprawdź czy created_at i updated_at są poprawne
- [ ] Test RLS: zaloguj się jako user (nie admin) i sprawdź dostęp
- [ ] Sprawdź foreign keys: czy relacje się zapisują?
```

### ✅ Git Diff Analysis

```
- [ ] git status - ile plików zmieniłeś?
- [ ] git diff - CO DOKŁADNIE się zmieniło?
- [ ] Jeśli >5 plików zmienionych = czy to wszystko konieczne?
- [ ] Czy przypadkiem nie zmieniłeś plików niezwiązanych z zadaniem?
```

---

## 🛣️ ROUTING & NAVIGATION SAFETY

**PRZED dodaniem nowego panelu/route:**

### ✅ Duplicate Routes Check

```
- [ ] grep_search 'path="NAZWA_ROUTE"' w App.tsx
- [ ] Czy ten path już NIE istnieje? (duplicate = router crash!)
- [ ] Sprawdź czy parent route ma <Outlet /> (np. /admin)
- [ ] Sprawdź czy lazy import jest dodany na początku App.tsx
```

### ✅ Navigation Test Protocol

```
- [ ] Dodaj console.log('🔗 CARD CLICKED:', { path, title }) w onClick
- [ ] Kliknij kartę i sprawdź Console Ninja - czy log się pojawił?
- [ ] Sprawdź URL bar - czy adres się ZMIENIŁ?
- [ ] Jeśli NIE zmienił: sprawdź czy <Link> ma prawidłowy to={path}
- [ ] Test direct URL: wpisz /admin/payments ręcznie w przeglądarce
```

### ✅ Lazy Loading Verification

```
- [ ] const XManager = lazy(() => import("./pages/Admin/XManager"))
- [ ] <Route path="x" element={<XManager />} />
- [ ] Sprawdź czy Suspense wrapper istnieje w parent route
- [ ] Sprawdź Network tab - czy bundle się ładuje po nawigacji?
```

---

## 🔧 TYPES & IMPORTS SAFETY

**PRZED użyciem tabeli w kodzie:**

### ✅ Database Types Verification

```
- [ ] Otwórz src/lib/database.types.ts
- [ ] Ctrl+F "nazwa_tabeli" - czy istnieje w Database['public']['Tables']?
- [ ] Jeśli NIE: uruchom npx supabase gen types typescript --local
- [ ] Sprawdź czy typ ma Row, Insert, Update interfaces
- [ ] Jeśli types corrupted (terminal output): git checkout HEAD -- src/lib/database.types.ts
```

### ✅ Import Paths Check

```
- [ ] Czy importujesz z "@/lib/supabase" (alias) nie "lib/supabase"?
- [ ] Czy service używa supabase.from("tabela") z prawidłową nazwą?
- [ ] Sprawdź czy hook importuje service prawidłowo
- [ ] Sprawdź czy component importuje hook prawidłowo
```

### ✅ @ts-nocheck Usage Rules

```
- [ ] Używaj TYLKO gdy Supabase types są corrupted
- [ ] Dodaj komentarz: // @ts-nocheck - Temporary: Supabase types regeneration needed
- [ ] NATYCHMIAST po dodaniu: zaplanuj fix (regeneruj types lub revert file)
- [ ] NIE commituj plików z @ts-nocheck do gita!
```

---

## 🐛 CONSOLE NINJA DIAGNOSTIC PROTOCOL

**Standardowy debugging workflow:**

### ✅ Adding Debug Logs

```typescript
// Na początku funkcji:
console.log("🔍 FUNCTION_NAME START", { param1, param2, userId });

// Po fetch danych:
console.log("✅ DATA LOADED", {
  count: data.length,
  sample: data[0],
  isEmpty: data.length === 0,
});

// W error handler:
console.error("❌ FUNCTION_NAME ERROR", {
  error,
  message: error.message,
  context: { userId, filters },
});

// Po akcji (click, submit):
console.log("🔗 ACTION TRIGGERED", {
  action: "buttonClick",
  target: event.target,
  data: formData,
});
```

### ✅ Console Ninja Analysis Steps

```
1. [ ] Uruchom console-ninja_runtimeLogsAndErrors PRZED testem
2. [ ] Zanotuj ostatni timestamp (np. "09:41:22.808")
3. [ ] Wykonaj akcję w przeglądarce
4. [ ] Uruchom console-ninja_runtimeLogsAndErrors PONOWNIE
5. [ ] Szukaj logów NOWSZYCH niż timestamp z kroku 2
6. [ ] Przeanalizuj stack trace - który plik i linia?
7. [ ] Szukaj wzorców błędów (React hooks? Supabase RLS? Type error?)
```

### ✅ Common Error Patterns

```
"Cannot read properties of null (reading 'useRef')"
  → React version mismatch / duplicate React in node_modules

"Invalid hook call"
  → Hooks poza componentem / duplicate React

"invalid input syntax for type numeric"
  → Supabase SQL type error (string jako number)

"relation does not exist"
  → Tabela nie istnieje / źle wpisana nazwa

"permission denied for table"
  → RLS policy blokuje dostęp
```

---

## 🔒 GIT SAFETY NET

**PRZED większymi zmianami:**

### ✅ Pre-Change Checkpoint

```
- [ ] git status - czy masz uncommited changes?
- [ ] git diff - zobacz co już zmieniłeś
- [ ] Jeśli >3 pliki zmienione: commit lub stash przed dalszą pracą
- [ ] git branch - czy jesteś na main? (może lepiej feature branch?)
```

### ✅ Safe Recovery Commands

```bash
# Revert TYLKO JEDNEGO pliku (bezpieczne):
git checkout HEAD -- ścieżka/do/pliku.ts

# Zobaczenie co zmieniłeś w pliku:
git diff ścieżka/do/pliku.ts

# Cofnięcie uncommited changes (wszystkie pliki - OSTROŻNIE!):
git checkout .

# Schowanie zmian na później (bezpieczne):
git stash
git stash list
git stash pop

# ❌ NIE UŻYWAJ (gubisz wszystko):
git reset --hard HEAD
```

### ✅ Commit Best Practices

```
- [ ] Commituj często (małe logiczne kawałki, nie cały feature naraz)
- [ ] Commit message format: "fix: duplicate subscriptions route crash"
- [ ] PRZED commitem: get_errors + Console Ninja check
- [ ] Test po commicie: czy app nadal działa?
```

---

## 🚨 ERROR RECOVERY PLAN

**Gdy coś się crashuje:**

### ✅ Immediate Diagnostics

```
1. [ ] get_errors - wszystkie błędy TypeScript
2. [ ] console-ninja_runtimeErrors - błędy runtime
3. [ ] Vite terminal output - sprawdź czy hot reload crashnął
4. [ ] Browser DevTools Console - F12 → Console tab
5. [ ] Network tab - czy requesty failują? (500, 403, 404?)
```

### ✅ Error Analysis

```
- [ ] Przeczytaj CAŁY stack trace (pierwszy error = root cause)
- [ ] Sprawdź file:line w stack trace - otwórz ten plik
- [ ] Szukaj ostatniej TWOJEJ zmiany przed błędem (git diff)
- [ ] Cofnij ostatnią zmianę i sprawdź czy błąd znika
```

### ✅ Recovery Actions

```
Jeśli TypeScript errors:
  → get_errors + fix każdy error osobno
  → Sprawdź imports i types

Jeśli Runtime crash:
  → Console Ninja stack trace
  → Dodaj try-catch i console.error
  → Restart dev server (Ctrl+C → npm run dev)

Jeśli Database error:
  → mcp_supabase_execute_sql "SELECT * FROM tabela LIMIT 1"
  → Sprawdź RLS policies
  → Sprawdź foreign keys

Jeśli Router nie działa:
  → grep_search 'path="' w App.tsx (duplicate routes?)
  → Sprawdź lazy imports
  → Direct URL test
```

---

## 🛠️ MCP SUPABASE TOOLS

**Konkretne komendy:**

### ✅ Database Exploration

```
- [ ] mcp_supabase_list_tables - lista wszystkich tabel w public schema
- [ ] mcp_supabase_execute_sql "SELECT * FROM payments LIMIT 5" - test danych
- [ ] mcp_supabase_execute_sql "SELECT COUNT(*) FROM payments" - ile rekordów?
- [ ] mcp_supabase_execute_sql "\\d payments" - struktura tabeli (PostgreSQL)
```

### ✅ Security & Performance

```
- [ ] mcp_supabase_get_advisors "security" - RLS policy warnings
- [ ] mcp_supabase_get_advisors "performance" - missing indexes, slow queries
- [ ] mcp_supabase_search_docs "RLS policies" - jak naprawić security issues
```

### ✅ Types & Migrations

```
- [ ] mcp_supabase_generate_typescript_types - regeneruj database.types.ts
- [ ] mcp_supabase_list_migrations - lista applied migrations
- [ ] mcp_supabase_apply_migration - wykonaj nową migrację
```

---

## 🎨 UI/UX TESTING CHECKLIST

**PO dodaniu nowego panelu - systematyczny test:**

### ✅ Navigation Test

```
- [ ] Czy karta na dashboardzie klika się? (sprawdź onclick log w Console Ninja)
- [ ] Czy URL się zmienia po kliknięciu? (sprawdź address bar)
- [ ] Czy strona się ładuje? (nie biały ekran)
- [ ] Czy breadcrumbs/nawigacja pokazuje prawidłową lokację?
- [ ] Test wstecz: kliknij Back w przeglądarce - czy wraca do dashboardu?
```

### ✅ Data Loading Test

```
- [ ] Czy loading spinner się pokazuje? (useEffect delay przed fetch)
- [ ] Czy dane się załadowały? (sprawdź Console Ninja: "DATA LOADED")
- [ ] Czy liczniki pokazują prawidłowe wartości? (compare z database)
- [ ] Czy tabela się renderuje? (payments.length > 0 → rows visible)
- [ ] Test empty state: usuń wszystkie rekordy - czy pokazuje "No data"?
```

### ✅ Filters & Search Test

```
- [ ] Zmień filter (np. status = "pending") - czy lista się aktualizuje?
- [ ] Wpisz w search (np. "subscription") - czy filtruje?
- [ ] Wyczyść search - czy wraca pełna lista?
- [ ] Kombinacja filters + search - czy działa razem?
- [ ] Sprawdź Console Ninja - czy query się wywołuje po każdej zmianie?
```

### ✅ Actions Test

```
- [ ] Kliknij "Download CSV" - czy plik się pobiera?
- [ ] Kliknij "Add New" - czy modal się otwiera?
- [ ] Wypełnij form i Submit - czy rekord się dodaje?
- [ ] Kliknij "Edit" - czy form się wypełnia danymi?
- [ ] Kliknij "Delete" - czy confirmation dialog się pokazuje?
- [ ] Sprawdź database po każdej akcji (SELECT * FROM tabela)
```

### ✅ Error Handling Test

```
- [ ] Wyłącz internet - czy pokazuje error message?
- [ ] Wpisz nieprawidłowe dane - czy walidacja działa?
- [ ] Spróbuj usunąć używany rekord (foreign key) - czy error message?
- [ ] Sprawdź Console Ninja - czy errors są logged?
```

---

## 🎯 FINAL PRE-COMMIT CHECKLIST

**Przed zacommitowaniem zmian:**

```
✅ CODE QUALITY:
- [ ] get_errors = 0 błędów TypeScript
- [ ] console-ninja_runtimeErrors = no errors
- [ ] Wszystkie console.log debug usunięte (zostaw tylko ważne)
- [ ] @ts-nocheck usunięte (lub uzasadnione komentarzem)

✅ FUNCTIONALITY:
- [ ] Wszystkie funkcje przetestowane ręcznie
- [ ] Database zawiera poprawne dane
- [ ] RLS policies działają (test jako user i admin)
- [ ] Navigation działa (karta → panel → back)

✅ GIT:
- [ ] git status - tylko pliki związane z feature
- [ ] git diff - przejrzane wszystkie zmiany
- [ ] Commit message opisowy i konkretny
- [ ] Branch name odpowiedni (feature/payment-system)

✅ DOCUMENTATION:
- [ ] Todo list updated (zaznacz completed)
- [ ] Jeśli nowy endpoint: dodaj komentarz do service
- [ ] Jeśli nowa tabela: dodaj migration do /database-migrations
```
