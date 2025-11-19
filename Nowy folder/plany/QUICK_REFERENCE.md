# ⚡ QUICK REFERENCE - Certyfikat ZZP

**Ostatnia aktualizacja:** 12 listopada 2025

---

## 🎯 CO ZOSTAŁO NAPRAWIONE?

| Problem                         | Status   | Rozwiązanie                                         |
| ------------------------------- | -------- | --------------------------------------------------- |
| Admin panels nie działają       | ✅ FIXED | Dodano `export default` w ZZPExamManagementPage.tsx |
| Worker 500 error przy płatności | ✅ FIXED | Dual-write strategy (JSONB + payments table)        |
| Brak przycisku ZZP Exam         | ✅ FIXED | Dodano zielony card w WorkerDashboard               |
| Webhook ignoruje ZZP exams      | ✅ FIXED | Dodano `if (type === 'zzp_exam')` detection         |
| 19 błędów TypeScript            | ✅ FIXED | Deno types + Stripe API update                      |
| Duplikacja folderów admin       | ✅ FIXED | Usunięto archive/admin-backup/                      |

---

## 📁 GDZIE SĄ PLIKI?

### ✅ AKTYWNE (UŻYWAJ TYCH):

```
src/pages/admin/
├── ZZPExamManagementPage.tsx  ← Admin panel egzaminów
├── TestSchedulerPage.tsx       ← Scheduler
└── CertificateManagementPage.tsx ← Certyfikaty

supabase/functions/
├── create-exam-payment/index.ts ← €230 payment
├── stripe-webhook/index.ts      ← Webhook handler
└── deno.d.ts                    ← Deno types
```

### ❌ STARE (NIE UŻYWAJ):

```
archive/admin-backup/          ← USUNIĘTY
pages/Admin/                   ← Stary folder
```

---

## 🔄 JAK DZIAŁA PŁATNOŚĆ?

```
Worker → Przycisk → Formularz → Edge Function → Stripe → Webhook → Admin
   ↓         ↓          ↓             ↓            ↓        ↓        ↓
Certyfikaty  ZZP      exam_date   dual-write    €230    update   widzi
  tab      Application warehouse   (2 tables)   payment  status  aplikację
```

**Dual-write:**

1. `zzp_exam_applications.documents` (JSONB) - exam data
2. `payments` (standard table) - payment record

---

## 🗄️ BAZA DANYCH

### Tabele (BEZ zmian schema):

**zzp_exam_applications:**

- `documents` (JSONB) ← Tutaj exam_date, warehouse_location, payment info
- `status` - pending → payment_completed → approved/rejected

**payments:**

- `amount` - 230.00
- `status` - pending → completed
- `metadata` - { application_id, type: 'zzp_exam' }

**⚠️ BRAK MIGRACJI SQL** - używamy istniejących kolumn!

---

## 🧪 SZYBKI TEST

### 1. Panel Pracownika:

```
http://localhost:3006/worker
→ Certyfikaty tab
→ Zielony card "Certyfikat ZZP"
→ Przycisk "Złóż podanie →"
```

### 2. Wypełnij formularz:

- Data egzaminu: 2025-11-20
- Lokalizacja: Amsterdam
- Doświadczenie: opisz pracę

### 3. Płatność Stripe (Test):

```
Karta: 4242 4242 4242 4242
CVV: 123
Data: dowolna przyszła
```

### 4. Sprawdź Admin:

```
/admin/zzp-exams    → Status: payment_completed ✅
/admin/payments     → €230, completed ✅
```

---

## 🚀 DEPLOYMENT

### Edge Functions:

```bash
supabase functions deploy create-exam-payment
supabase functions deploy stripe-webhook
supabase secrets list
```

### Frontend:

```bash
npm run build
```

---

## 🐛 TROUBLESHOOTING

### Edge Function 500 error:

```bash
supabase functions logs create-exam-payment
```

### Webhook nie aktualizuje statusu:

```bash
supabase functions logs stripe-webhook
# Sprawdź czy paymentType === 'zzp_exam'
```

### TypeScript errors:

```bash
# Restart VS Code TypeScript server
Ctrl+Shift+P → "Reload Window"
```

### Admin panel blank:

```typescript
// Sprawdź czy jest export default:
// src/pages/admin/ZZPExamManagementPage.tsx (linia 401)
export default ZZPExamManagementPage;
```

---

## 📊 PLIKI ZMIENIONE (10 TOTAL)

| Plik                               | Zmiana          | Linie     |
| ---------------------------------- | --------------- | --------- |
| `ZZPExamManagementPage.tsx`        | export default  | 401, 7    |
| `App.tsx`                          | lazy import fix | 156-158   |
| `WorkerDashboard.tsx`              | przycisk ZZP    | 3208-3258 |
| `create-exam-payment/index.ts`     | dual write      | 78-196    |
| `stripe-webhook/index.ts`          | ZZP handling    | 99-159    |
| `create-checkout-session/index.ts` | API version     | 30        |
| `Notifications/Center.tsx`         | CSS fix         | 19        |
| `tsconfig.json`                    | deprecations    | 26        |
| `deno.d.ts`                        | ✨ NOWY PLIK    | -         |
| `archive/admin-backup/`            | ❌ USUNIĘTY     | -         |

---

## 🔑 KLUCZOWE ZMIANY

### 1. Dual-Write Strategy:

```typescript
// Zapisz do obu tabel:
await supabase.from("zzp_exam_applications").insert({
  documents: [{ exam_date, payment_amount: 230 }],
});

await supabase.from("payments").insert({
  amount: 230.0,
  metadata: { type: "zzp_exam" },
});
```

### 2. Webhook Detection:

```typescript
if (session.metadata?.type === "zzp_exam") {
  // Update both tables
}
```

### 3. Worker UI:

```typescript
<button onClick={() => navigate("/zzp-exam-application")}>
  Złóż podanie o certyfikat ZZP →
</button>
```

---

## ✅ STATUS

| System           | Status      |
| ---------------- | ----------- |
| Admin Panels (3) | ✅ DZIAŁA   |
| Worker Form      | ✅ DZIAŁA   |
| Edge Functions   | ✅ DZIAŁA   |
| Stripe Payment   | ✅ DZIAŁA   |
| Webhook          | ✅ DZIAŁA   |
| TypeScript       | ✅ 0 ERRORS |

**PRODUCTION READY!** 🎉

---

## 📚 DOKUMENTACJA

- **Pełny raport:** `RAPORT_NAPRAW_CERTYFIKAT_ZZP.md` (1465 linii)
- **Podsumowanie:** `PODSUMOWANIE_SESJI.md` (kompaktowa wersja)
- **Quick Reference:** `QUICK_REFERENCE.md` (ten plik)

---

**Next Steps:**

1. Deploy na produkcję
2. Test z prawdziwymi użytkownikami
3. Monitor pierwszych płatności

**Czas pracy:** ~3h | **Data:** 12.11.2025
