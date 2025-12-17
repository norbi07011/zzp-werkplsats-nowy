// @ts-nocheck
import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  CheckCircle,
  Users,
  FileText,
  Calculator,
  Star,
  Shield,
  TrendingUp,
  Zap,
  MessageCircle,
  Award,
  Search,
  Clock,
  DollarSign,
  Target,
  Briefcase,
  ChevronRight,
  Check,
} from "lucide-react";
import { Logo } from "../../src/components/common/Logo";
import { GlowCard } from "../../src/components/ui/GlowCard";

type TabType = "workers" | "employers" | "accountants" | "cleaning" | "regular";

export const ForEmployersPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>("employers");

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-dark via-primary-navy to-primary-dark">
      <div className="relative overflow-hidden py-24">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            {/* Logo */}
            <div className="flex justify-center mb-8">
              <Logo size="xl" showText={true} />
            </div>

            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Compleet <span className="text-gradient">Platform Gids</span>
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
              Ontdek hoe ZZP Werkplaats werkt voor jouw situatie.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <div className="flex justify-center">
          <div className="gradient-glass p-2 rounded-xl inline-flex flex-wrap gap-2 justify-center">
            <button
              onClick={() => setActiveTab("workers")}
              className={`px-6 py-3 rounded-lg font-bold text-sm md:text-base transition-all duration-300 ${
                activeTab === "workers"
                  ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg"
                  : "text-gray-400 hover:text-white hover:bg-white/10"
              }`}
            >
              🔨 ZZP'ers
            </button>
            <button
              onClick={() => setActiveTab("employers")}
              className={`px-6 py-3 rounded-lg font-bold text-sm md:text-base transition-all duration-300 ${
                activeTab === "employers"
                  ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg"
                  : "text-gray-400 hover:text-white hover:bg-white/10"
              }`}
            >
              🏢 Opdrachtgevers
            </button>
            <button
              onClick={() => setActiveTab("accountants")}
              className={`px-6 py-3 rounded-lg font-bold text-sm md:text-base transition-all duration-300 ${
                activeTab === "accountants"
                  ? "bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-lg"
                  : "text-gray-400 hover:text-white hover:bg-white/10"
              }`}
            >
              📊 Boekhouders
            </button>
            <button
              onClick={() => setActiveTab("cleaning")}
              className={`px-6 py-3 rounded-lg font-bold text-sm md:text-base transition-all duration-300 ${
                activeTab === "cleaning"
                  ? "bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg"
                  : "text-gray-400 hover:text-white hover:bg-white/10"
              }`}
            >
              🧹 Schoonmaakbedrijven
            </button>
            <button
              onClick={() => setActiveTab("regular")}
              className={`px-6 py-3 rounded-lg font-bold text-sm md:text-base transition-all duration-300 ${
                activeTab === "regular"
                  ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg"
                  : "text-gray-400 hover:text-white hover:bg-white/10"
              }`}
            >
              👤 Particulieren
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        {activeTab === "workers" && <WorkersContent />}
        {activeTab === "employers" && <EmployersContent />}
        {activeTab === "accountants" && <AccountantsContent />}
        {activeTab === "cleaning" && <CleaningContent />}
        {activeTab === "regular" && <RegularUserContent />}
      </div>
    </div>
  );
};

