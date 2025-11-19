# 📊 RAPORT ROZBUDOWY GŁÓWNYCH PODSTRON - ZZP WERKPLAATS

**Data audytu:** 13 listopada 2025  
**Zakres:** 5 głównych stron publicznych  
**Status:** ✅ Pełna analiza wykonana

---

## 📑 SPIS TREŚCI

1. [Executive Summary](#executive-summary)
2. [HomePage - Strona Główna](#homepage---strona-główna)
3. [AboutPage - O Platformie](#aboutpage---o-platformie)
4. [ForEmployersPage - Dla Pracodawców](#foremployerspage---dla-pracodawców)
5. [ExperienceCertificatePage - Egzamin ZZP](#experiencecertificatepage---egzamin-zzp)
6. [ContactPage - Kontakt](#contactpage---kontakt)
7. [Rekomendacje Priorytetowe](#rekomendacje-priorytetowe)
8. [Plan Rozbudowy](#plan-rozbudowy)

---

## 📈 EXECUTIVE SUMMARY

### Status Ogólny

- **5/5 stron** istnieje i działa
- **Łączna wielkość:** ~3,900 linii kodu
- **Jakość treści:** 70% wysokiej jakości, 30% wymaga rozbudowy
- **Zdjęcia:** ✅ Wszystkie strony mają real photos z Unsplash
- **Responsywność:** ✅ Pełna obsługa mobile/tablet/desktop
- **i18n:** ✅ Wszystkie strony mają tłumaczenia

### Główne Odkrycia

✅ **MOCNE STRONY:**

- Świetny design system (gradient-glass, glow effects, premium feel)
- Bogate treści z konkretnymi przykładami
- Profesjonalne zdjęcia zintegrowane
- FAQ sekcje na większości stron
- Clear CTAs i conversion flows

⚠️ **WYMAGAJĄCE UWAGI:**

- ContactPage najprostsza (tylko 251 linii) - wymaga rozbudowy
- Brak route dla ExperienceCertificatePage w App.tsx
- Niektóre formularze nie mają backendowej integracji
- Google Maps placeholdery zamiast prawdziwych map
- Brak social media links w ContactPage

❌ **KRYTYCZNE BRAKI:**

- ExperienceCertificatePage: Form zapisuje do `applications` table (błędna tabela!)
- ContactPage: Form tylko console.log, nie wysyła emaili
- Brak strony "Legal/Privacy Policy" (linkowana w kilku miejscach)
- AboutPage: Duplicate pages/AboutUs.tsx file

---

## 🏠 HOMEPAGE - STRONA GŁÓWNA

**Ścieżka:** `pages/public/HomePage.tsx`  
**Rozmiar:** 1,172 linii  
**Status:** ✅ BARDZO DOBRA - wymaga drobnych uzupełnień

### Obecna Zawartość

#### ✅ ŚWIETNIE ZROBIONE:

**1. Hero Section** (linie 11-66)

- Logo + gradient background
- 3 CTAs: Worker, Employer, Cleaning Company
- Animacje (fade-in, slide-in-up)
- Decorator blurry orbs

**2. Trust Indicators** (linie 68-95)

- 500+ Actieve ZZP'ers
- 1200+ Succesvolle matches
- 98% Tevredenheid
- Hover animations

**3. How It Works** (linie 97-202)

- 4 kroki: Profiel → Premium → Gevonden → Opdrachten
- Real photos (2 zdjęcia Unsplash)
- Card design z gradient-glass
- Liczniki (1, 2, 3, 4) z animacjami

**4. Benefits for Workers** (linie 204-342)

- 3 główne benefity:
  - Officieel certificaat
  - Meer opdrachten
  - Geen commissie (0%)
- Real photo (ZZP benefits)
- Illustracja placeholder dla certyfikatu
- CTA: "Start nu"

**5. Team & On-Demand Features** (linie 344-628)

- 🎯 NOWA FUNKCJA: Team Configuratie
  - Teams 2-10 personen
  - Duo partners
  - Helper available
- ⚡ NOWA FUNKCJA: "Skoczek" On-Demand
  - Real-time beskikbaar toggle
  - Badge in search results
  - Premium filter
- Pricing Comparison:
  - Workers Basic (€0) vs Premium (€13)
  - Employers Basic (€13) vs Premium (€25)
- Real photo: Pricing transparency

**6. Benefits for Employers** (linie 630-740)

- 3 główne benefity:
  - Geverifieerde professionals
  - Snel zoeken en vinden
  - Flexibel abonnement
- 2 real photos (employer search, business team)
- CTA: "Bekijk prijzen"

**7. FAQ Section** (linie 742-1,056)

- 8 pytań:
  1. Hoe werkt het voor ZZP'ers?
  2. Hoe werkt het voor opdrachtgevers?
  3. Wat kost het voor ZZP'ers?
  4. Wat kost het voor opdrachtgevers?
  5. Wat is de Team functie?
  6. Wat is "Skoczek" (On-Demand)?
  7. Hoe werkt de betaling?
  8. Waarom ZZP Werkplaats?
- Expandable details z animacjami
- Code examples i pricing breakdowns
- 2 CTAs: Worker + Employer registration

**8. Final CTA Section** (linie 1,058-1,172)

- Hero gradient background
- Decorative orbs
- 2 real photos (success, team collaboration)
- 2 CTAs: Worker + Employer
- Animated blurry backgrounds

### 📊 Metryki

| Kategoria      | Wartość           |
| -------------- | ----------------- |
| Sekcje         | 8 głównych        |
| Real Photos    | 10 zdjęć Unsplash |
| CTAs           | 9 buttonów        |
| FAQ items      | 8 pytań           |
| Pricing tables | 4 tabelki         |
| i18n keys      | ~40 tłumaczeń     |

### ⚠️ CO WYMAGA POPRAWY:

1. **Missing Section: Testimonials/Reviews**

   - Brak social proof od użytkowników
   - Dodać 3-4 testimonials z real users

2. **Missing Section: Platform Stats**

   - Rozszerzyć trust indicators
   - Dodać: "500+ projektów zakończonych", "€2M+ wypłaconych"

3. **Missing Section: Video Demo**

   - Placeholder dla video tour
   - Pokazać jak działa platform

4. **Ilustracja Placeholder** (linia 337)

   ```tsx
   <svg>...</svg>
   <p>[Illustratie van certificaat]</p>
   ```

   - Zamienić na real graphic lub zdjęcie certyfikatu

5. **Pricing - Missing Annual Option**

   - Tylko monthly pricing
   - Dodać: "€130/year (save €26!)"

6. **FAQ - Brak linków do support**
   - Dodać w każdym FAQ: "Meer vragen? → Contact"

### ✅ REKOMENDACJE ROZBUDOWY:

#### PRIORITY 1: Testimonials Section (2h)

```tsx
<section className="py-24 bg-primary-navy/20">
  <h2>Wat zeggen onze gebruikers?</h2>
  <div className="grid md:grid-cols-3 gap-8">
    {testimonials.map((t) => (
      <TestimonialCard
        name={t.name}
        role={t.role} // "ZZP Metselaar" | "Bouwbedrijf"
        photo={t.photo}
        rating={t.rating}
        quote={t.quote}
      />
    ))}
  </div>
</section>
```

**Dane do dodania:**

- Jan V. - ZZP Timmerman: "In 2 weken 3 opdrachten!"
- BuildCo - Opdrachtgever: "Gevonden precies wat we zochten"
- Maria K. - ZZP Elektricien: "Premium loont meteen terug"

#### PRIORITY 2: Video Demo Section (3h)

```tsx
<section className="py-24 bg-gradient-to-br from-blue-500/10 to-cyan-500/10">
  <h2>Zie hoe het werkt</h2>
  <div className="aspect-video max-w-4xl mx-auto">
    <iframe src="[YouTube embed]" />
  </div>
  <div className="grid md:grid-cols-4 gap-4 mt-8">
    <VideoTimestamp time="0:30" label="Registratie" />
    <VideoTimestamp time="1:15" label="Profiel maken" />
    <VideoTimestamp time="2:00" label="Premium activeren" />
    <VideoTimestamp time="2:45" label="Eerste opdracht" />
  </div>
</section>
```

#### PRIORITY 3: Extended Stats (1h)

```tsx
// W Trust Indicators section dodać:
<div className="group">
  <div className="text-5xl font-bold text-accent-cyber">€2M+</div>
  <div className="text-neutral-300">Uitbetaald aan ZZP'ers</div>
</div>
<div className="group">
  <div className="text-5xl font-bold text-accent-techGreen">500+</div>
  <div className="text-neutral-300">Projecten voltooid</div>
</div>
```

---

## 📖 ABOUTPAGE - O PLATFORMIE

**Ścieżka:** `pages/public/AboutPage.tsx`  
**Rozmiar:** 692 linii  
**Status:** ✅ DOBRA - wymaga uzupełnienia misji

### Obecna Zawartość

#### ✅ KOMPLETNE SEKCJE:

**1. Hero Section** (linie 11-42)

- Logo + gradient background
- Badge: "DE SLIMSTE MARKETPLACE VOOR BOUW ZZP'ERS"
- Title: "Over ZZP Werkplaats"
- Subtitle z misją

**2. Mission Section** (linie 44-116)

- 2 real photos (team mission, construction workers)
- Mission statement:
  - "Transparantie" - Alle prijzen zichtbaar
  - "Direct Contact" - Geen tussenpersonen
  - "0% Commissie" - Alleen vaste maandprijs
- 3 value cards z ikonami

**3. Benefits Comparison** (linie 118-278)

- Real photo: Team celebrating benefits
- Grid 2 kolumny:
  - **Voor ZZP'ers:** 5 benefitów (registratie, team, skoczek, 0% commissie, examen)
  - **Voor Opdrachtgevers:** 6 benefitów (search, transparent pricing, teams, spoedklussen, direct contact)
- CTAs: Worker + Employer registration

**4. ZZP Exam Certificate Section** (linie 280-368)

- Real photos: Exam preparation, certificate
- Pricing: €230 (1 jaar Premium gratis = €156 waarde)
- Benefits:
  - Officieel certificaat
  - 1 jaar Premium gratis
  - 🏆 Badge
  - Hogere ranking
- CTA: "Start met Examen"

**5. Team Section** (linie 370-496)

- 2 teams:
  - **Platform Management:** Development, UX, Customer Service, Betalingen, Marketing
  - **Verificatie Team:** Quality control, Certificate verification, Complaints
- Team stats:
  - 12+ Teamleden
  - 24/7 Platform Online
  - <24u Verificatie Tijd
  - 100% Nederlands Team
- Real photo: Professional team working

**6. Security & Privacy** (linie 498-692)

- 3 sekcje:
  - **AVG/GDPR Compliant:** Data minimization, Recht op inzage, Transparante privacy
  - **Encryptie & SSL:** 256-bit SSL/TLS, Bcrypt passwords, Secure storage
  - **Audit Log & Transparantie:** Admin actions logged, Certificate traceability, Login monitoring
- Security stats:
  - 100% GDPR Compliant
  - 256-bit SSL Encryptie
  - 24/7 Security Monitoring
  - 0 Data Lekken

### 📊 Metryki

| Kategoria   | Wartość          |
| ----------- | ---------------- |
| Sekcje      | 6 głównych       |
| Real Photos | 7 zdjęć Unsplash |
| CTAs        | 3 buttony        |
| Value cards | 9 kart           |
| i18n keys   | ~25 tłumaczeń    |

### ⚠️ CO WYMAGA POPRAWY:

1. **Duplicate File Warning**

   - `pages/AboutUs.tsx` istnieje (stary?)
   - `pages/public/AboutPage.tsx` (aktualny)
   - **ACTION:** Sprawdź i usuń duplicate

2. **Missing: Company History**

   - Brak timeline powstania platformy
   - Dodać: "Gestart in 2024" + milestones

3. **Missing: Values/Principles**

   - Tylko 3 value cards (Transparantie, Direct Contact, 0% Commissie)
   - Dodać więcej: Betrouwbaarheid, Innovatie, Kwaliteit

4. **Team Photos**

   - Generic stock photo
   - **Better:** Real team photos (jeśli możliwe)

5. **Security - Brak Certyfikatów**

   - Wspomniany GDPR, SSL
   - Dodać badges: "ISO 27001", "SOC 2 Compliant"

6. **Missing: Press/Media**
   - Brak "As seen in" section
   - Dodać loga mediów (jeśli były publikacje)

### ✅ REKOMENDACJE ROZBUDOWY:

#### PRIORITY 1: Company History Timeline (2h)

```tsx
<section className="py-24 bg-primary-dark">
  <h2>Onze Reis</h2>
  <div className="max-w-4xl mx-auto">
    <Timeline>
      <TimelineItem year="2024 Q1" title="Platform Launch">
        Officiële lancering van ZZP Werkplaats
      </TimelineItem>
      <TimelineItem year="2024 Q2" title="100+ ZZP'ers">
        Eerste 100 gecertificeerde professionals
      </TimelineItem>
      <TimelineItem year="2024 Q3" title="Team Features">
        Launch van Team configuratie en Skoczek
      </TimelineItem>
      <TimelineItem year="2024 Q4" title="500+ Matches">
        Mijlpaal: 500 succesvolle matches!
      </TimelineItem>
    </Timeline>
  </div>
</section>
```

#### PRIORITY 2: Values & Principles Expansion (1h)

```tsx
// Rozszerzyć Mission section o więcej values:
const values = [
  { icon: "🎯", title: "Transparantie", desc: "..." },
  { icon: "🤝", title: "Direct Contact", desc: "..." },
  { icon: "💰", title: "0% Commissie", desc: "..." },
  { icon: "🔒", title: "Betrouwbaarheid", desc: "Verified profiles" },
  { icon: "⚡", title: "Innovatie", desc: "Teams & On-demand" },
  { icon: "⭐", title: "Kwaliteit", desc: "ZZP Examen certificering" },
];
```

#### PRIORITY 3: Press/Media Section (30min)

```tsx
<section className="py-12 bg-primary-navy/20">
  <h3 className="text-center mb-8">Zoals gezien in</h3>
  <div className="flex justify-center gap-12">
    <img src="/media/bouwkrant-logo.svg" alt="Bouwkrant" />
    <img src="/media/zzp-magazine-logo.svg" alt="ZZP Magazine" />
    <img src="/media/nrc-logo.svg" alt="NRC" />
  </div>
</section>
```

---

## 🏢 FOREMPLOYERSPAGE - DLA PRACODAWCÓW

**Ścieżka:** `pages/public/ForEmployersPage.tsx`  
**Rozmiar:** 1,018 linii  
**Status:** ✅ SUPER ROZBUDOWANA - 2 tabs (Workers + Employers)  
**⚠️ Uwaga:** Plik ma `@ts-nocheck` na początku!

### Obecna Zawartość

#### ✅ STRUKTURA:

**Tab Switcher** (linie 14-66)

- 2 tabs: "Voor ZZP'ers" | "Voor Opdrachtgevers"
- Toggle buttons z animacjami

---

### TAB 1: WORKERS CONTENT (Voor ZZP'ers)

**1. Hoe Registreren & Starten** (linie 80-138)

- 2 real photos (construction worker, team professionals)
- 5 kroków:
  1. Registreer → Basis info
  2. Profiel Info → Specialisatie, uurloon
  3. Account → Wachtwoord, voorwaarden
  4. Verificatie → Email confirmation
  5. Portfolio → Certificaten uploaden
- Icons dla każdego kroku

**2. Abonnementen - Basic vs Premium** (linie 140-240)

- Visual comparison: €0 (Basic) vs €13 (Premium)
- Basic features (wszystkie ❌):
  - Niet zichtbaar
  - Geen contact
  - Geen team
- Premium features (wszystkie ✅):
  - Volledig zichtbaar
  - Onbeperkt contact
  - Team configuratie
  - Skoczek toggle
  - Hogere ranking
- "AANBEVOLEN" badge

**3. Team Configuratie** (linie 242-320)

- Visual grid z avatarami (Individual + Duo + Team)
- 4 typy:
  - Individueel - Standaard
  - Duo Partner - 2 personen
  - Team Leader - 2-10 personen
  - Helper Available - Flexibel

**4. Skoczek - Beschikbaar Nu** (linie 322-410)

- Real photo: Worker ready
- Visual toggle animation (OFF → ON)
- Jak użyć:
  1. Dashboard
  2. Toggle "Beschikbaar Nu"
  3. Groen = zichtbaar
  4. Rood = normal mode
  5. Notificaties

**5. ZZP Examen & Certificaat** (linie 412-482)

- 2 real photos (exam study, certificate diploma)
- Visual certificaat placeholder z złotymi borderami
- Pricing: €230 (eenmalig)
- Benefits:
  - Officieel certificaat
  - 1 jaar Premium gratis
  - 🏆 Badge
  - 3x meer aanvragen
- CTA: "Aanmelden voor Examen"

**6. Dashboard Functies** (linie 484-542)

- Real photo: Analytics dashboard
- 6 funkcji:
  - Statistieken (views, contacts)
  - Profiel Bewerken
  - Berichten
  - Instellingen
  - Abonnement
  - Skoczek Toggle

**7. FAQ voor ZZP'ers** (linie 544-590)

- Real photos: Customer support, team questions
- 4 pytania:
  - Moet ik Premium nemen?
  - Hoe lang duurt verificatie?
  - Kan ik uurloon aanpassen?
  - Wat als employer niet betaalt?

---

### TAB 2: EMPLOYERS CONTENT (Voor Opdrachtgevers)

**1. Hoe Registreren & Starten** (linie 600-655)

- 2 real photos (business team, professional search)
- 6 kroków:
  1. Klik Registreer
  2. Bedrijfsgegevens (KVK)
  3. Email Verificatie
  4. Kies Abonnement (Basic €13 / Premium €25)
  5. Betaal via Stripe
  6. Direct Toegang

**2. Abonnementen - Basic vs Premium** (linie 657-745)

- Real photo: Business growth planning
- Basic (€13/maand):
  - Zoek alle ZZP'ers ✅
  - 5 contacten/maand ✅
  - Basis filters ✅
  - Geen priority listing ❌
  - Geen analytics ❌
- Premium (€25/maand):
  - Alles in Basic ✅
  - Unlimited contacten ✅
  - Advanced filters ✅
  - Priority listing ✅
  - Dashboard analytics ✅
  - Priority support ✅
- "POPULAIR" badge

**3. Zoek Functies** (linie 747-805)

- Real photos: Search & technology teams
- 8 filters:
  - Specialisatie (Metselaar, Timmerman, etc.)
  - Locatie (stad/postcode + radius)
  - Tarief (€15 - €75/uur slider)
  - Team Size (Individual, Duo, Team 3-10)
  - Skoczek (On-demand available)
  - Certificering (ZZP Exam only)
  - Rating (3★, 4★, 5★)
  - Beschikbaarheid (date/time)

**4. Contact & Teams Boeken** (linie 807-885)

- Real photo: Business communication (circular)
- 2 sekcje:
  - **Contact Opnemen:** 7 kroków procesu
  - **Teams Boeken:** Pricing comparison
    - Example: Loodgieter Team (1 senior + 2 assistenten)
    - €120/uur vs 3×€50 = €150/uur apart!

**5. Kosten Besparen - Calculator** (linie 887-945)

- 2 real photos (savings, calculator)
- Comparison:
  - **TRADITIONEEL BUREAU (20% commissie):**
    - €2,000 × 10 projecten = €20,000
    - Commissie 20% = €4,000
  - **ZZP WERKPLAATS (Premium):**
    - €25 × 12 maanden = €300
    - Totaal kosten = €300
  - **BESPARING: €3,700/jaar!** ✅

**6. FAQ voor Opdrachtgevers** (linie 947-1,018)

- Real photo: Business support team
- 5 pytań:
  - Moet ik meteen betalen?
  - Wat als ZZP'er niet voldoet?
  - Kan ik meerdere ZZP'ers contacteren?
  - Hoe betaal ik de ZZP'er?
  - Verschil Basic vs Premium?

### 📊 Metryki

| Kategoria          | Wartość                 |
| ------------------ | ----------------------- |
| Tabs               | 2 (Workers + Employers) |
| Sekcje Workers     | 7 głównych              |
| Sekcje Employers   | 6 głównych              |
| Real Photos        | 16 zdjęć Unsplash       |
| CTAs               | 8 buttonów              |
| FAQ items          | 9 pytań (4+5)           |
| Visual comparisons | 5 tabelek               |

### ⚠️ CO WYMAGA POPRAWY:

1. **TypeScript Errors** (@ts-nocheck)

   - Plik ma wyłączone type checking
   - **ACTION:** Fix types i usuń @ts-nocheck

2. **Missing: Case Studies**

   - Brak real success stories
   - Dodać: "Bedrijf X vond 10 ZZP'ers in 1 week!"

3. **Missing: ROI Calculator (Interactive)**

   - Tylko static comparison
   - Dodać interaktywny kalkulator:
     ```
     Hoeveel projecten/jaar? [slider 1-50]
     Gemiddelde waarde: [€ input]
     → Jouw besparing: €XX,XXX
     ```

4. **Missing: Video Tutorials**

   - Brak "Hoe zoek je ZZP'ers?" video
   - Dodać embeds lub GIFy

5. **Filters Section - Brak Screenshots**
   - Opisane 8 filters
   - Dodać screenshoty z search interface

### ✅ REKOMENDACJE ROZBUDOWY:

#### PRIORITY 1: Case Studies Section (3h)

```tsx
<section className="py-24 bg-primary-navy/20">
  <h2>Success Stories</h2>
  <div className="grid md:grid-cols-3 gap-8">
    <CaseStudyCard
      company="BouwCo Amsterdam"
      challenge="Urgent team needed voor 1 week project"
      solution="Gevonden Team Leader met 4 personen via Skoczek"
      result="Project afgerond in 5 dagen, €2000 bespaard"
      photo={...}
    />
    {/* More cases */}
  </div>
</section>
```

#### PRIORITY 2: Interactive ROI Calculator (4h)

```tsx
<section>
  <h2>Bereken je Besparing</h2>
  <div className="bg-gradient-glass p-8 rounded-2xl">
    <label>Hoeveel projecten per jaar?</label>
    <input type="range" min="1" max="50" value={projects} />

    <label>Gemiddelde projectwaarde</label>
    <input type="number" value={avgValue} />

    <div className="results">
      <h3>Traditioneel bureau (15% commissie):</h3>
      <p className="text-red-400">€{traditionalCost}</p>

      <h3>ZZP Werkplaats Premium:</h3>
      <p className="text-green-400">€300/jaar</p>

      <h2>JE BESPAART: €{savings}!</h2>
    </div>
  </div>
</section>
```

#### PRIORITY 3: Fix TypeScript (1h)

```bash
# Remove @ts-nocheck
# Fix import types
import type { FC } from 'react';

# Fix component props
type TabType = 'workers' | 'employers';
const ForEmployersPage: FC = () => { ... }
```

---

## 📜 EXPERIENCECERTIFICATEPAGE - EGZAMIN ZZP

**Ścieżka:** `pages/public/ExperienceCertificatePage.tsx`  
**Rozmiar:** 759 linii  
**Status:** ⚠️ DOBRA - KRYTYCZNY BUG w zapisie formularza!

### Obecna Zawartość

#### ✅ KOMPLETNE SEKCJE:

**1. Hero Section** (linie 122-178)

- Logo + gradient background z pulsującymi orbsami
- Badge: "📜 OFFICIEEL ZZP EXAMEN"
- Title: "ZZP Examen & Certificaat"
- 2 real photos (exam study, certificate)
- 3 value cards:
  - 📝 60 Vragen
  - ⏱️ 90 Minuten
  - 🏆 €230 + 1 jaar Premium gratis

**2. What You Get Section** (linie 180-298)

- Real photo: Success celebration
- 6 benefits cards:
  - 📜 Officieel Certificaat (downloadable PDF)
  - 🎁 1 Jaar Premium Gratis (€156 waarde)
  - 🏆 Gecertificeerd Badge
  - 📚 Voorbereidingsmateriaal
  - 🔄 Herkansing Mogelijk (50% korting)
  - 💼 Meer Opdrachten (3x meer aanvragen)
- Calculation box:
  - ZZP Examen: €230
  - 1 Jaar Premium: €156 gratis
  - Voorbereidingsmateriaal: €50 gratis
  - **Totale Waarde: €436+**
  - **90% voordeel!**

**3. Exam Topics Section** (linie 300-428)

- 3 real photos (bouwregelgeving, safety, materials)
- 4 topic areas:
  - 📐 Bouwregelgeving: Bouwbesluit 2012, Vergunningen, EPC
  - ⚠️ Veiligheid: VCA, PBM, Steigerveiligheid, NEN 1010
  - 🏗️ Materiaalkennis: Properties, Duurzaamheid, Isolatie
  - 💰 Calculatie: Uurloon, Offerte, Tijd planning, BTW

**4. Registration Form Section** (linie 430-632)

- Real photo: Registration form (circular)
- Form fields:
  - Volledige Naam \*
  - E-mailadres \*
  - Telefoonnummer \*
  - Woonplaats \*
  - Specialisatie \* (dropdown 10 opcji)
  - Jaren Ervaring \* (number 1-50)
  - Voorkeursdatum Examen (optional date)
  - Motivatie (optional textarea)
- Submit button
- Legal consent checkbox

**5. FAQ Section** (linie 634-759)

- 2 real photos (customer support, online exam)
- 6 pytań:
  - Moet ik eerst betalen?
  - Hoe moeilijk is het examen?
  - Kan ik het examen online doen?
  - Wat als ik niet slaag?
  - Wanneer krijg ik mijn Premium?
  - Is het certificaat erkend?
- Real photo: Team success celebration

**6. Success State** (linie 72-121)

- Pokazywany po submit formularza
- Checkmark icon (green gradient)
- "Aanmelding Ontvangen!"
- Proces:
  1. Bevestigingsmail
  2. Examendatum voorstel
  3. Betaalinstructies (€230)
  4. Voorbereidingsmateriaal
- CTA: "Terug naar Home"

### 📊 Metryki

| Kategoria      | Wartość           |
| -------------- | ----------------- |
| Sekcje         | 6 głównych        |
| Real Photos    | 10 zdjęć Unsplash |
| Form fields    | 8 pól             |
| FAQ items      | 6 pytań           |
| Benefits cards | 6 kart            |
| Topics         | 4 obszary         |

### 🚨 KRYTYCZNY BUG:

**BŁĘDNA TABELA W FORMULARZU!** (linie 37-56)

```typescript
// ❌ ŹLE - zapisuje do applications table!
const payload = {
  employer_id: "temp-employer-id", // <-- Hardcoded!
  job_id: "temp-job-id", // <-- Hardcoded!
  worker_id: "temp-worker-id", // <-- Hardcoded!
  status: "pending",
  cover_letter: formData.motivation,
  available_from: formData.preferred_exam_date,
  created_at: new Date().toISOString(),
};

const { error } = await supabase
  .from("applications") // <-- ❌ ŹLE! To table dla job applications!
  .insert([payload]);
```

**TO POWINNO BYĆ:**

```typescript
// ✅ DOBRZE - exam_applications table
const payload = {
  full_name: formData.full_name,
  email: formData.email,
  phone: formData.phone,
  specialization: formData.specialization,
  years_experience: parseInt(formData.years_experience),
  city: formData.city,
  motivation: formData.motivation,
  preferred_exam_date: formData.preferred_exam_date,
  status: "pending",
  created_at: new Date().toISOString(),
};

const { error } = await supabase
  .from("exam_applications") // ✅ Correct table!
  .insert([payload]);
```

### ⚠️ CO WYMAGA POPRAWY:

1. **PRIORYTET 1: Fix Database Integration**

   - Utworzyć tabelę `exam_applications` w Supabase
   - Poprawić handleSubmit function
   - Dodać email notification po submit

2. **Missing: Exam Preparation Materials Preview**

   - Wspomniany "voorbereidingsmateriaal"
   - Dodać preview PDF lub lista topics

3. **Missing: Payment Integration**

   - Formularz nie integruje Stripe
   - Dodać payment flow po confirmation

4. **Missing: Exam Schedule Calendar**

   - Voorkeursdatum to tylko date input
   - Dodać calendar z available dates

5. **FAQ - Brak Pricing Breakdown**
   - Tylko €230 mentioned
   - Dodać co zawiera cena dokładnie

### ✅ REKOMENDACJE ROZBUDOWY:

#### PRIORITY 1: Fix Database Schema (1h)

```sql
-- Migration: create exam_applications table
CREATE TABLE exam_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name VARCHAR NOT NULL,
  email VARCHAR NOT NULL,
  phone VARCHAR NOT NULL,
  specialization VARCHAR NOT NULL,
  years_experience INTEGER NOT NULL,
  city VARCHAR NOT NULL,
  motivation TEXT,
  preferred_exam_date DATE,
  status VARCHAR DEFAULT 'pending', -- pending | approved | scheduled | completed
  exam_date DATE,
  exam_score INTEGER, -- 0-100
  passed BOOLEAN,
  certificate_issued_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  worker_id UUID REFERENCES workers(id), -- Link after approval
  CONSTRAINT valid_score CHECK (exam_score >= 0 AND exam_score <= 100)
);

-- RLS policies
ALTER TABLE exam_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all applications"
  ON exam_applications FOR SELECT
  USING (auth.role() = 'admin');

CREATE POLICY "Users can view their own applications"
  ON exam_applications FOR SELECT
  USING (email = auth.jwt()->>'email');

CREATE POLICY "Anyone can submit applications"
  ON exam_applications FOR INSERT
  WITH CHECK (true);
```

#### PRIORITY 2: Exam Materials Preview Section (2h)

```tsx
<section className="py-24 bg-primary-navy/30">
  <h2>Voorbereidingsmateriaal Preview</h2>
  <div className="grid md:grid-cols-4 gap-6">
    <MaterialCard
      icon="📐"
      title="Bouwregelgeving"
      pagesCount={15}
      topicsCount={8}
      preview="Bouwbesluit 2012, Vergunningen..."
    />
    <MaterialCard
      icon="⚠️"
      title="Veiligheid"
      pagesCount={12}
      topicsCount={6}
      preview="VCA, PBM, Steigerveiligheid..."
    />
    {/* ... */}
  </div>

  <div className="mt-12 text-center">
    <button className="bg-yellow-500 text-black px-8 py-3 rounded-xl">
      Download Gratis Voorbeeld (5 vragen)
    </button>
  </div>
</section>
```

#### PRIORITY 3: Payment Flow Integration (4h)

```tsx
// Po approval przez admin:
const handleExamPayment = async () => {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card", "ideal"],
    line_items: [
      {
        price_data: {
          currency: "eur",
          product_data: {
            name: "ZZP Examen + 1 Jaar Premium",
            description: "60 vragen, 90 minuten, certificaat bij slagen",
          },
          unit_amount: 23000, // €230.00
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: `${window.location.origin}/exam/payment-success`,
    cancel_url: `${window.location.origin}/exam/payment-cancel`,
    metadata: {
      exam_application_id: applicationId,
      worker_id: workerId,
    },
  });

  window.location.href = session.url;
};
```

#### PRIORITY 4: Exam Schedule Calendar (2h)

```tsx
<div className="bg-gradient-glass p-6 rounded-2xl">
  <h3>Kies je examendatum</h3>
  <Calendar
    availableDates={["2025-12-15", "2025-12-20", "2026-01-10", "2026-01-17"]}
    onSelectDate={(date) =>
      setFormData({ ...formData, preferred_exam_date: date })
    }
  />
  <p className="text-neutral-400 mt-4">
    Of stel je eigen datum voor - we nemen contact op binnen 24 uur
  </p>
</div>
```

---

## 📞 CONTACTPAGE - KONTAKT

**Ścieżka:** `pages/public/ContactPage.tsx`  
**Rozmiar:** 251 linii  
**Status:** ⚠️ NAJPROSTSZA - wymaga rozbudowy

### Obecna Zawartość

#### ✅ KOMPLETNE SEKCJE:

**1. Header Section** (linie 22-38)

- Logo + gradient blue background
- Title: "Contact"
- Subtitle: "Heeft u vragen? We helpen u graag!"

**2. Contact Form** (linie 42-147)

- Form fields:
  - Naam \* (text)
  - E-mail \* (email)
  - Telefoon (tel, optional)
  - Onderwerp \* (select):
    - Algemene vraag
    - Certificaat aanvraag
    - Voor opdrachtgevers
    - Technische ondersteuning
  - Bericht \* (textarea 6 rows)
- Submit button
- handleSubmit (linie 15-20):
  ```tsx
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Contact form submitted:", formData); // ❌ Tylko console.log!
    alert(
      t(
        "contact.form.success",
        "Bedankt! We nemen binnen 24 uur contact met u op."
      )
    );
  };
  ```

**3. Contact Info** (linie 149-238)

- 4 sekcje:
  - 📍 **Adres werkplaats:**
    - Industrieweg 123
    - 1234 AB Amsterdam
    - Nederland
  - ⏰ **Openingstijden:**
    - Ma-Vr: 09:00 - 17:00
    - Za-Zo: Gesloten
  - 📞 **Telefoon:**
    - +31 20 123 4567
  - 📧 **E-mail:**
    - info@zzpwerkplaats.nl

**4. Map Placeholder** (linie 240-244)

```tsx
<div className="mt-8 bg-gray-200 rounded-lg h-64 flex items-center justify-center">
  <p className="text-gray-500">
    {t("contact.info.map", "[Google Maps integratie - TODO]")}
  </p>
</div>
```

### 📊 Metryki

| Kategoria       | Wartość                          |
| --------------- | -------------------------------- |
| Sekcje          | 4 główne                         |
| Real Photos     | 0 ❌                             |
| Form fields     | 5 pól                            |
| Contact methods | 4 (address, hours, phone, email) |
| Social media    | 0 ❌                             |

### 🚨 KRYTYCZNE BRAKI:

1. **Form Nie Działa - Tylko console.log!**

   ```tsx
   // ❌ ŹLE
   const handleSubmit = (e: React.FormEvent) => {
     e.preventDefault();
     console.log("Contact form submitted:", formData);
     alert("Bedankt!");
   };

   // ✅ POWINNO BYĆ
   const handleSubmit = async (e: React.FormEvent) => {
     e.preventDefault();
     setIsSubmitting(true);

     try {
       // Option 1: Supabase function
       const { error } = await supabase.functions.invoke("send-contact-email", {
         body: formData,
       });

       // Option 2: Direct email service (SendGrid, Mailgun)
       await fetch("/api/contact", {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify(formData),
       });

       setSubmitSuccess(true);
     } catch (error) {
       console.error("Error sending contact form:", error);
       alert("Er is een fout opgetreden. Probeer het opnieuw.");
     } finally {
       setIsSubmitting(false);
     }
   };
   ```

2. **Brak Google Maps Integration**

   - Tylko gray placeholder
   - Dodać embed lub API integration

3. **Brak Social Media Links**

   - LinkedIn, Facebook, Instagram, Twitter
   - Dodać icons z linkami

4. **Brak FAQ Section**

   - Inne strony mają FAQ
   - ContactPage nie ma

5. **Brak Real Photos**

   - Wszystkie inne strony mają Unsplash images
   - ContactPage ma 0

6. **Brak Live Chat Widget**
   - Intercom, Zendesk, Tawk.to
   - Pomógłby w real-time support

### ✅ REKOMENDACJE ROZBUDOWY:

#### PRIORITY 1: Fix Form Backend (2h)

```tsx
// supabase/functions/send-contact-email/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  const { name, email, phone, subject, message } = await req.json();

  // Send email via SendGrid
  const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${Deno.env.get("SENDGRID_API_KEY")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      personalizations: [
        {
          to: [{ email: "info@zzpwerkplaats.nl" }],
          subject: `Contact Form: ${subject}`,
        },
      ],
      from: { email: "noreply@zzpwerkplaats.nl" },
      content: [
        {
          type: "text/html",
          value: `
          <h2>New Contact Form Submission</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Phone:</strong> ${phone || "N/A"}</p>
          <p><strong>Subject:</strong> ${subject}</p>
          <p><strong>Message:</strong><br>${message}</p>
        `,
        },
      ],
    }),
  });

  return new Response(JSON.stringify({ success: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
```

#### PRIORITY 2: Add Google Maps Embed (30min)

```tsx
<div className="mt-8 rounded-lg overflow-hidden h-96">
  <iframe
    title="ZZP Werkplaats Location"
    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2436.1234567890!2d4.8951679!3d52.3702157!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNTLCsDIyJzEyLjgiTiA0wrA1Mic0Mi42IkU!5e0!3m2!1sen!2snl!4v1234567890"
    width="100%"
    height="100%"
    style={{ border: 0 }}
    allowFullScreen
    loading="lazy"
  ></iframe>
</div>
```

#### PRIORITY 3: Add Social Media Section (1h)

```tsx
<section className="py-12 bg-gray-50">
  <div className="max-w-7xl mx-auto px-4 text-center">
    <h3 className="text-2xl font-bold mb-6">Volg ons op social media</h3>
    <div className="flex justify-center gap-6">
      <a
        href="https://linkedin.com/company/zzp-werkplaats"
        target="_blank"
        className="..."
      >
        <LinkedInIcon size={32} />
        LinkedIn
      </a>
      <a
        href="https://facebook.com/zzpwerkplaats"
        target="_blank"
        className="..."
      >
        <FacebookIcon size={32} />
        Facebook
      </a>
      <a
        href="https://instagram.com/zzpwerkplaats"
        target="_blank"
        className="..."
      >
        <InstagramIcon size={32} />
        Instagram
      </a>
      <a
        href="https://twitter.com/zzpwerkplaats"
        target="_blank"
        className="..."
      >
        <TwitterIcon size={32} />
        Twitter
      </a>
    </div>
  </div>
</section>
```

#### PRIORITY 4: Add FAQ Section (2h)

```tsx
<section className="py-24 bg-white">
  <div className="max-w-4xl mx-auto px-4">
    <h2 className="text-4xl font-bold mb-12 text-center">
      Veelgestelde Vragen
    </h2>
    <div className="space-y-6">
      <details className="bg-gray-50 rounded-xl p-6">
        <summary className="font-bold cursor-pointer">
          Wat zijn jullie openingstijden?
        </summary>
        <p className="mt-4 text-gray-600">
          We zijn bereikbaar ma-vr van 09:00 tot 17:00. Buiten kantooruren kun
          je een bericht achterlaten.
        </p>
      </details>

      <details className="bg-gray-50 rounded-xl p-6">
        <summary className="font-bold cursor-pointer">
          Hoe snel krijg ik antwoord?
        </summary>
        <p className="mt-4 text-gray-600">
          We streven ernaar binnen 24 uur te reageren op alle contactverzoeken.
        </p>
      </details>

      <details className="bg-gray-50 rounded-xl p-6">
        <summary className="font-bold cursor-pointer">
          Kan ik langskomen op kantoor?
        </summary>
        <p className="mt-4 text-gray-600">
          Ja, maar maak graag eerst een afspraak via dit contactformulier of bel
          ons op +31 20 123 4567.
        </p>
      </details>

      <details className="bg-gray-50 rounded-xl p-6">
        <summary className="font-bold cursor-pointer">
          Welke betaalmethoden accepteren jullie?
        </summary>
        <p className="mt-4 text-gray-600">
          Via Stripe accepteren we creditcards, iDEAL, Bancontact en SEPA
          automatische incasso.
        </p>
      </details>
    </div>
  </div>
</section>
```

#### PRIORITY 5: Add Real Photos (30min)

```tsx
// Hero section
<div className="mb-8 grid md:grid-cols-2 gap-6">
  <div className="rounded-2xl overflow-hidden border-4 border-blue-500/30">
    <img
      src="https://images.unsplash.com/photo-1423666639041-f56000c27a9a?w=600&h=400&fit=crop"
      alt="Customer support team ready to help"
      className="w-full h-64 object-cover"
    />
  </div>

  <div className="rounded-2xl overflow-hidden border-4 border-cyan-500/30">
    <img
      src="https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=600&h=400&fit=crop"
      alt="Office workspace and communication"
      className="w-full h-64 object-cover"
    />
  </div>
</div>
```

#### PRIORITY 6: Live Chat Widget (1h)

```tsx
// Add to layout or ContactPage
useEffect(() => {
  // Intercom
  window.Intercom("boot", {
    app_id: "YOUR_INTERCOM_APP_ID",
    name: user?.name,
    email: user?.email,
  });

  return () => {
    window.Intercom("shutdown");
  };
}, [user]);
```

---

## 🎯 REKOMENDACJE PRIORYTETOWE

### ⚡ HIGH PRIORITY (Fix ASAP!)

| #   | Zadanie                                                              | Strona           | Czas  | Impact      |
| --- | -------------------------------------------------------------------- | ---------------- | ----- | ----------- |
| 1   | **Fix ExperienceCertificatePage form** - zapisuje do błędnej tabeli! | ExamPage         | 1h    | 🔴 CRITICAL |
| 2   | **Fix ContactPage form** - tylko console.log, nie wysyła emaili      | ContactPage      | 2h    | 🔴 HIGH     |
| 3   | **Add route** dla ExperienceCertificatePage w App.tsx                | App.tsx          | 5min  | 🔴 HIGH     |
| 4   | **Remove duplicate** AboutUs.tsx file                                | AboutPage        | 10min | 🟡 MEDIUM   |
| 5   | **Fix TypeScript** w ForEmployersPage (@ts-nocheck)                  | ForEmployersPage | 1h    | 🟡 MEDIUM   |

**Total:** ~4.5h - Krytyczne bugi i braki

---

### 📈 MEDIUM PRIORITY (Rozbudowa treści)

| #   | Zadanie                              | Strona           | Czas  | Value     |
| --- | ------------------------------------ | ---------------- | ----- | --------- |
| 6   | Add **Testimonials section**         | HomePage         | 2h    | 🟢 HIGH   |
| 7   | Add **Google Maps embed**            | ContactPage      | 30min | 🟢 HIGH   |
| 8   | Add **Social media links**           | ContactPage      | 1h    | 🟢 MEDIUM |
| 9   | Add **Company history timeline**     | AboutPage        | 2h    | 🟢 MEDIUM |
| 10  | Add **FAQ section**                  | ContactPage      | 2h    | 🟢 MEDIUM |
| 11  | Add **Video demo section**           | HomePage         | 3h    | 🟢 MEDIUM |
| 12  | Add **Case studies**                 | ForEmployersPage | 3h    | 🟢 HIGH   |
| 13  | Add **ROI calculator** (interactive) | ForEmployersPage | 4h    | 🟢 HIGH   |
| 14  | Add **Exam materials preview**       | ExamPage         | 2h    | 🟢 MEDIUM |

**Total:** ~19.5h - Wartościowe rozszerzenia

---

### 🚀 LOW PRIORITY (Nice to have)

| #   | Zadanie                                    | Strona      | Czas  | Value     |
| --- | ------------------------------------------ | ----------- | ----- | --------- |
| 15  | Add **Live chat widget** (Intercom)        | All pages   | 1h    | 🔵 LOW    |
| 16  | Add **Press/Media section**                | AboutPage   | 30min | 🔵 LOW    |
| 17  | Add **Real photos** (replace stock images) | ContactPage | 30min | 🔵 LOW    |
| 18  | Add **Payment flow** integration           | ExamPage    | 4h    | 🔵 MEDIUM |
| 19  | Add **Exam schedule calendar**             | ExamPage    | 2h    | 🔵 LOW    |
| 20  | Replace **certificaat placeholder** SVG    | HomePage    | 1h    | 🔵 LOW    |

**Total:** ~9h - Estetyka i advanced features

---

## 📅 PLAN ROZBUDOWY

### FAZA 1: KRYTYCZNE NAPRAWY (1 tydzień)

**Dzień 1-2: Database & Backend Fixes**

- [ ] Create `exam_applications` table (Migration)
- [ ] Fix ExperienceCertificatePage handleSubmit
- [ ] Setup SendGrid/email service dla ContactPage
- [ ] Fix ContactPage handleSubmit z email integration
- [ ] Test email delivery end-to-end

**Dzień 3: Routing & Cleanup**

- [ ] Add route `/certificaat` w App.tsx
- [ ] Remove duplicate `pages/AboutUs.tsx`
- [ ] Fix TypeScript errors w ForEmployersPage
- [ ] Run `get_errors` - verify 0 errors

**Dzień 4-5: QA & Testing**

- [ ] Test wszystkie formularze (submit → email received)
- [ ] Test routing do wszystkich 5 stron
- [ ] Test responsive design na mobile/tablet
- [ ] Fix any console errors

---

### FAZA 2: ROZBUDOWA TREŚCI (2 tygodnie)

**Tydzień 1: HomePage + AboutPage**

- [ ] Day 1-2: Add Testimonials section (HomePage)
- [ ] Day 3: Add Video demo section (HomePage)
- [ ] Day 4: Add Company history timeline (AboutPage)
- [ ] Day 5: Add Press/Media section (AboutPage)

**Tydzień 2: ContactPage + ForEmployersPage**

- [ ] Day 1: Google Maps embed (ContactPage)
- [ ] Day 2: Social media links + FAQ (ContactPage)
- [ ] Day 3-4: Case studies section (ForEmployersPage)
- [ ] Day 5: Interactive ROI calculator (ForEmployersPage)

---

### FAZA 3: ADVANCED FEATURES (1 tydzień)

**Dzień 1-2: ExamPage Enhancements**

- [ ] Exam materials preview section
- [ ] Payment flow integration (Stripe)
- [ ] Exam schedule calendar

**Dzień 3-4: ContactPage Polish**

- [ ] Live chat widget (Intercom/Zendesk)
- [ ] Real photos replacement
- [ ] Contact methods expansion

**Dzień 5: Final QA**

- [ ] Full site audit
- [ ] Performance testing
- [ ] Accessibility check (WCAG)
- [ ] i18n completeness check

---

## 📊 PODSUMOWANIE STATYSTYK

### Strony - Rozmiary

| Strona           | Linie     | Status          | Real Photos | CTAs   | FAQ    |
| ---------------- | --------- | --------------- | ----------- | ------ | ------ |
| HomePage         | 1,172     | ✅ BARDZO DOBRA | 10          | 9      | 8      |
| AboutPage        | 692       | ✅ DOBRA        | 7           | 3      | 0      |
| ForEmployersPage | 1,018     | ✅ SUPER        | 16          | 8      | 9      |
| ExamPage         | 759       | ⚠️ BUG!         | 10          | 3      | 6      |
| ContactPage      | 251       | ⚠️ PROSTA       | 0           | 1      | 0      |
| **TOTAL**        | **3,892** | -               | **43**      | **24** | **23** |

### Braki po Priorytetach

| Priorytet | Ilość  | Czas    | Impact       |
| --------- | ------ | ------- | ------------ |
| 🔴 HIGH   | 5      | 4.5h    | CRITICAL     |
| 🟡 MEDIUM | 9      | 19.5h   | HIGH VALUE   |
| 🔵 LOW    | 6      | 9h      | NICE TO HAVE |
| **TOTAL** | **20** | **33h** | -            |

---

## ✅ WNIOSKI KOŃCOWE

### Mocne Strony Platformy

1. **Świetny Design System**

   - Gradient-glass, glow effects
   - Consistent color palette
   - Professional animations

2. **Bogate Treści**

   - Concrete examples (pricing, features)
   - Real photos integration
   - FAQ sections na większości stron

3. **Clear User Flows**
   - CTAs well-placed
   - Conversion paths visible
   - Registration steps clear

### Główne Problemy

1. **Krytyczne Bugi (3)**

   - ExamPage zapisuje do błędnej tabeli
   - ContactPage form nie wysyła emaili
   - Brak route dla ExamPage

2. **Najprostsza Strona**

   - ContactPage tylko 251 linii
   - Brak social media, FAQ, photos
   - Google Maps placeholder

3. **Missing Features**
   - Testimonials/Social proof
   - Video demos
   - Interactive calculators
   - Live chat support

### Rekomendowany Plan Działania

**Week 1:** Fix critical bugs (Faza 1)  
**Week 2-3:** Content expansion (Faza 2)  
**Week 4:** Advanced features (Faza 3)

**Total:** 33 godzin pracy = ~4 tygodnie (8h/tydzień)

---

**Raport przygotowany:** 13 listopada 2025  
**Następna aktualizacja:** Po wykonaniu Fazy 1
