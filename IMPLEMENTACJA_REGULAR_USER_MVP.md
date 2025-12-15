# 🚀 IMPLEMENTACJA: Regular User + Service Requests (MVP)

**Data:** 9 grudnia 2025  
**Status:** ✅ Backend READY - Frontend TODO  
**Model biznesowy:** Freemium (3 zlecenia/miesiąc za darmo, €9.99/miesiąc premium)

---

## ✅ CO ZOSTAŁO ZROBIONE

### **1. Migracja SQL** ✅

**Plik:** `database-migrations/20251209_regular_user_service_requests.sql`

**Dodane:**

- ✅ Nowa rola `regular_user` w `profiles.role`
- ✅ Nowy `author_type = 'regular_user'` w `posts`
- ✅ Nowy typ postu `service_request` w `posts.type`
- ✅ 10 nowych kolumn w `posts` (request_category, request_location, request_budget_min/max, request_urgency, request_status, itd.)
- ✅ Tabela `regular_users` (profil + freemium subscription + stats)
- ✅ Tabela `service_request_responses` (oferty workerów na zlecenia)
- ✅ 2 triggery (auto-update counters)
- ✅ 1 funkcja `reset_monthly_requests()` (cron job do resetu limitu co miesiąc)
- ✅ RLS policies dla wszystkich tabel (regular_user, worker, admin)

**Aby uruchomić:**

```bash
# Przez MCP Supabase lub psql
psql -h <SUPABASE_HOST> -U postgres -d postgres -f database-migrations/20251209_regular_user_service_requests.sql
```

---

### **2. TypeScript Types** ✅

**Plik:** `src/services/feedService.ts`

**Dodane:**

- ✅ `PostType` rozszerzony o `"service_request"`
- ✅ `AuthorType` rozszerzony o `"regular_user"`
- ✅ `UserType` rozszerzony o `"regular_user"`
- ✅ Interface `Post` - 10 nowych pól dla service*request (request*\*)
- ✅ Interface `RegularUser` (kompletny profil + subscription)
- ✅ Interface `ServiceRequestResponse` (oferta workera)

---

### **3. Backend Functions** ✅

**Plik:** `src/services/feedService.ts` (linie 1722+)

**Dodane 10 funkcji:**

1. `getServiceRequests(filters)` - Pobierz zlecenia (dla workerów z filtrami)
2. `respondToServiceRequest(postId, workerId, response)` - Worker składa ofertę
3. `getRequestResponses(postId)` - Pobierz oferty workerów dla danego zlecenia
4. `acceptWorkerResponse(responseId, postId)` - Regular user akceptuje ofertę
5. `rejectWorkerResponse(responseId)` - Regular user odrzuca ofertę
6. `withdrawResponse(responseId)` - Worker wycofuje ofertę
7. `completeServiceRequest(postId)` - Oznacz zlecenie jako zakończone
8. `cancelServiceRequest(postId)` - Anuluj zlecenie
9. `getRegularUserProfile(userId)` - Pobierz profil regular usera
10. `canCreateServiceRequest(userId)` - Sprawdź limit freemium (3/miesiąc)

---

## 📋 CO TRZEBA JESZCZE ZROBIĆ (Frontend)

### **KROK 1: Rejestracja Regular User** (1h)

**Plik:** `pages/public/RegisterPage.tsx` (lub nowy)

**UI:**

- Radio button: "Jestem pracodawcą" vs "Szukam fachowca" (regular_user)
- Formularz: Imię, Nazwisko, Email, Hasło, Telefon, Miasto
- Submit → Utwórz `profiles.role = 'regular_user'` + rekord w `regular_users`

---

### **KROK 2: Panel Regular User** (2h)

**Lokalizacja:** `pages/regular-user/`

**Struktura:**

```
/regular-user/
  ├── Dashboard.tsx          → Moje Zlecenia (lista)
  ├── CreateRequest.tsx      → Formularz dodawania zlecenia
  └── RequestDetails.tsx     → Szczegóły + oferty workerów
```

**1. Dashboard.tsx:**

- Header: "Moje Zlecenia" + przycisk "Dodaj Zlecenie"
- Stats: Liczba zleceń, zakończonych, średnia ocena
- Freemium badge: "2/3 darmowych zleceń wykorzystanych" (jeśli free)
- Premium CTA: "Upgrade do Premium €9.99/miesiąc = unlimited"
- Lista zleceń (tabs: Otwarte, W realizacji, Zakończone, Anulowane)

