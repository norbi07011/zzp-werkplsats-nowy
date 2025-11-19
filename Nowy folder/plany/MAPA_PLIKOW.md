# 🗺️ MAPA PLIKÓW - Certyfikat ZZP (NOWE vs STARE)

**Data:** 12 listopada 2025

---

## 📂 STRUKTURA FOLDERÓW - PRZEGLĄD

```
zzp-werkplaats/
│
├── src/pages/admin/                    ← ✅ AKTYWNE (UŻYWAJ TYCH!)
│   ├── ZZPExamManagementPage.tsx       ← NAPRAWIONY (12.11.2025)
│   ├── TestSchedulerPage.tsx           ← AKTYWNY
│   └── CertificateManagementPage.tsx   ← AKTYWNY
│
├── pages/Admin/                        ← ❌ STARE (nieużywane w routing)
│   ├── TestScheduler.tsx               ← Duplikat (27.10.2025)
│   └── CertificatesManager.tsx         ← Duplikat (27.10.2025)
│
├── archive/admin-backup/               ← ❌ USUNIĘTY FOLDER
│   ├── ZZPExamManagementPage.tsx       ← Backup z 27.10.2025
│   ├── TestSchedulerPage.tsx           ← Backup z 27.10.2025
│   └── ... (23 pliki)                  ← Przeniesiony lokalnie przez użytkownika
│
└── supabase/functions/                 ← ✅ AKTYWNE
    ├── create-exam-payment/
    │   └── index.ts                    ← NAPRAWIONY (dual-write)
    ├── stripe-webhook/
    │   └── index.ts                    ← NAPRAWIONY (ZZP handling)
    └── deno.d.ts                       ← ✨ NOWY PLIK (12.11.2025)
```

---

## 🔍 SZCZEGÓŁOWA ANALIZA - GDZIE CO JEST?

### 1️⃣ ADMIN PANEL - ZZP EXAM MANAGEMENT

#### ✅ AKTYWNY PLIK (UŻYWANY):

```
📁 src/pages/admin/ZZPExamManagementPage.tsx
├─ Utworzony: wcześniej
├─ Ostatnia edycja: 12.11.2025 (DZISIAJ)
├─ Status: ✅ NAPRAWIONY
├─ Routing: /admin/zzp-exams
└─ Zmiany:
   ├─ Linia 7: Naprawiono import lucide-react
   │   PRZED: import { Clock, Euro } from 'lucide-react';
   │   PO:     import { DollarSign } from 'lucide-react';
   │
   └─ Linia 401: Dodano export default
       PRZED: export const ZZPExamManagementPage: React.FC = () => { ... };
       PO:     export default ZZPExamManagementPage;
```

#### ❌ STARE PLIKI (NIEUŻYWANE):

```
📁 archive/admin-backup/ZZPExamManagementPage.tsx
├─ Utworzony: 27.10.2025
├─ Status: ❌ USUNIĘTY FOLDER (przeniesiony lokalnie)
└─ Dlaczego nieużywany: Archive folder nie jest w routing

📁 pages/Admin/ (brak ZZPExamManagementPage, ale inne pliki)
└─ Status: ❌ Stary folder, wykluczony z budowania
```

---

### 2️⃣ ADMIN PANEL - TEST SCHEDULER

#### ✅ AKTYWNY PLIK (UŻYWANY):

```
📁 src/pages/admin/TestSchedulerPage.tsx
├─ Utworzony: wcześniej
├─ Status: ✅ BEZ ZMIAN (działa poprawnie)
├─ Routing: /admin/scheduler
└─ Funkcjonalność: Zarządzanie harmonogramem egzaminów
```

#### ❌ STARE PLIKI (NIEUŻYWANE):

```
📁 archive/admin-backup/TestSchedulerPage.tsx
├─ Status: ❌ USUNIĘTY FOLDER
└─ Data: 27.10.2025

📁 pages/Admin/TestScheduler.tsx
├─ Status: ❌ Duplikat (nieużywany)
├─ Data: wcześniejsza
└─ Dlaczego nieużywany: Routing używa src/pages/admin/
```

---

### 3️⃣ ADMIN PANEL - CERTIFICATE MANAGEMENT

#### ✅ AKTYWNY PLIK (UŻYWANY):

```
📁 src/pages/admin/CertificateManagementPage.tsx
├─ Status: ✅ BEZ ZMIAN (działa poprawnie)
├─ Routing: /admin/certificates
└─ Funkcjonalność: Zarządzanie wydanymi certyfikatami
```

#### ❌ STARE PLIKI (NIEUŻYWANE):

```
📁 archive/admin-backup/CertificateManagementPage.tsx
├─ Status: ❌ USUNIĘTY FOLDER
└─ Data: 27.10.2025

📁 pages/Admin/CertificatesManager.tsx
├─ Status: ❌ Duplikat (inna nazwa)
└─ Dlaczego nieużywany: Inna nazwa + stary folder
```

---

## 🎯 ROUTING - CO SIĘ UŻYWA?

