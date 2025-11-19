# 🧹 CLEANING COMPANY - KOMPLETNY RAPORT BAZY DANYCH

**Data wygenerowania:** 15 listopada 2025
**Źródło:** Supabase PostgreSQL Database

---

## 📊 TABELE ZWIĄZANE Z CLEANING COMPANIES

### 1️⃣ **cleaning_companies** (Główna tabela - 33 kolumny)

#### **Podstawowe dane firmy:**

- `id` (uuid) - PRIMARY KEY
- `profile_id` (uuid) - FK → profiles.id
- `company_name` (text) - Nazwa firmy
- `owner_name` (text) - Właściciel
- `phone` (text) - Telefon
- `email` (text) - Email
- `kvk_number` (text) - Numer KVK

#### **Lokalizacja i zasięg:**

- `location_city` (text) - Miasto
- `location_province` (text) - Prowincja
- `service_radius_km` (integer) - Promień obsługi (default: 20 km)

#### **Specjalizacja i usługi:**

- `specialization` (text[]) - Array specjalizacji
  - Default: `['cleaning_after_construction']`
  - Możliwe wartości: cleaning_after_construction, deep_cleaning, office_cleaning, itp.
- `additional_services` (text[]) - Dodatkowe usługi
  - Default: `[]`

#### **Dostępność:**

- `availability` (jsonb) - Dostępność w dni tygodnia
  ```json
  {
    "monday": false,
    "tuesday": false,
    "wednesday": false,
    "thursday": false,
    "friday": false,
    "saturday": false,
    "sunday": false
  }
  ```
- `preferred_days_per_week` (integer) - Preferowana liczba dni/tydzień (default: 2)
- `unavailable_dates` (jsonb) - Zablokowane daty (default: `[]`)

#### **Cennik:**

- `hourly_rate_min` (numeric) - Minimalna stawka godzinowa
- `hourly_rate_max` (numeric) - Maksymalna stawka godzinowa
- `rate_negotiable` (boolean) - Czy stawka do negocjacji (default: true)

#### **Doświadczenie i zespół:**

- `years_experience` (integer) - Lata doświadczenia (default: 0)
- `team_size` (integer) - Wielkość zespołu (default: 1)
- `bio` (text) - Opis firmy

#### **Portfolio i media:**

- `portfolio_images` (text[]) - Array URL-i zdjęć portfolio
  - Default: `[]`
  - Storage bucket: `portfolio-images`
- `avatar_url` (text) - URL avatara firmy
  - Storage bucket: `project-files/cleaning-avatars`
- `cover_image_url` (text) - URL zdjęcia okładki
  - Storage bucket: `avatars/cover-images`

#### **Opinie i rankingi:**

- `average_rating` (numeric) - Średnia ocena (default: 0)
- `total_reviews` (integer) - Liczba opinii (default: 0)

#### **Subskrypcja:**

- `subscription_tier` (text) - Tier subskrypcji (default: 'basic')
  - Wartości: basic, premium, enterprise
- `subscription_status` (text) - Status subskrypcji (default: 'active')
  - Wartości: active, inactive, suspended
- `profile_visibility` (text) - Widoczność profilu (default: 'public')
  - Wartości: public, private, hidden

#### **Status i aktywność:**

- `accepting_new_clients` (boolean) - Czy przyjmuje nowych klientów (default: true)
- `last_active` (timestamp) - Ostatnia aktywność (default: now())
- `created_at` (timestamp) - Data utworzenia (default: now())
- `updated_at` (timestamp) - Data aktualizacji (default: now())

---

### 2️⃣ **cleaning_reviews** (Opinie - 12 kolumn)

#### **Relacje:**

- `id` (uuid) - PRIMARY KEY
- `cleaning_company_id` (uuid) - FK → cleaning_companies.id
- `employer_id` (uuid) - FK → employers.id

#### **Ocena:**

- `rating` (integer) - Ocena 1-5 gwiazdek
- `review_text` (text) - Treść opinii

#### **Szczegóły pracy:**

- `work_date` (date) - Data wykonania pracy
- `work_duration_hours` (numeric) - Czas trwania (godziny)
- `work_type` (text) - Typ pracy
  - Wartości: after_construction, deep_cleaning, office_cleaning, itp.

