import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Logo } from "./Logo";

export const Navigation: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { path: "/", label: t("nav.home", "Home") },
    { path: "/about", label: t("nav.about", "Over Ons") },
    {
      path: "/experience",
      label: t("nav.experience", "Certificaat aanvragen"),
    },
    { path: "/employers", label: t("nav.employers", "Voor Werkgevers") },
    { path: "/contact", label: t("nav.contact", "Contact") },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-primary-dark/95 backdrop-blur-md border-b border-accent-cyber/20 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <Logo size="sm" showText={false} />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`text-sm font-medium transition-colors ${
                  isActive(item.path)
                    ? "text-accent-cyber"
                    : "text-white hover:text-accent-cyber"
                }`}
              >
                {item.label}
              </Link>
            ))}

            {/* Auth Buttons */}
            <div className="flex items-center space-x-4 ml-8">
              <Link
                to="/login"
                className="text-white hover:text-accent-cyber text-sm font-medium"
              >
                {t("nav.login", "Inloggen")}
              </Link>
              <Link
                to="/register/worker"
                className="bg-gradient-success text-white px-4 py-2 rounded-lg text-sm font-medium hover:shadow-glow-success transition-all"
              >
                {t("nav.register", "Registreren")}
              </Link>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-white hover:text-accent-cyber focus:outline-none"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {isMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-primary-navy/50 backdrop-blur-md rounded-lg mt-2">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`block px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive(item.path)
                      ? "text-accent-cyber bg-accent-cyber/10"
                      : "text-white hover:text-accent-cyber hover:bg-white/5"
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}

              <div className="border-t border-accent-cyber/20 pt-3 mt-3">
                <Link
                  to="/login"
                  className="block px-3 py-2 text-sm font-medium text-white hover:text-accent-cyber rounded-md"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {t("nav.login", "Inloggen")}
                </Link>
                <Link
                  to="/register/worker"
                  className="block px-3 py-2 mt-1 bg-gradient-success text-white text-sm font-medium rounded-md hover:shadow-glow-success transition-all"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {t("nav.register", "Registreren")}
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
