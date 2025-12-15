import { useState, useEffect } from "react";
import {
  Link,
  useNavigate,
  useLocation,
  useSearchParams,
} from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../contexts/AuthContext";
import { useToasts } from "../../contexts/ToastContext";
import { Logo } from "../../src/components/common/Logo";

export const LoginPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { login, isAuthenticated, user } = useAuth();
  const { success, error: showError } = useToasts();

  // Sprawdź czy to przekierowanie po płatności
  const paymentSuccess = searchParams.get("payment_success") === "true";
  const paymentUserType = searchParams.get("user_type");
  const prefilledEmail = searchParams.get("email");

  // ✅ Handle redirect parameter from URL (e.g., after Stripe payment)
  const redirectUrl = searchParams.get("redirect");

  const [formData, setFormData] = useState({
    email: prefilledEmail || "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load saved login data on component mount
  useEffect(() => {
    // If email was prefilled from URL (payment success), don't override it
    if (prefilledEmail) return;

    const savedEmail = localStorage.getItem("zzp_remember_email");
    const isRemembered = localStorage.getItem("zzp_remember_me") === "true";

    if (savedEmail && isRemembered) {
      setFormData((prev) => ({ ...prev, email: savedEmail }));
      setRememberMe(true);
    }
  }, [prefilledEmail]);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      // ✅ Check for redirect URL parameter FIRST (e.g., from Stripe payment success)
      if (redirectUrl) {
        console.log("[Login] Redirecting to URL param:", redirectUrl);
        navigate(redirectUrl, { replace: true });
        return;
      }

      // ✅ Check for post-payment redirect in localStorage
      const postLoginRedirect = localStorage.getItem("post_login_redirect");
      if (postLoginRedirect) {
        localStorage.removeItem("post_login_redirect");
        navigate(postLoginRedirect, { replace: true });
        return;
      }

      const from =
        (location.state as any)?.from?.pathname || getDefaultRoute(user.role);
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, user, navigate, location, redirectUrl]);

  const getDefaultRoute = (role: string) => {
    switch (role) {
      case "admin":
        return "/admin";
      case "employer":
        return "/employer";
      case "worker":
        return "/worker";
      case "accountant":
        return "/accountant/dashboard";
      case "cleaning_company":
        return "/cleaning-company"; // ✅ FIXED: dedicated route for cleaning companies
      case "regular_user":
        return "/regular-user"; // ✅ Dashboard dla Regular User
      default:
        return "/";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // WHY: validate before calling Supabase
    const emailTrimmed = formData.email.trim();
    const passwordTrimmed = formData.password.trim();

    // Email validation
    if (!emailTrimmed) {
      setError("E-mailadres is verplicht");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailTrimmed)) {
      setError("Voer een geldig e-mailadres in");
      return;
    }

    // Password validation
    if (!passwordTrimmed) {
      setError("Wachtwoord is verplicht");
      return;
    }

    if (passwordTrimmed.length < 6) {
      setError("Wachtwoord moet minimaal 6 tekens bevatten");
      return;
    }

    // WHY: block Stripe on invalid login - only proceed with auth after validation
    setIsLoading(true);

    try {
      await login(emailTrimmed, passwordTrimmed);

      // Save email if "Remember Me" is checked
      if (rememberMe) {
        localStorage.setItem("zzp_remember_email", emailTrimmed);
        localStorage.setItem("zzp_remember_me", "true");
      } else {
        localStorage.removeItem("zzp_remember_email");
        localStorage.removeItem("zzp_remember_me");
      }

      success("✅ Succesvol ingelogd! U wordt doorgestuurd...");
      setIsLoading(false); // Reset loading after successful login
      // Navigation will be handled by useEffect when isAuthenticated changes
      // TODO: Subscription check and Stripe redirect (if needed) should happen AFTER successful login
      // in a separate flow - check user.subscriptionStatus in useEffect or dashboard component
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Logowanie nie powiodło się";
      setError(errorMessage);
      showError(errorMessage);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Decorative blur orbs */}
      <div className="absolute top-20 left-10 w-96 h-96 bg-accent-cyber/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent-techGreen/10 rounded-full blur-3xl"></div>

      <div className="max-w-md w-full relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-white rounded-2xl mb-4 shadow-glow-cyber animate-float p-2">
            <img
              src="/Public/LOGOEIFEO.jpg"
              alt="ZZP Werkplaats"
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2 font-heading">
            Welkom terug
          </h1>
          <p className="text-neutral-300">
            Log in op uw ZZP Werkplaats account
          </p>
        </div>

        {/* Main Login Card */}
        <div className="bg-gradient-glass backdrop-blur-md border border-accent-cyber/20 rounded-2xl shadow-3d p-8">
          {/* ✅ Payment Success Message */}
          {paymentSuccess && (
            <div className="mb-6 bg-green-50 border-l-4 border-green-500 rounded-r-lg p-4 flex items-start gap-3">
              <svg
                className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div className="flex-1">
                <p className="text-sm font-bold text-green-800">
                  🎉 Płatność zakończona sukcesem!
                </p>
                <p className="text-sm text-green-700 mt-1">
                  Twoja subskrypcja Premium została aktywowana. Zaloguj się, aby
                  uzyskać dostęp do panelu.
                </p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-500 rounded-r-lg p-4 flex items-start gap-3 animate-shake">
              <svg
                className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-red-500 hover:text-red-700"
                aria-label="Sluit foutmelding"
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6" autoComplete="on">
            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-white mb-2"
              >
                E-mailadres
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    className="h-5 w-5 text-accent-cyber"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                    />
                  </svg>
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  disabled={isLoading}
                  autoComplete="username"
                  className="block w-full pl-10 pr-3 py-3 bg-primary-navy/50 border border-accent-cyber/30 text-white rounded-xl focus:ring-2 focus:ring-accent-cyber focus:border-accent-cyber disabled:opacity-50 disabled:cursor-not-allowed transition placeholder-neutral-500"
                  placeholder="uw.email@voorbeeld.nl"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-white mb-2"
              >
                Wachtwoord
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    className="h-5 w-5 text-accent-cyber"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  disabled={isLoading}
                  autoComplete="current-password"
                  className="block w-full pl-10 pr-12 py-3 bg-primary-navy/50 border border-accent-cyber/30 text-white rounded-xl focus:ring-2 focus:ring-accent-cyber focus:border-accent-cyber disabled:opacity-50 disabled:cursor-not-allowed transition placeholder-neutral-500"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-accent-cyber hover:text-accent-techGreen disabled:opacity-50 transition"
                >
                  {showPassword ? (
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={isLoading}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                />
                <span className="ml-2 text-sm text-gray-700">Onthoud mij</span>
              </label>
              <Link
                to="/wachtwoord-vergeten"
                className="text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                Wachtwoord vergeten?
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-gradient-cyber hover:shadow-glow-cyber text-white font-semibold py-4 px-6 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed shadow-glow-cyber hover:scale-105 transform disabled:transform-none"
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span>Inloggen...</span>
                </>
              ) : (
                <>
                  <span>Inloggen</span>
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
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Register Links */}
        <div className="mt-6 space-y-3">
          <div className="bg-gradient-glass backdrop-blur-md border border-accent-cyber/20 rounded-xl shadow-3d p-4">
            <p className="text-sm text-neutral-300 mb-2">
              <span className="font-semibold text-accent-cyber">
                Opdrachtgever?
              </span>{" "}
              Registreer uw bedrijf
            </p>
            <Link
              to="/register/employer"
              className="block w-full text-center bg-accent-cyber/10 hover:bg-accent-cyber/20 text-accent-cyber font-medium py-2.5 px-4 rounded-xl transition border border-accent-cyber/30 hover:border-accent-cyber"
            >
              Registreer als Opdrachtgever
            </Link>
          </div>

          <div className="bg-gradient-glass backdrop-blur-md border border-accent-techGreen/20 rounded-xl shadow-3d p-4">
            <p className="text-sm text-neutral-300 mb-2">
              <span className="font-semibold text-accent-techGreen">
                ZZP'er?
              </span>{" "}
              Solliciteer via ons formulier
            </p>
            <Link
              to="/register/worker"
              className="block w-full text-center bg-accent-techGreen/10 hover:bg-accent-techGreen/20 text-accent-techGreen font-medium py-2.5 px-4 rounded-xl transition border border-accent-techGreen/30 hover:border-accent-techGreen"
            >
              Solliciteren als ZZP'er
            </Link>
            <p className="text-xs text-gray-500 mt-2">
              ℹ️ Inloggegevens ontvangt u na het slagen van de praktijktest
            </p>
          </div>

          <div className="bg-gradient-glass backdrop-blur-md border border-amber-500/20 rounded-xl shadow-3d p-4">
            <p className="text-sm text-neutral-300 mb-2">
              <span className="font-semibold text-amber-400">Księgowy?</span>{" "}
              Załóż profil księgowego
            </p>
            <Link
              to="/register/accountant"
              className="block w-full text-center bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 font-medium py-2.5 px-4 rounded-xl transition border border-amber-500/30 hover:border-amber-500"
            >
              Registreer als Księgowy / Boekhouder
            </Link>
          </div>

          <div className="bg-gradient-glass backdrop-blur-md border border-green-500/20 rounded-xl shadow-3d p-4">
            <p className="text-sm text-neutral-300 mb-2">
              <span className="font-semibold text-green-400">
                🧹 Firma sprzątająca?
              </span>{" "}
              Zarejestruj swoją firmę
            </p>
            <Link
              to="/register/cleaning"
              className="block w-full text-center bg-green-500/10 hover:bg-green-500/20 text-green-400 font-medium py-2.5 px-4 rounded-xl transition border border-green-500/30 hover:border-green-500"
            >
              Registreer als Schoonmaakbedrijf
            </Link>
          </div>
        </div>

        {/* Back to Home */}
        <div className="text-center mt-6">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
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

      {/* Custom CSS for shake animation */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
};
