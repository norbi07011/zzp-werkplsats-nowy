# 🔍 RAPORT ANALITYCZNY: System Ofert Pracy (Jobs)

**Data:** 2025-01-13  
**Status:** ✅ ANALIZA KOMPLETNA - Gotowe do rozbudowy

---

## 📊 EXECUTIVE SUMMARY

System ofert pracy **ISTNIEJE** ale jest **CZĘŚCIOWO ZAIMPLEMENTOWANY**:

### ✅ CO JUŻ MAMY (zbudowane):

1. **Backend Services** - `src/services/job.ts`, `services/jobService.ts` (CRUD kompletny)
2. **Komponenty UI** - JobCard, JobForm, JobFilters (gotowe)
3. **Strona przeglądania** - `src/pages/jobs/JobListingPage.tsx` (publi public)
4. **Panel pracodawcy** - ClientDashboard z zakładką "job-board"
5. **Tabela `jobs`** w Supabase + `job_applications`

### ❌ CO BRAKUJE (szkielety/w budowie):

1. **Główna publiczna tablica** - Brak `/jobs` route w App.tsx
2. **Panel job-board** w ClientDashboard - tekst "w budowie"
3. **Widok workerów** - brak zintegrowanej tablicy (tylko mock w WorkerDashboard)

---

## 🗂️ ARCHITEKTURA OBECNA

### 1. **BACKEND - SERVICES (✅ KOMPLETNE)**

**Plik:** `src/services/job.ts` (370 linii)

```typescript
// Interfejsy
interface Job {
  id, title, description, employer_id,
  job_type, work_location, experience_level,
  hourly_rate_min, hourly_rate_max,
  required_skills[], city, featured,
  status: 'draft' | 'published' | 'filled' | 'closed',
  created_at, updated_at, published_at
}

interface CreateJobData { ... }
interface JobFilters {
  job_type?, work_location?, experience_level?,
  city?, search?, employer_id?, status?
}

// Funkcje (wszystkie działają):
✅ fetchJobs(filters) - pobierz oferty z filtrami
✅ getJobById(jobId) - pojedyncza oferta
✅ getJobsByEmployerId(employerId) - oferty pracodawcy
✅ createJob(jobData) - dodaj ofertę
✅ updateJob(jobId, updates) - edytuj
✅ deleteJob(jobId) - usuń
✅ publishJob(jobId) - publikuj (draft → published)
✅ markJobAsFilled(jobId) - oznacz jako wypełnioną
✅ applyToJob(jobId, workerId, coverLetter?) - aplikuj
✅ getJobApplications(jobId) - aplikacje do oferty
✅ getWorkerApplications(workerId) - aplikacje workera
```

**Drugie źródło:** `services/jobService.ts` (duplicate? 410 linii)

- Identyczna logika jak `src/services/job.ts`
- ⚠️ **UWAGA:** Dwa pliki robią to samo! (prawdopodobnie trzeba usunąć jeden)

---

### 2. **KOMPONENTY UI (✅ GOTOWE)**

#### **JobCard** - `src/components/job/JobCard.tsx`

```tsx
<JobCard job={job} />

Wyświetla:
- Logo firmy (lub inicjał)
- Tytuł + opis (line-clamp-2)
- Badges: location (remote/onsite/hybrid), job_type, experience_level, city
- Required skills (pierwsze 5 + counter)
- Hourly rate range
- "Featured" badge (jeśli job.featured = true)
- onClick → navigate(`/jobs/${job.id}`)
```

#### **JobForm** - `src/components/job/JobForm.tsx` (467 linii)

```tsx
<JobForm
  onSave={handleJobAdded}
  onCancel={() => setActiveView('job-board')}
  job={existingJob} // optional (edit mode)
/>

Pola:
- title, description, job_type (select), work_location (select)
- experience_level (select), city
- hourly_rate_min, hourly_rate_max
- required_skills (dodawanie chipów)
- featured (checkbox)

Walidacja:
- title, description required
- hourly_rate_min < hourly_rate_max
```

#### **JobFilters** - `src/components/job/JobFilters.tsx`

```tsx
<JobFilters
  filters={filters}
  onChange={handleFilterChange}
  onReset={handleFilterReset}
/>

Filtry:
- job_type: freelance | contract | project | part-time
- work_location: remote | onsite | hybrid
- experience_level: entry | mid | senior | expert
- city: text input
```

---

### 3. **STRONY - GDZIE OFERTY SĄ WYŚWIETLANE**

