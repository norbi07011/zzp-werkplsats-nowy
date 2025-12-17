import React from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Logo } from "../../src/components/common/Logo";

export const AboutPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="bg-primary-dark">
      {/* Hero Section */}
      <section className="relative bg-gradient-hero text-white py-24 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
        <div className="absolute top-10 left-10 w-96 h-96 bg-accent-cyber/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-accent-techGreen/10 rounded-full blur-3xl"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <Logo size="lg" showText={true} />
          </div>

          <div className="inline-block bg-accent-cyber/20 backdrop-blur-md border border-accent-cyber/30 px-6 py-2 rounded-full text-sm font-bold mb-6">
            🏗️ DE SLIMSTE MARKETPLACE VOOR BOUW ZZP'ERS
          </div>
          <h1 className="text-6xl md:text-7xl font-bold mb-6 font-heading">
            {t("about.hero.title", "Over ZZP Werkplaats")}
          </h1>
          <p className="text-2xl text-neutral-300 max-w-3xl mx-auto leading-relaxed">
            {t(
              "about.hero.subtitle",
              "Wij verbinden bouwprofessionals met opdrachtgevers via de meest transparante, eerlijke en innovatieve platform in Nederland. Geen commissie. Geen gedoe. Alleen resultaat."
            )}
          </p>
        </div>
      </section>

      {/* Our Mission */}
      <section className="py-24 bg-primary-navy/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-5xl font-bold mb-12 text-center text-white font-heading">
            {t("about.mission.title", "Onze Missie")}
          </h2>

          {/* Real Photo - Mission & Team */}
          <div className="mb-12 grid md:grid-cols-2 gap-6">
            <div className="rounded-2xl overflow-hidden border-4 border-accent-cyber/30 shadow-2xl transform hover:scale-105 transition-transform">
              <img
                src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=600&h=400&fit=crop"
                alt="Team working together on mission"
                className="w-full h-64 object-cover"
              />
              <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-4 text-center">
                <p className="text-white font-bold">
                  🎯 Onze missie: Verbinden en versterken!
                </p>
              </div>
            </div>

            <div className="rounded-2xl overflow-hidden border-4 border-accent-techGreen/30 shadow-2xl transform hover:scale-105 transition-transform">
              <img
                src="https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&h=400&fit=crop"
                alt="Professional construction workers"
                className="w-full h-64 object-cover"
              />
              <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-4 text-center">
                <p className="text-white font-bold">
                  🔨 Voor alle bouwprofessionals!
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-glass backdrop-blur-md rounded-3xl p-10 md:p-16 border border-accent-cyber/20 shadow-3d">
            <p className="text-2xl text-neutral-300 leading-relaxed mb-8 text-center">
              <span className="text-white font-bold">ZZP Werkplaats</span> maakt
              het{" "}
              <span className="text-accent-techGreen font-bold">eenvoudig</span>{" "}
              voor bouwprofessionals om opdrachten te vinden en voor bedrijven
              om de juiste mensen te vinden.
              <span className="text-accent-cyber font-bold">
                {" "}
                Zonder tussenpersonen. Zonder hoge commissies. Zonder
                onduidelijkheid.
              </span>
            </p>

            <div className="grid md:grid-cols-3 gap-6 mt-12">
              <div className="text-center p-6 bg-accent-techGreen/10 rounded-xl border border-accent-techGreen/30">
                <div className="text-5xl mb-4">🎯</div>
                <h3 className="text-xl font-bold text-white mb-2">
                  Transparantie
                </h3>
                <p className="text-neutral-200">
                  Alle prijzen zichtbaar. Geen verborgen kosten. Eerlijke
                  voorwaarden.
                </p>
              </div>

              <div className="text-center p-6 bg-accent-cyber/10 rounded-xl border border-accent-cyber/30">
                <div className="text-5xl mb-4">🤝</div>
                <h3 className="text-xl font-bold text-white mb-2">
                  Direct Contact
                </h3>
                <p className="text-neutral-200">
                  Geen tussenpersonen. Opdrachtgevers en ZZP'ers praten
                  rechtstreeks.
                </p>
              </div>

              <div className="text-center p-6 bg-yellow-500/10 rounded-xl border border-yellow-500/30">
                <div className="text-5xl mb-4">💰</div>
                <h3 className="text-xl font-bold text-white mb-2">
                  0% Commissie
                </h3>
                <p className="text-neutral-200">
                  Alleen vaste maandprijs. Geen percentage van je opdrachten.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Comparison Table */}
      <section className="py-24 bg-primary-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-5xl font-bold mb-6 text-center text-white font-heading">
            Hoe We Jouw Leven Makkelijker Maken
          </h2>
          <p className="text-xl text-neutral-200 text-center mb-16 max-w-3xl mx-auto">
            Of je nu ZZP'er of opdrachtgever bent - wij hebben alles
            geautomatiseerd, vereenvoudigd en transparant gemaakt.
          </p>

          {/* Real Photo - Benefits Showcase */}
          <div className="mb-12 rounded-2xl overflow-hidden border-4 border-purple-500/30 shadow-2xl transform hover:scale-105 transition-transform">
            <img
              src="https://images.unsplash.com/photo-1556761175-b413da4baf72?w=900&h=500&fit=crop"
              alt="Team celebrating success and benefits"
              className="w-full h-96 object-cover"
            />
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-center">
              <p className="text-white font-bold text-xl">
                🎉 Voor iedereen: Eenvoudiger, Sneller, Transparanter!
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Voor ZZP'ers */}
            <div className="bg-gradient-glass backdrop-blur-md rounded-3xl p-8 border border-accent-techGreen/30 hover:border-accent-techGreen transition-all">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 bg-gradient-success rounded-2xl flex items-center justify-center text-3xl shadow-glow-success">
                  🔨
                </div>
                <div>
                  <h3 className="text-3xl font-bold text-white">
                    Voor ZZP'ers
                  </h3>
                  <p className="text-accent-techGreen font-medium">
                    Meer opdrachten, minder gedoe
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 bg-accent-techGreen/10 rounded-xl">
                  <div className="w-6 h-6 bg-accent-techGreen rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg
                      className="w-4 h-4 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-white mb-1">
                      Eenvoudige Registratie (5 minuten)
                    </h4>
                    <p className="text-neutral-200 text-sm">
                      Geen ingewikkelde formulieren. Geen wachten op
                      goedkeuring. Direct live na betaling.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-accent-techGreen/10 rounded-xl">
                  <div className="w-6 h-6 bg-accent-techGreen rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg
                      className="w-4 h-4 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-white mb-1">
                      Team Configuratie
                    </h4>
                    <p className="text-neutral-200 text-sm">
                      Werk solo, in duo, of met je team (2-10 personen). Toon je
                      gecombineerde kracht!
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-accent-techGreen/10 rounded-xl">
                  <div className="w-6 h-6 bg-accent-techGreen rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg
                      className="w-4 h-4 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-white mb-1">
                      "Skoczek" On-Demand Toggle
                    </h4>
                    <p className="text-neutral-200 text-sm">
                      Zet je beschikbaarheid AAN wanneer je vrij bent voor
                      spoedklussen. Premium opdrachtgevers zien je direct!
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-accent-techGreen/10 rounded-xl">
                  <div className="w-6 h-6 bg-accent-techGreen rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg
                      className="w-4 h-4 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-white mb-1">
                      0% Commissie op Opdrachten
                    </h4>
                    <p className="text-neutral-200 text-sm">
                      Andere platforms nemen 10-25%. Wij €0. Je betaalt alleen
                      €13/maand voor platformtoegang.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-accent-techGreen/10 rounded-xl">
                  <div className="w-6 h-6 bg-accent-techGreen rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg
                      className="w-4 h-4 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-white mb-1">
                      Optioneel ZZP Examen (€230)
                    </h4>
                    <p className="text-neutral-200 text-sm">
                      Toon je expertise met officieel certificaat. Inclusief 1
                      jaar Premium gratis!
                    </p>
                  </div>
                </div>
              </div>

              <Link
                to="/register/worker"
                className="mt-8 block text-center bg-gradient-success text-white px-8 py-4 rounded-xl font-bold text-lg hover:scale-105 transition-transform shadow-glow-success"
              >
                Start als ZZP'er →
              </Link>
            </div>

            {/* Voor Opdrachtgevers */}
            <div className="bg-gradient-glass backdrop-blur-md rounded-3xl p-8 border border-accent-cyber/30 hover:border-accent-cyber transition-all">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 bg-gradient-cyber rounded-2xl flex items-center justify-center text-3xl shadow-glow-cyber">
                  🏢
                </div>
                <div>
                  <h3 className="text-3xl font-bold text-white">
                    Voor Opdrachtgevers
                  </h3>
                  <p className="text-accent-cyber font-medium">
                    Vind snel de juiste professional
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 bg-accent-cyber/10 rounded-xl">
                  <div className="w-6 h-6 bg-accent-cyber rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg
                      className="w-4 h-4 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-white mb-1">
                      Krachtige Zoekmachine
                    </h4>
                    <p className="text-neutral-200 text-sm">
                      Filter op locatie, specialisatie, ervaring, teamgrootte,
                      beschikbaarheid. Vind exact wie je nodig hebt.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-accent-cyber/10 rounded-xl">
                  <div className="w-6 h-6 bg-accent-cyber rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg
                      className="w-4 h-4 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-white mb-1">
                      Transparante Prijzen
                    </h4>
                    <p className="text-neutral-200 text-sm">
                      Elk profiel toont direct het uurloon. Geen verrassingen
                      achteraf. Je weet precies waar je aan toe bent.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-accent-cyber/10 rounded-xl">
                  <div className="w-6 h-6 bg-accent-cyber rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg
                      className="w-4 h-4 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-white mb-1">
                      Vind Complete Teams
                    </h4>
                    <p className="text-neutral-200 text-sm">
                      Groot project? Zoek ZZP'ers met teams (2-10 man). Eén
                      contact, volledige crew!
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-accent-cyber/10 rounded-xl">
                  <div className="w-6 h-6 bg-accent-cyber rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg
                      className="w-4 h-4 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-white mb-1">
                      ⚡ Spoedklussen? "Skoczek" Filter!
                    </h4>
                    <p className="text-neutral-200 text-sm">
                      Iemand uitgevallen? Filter op "Beschikbaar Nu" en vind
                      ZZP'ers die vandaag kunnen starten.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-accent-cyber/10 rounded-xl">
                  <div className="w-6 h-6 bg-accent-cyber rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg
                      className="w-4 h-4 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-white mb-1">
                      Direct Contact (Geen Middleman)
                    </h4>
                    <p className="text-neutral-200 text-sm">
                      Praat rechtstreeks met ZZP'ers. Maak afspraken zonder onze
                      tussenkomst. Jouw project, jouw regels.
                    </p>
                  </div>
                </div>
              </div>

              <Link
                to="/register/employer"
                className="mt-8 block text-center bg-gradient-cyber text-white px-8 py-4 rounded-xl font-bold text-lg hover:scale-105 transition-transform shadow-glow-cyber"
              >
                Start als Opdrachtgever →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ZZP Exam Certificate Section */}
      <section className="py-24 bg-gradient-to-br from-yellow-500/10 via-primary-navy/20 to-amber-600/10 relative overflow-hidden">
        <div className="absolute top-20 left-10 w-96 h-96 bg-yellow-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <div className="inline-block bg-gradient-to-r from-yellow-400 to-amber-500 text-yellow-950 px-6 py-2 rounded-full font-bold text-sm mb-6 shadow-lg">
              📜 OPTIONELE CERTIFICERING
            </div>
            <h2 className="text-5xl font-bold text-white mb-6 font-heading">
              ZZP Examen & Certificaat
            </h2>
            <p className="text-xl text-neutral-300 max-w-3xl mx-auto">
              Wil je je expertise officieel laten erkennen? Doe ons ZZP Examen
              en krijg een officieel certificaat!
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 items-center">
            {/* Left - What is it */}
            <div className="bg-gradient-glass backdrop-blur-md rounded-3xl p-10 border border-yellow-500/30">
              <h3 className="text-3xl font-bold text-white mb-6">
                Wat is het ZZP Examen?
              </h3>

              {/* Real Photo - Exam & Certificate */}
              <div className="mb-6 rounded-xl overflow-hidden border-2 border-yellow-500/30 shadow-xl">
                <img
                  src="https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600&h=300&fit=crop"
                  alt="Professional exam preparation"
                  className="w-full h-48 object-cover"
                />
              </div>

              <p className="text-neutral-300 mb-6 leading-relaxed">
                Het ZZP Examen is een{" "}
                <strong className="text-white">optioneel</strong> kennistoets
                die je ZZP-expertise bewijst. Niet verplicht, maar ideaal als je
                je wilt onderscheiden!
              </p>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-yellow-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-yellow-400">📝</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-white mb-1">
                      Online Examen (60 vragen)
                    </h4>
                    <p className="text-neutral-200 text-sm">
                      Bouwregelgeving, veiligheid, materiaalkennis, calculatie
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-yellow-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-yellow-400">⏱️</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-white mb-1">
                      90 minuten tijd
                    </h4>
                    <p className="text-neutral-200 text-sm">
                      Rustig nadenken, geen stress
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-yellow-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-yellow-400">✅</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-white mb-1">
                      Slagingspercentage 70%
                    </h4>
                    <p className="text-neutral-200 text-sm">
                      Haalbaar voor ervaren professionals
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-yellow-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-yellow-400">📜</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-white mb-1">
                      Officieel PDF Certificaat
                    </h4>
                    <p className="text-neutral-200 text-sm">
                      Met uniek nummer, direct downloadbaar
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right - Pricing & Benefits */}
            <div className="bg-gradient-to-br from-yellow-500/20 to-amber-600/20 rounded-3xl p-10 border-2 border-yellow-500 shadow-glow-premium">
              <div className="text-center mb-8">
                <div className="text-6xl font-bold text-white mb-2">€230</div>
                <p className="text-yellow-400 font-medium">
                  Eenmalig - Levenslang geldig
                </p>
              </div>

              <div className="bg-yellow-950/30 rounded-2xl p-6 mb-6">
                <h4 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <span>🎁</span> Wat krijg je ervoor?
                </h4>
                <ul className="space-y-3">
                  <li className="flex items-center gap-2 text-white">
                    <span className="text-yellow-400">✓</span>
                    <span>
                      Officieel <strong>ZZP Certificaat PDF</strong>
                    </span>
                  </li>
                  <li className="flex items-center gap-2 text-white">
                    <span className="text-yellow-400">✓</span>
                    <span>
                      <strong>1 jaar Premium gratis</strong> (€156 waarde!)
                    </span>
                  </li>
                  <li className="flex items-center gap-2 text-white">
                    <span className="text-yellow-400">✓</span>
                    <span>
                      Speciale <strong>🏆 Gecertificeerd</strong> badge in
                      profiel
                    </span>
                  </li>
                  <li className="flex items-center gap-2 text-white">
                    <span className="text-yellow-400">✓</span>
                    <span>Hogere ranking in zoekresultaten</span>
                  </li>
                  <li className="flex items-center gap-2 text-white">
                    <span className="text-yellow-400">✓</span>
                    <span>Direct te delen met opdrachtgevers</span>
                  </li>
                </ul>
              </div>

              <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 mb-6">
                <p className="text-green-400 text-sm text-center font-medium">
                  💡 <strong>Tip:</strong> Met 1 jaar gratis Premium (€156) kost
                  het examen eigenlijk maar <strong>€74</strong>!
                </p>
              </div>

              <Link
                to="/register/worker"
                className="block text-center bg-gradient-to-r from-yellow-400 to-amber-500 text-yellow-950 px-8 py-4 rounded-xl font-bold text-lg hover:scale-105 transition-transform shadow-2xl"
              >
                Start met Examen →
              </Link>

              <p className="text-neutral-200 text-sm text-center mt-4">
                Eerst registreren, dan kun je examen afleggen
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section - 2 Teams */}
      <section className="py-24 bg-primary-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-block bg-gradient-to-r from-primary-gold to-yellow-400 text-primary-navy px-6 py-2 rounded-full font-bold text-sm mb-6 shadow-lg">
              👥 ONS TEAM
            </div>
            <h2 className="text-5xl font-bold text-white mb-6 font-heading">
              Wie Maakt Dit Mogelijk?
            </h2>
            <p className="text-xl text-neutral-300 max-w-3xl mx-auto">
              Twee gespecialiseerde teams werken samen om de beste
              ZZP-marktplaats van Nederland te creëren.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Team 1: Platform Management */}
            <div className="bg-gradient-glass backdrop-blur-md rounded-3xl p-10 border border-primary-gold/30 hover:border-primary-gold/60 transition-all">
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-gradient-to-br from-primary-gold to-yellow-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-glow-premium">
                  <span className="text-4xl">⚙️</span>
                </div>
                <h3 className="text-3xl font-bold text-white mb-2">
                  Platform Management
                </h3>
                <p className="text-neutral-200">
                  Ontwikkeling, UX & Klantenservice
                </p>
              </div>

              <div className="space-y-6">
                <div className="bg-primary-navy/50 rounded-2xl p-6 border border-primary-gold/20">
                  <h4 className="text-xl font-bold text-white mb-3">
                    Wat doen zij?
                  </h4>
                  <ul className="space-y-2 text-neutral-300">
                    <li className="flex items-start gap-2">
                      <span className="text-primary-gold mt-1">•</span>
                      <span>Platform ontwikkeling & technische onderhoud</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary-gold mt-1">•</span>
                      <span>UX/UI design voor optimale gebruikerservaring</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary-gold mt-1">•</span>
                      <span>Klantenservice voor ZZP'ers en opdrachtgevers</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary-gold mt-1">•</span>
                      <span>Betalingen, abonnementen & administratie</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary-gold mt-1">•</span>
                      <span>Marketing & platformgroei</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-gradient-to-r from-primary-gold/10 to-yellow-500/10 rounded-xl p-4 border border-primary-gold/30">
                  <p className="text-sm text-neutral-300 text-center">
                    <strong className="text-white">Dagelijks bereikbaar</strong>{" "}
                    via chat, e-mail en telefoon
                  </p>
                </div>
              </div>
            </div>

            {/* Team 2: Experience Verification */}
            <div className="bg-gradient-glass backdrop-blur-md rounded-3xl p-10 border border-blue-500/30 hover:border-blue-500/60 transition-all">
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-glow-premium">
                  <span className="text-4xl">🔍</span>
                </div>
                <h3 className="text-3xl font-bold text-white mb-2">
                  Verificatie Team
                </h3>
                <p className="text-neutral-200">
                  Kwaliteitscontrole & Certificering
                </p>
              </div>

              <div className="space-y-6">
                <div className="bg-primary-navy/50 rounded-2xl p-6 border border-blue-500/20">
                  <h4 className="text-xl font-bold text-white mb-3">
                    Wat doen zij?
                  </h4>
                  <ul className="space-y-2 text-neutral-300">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-400 mt-1">•</span>
                      <span>Controle van nieuwe ZZP-registraties</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-400 mt-1">•</span>
                      <span>Verificatie van portfolio's en certificaten</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-400 mt-1">•</span>
                      <span>Beheer van ZZP Examen afnames</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-400 mt-1">•</span>
                      <span>Uitgifte van officiële certificaten</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-400 mt-1">•</span>
                      <span>Klachtafhandeling & fraudepreventie</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-gradient-to-r from-blue-500/10 to-cyan-400/10 rounded-xl p-4 border border-blue-500/30">
                  <p className="text-sm text-neutral-300 text-center">
                    <strong className="text-white">Reactietijd:</strong> Nieuwe
                    profielen binnen 24 uur gecontroleerd
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Team Stats */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-gradient-glass backdrop-blur-md rounded-2xl p-6 text-center border border-white/10">
              <div className="text-4xl font-bold text-primary-gold mb-2">
                12+
              </div>
              <p className="text-neutral-200 text-sm">Teamleden</p>
            </div>
            <div className="bg-gradient-glass backdrop-blur-md rounded-2xl p-6 text-center border border-white/10">
              <div className="text-4xl font-bold text-primary-gold mb-2">
                24/7
              </div>
              <p className="text-neutral-200 text-sm">Platform Online</p>
            </div>
            <div className="bg-gradient-glass backdrop-blur-md rounded-2xl p-6 text-center border border-white/10">
              <div className="text-4xl font-bold text-primary-gold mb-2">
                &lt;24u
              </div>
              <p className="text-neutral-200 text-sm">Verificatie Tijd</p>
            </div>
            <div className="bg-gradient-glass backdrop-blur-md rounded-2xl p-6 text-center border border-white/10">
              <div className="text-4xl font-bold text-primary-gold mb-2">
                100%
              </div>
              <p className="text-neutral-200 text-sm">Nederlands Team</p>
            </div>
          </div>

          {/* Real Photo - Team */}
          <div className="mt-12 rounded-2xl overflow-hidden border-4 border-blue-500/30 shadow-2xl transform hover:scale-105 transition-transform">
            <img
              src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=900&h=500&fit=crop"
              alt="Professional team working together"
              className="w-full h-96 object-cover"
            />
            <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-6 text-center">
              <p className="text-white font-bold text-xl">
                👥 Ons team staat voor je klaar - altijd!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Security & Privacy - Enhanced */}
      <section className="py-24 bg-gradient-to-br from-primary-navy via-primary-dark to-primary-navy">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-block bg-gradient-to-r from-green-400 to-emerald-500 text-green-950 px-6 py-2 rounded-full font-bold text-sm mb-6 shadow-lg">
              🔒 VEILIGHEID & PRIVACY
            </div>
            <h2 className="text-5xl font-bold text-white mb-6 font-heading">
              Jouw Data Is Veilig
            </h2>
            <p className="text-xl text-neutral-300 max-w-3xl mx-auto">
              We nemen beveiliging serieus. Alle gegevens worden beschermd
              volgens de strengste normen.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* GDPR/AVG */}
            <div className="bg-gradient-glass backdrop-blur-md rounded-3xl p-8 border border-green-500/30 hover:border-green-500/60 transition-all group">
              <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-glow-premium group-hover:scale-110 transition-transform">
                <svg
                  className="w-8 h-8 text-green-950"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4 text-center">
                AVG/GDPR Compliant
              </h3>
              <p className="text-neutral-300 leading-relaxed text-center">
                Al uw persoonlijke gegevens worden veilig opgeslagen volgens de{" "}
                <strong className="text-white">
                  Algemene Verordening Gegevensbescherming
                </strong>
                . U heeft volledige controle over uw data en kunt deze op elk
                moment inzien, wijzigen of verwijderen.
              </p>
              <div className="mt-6 pt-6 border-t border-white/10">
                <ul className="space-y-2 text-sm text-neutral-200">
                  <li className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    <span>Data minimalisatie principe</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    <span>Recht op inzage en verwijdering</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    <span>Transparante privacyverklaring</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Encryption */}
            <div className="bg-gradient-glass backdrop-blur-md rounded-3xl p-8 border border-blue-500/30 hover:border-blue-500/60 transition-all group">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-glow-premium group-hover:scale-110 transition-transform">
                <svg
                  className="w-8 h-8 text-blue-950"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4 text-center">
                Encryptie & SSL
              </h3>
              <p className="text-neutral-300 leading-relaxed text-center">
                Alle communicatie is versleuteld met{" "}
                <strong className="text-white">SSL/TLS certificaten</strong>.
                Wachtwoorden worden gehashed met bcrypt en persoonlijke
                documenten worden veilig opgeslagen in encrypted storage.
              </p>
              <div className="mt-6 pt-6 border-t border-white/10">
                <ul className="space-y-2 text-sm text-neutral-200">
                  <li className="flex items-center gap-2">
                    <span className="text-blue-400">✓</span>
                    <span>256-bit SSL/TLS encryptie</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-blue-400">✓</span>
                    <span>Bcrypt password hashing</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-blue-400">✓</span>
                    <span>Secure file storage</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Audit Log */}
            <div className="bg-gradient-glass backdrop-blur-md rounded-3xl p-8 border border-purple-500/30 hover:border-purple-500/60 transition-all group">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-glow-premium group-hover:scale-110 transition-transform">
                <svg
                  className="w-8 h-8 text-purple-950"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                  <path
                    fillRule="evenodd"
                    d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4 text-center">
                Audit Log & Transparantie
              </h3>
              <p className="text-neutral-300 leading-relaxed text-center">
                Alle belangrijke acties worden{" "}
                <strong className="text-white">automatisch gelogd</strong> voor
                transparantie en veiligheid. Admins kunnen niet ongemerkt
                certificaten afgeven of data wijzigen - alles wordt bijgehouden.
              </p>
              <div className="mt-6 pt-6 border-t border-white/10">
                <ul className="space-y-2 text-sm text-neutral-200">
                  <li className="flex items-center gap-2">
                    <span className="text-purple-400">✓</span>
                    <span>Alle admin acties gelogd</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-purple-400">✓</span>
                    <span>Certificaat uitgifte traceerbaar</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-purple-400">✓</span>
                    <span>Login pogingen gemonitord</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Security Stats */}
          <div className="mt-16 bg-gradient-glass backdrop-blur-md rounded-3xl p-8 border border-white/10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-4xl font-bold text-green-400 mb-2">
                  100%
                </div>
                <p className="text-neutral-200 text-sm">GDPR Compliant</p>
              </div>
              <div>
                <div className="text-4xl font-bold text-blue-400 mb-2">
                  256-bit
                </div>
                <p className="text-neutral-200 text-sm">SSL Encryptie</p>
              </div>
              <div>
                <div className="text-4xl font-bold text-purple-400 mb-2">
                  24/7
                </div>
                <p className="text-neutral-200 text-sm">Security Monitoring</p>
              </div>
              <div>
                <div className="text-4xl font-bold text-yellow-400 mb-2">0</div>
                <p className="text-neutral-200 text-sm">Data Lekken</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