**2. CreateRequest.tsx:**

- Walidacja: `canCreateServiceRequest()` przed renderem
- Jeśli limit: Paywall "Osiągnięto limit 3 zleceń. Kup premium!"
- Formularz:
  - Tytuł (input text)
  - Kategoria (select: Hydraulika, Elektryka, Sprzątanie, Naprawa, Ogrodnictwo, Malowanie, Przeprowadzka, Inne)
  - Opis problemu (textarea)
  - Zdjęcia (upload 1-5, opcjonalne dla MVP)
  - Lokalizacja (input text: adres/miasto)
  - Budżet (2 inputy: min-max slider)
  - Pilność (select: Niski, Normalny, Wysoki, Pilne)
  - Preferowana data (date picker, opcjonalne)
  - Metoda kontaktu (checkboxes: telefon, email)
- Submit → `createPost({ type: 'service_request', author_type: 'regular_user', ... })`

**3. RequestDetails.tsx:**

- Nagłówek: Status (badge), liczba ofert
- Sekcja: Szczegóły zlecenia (tytuł, opis, lokalizacja, budżet, pilność)
- Sekcja: Zdjęcia (gallery)
- Sekcja: Oferty workerów (lista kart):
  - Avatar + nazwa + rating + liczba zrealizowanych zleceń
  - Oferowana cena + szacowany czas
  - Wiadomość od workera
  - Przyciski: "Zaakceptuj" / "Odrzuć"
- Po zaakceptowaniu: Pokaż dane kontaktowe workera (telefon + email)

---

### **KROK 3: FeedPage - Nowa zakładka "Zlecenia"** (1h)

**Plik:** `pages/FeedPage_PREMIUM.tsx`

**Zmiany:**

1. Dodaj 4. tab:

```typescript
{ id: 'service_request', label: '🔧 Zlecenia', icon: <Wrench /> }
```

2. Filtrowanie postów:

```typescript
if (activeTab === "service_request") {
  return post.type === "service_request";
}
```

3. Stwórz komponent `ServiceRequestCard.tsx`:

- Nagłówek: Kategoria (badge) + Pilność (🔥 jeśli urgent)
- Tytuł + opis (skrócony)
- Lokalizacja (📍 + miasto)
- Budżet: €50-100
- Status: 🟢 OTWARTE / 🟡 W REALIZACJI / ✅ ZAKOŃCZONE
- Liczba ofert: "3 oferty" (badge)
- **Dla workerów:** Przycisk "Zaproponuj Ofertę" (tylko jeśli request_status = 'open')
- **Dla regular usera (autor):** Link "Zobacz oferty"

---

### **KROK 4: Worker Response Modal** (1.5h)

**Komponent:** `components/RespondToRequestModal.tsx`

**UI:**

- Header: "Zaproponuj Ofertę dla: [Tytuł zlecenia]"
- Formularz:
  - Oferowana cena (number input, EUR)
  - Szacowany czas pracy (number input, godziny)
  - Wiadomość do zleceniodawcy (textarea, 200-500 znaków)
  - Data dostępności (date picker, opcjonalne)
- Submit → `respondToServiceRequest(postId, workerId, { offered_price, estimated_hours, message, availability_date })`
- Po submit: Toast "✅ Twoja oferta została wysłana!"

---

### **KROK 5: Routing & Auth** (30 min)

**Plik:** `App.tsx`

**Dodaj:**

```typescript
<ProtectedRoute requiredRole="regular_user">
  <Route path="/regular-user/dashboard" element={<RegularUserDashboard />} />
  <Route path="/regular-user/create-request" element={<CreateRequest />} />
  <Route path="/regular-user/request/:id" element={<RequestDetails />} />
</ProtectedRoute>

<ProtectedRoute requiredRole="worker">
  <Route path="/worker/service-requests" element={<ServiceRequestsList />} />
</ProtectedRoute>
```

**AuthContext:**
Dodaj obsługę `regular_user` w `canUserCreatePosts()`:

```typescript
if (role === "regular_user") {
  // Check freemium limit
  const { can } = await canCreateServiceRequest(userId);
  return can;
}
```

---

## 🎨 UI/UX MOCKUP

### **ServiceRequestCard (w Feed):**

