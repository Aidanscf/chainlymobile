import { useMemo } from "react";

export function useMaintenanceHistory(maintenanceEvents) {
  const maintenanceHistory = useMemo(() => {
    const list = Array.isArray(maintenanceEvents) ? maintenanceEvents : [];

    const sorted = [...list].sort((a, b) => {
      const aIso =
        a?.performed_at ||
        a?.performedAt ||
        a?.created_at ||
        a?.createdAt ||
        "";
      const bIso =
        b?.performed_at ||
        b?.performedAt ||
        b?.created_at ||
        b?.createdAt ||
        "";

      const aT = new Date(String(aIso)).getTime();
      const bT = new Date(String(bIso)).getTime();
      const aSafe = Number.isFinite(aT) ? aT : 0;
      const bSafe = Number.isFinite(bT) ? bT : 0;
      return bSafe - aSafe;
    });

    return sorted.slice(0, 5);
  }, [maintenanceEvents]);

  const hasMaintenanceHistory = maintenanceHistory.length > 0;

  return { maintenanceHistory, hasMaintenanceHistory };
}
