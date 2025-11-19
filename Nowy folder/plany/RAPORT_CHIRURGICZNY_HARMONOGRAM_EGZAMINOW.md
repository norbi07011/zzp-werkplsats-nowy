# 📅 RAPORT CHIRURGICZNY: HARMONOGRAM EGZAMINÓW ZZP

**Data:** 13.11.2025  
**Status:** 🔴 WYMAGA NAPRAWY I ROZBUDOWY  
**Priorytet:** ⭐⭐⭐ WYSOKI

---

## 🎯 CO UŻYTKOWNIK CHCE

> "Strona jest bardzo brzydka. Musimy połączyć z bazą danych, żeby się zapisywały informacje, rozbudować o dużo więcej opcji z certyfikatów, kategorie które zaznaczyli, jak pracownik aplikuje o certyfikat, zapłaci, wybierze datę wolną - musi być kompatybilne, on wybierze datę i ona tutaj się pojawi, ja ją akceptuję, to jemu przyjdzie powiadomienie."

### 📋 WYMAGANIA BIZNESOWE:

1. **Proces aplikacji pracownika:**

   - Worker wybiera kategorię certyfikatu
   - Worker płaci za egzamin
   - Worker wybiera wolną datę z dostępnych slotów
   - Dane zapisują się w bazie

2. **Proces akceptacji admina:**

   - Admin widzi aplikacje workers
   - Admin widzi wybrane daty
   - Admin akceptuje/odrzuca termin
   - Worker dostaje powiadomienie

3. **Wybór wolnych dat:**

   - System pokazuje wolne/zajęte sloty
   - Worker widzi capacity (ile miejsc wolnych)
   - Slot się automatycznie rezerwuje

4. **Kategorie certyfikatów:**
   - System musi pokazywać tylko te kategorie, które worker zaznaczył
   - Kompatybilność z approved_categories z workers table

---

## 🔍 CO AKTUALNIE ISTNIEJE W SYSTEMIE

### ✅ 1. BAZA DANYCH - `test_appointments` (KOMPLETNA)

**Tabela:** `test_appointments` (29 kolumn)

```sql
CREATE TABLE test_appointments (
  -- PODSTAWOWE
  id UUID PRIMARY KEY,
  worker_id UUID REFERENCES workers(id),
  test_date TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER DEFAULT 60,

  -- STATUS & TYP
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'scheduled', 'completed', 'cancelled', 'no_show'
  )),
  test_type TEXT DEFAULT 'zzp_exam' CHECK (test_type IN (
    'zzp_exam', 'skills_assessment', 'language_test', 'safety_training'
  )),

  -- LOKALIZACJA & EGZAMINATOR
  location TEXT,
  examiner_name TEXT,

  -- WYNIKI
  result TEXT,
  score NUMERIC CHECK (score >= 0 AND score <= 100),
  passed BOOLEAN,
  notes TEXT,

  -- SCHEDULING
  scheduled_by UUID REFERENCES profiles(id),
  completed_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancellation_reason TEXT,

  -- TIMESTAMPS
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- DODATKOWE POLA (dla wideo i przypomnienia)
  client_id UUID REFERENCES profiles(id),
  service_type TEXT,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  video_call_provider TEXT,
  video_call_meeting_id TEXT,
  video_call_join_url TEXT,
  video_call_password TEXT,
  reminder_sms BOOLEAN DEFAULT FALSE,
  reminder_email BOOLEAN DEFAULT FALSE,

  -- ⭐ KLUCZOWE DLA HARMONOGRAMU
  appointment_type TEXT DEFAULT 'test', -- 'test' lub 'meeting'
  capacity INTEGER DEFAULT 10 CHECK (capacity > 0 AND capacity <= 100)
    COMMENT 'Maksymalna liczba pracowników na slot testowy (domyślnie: 10, max: 100)'
);
```

**Istniejące rekordy:**

```json
{
  "id": "858e3e96-4c8e-43a2-afad-284beca8d789",
  "worker_id": null,
  "test_date": "2025-11-28 17:12:00+00",
  "duration_minutes": 60,
  "status": "pending",
  "test_type": "zzp_exam",
  "location": "DSFDSFSDF",
  "notes": " SDFGDSFGSD\n\nDFSDFG",
  "capacity": 10,
  "appointment_type": "meeting"
}
```

**✅ WNIOSKI:**

- Tabela GOTOWA i używana
- Capacity działa (10 osób na slot)
- appointment_type pozwala odróżnić test slots od spotkań
- **BRAKUJE:** worker_id w slotach (to są puste sloty do wypełnienia)

---

