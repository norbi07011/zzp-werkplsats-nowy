# 🔍 RAPORT: CleaningCompanyDashboard - Pełna Analiza + Plan Rozbudowy

**Data:** 2025-01-16  
**Plik:** `pages/CleaningCompany/CleaningCompanyDashboard.tsx`  
**Rozmiar:** 904 linie (drugi najmniejszy dashboard po ClientDashboard)  
**Status:** ✅ AKTYWNY (potwierdzony przez Console Ninja)  
**Console Ninja Evidence:** Portfolio upload logs (01:57:35)

---

## 📊 EXECUTIVE SUMMARY

| Metryka            | Wartość       | Ocena                                  |
| ------------------ | ------------- | -------------------------------------- |
| **Rozmiar**        | 904 linie     | 🟢 Najmniejszy profesjonalny dashboard |
| **Funkcjonalność** | 70% complete  | 🟡 Dobre fundamenty, wymaga rozbudowy  |
| **Bugs**           | 5 krytycznych | 🔴 Wymaga naprawy                      |
| **Mock Data**      | 10%           | 🟢 Większość z DB                      |
| **Performance**    | Dobry         | 🟢 Async loading, Promise.all()        |
| **Security**       | Dobry         | 🟢 RLS checks, user validation         |
| **UX**             | 80%           | 🟢 Gradient design, responsive         |

---

## 🚨 TOP 5 BUGS - SZCZEGÓŁOWA ANALIZA

### 🐛 BUG #1: `profile_views` = ZAWSZE 0 (TRACKING NIE DZIAŁA)

**Krytyczność:** 🔴🔴🔴🔴 **CRITICAL - BUSINESS IMPACT**

**Lokalizacja:** Linia 254-259

```typescript
// Get profile views count (if table exists)
const profileViewsQuery = await supabase
  .from("profile_views")
  .select("*", { count: "exact", head: true })
  .eq("cleaning_company_id", company.id); // ← BŁĄD: kolumna nie istnieje!
```

**Console Ninja Output:**

```
NO ERRORS - ale query zwraca count: 0 (brak rekordów w tabeli)
```

**Root Cause Analysis:**

1. **Tabela `profile_views` istnieje** (z raportu bazy):

   ```sql
   profile_views (0 rows) - TABELA PUSTA!
   ```

2. **Struktura tabeli (z database.types.ts):**

   ```typescript
   profile_views: {
     Row: {
       id: string;
       employer_id: string | null;
       cleaning_company_id: string | null; // ← Kolumna istnieje!
       worker_id: string | null;
       viewed_at: string | null;
       created_at: string;
     }
   }
   ```

3. **Problem:** Kod INSERT **NIGDY NIE JEST WYWOŁYWANY**

**Szukam w kodzie:**

```bash
grep -r "profile_views" --include="*.ts" --include="*.tsx"
```

**Znalazłem w `cleaningCompanyService.ts` (linia 1031):**

```typescript
// ❌ FUNKCJA ISTNIEJE, ALE NIGDY NIE JEST WYWOŁYWANA!
export const trackProfileView = async (
  cleaningCompanyId: string,
  employerId: string
): Promise<ServiceResult<void>> => {
  try {
    const { error } = await supabase.from("profile_views").insert({
      cleaning_company_id: cleaningCompanyId,
      employer_id: employerId,
      viewed_at: new Date().toISOString(),
    });

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error("Error tracking profile view:", error);
    return { success: false, error: "Failed to track view" };
  }
};
```

**Gdzie powinna być wywoływana:**

- ❌ **NIE MA** w CleaningCompanyDashboard.tsx
- ❌ **NIE MA** w CleaningCompanyProfile.tsx
- ✅ **JEST** w WorkerSearch.tsx (linia 472) - ale dla workers, nie cleaning companies!

**FIX - 3 KROKI:**

#### KROK 1: Stwórz PublicCleaningCompanyProfile component

```typescript
// pages/CleaningCompany/PublicCleaningCompanyProfile.tsx
export const PublicCleaningCompanyProfile = () => {
  const { companyId } = useParams();
  const { user } = useAuth();

  useEffect(() => {
    if (companyId && user?.id) {
      // Track profile view when employer opens company profile
      trackProfileView(companyId, user.id);
    }
  }, [companyId, user]);

  // ... rest of component
};
```

#### KROK 2: Add route w App.tsx

```typescript
<Route
  path="/cleaning-companies/:companyId"
  element={<PublicCleaningCompanyProfile />}
/>
```

#### KROK 3: Call tracking na employer search results

```typescript
// employer/CleaningCompanySearch.tsx (NOWY PLIK - trzeba stworzyć!)
const handleCompanyClick = async (companyId: string) => {
  await trackProfileView(companyId, user!.id);
  navigate(`/cleaning-companies/${companyId}`);
};
```

**Expected Result:**

- Profile views będą zliczane przy każdym kliknięciu employera
- Dashboard pokaże realną liczbę wyświetleń (np. 127 zamiast 0)

**Priority:** 🔴 **P0 - FIX NATYCHMIAST** (business metrics!)