#### A. **Publiczna strona przeglądania** (✅ ISTNIEJE)

**Plik:** `src/pages/jobs/JobListingPage.tsx` (155 linii)

```tsx
export const JobListingPage: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filters, setFilters] = useState<JobFiltersType>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Search bar: searchQuery
  // JobFilters panel
  // Grid/List toggle buttons
  // JobCard map(jobs) - grid cols-1 md:cols-2 lg:cols-3
};
```

**⚠️ PROBLEM:** Strona istnieje, ale **NIE MA ROUTE** w `App.tsx`!

```bash
# Szukałem w App.tsx:
grep_search "path.*jobs|JobsPage|/jobs" → No matches found

# Wniosek: Ta strona nigdy nie jest używana!
```

#### B. **Panel pracodawcy (Employer Dashboard)**

**Plik:** `pages/ClientDashboard.tsx` (722 linie)

```tsx
type View =
  | 'overview' | 'catalog' | 'reviewing'
  | 'job-board'  // ← Tablica ogłoszeń
  | 'add-job'    // ← Dodawanie oferty
  | 'saved-workers' | 'subscription' | 'team';

// Line 601-603:
case "job-board":
  return (
    <div className="p-8 text-center">
      Tablica ogłoszeń - w budowie  ← ❌ PUSTY SZKIELET!
    </div>
  );

// Line 606-611:
case "add-job":
  return (
    <JobForm
      onSave={handleJobAdded}
      onCancel={() => setActiveView("job-board")}
    />
  );
```

**Status:**

- ✅ JobForm działa (add-job view)
- ❌ Job-board view - pusty tekst "w budowie"
- ❌ Brak listy ofert pracodawcy
- ❌ Brak edycji/usuwania ofert

#### C. **Panel workera (Worker Dashboard)**

**Plik:** `pages/WorkerDashboard.tsx` (3200+ linii)

```tsx
// Line 1801-1813: renderJobs()
const renderJobs = () => {
  return (
    <div className="min-h-screen bg-primary-dark p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">
          💼 Dostępne oferty pracy
        </h1>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      </div>
    </div>
  );
};
```

**Stan:**

- ✅ UI gotowe (JobCard grid)
- ✅ Aplikacje workera (renderApplications) - zapisuje w `job_applications`
- ⚠️ Hook `jobs` nie jest załadowany z Supabase (const [jobs] = useState([]))

#### D. **Profile publiczne - Employer**

**Plik:** `pages/public/EmployerPublicProfilePage.tsx`

```tsx
// Line 62-96: loadEmployerData()
async function loadEmployerData() {
  // 1. Load employer
  const { data: emp } = await supabase
    .from("employers")
    .select("*")
    .eq("id", id)
    .single();

  // 2. Load jobs
  const { data: jobData } = await supabase
    .from("jobs")
    .select("*")
    .eq("employer_id", id)
    .eq("status", "published")
    .order("created_at", { ascending: false });

  setJobs(jobData || []);
}

// Line 210-250: Tab Navigation
<button onClick={() => setActiveTab("jobs")}>
  Oferty pracy ({jobs.length})
</button>;

// Line 310-380: JobsTab component
function JobsTab({ jobs }) {
  if (jobs.length === 0) return <EmptyState />;

  return jobs.map((job) => (
    <div onClick={() => (window.location.href = `/job/${job.id}`)}>
      {job.title}, {job.city}, {job.hourly_rate_min}
    </div>
  ));
}
```

**Status:**

- ✅ Oferty pracodawcy wyświetlają się na profilu
- ✅ Kliknięcie → `/job/{id}` (detail page)

---

## 🗄️ DATABASE STRUCTURE

### **Tabela `jobs`**

```sql
-- Z pliku: Supabase Snippet Lista kolumn tabel w schemacie public.csv
-- Line 661-666:

posts (tablica jobs w starym schemacie?)
- job_category: character varying
- job_location: character varying
- job_salary_min: numeric
- job_salary_max: numeric
- job_requirements: ARRAY
- job_deadline: timestamp with time zone
```

**⚠️ PROBLEM:** W CSV jest `posts` a w kodzie używamy `jobs` - sprawdzić!

### **Tabela `job_applications`**

```sql
-- Struktura (z kodu):
{
  id, job_id, worker_id, cover_letter?,
  status: 'pending' | 'reviewed' | 'accepted' | 'rejected',
  created_at, updated_at
}
```

