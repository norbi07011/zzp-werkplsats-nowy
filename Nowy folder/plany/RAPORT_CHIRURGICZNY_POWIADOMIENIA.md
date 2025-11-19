# 🔔 RAPORT CHIRURGICZNY - SYSTEM POWIADOMIEŃ & AUDIT LOG

**Data:** 13.11.2025  
**Status:** ⚠️ ISTNIEJE ale wymaga DUŻEJ PRZEBUDOWY

---

## 🎯 TWOJE WYMAGANIA

**Cytat:**

> "chce miec powiadomienia na wysokim poziomie... nie ze bedzie co 30 sekund powiqadomienie przychodzic ale to bedzie **baza danych powiadomien caleh apki** wiec musi miec w srodku ładny panel i ładnie sie wszysko wswietlac **kto co zrobbnił ujaka czynnosc** czyli wszysko co wchodzi na panel admina"

### **Interpretacja:**

1. ✅ **System Powiadomień** - wysyłanie notyfikacji do userów
2. ✅ **Activity Log / Audit Trail** - KAŻDA czynność w systemie (kto, co, kiedy)
3. ✅ **Admin Panel** - przeglądanie wszystkich akcji na platformie
4. ❌ **NIE spam** - inteligentne powiadomienia (nie co 30 sekund)

### **To są DWA SYSTEMY:**

#### **SYSTEM 1: Notifications (dla userów)**

```
User otrzymuje powiadomienie:
- "Nowa oferta pracy dla Ciebie" 🎉
- "Twój certyfikat VCA wygasa za 7 dni" ⚠️
- "Otrzymałeś wiadomość od pracodawcy" 💬
- "Płatność została zaksięgowana" 💰
```

#### **SYSTEM 2: Activity Log / Audit Trail (dla admina)**

```
Admin widzi WSZYSTKIE akcje:
- Jan Kowalski zalogował się (2025-11-13 14:23:15)
- Admin utworzył ofertę pracy "Budowlaniec - Warszawa" (2025-11-13 14:25:00)
- Employer dodał payment €50 (2025-11-13 14:30:12)
- Worker zaaplikował na job #123 (2025-11-13 14:35:45)
- Admin usunął użytkownika ID:xyz (2025-11-13 14:40:00)
```

**❓ PYTANIE:** Chcesz OBA systemy czy tylko Activity Log?

---

## 🔍 CO ISTNIEJE TERAZ - ANALIZA

### **1️⃣ Tabela `notifications` (baza danych)**

**Lokalizacja:** `database/FINAL_SCHEMA.sql` linie 864-900

**Struktura:**

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,               -- Dla kogo powiadomienie
  type TEXT NOT NULL,                  -- 'push', 'email', 'sms', 'in_app'
  title TEXT NOT NULL,                 -- "Nowa oferta pracy"
  message TEXT NOT NULL,               -- "Sprawdź ofertę..."
  link TEXT,                           -- URL do akcji (np. /jobs/123)
  data JSONB,                          -- Dodatkowe dane (flexible)

  -- Status
  read BOOLEAN DEFAULT false,
  read_at TIMESTAMP,

  -- Kanały wysyłki
  sent_email BOOLEAN DEFAULT false,
  sent_sms BOOLEAN DEFAULT false,
  sent_push BOOLEAN DEFAULT false,

  -- Metadata
  priority TEXT DEFAULT 'normal',     -- 'low', 'normal', 'high', 'urgent'
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,               -- Auto-usuwanie starych

  CONSTRAINT priority_check CHECK (priority IN ('low', 'normal', 'high', 'urgent'))
);

-- Indexes
CREATE INDEX idx_notifications_priority
  ON notifications(priority)
  WHERE priority IN ('high', 'urgent');