### ✅ 2. SERVICE - `testAppointmentService.ts` (DZIAŁA)

**Lokalizacja:** `services/testAppointmentService.ts` (497 linii)

**Funkcje:**

```typescript
// ✅ GOTOWE
export const testAppointmentService = {
  // Pobieranie slotów
  getTestSlots(filters) → Promise<TestSlot[]>
  getWeekSlots(startDate) → Promise<TestSlot[]>

  // CRUD slotów
  createTestSlot(slotData) → Promise<TestSlot>
  updateTestSlot(slotId, slotData) → Promise<TestSlot>
  deleteTestSlot(slotId) → Promise<void>

  // Statystyki
  getSlotStats() → Promise<SlotStats>

  // Przypisywanie workers
  getSlotWorkers(testDate, location) → Promise<AssignedWorker[]>
  getApprovedApplications() → Promise<any[]>
  assignWorkerToSlot(workerId, workerName, workerEmail, testDate, location)
};
```

**Interfaces:**

```typescript
interface TestSlot {
  id: string;
  test_date: string;
  duration_minutes: number;
  capacity: number;
  location: string;
  test_type: string;
  examiner_name?: string;
  status: "active" | "cancelled";
  notes?: string;
  booked_count?: number; // Automatycznie liczone
  worker_id?: string;
}

interface SlotStats {
  total_slots: number;
  active_slots: number;
  this_week_slots: number;
  available_capacity: number;
  booked_workers: number;
  completed_tests: number;
}
```

**✅ WNIOSKI:**

- Service DZIAŁA
- Ma wszystkie potrzebne funkcje
- booked_count liczy ile osób już zarezerwowało
- **BRAKUJE:** funkcja do rezerwacji slotu przez worker

---

### ✅ 3. KOMPONENT - `TestSchedulerPageNew.tsx` (DZIAŁA CZĘŚCIOWO)

**Lokalizacja:** `pages/Admin/TestSchedulerPageNew.tsx` (779 linii)

**Co już działa:**

1. **7-dniowy kalendarz tygodniowy** ✅

   ```tsx
   <Grid cols={7}>
     {getDaysOfWeek().map((day) => (
       <DayColumn key={day}>{/* Poniedziałek, Wtorek, ... */}</DayColumn>
     ))}
   </Grid>
   ```

2. **Kolory statusów** ✅

   - 🟢 Zielony: <50% zajętości
   - 🟡 Żółty: 50-90% zajętości
   - 🔴 Czerwony: >90% zajętości

3. **Statystyki górą** ✅

   ```tsx
   <StatsCards>
     📊 Sloty ten tydzień: {stats.this_week_slots}➕ Wolne miejsca: {
       stats.available_capacity
     }
     👤 Zaplanowane osoby: {stats.booked_workers}✅ Ukończone: {stats.completed_tests}
   </StatsCards>
   ```

4. **CRUD slotów** ✅

   - Dodaj slot (modal)
   - Edytuj slot (modal)
   - Usuń slot (przycisk)

5. **Nawigacja tygodniami** ✅
   ```tsx
   <WeekNavigation>
     ◀️ Poprzedni tydzień | 21.11 - 27.11.2025 | Następny tydzień ▶️
   </WeekNavigation>
   ```

**Co NIE działa:**

1. **❌ Brak integracji z aplikacjami workers**

   - Przyciski są, ale nie pokazują PRAWDZIWYCH aplikacji
   - Brak połączenia z `zzp_exam_applications`

2. **❌ "Brzydki" design**

   - Kolory OK, ale layout może być lepszy
   - Brak wyraźnego wyświetlania capacity

3. **❌ Brak widoku worker**
   - Admin widzi slots ✅
   - Worker NIE MOŻE wybrać daty ❌

---

### ✅ 4. TABELA APLIKACJI - `zzp_exam_applications` (ISTNIEJE!)

