# 📅 SPOTKANIA W POWIADOMIENIACH - UPDATE

**Data:** 13.11.2025  
**Status:** ✅ DODANE do planów

---

## 🎯 CO DODAŁEM

### **1. SMART_NOTIFICATIONS_RULES.md**

**Nowa sekcja SPOTKANIA (na początku - najważniejsze):**

```
📅 SPOTKANIA (APPOINTMENTS) - 5 TRIGGERÓW:

1. appointment.created
   → Admin + Worker + Employer dostają powiadomienie

2. appointment.reminder_24h
   → Worker + Employer 24h przed spotkaniem

3. appointment.reminder_1h
   → Worker + Employer 1h przed spotkaniem

4. appointment.cancelled
   → Admin + Worker + Employer gdy ktoś anuluje

5. appointment.rescheduled
   → Admin + Worker + Employer gdy przesunięte
```

**Priorytety:**

- 🔴 CRITICAL: created, cancelled, rescheduled, reminder_1h
- 🟡 IMPORTANT: reminder_24h (grupuj jeśli >10/dzień)

---

### **2. MASTER_PLAN.md**

**Activity Log - dodane akcje:**

```typescript
"appointment.created";
"appointment.cancelled";
"appointment.rescheduled";
```

**Notifications Panel - 5 kolumn (było 4):**

```
📅 Spotkania (dzisiejsze + nadchodzące)
💰 Płatności
📜 Certyfikaty
📝 Subskrypcje
👤 Rejestracje
```

**Notification Rules - seed data:**

```sql
INSERT INTO notification_rules VALUES
  ('appointment.created', 'critical', NULL),
  ('appointment.cancelled', 'critical', NULL),
  ('appointment.rescheduled', 'critical', NULL),
  ('appointment.reminder_1h', 'critical', NULL),
  ('appointment.reminder_24h', 'important', NULL);
```

**Auto-Triggers:**

```typescript
// Integration:
- src/services/appointments.ts

// Scheduled Jobs (cron):
- Daily 08:00 → reminder_24h (jutro o tej porze)
- Every hour → reminder_1h (za godzinę)
```

---

## 📊 JAK TO BĘDZIE DZIAŁAĆ

### **Przykład 1: Nowe Spotkanie**

```
Worker umawia spotkanie z Employer na 15.11.2025 10:00

NATYCHMIAST:
✅ Admin: "📅 Nowe spotkanie: Jan Kowalski + ABC Company (15.11.2025 10:00)"
✅ Worker: "✅ Spotkanie potwierdzone: ABC Company (15.11.2025 10:00)"
✅ Employer: "✅ Spotkanie potwierdzone: Jan Kowalski (15.11.2025 10:00)"

14.11.2025 08:00 (CRON JOB):
⏰ Worker: "Przypomnienie: Spotkanie jutro o 10:00 z ABC Company"
⏰ Employer: "Przypomnienie: Spotkanie jutro o 10:00 z Jan Kowalski"

15.11.2025 09:00 (CRON JOB):
🔔 Worker: "Za godzinę: Spotkanie z ABC Company (10:00)"
🔔 Employer: "Za godzinę: Spotkanie z Jan Kowalski (10:00)"
```

---

### **Przykład 2: Anulowanie**

```
Employer anuluje spotkanie

NATYCHMIAST:
❌ Admin: "Spotkanie anulowane: Jan Kowalski + ABC Company"
❌ Worker: "Spotkanie anulowane przez ABC Company"
❌ Employer: "Spotkanie anulowane"
```

---

### **Przykład 3: Przesunięcie**

```
Worker przesuwa spotkanie 15.11 → 16.11

NATYCHMIAST:
🔄 Admin: "Spotkanie przesunięte: 15.11 → 16.11"
🔄 Worker: "Spotkanie przesunięte na 16.11.2025 10:00"
🔄 Employer: "Spotkanie przesunięte na 16.11.2025 10:00"

16.11.2025 08:00:
⏰ Worker + Employer: przypomnienie 24h
16.11.2025 09:00:
🔔 Worker + Employer: przypomnienie 1h
```

---

## 🎛️ PANEL POWIADOMIEŃ - NOWY LAYOUT

### **5 KOLUMN:**

