import {
  Profile,
  Job,
  Level,
  Availability,
  JobRateType,
  Review,
  User,
  Application,
  ApplicationStatus,
  VerificationSlot,
  VerificationBooking,
  Course,
  CourseType,
  Enrollment,
  Plan,
  Notification,
  UserRole,
} from "./types";

export const MOCK_USERS: User[] = [
  {
    id: 1,
    email: "worker@test.com",
    name: "Jan Kowalski",
    role: "worker",
    subscription: { planId: "worker-plus", status: "ACTIVE" },
  },
  {
    id: 2,
    email: "worker2@test.com",
    name: "Piotr Nowak",
    role: "worker",
    subscription: { planId: "worker-basic", status: "ACTIVE" },
  },
  {
    id: 3,
    email: "worker3@test.com",
    name: "Anna Zielińska",
    role: "worker",
    subscription: { planId: "worker-basic", status: "INACTIVE" },
  },  {
    id: 4,
    email: "client@test.com",
    name: "Bouwbedrijf Jansen",
    role: "employer",
    subscription: { planId: "client-pro", status: "ACTIVE" },
  },
  {
    id: 5,
    email: "client2@test.com",
    name: "Design Huis",
    role: "employer",
    subscription: { planId: "client-basic", status: "ACTIVE" },
  },
  { id: 6, email: "admin@test.com", name: "Admin", role: "admin" },
];

const MOCK_APPROVED_REVIEWS_JAN: Review[] = [
  {
    id: "rev1",
    workerId: 1,
    clientId: 4,
    clientName: "Bouwbedrijf Jansen",
    date: "2023-09-15",
    rating: 5,
    comment:
      "Jan to prawdziwy profesjonalista. Praca wykonana perfekcyjnie i na czas. Polecam!",
    jobScope: "Montaż schodów drewnianych",
    status: "APPROVED",
    checklist: { quality: true, punctuality: true, safety: true },
    photos: [],
    verifiedByPlatform: true,
  },
  {
    id: "rev2",
    workerId: 1,
    clientId: 5,
    clientName: "Design Huis",
    date: "2023-06-02",
    rating: 4,
    comment: "Dobra współpraca, drobne opóźnienie, ale jakość bez zarzutu.",
    jobScope: "Wykonanie mebli kuchennych",
    status: "APPROVED",
    checklist: { quality: true, punctuality: false, safety: true },
    photos: [],
    verifiedByPlatform: true,
  },
];

const MOCK_APPROVED_REVIEWS_PIOTR: Review[] = [
  {
    id: "rev3",
    workerId: 2,
    clientId: 4,
    clientName: "Totaal Techniek",
    date: "2023-10-20",
    rating: 5,
    comment:
      "Piotr jest rzetelnym i kompetentnym fachowcem. Wszystko działa idealnie.",
    jobScope: "Modernizacja instalacji",
    status: "APPROVED",
    checklist: { quality: true, punctuality: true, safety: true },
    photos: [],
    verifiedByPlatform: true,
  },
];

const MOCK_APPROVED_REVIEWS_ANNA: Review[] = [
  {
    id: "rev4",
    workerId: 3,
    clientId: 5,
    clientName: "Renovatie Direct",
    date: "2023-09-01",
    rating: 5,
    comment: "Anna jest bardzo zaangażowana. Polecam do prostszych prac.",
    jobScope: "Malowanie mieszkania",
    status: "APPROVED",
    checklist: { quality: true, punctuality: true, safety: true },
    photos: [],
    verifiedByPlatform: true,
  },
];