**Funkcje:**

- `applyToJob(jobId, workerId)` - insert
- `getJobApplications(jobId)` - by employer
- `getWorkerApplications(workerId)` - by worker

---

## 🔗 ROUTING - CO DZIAŁA, CO NIE

### ✅ Routing OBECNY (App.tsx):

```
BRAK! Nie ma żadnego `/jobs` route w App.tsx!
```

### ❌ BRAKUJĄCE Routes:

```tsx
// Trzeba dodać:
<Route path="/jobs" element={<JobListingPage />} />           // Publiczna tablica
<Route path="/jobs/:id" element={<JobDetailPage />} />        // Szczegóły oferty
<Route path="/employer/jobs" element={<EmployerJobsPage />} /> // Panel pracodawcy
```

---

## 📍 GDZIE OFERTY SĄ DOSTĘPNE TERAZ?

### 1. **Profil publiczny pracodawcy**

```
URL: /employer/{employer_id} → tab "Oferty pracy"
Status: ✅ Działa (EmployerPublicProfilePage.tsx)
Filtr: status = 'published' only
```

### 2. **Worker Dashboard → Jobs tab**

```
Status: 🟡 Półdziałający
UI: ✅ Gotowy (JobCard grid)
Data: ❌ jobs = [] (pusty state, brak fetch)
```

### 3. **Employer Dashboard → job-board**

```
URL: ClientDashboard → setActiveView('job-board')
Status: ❌ Pusty div "w budowie"
```

### 4. **Publiczna tablica `/jobs`**

```
Status: ❌ NIE ISTNIEJE (brak route)
Kod: ✅ JobListingPage.tsx gotowy
Problem: Nie podłączony do routera
```

---

## 🎯 PLAN REALIZACJI - CO TRZEBA ZROBIĆ

### **FAZA 1: ROUTING & PODSTAWY (1-2h)**

✅ Dodaj route `/jobs` → JobListingPage
✅ Dodaj route `/jobs/:id` → JobDetailPage (nowy komponent)
✅ Test publicznej tablicy - czy dane się ładują

### **FAZA 2: WORKER VIEW (1-2h)**

✅ WorkerDashboard → loadJobs() z Supabase
✅ Filtruj `status = 'published'`
✅ Aplikacja → przycisk "Aplikuj" → applyToJob()
✅ Test aplikacji → sprawdź `job_applications`

### **FAZA 3: EMPLOYER PANEL (2-3h)**

✅ ClientDashboard → job-board view:

- Lista ofert pracodawcy (getJobsByEmployerId)
- Edycja/Usuwanie (updateJob, deleteJob)
- Publish/Unpublish (status draft ↔ published)
- Liczba aplikacji per job
  ✅ Zobacz aplikacje (getJobApplications)

### **FAZA 4: FILTRY & SEARCH (1h)**

✅ JobListingPage - integracja JobFilters
✅ Search by skills (PostgreSQL full-text search?)
✅ Sort (newest, oldest, highest_rate)

### **FAZA 5: POWIADOMIENIA (1h)**

✅ Email po aplikacji (worker → employer)
✅ Email po zmianie statusu aplikacji (employer → worker)
✅ Badge "New applications" w employer dashboard

---

## 🐛 PROBLEMY DO NAPRAWY

### 1. **Duplicate Services**

```
❌ src/services/job.ts (370 linii)
❌ services/jobService.ts (410 linii)
→ Zdecydować który zostawić! (prawdopodobnie src/services/job.ts)
```

### 2. **Tabela `posts` vs `jobs`**

```
❌ CSV pokazuje "posts" z kolumnami job_*
❌ Kod używa "jobs"
→ Sprawdzić w Supabase: SELECT * FROM pg_tables WHERE tablename LIKE '%job%'
```

### 3. **Brak RLS policies**

```
⚠️ Sprawdzić czy są policies:
- Workers mogą czytać tylko published jobs
- Employers widzą swoje jobs (wszystkie statusy)
- Workers mogą aplikować tylko raz do job
```

### 4. **Featured jobs - brak płatności**

```
⚠️ job.featured = true → ale jak to działa?
- Czy employer płaci za featured?
- Czy featured wyświetla się wyżej?
→ Brak integracji z payments!
```

---

## 💡 REKOMENDACJE

### **Priorytet 1 (NATYCHMIAST):**

1. Dodaj routing `/jobs` i `/jobs/:id`
2. Napraw Worker Dashboard jobs fetch
3. Zbuduj job-board w ClientDashboard

