// =====================================================
// INVOICE MODULE - MAIN APP COMPONENT
// =====================================================
// Main wrapper with I18n provider, routing, and layout
// =====================================================

import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { I18nProvider } from "./i18n";
import { useAuth } from "../../../contexts/AuthContext";
import { useIsMobile } from "../../hooks/useIsMobile";
import {
  Menu,
  X,
  Home,
  FileText,
  Users,
  Package,
  CreditCard,
  BarChart3,
  Car,
  Clock,
  Calendar as CalendarIcon,
  FileEdit,
  TrendingUp,
  Settings as SettingsIcon,
} from "lucide-react";

// Pages
import Dashboard from "./pages/Dashboard";
import Invoices from "./pages/Invoices";
import InvoiceForm from "./pages/InvoiceForm";
import Clients from "./pages/Clients";
import Products from "./pages/Products";
import Expenses from "./pages/Expenses";
import BTWAangifte from "./pages/BTWAangifte";
import Kilometers from "./pages/Kilometers";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import { Timesheets } from "./pages/Timesheets";
import { Appointments } from "./pages/Appointments";
import { Documents } from "./pages/Documents";

type Page =
  | "dashboard"
  | "invoices"
  | "invoice-form"
  | "clients"
  | "products"
  | "expenses"
  | "btw"
  | "kilometers"
  | "reports"
  | "settings"
  | "timesheets"
  | "appointments"
  | "documents";

