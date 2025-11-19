# 🎯 SMART NOTIFICATIONS - KIEDY WYSYŁAĆ POWIADOMIENIE?

**Data:** 13.11.2025  
**Założenie:** 100,000+ userów na platformie  
**Cel:** Tylko WAŻNE powiadomienia, zero spam!

---

## ✅ POWIADOMIENIA - TAK (CRITICAL EVENTS)

### **1. SPOTKANIA (APPOINTMENTS) 📅**

```
TRIGGER: appointment.created
KTO: Admin + Worker + Employer/Company
KIEDY: Ktoś umawia spotkanie
POWIADOMIENIE:
  → Admin: "📅 Nowe spotkanie: Jan Kowalski + ABC Company (2025-11-15 10:00)"
  → Worker: "✅ Spotkanie potwierdzone: ABC Company (2025-11-15 10:00)"
  → Employer: "✅ Spotkanie potwierdzone: Jan Kowalski (2025-11-15 10:00)"

TRIGGER: appointment.reminder_24h
KTO: Worker + Employer/Company
KIEDY: 24 godziny przed spotkaniem
POWIADOMIENIE:
  → Worker: "⏰ Przypomnienie: Spotkanie jutro o 10:00 z ABC Company"
  → Employer: "⏰ Przypomnienie: Spotkanie jutro o 10:00 z Jan Kowalski"

TRIGGER: appointment.reminder_1h
KTO: Worker + Employer/Company
KIEDY: 1 godzina przed spotkaniem
POWIADOMIENIE:
  → Worker: "🔔 Za godzinę: Spotkanie z ABC Company (10:00)"
  → Employer: "🔔 Za godzinę: Spotkanie z Jan Kowalski (10:00)"

TRIGGER: appointment.cancelled
KTO: Worker + Employer/Company + Admin
KIEDY: Ktoś anuluje spotkanie
POWIADOMIENIE:
  → Admin: "❌ Spotkanie anulowane: Jan Kowalski + ABC Company"
  → Worker: "❌ Spotkanie anulowane przez ABC Company"
  → Employer: "❌ Spotkanie anulowane przez Jan Kowalski"

TRIGGER: appointment.rescheduled
KTO: Worker + Employer/Company + Admin
KIEDY: Ktoś przesuwa spotkanie
POWIADOMIENIE:
  → Admin: "🔄 Spotkanie przesunięte: 2025-11-15 → 2025-11-16"
  → Worker: "🔄 Spotkanie przesunięte na 2025-11-16 10:00"
  → Employer: "🔄 Spotkanie przesunięte na 2025-11-16 10:00"

CZĘSTOTLIWOŚĆ: ~20-100/dzień (zależy od aktywności)
SPAM RISK: ❌ NIE (ważne dla organizacji czasu)
```

### **2. PIENIĄDZE (PAYMENTS) 💰**

```
TRIGGER: payment.created
KTO: Admin
KIEDY: Employer/Company wpłaca pieniądze
POWIADOMIENIE:
  → Admin: "💰 Nowa płatność €50 od Employer XYZ"
  → Employer: "✅ Płatność €50 potwierdzona"

PRZYKŁAD:
  Employer zapłacił €50 (14:30:00)
  → Admin dostaje notyfikację
  → Employer dostaje potwierdzenie email

CZĘSTOTLIWOŚĆ: ~10-50/dzień (zależy od ruchu)
SPAM RISK: ❌ NIE (to pieniądze, zawsze ważne!)
```

### **2. CERTYFIKATY (CERTIFICATES) 📜**

