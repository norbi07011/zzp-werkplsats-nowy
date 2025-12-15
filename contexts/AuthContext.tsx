import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { supabase } from "@/lib/supabase";
import type { User as SupabaseUser } from "@supabase/supabase-js";
// @ts-ignore - Database types will be regenerated after migration deployment
import type { Database } from "@/lib/database.types";
import { LoginLoadingAnimation } from "../components/LoginLoadingAnimation";

export type UserRole =
  | "admin"
  | "employer"
  | "worker"
  | "accountant"
  | "cleaning_company"
  | "regular_user";

export interface Subscription {
  planId: "worker-basic" | "worker-plus" | "client-basic" | "client-pro";
  status: "ACTIVE" | "INACTIVE";
}

export interface User {
  id: string;
  email: string;
  name: string; // Added missing name property
  fullName: string;
  role: UserRole;
  companyName?: string; // For employers
  certificateId?: string; // For workers
  avatar_url?: string;
  created_at?: string;
  subscription?: Subscription; // Added subscription property
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<{ userId: string }>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

export interface RegisterData {
  email: string;
  password: string;
  fullName: string;
  role: UserRole;
  companyName?: string;
  phone?: string;
  metadata?: {
    // Worker fields
    specialization?: string;
    hourlyRate?: number | null;
    yearsOfExperience?: number;
    city?: string;
    skills?: string[];
    subscribeNewsletter?: boolean;
    // Team & On-Demand fields
    workerType?:
      | "individual"
      | "team_leader"
      | "duo_partner"
      | "helper_available";
    teamSize?: number;
    teamDescription?: string;
    teamHourlyRate?: number | null;
    isOnDemandAvailable?: boolean;
    // Accountant fields
    address?: string;
    postal_code?: string;
    kvk_number?: string;
    btw_number?: string;
    license_number?: string;
    bio?: string;
    website?: string;
    specializations?: string[];
    languages?: string[];
    // Cleaning company fields
    hourlyRateMin?: number | null;
    hourlyRateMax?: number | null;
  };
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Cache dla user mapping - zapobiega wielokrotnym query
const userMappingCache = new Map<string, { user: User; timestamp: number }>();
const CACHE_DURATION = 300000; // 5 minut (300 sekund) - zwiększone z 30s

// Mapping Supabase user to app user with timeout protection
const mapSupabaseUserToAppUser = async (
  supabaseUser: SupabaseUser
): Promise<User> => {
  // DŁUGI timeout 5 minut - zapobiega false positive timeouts
  const timeoutPromise = new Promise<never>(
    (_, reject) =>
      setTimeout(() => reject(new Error("User mapping timeout")), 300000) // 5 minut
  );

  console.log(
    "[AUTH] Mapping user:",
    supabaseUser.id,
    "role:",
    supabaseUser.user_metadata?.role
  );

  // Sprawdź cache
  const cached = userMappingCache.get(supabaseUser.id);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log("[AUTH] Using cached user data");
    return cached.user;
  }

