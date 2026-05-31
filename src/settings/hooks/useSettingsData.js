import { useEffect, useMemo } from "react";
import useNotificationsStore from "@/store/notifications";
import useSettingsStore from "@/store/settings";
import { useAuthStore } from "@/utils/auth/store";

export function useSettingsData() {
  const hydrated = useSettingsStore((s) => s.hydrated);
  const hydrate = useSettingsStore((s) => s.hydrate);
  const settings = useSettingsStore((s) => s.settings);
  const update = useSettingsStore((s) => s.update);
  const toggleDeveloper = useSettingsStore((s) => s.toggleDeveloper);
  const resetAll = useSettingsStore((s) => s.resetAll);

  const notifHydrated = useNotificationsStore((s) => s.hydrated);
  const hydrateNotif = useNotificationsStore((s) => s.hydrate);
  const notifPrefs = useNotificationsStore((s) => s.preferences);
  const permissionStatus = useNotificationsStore((s) => s.permissionStatus);
  const notifInboxCount = useNotificationsStore((s) => (s.inbox || []).length);

  const authStatus = useAuthStore((s) => s.status);
  const authUser = useAuthStore((s) => s.user);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    hydrateNotif();
  }, [hydrateNotif]);

  const profileSubtitle = useMemo(() => {
    const email = settings?.profile?.email;
    if (email) return email;
    return "Personalize your vibe";
  }, [settings?.profile?.email]);

  const planLabel = useMemo(() => {
    return "Free";
  }, []);

  const notificationSummary = useMemo(() => {
    if (!notifHydrated) return "Loading…";

    const enabled = [
      notifPrefs?.rideNudges?.enabled,
      notifPrefs?.maintenanceAlerts?.enabled,
      notifPrefs?.streakAlerts?.enabled,
      notifPrefs?.friendNudges?.enabled,
    ].filter(Boolean).length;

    const perm = permissionStatus === "granted" ? "On" : "Off";
    return `${enabled} types · System ${perm}`;
  }, [notifHydrated, notifPrefs, permissionStatus]);

  const notificationCenterSummary = useMemo(() => {
    if (!notifHydrated) return "Loading…";
    if (!notifInboxCount) return "No recent nudges";
    return `${notifInboxCount} recent`;
  }, [notifHydrated, notifInboxCount]);

  const showDeveloper = !!settings?.advanced?.showDeveloper;

  return {
    hydrated,
    settings,
    update,
    toggleDeveloper,
    resetAll,
    profileSubtitle,
    planLabel,
    notificationSummary,
    notificationCenterSummary,
    showDeveloper,
    authStatus,
    authUser,
  };
}