### App.tsx (GŁÓWNY ROUTING):

```typescript
// Linia 86 - ✅ UŻYWA src/pages/admin/
const TestScheduler = lazy(() => import("./src/pages/admin/TestSchedulerPage"));

// Linia 88 - ✅ UŻYWA src/pages/admin/
const CertificateManagementPage = lazy(
  () => import("./src/pages/admin/CertificateManagementPage")
);

// Linia 156 - ✅ UŻYWA src/pages/admin/ (NAPRAWIONY DZISIAJ)
const ZZPExamManagementPage = lazy(
  () => import("./src/pages/admin/ZZPExamManagementPage")
);

// ❌ NIE UŻYWA pages/Admin/ - ten folder jest ignorowany!
// ❌ NIE UŻYWA archive/admin-backup/ - ten folder został usunięty!
```

### Routes Configuration:

```typescript
// /admin/scheduler → src/pages/admin/TestSchedulerPage.tsx ✅
<Route path="/admin/scheduler" element={<TestScheduler />} />

// /admin/certificates → src/pages/admin/CertificateManagementPage.tsx ✅
<Route path="/admin/certificates" element={<CertificateManagementPage />} />

// /admin/zzp-exams → src/pages/admin/ZZPExamManagementPage.tsx ✅
<Route path="/admin/zzp-exams" element={<ZZPExamManagementPage />} />
```

---

## 🔧 EDGE FUNCTIONS - BACKEND

### ✅ AKTYWNE PLIKI:

#### 1. create-exam-payment/index.ts

```
📁 supabase/functions/create-exam-payment/index.ts
├─ Status: ✅ NAPRAWIONY (MAJOR REWRITE)
├─ Data: 12.11.2025
├─ Linie zmienione: 78-196, 36
└─ Zmiany:
   ├─ Dual-write strategy (zzp_exam_applications + payments)
   ├─ JSONB storage dla exam_date, warehouse_location, etc.
   ├─ Stripe API version → 2025-09-30.clover
   └─ Type annotation req: Request
```

#### 2. stripe-webhook/index.ts

```
📁 supabase/functions/stripe-webhook/index.ts
├─ Status: ✅ NAPRAWIONY (ENHANCED)
├─ Data: 12.11.2025
├─ Linie zmienione: 99-159, 23, 202, 274, 276, 322
└─ Zmiany:
   ├─ Detekcja ZZP exam payment (type: 'zzp_exam')
   ├─ UPDATE obu tabel (zzp_exam_applications + payments)
   ├─ Stripe API version → 2025-09-30.clover
   ├─ Type casts dla Stripe properties (as any)
   └─ Rozdzielna logika dla subscriptions vs exams
```

#### 3. deno.d.ts

```
📁 supabase/functions/deno.d.ts
├─ Status: ✨ NOWY PLIK
├─ Data: 12.11.2025
├─ Linie: 24
└─ Funkcja:
   ├─ Deno namespace type declarations
   ├─ Module imports dla deno.land
   ├─ Module imports dla esm.sh (Stripe, Supabase)
   └─ Fix dla 16 TypeScript errors w VS Code
```

---

## 👨‍💼 PANEL PRACOWNIKA

### ✅ AKTYWNE PLIKI:

#### 1. WorkerDashboard.tsx

```
📁 pages/WorkerDashboard.tsx
├─ Status: ✅ NAPRAWIONY (ENHANCED)
├─ Data: 12.11.2025
├─ Linie dodane: 3208-3258 (57 linii)
└─ Zmiany:
   └─ Dodano sekcję przycisku ZZP Exam:
      ├─ Zielony gradient card
      ├─ Tytuł "📜 Certyfikat ZZP"
      ├─ Lista korzyści (egzamin, certyfikat, €230)
      └─ Przycisk → navigate('/zzp-exam-application')
```

#### 2. ZZPExamApplicationPage.tsx

```
📁 src/pages/ZZPExamApplicationPage.tsx
├─ Status: ✅ BEZ ZMIAN (działa poprawnie)
└─ Funkcja: Formularz aplikacji (exam_date, warehouse_location, etc.)
```

#### 3. ZZPExamApplicationForm.tsx

```
📁 src/components/certificates/ZZPExamApplicationForm.tsx
├─ Status: ✅ BEZ ZMIAN (działa poprawnie)
└─ Funkcja: Komponent formularza (używany w ZZPExamApplicationPage)
```

---

## 📋 TIMELINE PLIKÓW

### 27 października 2025:

```
❌ Utworzono archive/admin-backup/
   ├─ ZZPExamManagementPage.tsx
   ├─ TestSchedulerPage.tsx
   └─ CertificateManagementPage.tsx
   (23 pliki backup - USUNIĘTY FOLDER)
```

### Wcześniej:

```
✅ Utworzono src/pages/admin/
   ├─ ZZPExamManagementPage.tsx (oryginał)
   ├─ TestSchedulerPage.tsx (oryginał)
   └─ CertificateManagementPage.tsx (oryginał)

✅ Utworzono supabase/functions/
   ├─ create-exam-payment/index.ts (oryginał)
   └─ stripe-webhook/index.ts (oryginał)
```