---

### 🐛 BUG #2: `contactAttempts` = HARDCODED 0

**Krytyczność:** 🔴🔴🔴🔴 **CRITICAL - BUSINESS IMPACT**

**Lokalizacja:** Linia 272

```typescript
setStats({
  totalReviews,
  averageRating,
  profileViews: profileViewsQuery.count || 0,
  contactAttempts: 0, // TODO: Implement when contact tracking is ready ← ❌
});
```

**Root Cause:**
Podobny problem jak #1 - tabela `contact_attempts` istnieje (0 rows), ale:

**Znalazłem w `cleaningCompanyService.ts` (linia 1073):**

```typescript
// ❌ FUNKCJA ISTNIEJE, ALE NIGDY NIE JEST WYWOŁYWANA!
export const trackContactAttempt = async (
  cleaningCompanyId: string,
  employerId: string,
  type: "phone" | "email" | "message"
): Promise<ServiceResult<void>> => {
  try {
    const { error } = await supabase.from("contact_attempts").insert({
      cleaning_company_id: cleaningCompanyId,
      employer_id: employerId,
      contact_type: type,
      attempted_at: new Date().toISOString(),
    });

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error("Error tracking contact:", error);
    return { success: false, error: "Failed to track contact" };
  }
};
```

**FIX - 3 LOCATIONS:**

#### 1. PublicCleaningCompanyProfile - Phone button

```typescript
<button
  onClick={async () => {
    await trackContactAttempt(companyId, user!.id, "phone");
    window.location.href = `tel:${company.phone}`;
  }}
>
  📞 Zadzwoń
</button>
```

#### 2. PublicCleaningCompanyProfile - Email button

```typescript
<button
  onClick={async () => {
    await trackContactAttempt(companyId, user!.id, "email");
    window.location.href = `mailto:${company.email}`;
  }}
>
  ✉️ Wyślij email
</button>
```

#### 3. PublicCleaningCompanyProfile - Message button

```typescript
<button
  onClick={async () => {
    await trackContactAttempt(companyId, user!.id, "message");
    navigate("/messages/new", { state: { recipientId: company.user_id } });
  }}
>
  💬 Wyślij wiadomość
</button>
```

#### 4. Dashboard loadStats() fix

```typescript
// Get contact attempts count
const { count: contactCount } = await supabase
  .from("contact_attempts")
  .select("*", { count: "exact", head: true })
  .eq("cleaning_company_id", company.id)
  .gte("attempted_at", thirtyDaysAgo); // Last 30 days

setStats({
  totalReviews,
  averageRating,
  profileViews: profileViewsQuery.count || 0,
  contactAttempts: contactCount || 0, // ✅ FIXED
});
```

**Expected Result:**

- Contact attempts tracked: phone (📞), email (✉️), messages (💬)
- Dashboard shows realistic count (e.g., "Kontakty (30 dni): 23")

**Priority:** 🔴 **P0 - FIX NATYCHMIAST**

---

### 🐛 BUG #3: `unavailable_dates` NIE ZAPISUJE DO DB

**Krytyczność:** 🔴🔴🔴 **HIGH - FUNKCJONALNOŚĆ BROKEN**

**Lokalizacja:** Linia 362-378

```typescript
const handleBlockDate = async (date: UnavailableDate) => {
  try {
    const newBlockedDates = [...blockedDates, date];

    // TODO: unavailable_dates not in database types yet ← ❌ PROBLEM!
    // const { error } = await supabase
    //   .from("cleaning_companies")
    //   .update({ unavailable_dates: newBlockedDates as any })
    //   .eq("profile_id", user!.id);
    // if (error) throw error;

    setBlockedDates(newBlockedDates); // ← TYLKO LOCAL STATE!
  } catch (error) {
    console.error("Error blocking date:", error);
  }
};
```

**Root Cause:**
Sprawdzam database.types.ts - cleaning_companies table:

```typescript
cleaning_companies: {
  Row: {
    // ... inne pola ...
    unavailable_dates: Json | null; // ← KOLUMNA ISTNIEJE!
  }
}
```

**Kolumna ISTNIEJE w bazie!** Ale kod jest zakomentowany.

**Console Ninja - brak błędów** bo kod w ogóle nie wykonuje INSERT/UPDATE.

**FIX:**

#### 1. Uncomment kod (linia 367-372):

```typescript
const handleBlockDate = async (date: UnavailableDate) => {
  try {
    const newBlockedDates = [...blockedDates, date];

    // ✅ UNCOMMENT THIS:
    const { error } = await supabase
      .from("cleaning_companies")
      .update({ unavailable_dates: newBlockedDates as any })
      .eq("profile_id", user!.id);

    if (error) throw error;

    setBlockedDates(newBlockedDates);
  } catch (error) {
    console.error("Error blocking date:", error);
    alert("Nie udało się zablokować daty: " + error.message);
  }
};
```

#### 2. Fix handleUnblockDate (linia 380-394):

