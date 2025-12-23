import React, { Suspense, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Logo } from "../../src/components/common/Logo";
import { getUserStats, type UserStats } from "../../src/services/statsService";
import { GlowCard } from "../../src/components/ui/GlowCard";

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
                    <span>Ontdek Talent</span>
                  </span>
                </Link>
              </div>

              {/* Stats Cards - PREMIUM GLOW CARDS with Interactive Effect */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-4xl">
                {/* Card 1 - Cyan variant with animated glow border */}
                <GlowCard variant="cyan" size="md">
                  <div className="text-center py-2">
                    <div
                      className="text-4xl sm:text-5xl lg:text-6xl font-black bg-gradient-to-r from-cyan-300 via-white to-purple-300 bg-clip-text text-transparent mb-3"
                      style={{ textShadow: "0 0 40px rgba(34,211,238,0.6)" }}
                    >
                      {isLoading
                        ? "..."
                        : stats
                        ? stats.totalWorkers + stats.totalCleaningCompanies
                        : "0"}
                    </div>
                    <div className="text-sm font-bold text-cyan-300 uppercase tracking-widest">
                      Actieve ZZP'ers
                    </div>
                  </div>
                </GlowCard>

                {/* Card 2 - Emerald variant with animated glow border */}
                <GlowCard variant="emerald" size="md">
                  <div className="text-center py-2">
                    <div
                      className="text-4xl sm:text-5xl lg:text-6xl font-black bg-gradient-to-r from-emerald-300 via-white to-cyan-300 bg-clip-text text-transparent mb-3"
                      style={{ textShadow: "0 0 40px rgba(16,185,129,0.6)" }}
                    >
                      {isLoading ? "..." : stats ? stats.totalEmployers : "0"}
                    </div>
                    <div className="text-sm font-bold text-emerald-300 uppercase tracking-widest">
                      Actieve Werkgevers
                    </div>
                  </div>
                </GlowCard>

                {/* Card 3 - Purple variant with animated glow border */}
                <GlowCard variant="purple" size="md">
                  <div className="text-center py-2">
                    <div
                      className="text-4xl sm:text-5xl lg:text-6xl font-black bg-gradient-to-r from-purple-300 via-white to-pink-300 bg-clip-text text-transparent mb-3"
                      style={{ textShadow: "0 0 40px rgba(168,85,247,0.6)" }}
                    >
                      {isLoading ? "..." : stats ? stats.totalAccountants : "0"}
                    </div>
                    <div className="text-sm font-bold text-purple-300 uppercase tracking-widest">
                      Actieve Boekhouders
                    </div>
                  </div>
                </GlowCard>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════ MESH GRADIENT DIVIDER 1 ═══════════════════ */}
      <div className="relative h-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-pink-500/20"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-primary-dark via-transparent to-primary-dark"></div>
        <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-cyan-500/30 rounded-full blur-3xl -translate-y-1/2"></div>
        <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl -translate-y-1/2"></div>
        <svg
          className="absolute inset-0 w-full h-full opacity-20"
          preserveAspectRatio="none"
        >
          <defs>
            <pattern
              id="mesh1"
              x="0"
              y="0"
              width="40"
              height="40"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M0 20h40M20 0v40"
                stroke="url(#meshGrad1)"
                strokeWidth="0.5"
                fill="none"
              />
            </pattern>
            <linearGradient id="meshGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="50%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#ec4899" />
            </linearGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#mesh1)" />
        </svg>
      </div>

      {/* How It Works - 4 Steps */}
      <section className="py-24 bg-primary-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-5xl font-bold text-center mb-4 text-white font-heading">
            {t("home.howItWorks.title", "Hoe het werkt")}
          </h2>
          <p className="text-xl text-neutral-200 text-center mb-20">
            {t(
              "home.howItWorks.subtitle",
              "Van registratie tot eerste opdracht in 4 stappen"
            )}
          </p>

          {/* Real Photos - How It Works Process */}
          <div className="mb-16 grid md:grid-cols-2 gap-6 items-start">
            <div className="rounded-2xl overflow-hidden border-4 border-accent-techGreen/30 shadow-2xl transform hover:scale-105 transition-transform bg-black">
              <img
                src="/home-pricing.jpg"
                alt="ZZP Werkplaats Basic en Premium plannen"
                className="w-full h-auto object-contain"
              />
              <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-4 text-center">
                <p className="text-white font-bold">
                  🚀 Kies je plan: BASIC €0 of PREMIUM €13/maand!
                </p>
              </div>
            </div>

            <div className="rounded-2xl overflow-hidden border-4 border-accent-cyber/30 shadow-2xl transform hover:scale-105 transition-transform">
              <video
                src="/,,.mp4"
                autoPlay
                muted
                loop
                playsInline
                controls
                className="w-full block"
              />
              <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-4 text-center">
                <p className="text-white font-bold">
                  🎬 Ontdek ZZP Werkplaats - Jouw Succes Begint Hier!
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Step 1 */}
            <GlowCard variant="emerald" size="md">
              <div className="group text-center">
                <div className="w-20 h-20 bg-gradient-success text-white rounded-2xl flex items-center justify-center text-3xl font-bold mx-auto mb-6 shadow-glow-success group-hover:scale-110 transition-transform">
                  1
                </div>
                <h3 className="text-xl font-bold mb-3 text-white">
                  {t("home.howItWorks.step1.title", "Maak Profiel")}
                </h3>
                <p className="text-neutral-200">
                  {t(
                    "home.howItWorks.step1.description",
                    "Registreer gratis en vul je profiel in met specialisatie, ervaring en uurloon"
                  )}
                </p>
              </div>
            </GlowCard>

            {/* Step 2 */}
            <GlowCard variant="emerald" size="md">
              <div className="group text-center">
                <div className="w-20 h-20 bg-gradient-success text-white rounded-2xl flex items-center justify-center text-3xl font-bold mx-auto mb-6 shadow-glow-success group-hover:scale-110 transition-transform">
                  2
                </div>
                <h3 className="text-xl font-bold mb-3 text-white">
                  {t("home.howItWorks.step2.title", "Kies Premium")}
                </h3>
                <p className="text-neutral-200">
                  {t(
                    "home.howItWorks.step2.description",
                    "Upgrade naar Premium (€13/maand) om zichtbaar te zijn voor opdrachtgevers"
                  )}
                </p>
              </div>
            </GlowCard>

            {/* Step 3 */}
            <GlowCard variant="cyan" size="md">
              <div className="group text-center">
                <div className="w-20 h-20 bg-gradient-cyber text-white rounded-2xl flex items-center justify-center text-3xl font-bold mx-auto mb-6 shadow-glow-cyber group-hover:scale-110 transition-transform">
                  3
                </div>
                <h3 className="text-xl font-bold mb-3 text-white">
                  {t("home.howItWorks.step3.title", "Word Gevonden")}
                </h3>
                <p className="text-neutral-200">
                  {t(
                    "home.howItWorks.step3.description",
                    "Opdrachtgevers zoeken en vinden je profiel via filters (locatie, skills, etc.)"
                  )}
                </p>
              </div>
            </GlowCard>

            {/* Step 4 */}
            <GlowCard variant="cyan" size="md">
              <div className="group text-center">
                <div className="w-20 h-20 bg-gradient-cyber text-white rounded-2xl flex items-center justify-center text-3xl font-bold mx-auto mb-6 shadow-glow-cyber group-hover:scale-110 transition-transform">
                  4
                </div>
                <h3 className="text-xl font-bold mb-3 text-white">
                  {t("home.howItWorks.step4.title", "Ontvang Opdrachten")}
                </h3>
                <p className="text-neutral-200">
                  {t(
                    "home.howItWorks.step4.description",
                    "Opdrachtgevers nemen direct contact op via platform - geen commissie!"
                  )}
                </p>
              </div>
            </GlowCard>
          </div>
        </div>
      </section>

      {/* ═══════════════════ MESH GRADIENT DIVIDER 2 ═══════════════════ */}
      <div className="relative h-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-teal-500/15 to-cyan-500/10"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-primary-dark via-transparent to-primary-navy/20"></div>
        <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl -translate-y-1/2 animate-pulse"></div>
        <div
          className="absolute top-1/2 right-1/3 w-64 h-64 bg-teal-500/20 rounded-full blur-3xl -translate-y-1/2 animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,transparent_0%,rgba(16,185,129,0.1)_25%,rgba(20,184,166,0.15)_50%,rgba(6,182,212,0.1)_75%,transparent_100%)]"></div>
      </div>

      {/* Benefits for Workers */}
      <section className="py-24 bg-primary-navy/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-5xl font-bold mb-8 text-white font-heading">
                {t("home.benefits.workers.title", "Voor ZZP'ers")}
              </h2>

              {/* Real Photo - ZZP Benefits */}
              <div className="mb-8 rounded-2xl overflow-hidden border-4 border-accent-techGreen/30 shadow-2xl transform hover:scale-105 transition-transform inline-block">
                <img
                  src="/home-employer.jpg"
                  alt="ZZP professional werkend aan laptop"
                  className="block w-auto h-auto max-w-full"
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
                    <span className="text-neutral-200">
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
                    <span className="text-neutral-200">
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
                    <span className="text-neutral-200">
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
            <div className="relative rounded-2xl overflow-hidden border-4 border-accent-cyber/30 shadow-2xl transform hover:scale-105 transition-transform">
              <img
                src="/home-certyfikat.png"
                alt="ZZP Werkplaats gecertificeerde professional met certificaat"
                className="block w-full h-auto"
              />
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
            <GlowCard variant="emerald" size="lg">
              <div className="group">
                <div className="w-20 h-20 bg-gradient-to-br from-accent-techGreen to-green-600 rounded-2xl flex items-center justify-center text-4xl mb-6 shadow-lg group-hover:scale-110 transition-transform">
                  👥
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
                <ul className="space-y-3 text-neutral-200">
                  <li className="flex items-start gap-3">
                    <span className="text-accent-techGreen text-xl">✓</span>
                    <span>
                      <strong className="text-white">
                        Teams 2-10 personen:
                      </strong>{" "}
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
            </GlowCard>

            {/* On-Demand Feature */}
            <GlowCard variant="orange" size="lg">
              <div className="group">
                <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-2xl flex items-center justify-center text-4xl mb-6 shadow-lg group-hover:scale-110 transition-transform">
                  ⚡
                </div>
                <h3 className="text-3xl font-bold text-white mb-4">
                  "Skoczek" On-Demand
                </h3>
                <p className="text-neutral-300 mb-6 text-lg">
                  Workers kunnen aangeven dat ze{" "}
                  <strong>beschikbaar zijn voor spoedklussen</strong>. Ideaal
                  voor noodgevallen, ziektevervangingen, of acute projecten!
                </p>
                <ul className="space-y-3 text-neutral-200">
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
            </GlowCard>
          </div>

          {/* Pricing Comparison - PREMIUM GEOMETRIC DESIGN */}
          <div className="relative bg-gradient-to-br from-slate-900/80 via-slate-800/60 to-slate-900/80 backdrop-blur-xl rounded-3xl p-10 md:p-12 border border-white/10 overflow-hidden">
            {/* Geometric mesh background */}
            <div className="absolute inset-0 opacity-30">
              <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_left,_rgba(6,182,212,0.3)_0%,_transparent_50%)]" />
              <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_bottom_right,_rgba(139,92,246,0.3)_0%,_transparent_50%)]" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_rgba(236,72,153,0.15)_0%,_transparent_70%)]" />
            </div>

            <h3 className="relative text-3xl md:text-4xl font-bold text-white mb-10 text-center">
              <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Simpele, Transparante Prijzen
              </span>
            </h3>

            {/* Real Photo - Pricing Transparency */}
            <div className="mb-10 rounded-2xl overflow-hidden border-4 border-green-500/30 shadow-2xl transform hover:scale-105 transition-transform">
              <img
                src="/home-team.png"
                alt="ZZP Werkplaats team van gecertificeerde professionals"
                className="w-full h-auto block"
              />
              <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-4 text-center">
                <p className="text-white font-bold">
                  👥 Professionele teams - transparante prijzen!
                </p>
              </div>
            </div>

            <div className="relative grid md:grid-cols-3 gap-8">
              {/* Workers Basic - 3D Geometric Card */}
              <div className="group relative" style={{ perspective: "1000px" }}>
                <div
                  className="relative bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl rounded-2xl p-8 border border-slate-600/50 transition-all duration-500 group-hover:border-slate-400/50"
                  style={{
                    transformStyle: "preserve-3d",
                    transition: "transform 0.5s",
                  }}
                >
                  {/* Subtle inner glow */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="relative">
                    <div className="text-sm text-slate-400 font-bold mb-2 tracking-widest">
                      VOOR ZZP'ERS
                    </div>
                    <h4 className="text-2xl font-bold text-white mb-4">
                      Basic
                    </h4>
                    <p className="text-5xl font-bold bg-gradient-to-r from-slate-200 to-slate-400 bg-clip-text text-transparent mb-2">
                      €0
                    </p>
                    <p className="text-slate-500 mb-6">/maand</p>
                    <ul className="space-y-3 mb-8 text-sm">
                      <li className="flex items-center gap-2 text-slate-400">
                        <span className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center text-xs">
                          ✓
                        </span>
                        Profiel aanmaken
                      </li>
                      <li className="flex items-center gap-2 text-slate-500">
                        <span className="w-5 h-5 rounded-full bg-red-900/50 flex items-center justify-center text-xs text-red-400">
                          ✗
                        </span>
                        <span className="line-through">
                          Zichtbaar voor opdrachtgevers
                        </span>
                      </li>
                    </ul>
                    <p className="text-xs text-slate-600 text-center">
                      Perfect om platform te leren kennen
                    </p>
                  </div>
                </div>
              </div>

              {/* Workers Premium - 3D Geometric Card with Glow */}
              <div className="group relative" style={{ perspective: "1000px" }}>
                {/* Animated outer glow */}
                <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 via-green-400 to-teal-500 rounded-2xl blur-lg opacity-50 group-hover:opacity-80 transition-all duration-500 animate-pulse" />

                <div
                  className="relative bg-gradient-to-br from-emerald-950/90 via-slate-900/95 to-teal-950/90 backdrop-blur-xl rounded-2xl p-8 border border-emerald-500/50 transition-all duration-500 group-hover:border-emerald-400 group-hover:-translate-y-2 shadow-2xl"
                  style={{ transformStyle: "preserve-3d" }}
                >
                  {/* Geometric inner pattern */}
                  <div className="absolute inset-0 rounded-2xl overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-500/20 to-transparent rounded-full blur-2xl" />
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-teal-500/20 to-transparent rounded-full blur-xl" />
                  </div>

                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-emerald-500 via-green-400 to-teal-500 text-white px-6 py-1.5 rounded-full text-sm font-bold shadow-lg shadow-emerald-500/30">
                    🔨 Voor ZZP'ers
                  </div>

                  <div className="relative mt-2">
                    <div className="text-sm text-emerald-400 font-bold mb-2 tracking-widest">
                      MEEST GEKOZEN ⭐
                    </div>
                    <h4 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                      Premium
                      <span className="text-2xl">🏆</span>
                    </h4>
                    <p className="text-5xl font-bold bg-gradient-to-r from-emerald-300 via-white to-teal-300 bg-clip-text text-transparent mb-2">
                      €13
                    </p>
                    <p className="text-emerald-200/80 mb-6">/maand</p>
                    <ul className="space-y-3 mb-8 text-sm">
                      <li className="flex items-center gap-2 text-white">
                        <span className="w-5 h-5 rounded-full bg-emerald-500/30 border border-emerald-400/50 flex items-center justify-center text-xs text-emerald-400">
                          ✓
                        </span>
                        <strong>
                          Profiel zichtbaar voor alle opdrachtgevers
                        </strong>
                      </li>
                      <li className="flex items-center gap-2 text-white">
                        <span className="w-5 h-5 rounded-full bg-emerald-500/30 border border-emerald-400/50 flex items-center justify-center text-xs text-emerald-400">
                          ✓
                        </span>
                        Premium badge 🏆
                      </li>
                      <li className="flex items-center gap-2 text-white">
                        <span className="w-5 h-5 rounded-full bg-emerald-500/30 border border-emerald-400/50 flex items-center justify-center text-xs text-emerald-400">
                          ✓
                        </span>
                        Team configuratie (duo/trio)
                      </li>
                      <li className="flex items-center gap-2 text-white">
                        <span className="w-5 h-5 rounded-full bg-emerald-500/30 border border-emerald-400/50 flex items-center justify-center text-xs text-emerald-400">
                          ✓
                        </span>
                        "Skoczek" beschikbaarheid toggle
                      </li>
                      <li className="flex items-center gap-2 text-white">
                        <span className="w-5 h-5 rounded-full bg-emerald-500/30 border border-emerald-400/50 flex items-center justify-center text-xs text-emerald-400">
                          ✓
                        </span>
                        Onbeperkt opdrachten ontvangen
                      </li>
                    </ul>
                    <Link
                      to="/register/worker"
                      className="block text-center bg-gradient-to-r from-emerald-500 via-green-400 to-teal-500 text-white px-6 py-3 rounded-xl font-bold hover:scale-105 transition-transform shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50"
                    >
                      Start als ZZP'er →
                    </Link>
                  </div>
                </div>
              </div>

              {/* Employers Premium - 3D Geometric Card with Glow */}
              <div className="group relative" style={{ perspective: "1000px" }}>
                {/* Animated outer glow */}
                <div
                  className="absolute -inset-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 rounded-2xl blur-lg opacity-50 group-hover:opacity-80 transition-all duration-500 animate-pulse"
                  style={{ animationDelay: "0.5s" }}
                />

                <div
                  className="relative bg-gradient-to-br from-cyan-950/90 via-slate-900/95 to-blue-950/90 backdrop-blur-xl rounded-2xl p-8 border border-cyan-500/50 transition-all duration-500 group-hover:border-cyan-400 group-hover:-translate-y-2 shadow-2xl"
                  style={{ transformStyle: "preserve-3d" }}
                >
                  {/* Geometric inner pattern */}
                  <div className="absolute inset-0 rounded-2xl overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-cyan-500/20 to-transparent rounded-full blur-2xl" />
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-blue-500/20 to-transparent rounded-full blur-xl" />
                  </div>

                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 text-white px-6 py-1.5 rounded-full text-sm font-bold shadow-lg shadow-cyan-500/30">
                    🏢 Voor Bedrijven
                  </div>

                  <div className="relative mt-2">
                    <div className="text-sm text-cyan-400 font-bold mb-2 tracking-widest">
                      VOOR OPDRACHTGEVERS
                    </div>
                    <h4 className="text-2xl font-bold text-white mb-4">
                      Basic / Premium
                    </h4>
                    <p className="text-4xl font-bold bg-gradient-to-r from-cyan-300 via-white to-blue-300 bg-clip-text text-transparent mb-2">
                      €13{" "}
                      <span className="text-2xl text-cyan-400/70">/ €25</span>
                    </p>
                    <p className="text-cyan-200/80 mb-6">/maand</p>
                    <ul className="space-y-3 mb-8 text-sm">
                      <li className="flex items-center gap-2 text-white">
                        <span className="w-5 h-5 rounded-full bg-cyan-500/30 border border-cyan-400/50 flex items-center justify-center text-xs text-cyan-400">
                          ✓
                        </span>
                        Toegang tot alle ZZP'er profielen
                      </li>
                      <li className="flex items-center gap-2 text-white">
                        <span className="w-5 h-5 rounded-full bg-cyan-500/30 border border-cyan-400/50 flex items-center justify-center text-xs text-cyan-400">
                          ✓
                        </span>
                        Direct contact met professionals
                      </li>
                      <li className="flex items-center gap-2 text-white">
                        <span className="w-5 h-5 rounded-full bg-cyan-500/30 border border-cyan-400/50 flex items-center justify-center text-xs text-cyan-400">
                          ✓
                        </span>
                        <span className="text-cyan-400 font-medium">
                          (Premium)
                        </span>{" "}
                        Filter op teams & beschikbaarheid
                      </li>
                      <li className="flex items-center gap-2 text-white">
                        <span className="w-5 h-5 rounded-full bg-cyan-500/30 border border-cyan-400/50 flex items-center justify-center text-xs text-cyan-400">
                          ✓
                        </span>
                        <span className="text-cyan-400 font-medium">
                          (Premium)
                        </span>{" "}
                        Hogere prioriteit bij ZZP'ers
                      </li>
                      <li className="flex items-center gap-2 text-white">
                        <span className="w-5 h-5 rounded-full bg-cyan-500/30 border border-cyan-400/50 flex items-center justify-center text-xs text-cyan-400">
                          ✓
                        </span>
                        Geen commissie op opdrachten!
                      </li>
                    </ul>
                    <Link
                      to="/register/employer"
                      className="block text-center bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 text-white px-6 py-3 rounded-xl font-bold hover:scale-105 transition-transform shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50"
                    >
                      Registreer bedrijf →
                    </Link>
                  </div>
                </div>
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

            {/* NEW: Additional User Types - Accountants, Cleaning Companies, Regular Users */}
            <div className="mt-16">
              <h3 className="text-3xl md:text-4xl font-bold text-white mb-10 text-center">
                Ook voor Boekhouders, Schoonmaakbedrijven & Particulieren
              </h3>

              <div className="grid md:grid-cols-3 gap-8">
                {/* Accountants */}
                <GlowCard variant="purple" size="md">
                  <div className="relative">
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-6 py-1 rounded-full text-sm font-bold shadow-lg z-20">
                      📊 Voor Boekhouders
                    </div>
                    <div className="text-center mt-4">
                      <div className="text-5xl mb-4">📊</div>
                      <h4 className="text-2xl font-bold text-white mb-2">
                        Boekhouders
                      </h4>
                      <p className="text-4xl font-bold text-white mb-1">
                        €0{" "}
                        <span className="text-xl text-neutral-300">/ €13</span>
                      </p>
                      <p className="text-neutral-300 mb-6 text-sm">
                        /maand (Basic / Pro)
                      </p>
                    </div>
                    <ul className="space-y-2 mb-6 text-sm">
                      <li className="flex items-center gap-2 text-white">
                        <span className="text-purple-400">✓</span>
                        Facturatie systeem (PDF export)
                      </li>
                      <li className="flex items-center gap-2 text-white">
                        <span className="text-purple-400">✓</span>
                        Klantenbeheer & CRM
                      </li>
                      <li className="flex items-center gap-2 text-white">
                        <span className="text-purple-400">✓</span>
                        Urenregistratie & projecten
                      </li>
                      <li className="flex items-center gap-2 text-white">
                        <span className="text-purple-400">✓</span>
                        Financiële rapportages
                      </li>
                      <li className="flex items-center gap-2 text-neutral-200">
                        <span className="text-purple-400">✓</span>
                        <span className="text-purple-300">(Pro)</span> Onbeperkt
                        klanten
                      </li>
                    </ul>
                    <Link
                      to="/register/accountant"
                      className="block text-center bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:scale-105 transition-transform shadow-lg"
                    >
                      Start als Boekhouder
                    </Link>
                  </div>
                </GlowCard>

                {/* Cleaning Companies */}
                <GlowCard variant="cyan" size="md">
                  <div className="relative">
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gradient-to-r from-teal-500 to-cyan-600 text-white px-6 py-1 rounded-full text-sm font-bold shadow-lg z-20">
                      🧹 Schoonmaakbedrijven
                    </div>
                    <div className="text-center mt-4">
                      <div className="text-5xl mb-4">🧹</div>
                      <h4 className="text-2xl font-bold text-white mb-2">
                        Schoonmaakbedrijven
                      </h4>
                      <p className="text-4xl font-bold text-white mb-1">
                        €0{" "}
                        <span className="text-xl text-neutral-300">/ €13</span>
                      </p>
                      <p className="text-neutral-300 mb-6 text-sm">
                        /maand (Basic / Premium)
                      </p>
                    </div>
                    <ul className="space-y-2 mb-6 text-sm">
                      <li className="flex items-center gap-2 text-white">
                        <span className="text-teal-400">✓</span>
                        Projectbeheer & planning
                      </li>
                      <li className="flex items-center gap-2 text-white">
                        <span className="text-teal-400">✓</span>
                        Teambeheer & roosters
                      </li>
                      <li className="flex items-center gap-2 text-white">
                        <span className="text-teal-400">✓</span>
                        Klantenbeheer
                      </li>
                      <li className="flex items-center gap-2 text-white">
                        <span className="text-teal-400">✓</span>
                        Takenlijsten & checklists
                      </li>
                      <li className="flex items-center gap-2 text-neutral-200">
                        <span className="text-teal-400">✓</span>
                        <span className="text-teal-300">(Premium)</span>{" "}
                        Onbeperkt projecten
                      </li>
                    </ul>
                    <Link
                      to="/register/cleaning-company"
                      className="block text-center bg-gradient-to-r from-teal-500 to-cyan-600 text-white px-6 py-3 rounded-xl font-bold hover:scale-105 transition-transform shadow-lg"
                    >
                      Start als Schoonmaakbedrijf
                    </Link>
                  </div>
                </GlowCard>

                {/* Regular Users */}
                <GlowCard variant="orange" size="md">
                  <div className="relative">
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-1 rounded-full text-sm font-bold shadow-lg z-20">
                      👤 Particulieren
                    </div>
                    <div className="text-center mt-4">
                      <div className="text-5xl mb-4">👤</div>
                      <h4 className="text-2xl font-bold text-white mb-2">
                        Particulieren
                      </h4>
                      <p className="text-4xl font-bold text-white mb-1">
                        Gratis{" "}
                        <span className="text-xl text-neutral-300">
                          / €9,99
                        </span>
                      </p>
                      <p className="text-neutral-300 mb-6 text-sm">
                        /maand (Free / Premium)
                      </p>
                    </div>
                    <ul className="space-y-2 mb-6 text-sm">
                      <li className="flex items-center gap-2 text-white">
                        <span className="text-orange-400">✓</span>
                        Diensten aanvragen (klussen)
                      </li>
                      <li className="flex items-center gap-2 text-white">
                        <span className="text-orange-400">✓</span>
                        Meldingen & notificaties
                      </li>
                      <li className="flex items-center gap-2 text-white">
                        <span className="text-orange-400">✓</span>
                        Aanvraag geschiedenis
                      </li>
                      <li className="flex items-center gap-2 text-white">
                        <span className="text-orange-400">✓</span>
                        Contact met professionals
                      </li>
                      <li className="flex items-center gap-2 text-neutral-200">
                        <span className="text-orange-400">✓</span>
                        <span className="text-orange-300">(Premium)</span>{" "}
                        Prioriteit & meer aanvragen
                      </li>
                    </ul>
                    <Link
                      to="/register/regular-user"
                      className="block text-center bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-3 rounded-xl font-bold hover:scale-105 transition-transform shadow-lg"
                    >
                      Start als Particulier
                    </Link>
                  </div>
                </GlowCard>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════ MESH GRADIENT DIVIDER 3 ═══════════════════ */}
      <div className="relative h-28 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-pink-500/15 to-orange-500/10"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-900/50 to-primary-dark"></div>
        </div>
        <div className="absolute top-0 left-1/4 w-80 h-80 bg-purple-500/15 rounded-full blur-3xl -translate-y-1/2"></div>
        <div className="absolute top-0 right-1/4 w-80 h-80 bg-orange-500/15 rounded-full blur-3xl -translate-y-1/2"></div>
        {/* Geometric lines */}
        <svg
          className="absolute inset-0 w-full h-full opacity-10"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="meshGrad3" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#a855f7" />
              <stop offset="50%" stopColor="#ec4899" />
              <stop offset="100%" stopColor="#f97316" />
            </linearGradient>
          </defs>
          <line
            x1="0"
            y1="50%"
            x2="100%"
            y2="50%"
            stroke="url(#meshGrad3)"
            strokeWidth="1"
            strokeDasharray="8 8"
          />
        </svg>
      </div>

      {/* Benefits for Employers */}
      <section className="py-24 bg-primary-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Real Photo - Employers Benefits */}
            <div className="rounded-2xl overflow-hidden border-4 border-accent-cyber/30 shadow-2xl transform hover:scale-105 transition-transform">
              <img
                src="/home-team.png"
                alt="ZZP Werkplaats team van gecertificeerde professionals"
                className="w-full h-auto block"
              />
            </div>
            <div>
              <h2 className="text-5xl font-bold mb-8 text-white font-heading">
                {t("home.benefits.employers.title", "Voor opdrachtgevers")}
              </h2>

              {/* Additional Photo - Business Team */}
              <div className="mb-8 rounded-xl overflow-hidden border-2 border-blue-500/30 shadow-xl">
                <img
                  src="/home-employer.jpg"
                  alt="ZZP Werkplaats - professionele werkgever dashboard"
                  className="w-full h-auto block"
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
                    <span className="text-neutral-200">
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
                    <span className="text-neutral-200">
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
                    <span className="text-neutral-200">
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

      {/* ═══════════════════ MESH GRADIENT DIVIDER 4 ═══════════════════ */}
      <div className="relative h-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-indigo-500/15 to-violet-500/10"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-primary-dark via-transparent to-primary-navy/20"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl"></div>
        {/* Animated shimmer line */}
        <div className="absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-400/50 to-transparent -translate-y-1/2"></div>
      </div>

      {/* FAQ Section - Platform Info */}
      <section className="py-24 bg-primary-navy/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-white mb-4 font-heading">
              Veelgestelde vragen
            </h2>
            <p className="text-xl text-neutral-200">
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

            {/* FAQ 9 - Boekhouders */}
            <details className="group bg-gradient-glass backdrop-blur-md rounded-xl border border-purple-500/20 hover:border-purple-500 transition-all">
              <summary className="cursor-pointer p-6 font-bold text-white text-lg flex items-center justify-between">
                <span>📊 Wat biedt het platform voor boekhouders?</span>
                <span className="text-purple-400 group-open:rotate-180 transition-transform">
                  ▼
                </span>
              </summary>
              <div className="px-6 pb-6 text-neutral-300 leading-relaxed space-y-3">
                <p>
                  <strong className="text-white">
                    Compleet boekhoudsysteem:
                  </strong>
                </p>
                <ul className="space-y-2 ml-2">
                  <li>
                    ✓ <strong className="text-white">Facturatie:</strong> Maak
                    professionele facturen (PDF export)
                  </li>
                  <li>
                    ✓ <strong className="text-white">Klantenbeheer:</strong> CRM
                    voor al je klanten
                  </li>
                  <li>
                    ✓ <strong className="text-white">Urenregistratie:</strong>{" "}
                    Track tijd per project
                  </li>
                  <li>
                    ✓ <strong className="text-white">Rapportages:</strong>{" "}
                    Financiële overzichten
                  </li>
                </ul>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="bg-primary-navy/30 rounded-lg p-3 border border-purple-500/20 text-center">
                    <p className="text-white font-bold">Basic: €0/maand</p>
                    <p className="text-xs text-neutral-200">Max 5 klanten</p>
                  </div>
                  <div className="bg-purple-500/10 rounded-lg p-3 border border-purple-500/40 text-center">
                    <p className="text-purple-400 font-bold">Pro: €13/maand</p>
                    <p className="text-xs text-neutral-200">
                      Onbeperkt klanten
                    </p>
                  </div>
                </div>
              </div>
            </details>

            {/* FAQ 10 - Schoonmaakbedrijven */}
            <details className="group bg-gradient-glass backdrop-blur-md rounded-xl border border-teal-500/20 hover:border-teal-500 transition-all">
              <summary className="cursor-pointer p-6 font-bold text-white text-lg flex items-center justify-between">
                <span>🧹 Wat biedt het platform voor schoonmaakbedrijven?</span>
                <span className="text-teal-400 group-open:rotate-180 transition-transform">
                  ▼
                </span>
              </summary>
              <div className="px-6 pb-6 text-neutral-300 leading-relaxed space-y-3">
                <p>
                  <strong className="text-white">
                    Compleet beheer voor schoonmaakbedrijven:
                  </strong>
                </p>
                <ul className="space-y-2 ml-2">
                  <li>
                    ✓ <strong className="text-white">Projectbeheer:</strong>{" "}
                    Plan en beheer alle klussen
                  </li>
                  <li>
                    ✓ <strong className="text-white">Teambeheer:</strong>{" "}
                    Roosters en medewerkers
                  </li>
                  <li>
                    ✓ <strong className="text-white">Klantenbeheer:</strong>{" "}
                    Alle klantgegevens op één plek
                  </li>
                  <li>
                    ✓ <strong className="text-white">Takenlijsten:</strong>{" "}
                    Checklists per project
                  </li>
                  <li>
                    ✓ <strong className="text-white">Statistieken:</strong>{" "}
                    Prestatie-overzichten
                  </li>
                </ul>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="bg-primary-navy/30 rounded-lg p-3 border border-teal-500/20 text-center">
                    <p className="text-white font-bold">Basic: €0/maand</p>
                    <p className="text-xs text-neutral-200">Max 3 projecten</p>
                  </div>
                  <div className="bg-teal-500/10 rounded-lg p-3 border border-teal-500/40 text-center">
                    <p className="text-teal-400 font-bold">
                      Premium: €13/maand
                    </p>
                    <p className="text-xs text-neutral-200">
                      Onbeperkt projecten
                    </p>
                  </div>
                </div>
              </div>
            </details>

            {/* FAQ 11 - Particulieren */}
            <details className="group bg-gradient-glass backdrop-blur-md rounded-xl border border-orange-500/20 hover:border-orange-500 transition-all">
              <summary className="cursor-pointer p-6 font-bold text-white text-lg flex items-center justify-between">
                <span>👤 Wat biedt het platform voor particulieren?</span>
                <span className="text-orange-400 group-open:rotate-180 transition-transform">
                  ▼
                </span>
              </summary>
              <div className="px-6 pb-6 text-neutral-300 leading-relaxed space-y-3">
                <p>
                  <strong className="text-white">
                    Voor huiseigenaren die hulp zoeken:
                  </strong>
                </p>
                <ul className="space-y-2 ml-2">
                  <li>
                    ✓{" "}
                    <strong className="text-white">Diensten aanvragen:</strong>{" "}
                    Plaats klusjes en krijg reacties
                  </li>
                  <li>
                    ✓ <strong className="text-white">Overzicht:</strong> Bekijk
                    al je aanvragen en historie
                  </li>
                  <li>
                    ✓ <strong className="text-white">Notificaties:</strong>{" "}
                    Ontvang updates over je verzoeken
                  </li>
                  <li>
                    ✓ <strong className="text-white">Contact:</strong> Praat
                    direct met professionals
                  </li>
                </ul>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="bg-primary-navy/30 rounded-lg p-3 border border-orange-500/20 text-center">
                    <p className="text-white font-bold">Gratis</p>
                    <p className="text-xs text-neutral-200">1 aanvraag/maand</p>
                  </div>
                  <div className="bg-orange-500/10 rounded-lg p-3 border border-orange-500/40 text-center">
                    <p className="text-orange-400 font-bold">
                      Premium: €9,99/maand
                    </p>
                    <p className="text-xs text-neutral-200">
                      Onbeperkt + prioriteit
                    </p>
                  </div>
                </div>
              </div>
            </details>
          </div>

          {/* CTA after FAQ */}
          <div className="text-center mt-12 space-y-6">
            <p className="text-xl text-white font-bold mb-4">
              Kies je rol en start vandaag nog!
            </p>

            {/* Primary CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register/worker"
                className="inline-block bg-gradient-to-r from-accent-techGreen to-green-600 text-white px-10 py-4 rounded-xl font-bold text-lg hover:scale-105 transition-transform shadow-2xl"
              >
                🔨 Registreer als ZZP'er
              </Link>
              <Link
                to="/register/employer"
                className="inline-block bg-gradient-to-r from-accent-cyber to-blue-600 text-white px-10 py-4 rounded-xl font-bold text-lg hover:scale-105 transition-transform shadow-2xl"
              >
                🏢 Registreer als bedrijf
              </Link>
            </div>

            {/* Secondary CTAs for new user types */}
            <div className="flex flex-wrap gap-3 justify-center">
              <Link
                to="/register/accountant"
                className="inline-block bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-6 py-3 rounded-lg font-bold hover:scale-105 transition-transform shadow-lg"
              >
                📊 Boekhouder
              </Link>
              <Link
                to="/register/cleaning-company"
                className="inline-block bg-gradient-to-r from-teal-500 to-cyan-600 text-white px-6 py-3 rounded-lg font-bold hover:scale-105 transition-transform shadow-lg"
              >
                🧹 Schoonmaakbedrijf
              </Link>
              <Link
                to="/register/regular-user"
                className="inline-block bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-3 rounded-lg font-bold hover:scale-105 transition-transform shadow-lg"
              >
                👤 Particulier
              </Link>
            </div>

            <p className="text-neutral-200">
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
              "Of je nu ZZP'er, opdrachtgever, boekhouder, schoonmaakbedrijf of particulier bent - word vandaag nog lid!"
            )}
          </p>

          {/* Real Photo - Success & Team */}
          <div className="mb-12 grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div className="rounded-2xl overflow-hidden border-4 border-green-500/40 shadow-2xl transform hover:scale-105 transition-transform">
              <img
                src="/home-certyfikat.png"
                alt="ZZP Werkplaats gecertificeerde professional"
                className="w-full h-auto block"
              />
            </div>

            <div className="rounded-2xl overflow-hidden border-4 border-blue-500/40 shadow-2xl transform hover:scale-105 transition-transform">
              <img
                src="/home-team.png"
                alt="ZZP Werkplaats team van professionals"
                className="w-full h-auto block"
              />
            </div>
          </div>

          {/* Primary CTAs */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-6">
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

          {/* Secondary CTAs for all user types */}
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              to="/register/accountant"
              className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-8 py-3 rounded-lg font-bold hover:scale-105 transition-transform shadow-lg"
            >
              📊 Boekhouder
            </Link>
            <Link
              to="/register/cleaning-company"
              className="bg-gradient-to-r from-teal-500 to-cyan-600 text-white px-8 py-3 rounded-lg font-bold hover:scale-105 transition-transform shadow-lg"
            >
              🧹 Schoonmaakbedrijf
            </Link>
            <Link
              to="/register/regular-user"
              className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-8 py-3 rounded-lg font-bold hover:scale-105 transition-transform shadow-lg"
            >
              👤 Particulier
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