export const MOCK_PROFILES: Profile[] = [
  {
    id: 1,
    avatarUrl: "https://picsum.photos/seed/jan_kowalski/200",
    firstName: "Jan",
    lastName: "Kowalski",
    category: "Stolarka",
    level: Level.Senior,
    location: "Westland",
    availability: Availability.Available,
    rate: 45,
    hasVca: true,
    isVerified: true,
    verifiedUntil: "2025-06-15",
    bio: "Doświadczony stolarz z ponad 15-letnim stażem w branży budowlanej. Specjalizuję się w meblach na wymiar oraz skomplikowanych konstrukcjach drewnianych. Precyzja i dbałość o detale to moje priorytety. Moje umiejętności zostały zweryfikowane przez platformę, co gwarantuje najwyższą jakość usług.",
    languages: ["Polski", "Holenderski"],
    skills: [
      { name: "Montaż mebli", proficiency: 5 },
      { name: "Obróbka drewna", proficiency: 5 },
      { name: "Czytanie rysunku technicznego", proficiency: 4 },
      { name: "Lakierowanie", proficiency: 3 },
    ],
    experience: [
      {
        company: "Budimex S.A.",
        title: "Stolarz Budowlany",
        startDate: "2010-03",
        endDate: "2022-08",
        description:
          "Realizacja projektów stolarskich na dużych budowach, praca z dokumentacją techniczną.",
      },
      {
        company: "Własna działalność",
        title: "Stolarz Meblowy",
        startDate: "2022-09",
        endDate: "Obecnie",
        description:
          "Projektowanie i wykonywanie mebli na indywidualne zamówienie klienta.",
      },
    ],
    gallery: [
      {
        title: "Kuchnia na wymiar",
        description: "Nowoczesna kuchnia w dębie",
        images: [
          "https://picsum.photos/seed/kuchnia1/400/300",
          "https://picsum.photos/seed/kuchnia2/400/300",
        ],
        tags: ["Dąb", "MDF"],
        date: "2023-05",
      },
      {
        title: "Zabudowa tarasu",
        description: "Taras z drewna egzotycznego",
        images: ["https://picsum.photos/seed/taras1/400/300"],
        tags: ["Drewno egzotyczne"],
        date: "2023-08",
      },
    ],
    certificates: [
      { name: "VCA VOL", validUntil: "2025-12-10", verified: true },
      {
        name: "Certyfikat czeladniczy",
        validUntil: "Bezterminowo",
        verified: true,
      },
    ],
    reviews: MOCK_APPROVED_REVIEWS_JAN,
    reviewCount: 12,
    avgRating: 4.8,
  },
  {
    id: 2,
    avatarUrl: "https://picsum.photos/seed/piotr_nowak/200",
    firstName: "Piotr",
    lastName: "Nowak",
    category: "Elektryka",
    level: Level.Regular,
    location: "Haga",
    availability: Availability.AvailableFrom,
    availableFrom: "2024-08-01",
    rate: 40,
    hasVca: true,
    isVerified: true,
    bio: "Elektryk z uprawnieniami SEP do 1kV. Zajmuję się instalacjami w nowych budynkach oraz modernizacją istniejących. Znam holenderskie normy i standardy.",
    languages: ["Polski", "Angielski"],
    skills: [
      { name: "Instalacje elektryczne", proficiency: 4 },
      { name: "Pomiary elektryczne", proficiency: 4 },
      { name: "Automatyka budynkowa", proficiency: 3 },
      { name: "Montaż oświetlenia", proficiency: 5 },
    ],
    experience: [
      {
        company: "NRG-Solutions",
        title: "Elektromonter",
        startDate: "2018-01",
        endDate: "2023-12",
        description:
          "Praca przy instalacjach elektrycznych w obiektach komercyjnych i mieszkalnych.",
      },
    ],
    gallery: [
      {
        title: "Instalacja w nowym domu",
        description: "Pełna instalacja elektryczna od A do Z",
        images: [
          "https://picsum.photos/seed/dom1/400/300",
          "https://picsum.photos/seed/dom2/400/300",
        ],
        tags: ["NEN 1010", "Inteligentny dom"],
        date: "2023-11",
      },
    ],
    certificates: [
      { name: "VCA Basis", validUntil: "2024-11-20", verified: true },
      { name: "SEP E1 do 1kV", validUntil: "2028-05-15", verified: true },
    ],
    reviews: MOCK_APPROVED_REVIEWS_PIOTR,
    reviewCount: 8,
    avgRating: 4.9,
  },
  {
    id: 3,
    avatarUrl: "https://picsum.photos/seed/anna_z/200",
    firstName: "Anna",
    lastName: "Zielińska",
    category: "Ogólnobudowlane",
    level: Level.Junior,
    location: "Rotterdam",
    availability: Availability.Available,
    rate: 32,
    hasVca: false,
    isVerified: false,
    bio: "Zmotywowana i pracowita osoba na początku swojej drogi w branży budowlanej. Szybko się uczę i chętnie podejmuję nowe wyzwania. Specjalizuję się w pracach wykończeniowych.",
    languages: ["Polski", "Angielski", "Holenderski (podstawy)"],
    skills: [
      { name: "Malowanie", proficiency: 4 },
      { name: "Szpachlowanie", proficiency: 3 },
      { name: "Układanie paneli", proficiency: 3 },
    ],
    experience: [
      {
        company: "Pomocnik na budowie",
        title: "Pracownik ogólnobudowlany",
        startDate: "2022-05",
        endDate: "2023-10",
        description:
          "Wykonywanie prostych prac wykończeniowych i pomocniczych.",
      },
    ],
    gallery: [],
    certificates: [],
    reviews: MOCK_APPROVED_REVIEWS_ANNA,
    reviewCount: 3,
    avgRating: 4.5,
  },
];

