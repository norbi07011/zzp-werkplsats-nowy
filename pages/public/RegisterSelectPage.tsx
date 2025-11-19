import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Logo } from "../../src/components/common/Logo";

/**
 * RegisterSelectPage - Strona wyboru typu konta do rejestracji
 *
 * FLOW:
 * 1. User klika "Registreer bedrijf" w header → trafia tutaj
 * 2. Wybiera typ konta (Employer, Worker, Accountant, Cleaning)
 * 3. Zostaje przekierowany do odpowiedniego formularza rejestracji
 */
export const RegisterSelectPage = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Decorative blur orbs */}
      <div className="absolute top-20 left-10 w-96 h-96 bg-accent-cyber/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent-techGreen/10 rounded-full blur-3xl"></div>

      <div className="max-w-4xl w-full relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <Logo
              size="lg"
              showText={true}
              className="filter drop-shadow-2xl"
            />
          </div>

          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-cyber rounded-2xl mb-4 shadow-glow-cyber animate-float">
            <svg
              className="w-10 h-10 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
              />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2 font-heading">
            Kies uw accounttype
          </h1>
          <p className="text-neutral-300 text-lg">
            Selecteer het type account dat bij u past
          </p>
        </div>

        {/* Account Type Selection Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Employer Card */}
          <div className="bg-gradient-glass backdrop-blur-md border border-accent-cyber/20 rounded-2xl shadow-3d p-6 hover:border-accent-cyber/50 transition-all hover:scale-105">
            <div className="flex items-start gap-4 mb-4">
              <div className="flex-shrink-0 w-12 h-12 bg-accent-cyber/20 rounded-xl flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-accent-cyber"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white mb-2">
                  🏢 Opdrachtgever
                </h3>
                <p className="text-sm text-neutral-300 mb-4">
                  Registreer uw bedrijf en vind gekwalificeerde ZZP'ers voor uw
                  projecten
                </p>
                <ul className="space-y-2 text-sm text-neutral-400 mb-4">
                  <li className="flex items-center gap-2">
                    <span className="text-accent-cyber">✓</span>
                    Toegang tot database van gecertificeerde professionals
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-accent-cyber">✓</span>
                    Direct contact met ZZP'ers
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-accent-cyber">✓</span>
                    Beheer uw projecten en opdrachten
                  </li>
                </ul>
              </div>
            </div>
            <Link
              to="/register/employer"
              className="block w-full text-center bg-accent-cyber/10 hover:bg-accent-cyber/20 text-accent-cyber font-medium py-3 px-4 rounded-xl transition border border-accent-cyber/30 hover:border-accent-cyber"
            >
              Registreer als Opdrachtgever
            </Link>
          </div>

          {/* Worker Card */}
          <div className="bg-gradient-glass backdrop-blur-md border border-accent-techGreen/20 rounded-2xl shadow-3d p-6 hover:border-accent-techGreen/50 transition-all hover:scale-105">
            <div className="flex items-start gap-4 mb-4">
              <div className="flex-shrink-0 w-12 h-12 bg-accent-techGreen/20 rounded-xl flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-accent-techGreen"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white mb-2">
                  👷 ZZP'er / Vakman
                </h3>
                <p className="text-sm text-neutral-300 mb-4">
                  Solliciteer voor certificering en vind interessante opdrachten
                </p>
                <ul className="space-y-2 text-sm text-neutral-400 mb-4">
                  <li className="flex items-center gap-2">
                    <span className="text-accent-techGreen">✓</span>
                    Gratis account na certificering
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-accent-techGreen">✓</span>
                    Direct bereikbaar voor werkgevers
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-accent-techGreen">✓</span>
                    Verhoog uw geloofwaardigheid met certificaat
                  </li>
                </ul>
              </div>
            </div>
            <Link
              to="/register/worker"
              className="block w-full text-center bg-accent-techGreen/10 hover:bg-accent-techGreen/20 text-accent-techGreen font-medium py-3 px-4 rounded-xl transition border border-accent-techGreen/30 hover:border-accent-techGreen"
            >
              Solliciteren als ZZP'er
            </Link>
            <p className="text-xs text-neutral-500 mt-3 text-center">
              ℹ️ Inloggegevens ontvangt u na het slagen van de praktijktest
            </p>
          </div>

          {/* Accountant Card */}
          <div className="bg-gradient-glass backdrop-blur-md border border-amber-500/20 rounded-2xl shadow-3d p-6 hover:border-amber-500/50 transition-all hover:scale-105">
            <div className="flex items-start gap-4 mb-4">
              <div className="flex-shrink-0 w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-amber-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white mb-2">
                  📊 Księgowy / Boekhouder
                </h3>
                <p className="text-sm text-neutral-300 mb-4">
                  Załóż profil księgowego i oferuj swoje usługi ZZP'erom
                </p>
                <ul className="space-y-2 text-sm text-neutral-400 mb-4">
                  <li className="flex items-center gap-2">
                    <span className="text-amber-400">✓</span>
                    Pozyskuj nowych klientów
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-amber-400">✓</span>
                    Zarządzaj księgowością ZZP'erów
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-amber-400">✓</span>
                    Zwiększ swoją widoczność
                  </li>
                </ul>
              </div>
            </div>
            <Link
              to="/register/accountant"
              className="block w-full text-center bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 font-medium py-3 px-4 rounded-xl transition border border-amber-500/30 hover:border-amber-500"
            >
              Registreer als Boekhouder
            </Link>
          </div>

          {/* Cleaning Company Card */}
          <div className="bg-gradient-glass backdrop-blur-md border border-green-500/20 rounded-2xl shadow-3d p-6 hover:border-green-500/50 transition-all hover:scale-105">
            <div className="flex items-start gap-4 mb-4">
              <div className="flex-shrink-0 w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-green-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white mb-2">
                  🧹 Schoonmaakbedrijf
                </h3>
                <p className="text-sm text-neutral-300 mb-4">
                  Registreer uw schoonmaakbedrijf en vind nieuwe klanten
                </p>
                <ul className="space-y-2 text-sm text-neutral-400 mb-4">
                  <li className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    Toegang tot zakelijke opdrachten
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    Beheer uw team en projecten
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    Facturatie en administratie
                  </li>
                </ul>
              </div>
            </div>
            <Link
              to="/register/cleaning"
              className="block w-full text-center bg-green-500/10 hover:bg-green-500/20 text-green-400 font-medium py-3 px-4 rounded-xl transition border border-green-500/30 hover:border-green-500"
            >
              Registreer als Schoonmaakbedrijf
            </Link>
          </div>
        </div>

        {/* Already have account */}
        <div className="text-center">
          <div className="bg-gradient-glass backdrop-blur-md border border-accent-cyber/20 rounded-xl shadow-3d p-4">
            <p className="text-neutral-300 mb-3">Heeft u al een account?</p>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-accent-cyber hover:text-white font-medium transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                />
              </svg>
              Inloggen
            </Link>
          </div>
        </div>

        {/* Back to Home */}
        <div className="text-center mt-6">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-neutral-400 hover:text-white transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Terug naar home
          </Link>
        </div>
      </div>
    </div>
  );
};