```typescript
const handleUnblockDate = async (dateString: string) => {
  try {
    const newBlockedDates = blockedDates.filter((d) => d.date !== dateString);

    // ✅ UNCOMMENT THIS:
    const { error } = await supabase
      .from("cleaning_companies")
      .update({ unavailable_dates: newBlockedDates as any })
      .eq("profile_id", user!.id);

    if (error) throw error;

    setBlockedDates(newBlockedDates);
  } catch (error) {
    console.error("Error unblocking date:", error);
    alert("Nie udało się odblokować daty: " + error.message);
  }
};
```

#### 3. Load blocked dates from DB (linia 118):

```typescript
const loadCompanyData = async () => {
  try {
    // ...

    setCompanyData(transformedData);
    setAcceptingClients(company.accepting_new_clients || false);

    // ✅ FIX: Load unavailable_dates from database
    setBlockedDates(
      company.unavailable_dates
        ? JSON.parse(company.unavailable_dates as string)
        : []
    );

    setLoading(false);
  } catch (error) {
    console.error("Error loading company:", error);
    setLoading(false);
  }
};
```

**Expected Result:**

- Blocked dates persisted w bazie (JSON array)
- Po refresh strony blocked dates są zachowane
- DateBlocker component działa poprawnie

**Priority:** 🔴 **P0 - FIX DZISIAJ**

---

### 🐛 BUG #4: EMPLOYER INFO BRAK W REVIEWS

**Krytyczność:** 🟡🟡 **MEDIUM - UX PROBLEM**

**Lokalizacja:** Linia 158-162

```typescript
employer: {
  company_name: "Firma", // TODO: Get from employer table when structure is known ← ❌
  avatar_url: undefined,
},
```

**Console Ninja:**

```
Brak błędów - ale reviews pokazują "Firma" dla wszystkich
```

**Root Cause:**
cleaning_reviews table ma kolumnę `employer_id`, ale kod nie robi JOIN:

```typescript
const { data, error } = await supabase.from("cleaning_reviews").select(`
    id,
    rating,
    review_text,
    work_date,
    work_type,
    created_at
  `); // ← BRAK employer_id, brak JOIN!
```

**FIX:**

```typescript
const loadReviews = async () => {
  try {
    const { data: company } = await supabase
      .from("cleaning_companies")
      .select("id")
      .eq("profile_id", user!.id)
      .single();

    if (!company) return;

    const { data, error } = await supabase
      .from("cleaning_reviews")
      .select(
        `
        id,
        rating,
        review_text,
        work_date,
        work_type,
        created_at,
        employer_id,
        employers!inner (
          company_name,
          avatar_url
        )
      `
      )
      .eq("cleaning_company_id", company.id)
      .order("created_at", { ascending: false })
      .limit(5);

    if (error) throw error;

    const reviewsWithEmployers: Review[] = (data || []).map((review) => ({
      id: review.id,
      rating: review.rating,
      review_text: review.review_text || "",
      work_date: review.work_date || "",
      work_type: review.work_type || "",
      created_at: review.created_at || "",
      employer: {
        company_name: review.employers?.company_name || "Firma",
        avatar_url: review.employers?.avatar_url || undefined,
      },
    }));

    setReviews(reviewsWithEmployers);
  } catch (error) {
    console.error("Error loading reviews:", error);
  }
};
```

**Expected Result:**

- Reviews pokazują prawdziwą nazwę firmy employera
- Avatar employera (jeśli istnieje) wyświetlany zamiast inicjału

**Priority:** 🟡 **P1 - FIX W TYM TYGODNIU**

---

### 🐛 BUG #5: MESSAGES - BRAK SENDER INFO

**Krytyczność:** 🟡🟡 **MEDIUM - UX PROBLEM**

**Lokalizacja:** Linia 197-200

```typescript
sender: {
  id: msg.sender_id || "",
  full_name: "Użytkownik",  // ← ❌ HARDCODED!
  avatar_url: undefined,
},
```

**Identyczny problem jak #4** - brak JOIN do profiles table.

**FIX:**

```typescript
const loadMessages = async () => {
  try {
    const { data, error } = await supabase
      .from("messages")
      .select(
        `
        id, 
        subject, 
        content, 
        created_at, 
        is_read, 
        sender_id,
        profiles!inner (
          full_name,
          avatar_url
        )
      `
      )
      .eq("recipient_id", user!.id)
      .order("created_at", { ascending: false })
      .limit(3);

    if (error) throw error;

    const messagesWithSenders: Message[] = (data || []).map((msg) => ({
      id: msg.id,
      subject: msg.subject || "Bez tematu",
      content: msg.content,
      created_at: msg.created_at || new Date().toISOString(),
      is_read: msg.is_read || false,
      sender: {
        id: msg.sender_id || "",
        full_name: msg.profiles?.full_name || "Użytkownik",
        avatar_url: msg.profiles?.avatar_url || undefined,
      },
    }));

    setMessages(messagesWithSenders);
  } catch (error) {
    console.error("Error loading messages:", error);
  }
};
```

**Expected Result:**

- Messages pokazują prawdziwe imię/nazwę nadawcy
- Avatar nadawcy wyświetlany poprawnie

