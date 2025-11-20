/**
 * Geocoding Service - konwersja adresów na współrzędne GPS
 * Używa Nominatim API (OpenStreetMap) - darmowy, bez API key
 */

interface GeocodeResult {
  latitude: number;
  longitude: number;
  displayName: string;
}

/**
 * Konwertuje adres na współrzędne GPS używając Nominatim API
 *
 * @param address - Ulica i numer
 * @param city - Miasto
 * @param postalCode - Kod pocztowy (opcjonalny)
 * @param country - Kraj (domyślnie: Netherlands)
 * @returns Promise z lat/lng lub null jeśli nie znaleziono
 */
export async function geocodeAddress(
  address: string,
  city: string,
  postalCode?: string | null,
  country: string = "Netherlands"
): Promise<GeocodeResult | null> {
  try {
    // Build full address query
    const parts = [address, postalCode, city, country].filter(Boolean);
    const query = parts.join(", ");

    // Nominatim API endpoint (free, no API key)
    const url =
      `https://nominatim.openstreetmap.org/search?` +
      `q=${encodeURIComponent(query)}&` +
      `format=json&` +
      `limit=1&` +
      `addressdetails=1`;

    // Important: Nominatim requires User-Agent header
    const response = await fetch(url, {
      headers: {
        "User-Agent": "ZZP-Werkplaats/1.0 (contact@zzp-werkplaats.nl)",
      },
    });

    if (!response.ok) {
      console.error("Nominatim API error:", response.statusText);
      return null;
    }

    const data = await response.json();

    if (data && data.length > 0 && data[0].lat && data[0].lon) {
      return {
        latitude: parseFloat(data[0].lat),
        longitude: parseFloat(data[0].lon),
        displayName: data[0].display_name,
      };
    }

    return null;
  } catch (error) {
    console.error("Geocoding error:", error);
    return null;
  }
}

/**
 * Reverse geocoding - konwertuje GPS na adres
 * Użyteczne do walidacji lub automatycznego wypełniania
 */
export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<{
  address: string;
  city: string;
  postalCode: string;
  country: string;
} | null> {
  try {
    const url =
      `https://nominatim.openstreetmap.org/reverse?` +
      `lat=${latitude}&` +
      `lon=${longitude}&` +
      `format=json&` +
      `addressdetails=1`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": "ZZP-Werkplaats/1.0 (contact@zzp-werkplaats.nl)",
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    if (data && data.address) {
      return {
        address: [data.address.road, data.address.house_number]
          .filter(Boolean)
          .join(" "),
        city:
          data.address.city || data.address.town || data.address.village || "",
        postalCode: data.address.postcode || "",
        country: data.address.country || "",
      };
    }

    return null;
  } catch (error) {
    console.error("Reverse geocoding error:", error);
    return null;
  }
}