```
┌────────────────────────────────────────────────────────────────┐
│  🔔 POWIADOMIENIA & ACTIVITY MONITOR                           │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────┐
│  │📅SPOTKANIA│ │💰PŁATNOŚCI│ │📜CERTYFIK│ │📝SUBSKRYP│ │👤REJ │
│  │          │ │          │ │          │ │          │ │     │
│  │Dziś 10:00│ │€50 Emp X │ │VCA-Jan K │ │Premium-Y │ │Anna │
│  │Jan K.    │ │14:30:00  │ │Pending   │ │€29/mies  │ │Work │
│  │ABC Co.   │ │          │ │          │ │          │ │     │
│  │          │ │€120 Co.Y │ │ISO-Piotr │ │Basic-Z   │ │Mark │
│  │Jutro 14:0│ │13:15:22  │ │Verified✅│ │€9/mies   │ │Empl │
│  │Piotr N.  │ │          │ │          │ │          │ │     │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────┘
│                                                                │
│  ┌────────────────────────────────────────────────────────────┐
│  │ ⚠️ NIEAKTYWNE KONTA (>60 dni)                              │
│  │                                                            │
│  │ Jan Kowalski   | Last login: 2025-09-10 | [Przypomnij]   │
│  └────────────────────────────────────────────────────────────┘
└────────────────────────────────────────────────────────────────┘
```

---

## ✅ CRON JOBS DO ZAIMPLEMENTOWANIA

```typescript
// src/jobs/appointmentReminders.ts

// JOB 1: Przypomnienia 24h (daily 08:00)
export const send24hReminders = async () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const appointments = await supabase
    .from("appointments")
    .select("*")
    .gte("scheduled_at", tomorrow.toISOString().split("T")[0])
    .lt(
      "scheduled_at",
      new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000).toISOString()
    );

  for (const appointment of appointments) {
    await triggerNotification("appointment.reminder_24h", {
      worker_id: appointment.worker_id,
      employer_id: appointment.employer_id,
      scheduled_at: appointment.scheduled_at,
    });
  }
};

// JOB 2: Przypomnienia 1h (every hour)
export const send1hReminders = async () => {
  const oneHourFromNow = new Date();
  oneHourFromNow.setHours(oneHourFromNow.getHours() + 1);

  const appointments = await supabase
    .from("appointments")
    .select("*")
    .gte("scheduled_at", oneHourFromNow.toISOString())
    .lt(
      "scheduled_at",
      new Date(oneHourFromNow.getTime() + 60 * 60 * 1000).toISOString()
    );

  for (const appointment of appointments) {
    await triggerNotification("appointment.reminder_1h", {
      worker_id: appointment.worker_id,
      employer_id: appointment.employer_id,
      scheduled_at: appointment.scheduled_at,
    });
  }
};

// Setup cron
import cron from "node-cron";

// Daily at 08:00
cron.schedule("0 8 * * *", send24hReminders);

// Every hour
cron.schedule("0 * * * *", send1hReminders);
```

---

## 🚀 IMPLEMENTACJA (dodane do MASTER_PLAN)

**FAZA 3: Notifications System**

**3.2 Smart Notifications Panel:**

- 5 kolumn (dodana: Spotkania)
- Spotkania pokazują: dzisiejsze + jutrzejsze
- Filtr: upcoming (nadchodzące), today (dzisiaj), cancelled

**3.3 Auto-Triggers:**

- appointments.ts service integration
- Cron jobs (24h reminder, 1h reminder)

**3.4 Notification Templates:**

```typescript
const templates = {
  "appointment.created": {
    admin:
      "📅 Nowe spotkanie: {worker_name} + {employer_name} ({scheduled_at})",
    worker: "✅ Spotkanie potwierdzone: {employer_name} ({scheduled_at})",
    employer: "✅ Spotkanie potwierdzone: {worker_name} ({scheduled_at})",
  },
  "appointment.reminder_24h": {
    worker: "⏰ Przypomnienie: Spotkanie jutro o {time} z {employer_name}",
    employer: "⏰ Przypomnienie: Spotkanie jutro o {time} z {worker_name}",
  },
  // etc...
};
```

---

**Koniec UPDATE**  
**Wszystkie plany zaktualizowane!** ✅