### 12 listopada 2025 (DZISIAJ):

```
✅ NAPRAWIONO src/pages/admin/ZZPExamManagementPage.tsx
   ├─ Export default (linia 401)
   └─ Import fix (linia 7)

✅ NAPRAWIONO supabase/functions/create-exam-payment/index.ts
   └─ Dual-write strategy (linia 78-196)

✅ NAPRAWIONO supabase/functions/stripe-webhook/index.ts
   └─ ZZP exam handling (linia 99-159)

✅ ENHANCED pages/WorkerDashboard.tsx
   └─ Przycisk ZZP Exam (linia 3208-3258)

✨ UTWORZONO supabase/functions/deno.d.ts
   └─ Deno type declarations (24 linie)

❌ USUNIĘTO archive/admin-backup/
   └─ Przeniesiony lokalnie przez użytkownika
```

---

## 🎨 WIZUALIZACJA - CO GDZIE?

```
┌─────────────────────────────────────────────────────────┐
│                     ADMIN PANELS                         │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ✅ src/pages/admin/                                     │
│     ├─ ZZPExamManagementPage.tsx  ← NAPRAWIONY 12.11    │
│     ├─ TestSchedulerPage.tsx       ← AKTYWNY            │
│     └─ CertificateManagementPage.tsx ← AKTYWNY          │
│                                                           │
│  ❌ pages/Admin/                                         │
│     ├─ TestScheduler.tsx           ← DUPLIKAT           │
│     └─ CertificatesManager.tsx     ← DUPLIKAT           │
│                                                           │
│  ❌ archive/admin-backup/                               │
│     └─ [USUNIĘTY FOLDER - 23 pliki]                     │
│                                                           │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                   EDGE FUNCTIONS                         │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ✅ supabase/functions/                                  │
│     ├─ create-exam-payment/index.ts ← NAPRAWIONY 12.11  │
│     ├─ stripe-webhook/index.ts      ← NAPRAWIONY 12.11  │
│     └─ deno.d.ts                    ← NOWY PLIK 12.11   │
│                                                           │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                  WORKER DASHBOARD                        │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ✅ pages/WorkerDashboard.tsx                            │
│     └─ renderVerification() ← ENHANCED 12.11            │
│        └─ ZZP Exam Button (57 linii)                    │
│                                                           │
│  ✅ src/pages/ZZPExamApplicationPage.tsx                │
│     └─ Formularz aplikacji (BEZ ZMIAN)                  │
│                                                           │
│  ✅ src/components/certificates/ZZPExamApplicationForm.tsx│
│     └─ Komponent formularza (BEZ ZMIAN)                 │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

---

## ✅ PODSUMOWANIE - CO UŻYWAĆ?

### ✅ AKTYWNE FOLDERY (UŻYWAJ TYLKO TYCH):

1. **src/pages/admin/** - Admin panels (3 pliki)
2. **src/pages/** - Worker pages (ZZPExamApplicationPage)
3. **src/components/certificates/** - Form components
4. **pages/** - WorkerDashboard (główny dashboard)
5. **supabase/functions/** - Edge Functions

### ❌ NIEUŻYWANE FOLDERY (IGNORUJ):

1. **archive/admin-backup/** - USUNIĘTY (backup z 27.10)
2. **pages/Admin/** - Stary folder (duplikaty)

### 🔑 KLUCZOWA ZASADA:

**Routing (App.tsx) używa TYLKO:**

```
import("./src/pages/admin/ZZPExamManagementPage")
import("./src/pages/admin/TestSchedulerPage")
import("./src/pages/admin/CertificateManagementPage")
```

**NIE używa:**

```
❌ ./pages/Admin/...
❌ ./archive/admin-backup/...
```

---

## 📊 STATYSTYKI

| Kategoria                        | Liczba | Status        |
| -------------------------------- | ------ | ------------- |
| Aktywne pliki admin              | 3      | ✅ DZIAŁA     |
| Stare pliki admin (pages/Admin/) | ~29    | ❌ NIEUŻYWANE |
| Backup files (archive/)          | 23     | ❌ USUNIĘTE   |
| Edge Functions naprawione        | 2      | ✅ DZIAŁA     |
| Nowe pliki utworzone             | 1      | ✨ deno.d.ts  |
| Worker components                | 3      | ✅ DZIAŁA     |

**TOTAL PLIKÓW W SYSTEMIE CERTYFIKACJI: 9**

- 3 admin panels (src/pages/admin/)
- 3 worker components (pages/ + src/pages/ + src/components/)
- 2 edge functions (supabase/functions/)
- 1 type definitions (supabase/functions/deno.d.ts)

---

**Data utworzenia mapy:** 12 listopada 2025  
**Status:** ✅ WSZYSTKO UDOKUMENTOWANE

**Pełna dokumentacja:** `RAPORT_NAPRAW_CERTYFIKAT_ZZP.md`