export const MOCK_JOBS: Job[] = [
  {
    id: 1,
    clientId: 4,
    title: "Montaż kuchni i mebli - projekt w Hadze",
    clientName: "Bouwbedrijf Totaal",
    logoUrl: "https://picsum.photos/seed/bouw_totaal/100",
    location: "Haga",
    startDate: "2024-08-12",
    endDate: "2024-08-23",
    rateType: JobRateType.Hourly,
    rateValue: 42,
    peopleNeeded: 2,
    requiredCerts: ["VCA"],
    description:
      "Poszukujemy dwóch doświadczonych stolarzy do montażu kuchni oraz mebli w nowo budowanym apartamentowcu. Wymagane doświadczenie w pracy z rysunkiem technicznym i własne podstawowe narzędzia.",
    isPriority: true,
  },
  {
    id: 2,
    clientId: 4,
    title: "Instalacje elektryczne w biurowcu",
    clientName: "Electro World NL",
    logoUrl: "https://picsum.photos/seed/electro_world/100",
    location: "Rotterdam",
    startDate: "2024-09-02",
    endDate: "2024-11-29",
    rateType: JobRateType.Hourly,
    rateValue: 45,
    peopleNeeded: 4,
    requiredCerts: ["VCA", "NEN 3140"],
    description:
      "Duży projekt - wykonanie pełnej instalacji elektrycznej w nowym biurowcu w centrum Rotterdamu. Praca w zespole, wymagane uprawnienia i doświadczenie w obiektach komercyjnych.",
    isPriority: false,
  },
  {
    id: 3,
    clientId: 5,
    title: "Prace wykończeniowe - malowanie i szpachlowanie",
    clientName: "Schildersbedrijf de Verf",
    logoUrl: "https://picsum.photos/seed/de_verf/100",
    location: "Westland",
    startDate: "2024-07-29",
    endDate: "2024-08-09",
    rateType: JobRateType.Fixed,
    rateValue: 2500,
    peopleNeeded: 1,
    requiredCerts: [],
    description:
      "Zlecenie na wyszpachlowanie i pomalowanie ścian i sufitów w domu jednorodzinnym (ok. 150m2 powierzchni). Materiały po stronie zleceniodawcy. Poszukujemy osoby dokładnej i terminowej.",
    isPriority: false,
  },
];

export const MOCK_APPLICATIONS: Application[] = [
  {
    id: 1,
    jobId: 2,
    workerId: 1,
    date: "2024-07-10",
    status: ApplicationStatus.New,
  },
  {
    id: 2,
    jobId: 2,
    workerId: 2,
    date: "2024-07-11",
    status: ApplicationStatus.Shortlisted,
  },
];

