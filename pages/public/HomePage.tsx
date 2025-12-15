import React, { Suspense, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Logo } from "../../src/components/common/Logo";
import { getUserStats, type UserStats } from "../../src/services/statsService";

import Pattern from "../../components/Logo3D/Pattern";

export const HomePage: React.FC = () => {
  const { t } = useTranslation();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log("🏠 HomePage: Fetching user stats...");
    setIsLoading(true);
    getUserStats()
      .then((data) => {
        console.log("🏠 HomePage: Stats received:", data);
        setStats(data);
      })
      .catch((error) => {
        console.error("🏠 HomePage: Error loading stats:", error);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  return (
    <div className="bg-primary-dark">
      {/* Hero Section - Aurora Animated Background FULLSCREEN */}
      <section className="relative text-white overflow-hidden min-h-screen">
        {/* Aurora Pattern Background */}
        <Pattern />

        {/* Zawartość NA FILMIE (z-index wyższy) - CAŁKOWICIE LEWA STRONA */}
        <div className="relative z-20 min-h-screen flex items-center">
          {/* USUNIĘTO max-w-7xl mx-auto - teraz CAŁKOWICIE z lewej */}
          <div className="w-full pl-8 lg:pl-16 py-16 lg:py-24">
            {/* Cała zawartość CAŁKOWICIE z lewej strony */}
            <div className="max-w-2xl">
              {/* Main Heading - Premium Style - CAŁKOWICIE LEFT */}
              <div className="space-y-8 mb-16">
                <h1
                  className="text-3xl sm:text-5xl lg:text-7xl font-black leading-tight text-left"
                  style={{
                    textShadow: "2px 2px 4px rgba(0,0,0,0.3)",
                  }}
                >
                  <span className="block text-white drop-shadow-lg">
                    ZZP Werkplaats
                  </span>
                  <span
                    className="block mt-2 text-2xl sm:text-4xl lg:text-6xl bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-600 bg-clip-text text-transparent font-black"
                    style={{
                      textShadow: "none",
                      filter: "drop-shadow(2px 2px 4px rgba(0,0,0,0.4))",
                    }}
                  >
                    voor professionals
                  </span>
                </h1>

                <p
                  className="text-lg sm:text-2xl lg:text-3xl text-white font-bold leading-relaxed text-left drop-shadow-lg"
                  style={{ textShadow: "2px 2px 4px rgba(0,0,0,0.3)" }}
                >
                  Gecertificeerde vakmensen voor de bouw.
                  <span className="block mt-3 text-white font-black text-xl sm:text-3xl lg:text-4xl">
                    Elke professional is getest en geverifieerd.
                  </span>
                </p>
              </div>

              {/* CTA Buttons - CAŁKOWICIE LEFT */}
              <div className="flex flex-col sm:flex-row gap-6 mb-20">
                <Link
                  to="/register/worker"
                  className="group relative bg-gradient-to-r from-white to-gray-100 text-black px-12 py-6 rounded-2xl font-bold text-xl transition-all hover:scale-105 hover:shadow-2xl shadow-2xl w-fit"
                >
                  <span className="flex items-center justify-center gap-3">
                    <span className="text-3xl">🔨</span>
                    <span>Start als ZZP'er</span>
                  </span>
                </Link>

                <Link
                  to="/register/employer"
                  className="group relative bg-white/15 backdrop-blur-xl text-white px-12 py-6 rounded-2xl font-bold text-xl border-2 border-white/50 hover:border-cyan-300 hover:bg-white/25 transition-all shadow-2xl w-fit"
                >
                  <span className="flex items-center justify-center gap-3">
                    <span className="text-3xl">🏢</span>
                    <span>Odkryj Talent</span>
                  </span>
                </Link>
              </div>

              {/* Stats Cards - CAŁKOWICIE LEFT */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl">
                <div className="bg-gradient-to-br from-cyan-500/30 to-cyan-600/20 backdrop-blur-xl border-2 border-cyan-400/60 rounded-2xl p-6 shadow-2xl hover:scale-105 transition-transform">
                  <div
                    className="text-3xl sm:text-5xl lg:text-6xl font-black bg-gradient-to-r from-cyan-200 to-cyan-300 bg-clip-text text-transparent mb-2"
                    style={{ textShadow: "0 0 30px rgba(34,211,238,0.5)" }}
                  >
                    {isLoading
                      ? "..."
                      : stats
                      ? stats.totalWorkers + stats.totalCleaningCompanies
                      : "0"}
                  </div>
                  <div className="text-sm font-bold text-white uppercase tracking-wide">
                    Actieve ZZP'ers
                  </div>
                </div>

                <div className="bg-gradient-to-br from-cyan-500/30 to-cyan-600/20 backdrop-blur-xl border-2 border-cyan-400/60 rounded-2xl p-6 shadow-2xl hover:scale-105 transition-transform">
                  <div
                    className="text-3xl sm:text-5xl lg:text-6xl font-black bg-gradient-to-r from-cyan-200 to-cyan-300 bg-clip-text text-transparent mb-2"
                    style={{ textShadow: "0 0 30px rgba(34,211,238,0.5)" }}
                  >
                    {isLoading ? "..." : stats ? stats.totalEmployers : "0"}
                  </div>
                  <div className="text-sm font-bold text-white uppercase tracking-wide">
                    Actieve Pracodawcy
                  </div>
                </div>

                <div className="bg-gradient-to-br from-cyan-500/30 to-cyan-600/20 backdrop-blur-xl border-2 border-cyan-400/60 rounded-2xl p-6 shadow-2xl hover:scale-105 transition-transform">
                  <div
                    className="text-3xl sm:text-5xl lg:text-6xl font-black bg-gradient-to-r from-cyan-200 to-cyan-300 bg-clip-text text-transparent mb-2"
                    style={{ textShadow: "0 0 30px rgba(34,211,238,0.5)" }}
                  >
                    {isLoading ? "..." : stats ? stats.totalAccountants : "0"}
                  </div>
                  <div className="text-sm font-bold text-white uppercase tracking-wide">
                    Actieve Księgowi
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works - 4 Steps */}
      <section className="py-24 bg-primary-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-5xl font-bold text-center mb-4 text-white font-heading">
            {t("home.howItWorks.title", "Hoe het werkt")}
          </h2>
          <p className="text-xl text-neutral-400 text-center mb-20">
            {t(
              "home.howItWorks.subtitle",
              "Van registratie tot eerste opdracht in 4 stappen"
            )}
          </p>

          {/* Real Photos - How It Works Process */}
          <div className="mb-16 grid md:grid-cols-2 gap-6">
            <div className="rounded-2xl overflow-hidden border-4 border-accent-techGreen/30 shadow-2xl transform hover:scale-105 transition-transform">
              <img
                src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&h=400&fit=crop"
                alt="Team collaboration and work process"
                className="w-full h-64 object-cover"
              />
              <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-4 text-center">
                <p className="text-white font-bold">
                  🚀 Start vandaag nog met jouw ZZP carrière!
                </p>
              </div>
            </div>

            <div className="rounded-2xl overflow-hidden border-4 border-accent-cyber/30 shadow-2xl transform hover:scale-105 transition-transform">
              <img
                src="https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=600&h=400&fit=crop"
                alt="Professional worker using technology"
                className="w-full h-64 object-cover"
              />
              <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-4 text-center">
                <p className="text-white font-bold">
                  💼 Direct contact met opdrachtgevers!
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Step 1 */}
            <div className="group text-center bg-gradient-glass backdrop-blur-md p-8 rounded-2xl border border-accent-techGreen/20 hover:border-accent-techGreen hover:shadow-glow-success transition-all">
              <div className="w-20 h-20 bg-gradient-success text-white rounded-2xl flex items-center justify-center text-3xl font-bold mx-auto mb-6 shadow-glow-success group-hover:scale-110 transition-transform">
                1
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">
                {t("home.howItWorks.step1.title", "Maak Profiel")}
              </h3>
              <p className="text-neutral-400">
                {t(
                  "home.howItWorks.step1.description",
                  "Registreer gratis en vul je profiel in met specialisatie, ervaring en uurloon"
                )}
              </p>
            </div>

            {/* Step 2 */}
            <div className="group text-center bg-gradient-glass backdrop-blur-md p-8 rounded-2xl border border-accent-techGreen/20 hover:border-accent-techGreen hover:shadow-glow-success transition-all">
              <div className="w-20 h-20 bg-gradient-success text-white rounded-2xl flex items-center justify-center text-3xl font-bold mx-auto mb-6 shadow-glow-success group-hover:scale-110 transition-transform">
                2
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">
                {t("home.howItWorks.step2.title", "Kies Premium")}
              </h3>
              <p className="text-neutral-400">
                {t(
                  "home.howItWorks.step2.description",
                  "Upgrade naar Premium (€13/maand) om zichtbaar te zijn voor opdrachtgevers"
                )}
              </p>
            </div>

            {/* Step 3 */}
            <div className="group text-center bg-gradient-glass backdrop-blur-md p-8 rounded-2xl border border-accent-cyber/20 hover:border-accent-cyber hover:shadow-glow-cyber transition-all">
              <div className="w-20 h-20 bg-gradient-cyber text-white rounded-2xl flex items-center justify-center text-3xl font-bold mx-auto mb-6 shadow-glow-cyber group-hover:scale-110 transition-transform">
                3
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">
                {t("home.howItWorks.step3.title", "Word Gevonden")}
              </h3>
              <p className="text-neutral-400">
                {t(
                  "home.howItWorks.step3.description",
                  "Opdrachtgevers zoeken en vinden je profiel via filters (locatie, skills, etc.)"
                )}
              </p>
            </div>

            {/* Step 4 */}
            <div className="group text-center bg-gradient-glass backdrop-blur-md p-8 rounded-2xl border border-accent-cyber/20 hover:border-accent-cyber hover:shadow-glow-cyber transition-all">
              <div className="w-20 h-20 bg-gradient-cyber text-white rounded-2xl flex items-center justify-center text-3xl font-bold mx-auto mb-6 shadow-glow-cyber group-hover:scale-110 transition-transform">
                4
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">
                {t("home.howItWorks.step4.title", "Ontvang Opdrachten")}
              </h3>
              <p className="text-neutral-400">
                {t(
                  "home.howItWorks.step4.description",
                  "Opdrachtgevers nemen direct contact op via platform - geen commissie!"
                )}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits for Workers */}
      <section className="py-24 bg-primary-navy/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-5xl font-bold mb-8 text-white font-heading">
                {t("home.benefits.workers.title", "Voor ZZP'ers")}
              </h2>

              {/* Real Photo - ZZP Benefits */}
              <div className="mb-8 rounded-2xl overflow-hidden border-4 border-accent-techGreen/30 shadow-2xl transform hover:scale-105 transition-transform">
                <img
                  src="https://images.unsplash.com/photo-1565688534245-05d6b5be184a?w=700&h=500&fit=crop"
                  alt="Independent worker managing their own business"
                  className="w-full h-80 object-cover"
                />
                <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-4 text-center">
                  <p className="text-white font-bold">
                    ✨ Jouw vrijheid, jouw succes!
                  </p>
                </div>
              </div>

              <ul className="space-y-6">
                <li className="flex items-start group">
                  <div className="w-10 h-10 bg-gradient-success rounded-xl flex items-center justify-center mr-4 flex-shrink-0 shadow-glow-success group-hover:scale-110 transition-transform">
                    <svg
                      className="w-6 h-6 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div>
                    <strong className="block text-xl text-white mb-1">
                      {t(
                        "home.benefits.workers.benefit1.title",
                        "Officieel certificaat"
                      )}
                    </strong>
                    <span className="text-neutral-400">
                      {t(
                        "home.benefits.workers.benefit1.description",
                        "Bewijs uw vaardigheden met een erkend certificaat"
                      )}
                    </span>
                  </div>
                </li>
                <li className="flex items-start group">
                  <div className="w-10 h-10 bg-gradient-success rounded-xl flex items-center justify-center mr-4 flex-shrink-0 shadow-glow-success group-hover:scale-110 transition-transform">
                    <svg
                      className="w-6 h-6 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div>
                    <strong className="block text-xl text-white mb-1">
                      {t(
                        "home.benefits.workers.benefit2.title",
                        "Meer opdrachten"
                      )}
                    </strong>
                    <span className="text-neutral-400">
                      {t(
                        "home.benefits.workers.benefit2.description",
                        "Toegang tot opdrachtgevers die kwaliteit zoeken"
                      )}
                    </span>
                  </div>
                </li>
                <li className="flex items-start group">
                  <div className="w-10 h-10 bg-gradient-success rounded-xl flex items-center justify-center mr-4 flex-shrink-0 shadow-glow-success group-hover:scale-110 transition-transform">
                    <svg
                      className="w-6 h-6 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div>
                    <strong className="block text-xl text-white mb-1">
                      {t(
                        "home.benefits.workers.benefit3.title",
                        "Geen commissie"
                      )}
                    </strong>
                    <span className="text-neutral-400">
                      {t(
                        "home.benefits.workers.benefit3.description",
                        "Alleen vaste maandprijs - wij nemen 0% commissie op jouw opdrachten"
                      )}
                    </span>
                  </div>
                </li>
              </ul>
              <Link
                to="/register/worker"
                className="inline-block mt-10 bg-gradient-success text-white px-10 py-4 rounded-xl font-bold text-lg hover:shadow-glow-success hover:scale-105 transition-all"
              >
                {t("home.benefits.workers.cta", "Start nu")}
              </Link>
            </div>
            <div className="relative bg-gradient-glass backdrop-blur-md rounded-3xl p-12 border border-accent-cyber/20 shadow-3d group hover:border-accent-cyber transition-all">
              <div className="absolute inset-0 bg-accent-cyber/5 rounded-3xl blur-2xl group-hover:bg-accent-cyber/10 transition-colors"></div>
              <div className="relative text-center text-neutral-300">
                <svg
                  className="w-40 h-40 mx-auto mb-6 text-accent-cyber"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
                <p>
                  {t(
                    "common.imagePlaceholder",
                    "[Illustratie van certificaat]"
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Premium Certificate Section - FAZA 5 */}
      {/* Platform Features - Team & On-Demand */}
      <section className="py-24 bg-gradient-to-br from-accent-techGreen/10 via-primary-dark to-accent-cyber/10 relative overflow-hidden">
        {/* Background orbs */}
        <div className="absolute top-20 left-10 w-96 h-96 bg-accent-techGreen/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent-cyber/10 rounded-full blur-3xl"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Header */}
          <div className="text-center mb-16">
            <div className="inline-block bg-gradient-to-r from-accent-techGreen to-green-600 text-white px-6 py-2 rounded-full font-bold text-sm mb-6 shadow-lg">
              � NIEUWE FUNCTIES
            </div>
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-6 font-heading">
              Team & On-Demand ZZP'ers
            </h2>
            <p className="text-xl md:text-2xl text-neutral-300 max-w-3xl mx-auto">
              Vind niet alleen solo professionals, maar hele teams én workers
              beschikbaar voor spoedklussen
            </p>
          </div>

          {/* 2 Main Features */}
          <div className="grid md:grid-cols-2 gap-8 mb-16">
            {/* Team Feature */}
            <div className="group bg-gradient-glass backdrop-blur-md rounded-2xl p-10 border border-accent-techGreen/30 hover:border-accent-techGreen transition-all hover:shadow-glow-success">
              <div className="w-20 h-20 bg-gradient-to-br from-accent-techGreen to-green-600 rounded-2xl flex items-center justify-center text-4xl mb-6 shadow-lg group-hover:scale-110 transition-transform">
                �
              </div>
              <h3 className="text-3xl font-bold text-white mb-4">
                Team Configuratie
              </h3>
              <p className="text-neutral-300 mb-6 text-lg">
                ZZP'ers kunnen zich nu registreren als{" "}
                <strong>team leader</strong>, <strong>duo partner</strong>, of{" "}
                <strong>helper</strong>. Perfect voor grote projecten die meer
                mankracht vereisen!
              </p>
              <ul className="space-y-3 text-neutral-400">
                <li className="flex items-start gap-3">
                  <span className="text-accent-techGreen text-xl">✓</span>
                  <span>
                    <strong className="text-white">Teams 2-10 personen:</strong>{" "}
                    Krijg direct een heel team voor je project
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-accent-techGreen text-xl">✓</span>
                  <span>
                    <strong className="text-white">
                      Gecombineerd uurloon:
                    </strong>{" "}
                    Transparante pricing voor hele team
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-accent-techGreen text-xl">✓</span>
                  <span>
                    <strong className="text-white">Team beschrijving:</strong>{" "}
                    Zie exact wie in het team zit en hun specialisaties
                  </span>
                </li>
              </ul>
            </div>

            {/* On-Demand Feature */}
            <div className="group bg-gradient-glass backdrop-blur-md rounded-2xl p-10 border border-yellow-500/30 hover:border-yellow-500 transition-all hover:shadow-glow-premium">
              <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-2xl flex items-center justify-center text-4xl mb-6 shadow-lg group-hover:scale-110 transition-transform">
                ⚡
              </div>
              <h3 className="text-3xl font-bold text-white mb-4">
                "Skoczek" On-Demand
              </h3>
              <p className="text-neutral-300 mb-6 text-lg">
                Workers kunnen aangeven dat ze{" "}
                <strong>beschikbaar zijn voor spoedklussen</strong>. Ideaal voor
                noodgevallen, ziektevervangingen, of acute projecten!
              </p>
              <ul className="space-y-3 text-neutral-400">
                <li className="flex items-start gap-3">
                  <span className="text-yellow-400 text-xl">✓</span>
                  <span>
                    <strong className="text-white">
                      Real-time beschikbaarheid:
                    </strong>{" "}
                    ZZP'er zet toggle ON/OFF wanneer beschikbaar
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-yellow-400 text-xl">✓</span>
                  <span>
                    <strong className="text-white">
                      ⚡ Badge in zoekresultaten:
                    </strong>{" "}
                    Direct zichtbaar wie vandaag kan starten
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-yellow-400 text-xl">✓</span>
                  <span>
                    <strong className="text-white">Premium filter:</strong>{" "}
                    Opdrachtgevers kunnen filteren op "Beschikbaar Nu"
                  </span>
                </li>
              </ul>
            </div>
          </div>

          {/* Pricing Comparison */}
          <div className="bg-gradient-to-r from-primary-navy/50 to-primary-navy/30 backdrop-blur-md rounded-3xl p-10 md:p-12 border border-accent-cyber/20">
            <h3 className="text-3xl md:text-4xl font-bold text-white mb-10 text-center">
              Simpele, Transparante Prijzen
            </h3>

            {/* Real Photo - Pricing Transparency */}
            <div className="mb-10 rounded-2xl overflow-hidden border-4 border-green-500/30 shadow-2xl transform hover:scale-105 transition-transform">
              <img
                src="https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&h=400&fit=crop"
                alt="Transparent pricing and business planning"
                className="w-full h-64 object-cover"
              />
              <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-4 text-center">
                <p className="text-white font-bold">
                  💰 Geen verborgen kosten - Alles transparant!
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Workers Basic */}
              <div className="bg-gradient-glass backdrop-blur-md rounded-2xl p-8 border border-neutral-600/30">
                <div className="text-sm text-accent-techGreen font-bold mb-2">
                  VOOR ZZP'ERS
                </div>
                <h4 className="text-2xl font-bold text-white mb-4">Basic</h4>
                <p className="text-5xl font-bold text-white mb-2">€0</p>
                <p className="text-neutral-400 mb-6">/maand</p>
                <ul className="space-y-3 mb-8 text-sm">
                  <li className="flex items-center gap-2 text-neutral-300">
                    <span className="text-neutral-500">✓</span>
                    Profiel aanmaken
                  </li>
                  <li className="flex items-center gap-2 text-neutral-300">
                    <span className="text-red-400">✗</span>
                    <span className="line-through">
                      Zichtbaar voor opdrachtgevers
                    </span>
                  </li>
                </ul>
                <p className="text-xs text-neutral-500 text-center">
                  Perfect om platform te leren kennen
                </p>
              </div>

              {/* Workers Premium */}
              <div className="bg-gradient-to-br from-accent-techGreen/20 to-green-600/20 rounded-2xl p-8 border-2 border-accent-techGreen relative shadow-glow-success">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-accent-techGreen to-green-600 text-white px-6 py-1 rounded-full text-sm font-bold shadow-lg">
                  🔨 Voor ZZP'ers
                </div>
                <div className="text-sm text-accent-techGreen font-bold mb-2">
                  MEEST GEKOZEN
                </div>
                <h4 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                  Premium
                  <span className="text-2xl">🏆</span>
                </h4>
                <p className="text-5xl font-bold text-white mb-2">€13</p>
                <p className="text-neutral-300 mb-6">/maand</p>
                <ul className="space-y-3 mb-8 text-sm">
                  <li className="flex items-center gap-2 text-white">
                    <span className="text-accent-techGreen">✓</span>
                    <strong>Profiel zichtbaar voor alle opdrachtgevers</strong>
                  </li>
                  <li className="flex items-center gap-2 text-white">
                    <span className="text-accent-techGreen">✓</span>
                    Premium badge 🏆
                  </li>
                  <li className="flex items-center gap-2 text-white">
                    <span className="text-accent-techGreen">✓</span>
                    Team configuratie (duo/trio)
                  </li>
                  <li className="flex items-center gap-2 text-white">
                    <span className="text-accent-techGreen">✓</span>
                    "Skoczek" beschikbaarheid toggle
                  </li>
                  <li className="flex items-center gap-2 text-white">
                    <span className="text-accent-techGreen">✓</span>
                    Onbeperkt opdrachten ontvangen
                  </li>
                </ul>
                <Link
                  to="/register/worker"
                  className="block text-center bg-gradient-to-r from-accent-techGreen to-green-600 text-white px-6 py-3 rounded-xl font-bold hover:scale-105 transition-transform shadow-lg"
                >
                  Start als ZZP'er
                </Link>
              </div>

              {/* Employers Premium */}
              <div className="bg-gradient-to-br from-accent-cyber/20 to-blue-600/20 rounded-2xl p-8 border-2 border-accent-cyber relative shadow-glow-cyber">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-accent-cyber to-blue-600 text-white px-6 py-1 rounded-full text-sm font-bold shadow-lg">
                  🏢 Voor Bedrijven
                </div>
                <div className="text-sm text-accent-cyber font-bold mb-2">
                  VOOR OPDRACHTGEVERS
                </div>
                <h4 className="text-2xl font-bold text-white mb-4">
                  Basic / Premium
                </h4>
                <p className="text-4xl font-bold text-white mb-2">
                  €13 <span className="text-2xl text-neutral-400">/ €25</span>
                </p>
                <p className="text-neutral-300 mb-6">/maand</p>
                <ul className="space-y-3 mb-8 text-sm">
                  <li className="flex items-center gap-2 text-white">
                    <span className="text-accent-cyber">✓</span>
                    Toegang tot alle ZZP'er profielen
                  </li>
                  <li className="flex items-center gap-2 text-white">
                    <span className="text-accent-cyber">✓</span>
                    Direct contact met professionals
                  </li>
                  <li className="flex items-center gap-2 text-white">
                    <span className="text-accent-cyber">✓</span>
                    <span className="text-accent-cyber font-medium">
                      (Premium)
                    </span>{" "}
                    Filter op teams & beschikbaarheid
                  </li>
                  <li className="flex items-center gap-2 text-white">
                    <span className="text-accent-cyber">✓</span>
                    <span className="text-accent-cyber font-medium">
                      (Premium)
                    </span>{" "}
                    Hogere prioriteit bij ZZP'ers
                  </li>
                  <li className="flex items-center gap-2 text-white">
                    <span className="text-accent-cyber">✓</span>
                    Geen commissie op opdrachten!
                  </li>
                </ul>
                <Link
                  to="/register/employer"
                  className="block text-center bg-gradient-to-r from-accent-cyber to-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:scale-105 transition-transform shadow-lg"
                >
                  Registreer bedrijf
                </Link>
              </div>
            </div>

            {/* Extra Info */}
            <div className="mt-10 p-6 bg-accent-techGreen/10 rounded-xl border border-accent-techGreen/30">
              <p className="text-center text-white text-lg">
                <strong className="text-accent-techGreen">
                  💡 Uniek voordeel:
                </strong>{" "}
                Wij nemen <strong className="underline">geen commissie</strong>{" "}
                op opdrachten! Andere platforms vragen 10-25%, wij alleen een
                vaste maandprijs voor platformtoegang.
                <span className="text-neutral-300">
                  {" "}
                  Direct contact, eerlijke prijzen. 🤝
                </span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits for Employers */}
      <section className="py-24 bg-primary-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Real Photo - Employers Benefits */}
            <div className="rounded-2xl overflow-hidden border-4 border-accent-cyber/30 shadow-2xl transform hover:scale-105 transition-transform">
              <img
                src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=700&h=500&fit=crop"
                alt="Employer finding the perfect team member"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h2 className="text-5xl font-bold mb-8 text-white font-heading">
                {t("home.benefits.employers.title", "Voor opdrachtgevers")}
              </h2>

              {/* Additional Photo - Business Team */}
              <div className="mb-8 rounded-xl overflow-hidden border-2 border-blue-500/30 shadow-xl">
                <img
                  src="https://images.unsplash.com/photo-1553484771-371a605b060b?w=600&h=300&fit=crop"
                  alt="Business team collaboration"
                  className="w-full h-48 object-cover"
                />
              </div>

              <ul className="space-y-6">
                <li className="flex items-start group">
                  <div className="w-10 h-10 bg-gradient-cyber rounded-xl flex items-center justify-center mr-4 flex-shrink-0 shadow-glow-cyber group-hover:scale-110 transition-transform">
                    <svg
                      className="w-6 h-6 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div>
                    <strong className="block text-xl text-white mb-1">
                      {t(
                        "home.benefits.employers.benefit1.title",
                        "Geverifieerde professionals"
                      )}
                    </strong>
                    <span className="text-neutral-400">
                      {t(
                        "home.benefits.employers.benefit1.description",
                        "Alle ZZP'ers zijn getest op vaardigheden en betrouwbaarheid"
                      )}
                    </span>
                  </div>
                </li>
                <li className="flex items-start group">
                  <div className="w-10 h-10 bg-gradient-cyber rounded-xl flex items-center justify-center mr-4 flex-shrink-0 shadow-glow-cyber group-hover:scale-110 transition-transform">
                    <svg
                      className="w-6 h-6 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div>
                    <strong className="block text-xl text-white mb-1">
                      {t(
                        "home.benefits.employers.benefit2.title",
                        "Snel zoeken en vinden"
                      )}
                    </strong>
                    <span className="text-neutral-400">
                      {t(
                        "home.benefits.employers.benefit2.description",
                        "Filter op vakgebied, ervaring en beschikbaarheid"
                      )}
                    </span>
                  </div>
                </li>
                <li className="flex items-start group">
                  <div className="w-10 h-10 bg-gradient-cyber rounded-xl flex items-center justify-center mr-4 flex-shrink-0 shadow-glow-cyber group-hover:scale-110 transition-transform">
                    <svg
                      className="w-6 h-6 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div>
                    <strong className="block text-xl text-white mb-1">
                      {t(
                        "home.benefits.employers.benefit3.title",
                        "Flexibel abonnement"
                      )}
                    </strong>
                    <span className="text-neutral-400">
                      {t(
                        "home.benefits.employers.benefit3.description",
                        "Flexible subscription plans starting at €13/month"
                      )}
                    </span>
                  </div>
                </li>
              </ul>
              <Link
                to="/for-employers"
                className="inline-block mt-10 bg-gradient-cyber text-white px-10 py-4 rounded-xl font-bold text-lg hover:shadow-glow-cyber hover:scale-105 transition-all"
              >
                {t("home.benefits.employers.cta", "Bekijk prijzen")}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section - Platform Info */}
      <section className="py-24 bg-primary-navy/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-white mb-4 font-heading">
              Veelgestelde vragen
            </h2>
            <p className="text-xl text-neutral-400">
              Alles wat je moet weten over ZZP Werkplaats
            </p>
          </div>

          <div className="space-y-4">
            {/* FAQ 1 - Voor ZZP'ers */}
            <details className="group bg-gradient-glass backdrop-blur-md rounded-xl border border-accent-techGreen/20 hover:border-accent-techGreen transition-all">
              <summary className="cursor-pointer p-6 font-bold text-white text-lg flex items-center justify-between">
                <span>🔨 Hoe werkt het voor ZZP'ers?</span>
                <span className="text-accent-techGreen group-open:rotate-180 transition-transform">
                  ▼
                </span>
              </summary>
              <div className="px-6 pb-6 text-neutral-300 leading-relaxed space-y-3">
                <p>
                  <strong className="text-white">
                    Simpel 3-stappen proces:
                  </strong>
                </p>
                <ol className="list-decimal list-inside space-y-2 ml-2">
                  <li>
                    <strong className="text-white">Gratis registratie:</strong>{" "}
                    Maak je profiel aan met specialisatie, ervaring en uurloon
                  </li>
                  <li>
                    <strong className="text-white">
                      Kies Premium (€13/maand):
                    </strong>{" "}
                    Alleen premium profielen zijn zichtbaar voor opdrachtgevers
                  </li>
                  <li>
                    <strong className="text-white">Ontvang opdrachten:</strong>{" "}
                    Opdrachtgevers vinden jouw profiel en nemen direct contact
                    op
                  </li>
                </ol>
                <p className="mt-4">
                  <strong className="text-accent-techGreen">Nieuw!</strong> Je
                  kunt nu ook werken in teams (duo/trio) of jezelf markeren als
                  "Skoczek" voor spoedopdrachten!
                </p>
              </div>
            </details>

            {/* FAQ 2 - Voor Opdrachtgevers */}
            <details className="group bg-gradient-glass backdrop-blur-md rounded-xl border border-accent-cyber/20 hover:border-accent-cyber transition-all">
              <summary className="cursor-pointer p-6 font-bold text-white text-lg flex items-center justify-between">
                <span>🏢 Hoe werkt het voor opdrachtgevers?</span>
                <span className="text-accent-cyber group-open:rotate-180 transition-transform">
                  ▼
                </span>
              </summary>
              <div className="px-6 pb-6 text-neutral-300 leading-relaxed space-y-3">
                <p>
                  <strong className="text-white">
                    Vind snel de juiste professional:
                  </strong>
                </p>
                <ol className="list-decimal list-inside space-y-2 ml-2">
                  <li>
                    <strong className="text-white">
                      Registreer je bedrijf:
                    </strong>{" "}
                    Kies Basic (€13/maand) of Premium (€25/maand)
                  </li>
                  <li>
                    <strong className="text-white">Zoek professionals:</strong>{" "}
                    Filter op locatie, specialisatie, ervaring, teamgrootte
                  </li>
                  <li>
                    <strong className="text-white">Direct contact:</strong>{" "}
                    Bekijk profielen met uurlonen en neem contact op via
                    platform
                  </li>
                </ol>
                <p className="mt-4">
                  <strong className="text-accent-cyber">
                    Premium voordeel:
                  </strong>{" "}
                  Toegang tot extra filters en prioriteit in zichtbaarheid voor
                  top ZZP'ers!
                </p>
              </div>
            </details>

            {/* FAQ 3 - Prijzen Workers */}
            <details className="group bg-gradient-glass backdrop-blur-md rounded-xl border border-accent-techGreen/20 hover:border-accent-techGreen transition-all">
              <summary className="cursor-pointer p-6 font-bold text-white text-lg flex items-center justify-between">
                <span>� Wat kost het voor ZZP'ers?</span>
                <span className="text-accent-techGreen group-open:rotate-180 transition-transform">
                  ▼
                </span>
              </summary>
              <div className="px-6 pb-6 text-neutral-300 leading-relaxed space-y-3">
                <div className="bg-primary-navy/30 rounded-lg p-4 border border-accent-techGreen/20">
                  <p className="text-white font-bold mb-2">
                    ✓ Basic: €0/maand (Profiel niet zichtbaar)
                  </p>
                  <p className="text-sm">
                    Perfect om het platform te leren kennen
                  </p>
                </div>
                <div className="bg-gradient-to-r from-accent-techGreen/10 to-accent-techGreen/5 rounded-lg p-4 border border-accent-techGreen/40">
                  <p className="text-white font-bold mb-2">
                    🏆 Premium: €13/maand
                  </p>
                  <ul className="text-sm space-y-1">
                    <li>✓ Profiel zichtbaar voor alle opdrachtgevers</li>
                    <li>✓ Onbeperkt opdrachten ontvangen</li>
                    <li>✓ Premium badge in zoekresultaten</li>
                    <li>✓ Team/Duo configuratie mogelijk</li>
                    <li>✓ "Skoczek" beschikbaarheid toggle</li>
                  </ul>
                </div>
                <div className="bg-primary-navy/30 rounded-lg p-4 border border-yellow-500/20">
                  <p className="text-white font-bold mb-2">
                    📜 ZZP Examen (optioneel): €230 eenmalig
                  </p>
                  <p className="text-sm">
                    Bewijs je kennis met officieel ZZP certificaat + 1 jaar
                    premium gratis!
                  </p>
                </div>
              </div>
            </details>

            {/* FAQ 4 - Prijzen Employers */}
            <details className="group bg-gradient-glass backdrop-blur-md rounded-xl border border-accent-cyber/20 hover:border-accent-cyber transition-all">
              <summary className="cursor-pointer p-6 font-bold text-white text-lg flex items-center justify-between">
                <span>💼 Wat kost het voor opdrachtgevers?</span>
                <span className="text-accent-cyber group-open:rotate-180 transition-transform">
                  ▼
                </span>
              </summary>
              <div className="px-6 pb-6 text-neutral-300 leading-relaxed space-y-3">
                <div className="bg-primary-navy/30 rounded-lg p-4 border border-accent-cyber/20">
                  <p className="text-white font-bold mb-2">Basic: €13/maand</p>
                  <ul className="text-sm space-y-1">
                    <li>✓ Toegang tot alle ZZP'er profielen</li>
                    <li>✓ Basis zoekmogelijkheden</li>
                    <li>✓ Direct contact opnemen</li>
                  </ul>
                </div>
                <div className="bg-gradient-to-r from-accent-cyber/10 to-accent-cyber/5 rounded-lg p-4 border border-accent-cyber/40">
                  <p className="text-white font-bold mb-2">
                    🚀 Premium: €25/maand (Meest gekozen!)
                  </p>
                  <ul className="text-sm space-y-1">
                    <li>✓ Alles van Basic +</li>
                    <li>✓ Geavanceerde filters (teams, beschikbaarheid)</li>
                    <li>✓ Hogere prioriteit in zichtbaarheid</li>
                    <li>✓ Snellere responstijden van ZZP'ers</li>
                    <li>✓ Toegang tot "Skoczek" workers voor spoedklussen</li>
                  </ul>
                </div>
              </div>
            </details>

            {/* FAQ 5 - Team Functie */}
            <details className="group bg-gradient-glass backdrop-blur-md rounded-xl border border-accent-techGreen/20 hover:border-accent-techGreen transition-all">
              <summary className="cursor-pointer p-6 font-bold text-white text-lg flex items-center justify-between">
                <span>👥 Wat is de Team functie?</span>
                <span className="text-accent-techGreen group-open:rotate-180 transition-transform">
                  ▼
                </span>
              </summary>
              <div className="px-6 pb-6 text-neutral-300 leading-relaxed space-y-3">
                <p>ZZP'ers kunnen zich nu registreren als:</p>
                <ul className="space-y-2 ml-2">
                  <li>
                    <strong className="text-white">🧑 Solo:</strong> Individuele
                    professional
                  </li>
                  <li>
                    <strong className="text-white">👥 Team Leader:</strong>{" "}
                    Werkt met helpers (2-10 personen), ideaal voor grote
                    projecten
                  </li>
                  <li>
                    <strong className="text-white">🤝 Duo Partner:</strong> Vast
                    duo (2 gelijkwaardige partners)
                  </li>
                  <li>
                    <strong className="text-white">🙋 Helper Available:</strong>{" "}
                    Kan werken als helper in teams van anderen
                  </li>
                </ul>
                <p className="mt-4 bg-accent-techGreen/10 rounded-lg p-3 border border-accent-techGreen/30">
                  <strong className="text-white">
                    Voordeel voor opdrachtgevers:
                  </strong>{" "}
                  Krijg meteen een heel team voor grote klussen, met
                  gecombineerd uurloon!
                </p>
              </div>
            </details>

            {/* FAQ 6 - Skoczek */}
            <details className="group bg-gradient-glass backdrop-blur-md rounded-xl border border-yellow-500/20 hover:border-yellow-500 transition-all">
              <summary className="cursor-pointer p-6 font-bold text-white text-lg flex items-center justify-between">
                <span>⚡ Wat is "Skoczek" (On-Demand)?</span>
                <span className="text-yellow-400 group-open:rotate-180 transition-transform">
                  ▼
                </span>
              </summary>
              <div className="px-6 pb-6 text-neutral-300 leading-relaxed space-y-3">
                <p>
                  <strong className="text-white">"Skoczek"</strong> betekent dat
                  een ZZP'er beschikbaar is voor{" "}
                  <strong>spoedopdrachten</strong>.
                </p>
                <p>
                  <strong className="text-white">Hoe werkt het:</strong>
                </p>
                <ul className="space-y-2 ml-2">
                  <li>
                    ✓ ZZP'er zet toggle{" "}
                    <strong className="text-yellow-400">AAN</strong> in
                    dashboard wanneer beschikbaar
                  </li>
                  <li>
                    ✓ Profiel krijgt{" "}
                    <strong className="text-yellow-400">
                      ⚡ Beschikbaar Nu
                    </strong>{" "}
                    badge
                  </li>
                  <li>
                    ✓ Premium opdrachtgevers kunnen filteren op "beschikbaar
                    vandaag"
                  </li>
                  <li>
                    ✓ Perfect voor noodgevallen, ziekteverzuim, acute projecten
                  </li>
                </ul>
                <p className="mt-4 bg-yellow-500/10 rounded-lg p-3 border border-yellow-500/30">
                  <strong className="text-white">Voor ZZP'ers:</strong> Meer
                  kansen op last-minute opdrachten tegen betere tarieven!
                </p>
              </div>
            </details>

            {/* FAQ 7 - Betaling */}
            <details className="group bg-gradient-glass backdrop-blur-md rounded-xl border border-accent-cyber/20 hover:border-accent-cyber transition-all">
              <summary className="cursor-pointer p-6 font-bold text-white text-lg flex items-center justify-between">
                <span>� Hoe werkt de betaling?</span>
                <span className="text-accent-cyber group-open:rotate-180 transition-transform">
                  ▼
                </span>
              </summary>
              <div className="px-6 pb-6 text-neutral-300 leading-relaxed space-y-3">
                <p>
                  We gebruiken <strong className="text-white">Stripe</strong>{" "}
                  voor veilige betalingen:
                </p>
                <ul className="space-y-2 ml-2">
                  <li>
                    ✓ Creditcard, iDEAL, Bancontact, SEPA automatische incasso
                  </li>
                  <li>✓ Automatische maandelijkse verlenging</li>
                  <li>✓ Op elk moment opzegbaar (geen bindingsperiode)</li>
                  <li>
                    ✓ Bij annulering blijft profiel actief tot einde van
                    betaalde periode
                  </li>
                </ul>
                <p className="mt-4 text-sm">
                  <strong className="text-white">Let op:</strong> ZZP'ers
                  betalen ons alleen voor de <strong>zichtbaarheid</strong> op
                  het platform. De daadwerkelijke betaling voor opdrachten
                  gebeurt direct tussen jou en de opdrachtgever (wij nemen geen
                  commissie!).
                </p>
              </div>
            </details>

            {/* FAQ 8 - Verschil met concurrentie */}
            <details className="group bg-gradient-glass backdrop-blur-md rounded-xl border border-accent-techGreen/20 hover:border-accent-techGreen transition-all">
              <summary className="cursor-pointer p-6 font-bold text-white text-lg flex items-center justify-between">
                <span>🎯 Waarom ZZP Werkplaats?</span>
                <span className="text-accent-techGreen group-open:rotate-180 transition-transform">
                  ▼
                </span>
              </summary>
              <div className="px-6 pb-6 text-neutral-300 leading-relaxed space-y-3">
                <p>
                  <strong className="text-white">Wat maakt ons anders:</strong>
                </p>
                <ul className="space-y-2">
                  <li>
                    ✓{" "}
                    <strong className="text-white">
                      Geen commissie op opdrachten!
                    </strong>{" "}
                    Andere platforms nemen 10-25%, wij €0
                  </li>
                  <li>
                    ✓{" "}
                    <strong className="text-white">
                      Transparante prijzen:
                    </strong>{" "}
                    Opdrachtgevers zien direct je uurloon
                  </li>
                  <li>
                    ✓ <strong className="text-white">Team support:</strong> Als
                    enige platform kunnen ZZP'ers teams vormen
                  </li>
                  <li>
                    ✓ <strong className="text-white">Skoczek systeem:</strong>{" "}
                    Unieke functie voor spoedopdrachten
                  </li>
                  <li>
                    ✓ <strong className="text-white">Direct contact:</strong>{" "}
                    Geen tussenpartij, direct afspraken maken
                  </li>
                  <li>
                    ✓ <strong className="text-white">Focus op bouw:</strong>{" "}
                    Gespecialiseerd in construction sector
                  </li>
                </ul>
                <p className="mt-4 bg-accent-techGreen/10 rounded-lg p-3 border border-accent-techGreen/30 text-sm">
                  <strong>Onze missie:</strong> Het verbinden van ZZP'ers en
                  opdrachtgevers zonder onnodige kosten en bureaucratie. Simpel,
                  transparant, eerlijk. 🤝
                </p>
              </div>
            </details>
          </div>

          {/* CTA after FAQ */}
          <div className="text-center mt-12 space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register/worker"
                className="inline-block bg-gradient-to-r from-accent-techGreen to-green-600 text-white px-10 py-4 rounded-xl font-bold text-lg hover:scale-105 transition-transform shadow-2xl"
              >
                � Registreer als ZZP'er
              </Link>
              <Link
                to="/register/employer"
                className="inline-block bg-gradient-to-r from-accent-cyber to-blue-600 text-white px-10 py-4 rounded-xl font-bold text-lg hover:scale-105 transition-transform shadow-2xl"
              >
                🏢 Registreer als bedrijf
              </Link>
            </div>
            <p className="text-neutral-400">
              Nog vragen?{" "}
              <a
                href="/contact"
                className="text-accent-cyber hover:text-accent-techGreen underline"
              >
                Neem contact met ons op
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-32 bg-gradient-hero text-white overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5"></div>
        <div className="absolute top-0 left-0 w-96 h-96 bg-accent-cyber/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent-techGreen/10 rounded-full blur-3xl"></div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-6xl font-bold mb-8 font-heading animate-slide-in-up">
            {t("home.cta.title", "Klaar om te beginnen?")}
          </h2>
          <p className="text-2xl mb-12 text-neutral-300 animate-fade-in">
            {t(
              "home.cta.description",
              "Of je nu ZZP'er bent die meer opdrachten wil, of een opdrachtgever die betrouwbare professionals zoekt - word vandaag nog lid!"
            )}
          </p>

          {/* Real Photo - Success & Team */}
          <div className="mb-12 grid md:grid-cols-2 gap-6">
            <div className="rounded-full overflow-hidden border-4 border-green-500/40 shadow-2xl transform hover:scale-105 transition-transform aspect-square">
              <img
                src="https://images.unsplash.com/photo-1552581234-26160f608093?w=500&h=500&fit=crop"
                alt="Success and celebration"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="rounded-full overflow-hidden border-4 border-blue-500/40 shadow-2xl transform hover:scale-105 transition-transform aspect-square">
              <img
                src="https://images.unsplash.com/photo-1600880292089-90a7e086ee0c?w=500&h=500&fit=crop"
                alt="Team collaboration success"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link
              to="/register/worker"
              className="group relative bg-gradient-success text-white px-12 py-5 rounded-xl font-bold text-lg transition-all shadow-glow-success hover:shadow-glow-success hover:scale-105"
            >
              <span className="relative z-10">
                {t("home.cta.worker", "🔨 Ik ben ZZP'er")}
              </span>
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity rounded-xl"></div>
            </Link>
            <Link
              to="/register/employer"
              className="group relative bg-primary-navy/50 backdrop-blur-md text-white px-12 py-5 rounded-xl font-bold text-lg transition-all shadow-3d hover:shadow-glow-cyber hover:scale-105 border-2 border-accent-cyber/30 hover:border-accent-cyber"
            >
              {t("home.cta.employer", "🏢 Ik ben opdrachtgever")}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
