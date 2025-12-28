/**
 * Przykłady użycia StatChips w różnych dashboardach
 *
 * Ten plik pokazuje jak zastąpić stare liczniki nowymi "Data Chips"
 */

import { StatChipsGrid, StatChipItem } from "../components/StatChips";
import {
  Users,
  Star,
  Eye,
  Bell,
  FileText,
  CreditCard,
  CheckCircle,
  TrendingUp,
  Calendar,
  Briefcase,
  DollarSign,
  Clock,
} from "lucide-react";

// =====================================================
// WORKER DASHBOARD - przykład (jak na zdjęciu)
// =====================================================
export function WorkerDashboardStats() {
  const items: StatChipItem[] = [
    {
      id: "clients",
      label: "Active Clients",
      value: 24,
      tone: "cyan",
      icon: <Users size={16} />,
    },
    {
      id: "rating",
      label: "Rating",
      value: "4.9",
      tone: "amber",
      icon: <Star size={16} />,
    },
    {
      id: "views",
      label: "Profile Views",
      value: 1208,
      tone: "violet",
      icon: <Eye size={16} />,
    },
    {
      id: "messages",
      label: "Messages",
      value: 12,
      tone: "violet",
      icon: <Bell size={16} />,
    },
  ];

  return <StatChipsGrid items={items} columns={4} />;
}

// =====================================================
// EMPLOYER DASHBOARD - przykład
// =====================================================
export function EmployerDashboardStats() {
  const items: StatChipItem[] = [
    {
      id: "jobs",
      label: "Aktywne oferty",
      value: 8,
      tone: "emerald",
      icon: <Briefcase size={18} />,
    },
    {
      id: "applications",
      label: "Aplikacje",
      value: 47,
      tone: "violet",
      icon: <FileText size={18} />,
      hint: "12 nowych",
    },
    {
      id: "hired",
      label: "Zatrudnieni",
      value: 15,
      tone: "cyan",
      icon: <CheckCircle size={18} />,
    },
    {
      id: "spent",
      label: "Wydatki",
      value: "€12.450",
      tone: "amber",
      icon: <DollarSign size={18} />,
      hint: "ten miesiąc",
    },
  ];

  return <StatChipsGrid items={items} columns={4} />;
}

// =====================================================
// ACCOUNTANT DASHBOARD - przykład
// =====================================================
export function AccountantDashboardStats() {
  const items: StatChipItem[] = [
    {
      id: "clients",
      label: "Klienci",
      value: 34,
      tone: "cyan",
      icon: <Users size={18} />,
    },
    {
      id: "invoices",
      label: "Faktury ten miesiąc",
      value: 156,
      tone: "violet",
      icon: <FileText size={18} />,
    },
    {
      id: "revenue",
      label: "Przychód",
      value: "€45.670",
      tone: "emerald",
      icon: <TrendingUp size={18} />,
      hint: "+12% vs. poprzedni",
    },
    {
      id: "pending",
      label: "Oczekujące płatności",
      value: 8,
      tone: "rose",
      icon: <Clock size={18} />,
    },
  ];

  return <StatChipsGrid items={items} columns={4} />;
}

// =====================================================
// ADMIN DASHBOARD - przykład
// =====================================================
export function AdminDashboardStats() {
  const items: StatChipItem[] = [
    {
      id: "users",
      label: "Użytkownicy",
      value: 1247,
      tone: "cyan",
      icon: <Users size={18} />,
      hint: "+89 ten tydzień",
    },
    {
      id: "workers",
      label: "Zweryfikowani pracownicy",
      value: 423,
      tone: "emerald",
      icon: <CheckCircle size={18} />,
    },
    {
      id: "jobs",
      label: "Aktywne oferty",
      value: 156,
      tone: "violet",
      icon: <Briefcase size={18} />,
    },
    {
      id: "revenue",
      label: "Przychód",
      value: "€89.234",
      tone: "amber",
      icon: <DollarSign size={18} />,
      hint: "ten miesiąc",
    },
    {
      id: "pending",
      label: "Do weryfikacji",
      value: 12,
      tone: "rose",
      icon: <Clock size={18} />,
    },
    {
      id: "events",
      label: "Wydarzenia",
      value: 34,
      tone: "slate",
      icon: <Calendar size={18} />,
    },
  ];

  return <StatChipsGrid items={items} columns={6} />;
}

// =====================================================
// JAK UŻYĆ W DASHBOARDZIE:
// =====================================================
/*

1. Import komponentu:
   import { StatChipsGrid, StatChipItem } from "@/components/StatChips";

2. Zdefiniuj dane:
   const items: StatChipItem[] = [
     { id: "x", label: "Label", value: 123, tone: "cyan", icon: <Icon /> }
   ];

3. Użyj w JSX:
   <StatChipsGrid items={items} columns={4} />

OPCJE:
- columns: 2 | 3 | 4 | 5 | 6 (automatyczny responsive)
- tone: "cyan" | "violet" | "amber" | "emerald" | "rose" | "slate"
- hint: opcjonalny tekst pod liczbą
- onClick: opcjonalny handler kliknięcia
- value: number (z animacją) lub string (bez animacji)

*/
