# 🚀 Deployment na Netlify - ZZP Werkplaats

## ✅ Pliki Netlify (GOTOWE)

- ✅ `netlify.toml` - główna konfiguracja
- ✅ `Public/_redirects` - routing SPA
- ✅ `Public/_headers` - security headers

---

## 📋 Kroki Deploymentu

### 1. Połącz z GitHub

1. Zaloguj się na [Netlify](https://app.netlify.com)
2. Kliknij **"Add new site"** → **"Import an existing project"**
3. Wybierz **GitHub** i zezwól na dostęp
4. Wybierz repozytorium: `norbi07011/zzp-werkplsats-nowy`

### 2. Skonfiguruj Build Settings

```
Build command:       npm run build
Publish directory:   dist
Node version:        20 (w Environment)
```

### 3. Dodaj Environment Variables ⚠️ KRYTYCZNE

W Netlify Dashboard → Site settings → Environment variables:

| Zmienna                              | Wartość                            |
| ------------------------------------ | ---------------------------------- |
| `VITE_SUPABASE_URL`                  | `https://[PROJECT_ID].supabase.co` |
| `VITE_SUPABASE_ANON_KEY`             | Twój anon key z Supabase           |
| `VITE_STRIPE_PUBLISHABLE_KEY`        | `pk_test_...` lub `pk_live_...`    |
| `VITE_STRIPE_PRICE_WORKER_PREMIUM`   | ID ceny z Stripe                   |
| `VITE_STRIPE_PRICE_EMPLOYER_BASIC`   | ID ceny z Stripe                   |
| `VITE_STRIPE_PRICE_EMPLOYER_PREMIUM` | ID ceny z Stripe                   |
| `NODE_VERSION`                       | `20`                               |

### 4. Deploy!

Kliknij **"Deploy site"** - Netlify automatycznie zbuduje i wdroży aplikację.

---

## 🔧 Konfiguracja Supabase dla Produkcji

### Dodaj domenę Netlify do Supabase:

1. Supabase Dashboard → Authentication → URL Configuration
2. Dodaj URL:
   - Site URL: `https://your-site.netlify.app`
   - Redirect URLs: `https://your-site.netlify.app/**`

### Zaktualizuj CORS (jeśli potrzebne):

W Supabase Edge Functions dodaj domenę Netlify do allowed origins.

---

## 🌍 Custom Domain (Opcjonalnie)

1. Netlify → Domain settings → Add custom domain
2. Dodaj domenę np. `zzp-werkplaats.nl`
3. Skonfiguruj DNS u providera
4. Netlify automatycznie wygeneruje SSL

---

## 📊 Po Deploy - Testy

### Sprawdź te endpointy:

- [ ] `/` - Strona główna ładuje się
- [ ] `/login` - Formularz logowania działa
- [ ] `/register/worker` - Rejestracja pracownika
- [ ] `/register/employer` - Rejestracja pracodawcy
- [ ] `/feed` - Feed postów
- [ ] `/admin` - Panel admina (po zalogowaniu)
- [ ] Deep links działają (np. odświeżenie `/employer/team`)

### Console check:

1. Otwórz DevTools (F12)
2. Sprawdź czy nie ma błędów w Console
3. Sprawdź Network - czy Supabase API odpowiada

---

## 🐛 Typowe Problemy

### Błąd 404 na deep links

→ Sprawdź czy `_redirects` jest w `dist/` po buildzie

### "Supabase client not initialized"

→ Brak zmiennych środowiskowych w Netlify

### Blank page

→ Sprawdź Console, prawdopodobnie błąd JS

### Auth nie działa

→ Dodaj domenę Netlify do Supabase URL Configuration

---

## 🔄 Auto-deploy

Netlify automatycznie deployuje przy każdym push do `main`.

Możesz też włączyć Deploy Previews dla Pull Requests.