```sql
CREATE TABLE zzp_exam_applications (
  id UUID PRIMARY KEY,
  worker_id UUID REFERENCES workers(id) NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,

  -- ⭐ KATEGORIE CERTYFIKATÓW
  specializations TEXT[] NOT NULL DEFAULT '{}',

  -- STATUS
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'approved', 'rejected', 'in_review'
  )),

  -- DOKUMENTY
  documents JSONB DEFAULT '[]',

  -- WYNIKI TESTU
  test_score INTEGER CHECK (test_score >= 0 AND test_score <= 10),
  test_date TIMESTAMP WITH TIME ZONE,

  -- AKCEPTACJA
  approved_by UUID REFERENCES profiles(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  certificate_number TEXT UNIQUE,

  -- ODRZUCENIE
  rejection_reason TEXT,
  admin_notes TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**✅ WNIOSKI:**

- Tabela ISTNIEJE!
- Ma specializations (kategorie)
- Ma status ('pending', 'approved', 'rejected')
- **BRAKUJE:** powiązanie z test_appointments (wybrana data)

---

### ✅ 5. TABELA WORKERS - `workers.approved_categories`

```sql
CREATE TABLE workers (
  id UUID PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id),

  -- ... inne pola ...

  -- ⭐ ZATWIERDZONE KATEGORIE
  approved_categories TEXT[] DEFAULT '{}',

  -- CERTYFIKAT
  zzp_certificate_issued BOOLEAN DEFAULT FALSE,
  zzp_certificate_date TIMESTAMP WITH TIME ZONE,
  zzp_certificate_number TEXT UNIQUE,
  zzp_certificate_expires_at TIMESTAMP WITH TIME ZONE,

  -- STATUS CERTYFIKATU
  certificate_status TEXT DEFAULT 'inactive' CHECK (certificate_status IN (
    'active', 'expired', 'revoked', 'inactive'
  )),
  certificate_issued_at TIMESTAMP WITH TIME ZONE
);
```

**✅ WNIOSKI:**

- `approved_categories` przechowuje zaakceptowane kategorie
- System certyfikatów działa
- **KOMPATYBILNOŚĆ:** Aplikacja powinna pokazywać tylko approved_categories

---

## 🔴 CO BRAKUJE (CRITICAL GAPS)

### 1. ❌ BRAK POŁĄCZENIA: Aplikacja ↔ Wybór Daty

**Problem:**

```
zzp_exam_applications.test_date ← NIE JEST używane do rezerwacji
test_appointments.worker_id ← NIE JEST wypełniane przez workers
```

**Potrzebne:**

```sql
-- Dodaj kolumnę do aplikacji
ALTER TABLE zzp_exam_applications
ADD COLUMN selected_slot_id UUID REFERENCES test_appointments(id);