// ============================================
// WORKERS CONTENT COMPONENT
// ============================================
const WorkersContent: React.FC = () => {
  return (
    <div className="space-y-16">
      {/* 1. HOE REGISTREREN & STARTEN */}
      <section className="gradient-glass p-8 rounded-2xl relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-green-400/5 to-emerald-400/5 rounded-full blur-2xl"></div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center shadow-lg">
              <Users className="text-white" size={24} />
            </div>
            <h2 className="text-3xl font-bold text-white">
              🚀 Hoe Registreren & Starten
            </h2>
          </div>

          {/* Real Photo Card - Construction Worker */}
          <div className="mb-8 grid md:grid-cols-2 gap-6">
            <div className="rounded-2xl overflow-hidden border-4 border-green-500/30 shadow-2xl transform hover:scale-105 transition-transform">
              <img
                src="https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&h=400&fit=crop"
                alt="Professional construction worker registration"
                className="w-full h-64 object-cover"
              />
              <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-4 text-center">
                <p className="text-white font-bold">
                  Word onderdeel van ons netwerk!
                </p>
              </div>
            </div>

            <div className="rounded-2xl overflow-hidden border-4 border-emerald-500/30 shadow-2xl transform hover:scale-105 transition-transform">
              <img
                src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=600&h=400&fit=crop"
                alt="Team of professionals working together"
                className="w-full h-64 object-cover"
              />
              <div className="bg-gradient-to-r from-emerald-600 to-green-600 p-4 text-center">
                <p className="text-white font-bold">
                  Start vandaag met je profiel
                </p>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-5 gap-6 mt-8">
            {[
              {
                step: "1",
                icon: FileText,
                title: "Registreer",
                desc: 'Klik "Registreer als ZZP\'er" en vul basis info in',
              },
              {
                step: "2",
                icon: Briefcase,
                title: "Profiel Info",
                desc: "Voeg specialisatie, stad, uurloon en ervaring toe",
              },
              {
                step: "3",
                icon: Shield,
                title: "Account",
                desc: "Maak wachtwoord en accepteer voorwaarden",
              },
              {
                step: "4",
                icon: CheckCircle,
                title: "Verificatie",
                desc: "Bevestig email en log in op platform",
              },
              {
                step: "5",
                icon: Star,
                title: "Portfolio",
                desc: "Upload certificaten en bouw je profiel uit",
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="bg-white/5 p-6 rounded-xl hover:bg-white/10 transition-all"
              >
                <div className="w-10 h-10 rounded-full bg-green-500 text-white font-bold flex items-center justify-center mb-4">
                  {item.step}
                </div>
                <item.icon className="text-green-400 mb-3" size={32} />
                <h3 className="text-white font-bold mb-2">{item.title}</h3>
                <p className="text-gray-400 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 2. ABONNEMENTEN */}
      <section className="gradient-glass p-8 rounded-2xl relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 blur-2xl"></div>
        <div className="absolute -bottom-10 -left-10 w-56 h-56 rounded-full bg-gradient-to-tr from-green-500/15 to-emerald-500/15 blur-3xl"></div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg">
              <DollarSign className="text-white" size={24} />
            </div>
            <h2 className="text-3xl font-bold text-white">
              💰 Abonnementen - Basic vs Premium
            </h2>
          </div>

          {/* Comparison Image Card */}
          <div className="mb-8 rounded-2xl overflow-hidden border-2 border-blue-500/30 bg-gradient-to-br from-blue-900/20 to-cyan-900/20 p-6">
            <div className="flex items-center justify-center gap-8">
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-gray-600 to-gray-800 border-4 border-gray-500/50 flex items-center justify-center">
                  <span className="text-3xl">€0</span>
                </div>
                <p className="text-gray-400 font-bold">Basic</p>
              </div>
              <div className="text-4xl text-white">VS</div>
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 border-4 border-green-400/50 flex items-center justify-center shadow-lg shadow-green-500/50 animate-pulse">
                  <span className="text-3xl">€13</span>
                </div>
                <p className="text-green-400 font-bold">Premium ⭐</p>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mt-8">
            {/* Basic */}
            <div className="bg-white/5 p-8 rounded-xl border-2 border-gray-700">
              <h3 className="text-2xl font-bold text-white mb-2">Basic</h3>
              <div className="text-4xl font-bold text-gray-400 mb-6">
                €0<span className="text-lg">/maand</span>
              </div>
              <ul className="space-y-3">
                {[
                  {
                    text: "Niet zichtbaar voor opdrachtgevers",
                    included: false,
                  },
                  { text: "Geen contact mogelijk", included: false },
                  { text: "Geen team configuratie", included: false },
                  { text: "Geen Skoczek beschikbaarheid", included: false },
                  { text: "Lage ranking in zoekresultaten", included: false },
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        item.included ? "bg-green-500" : "bg-red-500/20"
                      }`}
                    >
                      {item.included ? (
                        <Check size={14} className="text-white" />
                      ) : (
                        <span className="text-red-400">✕</span>
                      )}
                    </div>
                    <span
                      className={item.included ? "text-white" : "text-gray-400"}
                    >
                      {item.text}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Premium */}
            <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 p-8 rounded-xl border-2 border-green-500 relative">
              <div className="absolute -top-4 right-4 bg-green-500 text-white px-4 py-1 rounded-full text-sm font-bold">
                AANBEVOLEN
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Premium</h3>
              <div className="text-4xl font-bold text-green-400 mb-6">
                €13<span className="text-lg">/maand</span>
              </div>
              <ul className="space-y-3">
                {[
                  "Volledig zichtbaar voor opdrachtgevers",
                  "Onbeperkt contact ontvangen",
                  "Team configuratie (duo/team leader)",
                  "Skoczek - On-demand beschikbaar",
                  "Hogere ranking in zoekresultaten",
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check size={14} className="text-white" />
                    </div>
                    <span className="text-white">{item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6 p-4 bg-green-500/10 rounded-lg border border-green-500/30">
                <p className="text-green-400 text-sm font-semibold">
                  💡 TIP: Start met Premium om direct opdrachten te krijgen!
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. TEAM CONFIGURATIE */}
      <section className="gradient-glass p-8 rounded-2xl relative overflow-hidden">
        {/* Decorative shapes */}
        <div className="absolute top-10 right-10 w-32 h-32 rounded-full border-4 border-purple-500/20"></div>
        <div className="absolute bottom-10 left-10 w-24 h-24 rounded-lg rotate-45 border-4 border-pink-500/20"></div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
              <Users className="text-white" size={24} />
            </div>
            <h2 className="text-3xl font-bold text-white">
              👥 Team Configuratie
            </h2>
          </div>

          {/* Team Visual */}
          <div className="mb-8 rounded-2xl overflow-hidden border-2 border-purple-500/30 bg-gradient-to-br from-purple-900/20 to-pink-900/20 p-8">
            <div className="flex items-center justify-center gap-4">
              {/* Individual */}
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 border-4 border-blue-400/50 flex items-center justify-center">
                <Users size={24} className="text-white" />
              </div>
              <span className="text-2xl text-white">+</span>
              {/* Duo */}
              <div className="flex gap-2">
                {[...Array(2)].map((_, i) => (
                  <div
                    key={i}
                    className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 border-4 border-green-400/50 flex items-center justify-center"
                  >
                    <Users size={16} className="text-white" />
                  </div>
                ))}
              </div>
              <span className="text-2xl text-white">+</span>
              {/* Team */}
              <div className="grid grid-cols-3 gap-1">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 border-2 border-purple-400/50 flex items-center justify-center"
                  >
                    <span className="text-xs">👤</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-4 gap-6 mt-8">
            {[
              {
                icon: Users,
                title: "Individueel",
                desc: "Werk alleen",
                badge: "Standaard",
                color: "blue",
              },
              {
                icon: Users,
                title: "Duo Partner",
                desc: "Werk met 1 vaste partner",
                badge: "2 personen",
                color: "green",
              },
              {
                icon: Users,
                title: "Team Leader",
                desc: "Leid team van 2-10 personen",
                badge: "2-10 personen",
                color: "purple",
              },
              {
                icon: Users,
                title: "Helper Available",
                desc: "Beschikbaar als teamlid",
                badge: "Flexibel",
                color: "orange",
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="bg-white/5 p-6 rounded-xl hover:bg-white/10 transition-all"
              >
                <div className="inline-block px-3 py-1 rounded-full text-xs font-bold mb-4 bg-white/10 text-white">
                  {item.badge}
                </div>
                <item.icon className="text-white mb-3" size={32} />
                <h3 className="text-white font-bold mb-2">{item.title}</h3>
                <p className="text-gray-400 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. SKOCZEK */}
      <section className="gradient-glass p-8 rounded-2xl relative overflow-hidden">
        {/* Lightning effects */}
        <div className="absolute top-0 left-1/4 w-1 h-full bg-gradient-to-b from-transparent via-yellow-500/20 to-transparent"></div>
        <div className="absolute top-0 right-1/4 w-1 h-full bg-gradient-to-b from-transparent via-orange-500/20 to-transparent"></div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 flex items-center justify-center shadow-lg animate-pulse">
              <Zap className="text-white" size={24} />
            </div>
            <h2 className="text-3xl font-bold text-white">
              ⚡ Skoczek - Beschikbaar Nu
            </h2>
          </div>

          {/* Real Photo - Worker Ready */}
          <div className="mb-8 grid md:grid-cols-3 gap-4">
            <div className="md:col-span-1 rounded-xl overflow-hidden border-4 border-yellow-500/40 shadow-2xl">
              <img
                src="https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&h=300&fit=crop"
                alt="Worker ready for immediate work"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="md:col-span-2 rounded-2xl overflow-hidden border-2 border-yellow-500/30 bg-gradient-to-br from-yellow-900/20 to-orange-900/20 p-6">
              <div className="flex items-center justify-center gap-12">
                <div className="text-center">
                  <div className="w-24 h-24 mx-auto mb-3 rounded-full bg-gray-600 border-4 border-gray-500/50 flex items-center justify-center">
                    <Zap size={40} className="text-gray-400" />
                  </div>
                  <p className="text-gray-400 font-bold">Normale Modus</p>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="w-16 h-8 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 relative cursor-pointer shadow-lg">
                    <div className="absolute right-1 top-1 w-6 h-6 rounded-full bg-white shadow-md"></div>
                  </div>
                  <span className="text-yellow-400 text-sm font-bold">
                    Toggle ON
                  </span>
                </div>
                <div className="text-center">
                  <div className="w-24 h-24 mx-auto mb-3 rounded-full bg-gradient-to-br from-yellow-500 to-orange-600 border-4 border-yellow-400/50 flex items-center justify-center shadow-lg shadow-yellow-500/50 animate-pulse">
                    <Zap size={40} className="text-white" />
                  </div>
                  <p className="text-yellow-400 font-bold">
                    Beschikbaar Nu! ⚡
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mt-8">
            <div>
              <h3 className="text-xl font-bold text-white mb-4">
                Wat is Skoczek?
              </h3>
              <ul className="space-y-3">
                {[
                  "Passieve manier om werk te vinden",
                  'Toggle "Ik ben nu beschikbaar" AAN',
                  'Zichtbaar bij "Beschikbaar Nu" filter',
                  "Krijg meer last-minute opdrachten",
                  "Ideaal voor dagen zonder werk",
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <ChevronRight
                      className="text-yellow-400 flex-shrink-0 mt-1"
                      size={16}
                    />
                    <span className="text-gray-300">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 p-6 rounded-xl border border-yellow-500/30">
              <h4 className="text-lg font-bold text-white mb-4">
                Hoe gebruik je het?
              </h4>
              <ol className="space-y-3">
                {[
                  "Ga naar je Dashboard",
                  'Klik "Beschikbaar Nu" toggle',
                  "Groen = Nu zichtbaar voor opdrachtgevers",
                  "Rood = Normale modus",
                  "Ontvang notificaties bij interesse",
                ].map((step, idx) => (
                  <li key={idx} className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-yellow-500 text-black font-bold flex items-center justify-center flex-shrink-0 text-sm">
                      {idx + 1}
                    </div>
                    <span className="text-gray-300">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </section>

      {/* 5. ZZP EXAMEN */}
      <section className="gradient-glass p-8 rounded-2xl relative overflow-hidden">
        {/* Certificate pattern */}
        <div className="absolute top-0 right-0 w-64 h-64 opacity-5">
          <div className="w-full h-full border-8 border-yellow-500 rotate-12 rounded-3xl"></div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-yellow-600 to-orange-600 flex items-center justify-center shadow-lg">
              <Award className="text-white" size={24} />
            </div>
            <h2 className="text-3xl font-bold text-white">
              🏆 ZZP Examen & Certificaat
            </h2>
          </div>

          {/* Real Photos - Study & Certificate */}
          <div className="mb-8 grid md:grid-cols-2 gap-6">
            <div className="rounded-2xl overflow-hidden border-4 border-yellow-500/30 shadow-2xl transform hover:scale-105 transition-transform">
              <img
                src="https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600&h=400&fit=crop"
                alt="Professional studying for certification exam"
                className="w-full h-64 object-cover"
              />
              <div className="bg-gradient-to-r from-yellow-600 to-orange-600 p-4 text-center">
                <p className="text-white font-bold">
                  📚 Bereid je voor op het examen
                </p>
              </div>
            </div>

            <div className="rounded-full overflow-hidden border-4 border-orange-500/40 shadow-2xl transform hover:scale-105 transition-transform aspect-square">
              <img
                src="https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=500&h=500&fit=crop"
                alt="Achievement certificate diploma"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Certificate Visual */}
          <div className="mb-8 rounded-2xl overflow-hidden border-2 border-yellow-600/30 bg-gradient-to-br from-yellow-900/20 to-orange-900/20 p-6">
            <div className="relative bg-gradient-to-br from-yellow-600 to-orange-600 rounded-xl p-8 border-4 border-yellow-400/50">
              <div className="text-center text-white">
                <Award size={64} className="mx-auto mb-4" />
                <h3 className="text-2xl font-bold mb-2">ZZP CERTIFICAAT</h3>
                <p className="text-yellow-100 mb-4">
                  Officieel erkend vakmanschap
                </p>
                <div className="inline-block bg-white/20 px-6 py-2 rounded-full text-sm font-bold">
                  60 vragen • 90 minuten • €230
                </div>
              </div>
              {/* Decorative corners */}
              <div className="absolute top-2 left-2 w-8 h-8 border-l-4 border-t-4 border-yellow-200"></div>
              <div className="absolute top-2 right-2 w-8 h-8 border-r-4 border-t-4 border-yellow-200"></div>
              <div className="absolute bottom-2 left-2 w-8 h-8 border-l-4 border-b-4 border-yellow-200"></div>
              <div className="absolute bottom-2 right-2 w-8 h-8 border-r-4 border-b-4 border-yellow-200"></div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mt-8">
            <div className="bg-white/5 p-6 rounded-xl">
              <h3 className="text-xl font-bold text-white mb-4">Wat is het?</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <ChevronRight
                    className="text-yellow-400 flex-shrink-0 mt-1"
                    size={16}
                  />
                  <span className="text-gray-300">
                    Optioneel examen (60 vragen, 90 min)
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <ChevronRight
                    className="text-yellow-400 flex-shrink-0 mt-1"
                    size={16}
                  />
                  <span className="text-gray-300">Kosten: €230 (eenmalig)</span>
                </li>
                <li className="flex items-start gap-3">
                  <ChevronRight
                    className="text-yellow-400 flex-shrink-0 mt-1"
                    size={16}
                  />
                  <span className="text-gray-300">
                    Bij slagen: Officieel certificaat + 1 jaar Premium GRATIS
                    (€156 waarde!)
                  </span>
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 p-6 rounded-xl border border-yellow-500/30">
              <h3 className="text-xl font-bold text-white mb-4">
                Waarom doen?
              </h3>
              <ul className="space-y-3">
                {[
                  '🏆 "Gecertificeerd" badge in profiel',
                  "Hogere ranking in zoekresultaten",
                  "3x meer aanvragen van employers",
                  "Bewijs je vakkennis officieel",
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <Check
                      className="text-green-400 flex-shrink-0 mt-1"
                      size={16}
                    />
                    <span className="text-white">{item}</span>
                  </li>
                ))}
              </ul>
              <Link
                to="/zzp-exam"
                className="mt-6 block w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold py-3 px-6 rounded-lg text-center hover:shadow-lg transition-all"
              >
                Aanmelden voor Examen
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 6. DASHBOARD FUNCTIES */}
      <section className="gradient-glass p-8 rounded-2xl relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="grid grid-cols-6 grid-rows-4 h-full">
            {[...Array(24)].map((_, i) => (
              <div key={i} className="border border-blue-500/30"></div>
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg">
              <Target className="text-white" size={24} />
            </div>
            <h2 className="text-3xl font-bold text-white">
              📊 Dashboard Functies
            </h2>
          </div>

          {/* Real Photos - Dashboard & Analytics */}
          <div className="mb-8 rounded-2xl overflow-hidden border-4 border-blue-500/30 shadow-2xl transform hover:scale-105 transition-transform">
            <img
              src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=400&fit=crop"
              alt="Analytics dashboard with charts and statistics"
              className="w-full h-80 object-cover"
            />
            <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-4 text-center">
              <p className="text-white font-bold">
                📈 Volledige controle over je ZZP carrière
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mt-8">
            {[
              {
                icon: TrendingUp,
                title: "Statistieken",
                desc: "Bekijk profielweergaves en contacten",
              },
              {
                icon: FileText,
                title: "Profiel Bewerken",
                desc: "Update uurloon, portfolio, beschikbaarheid",
              },
              {
                icon: MessageCircle,
                title: "Berichten",
                desc: "Lees en beantwoord employer berichten",
              },
              {
                icon: Shield,
                title: "Instellingen",
                desc: "Wijzig wachtwoord en notificaties",
              },
              {
                icon: DollarSign,
                title: "Abonnement",
                desc: "Upgrade naar Premium of annuleer",
              },
              {
                icon: Zap,
                title: "Skoczek Toggle",
                desc: "Schakel beschikbaarheid aan/uit",
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="bg-white/5 p-6 rounded-xl hover:bg-white/10 transition-all"
              >
                <item.icon className="text-blue-400 mb-3" size={32} />
                <h3 className="text-white font-bold mb-2">{item.title}</h3>
                <p className="text-gray-400 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. FAQ */}
      <section className="gradient-glass p-8 rounded-2xl relative overflow-hidden">
        <div className="absolute -bottom-10 -right-10 w-72 h-72 rounded-full bg-gradient-to-tl from-purple-500/10 to-pink-500/10 blur-3xl"></div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
              <MessageCircle className="text-white" size={24} />
            </div>
            <h2 className="text-3xl font-bold text-white">
              ❓ FAQ voor ZZP'ers
            </h2>
          </div>

          {/* Real Photo - Customer Support */}
          <div className="mb-8 grid md:grid-cols-3 gap-4">
            <div className="rounded-xl overflow-hidden border-4 border-purple-500/40 shadow-2xl transform hover:scale-105 transition-transform">
              <img
                src="https://images.unsplash.com/photo-1553484771-371a605b060b?w=400&h=300&fit=crop"
                alt="Customer support helping with questions"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="md:col-span-2 rounded-xl overflow-hidden border-2 border-pink-500/30 bg-gradient-to-br from-purple-900/20 to-pink-900/20 p-6 flex items-center justify-center">
              <div className="text-center">
                <MessageCircle
                  size={64}
                  className="mx-auto mb-4 text-purple-400"
                />
                <h3 className="text-2xl font-bold text-white mb-2">
                  Vragen? We helpen je graag!
                </h3>
                <p className="text-purple-200">
                  Bekijk de meest gestelde vragen hieronder
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4 mt-8">
            {[
              {
                q: "Moet ik Premium nemen?",
                a: "Nee, maar Basic profiel is NIET zichtbaar. Premium is €13/maand - terugverdienen met 1 klus!",
              },
              {
                q: "Hoe lang duurt verificatie?",
                a: "<24 uur. We checken je profiel op compleetheid.",
              },
              {
                q: "Kan ik mijn uurloon aanpassen?",
                a: "Ja, altijd via Dashboard → Profiel Bewerken.",
              },
              {
                q: "Wat als employer niet betaalt?",
                a: "Wij zijn GEEN tussenpersoon bij betaling. Maak duidelijke afspraken vooraf!",
              },
            ].map((item, idx) => (
              <div key={idx} className="bg-white/5 p-6 rounded-xl">
                <h3 className="text-white font-bold mb-2 flex items-start gap-2">
                  <span className="text-green-400">Q:</span> {item.q}
                </h3>
                <p className="text-gray-300 ml-6">
                  <span className="text-blue-400 font-bold">A:</span> {item.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

// ============================================
// EMPLOYERS CONTENT COMPONENT
// ============================================
const EmployersContent: React.FC = () => {
  return (
    <div className="space-y-16">
      {/* 1. HOE REGISTREREN & STARTEN */}
      <section className="gradient-glass p-8 rounded-2xl relative overflow-hidden">
        <div className="absolute -top-10 -left-10 w-64 h-64 rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 blur-3xl"></div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
              <Briefcase className="text-white" size={24} />
            </div>
            <h2 className="text-3xl font-bold text-white">
              🚀 Hoe Registreren & Starten
            </h2>
          </div>

          {/* Real Photos - Business & Team */}
          <div className="mb-8 grid md:grid-cols-2 gap-6">
            <div className="rounded-2xl overflow-hidden border-4 border-blue-500/30 shadow-2xl transform hover:scale-105 transition-transform">
              <img
                src="https://images.unsplash.com/photo-1556761175-b413da4baf72?w=600&h=400&fit=crop"
                alt="Business team collaboration in office"
                className="w-full h-64 object-cover"
              />
              <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-4 text-center">
                <p className="text-white font-bold">
                  🤝 Vind de perfecte ZZP'er voor jouw project
                </p>
              </div>
            </div>

            <div className="rounded-2xl overflow-hidden border-4 border-cyan-500/30 shadow-2xl transform hover:scale-105 transition-transform">
              <img
                src="https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=600&h=400&fit=crop"
                alt="Professional employer searching for workers"
                className="w-full h-64 object-cover"
              />
              <div className="bg-gradient-to-r from-cyan-600 to-blue-600 p-4 text-center">
                <p className="text-white font-bold">
                  ✨ Direct toegang tot duizenden professionals
                </p>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-6 gap-4 mt-8">
            {[
              {
                step: "1",
                title: "Klik Registreer",
                desc: "Als Opdrachtgever",
              },
              {
                step: "2",
                title: "Bedrijfsgegevens",
                desc: "Naam, KVK, contact",
              },
              {
                step: "3",
                title: "Email Verificatie",
                desc: "Bevestig account",
              },
              {
                step: "4",
                title: "Kies Abonnement",
                desc: "Basic €13 of Premium €25",
              },
              { step: "5", title: "Betaal via Stripe", desc: "Card of iDEAL" },
              { step: "6", title: "Direct Toegang", desc: "Zoek ZZP'ers!" },
            ].map((item, idx) => (
              <div
                key={idx}
                className="bg-white/5 p-4 rounded-xl hover:bg-white/10 transition-all text-center"
              >
                <div className="w-10 h-10 rounded-full bg-blue-500 text-white font-bold flex items-center justify-center mb-3 mx-auto">
                  {item.step}
                </div>
                <h3 className="text-white font-bold mb-1 text-sm">
                  {item.title}
                </h3>
                <p className="text-gray-400 text-xs">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 2. ABONNEMENTEN */}
      <section className="gradient-glass p-8 rounded-2xl relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-64 h-64 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 blur-3xl"></div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
              <DollarSign className="text-white" size={24} />
            </div>
            <h2 className="text-3xl font-bold text-white">
              💰 Abonnementen - Basic vs Premium
            </h2>
          </div>

          {/* Real Photo - Business Growth */}
          <div className="mb-8 rounded-2xl overflow-hidden border-4 border-green-500/30 shadow-2xl transform hover:scale-105 transition-transform">
            <img
              src="https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=800&h=400&fit=crop"
              alt="Business growth and financial planning"
              className="w-full h-80 object-cover"
            />
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-4 text-center">
              <p className="text-white font-bold">
                💼 Kies het abonnement dat bij jouw bedrijf past
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mt-8">
            {/* Basic Employer */}
            <div className="bg-white/5 p-8 rounded-xl border-2 border-blue-500">
              <h3 className="text-2xl font-bold text-white mb-2">Basic</h3>
              <div className="text-4xl font-bold text-blue-400 mb-6">
                €13<span className="text-lg">/maand</span>
              </div>
              <ul className="space-y-3">
                {[
                  { text: "Zoek alle ZZP'ers", included: true },
                  { text: "5 contacten/maand", included: true },
                  { text: "Basis filters", included: true },
                  { text: "Geen priority listing", included: false },
                  { text: "Geen analytics", included: false },
                  { text: "Basis support", included: true },
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        item.included ? "bg-green-500" : "bg-red-500/20"
                      }`}
                    >
                      {item.included ? (
                        <Check size={14} className="text-white" />
                      ) : (
                        <span className="text-red-400">✕</span>
                      )}
                    </div>
                    <span
                      className={item.included ? "text-white" : "text-gray-400"}
                    >
                      {item.text}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Premium Employer */}
            <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 p-8 rounded-xl border-2 border-cyan-500 relative">
              <div className="absolute -top-4 right-4 bg-cyan-500 text-white px-4 py-1 rounded-full text-sm font-bold">
                POPULAIR
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Premium</h3>
              <div className="text-4xl font-bold text-cyan-400 mb-6">
                €25<span className="text-lg">/maand</span>
              </div>
              <ul className="space-y-3">
                {[
                  "Alles in Basic +",
                  "Unlimited contacten",
                  "Advanced filters",
                  "Priority listing",
                  "Dashboard analytics",
                  "Priority support",
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-cyan-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check size={14} className="text-white" />
                    </div>
                    <span className="text-white">{item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6 p-4 bg-cyan-500/10 rounded-lg border border-cyan-500/30">
                <p className="text-cyan-400 text-sm font-semibold">
                  💡 TIP: Premium voor bedrijven die 5+ ZZP'ers/maand boeken!
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. ZOEK FUNCTIES */}
      <section className="gradient-glass p-8 rounded-2xl relative overflow-hidden">
        <div className="absolute -top-10 -left-10 w-64 h-64 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 blur-3xl"></div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
              <Search className="text-white" size={24} />
            </div>
            <h2 className="text-3xl font-bold text-white">
              🔍 Hoe Zoek je ZZP'ers?
            </h2>
          </div>

          {/* Real Photo - Search & Technology */}
          <div className="mb-8 grid md:grid-cols-3 gap-4">
            <div className="md:col-span-2 rounded-2xl overflow-hidden border-4 border-purple-500/30 shadow-2xl">
              <img
                src="https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&h=400&fit=crop"
                alt="Team using search technology"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="rounded-xl overflow-hidden border-2 border-pink-500/30 bg-gradient-to-br from-purple-900/30 to-pink-900/30 p-6 flex items-center justify-center">
              <div className="text-center">
                <Search size={48} className="mx-auto mb-3 text-purple-400" />
                <h3 className="text-white font-bold">Geavanceerde Filters</h3>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mt-8">
            {[
              {
                icon: Briefcase,
                title: "Specialisatie Filter",
                desc: "Metselaar, Timmerman, Elektricien, etc.",
              },
              {
                icon: Target,
                title: "Locatie Filter",
                desc: "Zoek op stad/postcode met radius",
              },
              {
                icon: DollarSign,
                title: "Tarief Filter",
                desc: "Slider: €15 - €75/uur binnen budget",
              },
              {
                icon: Users,
                title: "Team Size Filter",
                desc: "Individueel, Duo, Team (3-10)",
              },
              {
                icon: Zap,
                title: "Skoczek Filter",
                desc: "Alleen nu beschikbare ZZP'ers",
              },
              {
                icon: Award,
                title: "Certificering Filter",
                desc: "Alleen ZZP Exam geslaagden",
              },
              {
                icon: Star,
                title: "Rating Filter",
                desc: "Minimum 3★, 4★, 5★ alleen",
              },
              {
                icon: Clock,
                title: "Beschikbaarheid",
                desc: "Datum/tijd beschikbaarheid",
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="bg-white/5 p-6 rounded-xl hover:bg-white/10 transition-all"
              >
                <item.icon className="text-purple-400 mb-3" size={32} />
                <h3 className="text-white font-bold mb-2">{item.title}</h3>
                <p className="text-gray-400 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. CONTACT & TEAMS */}
      <section className="gradient-glass p-8 rounded-2xl relative overflow-hidden">
        <div className="absolute -bottom-10 -right-10 w-64 h-64 rounded-full bg-gradient-to-tl from-yellow-500/20 to-orange-500/20 blur-3xl"></div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 flex items-center justify-center">
              <MessageCircle className="text-white" size={24} />
            </div>
            <h2 className="text-3xl font-bold text-white">
              💬 Contact & Teams Boeken
            </h2>
          </div>

          {/* Real Photo - Communication */}
          <div className="mb-8 rounded-full overflow-hidden border-4 border-yellow-500/40 shadow-2xl transform hover:scale-105 transition-transform aspect-square max-w-md mx-auto">
            <img
              src="https://images.unsplash.com/photo-1577563908411-5077b6dc7624?w=500&h=500&fit=crop"
              alt="Business communication and messaging"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-8 mt-8">
            <div className="bg-white/5 p-6 rounded-xl">
              <h3 className="text-xl font-bold text-white mb-4">
                Contact Opnemen
              </h3>
              <ol className="space-y-3">
                {[
                  "Vind ZZP'er via Search",
                  "Klik profiel → Zie details",
                  'Klik "Contact Opnemen"',
                  "Vul bericht in",
                  "Verstuur → ZZP'er ontvangt",
                  "Wacht op antwoord (<24u)",
                  "Maak afspraak",
                ].map((step, idx) => (
                  <li key={idx} className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-yellow-500 text-black font-bold flex items-center justify-center flex-shrink-0 text-sm">
                      {idx + 1}
                    </div>
                    <span className="text-gray-300">{step}</span>
                  </li>
                ))}
              </ol>
              <div className="mt-4 p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/30">
                <p className="text-yellow-400 text-sm">
                  <strong>Limits:</strong> Basic: 5/maand | Premium: Unlimited
                </p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 p-6 rounded-xl border border-purple-500/30">
              <h3 className="text-xl font-bold text-white mb-4">
                Teams Boeken
              </h3>
              <ul className="space-y-3 mb-4">
                {[
                  "Team leader profiel heeft 2-10 personen klaar",
                  "Gecombineerd tarief (bijv. €180/u voor 4 personen)",
                  "1 contactpersoon (team leader)",
                  "Gecoördineerd team",
                  "Vaak goedkoper dan individueel",
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <ChevronRight
                      className="text-purple-400 flex-shrink-0 mt-1"
                      size={16}
                    />
                    <span className="text-gray-300">{item}</span>
                  </li>
                ))}
              </ul>
              <div className="p-3 bg-purple-500/10 rounded-lg border border-purple-500/30">
                <p className="text-white text-sm font-bold">Voorbeeld:</p>
                <p className="text-gray-300 text-sm">
                  "Loodgieter Team - 1 senior + 2 assistenten"
                  <br />
                  €120/uur (vs 3×€50 = €150/uur apart!)
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. KOSTEN CALCULATOR */}
      <section className="gradient-glass p-8 rounded-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-5">
          <div className="grid grid-cols-8 grid-rows-6 h-full">
            {[...Array(48)].map((_, i) => (
              <div key={i} className="border border-green-500/30"></div>
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
              <Calculator className="text-white" size={24} />
            </div>
            <h2 className="text-3xl font-bold text-white">
              💰 Kosten Besparen - Calculator
            </h2>
          </div>

          {/* Real Photo - Savings */}
          <div className="mb-8 grid md:grid-cols-2 gap-6">
            <div className="rounded-2xl overflow-hidden border-4 border-green-500/30 shadow-2xl transform hover:scale-105 transition-transform">
              <img
                src="https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&h=400&fit=crop"
                alt="Business cost savings and calculator"
                className="w-full h-64 object-cover"
              />
              <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-4 text-center">
                <p className="text-white font-bold">
                  💸 Bespaar duizenden euro's per jaar!
                </p>
              </div>
            </div>

            <div className="rounded-2xl overflow-hidden border-2 border-emerald-500/30 bg-gradient-to-br from-green-900/30 to-emerald-900/30 p-6 flex items-center justify-center">
              <div className="text-center">
                <Calculator size={64} className="mx-auto mb-4 text-green-400" />
                <h3 className="text-2xl font-bold text-white mb-2">
                  Slim Rekenen
                </h3>
                <p className="text-green-200">
                  Transparante prijzen zonder verborgen kosten
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 p-8 rounded-xl border border-green-500/30 mt-8">
            <h3 className="text-2xl font-bold text-white mb-6 text-center">
              Hoeveel bespaar je vs traditioneel?
            </h3>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-red-500/10 p-6 rounded-xl border border-red-500/30">
                <h4 className="text-lg font-bold text-red-400 mb-4">
                  TRADITIONEEL BUREAU (20% commissie)
                </h4>
                <div className="space-y-2 text-gray-300">
                  <p>€2.000 × 10 projecten = €20.000</p>
                  <p>
                    Commissie 20% ={" "}
                    <strong className="text-red-400">€4.000</strong>
                  </p>
                </div>
              </div>

              <div className="bg-green-500/10 p-6 rounded-xl border border-green-500/30">
                <h4 className="text-lg font-bold text-green-400 mb-4">
                  ZZP WERKPLAATS (Premium)
                </h4>
                <div className="space-y-2 text-gray-300">
                  <p>€25 × 12 maanden = €300</p>
                  <p>
                    Totaal kosten ={" "}
                    <strong className="text-green-400">€300</strong>
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 p-6 bg-green-500 rounded-xl text-center">
              <p className="text-2xl font-bold text-white">
                💰 JE BESPAART: €3.700/jaar! ✅
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. FAQ */}
      <section className="gradient-glass p-8 rounded-2xl relative overflow-hidden">
        <div className="absolute -top-10 -left-10 w-64 h-64 rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 blur-3xl"></div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
              <MessageCircle className="text-white" size={24} />
            </div>
            <h2 className="text-3xl font-bold text-white">
              ❓ FAQ voor Opdrachtgevers
            </h2>
          </div>

          {/* Real Photo - Business Support */}
          <div className="mb-8 rounded-2xl overflow-hidden border-4 border-blue-500/30 shadow-2xl transform hover:scale-105 transition-transform">
            <img
              src="https://images.unsplash.com/photo-1521791136064-7986c2920216?w=800&h=400&fit=crop"
              alt="Professional business support and consultation"
              className="w-full h-80 object-cover"
            />
            <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-4 text-center">
              <p className="text-white font-bold">
                🤝 We helpen je graag verder met al je vragen!
              </p>
            </div>
          </div>

          <div className="space-y-4 mt-8">
            {[
              {
                q: "Moet ik meteen betalen?",
                a: "Ja, via Stripe. Maandelijks, kan altijd opzeggen.",
              },
              {
                q: "Wat als ZZP'er niet voldoet?",
                a: "Wij zijn GEEN tussenpersoon. Maak duidelijke afspraken. Geef slechte review.",
              },
              {
                q: "Kan ik meerdere ZZP'ers tegelijk contacteren?",
                a: "Basic: 5/maand. Premium: Unlimited.",
              },
              {
                q: "Hoe betaal ik de ZZP'er?",
                a: "Direct aan ZZP'er (factuur/contant). Wij nemen 0% commissie!",
              },
              {
                q: "Verschil Basic vs Premium?",
                a: "Premium = unlimited contacts + priority + analytics. Voor 5+ ZZP'ers/maand.",
              },
            ].map((item, idx) => (
              <div key={idx} className="bg-white/5 p-6 rounded-xl">
                <h3 className="text-white font-bold mb-2 flex items-start gap-2">
                  <span className="text-blue-400">Q:</span> {item.q}
                </h3>
                <p className="text-gray-300 ml-6">
                  <span className="text-cyan-400 font-bold">A:</span> {item.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

// ============================================
// ACCOUNTANTS CONTENT COMPONENT
// ============================================
const AccountantsContent: React.FC = () => {
  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="gradient-glass p-8 rounded-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-purple-500/10 to-indigo-500/10 rounded-full blur-3xl"></div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center shadow-lg">
              <Calculator className="text-white" size={24} />
            </div>
            <h2 className="text-3xl font-bold text-white">
              📊 Boekhouders Panel
            </h2>
          </div>

          <div className="mb-8 rounded-2xl overflow-hidden border-4 border-purple-500/30 shadow-2xl">
            <img
              src="https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&h=400&fit=crop"
              alt="Professional accountant workspace"
              className="w-full h-64 object-cover"
            />
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-4 text-center">
              <p className="text-white font-bold">
                📊 Professionele tools voor boekhouders
              </p>
            </div>
          </div>

          <p className="text-xl text-gray-300 mb-8">
            Een compleet facturatie- en klantenbeheersysteem speciaal voor
            zelfstandige boekhouders en administratiekantoren.
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="gradient-glass p-8 rounded-2xl">
        <h3 className="text-2xl font-bold text-white mb-6">✨ Wat krijg je?</h3>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: FileText,
              title: "Facturatie",
              desc: "Maak professionele facturen in PDF formaat",
            },
            {
              icon: Users,
              title: "Klantenbeheer",
              desc: "CRM met alle klantgegevens op één plek",
            },
            {
              icon: Clock,
              title: "Urenregistratie",
              desc: "Track tijd per project en klant",
            },
            {
              icon: Calculator,
              title: "Rapportages",
              desc: "Financiële overzichten en statistieken",
            },
            {
              icon: TrendingUp,
              title: "Dashboard",
              desc: "Realtime inzicht in je administratie",
            },
            {
              icon: Shield,
              title: "GDPR Compliant",
              desc: "Veilige opslag van klantgegevens",
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className="bg-white/5 p-6 rounded-xl hover:bg-white/10 transition-all"
            >
              <item.icon className="text-purple-400 mb-3" size={32} />
              <h4 className="text-white font-bold mb-2">{item.title}</h4>
              <p className="text-gray-400 text-sm">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="gradient-glass p-8 rounded-2xl">
        <h3 className="text-2xl font-bold text-white mb-6">💰 Abonnementen</h3>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white/5 p-8 rounded-xl border-2 border-gray-700">
            <h4 className="text-2xl font-bold text-white mb-2">Basic</h4>
            <div className="text-4xl font-bold text-gray-400 mb-6">
              €0<span className="text-lg">/maand</span>
            </div>
            <ul className="space-y-3">
              {[
                { text: "Max 5 klanten", included: true },
                { text: "Basis facturatie", included: true },
                { text: "Urenregistratie", included: true },
                { text: "Onbeperkt klanten", included: false },
                { text: "Geavanceerde rapportages", included: false },
              ].map((item, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      item.included ? "bg-green-500" : "bg-red-500/20"
                    }`}
                  >
                    {item.included ? (
                      <Check size={14} className="text-white" />
                    ) : (
                      <span className="text-red-400">✕</span>
                    )}
                  </div>
                  <span
                    className={item.included ? "text-white" : "text-gray-400"}
                  >
                    {item.text}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-gradient-to-br from-purple-500/20 to-indigo-500/20 p-8 rounded-xl border-2 border-purple-500 relative">
            <div className="absolute -top-4 right-4 bg-purple-500 text-white px-4 py-1 rounded-full text-sm font-bold">
              AANBEVOLEN
            </div>
            <h4 className="text-2xl font-bold text-white mb-2">Pro</h4>
            <div className="text-4xl font-bold text-purple-400 mb-6">
              €13<span className="text-lg">/maand</span>
            </div>
            <ul className="space-y-3">
              {[
                "Onbeperkt klanten",
                "Volledige facturatie",
                "Geavanceerde rapportages",
                "PDF export",
                "Priority support",
              ].map((item, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check size={14} className="text-white" />
                  </div>
                  <span className="text-white">{item}</span>
                </li>
              ))}
            </ul>
            <Link
              to="/register/accountant"
              className="mt-6 block w-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-bold py-3 px-6 rounded-lg text-center hover:shadow-lg transition-all"
            >
              Start als Boekhouder
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

// ============================================
// CLEANING COMPANIES CONTENT COMPONENT
// ============================================
const CleaningContent: React.FC = () => {
  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="gradient-glass p-8 rounded-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-teal-500/10 to-cyan-500/10 rounded-full blur-3xl"></div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 flex items-center justify-center shadow-lg">
              <Target className="text-white" size={24} />
            </div>
            <h2 className="text-3xl font-bold text-white">
              🧹 Schoonmaakbedrijven Panel
            </h2>
          </div>

          <div className="mb-8 rounded-2xl overflow-hidden border-4 border-teal-500/30 shadow-2xl">
            <img
              src="https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&h=400&fit=crop"
              alt="Professional cleaning team"
              className="w-full h-64 object-cover"
            />
            <div className="bg-gradient-to-r from-teal-600 to-cyan-600 p-4 text-center">
              <p className="text-white font-bold">
                🧹 Beheer je schoonmaakbedrijf efficiënt
              </p>
            </div>
          </div>

          <p className="text-xl text-gray-300 mb-8">
            Compleet beheersysteem voor schoonmaakbedrijven: projecten, teams,
            klanten en planning op één plek.
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="gradient-glass p-8 rounded-2xl">
        <h3 className="text-2xl font-bold text-white mb-6">✨ Wat krijg je?</h3>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: Briefcase,
              title: "Projectbeheer",
              desc: "Plan en beheer alle schoonmaakprojecten",
            },
            {
              icon: Users,
              title: "Teambeheer",
              desc: "Roosters en medewerkersbeheer",
            },
            {
              icon: Target,
              title: "Klantenbeheer",
              desc: "Alle klantgegevens georganiseerd",
            },
            {
              icon: CheckCircle,
              title: "Takenlijsten",
              desc: "Checklists per project of locatie",
            },
            {
              icon: TrendingUp,
              title: "Statistieken",
              desc: "Prestatie-overzichten en KPIs",
            },
            {
              icon: Clock,
              title: "Planning",
              desc: "Tijdslots en beschikbaarheid",
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className="bg-white/5 p-6 rounded-xl hover:bg-white/10 transition-all"
            >
              <item.icon className="text-teal-400 mb-3" size={32} />
              <h4 className="text-white font-bold mb-2">{item.title}</h4>
              <p className="text-gray-400 text-sm">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="gradient-glass p-8 rounded-2xl">
        <h3 className="text-2xl font-bold text-white mb-6">💰 Abonnementen</h3>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white/5 p-8 rounded-xl border-2 border-gray-700">
            <h4 className="text-2xl font-bold text-white mb-2">Basic</h4>
            <div className="text-4xl font-bold text-gray-400 mb-6">
              €0<span className="text-lg">/maand</span>
            </div>
            <ul className="space-y-3">
              {[
                { text: "Max 3 projecten", included: true },
                { text: "Basis klantenbeheer", included: true },
                { text: "Takenlijsten", included: true },
                { text: "Onbeperkt projecten", included: false },
                { text: "Teambeheer", included: false },
              ].map((item, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      item.included ? "bg-green-500" : "bg-red-500/20"
                    }`}
                  >
                    {item.included ? (
                      <Check size={14} className="text-white" />
                    ) : (
                      <span className="text-red-400">✕</span>
                    )}
                  </div>
                  <span
                    className={item.included ? "text-white" : "text-gray-400"}
                  >
                    {item.text}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-gradient-to-br from-teal-500/20 to-cyan-500/20 p-8 rounded-xl border-2 border-teal-500 relative">
            <div className="absolute -top-4 right-4 bg-teal-500 text-white px-4 py-1 rounded-full text-sm font-bold">
              AANBEVOLEN
            </div>
            <h4 className="text-2xl font-bold text-white mb-2">Premium</h4>
            <div className="text-4xl font-bold text-teal-400 mb-6">
              €13<span className="text-lg">/maand</span>
            </div>
            <ul className="space-y-3">
              {[
                "Onbeperkt projecten",
                "Volledig teambeheer",
                "Geavanceerde planning",
                "Statistieken & rapportages",
                "Priority support",
              ].map((item, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-teal-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check size={14} className="text-white" />
                  </div>
                  <span className="text-white">{item}</span>
                </li>
              ))}
            </ul>
            <Link
              to="/register/cleaning-company"
              className="mt-6 block w-full bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-bold py-3 px-6 rounded-lg text-center hover:shadow-lg transition-all"
            >
              Start als Schoonmaakbedrijf
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

// ============================================
// REGULAR USER CONTENT COMPONENT
// ============================================
const RegularUserContent: React.FC = () => {
  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="gradient-glass p-8 rounded-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-full blur-3xl"></div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center shadow-lg">
              <Users className="text-white" size={24} />
            </div>
            <h2 className="text-3xl font-bold text-white">
              👤 Particulieren Panel
            </h2>
          </div>

          <div className="mb-8 rounded-2xl overflow-hidden border-4 border-orange-500/30 shadow-2xl">
            <img
              src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&h=400&fit=crop"
              alt="Homeowner requesting services"
              className="w-full h-64 object-cover"
            />
            <div className="bg-gradient-to-r from-orange-600 to-red-600 p-4 text-center">
              <p className="text-white font-bold">
                👤 Vind de juiste professional voor jouw klus
              </p>
            </div>
          </div>

          <p className="text-xl text-gray-300 mb-8">
            Ben je particulier en zoek je hulp voor een klus in huis? Plaats een
            aanvraag en krijg reacties van professionals!
          </p>
        </div>
      </section>

      {/* How it works */}
      <section className="gradient-glass p-8 rounded-2xl">
        <h3 className="text-2xl font-bold text-white mb-6">
          🚀 Hoe werkt het?
        </h3>
        <div className="grid md:grid-cols-4 gap-6">
          {[
            {
              step: "1",
              title: "Registreer",
              desc: "Maak gratis een account aan",
            },
            {
              step: "2",
              title: "Plaats Aanvraag",
              desc: "Beschrijf je klus of project",
            },
            {
              step: "3",
              title: "Ontvang Reacties",
              desc: "Professionals reageren op je verzoek",
            },
            {
              step: "4",
              title: "Kies & Boek",
              desc: "Selecteer de beste match",
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className="bg-white/5 p-6 rounded-xl text-center hover:bg-white/10 transition-all"
            >
              <div className="w-12 h-12 rounded-full bg-orange-500 text-white font-bold flex items-center justify-center mb-4 mx-auto text-xl">
                {item.step}
              </div>
              <h4 className="text-white font-bold mb-2">{item.title}</h4>
              <p className="text-gray-400 text-sm">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="gradient-glass p-8 rounded-2xl">
        <h3 className="text-2xl font-bold text-white mb-6">✨ Wat krijg je?</h3>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: MessageCircle,
              title: "Diensten Aanvragen",
              desc: "Plaats klusjes en ontvang reacties",
            },
            {
              icon: Clock,
              title: "Geschiedenis",
              desc: "Bekijk al je eerdere aanvragen",
            },
            {
              icon: Zap,
              title: "Notificaties",
              desc: "Updates over je verzoeken",
            },
            {
              icon: Star,
              title: "Reviews",
              desc: "Beoordeel professionals na afloop",
            },
            {
              icon: Shield,
              title: "Veilig Contact",
              desc: "Communiceer via het platform",
            },
            {
              icon: Search,
              title: "Zoek Professionals",
              desc: "Vind de juiste vakman",
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className="bg-white/5 p-6 rounded-xl hover:bg-white/10 transition-all"
            >
              <item.icon className="text-orange-400 mb-3" size={32} />
              <h4 className="text-white font-bold mb-2">{item.title}</h4>
              <p className="text-gray-400 text-sm">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="gradient-glass p-8 rounded-2xl">
        <h3 className="text-2xl font-bold text-white mb-6">💰 Abonnementen</h3>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white/5 p-8 rounded-xl border-2 border-gray-700">
            <h4 className="text-2xl font-bold text-white mb-2">Gratis</h4>
            <div className="text-4xl font-bold text-gray-400 mb-6">
              €0<span className="text-lg">/maand</span>
            </div>
            <ul className="space-y-3">
              {[
                { text: "1 aanvraag per maand", included: true },
                { text: "Basis contact met professionals", included: true },
                { text: "Aanvraag geschiedenis", included: true },
                { text: "Onbeperkt aanvragen", included: false },
                { text: "Prioriteit behandeling", included: false },
              ].map((item, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      item.included ? "bg-green-500" : "bg-red-500/20"
                    }`}
                  >
                    {item.included ? (
                      <Check size={14} className="text-white" />
                    ) : (
                      <span className="text-red-400">✕</span>
                    )}
                  </div>
                  <span
                    className={item.included ? "text-white" : "text-gray-400"}
                  >
                    {item.text}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 p-8 rounded-xl border-2 border-orange-500 relative">
            <div className="absolute -top-4 right-4 bg-orange-500 text-white px-4 py-1 rounded-full text-sm font-bold">
              MEER VRIJHEID
            </div>
            <h4 className="text-2xl font-bold text-white mb-2">Premium</h4>
            <div className="text-4xl font-bold text-orange-400 mb-6">
              €9,99<span className="text-lg">/maand</span>
            </div>
            <ul className="space-y-3">
              {[
                "Onbeperkt aanvragen",
                "Prioriteit behandeling",
                "Snellere reacties",
                "Uitgebreide profielen zien",
                "Direct contact",
              ].map((item, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check size={14} className="text-white" />
                  </div>
                  <span className="text-white">{item}</span>
                </li>
              ))}
            </ul>
            <Link
              to="/register/regular-user"
              className="mt-6 block w-full bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold py-3 px-6 rounded-lg text-center hover:shadow-lg transition-all"
            >
              Start als Particulier
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ForEmployersPage;