#### **Odpowiedź firmy:**

- `response_text` (text) - Odpowiedź firmy na opinię
- `response_date` (timestamp) - Data odpowiedzi

#### **Timestamps:**

- `created_at` (timestamp) - Data utworzenia opinii
- `updated_at` (timestamp) - Data aktualizacji

---

### 3️⃣ **project_cleaning_assignments** (Przypisania do projektów - 10 kolumn)

#### **Relacje:**

- `id` (uuid) - PRIMARY KEY
- `project_id` (uuid) - FK → projects.id
- `company_id` (uuid) - FK → cleaning_companies.id
- `assigned_by` (uuid) - FK → profiles.id (kto przypisał)

#### **Szczegóły przypisania:**

- `assigned_at` (timestamp) - Data przypisania (default: now())
- `role` (text) - Rola w projekcie (default: 'cleaning_team')
- `notes` (text) - Notatki
- `status` (text) - Status (default: 'active')
  - Wartości: active, completed, cancelled

#### **Timestamps:**

- `created_at` (timestamp)
- `updated_at` (timestamp)

---

### 4️⃣ **contact_attempts** (Kontakty od pracodawców - 6 kolumn)

#### **Relacje:**

- `id` (uuid) - PRIMARY KEY
- `cleaning_company_id` (uuid) - FK → cleaning_companies.id
- `employer_id` (uuid) - FK → employers.id

#### **Szczegóły kontaktu:**

- `contact_type` (text) - Typ kontaktu
  - Wartości: message, phone_call, email, profile_view
- `notes` (text) - Notatki
- `created_at` (timestamp) - Data kontaktu

---

### 5️⃣ **profile_views** (Wyświetlenia profilu - 7 kolumn)

#### **Relacje:**

- `id` (uuid) - PRIMARY KEY
- `cleaning_company_id` (uuid) - FK → cleaning_companies.id
- `employer_id` (uuid) - FK → employers.id (kto oglądał)
- `worker_id` (uuid) - FK → workers.id (alternatywnie)

#### **Tracking:**

- `viewed_at` (timestamp) - Kiedy wyświetlono
- `ip_address` (inet) - Adres IP
- `user_agent` (text) - User Agent przeglądarki

---

### 6️⃣ **payments** (Płatności i subskrypcje)

**Cleaning companies mają:**

- `payment_type`: 'employer_subscription'
- `amount`: €49.00 (basic tier)
- `description`: "Cleaning Company Subscription - {company_name} (basic)"
- `status`: 'completed'
- `payment_date`: Data płatności
- `completed_at`: Kiedy opłacono

---

### 7️⃣ **messages** (Wiadomości)

**Struktura:**

- `sender_id` / `recipient_id` - może być cleaning_company profile_id
- `subject` - Temat wiadomości
- `content` - Treść
- `is_read` - Czy przeczytane
- `created_at` - Data wysłania

---

## 👥 DANE UŻYTKOWNIKÓW CLEANING_COMPANY

### Zarejestrowani użytkownicy (3):

#### 1. **vsvs** (ze screenshota!)

```json
{
  "id": "1f97b130-d083-4d4c-9598-1a5531d312e9",
  "company_name": "vsvs",
  "owner_name": "vsvs",
  "email": "servicenorbss@gmail.com",
  "phone": "123456789",
  "location_city": "den haag",
  "specialization": ["cleaning_after_construction"],
  "availability": {
    "monday": true,
    "tuesday": true,
    "saturday": true,
    "sunday": true,
    "wednesday": false,
    "thursday": false,
    "friday": false
  },
  "preferred_days_per_week": 2,
  "hourly_rate_min": "30.00",
  "hourly_rate_max": "35.00",
  "rate_negotiable": true,
  "years_experience": 3,
  "team_size": 1,
  "portfolio_images": [
    "https://dtnotuyagygexmkyqtgb.supabase.co/storage/v1/object/public/portfolio-images/658a6f5e-6012-497b-84aa-5968a8e7a88e/1762723700616_kpomoz.jpg",
    "https://dtnotuyagygexmkyqtgb.supabase.co/storage/v1/object/public/portfolio-images/658a6f5e-6012-497b-84aa-5968a8e7a88e/1762741428790_zexp3e.jpg"
  ],
  "average_rating": "5.00",
  "total_reviews": 1,
  "accepting_new_clients": true,
  "avatar_url": "https://dtnotuyagygexmkyqtgb.supabase.co/storage/v1/object/public/project-files/cleaning-avatars/658a6f5e-6012-497b-84aa-5968a8e7a88e-avatar-1762758969139.png",
  "cover_image_url": "https://dtnotuyagygexmkyqtgb.supabase.co/storage/v1/object/public/avatars/cover-images/cleaning_company-658a6f5e-6012-497b-84aa-5968a8e7a88e-cover-1762889047235.png",
  "subscription_tier": "basic",
  "subscription_status": "active",
  "created_at": "2025-11-09",
  "last_active": "2025-11-11"
}
```

