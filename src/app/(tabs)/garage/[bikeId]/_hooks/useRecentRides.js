import { useMemo } from "react";

export function useRecentRides(rides, bikeId) {
  const recentRides = useMemo(() => {
    const list = Array.isArray(rides) ? rides : [];
    const bikeKey = String(bikeId || "");
    if (!bikeKey) return [];

    // IMPORTANT: Only use the canonical field `bike_id`.
    // If a ride has no bike_id assigned, it must not show on any bike.
    const filtered = list.filter((r) => String(r?.bike_id || "") === bikeKey);

    if (process.env.NODE_ENV !== "production") {
      const leaked = list.find(
        (r) =>
          (r?.bike_id != null || r?.bikeId != null) &&
          String(r?.bike_id || "") !== bikeKey &&
          // previous bug: showing rides by fallback bikeId field
          String(r?.bikeId || "") === bikeKey,
      );
      if (leaked) {
        console.warn(
          "[BikeDetailScreen] Skipping ride because bike_id is not attached to this bike",
          {
            bikeId: bikeKey,
            rideId: leaked?.id,
            rideBikeId: leaked?.bike_id,
            rideBikeIdLegacy: leaked?.bikeId,
          },
        );
      }
    }

    const sorted = [...filtered].sort((a, b) => {
      const aIso =
        a?.ride_at || a?.ride_date || a?.start_date || a?.created_at || "";
      const bIso =
        b?.ride_at || b?.ride_date || b?.start_date || b?.created_at || "";

      const aT = new Date(String(aIso)).getTime();
      const bT = new Date(String(bIso)).getTime();
      const aSafe = Number.isFinite(aT) ? aT : 0;
      const bSafe = Number.isFinite(bT) ? bT : 0;
      return bSafe - aSafe;
    });

    return sorted.slice(0, 5);
  }, [bikeId, rides]);

  const hasRecentRides = recentRides.length > 0;

  return { recentRides, hasRecentRides };
}