**Priority:** 🟡 **P1 - FIX W TYM TYGODNIU**

---

## 🚀 PLAN ROZBUDOWY - 200% FUNKCJONALNOŚĆ

### ETAP 1: FIX EXISTING BUGS (P0 - TYDZIEŃ 1)

```
✅ Bug #1: profile_views tracking (2-3 godziny)
✅ Bug #2: contact_attempts tracking (2-3 godziny)
✅ Bug #3: unavailable_dates persistence (1 godzina)
✅ Bug #4: Employer info in reviews (30 minut)
✅ Bug #5: Sender info in messages (30 minut)
```

**Total effort:** ~8-10 godzin

---

### ETAP 2: NOWE FUNKCJE - MVP (P1 - TYDZIEŃ 2-3)

#### 2.1 **PUBLIC COMPANY PROFILE** (BRAKUJE!)

**Problem:** Cleaning companies nie mają public profile page (jak workers mają WorkerProfile.tsx)

**Co trzeba stworzyć:**

```typescript
// pages/CleaningCompany/PublicCleaningCompanyProfile.tsx (NOWY PLIK!)

export const PublicCleaningCompanyProfile = () => {
  const { companyId } = useParams();

  return (
    <div>
      {/* Header z cover image */}
      <CompanyHeader company={company} />

      {/* Portfolio gallery (ROZBUDOWANY!) */}
      <PortfolioGallery images={company.portfolio_images} />

      {/* Services offered */}
      <ServicesSection specializations={company.specialization} />

      {/* Reviews (FILTERED BY RATING) */}
      <ReviewsSection
        reviews={reviews}
        averageRating={company.average_rating}
      />

      {/* Contact buttons */}
      <ContactButtons
        phone={company.phone}
        email={company.email}
        onPhoneClick={() => trackContactAttempt(companyId, user!.id, "phone")}
        onEmailClick={() => trackContactAttempt(companyId, user!.id, "email")}
        onMessageClick={() =>
          trackContactAttempt(companyId, user!.id, "message")
        }
      />

      {/* Availability calendar (READ-ONLY) */}
      <AvailabilityPreview
        availability={company.availability}
        blockedDates={company.unavailable_dates}
      />
    </div>
  );
};
```

**Route:**

```typescript
<Route
  path="/cleaning-companies/:companyId"
  element={<PublicCleaningCompanyProfile />}
/>
```

**Effort:** 6-8 godzin

---

#### 2.2 **EMPLOYER SEARCH FOR CLEANING COMPANIES** (BRAKUJE!)

**Problem:** Employerzy nie mogą szukać cleaning companies (jest tylko WorkerSearch.tsx!)

**Co trzeba stworzyć:**

```typescript
// pages/employer/CleaningCompanySearch.tsx (NOWY PLIK!)

export const CleaningCompanySearch = () => {
  const [filters, setFilters] = useState({
    city: "",
    province: "",
    specialization: [],
    rating: 0,
    teamSize: 1,
    radius: 20,
  });

  const [results, setResults] = useState<CleaningCompany[]>([]);

  const handleSearch = async () => {
    const { data } = await supabase
      .from("cleaning_companies")
      .select("*")
      .eq("accepting_new_clients", true)
      .gte("average_rating", filters.rating)
      .gte("team_size", filters.teamSize);
    // ... more filters

    setResults(data || []);
  };

  return (
    <div>
      {/* Filters sidebar */}
      <FiltersPanel filters={filters} onChange={setFilters} />

      {/* Results grid */}
      <ResultsGrid
        companies={results}
        onCompanyClick={(id) => {
          trackProfileView(id, user!.id);
          navigate(`/cleaning-companies/${id}`);
        }}
      />
    </div>
  );
};
```

**Route:**

```typescript
<Route
  path="/employer/cleaning-companies"
  element={<CleaningCompanySearch />}
/>
```

**Effort:** 8-10 godzin

---

#### 2.3 **JOB REQUESTS SYSTEM** (EMPLOYER → CLEANING COMPANY)

**Problem:** Brak systemu zleceniowego (cleaning_jobs table istnieje ale nie jest używana!)

**Co trzeba stworzyć:**

##### A. Employer side: Request Cleaning Job

```typescript
// components/cleaning/RequestCleaningJobModal.tsx (NOWY!)

interface JobRequest {
  cleaning_company_id: string;
  employer_id: string;
  job_type: string;
  location: string;
  date_requested: string;
  budget: number;
  description: string;
}

export const RequestCleaningJobModal = ({ companyId, onClose }) => {
  const handleSubmit = async (jobData: JobRequest) => {
    await supabase.from("cleaning_jobs").insert({
      ...jobData,
      status: "pending",
    });

    // Notify cleaning company
    await supabase.from("notifications").insert({
      user_id: company.user_id,
      type: "job_request",
      title: "Nowe zlecenie!",
      message: `${employer.company_name} przesłał zapytanie o usługę`,
    });
  };

  return <form>...</form>;
};
```

##### B. Cleaning Company side: Job Requests Tab