**Opinia dla vsvs:**

- Od: "mafia company" (employer: norbert wojcik)
- Ocena: 5/5 ⭐
- Treść: "super"
- Data pracy: 2025-11-06
- Typ pracy: after_construction

**Płatność:**

- €49.00 (basic subscription)
- Status: completed
- Data: 2025-11-09

---

#### 2. **lula**

```json
{
  "id": "30ce132f-efe3-4371-aabe-eb9a88bb53ea",
  "company_name": "lula",
  "owner_name": "lula",
  "email": "servicenorbsss@gmail.com",
  "phone": "123456789",
  "location_city": "den haag",
  "specialization": ["cleaning_after_construction"],
  "hourly_rate_min": "30.00",
  "hourly_rate_max": "38.00",
  "years_experience": 6,
  "team_size": 1,
  "portfolio_images": [2 zdjęcia],
  "average_rating": "5.00",
  "total_reviews": 1,
  "accepting_new_clients": true,
  "created_at": "2025-11-10",
  "subscription_tier": "basic"
}
```

**Płatność:**

- €49.00 (basic subscription)
- Status: completed
- Data: 2025-11-10

---

#### 3. **Service Norbs**

```json
{
  "id": "36c061c5-97b8-41c3-96fb-9fb525549abe",
  "company_name": "Service Norbs",
  "email": "servicenorbs@gmail.com",
  "location_city": null,
  "total_reviews": 0,
  "average_rating": "0.00",
  "accepting_new_clients": true,
  "created_at": "2025-11-15" (dziś!)
}
```

---

## 🔍 AKTUALNY STAN DANYCH

### Contact Attempts: **0** (pusta tabela)

### Profile Views: **0** (brak wyświetleń)

### Messages: **0** (brak wiadomości dla cleaning companies)

### Project Assignments: **nie sprawdzono** (prawdopodobnie 0)

### Cleaning Reviews: **2 opinie**

1. vsvs - 1 opinia (5.0⭐ od "mafia company")
2. lula - 1 opinia (5.0⭐)

### Payments: **2 płatności**

1. vsvs - €49.00 (basic, 2025-11-09)
2. lula - €49.00 (basic, 2025-11-10)

---

## 📈 CO PANEL CLEANING_COMPANY POWINIEN WYŚWIETLAĆ?

### **1. STATYSTYKI (4 karty):**

- ✅ **Opinie łącznie:** `total_reviews` z cleaning_companies
- ✅ **Średnia ocena:** `average_rating` z cleaning_companies
- ❓ **Wysłane profile:** brak w bazie (hardcoded: 20 na screenshocie)
- ❓ **Kontakty miesięczne:** COUNT z contact_attempts WHERE created_at > CURRENT_MONTH

### **2. SEKCJA PROFILU:**

- ✅ Avatar: `avatar_url`
- ✅ Nazwa firmy: `company_name`
- ✅ Toggle "Przyjmowanie klientów": `accepting_new_clients`

### **3. KALENDARZ DOSTĘPNOŚCI:**

- ✅ 7 checkboxów (pon-niedz): `availability` (jsonb)
- ✅ Preferowane dni/tydzień: `preferred_days_per_week`

### **4. DANE FIRMY:**