```

**✅ CO DZIAŁA:**

- ✅ Struktura jest dobra (user_id, type, title, message)
- ✅ Priority levels (low → urgent)
- ✅ Multi-channel tracking (email, sms, push)
- ✅ JSONB data dla flexibility
- ✅ Read tracking (read, read_at)
- ✅ Expiration (auto-cleanup)

**❌ CO BRAKUJE:**

- ❌ **Brak tabeli `activity_logs`!** (audit trail)
- ❌ **Brak notification_templates** (szablony powtarzalnych powiadomień)
- ❌ **Brak notification_settings** (preferencje userów - czy chce email/sms?)
- ❌ **Brak group notifications** (wysyłka do wielu userów naraz)

---

### **2️⃣ NotificationsManager Panel**

**Lokalizacja:** `pages/Admin/NotificationsManager.tsx` (773 linii)

**Co ma:**

```tsx
// Stats
- Wysłane (total_sent)
- Dostarczone (total_delivered)
- Przeczytane (total_read)
- Błędy (total_failed)
- Delivery rate (%)
- Read rate (%)

// Filters
- Type: push, email, sms, in_app
- Status: pending, sent, delivered, read, failed
- Search: title, message

// Actions
- Create notification (single user)
- Mark as read
- Mark all as read (dla usera)
- Edit notification
- Delete notification

// Templates Tab
- Create template
- Edit template
- Delete template
```

**✅ CO DZIAŁA:**

- ✅ UI jest ładny (gradient design)
- ✅ Stats cards (metryki)
- ✅ Filters działają (type, status, search)
- ✅ CRUD operations (create, read, update, delete)

**❌ CO NIE DZIAŁA / BRAKUJE:**

#### **Problem 1: Brak ACTIVITY LOG!**

```tsx
// NIE MA takiego widoku:
- Kto się zalogował
- Kto utworzył job
- Kto dodał payment
- Kto usunął usera
```

#### **Problem 2: Notification jest dla JEDNEGO usera**

```tsx
// Masz:
createNotification({ user_id: "123", title: "...", message: "..." });

// NIE MASZ:
bulkCreateNotifications({
  user_ids: ["123", "456", "789"],
  title: "...",
  message: "...",
});
```

#### **Problem 3: Brak inteligentnych reguł**

```tsx
// NIE MA:
- Throttling (max 3 powiadomienia/godzinę)
- Grouping (połącz podobne powiadomienia)
- Quiet hours (nie wysyłaj 23:00-07:00)
- User preferences (czy user chce email/sms?)
```

#### **Problem 4: Brak automatyzacji**

```tsx
// Wszystkie powiadomienia MANUALNE (admin tworzy ręcznie)
// NIE MA auto-triggers:
- User zarejestrował się → "Witaj na platformie!"
- Job posted → "Nowa oferta dla Ciebie"
- Certificate expires in 7 days → "Odnów certyfikat"
- Payment completed → "Płatność potwierdzona"
```

---

### **3️⃣ Hook `useNotifications.ts`**

**Lokalizacja:** `src/hooks/useNotifications.ts` (265 linii)

**Funkcje:**

```typescript
fetchNotifications(userId?)        // Pobierz wszystkie lub dla usera
createNotification(data)           // Utwórz nowe
updateNotification(id, updates)    // Edytuj
deleteNotification(id)             // Usuń
markAsRead(id)                     // Przeczytaj
markAllAsRead(userId)              // Przeczytaj wszystkie

// Templates
fetchTemplates()
createTemplate(data)
updateTemplate(id, updates)
deleteTemplate(id)

// Stats
getNotificationStats(userId?)      // Metryki

