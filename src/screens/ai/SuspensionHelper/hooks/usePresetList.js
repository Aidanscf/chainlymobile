import { useMemo } from "react";
import { useSuspensionStore } from "@/store/suspension";

export function usePresetList(selectedBikeId, terrainFilter, weatherFilter) {
  const getPresetsForBike = useSuspensionStore((s) => s.getPresetsForBike);

  const list = useMemo(() => {
    if (!selectedBikeId) return [];
    const all = getPresetsForBike(String(selectedBikeId));

    const filtered = all.filter((p) => {
      const terrainOk =
        terrainFilter === "all" || (p?.terrainTag || "") === terrainFilter;
      const weatherOk =
        weatherFilter === "all" || (p?.weatherTag || "") === weatherFilter;
      return terrainOk && weatherOk;
    });

    return filtered.sort((a, b) => {
      const aTime = a?.lastUsedAt || a?.createdAt || "";
      const bTime = b?.lastUsedAt || b?.createdAt || "";
      return String(bTime).localeCompare(String(aTime));
    });
  }, [getPresetsForBike, selectedBikeId, terrainFilter, weatherFilter]);

  return list;
}