```
TRIGGER: certificate.uploaded
KTO: Admin
KIEDY: Worker uploaduje certyfikat do weryfikacji
POWIADOMIENIE:
  → Admin: "📜 Nowy certyfikat do weryfikacji: VCA - Jan Kowalski"
  → Worker: "✅ Certyfikat VCA wysłany do weryfikacji"

TRIGGER: certificate.verified
KTO: Worker
KIEDY: Admin weryfikuje certyfikat
POWIADOMIENIE:
  → Worker: "🎉 Certyfikat VCA został zweryfikowany!"

TRIGGER: certificate.expiring_soon
KTO: Worker
KIEDY: Certyfikat wygasa za 7/14/30 dni
POWIADOMIENIE:
  → Worker: "⚠️ Certyfikat VCA wygasa za 7 dni! Odnów teraz."

CZĘSTOTLIWOŚĆ: ~5-20/dzień (upload) + 1-5/dzień (weryfikacja)
SPAM RISK: ❌ NIE (ważne dla compliance)
```

### **3. SUBSKRYPCJE (SUBSCRIPTIONS) 📝**

```
TRIGGER: subscription.created
KTO: Admin
KIEDY: User wykupuje Premium/Basic
POWIADOMIENIE:
  → Admin: "📝 Nowa subskrypcja: Premium (€29/mies) - Jan Kowalski"
  → User: "🎉 Subskrypcja Premium aktywna!"

TRIGGER: subscription.expiring_soon
KTO: User
KIEDY: Subskrypcja wygasa za 3/7 dni
POWIADOMIENIE:
  → User: "⚠️ Subskrypcja Premium wygasa za 3 dni. Odnów?"

TRIGGER: subscription.cancelled
KTO: Admin + User
KIEDY: User anuluje subskrypcję
POWIADOMIENIE:
  → Admin: "❌ Subskrypcja anulowana: Jan Kowalski"
  → User: "Subskrypcja anulowana. Pozostało 5 dni."

CZĘSTOTLIWOŚĆ: ~5-15/dzień
SPAM RISK: ❌ NIE (przychód!)
```

### **4. REJESTRACJE (REGISTRATIONS) 👤**

```
TRIGGER: user.registered
KTO: Admin
KIEDY: Nowy user zakłada konto
POWIADOMIENIE:
  → Admin: "👤 Nowa rejestracja: Anna Nowak (Worker)"
  → User: "🎉 Witamy na ZZP Werkplaats!"

CZĘSTOTLIWOŚĆ: ~20-100/dzień (zależy od marketingu)
SPAM RISK: ⚠️ MOŻE BYĆ! (jeśli 100+ dziennie → grupuj)

ROZWIĄZANIE - GRUPOWANIE:
  Zamiast 100 powiadomień:
  → "👤 100 nowych rejestracji dzisiaj (50 Workers, 30 Employers, 20 Companies)"

  Lub co godzinę:
  → "👤 15 nowych rejestracji (10:00-11:00)"
```

### **5. NIEAKTYWNE KONTA (INACTIVE ACCOUNTS) ⚠️**

```
TRIGGER: user.inactive_60_days
KTO: Nieaktywny User
KIEDY: User nie logował się 60 dni
POWIADOMIENIE:
  → User: "😢 Tęsknimy za Tobą! Wróć i sprawdź nowe oferty pracy."

TRIGGER: user.inactive_90_days
KTO: Nieaktywny User (ostatni reminder)
KIEDY: User nie logował się 90 dni
POWIADOMIENIE:
  → User: "⚠️ Twoje konto będzie dezaktywowane za 30 dni."

CZĘSTOTLIWOŚĆ: ~50-200/dzień (batch job raz dziennie)
SPAM RISK: ❌ NIE (wysyłamy raz na 30 dni do tego samego usera)
```

---

## ❌ POWIADOMIENIA - NIE (SPAM EVENTS)

### **1. LOGOWANIA (LOGINS) ❌❌❌**

```
TRIGGER: user.login
PRZYKŁAD: "Jan Kowalski zalogował się (14:23:15)"

DLACZEGO NIE?
  100,000 userów × 2 loginy/dzień = 200,000 powiadomień/dzień!
  = 8,333 powiadomień/godzinę
  = 138 powiadomień/minutę
  = 2.3 powiadomienia/sekundę

WYJĄTEK - TYLKO:
  → Admin login z nieznanego IP (security alert)
  → Failed login attempts >5 (brute force attack)
```

### **2. PRZEGLĄDANIE (BROWSING) ❌**