// Advanced (ale nie działa?)
bulkCreateNotifications()          // Bulk send
sendNotification()                 // Trigger wysyłki
```

**✅ CO DZIAŁA:**

- ✅ CRUD operations
- ✅ Stats computation
- ✅ Filtering (unread, read, pending, failed)

**❌ CO NIE DZIAŁA:**

- ❌ `bulkCreateNotifications()` - tylko definicja, brak logiki
- ❌ `sendNotification()` - brak integrac ji (Mailgun, Twilio, FCM)
- ❌ Real-time updates (Supabase subscriptions)

---

## 🚨 NAJWIĘKSZE PROBLEMY

### **PROBLEM #1: BRAK ACTIVITY LOG / AUDIT TRAIL** ⚠️⚠️⚠️

**Ty chcesz:**

> "ładnie sie wszysko wswietlac kto co zrobbnił ujaka czynnosc czyli wszysko co wchodzi na panel admina"

**Aktualnie:**

- ❌ **BRAK tabeli `activity_logs`**
- ❌ **BRAK logowania akcji** (login, create job, delete user)
- ❌ **BRAK panelu** do przeglądania historii

**Co trzeba zrobić:**

```sql
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY,
  user_id UUID,                     -- Kto wykonał akcję
  action TEXT NOT NULL,             -- 'user.login', 'job.created', 'payment.completed'
  resource_type TEXT,               -- 'user', 'job', 'payment', 'certificate'
  resource_id UUID,                 -- ID zasobu (np. job ID)
  details JSONB,                    -- Szczegóły akcji
  ip_address TEXT,                  -- Skąd (IP)
  user_agent TEXT,                  -- Browser/device
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_action ON activity_logs(action);
CREATE INDEX idx_activity_logs_created ON activity_logs(created_at DESC);
```

**Panel Activity Log:**

```tsx
// pages/Admin/ActivityLogManager.tsx
<Table>
  <tr>
    <td>2025-11-13 14:23:15</td>
    <td>Jan Kowalski</td>
    <td>user.login</td>
    <td>IP: 192.168.1.1</td>
    <td>Chrome (Windows)</td>
  </tr>
  <tr>
    <td>2025-11-13 14:25:00</td>
    <td>Admin</td>
    <td>job.created</td>
    <td>Job: "Budowlaniec - Warszawa"</td>
    <td>Dashboard</td>
  </tr>
</Table>
```

---

### **PROBLEM #2: Powiadomienia wysyłane RĘCZNIE (admin tworzy każde)**

**Aktualnie:**

```tsx
// Admin MUSI ręcznie:
1. Wejść do NotificationsManager
2. Kliknąć "Nowe Powiadomienie"
3. Wpisać user_id, title, message
4. Submit

// To nie skaluje się! (setki userów)
```

**Co trzeba:**

```tsx
// AUTO-TRIGGERS (backend)

// Przykład: User zarejestrował się
const registerUser = async (email, password) => {
  const user = await createUser(email, password);

  // AUTO: Wyślij powiadomienie powitalne
  await triggerNotification("user.registered", {
    user_id: user.id,
    template: "welcome_new_user",
  });

  return user;
};

// Przykład: Job został opublikowany
const publishJob = async (jobData) => {
  const job = await createJob(jobData);

  // AUTO: Powiadom workers którzy match criteria
  const matchingWorkers = await findMatchingWorkers(job);
  await triggerBulkNotification("job.new_match", {
    user_ids: matchingWorkers.map((w) => w.id),
    template: "new_job_match",
    data: { job_id: job.id, job_title: job.title },
  });

  return job;
};
```

---

### **PROBLEM #3: Brak NOTIFICATION PREFERENCES (user settings)**

**Aktualnie:**

- ❌ Wszyscy dostają WSZYSTKIE powiadomienia
- ❌ Brak opcji "Nie chcę email, tylko push"
- ❌ Brak quiet hours
- ❌ Brak grouping

**Co trzeba:**

```sql
CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY,
  user_id UUID UNIQUE NOT NULL,

  -- Channels
  email_enabled BOOLEAN DEFAULT true,
  sms_enabled BOOLEAN DEFAULT false,
  push_enabled BOOLEAN DEFAULT true,

  -- Frequency
  max_per_hour INTEGER DEFAULT 5,
  quiet_hours_start TIME,          -- '23:00'
  quiet_hours_end TIME,            -- '07:00'

  -- Categories
  job_notifications BOOLEAN DEFAULT true,
  payment_notifications BOOLEAN DEFAULT true,
  message_notifications BOOLEAN DEFAULT true,
  system_notifications BOOLEAN DEFAULT true,

  updated_at TIMESTAMP DEFAULT NOW()
);
```

**UI dla usera:**

```tsx
// pages/WorkerDashboard.tsx → Ustawienia
<Form>
  <Checkbox checked={preferences.email_enabled}>
    📧 Email notifications
  </Checkbox>
  <Checkbox checked={preferences.push_enabled}>🔔 Push notifications</Checkbox>

  <Select value={preferences.max_per_hour}>
    <option value="1">Max 1/godzinę</option>
    <option value="5">Max 5/godzinę</option>
    <option value="10">Max 10/godzinę</option>
  </Select>

  <TimeRange>
    Quiet hours: {preferences.quiet_hours_start} - {preferences.quiet_hours_end}
  </TimeRange>