-- ALBO użyj istniejącego test_date + dodaj logikę
```

---

### 2. ❌ BRAK WIDOKU DLA WORKER

**Nie istnieje:**

- Strona wyboru daty dla pracownika
- Lista dostępnych slotów (worker-facing)
- Formularz rezerwacji

**Potrzebne:**

```
pages/worker/ExamBooking.tsx → NOWY PLIK
```

---

### 3. ❌ BRAK SYSTEMU PŁATNOŚCI ZA EGZAMIN

**Problem:**

- User request: "jak pracownik aplikuje o certyfikat, **zapłaci**"
- Nie ma payment flow dla exam

**Potrzebne:**

```typescript
// W zzp_exam_applications dodaj:
payment_status: 'unpaid' | 'paid' | 'refunded'
payment_id: UUID REFERENCES payments(id)
payment_amount: NUMERIC DEFAULT 49.00
```

---

### 4. ❌ BRAK SYSTEMU POWIADOMIEŃ

**User request:** "to jemu przyjdzie powiadomienie z tym potwierdzeniem"

**Potrzebne:**

```typescript
// Triggery:
1. Worker wybiera datę → Admin dostaje notification
2. Admin akceptuje → Worker dostaje notification
3. 24h przed egzaminem → Worker dostaje reminder
4. 1h przed egzaminem → Worker + Examiner dostają reminder
```

---

### 5. ❌ BRZYDKI DESIGN

**Problem:**

- Layout jest OK, ale mało czytelny
- Brak jasnego pokazania capacity
- Brak kolorystyki dla kategorii certyfikatów

**Potrzebne:**

- Przeprojektowanie kart slotów
- Większe przyciski
- Wyraźne pokazanie "5/10 miejsc wolnych"

---

## 📊 MAPOWANIE POTRZEB vs ISTNIEJĄCY SYSTEM

| **Wymaganie Biznesowe**             | **Co Istnieje**                  | **Co Brakuje**                           | **Priorytet** |
| ----------------------------------- | -------------------------------- | ---------------------------------------- | ------------- |
| **1. Worker wybiera kategorię**     | `workers.approved_categories` ✅ | Formularz aplikacji z listą kategorii ❌ | 🔴 CRITICAL   |
| **2. Worker płaci**                 | `payments` table ✅              | Payment flow dla exam ❌                 | 🔴 CRITICAL   |
| **3. Worker wybiera datę**          | `test_appointments` ✅           | Widok wyboru dla worker ❌               | 🔴 CRITICAL   |
| **4. Dane zapisują się**            | Service działa ✅                | Połączenie aplikacja ↔ slot ❌           | 🔴 CRITICAL   |
| **5. Admin widzi aplikacje**        | `zzp_exam_applications` ✅       | UI pokazujące aplikacje ❌               | 🟡 HIGH       |
| **6. Admin akceptuje**              | Status w tabeli ✅               | Przycisk akceptacji + logika ❌          | 🟡 HIGH       |
| **7. Worker dostaje powiadomienie** | `notifications` table ✅         | Triggery + templates ❌                  | 🟡 HIGH       |
| **8. Wolne/zajęte sloty**           | `capacity` + `booked_count` ✅   | Kalkulacja real-time ✅                  | ✅ GOTOWE     |
| **9. Kategorie kompatybilne**       | `approved_categories` ✅         | Filtr w UI ❌                            | 🟡 HIGH       |

---

## 🎯 PLAN NAPRAWY (ETAPY)

### 🔹 ETAP 1: FIX ISTNIEJĄCEGO HARMONOGRAMU (2-3h)

**Cel:** Poprawić design i dodać podstawową funkcjonalność

**Zmiany w `TestSchedulerPageNew.tsx`:**

1. **Przeprojektuj karty slotów** (1h)

   ```tsx
   <SlotCard>
     <Header>
       🕐 10:00 - 12:00
       <Badge>5/10 wolnych</Badge>
     </Header>
     <Location>📍 Amsterdam Warehouse</Location>
     <Examiner>👤 Jan Kowalski</Examiner>
     <Progress value={50} /> {/* 5/10 = 50% */}
     <Actions>
       <Button variant="success">👤 Przypisz</Button>
       <Button variant="primary">✏️ Edytuj</Button>
       <Button variant="danger">🗑️ Usuń</Button>
     </Actions>
   </SlotCard>
   ```

2. **Dodaj licznik zajętości** (30min)

   ```tsx
   const fillRate = slot.booked_count / slot.capacity;
   const progressColor =
     fillRate >= 0.9 ? "red" : fillRate >= 0.5 ? "yellow" : "green";
   ```

3. **Popraw modalne** (30min)

   - Większe inputy
   - Walidacja pól
   - Loading states

4. **Dodaj capacity badge** (30min)
   ```tsx
   <Badge color={getDayColor(daySlots)}>
     {daySlots.reduce((sum, s) => sum + (s.capacity - s.booked_count), 0)}
     wolnych miejsc
   </Badge>
   ```

**Rezultat:** Harmonogram działa lepiej i wygląda profesjonalnie ✅

---

### 🔹 ETAP 2: DODAJ WIDOK DLA WORKER (3-4h)

**Cel:** Worker może zobaczyć wolne sloty i wybrać datę

**Nowy plik:** `pages/worker/ExamBooking.tsx`

```tsx
export const ExamBooking: React.FC = () => {
  const { user } = useAuth();
  const [worker, setWorker] = useState<Worker | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [availableSlots, setAvailableSlots] = useState<TestSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TestSlot | null>(null);

  // 1. Pobierz dane worker
  useEffect(() => {
    fetchWorkerData();
  }, [user]);

  // 2. Pobierz wolne sloty
  useEffect(() => {
    if (selectedCategory) {
      fetchAvailableSlots(selectedCategory);
    }
  }, [selectedCategory]);

  return (
    <div className="max-w-6xl mx-auto p-8">
      <h1>📅 Rezerwacja Egzaminu ZZP</h1>

      {/* KROK 1: Wybór kategorii */}
      <Step number={1} title="Wybierz kategorię certyfikatu">
        <CategorySelector
          categories={worker?.approved_categories || []}
          selected={selectedCategory}
          onChange={setSelectedCategory}
        />
      </Step>

      {/* KROK 2: Wybór daty */}
      <Step
        number={2}
        title="Wybierz termin egzaminu"
        disabled={!selectedCategory}
      >
        <CalendarView slots={availableSlots} onSelectSlot={setSelectedSlot} />
      </Step>

      {/* KROK 3: Płatność */}
      <Step number={3} title="Płatność" disabled={!selectedSlot}>
        <PaymentForm
          amount={49.0}
          slotDetails={selectedSlot}
          onPaymentSuccess={handleBooking}
        />
      </Step>

      {/* PODSUMOWANIE */}
      <Summary>
        Kategoria: {selectedCategory}
        Data: {selectedSlot?.test_date}
        Lokalizacja: {selectedSlot?.location}
        Cena: €49.00
      </Summary>
    </div>
  );
};
```

**Komponenty:**

1. **CategorySelector** (45min)

   ```tsx
   <div className="grid grid-cols-3 gap-4">
     {categories.map((cat) => (
       <CategoryCard
         key={cat}
         name={cat}
         icon={getCategoryIcon(cat)}
         selected={selected === cat}
         onClick={() => onChange(cat)}
       />
     ))}
   </div>
   ```

2. **CalendarView** (1.5h)

   ```tsx
   <MonthCalendar>
     {daysOfMonth.map((day) => (
       <DayCell key={day} date={day}>
         {getSlotsForDay(day).map((slot) => (
           <SlotButton
             key={slot.id}
             time={slot.test_date}
             available={slot.booked_count < slot.capacity}
             onClick={() => onSelectSlot(slot)}
           >
             🕐 {formatTime(slot.test_date)}
             <Badge>{slot.capacity - slot.booked_count} miejsc</Badge>
           </SlotButton>
         ))}
       </DayCell>
     ))}
   </MonthCalendar>
   ```

3. **PaymentForm** (1h)
   ```tsx
   <Stripe>
     <CardElement />
     <PayButton amount={49.0} onClick={handlePay}>
       Zapłać €49.00
     </PayButton>
   </Stripe>
   ```

**Service funkcje:**

```typescript
// services/examBookingService.ts

