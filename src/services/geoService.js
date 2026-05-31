// Mock geo + autocomplete service (swap to Places API later)

import { destinations } from "./trailsService";

export function autocompleteDestinations(query) {
  const q = String(query || "")
    .trim()
    .toLowerCase();
  if (!q) {
    return destinations.slice(0, 6);
  }

  return destinations
    .filter((d) => {
      const hay = `${d.name} ${d.region}`.toLowerCase();
      return hay.includes(q);
    })
    .slice(0, 8);
}

function pickRegionFromGeocodeResult(result) {
  const comps = Array.isArray(result?.address_components)
    ? result.address_components
    : [];

  const admin1 = comps.find((c) =>
    (c?.types || []).includes("administrative_area_level_1"),
  );
  const country = comps.find((c) => (c?.types || []).includes("country"));

  const parts = [];
  if (admin1?.short_name) {
    parts.push(String(admin1.short_name));
  }
  if (country?.short_name) {
    parts.push(String(country.short_name));
  }

  const region = parts.join(", ");
  return region || "";
}

// Best-effort geocode for custom (typed) destinations.
// This keeps UI unchanged but gives the AI + Map screens better context.
export async function geocodeDestinationName(query) {
  const q = String(query || "").trim();
  if (!q) {
    return null;
  }

  const key = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!key) {
    return null;
  }

  const url =
    "https://maps.googleapis.com/maps/api/geocode/json?address=" +
    encodeURIComponent(q) +
    "&key=" +
    encodeURIComponent(String(key));

  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(
        `When fetching geocode, the response was [${res.status}] ${res.statusText}`,
      );
    }

    const json = await res.json();
    const first = Array.isArray(json?.results) ? json.results[0] : null;
    const loc = first?.geometry?.location || null;

    if (!loc || typeof loc.lat !== "number" || typeof loc.lng !== "number") {
      return null;
    }

    return {
      name: String(first?.formatted_address || q),
      region: pickRegionFromGeocodeResult(first),
      lat: loc.lat,
      lng: loc.lng,
    };
  } catch (e) {
    const isDev = process.env.NODE_ENV !== "production";
    if (isDev) {
      console.warn("[geoService] geocodeDestinationName failed", e);
    }
    return null;
  }
}

export default {
  autocompleteDestinations,
  geocodeDestinationName,
};