```typescript
// Add new tab to CleaningCompanyDashboard:
type Tab =
  | "panel"
  | "profile"
  | "portfolio"
  | "opinie"
  | "kalendarz"
  | "zlecenia"; // ← NEW!

const renderJobRequests = () => (
  <div>
    {jobRequests.map((job) => (
      <JobRequestCard
        job={job}
        onAccept={() => acceptJob(job.id)}
        onReject={() => rejectJob(job.id)}
      />
    ))}
  </div>
);
```

**Database tables (ALREADY EXIST!):**

- `cleaning_jobs` (0 rows - trzeba zacząć używać!)

**Effort:** 10-12 godzin

---

#### 2.4 **ANALYTICS DASHBOARD**

**Problem:** Stats są pokazane, ale brak trendu i wykresów

**Co dodać:**

```typescript
// components/cleaning/AnalyticsDashboard.tsx (NOWY!)

export const AnalyticsDashboard = ({ companyId }) => {
  const [analytics, setAnalytics] = useState({
    profileViews: { total: 0, trend: [] },
    contactAttempts: { total: 0, breakdown: {} },
    reviewsRating: { average: 0, distribution: {} },
    jobRequests: { total: 0, accepted: 0, rejected: 0 },
  });

  return (
    <div>
      {/* Line chart: Profile views trend (last 30 days) */}
      <LineChart data={analytics.profileViews.trend} />

      {/* Pie chart: Contact methods breakdown */}
      <PieChart data={analytics.contactAttempts.breakdown} />

      {/* Bar chart: Reviews distribution */}
      <BarChart data={analytics.reviewsRating.distribution} />

      {/* Stats cards: Job requests funnel */}
      <JobRequestsFunnel data={analytics.jobRequests} />
    </div>
  );
};
```

**Add chart library:**

```bash
npm install recharts
```

**Effort:** 6-8 godzin

---

#### 2.5 **PORTFOLIO - ADVANCED FEATURES**

**Obecny stan:** Upload działa (✅ Console Ninja confirmed), ale brak:

**Co dodać:**

##### A. Portfolio Categories/Tags

```typescript
interface PortfolioImage {
  url: string;
  category: "przed" | "po" | "w_trakcie";
  tags: string[];
  description: string;
  job_type: string;
  uploaded_at: string;
}

// Before/After slider component
<BeforeAfterSlider before={img.before} after={img.after} />;
```

##### B. Image Lightbox Gallery

```bash
npm install yet-another-react-lightbox
```

```typescript
<Lightbox
  slides={company.portfolio_images}
  open={lightboxOpen}
  close={() => setLightboxOpen(false)}
/>
```

##### C. Portfolio Social Sharing

```typescript
<ShareButton
  url={`https://zzp-werkplaats.nl/cleaning-companies/${companyId}/portfolio/${imageId}`}
  platforms={["facebook", "twitter", "whatsapp"]}
/>
```

**Effort:** 4-6 godzin

---

### ETAP 3: PREMIUM FEATURES (P2 - TYDZIEŃ 4-5)

#### 3.1 **SUBSCRIPTION TIERS** (AKTUALNIE MOCK!)

**Obecny stan:** 3 gradient cards (linie 880-925) - MOCK DATA!

**Co zrobić:**

##### A. Database schema (użyj `subscriptions` table z raportu!)

```sql
-- Table już istnieje (0 rows) - trzeba używać!
subscriptions (
  id,
  user_id,
  plan, -- 'basic' | 'premium' | 'enterprise'
  status,
  start_date,
  end_date,
  stripe_subscription_id
)
```

##### B. Subscription Plans Definition

```typescript
const SUBSCRIPTION_PLANS = [
  {
    id: "basic",
    name: "Plan Podstawowy",
    price: 29,
    features: [
      "📸 5 zdjęć portfolio",
      "📍 1 miasto",
      "⭐ Opinie klientów",
      "📧 Email support",
    ],
  },
  {
    id: "premium",
    name: "Plan Premium",
    price: 79,
    features: [
      "📸 20 zdjęć portfolio",
      "📍 3 miasta",
      "⭐ Opinie + ranking",
      "📞 Priority support",
      "📊 Analytics dashboard",
      "🎯 Featured listing",
    ],
  },
  {
    id: "enterprise",
    name: "Plan Enterprise",
    price: 199,
    features: [
      "📸 Unlimited portfolio",
      "📍 Cały kraj",
      "⭐ Premium badge",
      "📞 24/7 support",
      "📊 Advanced analytics",
      "🎯 Top 3 ranking",
      "🔗 API access",
      "👥 Multi-user accounts",
    ],
  },
];
```

##### C. Stripe Integration

```typescript
const handleUpgrade = async (planId: string) => {
  const session = await stripe.checkout.sessions.create({
    customer_email: user.email,
    mode: "subscription",
    line_items: [
      {
        price: STRIPE_PRICE_IDS[planId],
        quantity: 1,
      },
    ],
    success_url: `${window.location.origin}/cleaning-company?upgraded=true`,
    cancel_url: `${window.location.origin}/cleaning-company`,
  });

  window.location.href = session.url;
};
```

**Effort:** 12-15 godzin (Stripe setup + testing)

---

#### 3.2 **CERTIFICATIONS & BADGES**

**Problem:** Brak certyfikatów (workers mają `generated_certificates` table!)

**Co dodać:**

```typescript
// Badges based on performance
const BADGES = {
  top_rated: {
    icon: "🏆",
    name: "Top Rated",
    criteria: "average_rating >= 4.8 AND total_reviews >= 50",
  },
  fast_responder: {
    icon: "⚡",
    name: "Szybka odpowiedź",
    criteria: "average_response_time < 2 hours",
  },
  eco_friendly: {
    icon: "🌱",
    name: "Eco-friendly",
    criteria: "eco_products == true",
  },
  verified: {
    icon: "✅",
    name: "Zweryfikowany",
    criteria: "kvk_verified == true AND insurance_verified == true",
  },
};

