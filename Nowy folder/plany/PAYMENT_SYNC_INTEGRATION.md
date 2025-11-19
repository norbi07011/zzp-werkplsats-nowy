# 🔗 INTEGRACJA PAYMENT SYNC - INSTRUKCJE

## ⚡ Hook: `usePaymentSync`

Automatyczne synchronizowanie płatności do tabeli `payments` dla wszystkich typów użytkowników.

---

## 📋 Jak używać w panelach

### 1️⃣ WORKER PANEL (WorkerDashboard.tsx)

```typescript
import usePaymentSync from "@/hooks/usePaymentSync";

// W komponencie:
const { syncWorkerSubscription } = usePaymentSync();

// Po udanej płatności Stripe:
const handleSubscriptionPayment = async () => {
  // ... logika płatności Stripe ...

  // ✅ DODAJ TO PO STRIPE SUCCESS:
  await syncWorkerSubscription(
    user.id, // userId
    "basic", // tier: "basic" | "pro" | "premium"
    {
      // Stripe data (optional)
      customerId: stripeCustomerId,
      subscriptionId: stripeSubscriptionId,
      paymentIntentId: paymentIntent.id,
    }
  );

  // Liczniki w /admin/payments się automatycznie zaktualizują! ✅
};
```

**Gdzie dodać:**

- `WorkerDashboard.tsx` - w funkcji po Stripe checkout success
- `WorkerSubscriptionSelectionPage.tsx` - po wyborze planu i płatności

---

### 2️⃣ EMPLOYER PANEL (EmployerDashboard.tsx)

```typescript
import usePaymentSync from "@/hooks/usePaymentSync";

const { syncEmployerSubscription } = usePaymentSync();

// Po udanej płatności:
const handleSubscriptionPayment = async () => {
  // ... Stripe payment ...

  // ✅ SYNC:
  await syncEmployerSubscription(
    employer.profile_id,
    employer.subscription_tier, // "basic" | "pro" | "premium"
    employer.company_name, // Nazwa firmy (optional)
    {
      customerId: stripe_customer_id,
      subscriptionId: stripe_subscription_id,
      paymentIntentId: paymentIntent.id,
    }
  );

  // ✅ MRR w /admin automatycznie rośnie!
};
```

**Gdzie dodać:**

- `EmployerDashboard.tsx` - subscription tab
- `pages/employer/SubscriptionManager.tsx` - po upgrade/downgrade

---

### 3️⃣ CLEANING COMPANY PANEL

```typescript
import usePaymentSync from "@/hooks/usePaymentSync";

const { syncCleaningSubscription } = usePaymentSync();

// Po płatności:
await syncCleaningSubscription(
  cleaningCompany.profile_id,
  cleaningCompany.subscription_tier,
  cleaningCompany.company_name,
  stripeData
);

// ✅ Pojawi się w /admin/payments i /admin/subscriptions!
```

**Gdzie dodać:**

- `CleaningDashboard.tsx` - subscription settings
- Stripe webhook handler

---

### 4️⃣ ACCOUNTANT PANEL

```typescript
import usePaymentSync from "@/hooks/usePaymentSync";

const { syncAccountantSubscription } = usePaymentSync();

// Po płatności:
await syncAccountantSubscription(
  accountant.profile_id,
  accountant.subscription_tier, // "basic" | "pro" | "premium"
  accountant.company_name,
  stripeData
);

// ✅ Dashboard admin pokazuje wszystkie accountant subscriptions!
```

**Gdzie dodać:**

- Accountant dashboard - subscription section
- Stripe success callback

---

### 5️⃣ INVOICE PAYMENT (wszystkie panele)

```typescript
import usePaymentSync from "@/hooks/usePaymentSync";

const { syncInvoicePayment } = usePaymentSync();

// Gdy faktura zostanie opłacona:
await syncInvoicePayment(
  userId,
  invoice.id, // Invoice ID
  invoice.total_gross, // Kwota
  invoice.invoice_number, // Numer faktury
  "bank_transfer" // Metoda płatności
);

// ✅ Faktura pojawi się w /admin/payments!
```

**Gdzie dodać:**

- Invoice module - po zmianie statusu na "paid"
- Webhook od banku/Stripe

---

