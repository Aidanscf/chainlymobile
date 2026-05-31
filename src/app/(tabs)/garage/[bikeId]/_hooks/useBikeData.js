import { useMemo } from "react";
import { useChainlyStore } from "@/store/chainlyStore";
import { useRidesStore } from "@/store/rides";

export function useBikeData(bikeId) {
  const bike = useChainlyStore((s) => s.getBikeById(bikeId));
  const detail = useChainlyStore((s) => s.getBikeDetailById(bikeId));
  const maintenanceEvents = useChainlyStore((s) =>
    s.getMaintenanceEventsForBike(bikeId),
  );
  const rides = useRidesStore((s) => s.rides);

  const displayedHealthScore = useMemo(() => {
    const d = detail?.healthScore;
    if (Number.isFinite(d)) return d;
    const b = bike?.healthScore;
    if (Number.isFinite(b)) return b;
    return 0;
  }, [bike?.healthScore, detail?.healthScore]);

  const breakdown = detail?.componentHealth || [];
  const previewSpecs = detail?.specPreview || [];
  const parts = detail?.parts || {};

  return {
    bike,
    detail,
    maintenanceEvents,
    rides,
    displayedHealthScore,
    breakdown,
    previewSpecs,
    parts,
  };
}