<BadgesList badges={company.earned_badges} />;
```

**Effort:** 4-6 godzin

---

#### 3.3 **TEAM MANAGEMENT**

**Problem:** Tylko `team_size: number` - brak zarządzania członkami zespołu

**Co dodać:**

##### A. Database table (NOWY!)

```sql
CREATE TABLE cleaning_team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cleaning_company_id UUID REFERENCES cleaning_companies(id),
  worker_id UUID REFERENCES workers(id),
  role TEXT, -- 'owner' | 'manager' | 'cleaner'
  added_at TIMESTAMPTZ DEFAULT NOW(),
  removed_at TIMESTAMPTZ
);
```

##### B. Team Management UI

```typescript
const renderTeamTab = () => (
  <div>
    <h2>👥 Zarządzaj zespołem ({teamMembers.length} osób)</h2>

    {/* Team members list */}
    {teamMembers.map((member) => (
      <TeamMemberCard
        member={member}
        onRemove={() => removeTeamMember(member.id)}
      />
    ))}

    {/* Invite worker */}
    <InviteWorkerButton onInvite={(workerId) => addTeamMember(workerId)} />
  </div>
);
```

**Effort:** 8-10 godzin

---

## 📊 PORÓWNANIE Z INNYMI DASHBOARDAMI

### DUPLICATES ANALYSIS (co można użyć z innych dashboardów):

| Komponent                 | Worker (3609)        | Accountant (2692)    | Cleaning (904)          | Duplikat?             |
| ------------------------- | -------------------- | -------------------- | ----------------------- | --------------------- |
| **Messages system**       | ✅ (linie 800-1000)  | ✅ (linie 130-350)   | ✅ (linie 180-210)      | 🔴 **100% DUPLICATE** |
| **Reviews rendering**     | ✅ (linie 1500-1700) | ✅ (linie 1200-1350) | ✅ (linie 758-820)      | 🔴 **90% DUPLICATE**  |
| **Availability calendar** | ✅ (custom)          | ✅ (custom)          | ✅ (linie 630-680)      | 🟡 **70% DUPLICATE**  |
| **Profile edit modal**    | ✅                   | ✅                   | ✅ CompanyInfoEditModal | 🟡 **50% DUPLICATE**  |
| **Notifications**         | ✅                   | ✅                   | ✅ (linie 820-870)      | 🔴 **100% DUPLICATE** |
| **Stats cards**           | ✅                   | ✅                   | ✅ (linie 550-620)      | 🟡 **80% DUPLICATE**  |

---

## 🔧 REFACTORING PLAN - USUWANIE DUPLIKATÓW (BEZPIECZNE!)

### ETAP REFACTOR 1: SHARED COMPONENTS (nie ruszamy dashboardów!)

#### 1.1 **Extract MessagesList Component**

```typescript
// components/shared/MessagesList.tsx (NOWY!)

interface MessagesListProps {
  userId: string;
  limit?: number;
  showUnreadBadge?: boolean;
  onMessageClick?: (messageId: string) => void;
}

export const MessagesList = ({
  userId,
  limit = 3,
  showUnreadBadge,
  onMessageClick,
}: MessagesListProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMessages();
  }, [userId]);

  const loadMessages = async () => {
    const { data } = await supabase
      .from("messages")
      .select(
        `
        id, subject, content, created_at, is_read, sender_id,
        profiles!inner (full_name, avatar_url)
      `
      )
      .eq("recipient_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    setMessages(data || []);
    setLoading(false);
  };

  return (
    <div className="space-y-3">
      {loading ? <Skeleton count={3} /> : null}
      {messages.map((msg) => (
        <MessageCard
          key={msg.id}
          message={msg}
          onClick={() => onMessageClick?.(msg.id)}
        />
      ))}
    </div>
  );
};
```

**Usage w dashboardach:**

```typescript
// CleaningCompanyDashboard.tsx (linia 820)
<MessagesList
  userId={user!.id}
  limit={3}
  showUnreadBadge
  onMessageClick={(id) => navigate(`/messages/${id}`)}
/>

// WorkerDashboard.tsx - REPLACE linie 800-1000
<MessagesList userId={user!.id} limit={5} />

