# 🔴 INSTRUKCJA DEBUGOWANIA TOAST NOTIFICATIONS

## KROK 1: Restart Dev Server
```bash
# W terminalu Vite:
1. Naciśnij Ctrl+C
2. npm run dev
```

## KROK 2: Hard Refresh przeglądarki
```
1. Naciśnij Ctrl+Shift+R (lub Cmd+Shift+R na Mac)
2. Lub otwórz DevTools (F12) → Network tab → Disable cache checkbox
```

## KROK 3: Test Toast Notifications

### Test 1: Admin Panel (SupportTicketsManager)
1. Idź do `/admin/support`
2. Kliknij jakiś ticket
3. Napisz wiadomość i kliknij "Send"
4. **SPODZIEWAJ SIĘ:** Toast w prawym górnym rogu "✅ Wiadomość wysłana"

### Test 2: User Modal (SupportTicketModal)
1. Jako user (nie admin) otwórz modal supportu
2. Stwórz nowy ticket
3. **SPODZIEWAJ SIĘ:** Toast "✅ Zgłoszenie utworzone!"

## KROK 4: Sprawdź Browser Console (F12)

Szukaj błędów związanych z Sonner:
```
❌ "Cannot find module 'sonner'"
❌ "Toaster is not defined"
❌ "toast is not a function"
```

## KROK 5: Jeśli nadal nie działa

### A) Sprawdź czy Sonner renderuje się w DOM:
1. F12 → Elements tab
2. Ctrl+F → Szukaj "sonner"
3. Powinien być `<ol data-sonner-toaster>` element

### B) Sprawdź z-index (może toast jest pod modalem):
1. F12 → Elements → `<ol data-sonner-toaster>`
2. Computed styles → z-index powinien być > 9999

### C) Wymuszony test (dodaj debug):
W SupportTicketsManager.tsx, linia ~149, **PRZED** `toast.success()` dodaj:
```tsx
console.log("🔥 TOAST TEST:", { toast });
toast.success("✅ Wiadomość wysłana");
```

Jeśli w console widzisz `toast: function` → Sonner załadowany OK
Jeśli `toast: undefined` → Import failed

## KROK 6: Nuclear Option (jeśli nic nie pomogło)

```bash
# Wyczyść node_modules i przeinstaluj:
rm -r node_modules
rm package-lock.json
npm install
npm run dev
```

---

## 🎯 CO POWINNO DZIAŁAĆ:

✅ Toast pokazuje się w prawym górnym rogu
✅ Ma kolor zielony (success) lub czerwony (error)
✅ Znika automatycznie po 3-4 sekundach
✅ Ma emoji ✅ lub ❌
✅ Można zamknąć X przyciskiem

## ❌ CO NIE POWINNO SIĘ DZIAĆ:

❌ Stare alert() dialogi (brzydkie okienka przeglądarki)
❌ Białe okno "OK" button
❌ Brak jakiejkolwiek notyfikacji