export const examBookingService = {
  // Pobierz wolne sloty dla kategorii
  async getAvailableSlotsForCategory(category: string): Promise<TestSlot[]> {
    const { data, error } = await supabase
      .from("test_appointments")
      .select("*")
      .eq("test_type", "zzp_exam")
      .eq("status", "active")
      .gte("test_date", new Date().toISOString())
      .order("test_date", { ascending: true });

    if (error) throw error;

    // Filtruj tylko te z wolnymi miejscami
    return data.filter((slot) => {
      const booked = slot.booked_count || 0;
      return booked < slot.capacity;
    });
  },

  // Rezerwuj slot
  async bookExamSlot(
    workerId: string,
    slotId: string,
    category: string,
    paymentId: string
  ): Promise<void> {
    // 1. Utwórz aplikację
    const { data: application, error: appError } = await supabase
      .from("zzp_exam_applications")
      .insert({
        worker_id: workerId,
        specializations: [category],
        status: "pending",
        test_date: slotId, // lub zapisz jako relację
      })
      .select()
      .single();

    if (appError) throw appError;

    // 2. Przypisz worker do slotu
    await testAppointmentService.assignWorkerToSlot(
      workerId,
      "Worker Name", // pobierz z worker data
      "worker@email.com",
      slot.test_date,
      slot.location
    );

    // 3. Utwórz payment record
    await supabase.from("payments").insert({
      user_id: workerId,
      payment_type: "exam_fee",
      amount: 49.0,
      status: "completed",
      stripe_payment_intent_id: paymentId,
    });

    // 4. Wyślij powiadomienie do admina
    await createNotification({
      user_id: "admin_id", // wszyscy adminów
      type: "EXAM_BOOKING",
      title: "Nowa rezerwacja egzaminu",
      message: `Pracownik zarezerwował egzamin ${category} na ${slot.test_date}`,
    });
  },
};
```

**Rezultat:** Worker może wybrać datę i zapłacić ✅

---

### 🔹 ETAP 3: PANEL AKCEPTACJI DLA ADMINA (2-3h)

**Cel:** Admin widzi aplikacje i może je akceptować/odrzucać

**Nowy komponent:** `components/Admin/ExamApplicationsList.tsx`

```tsx
export const ExamApplicationsList: React.FC = () => {
  const [applications, setApplications] = useState<ExamApplication[]>([]);
  const [filter, setFilter] = useState<"all" | "pending" | "approved">(
    "pending"
  );

  useEffect(() => {
    loadApplications();
  }, [filter]);

  return (
    <div className="bg-white rounded-xl p-6">
      <Header>
        <h2>📋 Aplikacje o Egzamin ZZP</h2>
        <FilterTabs>
          <Tab
            active={filter === "pending"}
            onClick={() => setFilter("pending")}
          >
            Oczekujące ({pendingCount})
          </Tab>
          <Tab
            active={filter === "approved"}
            onClick={() => setFilter("approved")}
          >
            Zatwierdzone ({approvedCount})
          </Tab>
          <Tab active={filter === "all"} onClick={() => setFilter("all")}>
            Wszystkie ({allCount})
          </Tab>
        </FilterTabs>
      </Header>

      <Table>
        <thead>
          <tr>
            <th>Pracownik</th>
            <th>Kategoria</th>
            <th>Data egzaminu</th>
            <th>Lokalizacja</th>
            <th>Płatność</th>
            <th>Status</th>
            <th>Akcje</th>
          </tr>
        </thead>
        <tbody>
          {applications.map((app) => (
            <ApplicationRow
              key={app.id}
              application={app}
              onApprove={() => handleApprove(app.id)}
              onReject={() => handleReject(app.id)}
            />
          ))}
        </tbody>
      </Table>
    </div>
  );
};
```

**ApplicationRow:**

```tsx
<tr className={getStatusColor(app.status)}>
  <td>
    <div className="flex items-center gap-3">
      <Avatar src={app.worker.avatar_url} />
      <div>
        <p className="font-semibold">{app.full_name}</p>
        <p className="text-sm text-gray-500">{app.email}</p>
      </div>
    </div>
  </td>
  <td>
    <Badge color="blue">{app.specializations[0]}</Badge>
  </td>
  <td>
    📅 {formatDate(app.test_date)}
    🕐 {formatTime(app.test_date)}
  </td>
  <td>📍 {app.slot.location}</td>
  <td>
    {app.payment_status === "paid" ? (
      <Badge color="green">✅ Zapłacono</Badge>
    ) : (
      <Badge color="red">❌ Niezapłacone</Badge>
    )}
  </td>
  <td>
    <StatusBadge status={app.status} />
  </td>
  <td>
    {app.status === "pending" && (
      <div className="flex gap-2">
        <Button variant="success" size="sm" onClick={() => onApprove()}>
          ✅ Akceptuj
        </Button>
        <Button variant="danger" size="sm" onClick={() => onReject()}>
          ❌ Odrzuć
        </Button>
      </div>
    )}
  </td>
