import { useMemo } from "react";
import { computeMaintenanceQuests } from "@/utils/maintenanceQuests";

export function useMaintenanceQuests(bike, rides, maintenanceEvents) {
  const quests = useMemo(() => {
    if (!bike) {
      return { urgent: [], dueSoon: [], ok: [] };
    }

    return computeMaintenanceQuests({
      bike,
      rides,
      maintenanceEvents,
    });
  }, [bike, maintenanceEvents, rides]);

  return quests;
}