```
❌ User otworzył stronę job offer
❌ User kliknął "Zobacz więcej"
❌ User scrollował listę
❌ User przeczytał wiadomość

DLACZEGO NIE?
  To NORMALNA aktywność, nie wymaga powiadomienia!
```

### **3. APLIKACJE NA JOBY (JOB APPLICATIONS) ⚠️**

```
TRIGGER: job.application_submitted
PRZYKŁAD: "Worker zaaplikował na job: Budowlaniec - Warszawa"

CZĘSTOTLIWOŚĆ:
  100 jobów × 50 aplikacji/job = 5,000 aplikacji/dzień
  = 208/godzinę = TOO MUCH!

ROZWIĄZANIE - GRUPOWANIE:
  Zamiast 50 powiadomień:
  → Employer: "📨 15 nowych aplikacji na 'Budowlaniec - Warszawa' (ostatnia godzina)"

  Lub dzienne podsumowanie:
  → Employer: "📊 Dzisiejsze aplikacje: 45 (Job A: 20, Job B: 15, Job C: 10)"
```

### **4. WIADOMOŚCI (MESSAGES) ⚠️**

```
TRIGGER: message.received
PRZYKŁAD: "Otrzymałeś wiadomość od Jan Kowalski"

CZĘSTOTLIWOŚĆ: Może być duża!

ROZWIĄZANIE - THROTTLING:
  → Pierwsze powiadomienie: natychmiast
  → Kolejne w ciągu 1h: zgrupowane
  → Przykład: "💬 3 nowe wiadomości od Jan Kowalski"
```

---

## 🎯 FINAL RULES - SMART NOTIFICATION SYSTEM

### **KATEGORIE POWIADOMIEŃ:**

#### **🔴 CRITICAL (wysyłaj zawsze, natychmiast)**

```
✅ appointment.created         → Admin + Worker + Employer
✅ appointment.cancelled       → Admin + Worker + Employer
✅ appointment.rescheduled     → Admin + Worker + Employer
✅ appointment.reminder_1h     → Worker + Employer
✅ payment.created             → Admin + User
✅ payment.failed              → Admin + User
✅ subscription.created        → Admin + User
✅ subscription.expired        → User
✅ certificate.verified        → User
✅ certificate.rejected        → User
✅ certificate.expiring_7days  → User
✅ security.unknown_ip_login   → Admin + User
✅ security.failed_login_5x    → Admin
```

#### **🟡 IMPORTANT (wysyłaj, ale grupuj jeśli >10/godzinę)**

```
✅ appointment.reminder_24h    → Worker + Employer (grupuj jeśli >10/dzień)
✅ user.registered             → Admin (grupuj co godzinę)
✅ certificate.uploaded        → Admin (grupuj co godzinę)
✅ job.application_submitted   → Employer (grupuj co godzinę)
✅ message.received            → User (grupuj jeśli >3 w 1h)
```

#### **🟢 INFORMATIONAL (wysyłaj batch raz dziennie)**

```
✅ user.inactive_60_days      → User (batch 09:00)
✅ job.new_match              → Worker (batch 10:00)
✅ daily_summary              → Admin (batch 18:00)
```

#### **⚪ LOGGED ONLY (zapisz w activity_log, NIE wysyłaj)**

```
❌ user.login                 → Activity Log only
❌ user.logout                → Activity Log only
❌ page.viewed                → Activity Log only (opcjonalnie)
❌ button.clicked             → NIE loguj (za dużo)
```

---

## 📊 PANEL ADMINA - 4 KOLUMNY

### **LAYOUT:**