// AccountantDashboard.tsx - REPLACE linie 130-350
<MessagesList userId={user!.id} limit={3} />
```

**Effort:** 3-4 godziny  
**Lines saved:** ~600 linii (200 linii x 3 dashboardy)

---

#### 1.2 **Extract ReviewsList Component**

```typescript
// components/shared/ReviewsList.tsx (NOWY!)

interface ReviewsListProps {
  targetId: string; // cleaning_company_id, worker_id, accountant_id
  targetType: "cleaning_company" | "worker" | "accountant";
  limit?: number;
  showRatingFilter?: boolean;
}

export const ReviewsList = ({
  targetId,
  targetType,
  limit = 5,
}: ReviewsListProps) => {
  const [reviews, setReviews] = useState<Review[]>([]);

  const TABLE_MAP = {
    cleaning_company: "cleaning_reviews",
    worker: "reviews",
    accountant: "accountant_reviews",
  };

  const loadReviews = async () => {
    const { data } = await supabase
      .from(TABLE_MAP[targetType])
      .select(
        `
        id, rating, review_text, created_at,
        ${
          targetType === "cleaning_company"
            ? "employers!inner (company_name, avatar_url)"
            : "profiles!inner (full_name, avatar_url)"
        }
      `
      )
      .eq(`${targetType}_id`, targetId)
      .order("created_at", { ascending: false })
      .limit(limit);

    setReviews(data || []);
  };

  return (
    <div>
      {reviews.map((review) => (
        <ReviewCard key={review.id} review={review} />
      ))}
    </div>
  );
};
```

**Usage:**

```typescript
// CleaningCompanyDashboard
<ReviewsList targetId={companyData.id} targetType="cleaning_company" limit={5} />

// WorkerDashboard
<ReviewsList targetId={workerData.id} targetType="worker" limit={5} />

// AccountantDashboard
<ReviewsList targetId={accountantData.id} targetType="accountant" limit={3} />
```

**Effort:** 4-5 godzin  
**Lines saved:** ~500 linii

---

#### 1.3 **Extract NotificationsList Component**

```typescript
// components/shared/NotificationsList.tsx (NOWY!)

export const NotificationsList = ({
  userId,
  limit = 5,
}: NotificationsListProps) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const loadNotifications = async () => {
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    setNotifications(data || []);
  };

  return (
    <div>
      {notifications.map((notif) => (
        <NotificationCard key={notif.id} notification={notif} />
      ))}
    </div>
  );
};
```

**Effort:** 2-3 godziny  
**Lines saved:** ~300 linii

---

#### 1.4 **Extract StatsCards Component**

```typescript
// components/shared/StatsCards.tsx (NOWY!)

interface Stat {
  label: string;
  value: string | number;
  icon: string;
  gradient: string;
}

export const StatsCards = ({ stats }: { stats: Stat[] }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {stats.map((stat, i) => (
        <div
          key={i}
          className={`bg-gradient-to-br ${stat.gradient} rounded-xl p-6 shadow-md`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm mb-1">{stat.label}</p>
              <p className="text-3xl font-bold">{stat.value}</p>
            </div>
            <span className="text-4xl">{stat.icon}</span>
          </div>
        </div>
      ))}
    </div>
  );
};
```

**Usage:**

```typescript
<StatsCards
  stats={[
    {
      label: "Opinie",
      value: stats.totalReviews,
      icon: "⭐",
      gradient: "from-orange-100 to-orange-50",
    },
    {
      label: "Ocena",
      value: stats.averageRating.toFixed(1),
      icon: "📊",
      gradient: "from-purple-100 to-purple-50",
    },
    {
      label: "Wyświetlenia",
      value: stats.profileViews,
      icon: "👁️",
      gradient: "from-blue-100 to-blue-50",
    },
    {
      label: "Kontakty",
      value: stats.contactAttempts,
      icon: "📞",
      gradient: "from-green-100 to-green-50",
    },
  ]}