</tr>
```

**Service funkcje:**

```typescript
// services/examApplicationsService.ts

export const examApplicationsService = {
  // Pobierz aplikacje
  async getApplications(filter: "all" | "pending" | "approved") {
    let query = supabase
      .from("zzp_exam_applications")
      .select(
        `
        *,
        worker:workers!inner(id, profile_id, avatar_url),
        slot:test_appointments!inner(id, test_date, location)
      `
      )
      .order("created_at", { ascending: false });

    if (filter !== "all") {
      query = query.eq("status", filter);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  // Akceptuj aplikację
  async approveApplication(applicationId: string) {
    // 1. Update status
    const { error: updateError } = await supabase
      .from("zzp_exam_applications")
      .update({
        status: "approved",
        approved_by: currentAdminId,
        approved_at: new Date().toISOString(),
      })
      .eq("id", applicationId);

    if (updateError) throw updateError;

    // 2. Pobierz dane aplikacji
    const { data: app } = await supabase
      .from("zzp_exam_applications")
      .select("*, worker:workers!inner(*)")
      .eq("id", applicationId)
      .single();

    // 3. Wyślij powiadomienie do worker
    await createNotification({
      user_id: app.worker.profile_id,
      type: "EXAM_APPROVED",
      title: "✅ Egzamin zatwierdzony",
      message: `Twój egzamin ${
        app.specializations[0]
      } został zatwierdzony na ${formatDate(app.test_date)}`,
      link: "/worker/exam-details",
      data: {
        application_id: applicationId,
        test_date: app.test_date,
        location: app.slot.location,
      },
    });
  },

  // Odrzuć aplikację
  async rejectApplication(applicationId: string, reason: string) {
    const { error } = await supabase
      .from("zzp_exam_applications")
      .update({
        status: "rejected",
        rejection_reason: reason,
        approved_by: currentAdminId,
        approved_at: new Date().toISOString(),
      })
      .eq("id", applicationId);

    if (error) throw error;

    // Powiadomienie
    await createNotification({
      user_id: app.worker.profile_id,
      type: "EXAM_REJECTED",
      title: "❌ Egzamin odrzucony",
      message: `Twoja rezerwacja została odrzucona. Powód: ${reason}`,
    });
  },
};
```

**Dodaj do TestSchedulerPageNew.tsx:**

```tsx
// Na górze strony, przed kalendarzem
<ExamApplicationsList />;

{
  /* Separator */
}
<Divider />;

{
  /* Istniejący kalendarz */
}
<WeekNavigation>...</WeekNavigation>;
```

**Rezultat:** Admin widzi aplikacje i może je zarządzać ✅

---

### 🔹 ETAP 4: SYSTEM POWIADOMIEŃ (1-2h)

**Cel:** Automatyczne powiadomienia w kluczowych momentach

**Triggery:**

1. **Worker rezerwuje slot** → Admin dostaje powiadomienie
2. **Admin akceptuje** → Worker dostaje powiadomienie
3. **Admin odrzuca** → Worker dostaje powiadomienie + refund
4. **24h przed egzaminem** → Worker + Examiner dostają reminder
5. **1h przed egzaminem** → Worker + Examiner dostają urgent reminder

**Implementacja:**

```typescript
// services/notificationService.ts

export const notificationService = {
  // 1. Rezerwacja przez worker
  async notifyAdminsAboutNewBooking(application: ExamApplication) {
    const admins = await getAdminUsers();

    for (const admin of admins) {
      await createNotification({
        user_id: admin.id,
        type: "EXAM_BOOKING",
        title: "📅 Nowa rezerwacja egzaminu",
        message: `${application.full_name} zarezerwował egzamin ${application.specializations[0]}`,
        link: `/admin/exam-applications/${application.id}`,
        priority: "normal",
        data: {
          application_id: application.id,
          worker_name: application.full_name,
          category: application.specializations[0],
          test_date: application.test_date,
        },
      });
    }
  },

  // 2. Akceptacja przez admina
  async notifyWorkerAboutApproval(application: ExamApplication) {
    await createNotification({
      user_id: application.worker.profile_id,
      type: "EXAM_APPROVED",
      title: "✅ Egzamin zatwierdzony!",
      message: `Twój egzamin ${application.specializations[0]} został zatwierdzony`,
      link: "/worker/exam-details",
      priority: "high",
      sent_email: true, // wyślij też email
      data: {
        test_date: application.test_date,
        location: application.slot.location,
        examiner: application.slot.examiner_name,
      },
    });
  },

  // 3. Odrzucenie
  async notifyWorkerAboutRejection(
    application: ExamApplication,
    reason: string
  ) {
    await createNotification({
      user_id: application.worker.profile_id,
      type: "EXAM_REJECTED",
      title: "❌ Rezerwacja odrzucona",
      message: `Powód: ${reason}`,
      link: "/worker/exam-booking",
      priority: "high",
      sent_email: true,
      data: {
        reason,
        refund_status: "processing",
      },
    });
  },

  // 4. Reminder 24h
  async sendExamReminders24h() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const { data: exams } = await supabase
      .from("zzp_exam_applications")
      .select(
        `
        *,
        worker:workers!inner(profile_id),
        slot:test_appointments!inner(*)
      `
      )
      .eq("status", "approved")
      .gte("test_date", tomorrow.toISOString().split("T")[0])
      .lt(
        "test_date",
        new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000).toISOString()
      );

    for (const exam of exams) {
      await createNotification({
        user_id: exam.worker.profile_id,
        type: "EXAM_REMINDER_24H",
        title: "⏰ Egzamin jutro!",
        message: `Przypominamy o egzaminie ${
          exam.specializations[0]
        } jutro o ${formatTime(exam.test_date)}`,
        link: "/worker/exam-details",
        priority: "high",
        sent_email: true,
        sent_sms: true,
      });
    }
  },

  // 5. Reminder 1h
  async sendExamReminders1h() {
    const oneHourFromNow = new Date();
    oneHourFromNow.setHours(oneHourFromNow.getHours() + 1);

    const { data: exams } = await supabase
      .from("zzp_exam_applications")
      .select(
        "*, worker:workers!inner(profile_id), slot:test_appointments!inner(*)"
      )
      .eq("status", "approved")
      .gte("test_date", oneHourFromNow.toISOString())
      .lt(
        "test_date",
        new Date(oneHourFromNow.getTime() + 60 * 60 * 1000).toISOString()
      );

    for (const exam of exams) {
      await createNotification({
        user_id: exam.worker.profile_id,
        type: "EXAM_REMINDER_1H",
        title: "🔔 Egzamin za godzinę!",
        message: `Twój egzamin zaczyna się za godzinę (${formatTime(
          exam.test_date
        )})`,
        link: "/worker/exam-details",
        priority: "urgent",
        sent_push: true,
        sent_sms: true,
      });
    }
  },
};
```

**Cron Jobs (automatyzacja):**

```typescript
// Setup cron jobs (node-cron lub podobne)