</Form>
```

---

### **PROBLEM #4: Brak INTEGRACJI (email, SMS, push nie działają)**

**Aktualnie:**

```typescript
// notifications table ma:
sent_email: false,
sent_sms: false,
sent_push: false,

// Ale NIGDY nie zmienia się na true!
// Bo brak integrac ji z:
// - Mailgun / SendGrid (email)
// - Twilio (SMS)
// - Firebase Cloud Messaging (push)
```

**Co trzeba:**

```typescript
// src/services/notificationChannels.ts

export const sendEmailNotification = async (notification: Notification) => {
  const user = await getUser(notification.user_id);

  // Mailgun API
  await mailgun.messages.create(process.env.MAILGUN_DOMAIN, {
    from: "ZZP Werkplaats <noreply@zzp.nl>",
    to: user.email,
    subject: notification.title,
    html: renderEmailTemplate(notification.message),
  });

  // Update database
  await supabase
    .from("notifications")
    .update({ sent_email: true })
    .eq("id", notification.id);
};

export const sendSMSNotification = async (notification: Notification) => {
  const user = await getUser(notification.user_id);

  if (!user.phone) return; // Brak numeru

  // Twilio API
  await twilio.messages.create({
    to: user.phone,
    from: process.env.TWILIO_PHONE,
    body: `${notification.title}: ${notification.message}`,
  });

  await supabase
    .from("notifications")
    .update({ sent_sms: true })
    .eq("id", notification.id);
};