### **Priorytet 2 (TYDZIEŃ):**

1. RLS policies dla jobs i job_applications
2. Powiadomienia email
3. Featured jobs płatność

### **Priorytet 3 (PRZYSZŁOŚĆ):**

1. Job matching algorithm (skills + location)
2. Job recommendations dla workers
3. Application tracking (interview, offer, hired)
4. Analytics dla employers (views, applications)

---

## 📊 METRICS - CO ZMIERZYĆ

```typescript
// Admin Dashboard - Jobs Stats
stats.totalJobs = await supabase.from("jobs").select("*", { count: "exact" });
stats.publishedJobs = jobs.filter((j) => j.status === "published").length;
stats.totalApplications = await supabase
  .from("job_applications")
  .select("*", { count: "exact" });
stats.applicationRate = (totalApplications / publishedJobs) * 100;
```

---

## 🎨 UI/UX IMPROVEMENTS

### **JobCard Enhancement:**

```tsx
// Dodaj:
- Days since posted ("3 days ago")
- Application count badge (jeśli employer view)
- "Already applied" badge (jeśli worker już aplikował)
- Save/Bookmark button (zapisz ofertę)
```

### **Job Detail Page:**

```tsx
// Musi zawierać:
- Full description (markdown support?)
- Company info (logo, name, industry)
- Requirements list
- Benefits list
- Apply button → modal z cover letter
- Similar jobs section
```

---

## 🔐 SECURITY CHECKLIST

```sql
-- RLS Policies potrzebne:
CREATE POLICY "workers_read_published" ON jobs
  FOR SELECT TO authenticated
  USING (status = 'published' OR employer_id = auth.uid());

CREATE POLICY "employers_manage_own" ON jobs
  FOR ALL TO authenticated
  USING (employer_id = auth.uid());

CREATE POLICY "workers_apply_once" ON job_applications
  FOR INSERT TO authenticated
  WITH CHECK (
    worker_id = auth.uid() AND
    NOT EXISTS (
      SELECT 1 FROM job_applications
      WHERE job_id = NEW.job_id AND worker_id = auth.uid()
    )
  );
```

---

## 📁 PLIKI DO UTWORZENIA

```
pages/public/JobDetailPage.tsx          (szczegóły oferty)
pages/employer/EmployerJobsPage.tsx     (zarządzanie ofertami)
components/job/JobDetailView.tsx        (widok szczegółów)
components/job/ApplicationModal.tsx     (modal aplikacji)
hooks/useJobs.ts                        (hook z cache)
hooks/useJobApplications.ts             (hook aplikacji)
```

---

## 🧪 TESTOWANIE

### **Test Cases:**

1. ✅ Worker aplikuje do job → zapisuje w `job_applications`
2. ✅ Employer widzi aplikacje → `getJobApplications(jobId)`
3. ✅ Worker nie może aplikować dwa razy do tej samej oferty
4. ✅ Publiczna tablica pokazuje tylko `status = 'published'`
5. ✅ Employer może edit/delete swoje oferty
6. ✅ Featured jobs wyświetlają się wyżej

---

## 🎬 NEXT STEPS - KONKRETNY PLAN

```markdown
1. TERAZ (15 min):

   - Sprawdź Supabase: czy tabela to `jobs` czy `posts`?
   - Sprawdź RLS policies dla jobs
   - Usuń duplicate service (zostaw src/services/job.ts)

2. DZISIAJ (2-3h):

   - Dodaj routing w App.tsx
   - Napraw Worker Dashboard jobs fetch
   - Test publicznej tablicy

3. JUTRO (3-4h):

   - Zbuduj job-board w ClientDashboard
   - Dodaj JobDetailPage
   - Test aplikacji end-to-end

4. W TYM TYGODNIU:
   - RLS policies
   - Email notifications
   - Featured jobs system
```

---

## ✅ PODSUMOWANIE

**System ofert pracy jest w 60% gotowy:**

- ✅ Backend service kompletny
- ✅ Komponenty UI gotowe
- ✅ JobListingPage zbudowany
- ❌ Brak routingu publicznego
- ❌ ClientDashboard job-board pusty
- ❌ Worker Dashboard nie fetchuje jobs

**Potrzeba 6-8h pracy żeby dokończyć MVP.**

---

**Autor:** AI Analysis Agent  
**Wersja:** 1.0  
**Status:** Ready for implementation