import cron from "node-cron";

// Codziennie o 8:00 - wysyłaj 24h reminders
cron.schedule("0 8 * * *", async () => {
  console.log("🔔 Wysyłam przypomnienia 24h...");
  await notificationService.sendExamReminders24h();
});

// Co godzinę - wysyłaj 1h reminders
cron.schedule("0 * * * *", async () => {
  console.log("⏰ Sprawdzam egzaminy za 1h...");
  await notificationService.sendExamReminders1h();
});
```

**Rezultat:** Powiadomienia działają automatycznie ✅

---

### 🔹 ETAP 5: PŁATNOŚCI (1-2h)

**Cel:** Worker płaci €49 za egzamin podczas rezerwacji

**Payment Flow:**

```tsx
// W pages/worker/ExamBooking.tsx

const handlePayment = async (paymentIntent: PaymentIntent) => {
  try {
    // 1. Utwórz payment record
    const { data: payment, error: payError } = await supabase
      .from("payments")
      .insert({
        user_id: user.id,
        payment_type: "exam_fee",
        amount: 49.0,
        currency: "EUR",
        status: "completed",
        payment_method: "stripe_card",
        stripe_payment_intent_id: paymentIntent.id,
        description: `Egzamin ZZP - ${selectedCategory}`,
        metadata: {
          category: selectedCategory,
          slot_id: selectedSlot.id,
          test_date: selectedSlot.test_date,
        },
      })
      .select()
      .single();

    if (payError) throw payError;

    // 2. Rezerwuj slot
    await examBookingService.bookExamSlot(
      worker.id,
      selectedSlot.id,
      selectedCategory,
      payment.id
    );

    // 3. Powiadomienie
    toast.success("✅ Egzamin zarezerwowany! Czekamy na akceptację admina.");
    navigate("/worker/exam-details");
  } catch (error) {
    console.error("Payment error:", error);
    toast.error("❌ Błąd płatności. Spróbuj ponownie.");
  }
};
```

**Stripe Integration:**

```tsx
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