```
┌─────────────────────────────────────────────────────────────┐
│ 🔧 HYDRAULIKA             🔥 PILNE         🟢 OTWARTE       │
├─────────────────────────────────────────────────────────────┤
│ **Zepsuł mi się kran w kuchni**                            │
│ Rano zauważyłem przeciek pod zlewem. Potrzebuję hydraulika │
│ jak najszybciej...                                          │
│                                                             │
│ 📍 Amsterdam, Centrum                                       │
│ 💰 Budżet: €50-100                                          │
│ 🕒 Preferowana data: Dzisiaj/Jutro                         │
│                                                             │
│ [3 oferty]                    [⚡ Zaproponuj Ofertę]       │
└─────────────────────────────────────────────────────────────┘
```

### **Worker Response Modal:**

```
┌───────────────────────────────────────────────────────┐
│ Zaproponuj Ofertę dla: "Zepsuł mi się kran"         │
├───────────────────────────────────────────────────────┤
│                                                       │
│ Oferowana cena (EUR):                                 │
│ ┌─────────────────────────────────────────┐           │
│ │  75                                     │           │
│ └─────────────────────────────────────────┘           │
│                                                       │
│ Szacowany czas pracy (godziny):                       │
│ ┌─────────────────────────────────────────┐           │
│ │  2                                      │           │
│ └─────────────────────────────────────────┘           │
│                                                       │
│ Wiadomość dla zleceniodawcy:                          │
│ ┌─────────────────────────────────────────┐           │
│ │ Jestem hydraulikiem z 10-letnim         │           │
│ │ doświadczeniem. Mogę przyjechać dzisiaj │           │
│ │ po 16:00. Mam własne narzędzia...       │           │
│ └─────────────────────────────────────────┘           │
│                                                       │
│ Data dostępności (opcjonalne):                        │
│ ┌─────────────────────────────────────────┐           │
│ │  2025-12-09                             │           │
│ └─────────────────────────────────────────┘           │
│                                                       │
│            [Anuluj]    [Wyślij Ofertę]               │
└───────────────────────────────────────────────────────┘
```

### **Request Details - Lista Ofert:**

```
┌─────────────────────────────────────────────────────────────┐
│ Oferty (3)                                                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ┌───────────────────────────────────────────────────────┐  │
│ │ 👤 Jan Kowalski    ⭐ 4.8    ✅ 142 zlecenia          │  │
│ │                                                       │  │
│ │ 💰 Cena: €75      🕒 Czas: 2h      📅 Dzisiaj 16:00  │  │
│ │                                                       │  │
│ │ "Jestem hydraulikiem z 10-letnim doświadczeniem.     │  │
│ │ Mogę przyjechać dzisiaj po 16:00..."                 │  │
│ │                                                       │  │
│ │        [❌ Odrzuć]         [✅ Zaakceptuj]            │  │
│ └───────────────────────────────────────────────────────┘  │
│                                                             │
│ ┌───────────────────────────────────────────────────────┐  │
│ │ 👤 Piotr Nowak     ⭐ 4.6    ✅ 89 zlecenia           │  │
│ │ 💰 Cena: €60      🕒 Czas: 1.5h    📅 Jutro 9:00     │  │
│ │ "Specjalizuję się w naprawach..."                    │  │
│ │        [❌ Odrzuć]         [✅ Zaakceptuj]            │  │
│ └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 💰 FREEMIUM MODEL - IMPLEMENTACJA

### **1. Sprawdzanie limitu przed utworzeniem zlecenia:**

```typescript
// CreateRequest.tsx
useEffect(() => {
  const checkLimit = async () => {
    const { can, reason } = await canCreateServiceRequest(user.id);
    if (!can) {
      setShowPaywall(true);
      setPaywallReason(reason);
    }
  };
  checkLimit();
}, [user]);

if (showPaywall) {
  return (
    <div className="paywall">
      <h2>⚠️ Limit Osiągnięty</h2>
      <p>{paywallReason}</p>
      <button onClick={() => navigate("/premium")}>
        🚀 Upgrade do Premium - €9.99/miesiąc
      </button>
    </div>
  );
}
```

### **2. Premium Badge w Dashboard:**

```typescript
{
  !user.is_premium && (
    <div className="freemium-badge">
      📊 {user.requests_this_month} / {user.free_requests_limit} darmowych
      zleceń
      <button>Upgrade do Premium</button>
    </div>
  );
}

