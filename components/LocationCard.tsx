import { MapPin } from "lucide-react";
import { useEffect, useRef } from "react";

interface LocationCardProps {
  address?: string | null;
  city?: string | null;
  postalCode?: string | null;
  country?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  googleMapsUrl?: string | null;
  profileType: "employer" | "worker" | "accountant" | "cleaning_company";
}

/**
 * LocationCard - Universal location display component with OpenStreetMap
 * Uses Leaflet.js (free, no API key required)
 *
 * Features:
 * - Shows full address details
 * - Interactive map with marker
 * - Link to Google Maps (if available)
 * - Falls back to city-only view if no exact coordinates
 */
export function LocationCard({
  address,
  city,
  postalCode,
  country,
  latitude,
  longitude,
  googleMapsUrl,
  profileType,
}: LocationCardProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    // Only initialize map if we have coordinates
    if (!latitude || !longitude || !mapRef.current) return;

    // Dynamically load Leaflet CSS and JS
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      link.integrity = "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=";
      link.crossOrigin = "";
      document.head.appendChild(link);
    }

    if (!window.L && !document.getElementById("leaflet-js")) {
      const script = document.createElement("script");
      script.id = "leaflet-js";
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.integrity = "sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=";
      script.crossOrigin = "";
      script.onload = initMap;
      document.head.appendChild(script);
    } else if (window.L) {
      initMap();
    }

    function initMap() {
      if (!mapRef.current || mapInstanceRef.current || !window.L) return;

      try {
        // Initialize map
        const map = window.L.map(mapRef.current).setView(
          [latitude!, longitude!],
          13
        );
        mapInstanceRef.current = map;

        // Add OpenStreetMap tiles (free, no API key)
        window.L.tileLayer(
          "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
          {
            maxZoom: 19,
            attribution:
              '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          }
        ).addTo(map);

        // Add marker
        const marker = window.L.marker([latitude!, longitude!]).addTo(map);

        // Add popup with address
        const popupContent = [
          address || "",
          postalCode && city ? `${postalCode} ${city}` : city || "",
          country || "",
        ]
          .filter(Boolean)
          .join("<br>");

        if (popupContent) {
          marker.bindPopup(popupContent);
        }
      } catch (error) {
        console.error("Error initializing Leaflet map:", error);
      }
    }

    // Cleanup on unmount
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [latitude, longitude, address, city, postalCode, country]);

  // Don't render card if no location data at all
  if (!address && !city) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
        <MapPin className="w-5 h-5 text-green-600" />
        Lokalizacja
      </h3>

      {/* Address Details */}
      <div className="space-y-1 text-gray-700">
        {address && <p className="font-medium">{address}</p>}
        {postalCode && city && (
          <p>
            {postalCode} {city}
          </p>
        )}
        {!postalCode && city && <p>{city}</p>}
        {country && <p>{country}</p>}
      </div>

      {/* Map Display */}
      {latitude && longitude ? (
        <div className="mt-4">
          <div
            ref={mapRef}
            className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden"
            style={{ zIndex: 0 }}
          />
          {googleMapsUrl && (
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-2 text-sm text-green-600 hover:text-green-700 font-medium"
            >
              <MapPin className="w-4 h-4" />
              Zobacz na mapie Google
              <svg
                className="w-3 h-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </a>
          )}
        </div>
      ) : (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg text-center text-sm text-gray-500">
          <MapPin className="w-6 h-6 mx-auto mb-2 text-gray-400" />
          Dokładna lokalizacja nie jest dostępna
        </div>
      )}

      {/* Profile-specific notes */}
      {!latitude && !longitude && city && profileType === "worker" && (
        <p className="mt-3 text-xs text-gray-500 italic">
          Pracownik udostępnia tylko ogólną lokalizację (miasto)
        </p>
      )}
    </div>
  );
}

// Extend window type for Leaflet
declare global {
  interface Window {
    L: any;
  }
}