### 6️⃣ WORKER EARNING (wypłaty)

```typescript
import usePaymentSync from "@/hooks/usePaymentSync();

const { syncWorkerEarning } = usePaymentSync();

// Gdy worker kończy pracę:
await syncWorkerEarning(
  worker.id,
  job.id,
  earning.amount,
  `Job completion - ${job.title}`
);

// ✅ Status: pending (admin musi zatwierdzić wypłatę)
```

**Gdzie dodać:**

- Job completion handler
- Employer acceptance of work

---

## 🔄 AUTOMATYCZNE DZIAŁANIE

Po dodaniu tego hooka:

1. **Worker płaci €13** → rekord w `payments` → MRR +€13 ✅
2. **Employer płaci €49** → rekord w `payments` → MRR +€49 ✅
3. **Cleaning płaci €99** → rekord w `payments` → MRR +€99 ✅
4. **Accountant płaci €79** → rekord w `payments` → MRR +€79 ✅
5. **Faktura paid €500** → rekord w `payments` → Total Revenue +€500 ✅

## 📊 GDZIE WIDAĆ EFEKT

- `/admin` - główny dashboard → licznik MRR
- `/admin/payments` - wszystkie płatności → tabela
- `/admin/subscriptions` - wszystkie subskrypcje → filtrowanie

## 🚀 DEPLOY CHECKLIST

### Przed wdrożeniem:

- [ ] Dodaj `usePaymentSync` w WorkerDashboard (po Stripe success)
- [ ] Dodaj `usePaymentSync` w EmployerDashboard (po Stripe success)
- [ ] Dodaj `usePaymentSync` w CleaningDashboard (po Stripe success)
- [ ] Dodaj `usePaymentSync` w AccountantDashboard (po Stripe success)
- [ ] Dodaj `syncInvoicePayment` w Invoice module (po zmianie status → paid)
- [ ] Przetestuj każdy typ płatności w sandbox
- [ ] Sprawdź czy MRR rośnie po każdej płatności
- [ ] Sprawdź czy `/admin/payments` pokazuje nowe płatności

### Test scenariusze:

```bash
# Test 1: Worker subscription
1. Worker wybiera plan basic (€13)
2. Płaci przez Stripe test
3. Sprawdź /admin/payments → nowy rekord ✅
4. Sprawdź /admin → MRR wzrósł o €13 ✅

# Test 2: Employer subscription
1. Employer wybiera plan pro (€99)
2. Płaci przez Stripe test
3. Sprawdź /admin/payments → nowy rekord ✅
4. Sprawdź /admin → MRR wzrósł o €99 ✅

# Test 3: Invoice payment
1. Utwórz fakturę €500
2. Zmień status na "paid"
3. Sprawdź /admin/payments → nowy rekord ✅
4. Sprawdź Total Revenue wzrósł o €500 ✅
```

---

## 💡 TIPS

1. **Zawsze wywołuj sync PO Stripe success** - nie przed!
2. **Używaj try/catch** - jeśli sync fail, loguj ale nie blokuj płatności
3. **Test mode:** Stripe test keys → sync działa tak samo
4. **Duplicates:** Hook sprawdza czy już istnieje (TODO: dodać deduplikację)

---

## 🔧 TROUBLESHOOTING

**Problem:** Płatność przeszła ale nie ma w /admin/payments

**Rozwiązanie:**

1. Sprawdź Console (F12) - czy `syncPayment` wywołany?
2. Sprawdź czy są błędy RLS (admin policy exists?)
3. Sprawdź czy `user_id` poprawny (auth.uid())

**Problem:** MRR nie rośnie po płatności

**Rozwiązanie:**

1. Odśwież dashboard (F5)
2. Sprawdź czy payment ma `status: 'completed'`
3. Sprawdź czy `payment_type` to `worker_subscription` lub `employer_subscription`

---

## 📝 NEXT STEPS

Po wdrożeniu:

1. Dodaj **deduplikację** (sprawdzaj czy payment już istnieje)
2. Dodaj **webhook Stripe** → auto-sync
3. Dodaj **refund handling** → status: 'refunded'
4. Dodaj **email notifications** → po każdej płatności

---

**✅ Po dodaniu tego hooka: WSZYSTKIE płatności automatycznie w payments table!**