export const MOCK_VERIFICATION_SLOTS: VerificationSlot[] = [
  { id: "slot1", dateTime: "2024-08-05T10:00:00", isBooked: true },
  { id: "slot2", dateTime: "2024-08-05T11:00:00", isBooked: false },
  { id: "slot3", dateTime: "2024-08-06T10:00:00", isBooked: false },
];

export const MOCK_VERIFICATION_BOOKINGS: VerificationBooking[] = [
  { id: "book1", workerId: 3, slotId: "slot1", status: "BOOKED" },
];

export const MOCK_COURSES: Course[] = [
  {
    id: "vca-b-1",
    title: "VCA Basis",
    type: "VCA_BASIS",
    price: 199,
    dates: ["2024-08-10", "2024-08-11"],
    seatLimit: 10,
  },
  {
    id: "vca-v-1",
    title: "VCA VOL",
    type: "VCA_VOL",
    price: 249,
    dates: ["2024-08-17", "2024-08-18"],
    seatLimit: 8,
  },
];

export const MOCK_ENROLLMENTS: Enrollment[] = [
  { id: "enroll1", courseId: "vca-b-1", workerId: 2, status: "PASSED" },
];

export const MOCK_PLANS: Plan[] = [
  {
    id: "worker-basic",
    name: "Worker Basic",
    role: "worker",
    price: 0,
    perks: [
      "Publiczny profil",
      "Dostęp do tablicy ogłoszeń",
      "Aplikowanie na 5 ofert miesięcznie",
    ],
  },
  {
    id: "worker-plus",
    name: "Worker Plus",
    role: "worker",
    price: 15,
    perks: [
      "Wszystko co w Basic",
      "Nielimitowane aplikacje",
      "Promowanie profilu",
      "Dostęp do statystyk",
    ],
  },
  {
    id: "client-basic",
    name: "Client Basic",
    role: "employer",
    price: 0,
    perks: [
      "Publikacja 1 ogłoszenia miesięcznie",
      "Przeglądanie profili",
      "Moderacja opinii do 72h",
    ],
  },
  {
    id: "client-pro",
    name: "Client Pro",
    role: "employer",
    price: 49,
    perks: [
      "Wszystko co w Basic",
      "Nielimitowane ogłoszenia",
      "Promowanie ofert",
      "Priorytetowa moderacja opinii (<24h)",
    ],
  },
];

export const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: "notif1",
    userId: 4,
    type: "NEW_APPLICATION",
    message:
      'Jan Kowalski zaaplikował na Twoją ofertę "Instalacje elektryczne w biurowcu"',
    isRead: false,
    timestamp: new Date().toISOString(),
  },
];

// Initialize localStorage with mock data if not present
export const initializeAppData = () => {
  const initLocalStorage = (key: string, data: any) => {
    if (!localStorage.getItem(key)) {
      localStorage.setItem(key, JSON.stringify(data));
    }
  };

  const allMockReviews = [
    ...MOCK_APPROVED_REVIEWS_JAN,
    ...MOCK_APPROVED_REVIEWS_PIOTR,
    ...MOCK_APPROVED_REVIEWS_ANNA,
  ];
  initLocalStorage("zzp-reviews", allMockReviews);
  initLocalStorage("zzp-jobs", MOCK_JOBS);
  initLocalStorage("zzp-applications", MOCK_APPLICATIONS);
  initLocalStorage("zzp-verification-slots", MOCK_VERIFICATION_SLOTS);
  initLocalStorage("zzp-verification-bookings", MOCK_VERIFICATION_BOOKINGS);
  initLocalStorage("zzp-courses", MOCK_COURSES);
  initLocalStorage("zzp-enrollments", MOCK_ENROLLMENTS);
  initLocalStorage("zzp-plans", MOCK_PLANS);
  initLocalStorage("zzp-notifications", MOCK_NOTIFICATIONS);

  // Initialize individual profiles for demo purposes
  MOCK_PROFILES.forEach((p) => {
    if (p.id === 1) initLocalStorage("workerProfile", p); // Default worker profile
  });
};

initializeAppData();