export default function InvoiceApp() {
  console.log("🔍 InvoiceApp RENDERED - route /faktury działa!");

  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [searchParams] = useSearchParams();
  const [currentPage, setCurrentPage] = useState<Page>("dashboard");
  const [editInvoiceId, setEditInvoiceId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Validate page parameter
  const isValidPage = (page: string): page is Page => {
    const validPages: Page[] = [
      "dashboard",
      "invoices",
      "invoice-form",
      "clients",
      "products",
      "expenses",
      "btw",
      "kilometers",
      "reports",
      "settings",
      "timesheets",
      "appointments",
      "documents",
    ];
    return validPages.includes(page as Page);
  };

  // Handle URL parameter for direct navigation (e.g., /faktury?page=appointments)
  // Run only once on mount to avoid re-render loops
  useEffect(() => {
    const pageParam = searchParams.get("page");
    if (pageParam && isValidPage(pageParam)) {
      setCurrentPage(pageParam as Page);
      // Clear the URL parameter after navigation using window.history to avoid re-render
      const newUrl = window.location.pathname;
      window.history.replaceState({}, "", newUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

  const handleNavigate = (page: string, id?: string) => {
    if (page === "invoice-form" && id) {
      setEditInvoiceId(id);
    } else {
      setEditInvoiceId(null);
    }
    setCurrentPage(page as Page);
  };

  // Menu items with Lucide icons
  const menuItems = [
    { id: "dashboard" as Page, label: "Dashboard", icon: Home },
    { id: "invoices" as Page, label: "Faktury", icon: FileText },
    { id: "clients" as Page, label: "Klienci", icon: Users },
    { id: "products" as Page, label: "Produkty", icon: Package },
    { id: "expenses" as Page, label: "Wydatki", icon: CreditCard },
    { id: "btw" as Page, label: "BTW Aangifte", icon: BarChart3 },
    { id: "kilometers" as Page, label: "Kilometrówka", icon: Car },
    { id: "timesheets" as Page, label: "Karty Pracy (Uren)", icon: Clock },
    {
      id: "appointments" as Page,
      label: "Kalendarz (Agenda)",
      icon: CalendarIcon,
    },
    { id: "documents" as Page, label: "Dokumenty", icon: FileEdit },
    { id: "reports" as Page, label: "Raporty", icon: TrendingUp },
    { id: "settings" as Page, label: "Ustawienia", icon: SettingsIcon },
  ];

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Wymagane logowanie
          </h2>
          <p className="text-gray-600">
            Zaloguj się, aby uzyskać dostęp do modułu faktur
          </p>
        </div>
      </div>
    );
  }

  return (
    <I18nProvider>
      <div className="flex h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 overflow-hidden">
        {/* Mobile: Backdrop */}
        {isMobile && isMobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Mobile: Hamburger Button */}
        {isMobile && (
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="fixed top-4 left-4 z-50 p-3 bg-slate-900 text-white rounded-xl shadow-lg md:hidden hover:bg-slate-800 transition-colors"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        )}

        {/* Sidebar - Desktop: always visible, Mobile: drawer */}
        <aside
          className={`${
            isMobile
              ? `fixed top-0 left-0 h-full w-[85%] max-w-sm transform transition-transform duration-300 z-50 ${
                  isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
                }`
              : isSidebarOpen
              ? "w-64"
              : "w-20"
          } bg-gradient-to-b from-slate-900 via-blue-900 to-indigo-900 text-white flex flex-col shadow-2xl`}
        >
          {/* Header */}
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center justify-between">
              {(isSidebarOpen || isMobile) && (
                <div>
                  <h1 className="text-xl font-bold">📄 Faktury</h1>
                  <p className="text-xs text-blue-300">Invoice System</p>
                </div>
              )}
              {!isMobile && (
                <button
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  {isSidebarOpen ? "◀" : "▶"}
                </button>
              )}
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    handleNavigate(item.id);
                    if (isMobile) setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all min-h-[44px] ${
                    currentPage === item.id
                      ? "bg-gradient-to-r from-blue-500 to-indigo-600 shadow-lg"
                      : "hover:bg-white/10"
                  }`}
                >
                  <Icon size={24} />
                  {(isSidebarOpen || isMobile) && (
                    <span className="font-medium text-base">{item.label}</span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-white/10">
            {(isSidebarOpen || isMobile) && (
              <div className="text-xs text-blue-300">
                <div className="font-bold truncate">{user.email}</div>
                <div>Invoice Module v1.0</div>
              </div>
            )}
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className={`${isMobile ? "pb-20" : ""}`}>
            {currentPage === "dashboard" && (
              <Dashboard onNavigate={handleNavigate} />
            )}
            {currentPage === "invoices" && (
              <Invoices onNavigate={handleNavigate} />
            )}
            {currentPage === "invoice-form" && (
              <InvoiceForm
                onNavigate={handleNavigate}
                editInvoiceId={editInvoiceId}
              />
            )}
            {currentPage === "clients" && (
              <Clients onNavigate={handleNavigate} />
            )}
            {currentPage === "products" && (
              <Products onNavigate={handleNavigate} />
            )}
            {currentPage === "expenses" && (
              <Expenses onNavigate={handleNavigate} />
            )}
            {currentPage === "btw" && (
              <BTWAangifte onNavigate={handleNavigate} />
            )}
            {currentPage === "kilometers" && (
              <Kilometers onNavigate={handleNavigate} />
            )}
            {currentPage === "timesheets" && <Timesheets />}
            {currentPage === "appointments" && <Appointments />}
            {currentPage === "documents" && <Documents />}
            {currentPage === "reports" && (
              <Reports onNavigate={handleNavigate} />
            )}
            {currentPage === "settings" && (
              <Settings onNavigate={handleNavigate} />
            )}
          </div>
        </main>

        {/* Mobile: Bottom Navigation */}
        {isMobile && (
          <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-30 safe-bottom">
            <div className="flex justify-around items-center h-20 px-2">
              {[
                { id: "dashboard", icon: Home, label: "Home" },
                { id: "invoices", icon: FileText, label: "Faktury" },
                { id: "clients", icon: Users, label: "Klienci" },
                { id: "expenses", icon: CreditCard, label: "Wydatki" },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavigate(item.id as Page)}
                    className={`flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-all min-h-[44px] min-w-[44px] ${
                      currentPage === item.id
                        ? "text-blue-600 bg-blue-50"
                        : "text-slate-600"
                    }`}
                  >
                    <Icon size={24} />
                    <span className="text-xs font-medium">{item.label}</span>
                  </button>
                );
              })}
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-all text-slate-600 min-h-[44px] min-w-[44px]"
              >
                <Menu size={24} />
                <span className="text-xs font-medium">Więcej</span>
              </button>
            </div>
          </nav>
        )}
      </div>
    </I18nProvider>
  );
}
