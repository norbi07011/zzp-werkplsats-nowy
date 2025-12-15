/**
 * ================================================================
 * GPS CHECK-IN / CHECK-OUT Component
 * ================================================================
 * Pozwala pracownikowi "zameldować się" na miejscu pracy
 */

import React, { useState, useEffect } from "react";
import MapPin from "lucide-react/dist/esm/icons/map-pin";
import LogIn from "lucide-react/dist/esm/icons/log-in";
import LogOut from "lucide-react/dist/esm/icons/log-out";
import Loader from "lucide-react/dist/esm/icons/loader";
import AlertCircle from "lucide-react/dist/esm/icons/alert-circle";
import CheckCircle from "lucide-react/dist/esm/icons/check-circle";
import { supabase } from "../../../../lib/supabase";
import { useAuth } from "../../../../../contexts/AuthContext";
import { toast } from "sonner";

interface GPSCheckInProps {
  teamId: string;
  projectId?: string;
  taskId?: string;
  onCheckIn?: (location: GeolocationPosition) => void;
  onCheckOut?: (location: GeolocationPosition) => void;
}

interface LocationLog {
  id: string;
  log_type: "check_in" | "check_out";
  latitude: number;
  longitude: number;
  address: string | null;
  created_at: string;
}

export const GPSCheckIn: React.FC<GPSCheckInProps> = ({
  teamId,
  projectId,
  taskId,
  onCheckIn,
  onCheckOut,
}) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [currentStatus, setCurrentStatus] = useState<
    "checked_in" | "checked_out" | null
  >(null);
  const [lastLog, setLastLog] = useState<LocationLog | null>(null);
  const [currentPosition, setCurrentPosition] =
    useState<GeolocationPosition | null>(null);

  // Pobierz ostatni status przy mount
  useEffect(() => {
    fetchLastStatus();
  }, [user?.id, teamId]);

  const fetchLastStatus = async () => {
    if (!user?.id) return;

    const today = new Date().toISOString().split("T")[0];

    const { data, error } = await supabase
      .from("team_location_logs")
      .select("*")
      .eq("user_id", user.id)
      .eq("team_id", teamId)
      .gte("created_at", `${today}T00:00:00`)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (data && !error) {
      setLastLog(data);
      setCurrentStatus(
        data.log_type === "check_in" ? "checked_in" : "checked_out"
      );
    } else {
      setCurrentStatus("checked_out");
    }
  };

  const getCurrentPosition = (): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(
          new Error("Geolokalizacja nie jest wspierana przez tę przeglądarkę")
        );
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => resolve(position),
        (error) => {
          switch (error.code) {
            case error.PERMISSION_DENIED:
              reject(
                new Error(
                  "Dostęp do lokalizacji został zablokowany. Włącz lokalizację w ustawieniach przeglądarki."
                )
              );
              break;
            case error.POSITION_UNAVAILABLE:
              reject(new Error("Informacja o lokalizacji jest niedostępna."));
              break;
            case error.TIMEOUT:
              reject(
                new Error("Przekroczono limit czasu pobierania lokalizacji.")
              );
              break;
            default:
              reject(
                new Error("Nieznany błąd podczas pobierania lokalizacji.")
              );
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  };

  const reverseGeocode = async (
    lat: number,
    lng: number
  ): Promise<string | null> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      );
      const data = await response.json();
      return data.display_name || null;
    } catch {
      return null;
    }
  };

  const handleCheckIn = async () => {
    setIsLoading(true);
    setGpsError(null);

    try {
      const position = await getCurrentPosition();
      setCurrentPosition(position);

      const address = await reverseGeocode(
        position.coords.latitude,
        position.coords.longitude
      );

      const { data, error } = await supabase
        .from("team_location_logs")
        .insert({
          team_id: teamId,
          user_id: user?.id,
          project_id: projectId || null,
          task_id: taskId || null,
          log_type: "check_in",
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy_meters: Math.round(position.coords.accuracy),
          address: address,
          device_info: {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
          },
        })
        .select()
        .single();

      if (error) throw error;

      setLastLog(data);
      setCurrentStatus("checked_in");
      toast.success("✅ Zameldowano pomyślnie!");
      onCheckIn?.(position);
    } catch (error: any) {
      setGpsError(error.message);
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setIsLoading(true);
    setGpsError(null);

    try {
      const position = await getCurrentPosition();
      setCurrentPosition(position);

      const address = await reverseGeocode(
        position.coords.latitude,
        position.coords.longitude
      );

      const { data, error } = await supabase
        .from("team_location_logs")
        .insert({
          team_id: teamId,
          user_id: user?.id,
          project_id: projectId || null,
          task_id: taskId || null,
          log_type: "check_out",
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy_meters: Math.round(position.coords.accuracy),
          address: address,
          device_info: {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
          },
        })
        .select()
        .single();

      if (error) throw error;

      setLastLog(data);
      setCurrentStatus("checked_out");
      toast.success("✅ Wymeldowano pomyślnie!");
      onCheckOut?.(position);
    } catch (error: any) {
      setGpsError(error.message);
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("nl-NL", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
          <MapPin className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">GPS Check-in</h3>
          <p className="text-sm text-gray-500">Zarejestruj swoją lokalizację</p>
        </div>
      </div>

      {/* Current Status */}
      {lastLog && (
        <div
          className={`mb-4 p-3 rounded-lg ${
            currentStatus === "checked_in"
              ? "bg-green-50 border border-green-200"
              : "bg-gray-50 border border-gray-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {currentStatus === "checked_in" ? (
              <CheckCircle className="w-4 h-4 text-green-600" />
            ) : (
              <LogOut className="w-4 h-4 text-gray-500" />
            )}
            <span
              className={`text-sm font-medium ${
                currentStatus === "checked_in"
                  ? "text-green-700"
                  : "text-gray-600"
              }`}
            >
              {currentStatus === "checked_in" ? "Zameldowany" : "Wymeldowany"} o{" "}
              {formatTime(lastLog.created_at)}
            </span>
          </div>
          {lastLog.address && (
            <p className="text-xs text-gray-500 mt-1 truncate">
              {lastLog.address}
            </p>
          )}
        </div>
      )}

      {/* Error Message */}
      {gpsError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-600">{gpsError}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={handleCheckIn}
          disabled={isLoading || currentStatus === "checked_in"}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all ${
            currentStatus === "checked_in"
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-green-600 text-white hover:bg-green-700 active:scale-95"
          }`}
        >
          {isLoading && currentStatus !== "checked_in" ? (
            <Loader className="w-5 h-5 animate-spin" />
          ) : (
            <LogIn className="w-5 h-5" />
          )}
          Check-in
        </button>

        <button
          onClick={handleCheckOut}
          disabled={
            isLoading ||
            currentStatus === "checked_out" ||
            currentStatus === null
          }
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all ${
            currentStatus !== "checked_in"
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-red-600 text-white hover:bg-red-700 active:scale-95"
          }`}
        >
          {isLoading && currentStatus === "checked_in" ? (
            <Loader className="w-5 h-5 animate-spin" />
          ) : (
            <LogOut className="w-5 h-5" />
          )}
          Check-out
        </button>
      </div>

      {/* Accuracy Info */}
      {currentPosition && (
        <p className="text-xs text-gray-400 text-center mt-3">
          Dokładność GPS: ±{Math.round(currentPosition.coords.accuracy)}m
        </p>
      )}
    </div>
  );
};

export default GPSCheckIn;
