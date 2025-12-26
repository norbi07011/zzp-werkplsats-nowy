import React, { useState } from "react";
import { Link, Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Logo } from "../components/Logo";
import { ThemeToggle } from "../src/components/common/ThemeToggle";
import { Menu, X } from "lucide-react";

export const PublicLayout: React.FC = () => {
  const { t } = useTranslation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 flex flex-col">
      {/* ===== PREMIUM HOLOGRAPHIC HEADER ===== */}
      <header className="sticky top-0 z-50">
        {/* Holographic gradient background */}
        <div className="absolute inset-0 bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-500" />

        {/* Animated holographic overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(110deg,transparent_25%,rgba(255,255,255,0.1)_50%,transparent_75%)] bg-[length:250%_100%] animate-shimmer" />

        {/* Neon glow effect */}
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-cyan-500/20 to-transparent blur-xl" />

        {/* Main header bar */}
        <div className="relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              {/* Logo */}
              <Link to="/" className="flex items-center gap-3 group">
                <Logo
                  variant="full"
                  size="sm"
                  className="brightness-0 invert"
                />
              </Link>

              {/* Desktop Navigation - Glassmorphism pills */}
              <nav className="hidden md:flex items-center">
                <div className="flex items-center gap-1 bg-white/10 backdrop-blur-md rounded-full px-1.5 py-1.5 border border-white/20">
                  <Link
                    to="/"
                    className="px-4 py-2.5 text-white/80 hover:text-white hover:bg-white/15 rounded-full font-medium transition-all duration-200 text-sm"
                  >
                    {t("nav.home", "Home")}
                  </Link>
                  <Link
                    to="/about"
                    className="px-4 py-2.5 text-white/80 hover:text-white hover:bg-white/15 rounded-full font-medium transition-all duration-200 text-sm"
                  >
                    {t("nav.about", "About")}
                  </Link>
                  <Link
                    to="/experience-certificate"
                    className="px-4 py-2.5 text-white/80 hover:text-white hover:bg-white/15 rounded-full font-medium transition-all duration-200 text-sm"
                  >
                    {t("nav.certificate", "Certificaat aanvragen")}
                  </Link>
                  <Link
                    to="/for-employers"
                    className="px-4 py-2.5 text-white/80 hover:text-white hover:bg-white/15 rounded-full font-medium transition-all duration-200 text-sm"
                  >
                    {t("nav.forEmployers", "For Employers")}
                  </Link>
                  <Link
                    to="/contact"
                    className="px-4 py-2.5 text-white/80 hover:text-white hover:bg-white/15 rounded-full font-medium transition-all duration-200 text-sm"
                  >
                    {t("nav.contact", "Contact")}
                  </Link>
                </div>
              </nav>

              {/* Right side: Theme Toggle + Login */}
              <div className="hidden md:flex items-center space-x-3">
                <ThemeToggle />
                <Link
                  to="/login"
                  className="px-4 py-2 text-white/80 hover:text-white hover:bg-white/15 rounded-full font-medium transition-all duration-200 text-sm"
                >
                  {t("nav.login", "Log In")}
                </Link>
                <Link
                  to="/register"
                  className="bg-white text-violet-600 px-5 py-2.5 rounded-full hover:bg-white/90 hover:shadow-lg hover:shadow-white/25 hover:scale-105 transition-all duration-300 font-semibold text-sm"
                >
                  {t("nav.register", "Register")}
                </Link>
              </div>

              {/* Mobile: Hamburger Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2.5 text-white/80 hover:text-white hover:bg-white/15 rounded-xl transition-all"
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>

            {/* Mobile Menu Dropdown */}
            {isMobileMenuOpen && (
              <div className="md:hidden py-4 border-t border-white/20 animate-in slide-in-from-top duration-200">
                <nav className="flex flex-col space-y-1">
                  <Link
                    to="/"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-white/80 hover:text-white font-medium py-3 px-4 rounded-xl hover:bg-white/15 transition-all"
                  >
                    {t("nav.home", "Home")}
                  </Link>
                  <Link
                    to="/about"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-white/80 hover:text-white font-medium py-3 px-4 rounded-xl hover:bg-white/15 transition-all"
                  >
                    {t("nav.about", "About")}
                  </Link>
                  <Link
                    to="/experience-certificate"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-white/80 hover:text-white font-medium py-3 px-4 rounded-xl hover:bg-white/15 transition-all"
                  >
                    {t("nav.certificate", "Certificaat aanvragen")}
                  </Link>
                  <Link
                    to="/for-employers"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-white/80 hover:text-white font-medium py-3 px-4 rounded-xl hover:bg-white/15 transition-all"
                  >
                    {t("nav.forEmployers", "For Employers")}
                  </Link>
                  <Link
                    to="/contact"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-white/80 hover:text-white font-medium py-3 px-4 rounded-xl hover:bg-white/15 transition-all"
                  >
                    {t("nav.contact", "Contact")}
                  </Link>

                  <div className="border-t border-white/20 pt-3 mt-2"></div>

                  <Link
                    to="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-white font-semibold py-3 px-4 rounded-xl hover:bg-white/15 transition-all text-center"
                  >
                    {t("nav.login", "Log In")} →
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="bg-white text-violet-600 font-semibold py-3 px-4 rounded-xl hover:bg-white/90 transition-all text-center"
                  >
                    {t("nav.register", "Register")}
                  </Link>
                </nav>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-white/80 backdrop-blur-sm border-t border-slate-200/50 text-slate-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Column 1: About */}
            <div>
              <h3 className="text-white font-bold text-lg mb-4">
                {t("footer.aboutTitle", "ZZP Werkplaats")}
              </h3>
              <p className="text-sm">
                {t(
                  "footer.aboutText",
                  "Gecertificeerde ZZP professionals voor bouwprojecten in Nederland."
                )}
              </p>
            </div>

            {/* Column 2: For Workers */}
            <div>
              <h3 className="text-white font-bold text-lg mb-4">
                {t("footer.forWorkersTitle", "Voor ZZP'ers")}
              </h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link
                    to="/experience-certificate"
                    className="hover:text-white"
                  >
                    {t("footer.getCertificate", "Certificaat aanvragen")}
                  </Link>
                </li>
                <li>
                  <Link to="/about" className="hover:text-white">
                    {t("footer.howItWorks", "Hoe het werkt")}
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3: For Employers */}
            <div>
              <h3 className="text-white font-bold text-lg mb-4">
                {t("footer.forEmployersTitle", "Voor opdrachtgevers")}
              </h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link to="/for-employers" className="hover:text-white">
                    {t("footer.pricing", "Prijzen")}
                  </Link>
                </li>
                <li>
                  <Link to="/register" className="hover:text-white">
                    {t("footer.register", "Registreren")}
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 4: Legal */}
            <div>
              <h3 className="text-white font-bold text-lg mb-4">
                {t("footer.legalTitle", "Juridisch")}
              </h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link to="/legal#privacy" className="hover:text-white">
                    {t("footer.privacy", "Privacybeleid")}
                  </Link>
                </li>
                <li>
                  <Link to="/legal#terms" className="hover:text-white">
                    {t("footer.terms", "Algemene voorwaarden")}
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="hover:text-white">
                    {t("footer.contact", "Contact")}
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
            <p>
              © {new Date().getFullYear()} ZZP Werkplaats.{" "}
              {t("footer.rights", "Alle rechten voorbehouden.")} | KvK: 12345678
              | BTW: NL123456789B01
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