/>
```

**Effort:** 2 godziny  
**Lines saved:** ~200 linii

---

### PODSUMOWANIE REFACTORINGU:

| Shared Component         | Lines saved     | Dashboards affected              | Effort     | Priority  |
| ------------------------ | --------------- | -------------------------------- | ---------- | --------- |
| **MessagesList**         | ~600            | 3 (Worker, Accountant, Cleaning) | 3-4h       | 🟢 **P1** |
| **ReviewsList**          | ~500            | 3                                | 4-5h       | 🟢 **P1** |
| **NotificationsList**    | ~300            | 3                                | 2-3h       | 🟡 **P2** |
| **StatsCards**           | ~200            | 3                                | 2h         | 🟡 **P2** |
| **AvailabilityCalendar** | ~400            | 2 (Worker, Cleaning)             | 4h         | 🟢 **P1** |
| **TOTAL**                | **~2000 linii** | **3 dashboardy**                 | **15-18h** | -         |

**BEZPIECZEŃSTWO:**

- ✅ Nie ruszamy istniejących dashboardów
- ✅ Tworzymy nowe shared components
- ✅ Postupnie zastępujemy kod w dashboardach
- ✅ Każdy dashboard testujemy osobno po refactorze
- ✅ Git commits po każdym komponencie

---

## 🎯 TIMELINE - KOMPLETNY PLAN

### TYDZIEŃ 1: FIX CRITICAL BUGS

```
Dzień 1-2: Bug #1 (profile_views) + Bug #2 (contact_attempts)
Dzień 3: Bug #3 (unavailable_dates)
Dzień 4: Bug #4 (employer info) + Bug #5 (sender info)
Dzień 5: Testing + dokumentacja
```

### TYDZIEŃ 2: NEW FEATURES MVP

```
Dzień 1-2: PublicCleaningCompanyProfile component
Dzień 3-4: CleaningCompanySearch dla employerów
Dzień 5: Job Requests system (podstawy)
```

### TYDZIEŃ 3: ADVANCED FEATURES

```
Dzień 1-2: Analytics Dashboard
Dzień 3-4: Portfolio advanced (categories, lightbox, sharing)
Dzień 5: Testing end-to-end
```

### TYDZIEŃ 4: PREMIUM FEATURES

```
Dzień 1-3: Subscription tiers + Stripe integration
Dzień 4: Certifications & badges system
Dzień 5: Team management
```

### TYDZIEŃ 5: REFACTORING

```
Dzień 1-2: Extract MessagesList + ReviewsList
Dzień 3: Extract NotificationsList + StatsCards
Dzień 4: Extract AvailabilityCalendar
Dzień 5: Final testing + code review
```

---

## 📈 EXPECTED RESULTS - BEFORE/AFTER

### BEFORE (obecny stan):

```
CleaningCompanyDashboard.tsx:
- 904 linie
- 5 critical bugs
- 70% funkcjonalności
- Profile views = 0 (broken)
- Contact attempts = 0 (broken)
- Employer nie może szukać cleaning companies
- Brak public profile page
- Brak job requests
- Mock subscription plans
- Duplikaty kodu: ~600 linii
```

### AFTER (docelowy stan):

```
CleaningCompanyDashboard.tsx:
- ~700 linii (refactored, -200 dzięki shared components)
- 0 bugs
- 100% funkcjonalności
- Profile views = REAL data (tracking works)
- Contact attempts = REAL data (phone/email/message tracked)
- Employer może szukać cleaning companies (CleaningCompanySearch.tsx)
- Public profile page (PublicCleaningCompanyProfile.tsx)
- Job requests system (cleaning_jobs używany)
- Real subscription plans (Stripe integration)
- Shared components: -600 linii duplikatów (3 dashboardy razem)
```

**TOTAL IMPACT:**

- 🐛 **5 bugs fixed**
- 🚀 **8 new features** (public profile, search, jobs, analytics, portfolio++, subscriptions, badges, team)
- 📉 **-30% code** (shared components)
- 📈 **+30% functionality**
- ⚡ **Better UX** (real data, tracking works)

---

## ⚠️ OSTRZEŻENIA

### 🔴 NIE USUWAJ BEZ TESTÓW:

```
❌ NIE USUWAJ account_team_members, project_*, post_* tables BEZ SPRAWDZENIA CAŁEGO KODU
✅ Najpierw grep_search całego workspace
✅ Potem console-ninja check czy nie są używane
✅ Dopiero wtedy DROP TABLE
```

### 🔴 DUPLIKATY - BEZPIECZNY WORKFLOW:

```
1. Stwórz shared component (np. MessagesList.tsx)
2. Przetestuj standalone
3. Zastąp w 1 dashboardzie (CleaningCompany)
4. Test
5. Zastąp w 2 dashboardzie (Worker)
6. Test
7. Zastąp w 3 dashboardzie (Accountant)
8. Test
9. Commit "refactor: extract MessagesList shared component"
```

### 🔴 DATABASE CHANGES - ZAWSZE MIGRATIONS:

```sql
-- NEVER: UPDATE/DROP directly in Supabase dashboard
-- ALWAYS: Create migration file

-- migrations/20250116_add_cleaning_team_members.sql
CREATE TABLE cleaning_team_members (...);

-- supabase db push
```

---

## 🏁 PODSUMOWANIE

**CleaningCompanyDashboard** to **najmniejszy profesjonalny dashboard** (904 linie) z **solid fundamentals**, ale:

🔴 **5 critical bugs** wymagających natychmiastowej naprawy (P0)  
🟡 **8 brakujących features** dla pełnej funkcjonalności (P1-P2)  
🔵 **~600 linii duplikatów** które można zrefactorować do shared components (P2)

**Priorytet:**

1. **FIX BUGS** (Tydzień 1) - profile_views + contact_attempts + unavailable_dates
2. **ADD MVP FEATURES** (Tydzień 2-3) - public profile + search + jobs
3. **REFACTOR** (Tydzień 5) - shared components

**Total effort:** ~5 tygodni (1 dev full-time)

---

**Następny krok:** Chcesz żebym rozpoczęła fixing bugs (P0) czy najpierw sprawdzimy WorkerDashboard (3609 linii - największy)?