{
  user.is_premium && (
    <div className="premium-badge">
      ✨ Premium Active - Unlimited Requests
      <span>Ważne do: {new Date(user.premium_until).toLocaleDateString()}</span>
    </div>
  );
}
```

### **3. Reset countera co miesiąc (cron job):**

**Supabase Edge Function lub zewnętrzny cron:**

```typescript
// Wywołaj 1-go dnia miesiąca o 00:00
await supabase.rpc("reset_monthly_requests");
```

---

## 🧪 TESTY DO WYKONANIA

### **Test 1: Regular user może utworzyć zlecenie (free limit 3)**

- [ ] Zarejestruj regular_user
- [ ] Utwórz zlecenie #1 → ✅ SUCCESS
- [ ] Utwórz zlecenie #2 → ✅ SUCCESS
- [ ] Utwórz zlecenie #3 → ✅ SUCCESS
- [ ] Utwórz zlecenie #4 → ❌ PAYWALL "Osiągnięto limit"

### **Test 2: Worker może składać oferty**

- [ ] Zaloguj jako worker
- [ ] Otwórz FeedPage → tab "Zlecenia"
- [ ] Kliknij "Zaproponuj Ofertę" na zleceniu
- [ ] Wypełnij formularz (cena, czas, wiadomość)
- [ ] Submit → ✅ Oferta zapisana w `service_request_responses`
- [ ] Regular user widzi ofertę w swoim panelu

### **Test 3: Regular user akceptuje ofertę**

- [ ] Zaloguj jako regular_user (autor zlecenia)
- [ ] Otwórz swoje zlecenie → "Zobacz oferty"
- [ ] Kliknij "Zaakceptuj" na jednej ofercie
- [ ] Status zlecenia zmienia się na "W realizacji"
- [ ] Inne oferty automatycznie odrzucone
- [ ] Pokaż dane kontaktowe wybranego workera

### **Test 4: Premium user ma unlimited requests**

- [ ] Utwórz regular_user z `is_premium = TRUE`
- [ ] Utwórz 10+ zleceń
- [ ] Wszystkie powinny się zapisać (brak limitu)

### **Test 5: Worker nie może tworzyć service_request**

- [ ] Zaloguj jako worker
- [ ] Próbuj wywołać `createPost({ type: 'service_request', author_type: 'worker' })`
- [ ] ❌ CHECK constraint violation (expected behavior)

---

## 📊 METRYKI SUKCESU

**KPI do śledzenia:**

- Liczba regular users
- Liczba utworzonych zleceń (dziennie/miesięcznie)
- Conversion rate: zlecenie → oferta od workera
- Conversion rate: oferta → akceptacja
- Premium conversion rate (free → premium)
- Średnia liczba ofert per zlecenie
- Średnia cena oferty
- Czas odpowiedzi workera (time to first response)

---

## 🚀 DEPLOYMENT CHECKLIST

- [ ] Uruchomić migrację SQL `20251209_regular_user_service_requests.sql`
- [ ] Zweryfikować constraints: `profiles_role_check`, `posts_author_type_check`, `posts_type_check`
- [ ] Sprawdzić czy tabele `regular_users` i `service_request_responses` istnieją
- [ ] Przetestować RLS policies (worker, regular_user, admin)
- [ ] Zaimplementować frontend (5-6h)
- [ ] Dodać cron job `reset_monthly_requests()` (1-go dnia miesiąca)
- [ ] Skonfigurować payment gateway dla premium (Stripe/Mollie)
- [ ] Ustawić email notifications (nowa oferta, akceptacja)

---

## 🎯 TIMELINE

**Dzisiaj (9 grudnia):**

- ✅ Migracja SQL (DONE)
- ✅ Backend functions (DONE)
- ✅ TypeScript types (DONE)

**Jutro (10 grudnia):**

- [ ] RegisterPage dla regular_user (1h)
- [ ] Regular User Dashboard (2h)
- [ ] CreateRequest.tsx (1.5h)
- [ ] FeedPage - zakładka Zlecenia (1h)

**Pojutrze (11 grudnia):**

- [ ] ServiceRequestCard component (1h)
- [ ] RespondToRequestModal (1.5h)
- [ ] RequestDetails + lista ofert (2h)
- [ ] Testy end-to-end (1h)

**TOTAL:** ~10-12h implementacji frontend

---

**✅ Backend GOTOWY! Możemy zacząć frontend kiedy chcesz!** 🚀
