import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useToasts } from "../../contexts/ToastContext";
import { Logo } from "../../src/components/common/Logo";
import { supabase } from "../../src/lib/supabase";

/**
 * RegisterRegularUserPage - Rejestracja dla zwykłych użytkowników (nie ZZP'erów)
 *
 * FLOW:
 * 1. User wypełnia prosty formularz (imię, nazwisko, email, hasło, miasto)
 * 2. Tworzone jest konto auth.users + profiles.role='regular_user'
 * 3. Tworzone jest wpis w tabeli regular_users (z freemium: 3 darmowe zlecenia/miesiąc)
 * 4. Redirect do dashboard zwykłego użytkownika
 *
 * FREEMIUM MODEL:
 * - FREE: 3 zlecenia/miesiąc (requests_this_month < 3)
 * - PREMIUM: €9.99/miesiąc = unlimited zlecenia
 */
export const RegisterRegularUserPage = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { success, error: showError } = useToasts();

  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    city: "",
    postalCode: "",
    password: "",
    confirmPassword: "",
    agreedToTerms: false,
  });

  // Password strength calculator
  const calculatePasswordStrength = (
    password: string
  ): { score: number; label: string; color: string } => {
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;

    if (score <= 2) return { score, label: "Zwak", color: "bg-red-500" };
    if (score <= 4) return { score, label: "Gemiddeld", color: "bg-amber-500" };
    return { score, label: "Sterk", color: "bg-green-500" };
  };

  const passwordStrength = calculatePasswordStrength(formData.password);

  // Validation
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim())
      newErrors.firstName = "Voornaam is verplicht";
    if (!formData.lastName.trim())
      newErrors.lastName = "Achternaam is verplicht";

    if (!formData.email.trim()) {
      newErrors.email = "E-mail is verplicht";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Ongeldig e-mailadres";
    }

    if (!formData.city.trim()) newErrors.city = "Stad is verplicht";
    if (!formData.postalCode.trim())
      newErrors.postalCode = "Postcode is verplicht";

    if (!formData.password) {
      newErrors.password = "Wachtwoord is verplicht";
    } else if (formData.password.length < 8) {
      newErrors.password = "Wachtwoord moet minimaal 8 tekens bevatten";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Wachtwoorden komen niet overeen";
    }

    if (!formData.agreedToTerms) {
      newErrors.agreedToTerms = "U moet akkoord gaan met de voorwaarden";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      showError("Vul alle verplichte velden correct in");
      return;
    }

    setIsLoading(true);

    try {
      // 1. Register user with AuthContext (creates auth.users + profiles)
      const { userId } = await register({
        email: formData.email,
        password: formData.password,
        fullName: `${formData.firstName} ${formData.lastName}`,
        role: "regular_user" as any, // CRITICAL: Set role to 'regular_user' (as any bypasses TypeScript cache)
        phone: formData.phone,
      });

      // 2. Create entry in regular_users table with freemium defaults
      const supabaseAny = supabase as any; // Bypass TypeScript cache for database.types.ts
      const { error: dbError } = await supabaseAny
        .from("regular_users")
        .insert({
          profile_id: userId,
          first_name: formData.firstName,
          last_name: formData.lastName,
          phone: formData.phone || null,
          city: formData.city,
          postal_code: formData.postalCode,
          // Freemium defaults:
          is_premium: false,
          requests_this_month: 0,
          free_requests_limit: 3,
          email_notifications: true,
          sms_notifications: false,
        });

      if (dbError) {
        console.error("❌ Error creating regular_users entry:", dbError);
        throw new Error(
          "Account aangemaakt, maar profiel kon niet worden opgeslagen"
        );
      }

      success(
        "✅ Account succesvol aangemaakt! U kunt nu serviceverzoeken plaatsen..."
      );

      setTimeout(() => {
        navigate("/"); // Redirect to home (will show feed with "Create Request" button)
      }, 2000);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Registratie mislukt";
      showError(errorMessage);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Logo size="md" showText={true} />
          </div>

          <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-600 rounded-full mb-4">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Registreer als Particulier
          </h1>
          <p className="text-gray-600">
            Zoek een vakman voor uw klus - 3 gratis serviceverzoeken per maand
          </p>
        </div>

        {/* Registration Form */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Info */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-purple-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                Persoonlijke gegevens
              </h3>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Voornaam <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) =>
                      handleInputChange("firstName", e.target.value)
                    }
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition ${
                      errors.firstName ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="Jan"
                  />
                  {errors.firstName && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.firstName}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Achternaam <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) =>
                      handleInputChange("lastName", e.target.value)
                    }
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition ${
                      errors.lastName ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="de Vries"
                  />
                  {errors.lastName && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.lastName}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  E-mailadres <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition ${
                    errors.email ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="jan@example.com"
                />
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefoonnummer
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                  placeholder="+31 6 12345678"
                />
              </div>
            </div>

            {/* Location */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-purple-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                Locatie
              </h3>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stad <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => handleInputChange("city", e.target.value)}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition ${
                      errors.city ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="Amsterdam"
                  />
                  {errors.city && (
                    <p className="text-red-500 text-sm mt-1">{errors.city}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Postcode <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.postalCode}
                    onChange={(e) =>
                      handleInputChange("postalCode", e.target.value)
                    }
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition ${
                      errors.postalCode ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="1012 AB"
                  />
                  {errors.postalCode && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.postalCode}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Password */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-purple-600"
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
                Wachtwoord
              </h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Wachtwoord <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) =>
                      handleInputChange("password", e.target.value)
                    }
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition pr-10 ${
                      errors.password ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="Minimaal 8 tekens"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
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
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                        />
                      </svg>
                    ) : (
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
                {errors.password && (
                  <p className="text-red-500 text-sm mt-1">{errors.password}</p>
                )}

                {/* Password Strength */}
                {formData.password && (
                  <div className="mt-2">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${passwordStrength.color} transition-all duration-300`}
                          style={{
                            width: `${(passwordStrength.score / 6) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-700">
                        {passwordStrength.label}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bevestig wachtwoord <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    handleInputChange("confirmPassword", e.target.value)
                  }
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition ${
                    errors.confirmPassword
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                  placeholder="Herhaal wachtwoord"
                />
                {errors.confirmPassword && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>
            </div>

            {/* Terms */}
            <div className="space-y-4">
              <div
                className={`flex items-start gap-3 p-4 rounded-lg border ${
                  errors.agreedToTerms
                    ? "border-red-500 bg-red-50"
                    : "border-gray-200 bg-gray-50"
                }`}
              >
                <input
                  type="checkbox"
                  checked={formData.agreedToTerms}
                  onChange={(e) =>
                    handleInputChange("agreedToTerms", e.target.checked)
                  }
                  className="mt-1 w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                />
                <label className="text-sm text-gray-700">
                  Ik ga akkoord met de{" "}
                  <Link to="/terms" className="text-purple-600 hover:underline">
                    algemene voorwaarden
                  </Link>{" "}
                  en het{" "}
                  <Link
                    to="/privacy"
                    className="text-purple-600 hover:underline"
                  >
                    privacybeleid
                  </Link>
                  <span className="text-red-500 ml-1">*</span>
                </label>
              </div>
              {errors.agreedToTerms && (
                <p className="text-red-500 text-sm">{errors.agreedToTerms}</p>
              )}
            </div>

            {/* Freemium Info */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div>
                  <h4 className="font-semibold text-purple-900 mb-1">
                    Gratis account met 3 serviceverzoeken per maand
                  </h4>
                  <p className="text-sm text-purple-700">
                    U kunt <strong>3 gratis serviceverzoeken</strong> per maand
                    plaatsen. Vakmannen kunnen daarop reageren met offertes.
                    Voor onbeperkte serviceverzoeken kunt u upgraden naar
                    Premium (€9.99/maand).
                  </p>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex gap-4">
              <Link
                to="/register"
                className="flex-1 py-3 px-6 text-center border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition"
              >
                Terug
              </Link>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 py-3 px-6 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <svg
                      className="animate-spin w-5 h-5"
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
                    Bezig met registreren...
                  </>
                ) : (
                  "Account aanmaken"
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Already have account */}
        <div className="text-center mt-8">
          <p className="text-gray-600">
            Heeft u al een account?{" "}
            <Link
              to="/login"
              className="text-purple-600 font-medium hover:underline"
            >
              Inloggen
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