const stripePromise = loadStripe(process.env.VITE_STRIPE_PUBLIC_KEY);

export const PaymentForm: React.FC<{
  amount: number;
  onSuccess: (paymentIntent: PaymentIntent) => void;
}> = ({ amount, onSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);

    try {
      // 1. Utwórz PaymentIntent na backendzie
      const { data: paymentIntent } = await fetch(
        "/api/create-payment-intent",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount: 4900 }), // 49.00 EUR w centach
        }
      ).then((r) => r.json());

      // 2. Potwierdź płatność
      const result = await stripe.confirmCardPayment(
        paymentIntent.client_secret,
        {
          payment_method: {
            card: elements.getElement(CardElement)!,
          },
        }
      );

      if (result.error) {
        throw new Error(result.error.message);
      }

      // 3. Sukces
      onSuccess(result.paymentIntent);
    } catch (error) {
      console.error(error);
      alert("Płatność nieudana: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 border rounded-lg">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: "16px",
                color: "#424770",
                "::placeholder": { color: "#aab7c4" },
              },
            },
          }}
        />
      </div>

      <Button
        type="submit"
        variant="primary"
        size="lg"
        disabled={!stripe || loading}
        loading={loading}
      >
        {loading ? "Przetwarzanie..." : `Zapłać €${amount.toFixed(2)}`}
      </Button>
    </form>
  );
};
```

**Rezultat:** Worker może zapłacić za egzamin ✅

---

## 📦 PODSUMOWANIE PLANU

### ✅ CO ZROBIMY:

1. **Fix Design Harmonogramu** (2-3h)

   - Przeprojektuj karty slotów
   - Dodaj progress bary capacity
   - Popraw modalne

2. **Worker Booking View** (3-4h)

   - Strona wyboru kategorii
   - Kalendarz z dostępnymi slotami
   - Payment integration

3. **Admin Applications Panel** (2-3h)

   - Lista aplikacji
   - Przyciski akceptacji/odrzucenia
   - Integracja z powiadomieniami

4. **Notification System** (1-2h)

   - Triggery dla kluczowych eventów
   - Email + SMS + Push
   - Cron jobs dla reminderów

5. **Payment Flow** (1-2h)
   - Stripe integration
   - Payment records
   - Refund logic

**CAŁKOWITY CZAS:** 9-14 godzin

---

## 🎯 NASTĘPNE KROKI (TERAZ)

### 1. Najpierw: FIX DESIGN (bez dotykania logiki)

```bash
# Otwórz istniejący plik
pages/Admin/TestSchedulerPageNew.tsx

# Znajdź sekcję kart slotów (linia ~430)
# Przeprojektuj tylko UI
```

### 2. Pytania do Usera:

❓ **Kategorie certyfikatów** - jakie dokładnie kategorie mamy?

- VCA?
- ISO?
- BHP?
- Inne?

❓ **Cena egzaminu** - €49.00 OK?

❓ **Refund policy** - jeśli admin odrzuci, zwracamy kasę?

❓ **Czy worker może wybrać tylko 1 datę, czy może zarezerwować kilka?**

❓ **Czy examiner_name jest wymagany, czy opcjonalny?**

---

**KONIEC RAPORTU CHIRURGICZNEGO** 📋
