/**
 * REGISTER CLEANING COMPANY PAGE
 * Simple 2-step registration wizard for cleaning companies
 * Flow: Company Info → Account Security
 */

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import {
  FaEye,
  FaEyeSlash,
  FaUser,
  FaEnvelope,
  FaPhone,
  FaLock,
  FaCheckCircle,
  FaExclamationCircle,
  FaMapMarkerAlt,
  FaDollarSign,
  FaBroom,
} from "react-icons/fa";
import { Logo } from "../../src/components/common/Logo";

interface CleaningRegistrationData {
  // Step 1: Company Info
  companyName: string;
  email: string;
  phone: string;
  city: string;
  teamSize: number;
  yearsExperience: number;
  hourlyRateMin: number | null;
  hourlyRateMax: number | null;

  // Step 2: Account Security
  password: string;
  confirmPassword: string;
  agreedToTerms: boolean;
}

export const RegisterCleaningPage = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState<CleaningRegistrationData>({
    companyName: "",
    email: "",
    phone: "",
    city: "",
    teamSize: 1,
    yearsExperience: 0,
    hourlyRateMin: null,
    hourlyRateMax: null,
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
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 2) return { score, label: "Słabe", color: "bg-red-500" };
    if (score <= 4) return { score, label: "Średnie", color: "bg-yellow-500" };
    return { score, label: "Silne", color: "bg-green-500" };
  };

  const passwordStrength = calculatePasswordStrength(formData.password);

  // Validation
  const validateStep1 = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.companyName.trim()) {
      newErrors.companyName = "Nazwa firmy jest wymagana";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email jest wymagany";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Nieprawidłowy format email";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Telefon jest wymagany";
    }

    if (!formData.city.trim()) {
      newErrors.city = "Miasto jest wymagane";
    }

    if (!formData.hourlyRateMin || formData.hourlyRateMin < 10) {
      newErrors.hourlyRateMin = "Minimalna stawka musi być ≥ €10";
    }

    if (
      !formData.hourlyRateMax ||
      formData.hourlyRateMax < (formData.hourlyRateMin || 0)
    ) {
      newErrors.hourlyRateMax = "Maksymalna stawka musi być ≥ minimalna";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.password) {
      newErrors.password = "Hasło jest wymagane";
    } else if (formData.password.length < 8) {
      newErrors.password = "Hasło musi mieć minimum 8 znaków";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Hasła nie pasują do siebie";
    }

    if (!formData.agreedToTerms) {
      newErrors.agreedToTerms = "Musisz zaakceptować regulamin";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateStep2()) return;

    setIsLoading(true);
    setErrors({});

    try {
      // Register user with cleaning_company role
      await register({
        email: formData.email,
        password: formData.password,
        role: "cleaning_company",
        fullName: formData.companyName,
        phone: formData.phone,
        metadata: {
          city: formData.city,
          teamSize: formData.teamSize,
          yearsOfExperience: formData.yearsExperience,
          hourlyRateMin: formData.hourlyRateMin,
          hourlyRateMax: formData.hourlyRateMax,
        },
      });

      alert("✅ Rejestracja udana! Przekierowuję do dashboardu...");
      navigate("/cleaning-company"); // Redirect to Cleaning Company Dashboard
    } catch (err: any) {
      console.error("Registration error:", err);
      setErrors({
        submit: err.message || "Błąd podczas rejestracji. Spróbuj ponownie.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (
    field: keyof CleaningRegistrationData,
    value: any
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/">
            <Logo size="lg" showText={true} />
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mt-6 mb-2">
            🧹 Rejestracja firmy sprzątającej
          </h1>
          <p className="text-gray-600">
            Dołącz do platformy i znajdź klientów!
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center">
            {[1, 2].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center font-bold
                    ${
                      currentStep >= step
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-500"
                    }
                  `}
                >
                  {currentStep > step ? "✓" : step}
                </div>
                {step < 2 && (
                  <div
                    className={`
                      w-24 h-1 mx-2
                      ${currentStep > step ? "bg-blue-600" : "bg-gray-200"}
                    `}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 px-8 text-sm text-gray-600">
            <span>Dane firmy</span>
            <span>Bezpieczeństwo</span>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <form onSubmit={handleSubmit}>
            {/* STEP 1: Company Info */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  📋 Informacje o firmie
                </h2>

                {/* Company Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nazwa firmy *
                  </label>
                  <div className="relative">
                    <FaBroom className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={formData.companyName}
                      onChange={(e) =>
                        handleInputChange("companyName", e.target.value)
                      }
                      className={`
                        w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500
                        ${
                          errors.companyName
                            ? "border-red-500"
                            : "border-gray-300"
                        }
                      `}
                      placeholder="np. Clean Pro Amsterdam"
                    />
                  </div>
                  {errors.companyName && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.companyName}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <div className="relative">
                    <FaEnvelope className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        handleInputChange("email", e.target.value)
                      }
                      className={`
                        w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500
                        ${errors.email ? "border-red-500" : "border-gray-300"}
                      `}
                      placeholder="kontakt@cleanpro.nl"
                    />
                  </div>
                  {errors.email && (
                    <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Telefon *
                  </label>
                  <div className="relative">
                    <FaPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) =>
                        handleInputChange("phone", e.target.value)
                      }
                      className={`
                        w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500
                        ${errors.phone ? "border-red-500" : "border-gray-300"}
                      `}
                      placeholder="+31 6 12345678"
                    />
                  </div>
                  {errors.phone && (
                    <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
                  )}
                </div>

                {/* City */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Miasto *
                  </label>
                  <div className="relative">
                    <FaMapMarkerAlt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) =>
                        handleInputChange("city", e.target.value)
                      }
                      className={`
                        w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500
                        ${errors.city ? "border-red-500" : "border-gray-300"}
                      `}
                      placeholder="Amsterdam"
                    />
                  </div>
                  {errors.city && (
                    <p className="text-red-500 text-sm mt-1">{errors.city}</p>
                  )}
                </div>

                {/* Team Size & Experience */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rozmiar zespołu
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={formData.teamSize}
                      onChange={(e) =>
                        handleInputChange(
                          "teamSize",
                          parseInt(e.target.value) || 1
                        )
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Lata doświadczenia
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="50"
                      value={formData.yearsExperience}
                      onChange={(e) =>
                        handleInputChange(
                          "yearsExperience",
                          parseInt(e.target.value) || 0
                        )
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Hourly Rates */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Min. stawka (€/h) *
                    </label>
                    <div className="relative">
                      <FaDollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="number"
                        min="10"
                        max="100"
                        value={formData.hourlyRateMin || ""}
                        onChange={(e) =>
                          handleInputChange(
                            "hourlyRateMin",
                            parseInt(e.target.value) || null
                          )
                        }
                        className={`
                          w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500
                          ${
                            errors.hourlyRateMin
                              ? "border-red-500"
                              : "border-gray-300"
                          }
                        `}
                        placeholder="25"
                      />
                    </div>
                    {errors.hourlyRateMin && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.hourlyRateMin}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Max. stawka (€/h) *
                    </label>
                    <div className="relative">
                      <FaDollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="number"
                        min="10"
                        max="150"
                        value={formData.hourlyRateMax || ""}
                        onChange={(e) =>
                          handleInputChange(
                            "hourlyRateMax",
                            parseInt(e.target.value) || null
                          )
                        }
                        className={`
                          w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500
                          ${
                            errors.hourlyRateMax
                              ? "border-red-500"
                              : "border-gray-300"
                          }
                        `}
                        placeholder="40"
                      />
                    </div>
                    {errors.hourlyRateMax && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.hourlyRateMax}
                      </p>
                    )}
                  </div>
                </div>

                {/* Navigation */}
                <div className="flex justify-between mt-8">
                  <Link
                    to="/"
                    className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Anuluj
                  </Link>
                  <button
                    type="button"
                    onClick={handleNext}
                    className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                  >
                    Dalej →
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: Security */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  🔒 Bezpieczeństwo konta
                </h2>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hasło *
                  </label>
                  <div className="relative">
                    <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) =>
                        handleInputChange("password", e.target.value)
                      }
                      className={`
                        w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500
                        ${
                          errors.password ? "border-red-500" : "border-gray-300"
                        }
                      `}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.password}
                    </p>
                  )}

                  {/* Password Strength */}
                  {formData.password && (
                    <div className="mt-2">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-full rounded-full transition-all ${passwordStrength.color}`}
                            style={{
                              width: `${(passwordStrength.score / 6) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="text-sm text-gray-600">
                          {passwordStrength.label}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Potwierdź hasło *
                  </label>
                  <div className="relative">
                    <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={(e) =>
                        handleInputChange("confirmPassword", e.target.value)
                      }
                      className={`
                        w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500
                        ${
                          errors.confirmPassword
                            ? "border-red-500"
                            : "border-gray-300"
                        }
                      `}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>

                {/* Terms Checkbox */}
                <div>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.agreedToTerms}
                      onChange={(e) =>
                        handleInputChange("agreedToTerms", e.target.checked)
                      }
                      className="mt-1 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">
                      Akceptuję{" "}
                      <Link
                        to="/terms"
                        className="text-blue-600 hover:underline"
                      >
                        regulamin
                      </Link>{" "}
                      i{" "}
                      <Link
                        to="/privacy"
                        className="text-blue-600 hover:underline"
                      >
                        politykę prywatności
                      </Link>{" "}
                      *
                    </span>
                  </label>
                  {errors.agreedToTerms && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.agreedToTerms}
                    </p>
                  )}
                </div>

                {/* Submit Error */}
                {errors.submit && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                    <FaExclamationCircle className="text-red-500 mt-0.5" />
                    <p className="text-red-700 text-sm">{errors.submit}</p>
                  </div>
                )}

                {/* Navigation */}
                <div className="flex justify-between mt-8">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    ← Wstecz
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className={`
                      px-8 py-3 rounded-lg font-medium text-white
                      ${
                        isLoading
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-blue-600 hover:bg-blue-700"
                      }
                    `}
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Rejestruję...
                      </span>
                    ) : (
                      "Zarejestruj się"
                    )}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-gray-600">
            Masz już konto?{" "}
            <Link
              to="/login"
              className="text-blue-600 hover:underline font-medium"
            >
              Zaloguj się
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterCleaningPage;