```tsx
<div className="grid grid-cols-4 gap-6">
  {/* Kolumna 1: PŁATNOŚCI */}
  <Card title="💰 Płatności (dzisiaj)">
    {payments.map((p) => (
      <div>
        <span>€{p.amount}</span>
        <span>{p.employer_name}</span>
        <span>{p.created_at}</span>
      </div>
    ))}
  </Card>

  {/* Kolumna 2: CERTYFIKATY */}
  <Card title="📜 Certyfikaty (pending)">
    {certificates.map((c) => (
      <div>
        <span>
          {c.type} - {c.worker_name}
        </span>
        <span>{c.status}</span>
        <Button onClick={() => verify(c.id)}>Weryfikuj</Button>
      </div>
    ))}
  </Card>

  {/* Kolumna 3: SUBSKRYPCJE */}
  <Card title="📝 Subskrypcje (dzisiaj)">
    {subscriptions.map((s) => (
      <div>
        <span>
          {s.plan} - {s.user_name}
        </span>
        <span>€{s.price}/mies</span>
      </div>
    ))}
  </Card>

  {/* Kolumna 4: REJESTRACJE */}
  <Card title="👤 Rejestracje (dzisiaj)">
    {registrations.map((r) => (
      <div>
        <span>{r.name}</span>
        <span>{r.role}</span>
        <span>{r.created_at}</span>
      </div>
    ))}
  </Card>
</div>;

{
  /* Rząd 2: NIEAKTYWNE KONTA */
}
<Card title="⚠️ Nieaktywne Konta (>60 dni)" className="mt-6">
  <Table>
    {inactiveUsers.map((u) => (
      <tr>
        <td>{u.name}</td>
        <td>Ostatnie login: {u.last_login}</td>
        <td>
          <Button onClick={() => sendReminder(u.id)}>Przypomnij</Button>
        </td>
      </tr>
    ))}
  </Table>
</Card>;
```

---

## 🚀 IMPLEMENTATION PLAN

### **FAZA 1: ACTIVITY LOG (2h)**

```sql
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY,
  user_id UUID,
  action TEXT NOT NULL,          -- 'payment.created', 'certificate.uploaded'
  category TEXT NOT NULL,        -- 'payment', 'certificate', 'subscription', 'user'
  details JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index
CREATE INDEX idx_activity_logs_category ON activity_logs(category, created_at DESC);
CREATE INDEX idx_activity_logs_user ON activity_logs(user_id, created_at DESC);
```

### **FAZA 2: SMART NOTIFICATIONS (5h)**

```sql
CREATE TABLE notification_rules (
  id UUID PRIMARY KEY,
  event TEXT UNIQUE NOT NULL,    -- 'payment.created'
  priority TEXT NOT NULL,        -- 'critical', 'important', 'informational'
  throttle_minutes INTEGER,      -- NULL = natychmiast, 60 = grupuj co godzinę
  batch_time TIME,               -- '09:00' = wysyłaj batch o 9 rano
  enabled BOOLEAN DEFAULT true
);

-- Seed data
INSERT INTO notification_rules (event, priority, throttle_minutes) VALUES
  ('payment.created', 'critical', NULL),           -- natychmiast
  ('certificate.uploaded', 'important', 60),       -- grupuj co godzinę
  ('user.registered', 'important', 60),            -- grupuj co godzinę
  ('user.inactive_60_days', 'informational', NULL); -- batch raz dziennie
```

### **FAZA 3: ADMIN DASHBOARD (3h)**

```tsx
// pages/Admin/ActivityMonitor.tsx (nowy!)
- 4 kolumny: Płatności, Certyfikaty, Subskrypcje, Rejestracje
- Real-time updates (Supabase subscriptions)
- Nieaktywne konta (lista + "Przypomnij" button)
```

---

## ✅ PODSUMOWANIE

**CHCESZ:**

```
✅ Activity Log (wszystkie akcje recorded)
✅ Smart Notifications (tylko ważne, nie spam)
✅ Panel 4 kolumny (płatności, certyfikaty, subskrypcje, rejestracje)
✅ Nieaktywne konta (>60 dni = reminder)
✅ Grupowanie (jeśli >10 eventów/godzinę)
✅ Zero spam (NO login notifications!)
```

**NIE CHCESZ:**

```
❌ Powiadomienie za każde logowanie (spam!)
❌ Powiadomienie za każde kliknięcie
❌ 100,000 notyfikacji/dzień
```

---

**Koniec analizy**  
**Czy to jest TO co chcesz?** 🎯
