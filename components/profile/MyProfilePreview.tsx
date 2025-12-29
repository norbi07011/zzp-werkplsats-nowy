/**
 * ================================================================
 * MY PROFILE PREVIEW - Wyświetla profil publiczny w dashboardzie
 * ================================================================
 *
 * Pobiera ID użytkownika i wyświetla jego profil publiczny
 * bezpośrednio w panelu (bez przekierowania).
 */

import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../src/lib/supabase";
import { Loader2, User } from "lucide-react";

// Import public profile components - MODERN versions (same as in App.tsx routes)
import WorkerPublicProfilePage from "../../pages/public/WorkerPublicProfilePageModern";
import EmployerPublicProfilePage from "../../pages/public/EmployerPublicProfilePageModern";
import AccountantProfilePage from "../../pages/public/AccountantPublicProfilePageModern";
import CleaningCompanyPublicProfilePage from "../../pages/public/CleaningCompanyPublicProfilePageModern";

interface MyProfilePreviewProps {
  role: "worker" | "employer" | "accountant" | "cleaning_company" | "admin";
}

export function MyProfilePreview({ role }: MyProfilePreviewProps) {
  const { user } = useAuth();
  const [profileId, setProfileId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      loadProfileId();
    }
  }, [user?.id, role]);

  const loadProfileId = async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    try {
      let data: any = null;

      switch (role) {
        case "worker": {
          const result = await supabase
            .from("workers")
            .select("id")
            .eq("profile_id", user.id)
            .maybeSingle();
          data = result.data;
          if (result.error) throw result.error;
          break;
        }
        case "employer": {
          const result = await supabase
            .from("employers")
            .select("id")
            .eq("profile_id", user.id)
            .maybeSingle();
          data = result.data;
          if (result.error) throw result.error;
          break;
        }
        case "accountant": {
          const result = await supabase
            .from("accountants")
            .select("id")
            .eq("profile_id", user.id)
            .maybeSingle();
          data = result.data;
          if (result.error) throw result.error;
          break;
        }
        case "cleaning_company": {
          const result = await supabase
            .from("cleaning_companies")
            .select("id")
            .eq("profile_id", user.id)
            .maybeSingle();
          data = result.data;
          if (result.error) throw result.error;
          break;
        }
        case "admin": {
          setProfileId(user.id);
          setLoading(false);
          return;
        }
      }

      if (data?.id) {
        setProfileId(data.id);
      } else {
        setError("Nie znaleziono profilu");
      }
    } catch (err: any) {
      console.error("Error loading profile ID:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Ładowanie profilu...</p>
        </div>
      </div>
    );
  }

  if (error || !profileId) {
    console.log("❌ MyProfilePreview ERROR:", {
      role,
      error,
      profileId,
      userId: user?.id,
    });
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Brak profilu</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  console.log("✅ MyProfilePreview RENDERING:", {
    role,
    profileId,
    userId: user?.id,
    embedded: true,
  });

  // Render the appropriate public profile component directly
  switch (role) {
    case "worker":
      return <WorkerPublicProfilePage workerId={profileId} embedded={true} />;
    case "employer":
      return (
        <EmployerPublicProfilePage employerId={profileId} embedded={true} />
      );
    case "accountant":
      return <AccountantProfilePage accountantId={profileId} embedded={true} />;
    case "cleaning_company":
      return (
        <CleaningCompanyPublicProfilePage
          companyId={profileId}
          embedded={true}
        />
      );
    default:
      return (
        <div className="min-h-[60vh] flex items-center justify-center">
          <p className="text-gray-600">Profil niedostępny dla tej roli</p>
        </div>
      );
  }
}

export default MyProfilePreview;
