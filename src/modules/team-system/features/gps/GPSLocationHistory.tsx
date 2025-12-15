/**
 * ================================================================
 * GPS LOCATION HISTORY - Historia lokalizacji
 * ================================================================
 */

import React, { useState, useEffect } from "react";






import { supabaseUntyped as supabase } from "../../../../lib/supabase";
import { useAuth } from "../../../../../contexts/AuthContext";

interface LocationLog {
  id: string;
  user_id: string;
  project_id: string | null;
  log_type: "check_in" | "check_out" | "location_update";
  latitude: number;
  longitude: number;
  address: string | null;
  accuracy_meters: number | null;
  created_at: string;
  profiles?: {
    full_name: string | null;
    avatar_url: string | null;
  };
  team_projects?: {
    title: string;
  } | null;
}

interface GPSLocationHistoryProps {
  teamId: string;
  projectId?: string;
  userId?: string;
  limit?: number;
  showUserFilter?: boolean;
}

export const GPSLocationHistory: React.FC<GPSLocationHistoryProps> = ({
  teamId,
  projectId,
  userId,
  limit = 50,
  showUserFilter = true,
}) => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<LocationLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  useEffect(() => {
    fetchLogs();
  }, [teamId, projectId, userId, selectedDate]);

  const fetchLogs = async () => {
    setIsLoading(true);

    let query = supabase
      .from("team_location_logs")
      .select(
        `
        *,
        profiles:user_id(full_name, avatar_url),
        team_projects:project_id(title)
      `
      )
      .eq("team_id", teamId)
      .gte("created_at", `${selectedDate}T00:00:00`)
      .lt("created_at", `${selectedDate}T23:59:59`)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (projectId) {
      query = query.eq("project_id", projectId);
    }

    if (userId) {
      query = query.eq("user_id", userId);
    }

    const { data, error } = await query;

    if (!error && data) {
      setLogs(data);
    }
    setIsLoading(false);
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("nl-NL", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getLogTypeLabel = (type: string) => {
    switch (type) {
      case "check_in":
        return { label: "Check-in", color: "text-green-600 bg-green-100" };
      case "check_out":
        return { label: "Check-out", color: "text-red-600 bg-red-100" };
      default:
        return { label: "Lokalizacja", color: "text-blue-600 bg-blue-100" };
    }
  };

  // Grupuj logi po użytkowniku
  const groupedByUser = logs.reduce((acc, log) => {
    const userName = (log.profiles as any)?.full_name || "Nieznany";
    if (!acc[log.user_id]) {
      acc[log.user_id] = {
        userName,
        avatar: (log.profiles as any)?.avatar_url,
        logs: [],
      };
    }
    acc[log.user_id].logs.push(log);
    return acc;
  }, {} as Record<string, { userName: string; avatar: string | null; logs: LocationLog[] }>);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
              <MapPin className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">
                Historia lokalizacji
              </h3>
              <p className="text-sm text-gray-500">{logs.length} wpisów</p>
            </div>
          </div>

          {/* Date Picker */}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">
            <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
            Ładowanie...
          </div>
        ) : Object.keys(groupedByUser).length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
            Brak wpisów dla wybranej daty
          </div>
        ) : (
          Object.entries(groupedByUser).map(([uId, userData]) => (
            <div key={uId} className="p-4">
              {/* User Header */}
              <div className="flex items-center gap-3 mb-3">
                <img
                  src={
                    userData.avatar ||
                    `https://ui-avatars.com/api/?name=${userData.userName}&background=6366f1&color=fff`
                  }
                  alt={userData.userName}
                  className="w-8 h-8 rounded-full"
                />
                <span className="font-medium text-gray-900">
                  {userData.userName}
                </span>
                <span className="text-xs text-gray-400">
                  {userData.logs.length} wpisów
                </span>
              </div>

              {/* User's logs */}
              <div className="space-y-2 pl-11">
                {userData.logs.map((log) => {
                  const logType = getLogTypeLabel(log.log_type);
                  const isExpanded = expandedLog === log.id;

                  return (
                    <div
                      key={log.id}
                      className="border border-gray-100 rounded-lg overflow-hidden"
                    >
                      <button
                        onClick={() =>
                          setExpandedLog(isExpanded ? null : log.id)
                        }
                        className="w-full flex items-center justify-between p-2 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-medium ${logType.color}`}
                          >
                            {logType.label}
                          </span>
                          <span className="text-sm text-gray-600">
                            {formatTime(log.created_at)}
                          </span>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        )}
                      </button>

                      {isExpanded && (
                        <div className="px-3 pb-3 pt-1 bg-gray-50 text-sm">
                          {log.address && (
                            <p className="text-gray-600 mb-1">
                              📍 {log.address}
                            </p>
                          )}
                          <p className="text-gray-400 text-xs">
                            Dokładność: ±{log.accuracy_meters || "?"}m
                          </p>
                          {log.team_projects && (
                            <p className="text-gray-400 text-xs mt-1">
                              Projekt: {(log.team_projects as any).title}
                            </p>
                          )}
                          <a
                            href={`https://www.google.com/maps?q=${log.latitude},${log.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 text-xs hover:underline mt-2 inline-block"
                          >
                            Otwórz w Google Maps →
                          </a>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default GPSLocationHistory;