export const sendPushNotification = async (notification: Notification) => {
  const user = await getUser(notification.user_id);

  const tokens = await getUserPushTokens(user.id); // FCM tokens

  // Firebase Cloud Messaging
  await admin.messaging().sendMulticast({
    tokens: tokens,
    notification: {
      title: notification.title,
      body: notification.message,
    },
    data: {
      link: notification.link || "/",
    },
  });

  await supabase
    .from("notifications")
    .update({ sent_push: true })
    .eq("id", notification.id);
};
```

---

## 🎯 PLAN NAPRAWY - 2 OPCJE

### **OPCJA A: MINIMAL (tylko Activity Log)**

**Jeśli chcesz tylko audit trail (kto co zrobił):**

✅ **Co zrobimy:**

1. CREATE TABLE `activity_logs`
2. Dodaj logging do każdej akcji:
   - User login/logout
   - Job create/edit/delete
   - Payment create
   - User create/delete
   - Certificate upload
3. Panel `ActivityLogManager.tsx`:
   - Tabela z akcjami
   - Filters (user, action type, date range)
   - Search
   - Export CSV

❌ **Czego NIE robimy:**

- Notification system (zostaje jak jest)
- Email/SMS integration
- Auto-triggers

**Czas:** ~2-3 godziny  
**Pliki:** 3 nowe (migration, service, manager)

---

### **OPCJA B: FULL (Activity Log + Smart Notifications)**

**Pełny system powiadomień + audit:**

✅ **Co zrobimy:**

**1. Activity Log (jak OPCJA A)**

- CREATE TABLE `activity_logs`
- Logging middleware
- ActivityLogManager panel

**2. Smart Notifications System:**

- CREATE TABLE `notification_preferences`
- CREATE TABLE `notification_templates`
- CREATE TABLE `notification_rules` (auto-triggers)
- Throttling (max X/hour)
- Quiet hours
- Grouping (podobne powiadomienia)

**3. Channel Integration:**

- Email (Mailgun/SendGrid)
- SMS (Twilio)
- Push (Firebase FCM)
- In-app (real-time via Supabase)

**4. Auto-Triggers:**

```typescript
// Backend events
on('user.registered') → send('welcome_email')
on('job.posted') → send('new_job_match', matching_workers)
on('certificate.expires_soon') → send('renewal_reminder')
on('payment.completed') → send('payment_confirmation')
```

**Czas:** ~10-15 godzin  
**Pliki:** 15+ nowych

---

## ❓ PYTANIA DO CIEBIE - PODEJMIJ DECYZJE

### **1. Jaki system chcesz?**

- [ ] **OPCJA A** - Tylko Activity Log (kto co zrobił) - szybkie
- [ ] **OPCJA B** - Pełny system (Activity Log + Smart Notifications) - długie

### **2. Activity Log - jakie akcje logować?**

```
- [ ] User actions (login, logout, register)
- [ ] Job actions (create, edit, delete, apply)
- [ ] Payment actions (create, complete, refund)
- [ ] Certificate actions (upload, verify, expire)
- [ ] Admin actions (user delete, ban, promote)
- [ ] Message actions (send, read)
- [ ] WSZYSTKIE (każdy request do API?)
```

### **3. Notification Channels - które włączyć?**

```
- [ ] Email (wymaga: Mailgun/SendGrid account)
- [ ] SMS (wymaga: Twilio account + kredyty)
- [ ] Push (wymaga: Firebase project + FCM setup)
- [ ] In-app (tylko w aplikacji) - ZAWSZE włączone
```

### **4. Auto-triggers - które zdarzenia?**

```
- [ ] User zarejestrował się → Welcome email
- [ ] Job opublikowany → Notify matching workers
- [ ] Certyfikat wygasa za 7 dni → Reminder
- [ ] Płatność completed → Confirmation
- [ ] Nowa wiadomość → Message alert
- [ ] Application accepted → Congratulations
```

### **5. User preferences - czy dać control userom?**

```
- [ ] TAK - user może wyłączyć email/sms/push
- [ ] NIE - admin kontroluje wszystko
```

### **6. Quiet hours - czy wdrożyć?**

```
- [ ] TAK - nie wysyłaj 23:00-07:00
- [ ] NIE - wysyłaj zawsze
```

### **7. Throttling - max powiadomień?**

```
- [ ] TAK - max 5/godzinę (nie spam)
- [ ] NIE - bez limitu
```

---

## 📋 DRAFT PLANU WDROŻENIA (jeśli OPCJA B)

### **FAZA 1: Activity Log (wieczorem - 2h)**

- [ ] CREATE TABLE activity_logs
- [ ] Service: logActivity(action, user_id, details)
- [ ] Middleware: auto-log każdego request
- [ ] Panel ActivityLogManager.tsx

### **FAZA 2: Notification Preferences (1-2h)**

- [ ] CREATE TABLE notification_preferences
- [ ] Service: getUserPreferences, updatePreferences
- [ ] UI: Settings page dla usera

### **FAZA 3: Notification Templates (1-2h)**

- [ ] CREATE TABLE notification_templates
- [ ] Seeding: welcome_email, new_job_match, etc.
- [ ] Template engine (render variables)

### **FAZA 4: Channel Integration (3-4h)**

- [ ] Email: Mailgun/SendGrid setup
- [ ] SMS: Twilio setup
- [ ] Push: Firebase FCM setup
- [ ] Testing każdego kanału

### **FAZA 5: Auto-Triggers (2-3h)**

- [ ] Event system (on/emit pattern)
- [ ] Triggers: user.registered, job.posted, etc.
- [ ] Testing auto-send

### **FAZA 6: Smart Features (2-3h)**

- [ ] Throttling logic
- [ ] Quiet hours check
- [ ] Grouping podobnych powiadomień
- [ ] Real-time updates (Supabase subscriptions)

---

## 🎯 NASTĘPNE KROKI

**TERAZ:**

1. Przeczytaj ten raport
2. Odpowiedz na 7 pytań powyżej
3. Wybierz OPCJĘ A lub B

**WIECZOREM:**

- Jeśli OPCJA A → Koduję Activity Log (2-3h)
- Jeśli OPCJA B → Start z Activity Log, potem Notifications (10-15h przez kilka dni)

---

**Koniec raportu chirurgicznego**  
**Autor:** GitHub Copilot  
**Data:** 13.11.2025  
**Status:** Czekam na Twoje decyzje! 🎯