  try {
    const user = await Promise.race([
      mapUserDataWithRetry(supabaseUser),
      timeoutPromise,
    ]);

    // Zapisz do cache
    userMappingCache.set(supabaseUser.id, { user, timestamp: Date.now() });
    console.log("[AUTH] User mapped successfully, cached");

    return user;
  } catch (error) {
    console.error("⚠️ Error mapping user (using fallback):", error);
    console.error("⚠️ User ID:", supabaseUser.id);
    console.error("⚠️ Cache status:", userMappingCache.has(supabaseUser.id));
    console.error(
      "⚠️ Error type:",
      error instanceof Error ? error.message : typeof error
    );

    // EMERGENCY FALLBACK - sprawdź czy to admin po ID
    const isKnownAdmin =
      supabaseUser.id === "47f06296-a087-4d63-b052-1004e063c467";

    const fallbackUser = {
      id: supabaseUser.id,
      email: supabaseUser.email || "",
      name:
        supabaseUser.user_metadata?.fullName ||
        (isKnownAdmin ? "Administrator" : "User"),
      fullName:
        supabaseUser.user_metadata?.fullName ||
        (isKnownAdmin ? "Administrator" : "User"),
      role:
        (isKnownAdmin
          ? "admin"
          : (supabaseUser.user_metadata?.role as UserRole)) || "worker",
    };

    console.warn("⚡ USING FALLBACK USER:", fallbackUser);

    // Cache fallback żeby nie powtarzać błędu
    userMappingCache.set(supabaseUser.id, {
      user: fallbackUser,
      timestamp: Date.now(),
    });

    return fallbackUser;
  }
};

const mapUserDataWithRetry = async (
  supabaseUser: SupabaseUser
): Promise<User> => {
  try {
    // Get user profile from database with explicit typing
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", supabaseUser.id)
      .single();

    if (error || !profile) {
      console.error("Error fetching user profile:", error);
      // Fallback to basic user data from auth metadata
      return {
        id: supabaseUser.id,
        email: supabaseUser.email || "",
        name: supabaseUser.user_metadata?.fullName || "User",
        fullName: supabaseUser.user_metadata?.fullName || "User",
        role: (supabaseUser.user_metadata?.role as UserRole) || "worker",
      };
    }

    // Type the profile explicitly
    const typedProfile =
      profile as Database["public"]["Tables"]["profiles"]["Row"];

    // Get additional role-specific data
    let companyName: string | undefined;
    let certificateId: string | undefined;
    let subscription: Subscription | undefined;

    // ✅ CRITICAL FIX: Only fetch role-specific data if role matches
    // WHY: Prevents timeout/fallback when admin has duplicate entries in workers/employers tables

    if (typedProfile.role === "admin") {
      // Admin role - no additional data needed, skip all table lookups
      console.log(
        "[AUTH] Admin user detected - skipping role-specific data fetch"
      );
    } else if (typedProfile.role === "employer") {
      // WHY: maybeSingle instead of single - employer record may not exist yet (new registration)
      const { data: employer } = await supabase
        .from("employers")
        .select("company_name, subscription_tier, subscription_status")
        .eq("profile_id", typedProfile.id)
        .maybeSingle(); // ← FIXED: returns null if no row, doesn't throw 406

      // Using any to bypass type check for potentially new fields
      const employerData = employer as any;
      companyName = employerData?.company_name;

      console.log("[SUBS-GUARD] Employer data:", {
        has_record: !!employer,
        subscription_tier: employerData?.subscription_tier,
        subscription_status: employerData?.subscription_status,
      });

      // Map employer subscription
      if (
        employerData?.subscription_tier &&
        employerData.subscription_status === "active"
      ) {
        subscription = {
          planId:
            employerData.subscription_tier === "basic"
              ? "client-basic"
              : "client-pro",
          status: "ACTIVE",
        };
      } else {
        console.log("[SUBS-GUARD] No active subscription for employer");
      }
    } else if (typedProfile.role === "accountant") {
      // Fetch accountant data
      const { data: accountant } = await supabase
        .from("accountants" as any)
        .select("company_name, full_name")
        .eq("profile_id", typedProfile.id)
        .maybeSingle();

      if (accountant) {
        const accountantData = accountant as any;
        companyName = accountantData?.company_name || accountantData?.full_name;
      }
    } else if (typedProfile.role === "cleaning_company") {
      // Fetch cleaning company data
      const { data: cleaningCompany } = await supabase
        .from("cleaning_companies" as any)
        .select("company_name")
        .eq("profile_id", typedProfile.id)
        .maybeSingle();

      if (cleaningCompany) {
        const cleaningData = cleaningCompany as any;
        companyName = cleaningData?.company_name;
      }
    } else if (typedProfile.role === "worker") {
      try {
        const { data: certificates } = await supabase
          .from("certificates")
          .select("certificate_number")
          .eq("worker_id", typedProfile.id)
          .limit(1);
        const typedCertificates = certificates as
          | Database["public"]["Tables"]["certificates"]["Row"][]
          | null;
        certificateId = typedCertificates?.[0]?.certificate_number || undefined;

        // Fetch worker subscription data from workers table
        let { data: workerProfile, error: workerError } = await supabase
          .from("workers")
          .select("subscription_tier, subscription_status")
          .eq("profile_id", typedProfile.id)
          .maybeSingle();

        // If worker record doesn't exist, create it with defaults
        if (workerError) {
          console.error("❌ Error fetching worker profile:", workerError);
        } else if (!workerProfile) {
          console.log("🔧 Worker record not found, creating default...");

          const { data: newWorker, error: createError } = await supabase
            .from("workers")
            .insert({
              profile_id: typedProfile.id,
              kvk_number: "",
              specialization: "",
              hourly_rate: 0,
              years_experience: 0,
              location_city: "",
              radius_km: 25,
              skills: [],
              certifications: [],
              rating: 0,
              rating_count: 0,
              verified: false,
              subscription_tier: "basic",
              subscription_status: "active",
            } as any)
            .select("subscription_tier, subscription_status")
            .single();

          if (!createError && newWorker) {
            console.log("✅ Worker record created successfully");
            workerProfile = newWorker;
          } else {
            console.error("❌ Failed to create worker record:", createError);
          }
        }

        // Map worker subscription (using any to bypass type check for new table)
        const workerData = workerProfile as any;
        if (
          workerData?.subscription_tier &&
          workerData.subscription_status === "active"
        ) {
          subscription = {
            planId:
              workerData.subscription_tier === "basic"
                ? "worker-basic"
                : "worker-plus",
            status: "ACTIVE",
          };
        }
      } catch (workerError) {
        console.warn(
          "⚠️ Could not fetch worker subscription data:",
          workerError
        );
        // Continue without subscription data - don't block login
      }
    }

    const finalUser = {
      id: typedProfile.id,
      email: typedProfile.email,
      name: typedProfile.full_name || "User",
      fullName: typedProfile.full_name || "User",
      role: (typedProfile.role as UserRole) || "worker",
      companyName,
      certificateId,
      subscription,
      created_at: typedProfile.created_at || undefined,
    };

    console.log("[AUTH] User mapped successfully:", {
      email: finalUser.email,
      role: finalUser.role,
      has_subscription: !!finalUser.subscription,
    });

    return finalUser;
  } catch (error) {
    console.error("Error mapping user:", error);
    // Fallback to basic user data
    return {
      id: supabaseUser.id,
      email: supabaseUser.email || "",
      name: supabaseUser.user_metadata?.fullName || "User",
      fullName: supabaseUser.user_metadata?.fullName || "User",
      role: (supabaseUser.user_metadata?.role as UserRole) || "worker",
    };
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showLoginAnimation, setShowLoginAnimation] = useState(false);

  // WHY: Initialize auth state from Supabase session on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // 🔍 DEBUG: Check what's in localStorage immediately
        console.log("[Auth] Checking localStorage for saved session...");
        console.log("[Auth] All localStorage keys:", Object.keys(localStorage));

        // ✅ CRITICAL: Check for saved session from Stripe payment redirect FIRST
        // This runs before getSession to restore tokens lost during cross-domain redirect
        const savedPaymentSession = localStorage.getItem(
          "stripe_payment_session"
        );
        console.log(
          "[Auth] stripe_payment_session value:",
          savedPaymentSession ? "EXISTS" : "NULL"
        );

        if (savedPaymentSession) {
          console.log(
            "[Auth] Found saved payment session, attempting restore..."
          );
          try {
            const sessionData = JSON.parse(savedPaymentSession);
            const tokenAge = Date.now() - sessionData.timestamp;

            // Only restore if token is less than 30 minutes old
            if (tokenAge < 30 * 60 * 1000) {
              console.log("[Auth] Token age OK, restoring session...");
              const { data, error } = await supabase.auth.setSession({
                access_token: sessionData.access_token,
                refresh_token: sessionData.refresh_token,
              });

              if (data?.session) {
                console.log("[Auth] ✅ Session restored from Stripe payment!");
                localStorage.removeItem("stripe_payment_session");
                // Continue with normal flow - session is now set
              } else {
                console.log(
                  "[Auth] Could not restore session:",
                  error?.message
                );
                localStorage.removeItem("stripe_payment_session");
              }
            } else {
              console.log("[Auth] Saved token too old, discarding");
              localStorage.removeItem("stripe_payment_session");
            }
          } catch (parseErr) {
            console.error("[Auth] Error parsing saved session:", parseErr);
            localStorage.removeItem("stripe_payment_session");
          }
        }

        // WHY: get existing Supabase session (if user is already logged in)
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          // WHY: Removed Promise.race/timeout - let DB queries complete naturally
          try {
            const appUser = await mapSupabaseUserToAppUser(session.user);
            console.log("[SUBS-GUARD] User mapped successfully:", {
              role: appUser.role,
              has_subscription: !!appUser.subscription,
            });
            setUser(appUser);
          } catch (mapError) {
            console.error("[SUBS-GUARD] Error mapping user:", mapError);
            // Fallback to basic user data
            setUser({
              id: session.user.id,
              email: session.user.email || "",
              name: session.user.user_metadata?.fullName || "User",
              fullName: session.user.user_metadata?.fullName || "User",
              role: (session.user.user_metadata?.role as UserRole) || "worker",
            });
          }
        }
      } catch (error) {
        console.error("Failed to initialize auth:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    // WHY: subscribe to Supabase auth state changes (login, logout, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      try {
        if (!session) {
          setUser(null);
          setIsLoading(false);
          return;
        }
        // WHY: Removed Promise.race/timeout - await naturally without artificial timeout
        const appUser = await mapSupabaseUserToAppUser(session.user);
        console.log("[SUBS-GUARD] Auth state changed, user mapped:", {
          role: appUser.role,
          has_subscription: !!appUser.subscription,
        });
        setUser(appUser);
      } catch (mapError) {
        console.error(
          "[SUBS-GUARD] Error mapping user on auth change:",
          mapError
        );
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    setShowLoginAnimation(true); // Show animation

    try {
      // WHY: rely on real Supabase session only - signInWithPassword returns session + user
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: password,
      });

      // WHY: throw error immediately if Supabase Auth fails
      if (error) {
        setShowLoginAnimation(false); // Hide on error
        throw new Error(error.message);
      }

      // WHY: verify we received user data from Supabase (not just session)
      if (!data.user) {
        setShowLoginAnimation(false); // Hide on error
        throw new Error("Login failed - no user data received");
      }

      // WHY: map Supabase user to app user with role and subscription data
      const appUser = await mapSupabaseUserToAppUser(data.user);
      setUser(appUser);

      // Keep animation visible for smooth transition
      setTimeout(() => setShowLoginAnimation(false), 3500); // Match animation duration
    } catch (error) {
      console.error("Login failed:", error);
      setShowLoginAnimation(false); // Hide on error
      throw new Error(
        error instanceof Error ? error.message : "Nieprawidłowy email lub hasło"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (
    userData: RegisterData
  ): Promise<{ userId: string }> => {
    setIsLoading(true);

    try {
      // 1. Create user account in Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email: userData.email.trim().toLowerCase(),
        password: userData.password,
        options: {
          data: {
            fullName: userData.fullName,
            role: userData.role,
            companyName: userData.companyName,
          },
        },
      });

      if (error) {
        // Better error messages for common Supabase Auth errors
        if (
          error.message.includes("already registered") ||
          error.message.includes("User already registered")
        ) {
          throw new Error(
            `Dit e-mailadres (${userData.email}) is al geregistreerd. Probeer in te loggen of gebruik een ander e-mailadres.`
          );
        }
        if (error.message.includes("Invalid email")) {
          throw new Error(
            "Ongeldig e-mailadres. Controleer het e-mailadres en probeer opnieuw."
          );
        }
        if (error.message.includes("Password should be")) {
          throw new Error("Wachtwoord moet minimaal 6 tekens bevatten.");
        }
        throw new Error(error.message);
      }

      if (!data.user) {
        throw new Error("Registration failed - no user data received");
      }

      // 2. Create profile in database
      const { error: profileError } = await supabase.from("profiles").insert({
        id: data.user.id,
        email: userData.email.trim().toLowerCase(),
        full_name: userData.fullName,
        role: userData.role,
      } as any);

      if (profileError) {
        console.error("Error creating profile:", profileError);
        // Don't throw here - user is created in auth, just profile creation failed
      }

      // 3. If worker, create worker profile with metadata
      if (userData.role === "worker" && userData.metadata) {
        const { error: workerProfileError } = await supabase
          .from("workers")
          .insert({
            profile_id: data.user.id,
            specialization: userData.metadata.specialization || "",
            hourly_rate: userData.metadata.hourlyRate || null,
            years_experience: userData.metadata.yearsOfExperience || 0,
            location_city: userData.metadata.city || "",
            // NEW: Team & On-Demand fields
            worker_type: userData.metadata.workerType || "individual",
            team_size: userData.metadata.teamSize || 1,
            team_description: userData.metadata.teamDescription || null,
            team_hourly_rate: userData.metadata.teamHourlyRate || null,
            is_on_demand_available:
              userData.metadata.isOnDemandAvailable || false,
            is_available_now: false, // Default OFF until worker toggles it
            // Subscription defaults
            subscription_tier: "basic", // Free tier by default
            subscription_status: "active",
          } as any);

        if (workerProfileError) {
          console.error("Error creating worker profile:", workerProfileError);
          // Don't throw - user is created, just profile creation failed
        }
      }

      // 🔥 FIX: If employer, create employer profile with company data
      if (userData.role === "employer") {
        console.log(
          "[EMPLOYER-REG] Creating employer record for:",
          userData.email
        );

        const { error: employerProfileError } = await supabase
          .from("employers")
          .insert({
            profile_id: data.user.id,
            company_name: userData.companyName || "Nieznana firma",
            kvk_number: "", // Can be added later in profile
            industry: "other",
            location_city: "",
            phone: userData.phone || "",
            email: userData.email,
            // CRITICAL: Set subscription to INACTIVE until payment
            subscription_tier: "basic", // Default tier
            subscription_status: "inactive", // ← INACTIVE until payment!
            verified: false,
          } as any);

        if (employerProfileError) {
          console.error(
            "[EMPLOYER-REG] ❌ Error creating employer profile:",
            employerProfileError
          );
          // Don't throw - user is created in auth, just profile creation failed
          // They can complete profile later
        } else {
          console.log("[EMPLOYER-REG] ✅ Employer record created successfully");
        }
      }

      // 🔥 NEW: If accountant, create accountant profile with metadata
      if (userData.role === "accountant" && userData.metadata) {
        console.log(
          "[ACCOUNTANT-REG] Creating accountant record for:",
          userData.email
        );

        const supabaseAny = supabase as any;
        const { error: accountantProfileError } = await supabaseAny
          .from("accountants")
          .insert({
            profile_id: data.user.id,
            full_name: userData.fullName,
            company_name: userData.companyName || null,
            email: userData.email,
            phone: userData.phone || null,
            address: userData.metadata.address || null,
            postal_code: userData.metadata.postal_code || null,
            city: userData.metadata.city || null,
            kvk_number: userData.metadata.kvk_number || null,
            btw_number: userData.metadata.btw_number || null,
            license_number: userData.metadata.license_number || null,
            bio: userData.metadata.bio || null,
            website: userData.metadata.website || null,
            specializations: userData.metadata.specializations || [],
            languages: userData.metadata.languages || ["Nederlands"],
            years_experience: userData.metadata.yearsOfExperience || 0,
            is_active: true,
          });

        if (accountantProfileError) {
          console.error(
            "[ACCOUNTANT-REG] ❌ Error creating accountant profile:",
            accountantProfileError
          );
          // CRITICAL: Throw error to prevent incomplete registration
          throw new Error(
            `Fout bij het maken van accountant profiel: ${accountantProfileError.message}`
          );
        } else {
          console.log(
            "[ACCOUNTANT-REG] ✅ Accountant record created successfully"
          );
        }
      }

      // 🔥 NEW: If cleaning_company, create cleaning company profile with metadata
      if (userData.role === "cleaning_company" && userData.metadata) {
        console.log(
          "[CLEANING-REG] Creating cleaning company record for:",
          userData.email
        );

        const supabaseAny = supabase as any;
        const { error: cleaningProfileError } = await supabaseAny
          .from("cleaning_companies")
          .insert({
            profile_id: data.user.id,
            company_name: userData.fullName, // fullName = company name for cleaning companies
            owner_name: userData.fullName, // Same as company name initially
            email: userData.email,
            phone: userData.phone || null,
            location_city: userData.metadata.city || null,
            team_size: userData.metadata.teamSize || 1,
            years_experience: userData.metadata.yearsOfExperience || 0,
            hourly_rate_min: userData.metadata.hourlyRateMin || null,
            hourly_rate_max: userData.metadata.hourlyRateMax || null,
            accepting_new_clients: true,
          });

        if (cleaningProfileError) {
          console.error(
            "[CLEANING-REG] ❌ Error creating cleaning company profile:",
            cleaningProfileError
          );
          // CRITICAL: Throw error to prevent incomplete registration
          throw new Error(
            `Fout bij het maken van schoonmaakbedrijf profiel: ${cleaningProfileError.message}`
          );
        } else {
          console.log(
            "[CLEANING-REG] ✅ Cleaning company record created successfully"
          );
        }
      }

      // 🔥 NEW: If regular_user, DON'T create regular_users entry here
      // (RegisterRegularUserPage will do it after register() returns)
      if (userData.role === ("regular_user" as any)) {
        console.log(
          "[REGULAR-USER-REG] Regular user auth created, profile will be completed by RegisterPage"
        );
      }

      // If auto-confirm is enabled, user will be logged in automatically
      if (data.session?.user) {
        const appUser = await mapSupabaseUserToAppUser(data.session.user);
        setUser(appUser);
      }

      // Return userId for caller to use
      return { userId: data.user.id };
    } catch (error) {
      console.error("Registration failed:", error);
      throw error instanceof Error
        ? error
        : new Error("Rejestracja nie powiodła się");
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      // WHY: always clear Supabase session to prevent stale auth
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Logout error:", error);
      }
      // WHY: clear local user state immediately
      setUser(null);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const refreshToken = async (): Promise<void> => {
    try {
      const { data, error } = await supabase.auth.refreshSession();

      if (error) {
        console.error("Token refresh failed:", error);
        await logout();
        return;
      }

      if (data.session?.user) {
        const appUser = await mapSupabaseUserToAppUser(data.session.user);
        setUser(appUser);
      }
    } catch (error) {
      console.error("Token refresh failed:", error);
      await logout();
    }
  };

  const resetPassword = async (email: string): Promise<void> => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        {
          redirectTo: `${window.location.origin}/reset-password`,
        }
      );

      if (error) {
        throw new Error(error.message);
      }
    } catch (error) {
      console.error("Password reset failed:", error);
      throw error instanceof Error
        ? error
        : new Error("Resetowanie hasła nie powiodło się");
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    refreshToken,
    resetPassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {showLoginAnimation && <LoginLoadingAnimation />}
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// Helper to get auth token for API calls
export const getAuthToken = async (): Promise<string | null> => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token || null;
};