- ✅ Telefon: `phone`
- ✅ Email: `email`
- ✅ Miasto: `location_city`
- ✅ Promień: `service_radius_km`
- ✅ Specjalizacja: `specialization[]`
- ✅ Stawka: `hourly_rate_min` - `hourly_rate_max`
- ✅ Doświadczenie: `years_experience`
- ✅ Wielkość zespołu: `team_size`

### **5. ZAREZERWOWANE DATY:**

- ✅ `unavailable_dates` (jsonb array)
- ✅ Component: DateBlocker

### **6. PORTFOLIO:**

- ✅ Zdjęcia: `portfolio_images[]`
- ✅ Max display: pierwsze 2-3 zdjęcia
- ✅ Modal: PortfolioUploadModal

### **7. OPINIE KLIENTÓW:**

- ✅ Query: cleaning_reviews WHERE cleaning_company_id = current_company
- ✅ Join: employers + profiles dla nazw
- ✅ Display: ReviewCard component
- Pola:
  - Nazwa pracodawcy (employer.company_name)
  - Ocena (rating)
  - Treść (review_text)
  - Data (created_at)

### **8. WIADOMOŚCI:**

- ✅ Query: messages WHERE recipient_id = profile_id OR sender_id = profile_id
- ✅ Group by conversation
- ✅ Display ostatnie 3

### **9. SUBSKRYPCJE (3 karty):**

- Basic: €49/miesiąc
- Premium: €99/miesiąc
- Enterprise: €199/miesiąc
- Aktualny: `subscription_tier` z cleaning_companies

---

## 🎯 KLUCZOWE FINDINGS:

1. ✅ **Screenshot pokazywał profil "vsvs"** - nie "lula"!
2. ✅ Wszystkie dane istnieją w bazie (avatar, portfolio, opinie)
3. ❌ Brak contact_attempts - nie ma danych o kontaktach
4. ❌ Brak profile_views - nie ma danych o wyświetleniach
5. ❌ Brak messages - nie ma wiadomości
6. ✅ Płatności są poprawnie zapisane
7. ✅ Opinie są poprawnie zapisane z relacjami do employers

---

## 🔧 CO NAPRAWIĆ W NOWYM PANELU:

1. **Statystyka "Wysłane profile"** - brak w bazie, trzeba dodać tracking lub usunąć
2. **Statystyka "Kontakty miesięczne"** - query do contact_attempts (aktualnie 0)
3. **Wiadomości** - query do messages (aktualnie puste)
4. **Opinie** - poprawny query z JOIN do employers i profiles
5. **Dane z bazy** - używać rzeczywistych danych zamiast hardcoded

---

## 📝 SQL QUERIES DO UŻYCIA W PANELU:

```sql
-- 1. Główne dane firmy
SELECT * FROM cleaning_companies WHERE profile_id = current_user_id;

-- 2. Opinie
SELECT
  cr.*,
  e.company_name as employer_name,
  p.full_name as employer_full_name
FROM cleaning_reviews cr
LEFT JOIN employers e ON e.id = cr.employer_id
LEFT JOIN profiles p ON p.id = e.profile_id
WHERE cr.cleaning_company_id = current_company_id
ORDER BY cr.created_at DESC;

-- 3. Kontakty miesięczne
SELECT COUNT(*)
FROM contact_attempts
WHERE cleaning_company_id = current_company_id
AND created_at >= date_trunc('month', CURRENT_DATE);

-- 4. Wiadomości
SELECT
  m.*,
  p_sender.full_name as sender_name,
  p_recipient.full_name as recipient_name
FROM messages m
LEFT JOIN profiles p_sender ON p_sender.id = m.sender_id
LEFT JOIN profiles p_recipient ON p_recipient.id = m.recipient_id
WHERE m.recipient_id = current_profile_id OR m.sender_id = current_profile_id
ORDER BY m.created_at DESC
LIMIT 10;

-- 5. Wyświetlenia profilu
SELECT COUNT(*)
FROM profile_views
WHERE cleaning_company_id = current_company_id
AND viewed_at >= date_trunc('month', CURRENT_DATE);
```

---

**KONIEC RAPORTU**
