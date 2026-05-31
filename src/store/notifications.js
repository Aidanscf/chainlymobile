import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "chainly_notifications_v1";

const defaultPrefs = {
  rideNudges: {
    enabled: true,
    frequency: "normal", // few | normal | often
    preferredTime: "Evening", // Morning | Afternoon | Evening
  },
  maintenanceAlerts: { enabled: true },
  streakAlerts: { enabled: true },
  friendNudges: { enabled: true },
  doNotDisturb: {
    enabled: false,
    start: "21:00",
    end: "07:00",
  },
};

function safeParse(json) {
  try {
    return JSON.parse(json);
  } catch (e) {
    return null;
  }
}

function normalizePreferredTime(value) {
  const v = String(value || "").trim();
  if (v.toLowerCase() === "morning") return "Morning";
  if (v.toLowerCase() === "afternoon") return "Afternoon";
  if (v.toLowerCase() === "evening") return "Evening";
  return "Evening";
}

async function persist(partial) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(partial));
  } catch (e) {
    console.error(e);
  }
}

export const useNotificationsStore = create((set, get) => ({
  hydrated: false,

  permissionStatus: "undetermined", // undetermined | granted | denied
  hasSeenPermissionPrompt: false,

  preferences: defaultPrefs,

  // minimal local history
  inbox: [], // { id, type, title, body, createdAt, deepLink }
  scheduled: [], // { id, type, deepLink, scheduledAt }

  // mocked habit input
  lastRideAt: null,

  hydrate: async () => {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const parsed = raw ? safeParse(raw) : null;

    if (parsed) {
      const prefs = parsed.preferences || defaultPrefs;

      // Back-compat: older builds used lowercase "morning" | "afternoon" | "evening".
      const nextPrefs = {
        ...defaultPrefs,
        ...prefs,
        rideNudges: {
          ...defaultPrefs.rideNudges,
          ...(prefs.rideNudges || {}),
          preferredTime: normalizePreferredTime(
            prefs?.rideNudges?.preferredTime,
          ),
        },
      };

      set({
        permissionStatus: parsed.permissionStatus || "undetermined",
        hasSeenPermissionPrompt: !!parsed.hasSeenPermissionPrompt,
        preferences: nextPrefs,
        inbox: Array.isArray(parsed.inbox) ? parsed.inbox : [],
        scheduled: Array.isArray(parsed.scheduled) ? parsed.scheduled : [],
        lastRideAt: parsed.lastRideAt || null,
        hydrated: true,
      });
      return;
    }

    set({ hydrated: true });
  },

  setPermissionStatus: async (status) => {
    set({ permissionStatus: status });
    await persist({
      ...getPersistSnapshot(get()),
      permissionStatus: status,
    });
  },

  setHasSeenPermissionPrompt: async (seen) => {
    set({ hasSeenPermissionPrompt: !!seen });
    await persist({
      ...getPersistSnapshot(get()),
      hasSeenPermissionPrompt: !!seen,
    });
  },

  setPreferences: async (nextPrefs) => {
    const normalized = {
      ...defaultPrefs,
      ...(nextPrefs || {}),
      rideNudges: {
        ...defaultPrefs.rideNudges,
        ...(nextPrefs?.rideNudges || {}),
        preferredTime: normalizePreferredTime(
          nextPrefs?.rideNudges?.preferredTime,
        ),
      },
    };

    set({ preferences: normalized });
    await persist({
      ...getPersistSnapshot(get()),
      preferences: normalized,
    });
  },

  addInboxItem: async (item) => {
    set((state) => {
      const next = [item, ...(state.inbox || [])]
        .filter((x, idx, arr) => arr.findIndex((y) => y.id === x.id) === idx)
        .slice(0, 60);
      return { inbox: next };
    });

    await persist({
      ...getPersistSnapshot(get()),
      inbox: get().inbox,
    });
  },

  setScheduled: async (scheduled) => {
    set({ scheduled });
    await persist({
      ...getPersistSnapshot(get()),
      scheduled,
    });
  },

  logRideNow: async () => {
    const now = new Date().toISOString();
    set({ lastRideAt: now });
    await persist({
      ...getPersistSnapshot(get()),
      lastRideAt: now,
    });
  },

  clearInbox: async () => {
    set({ inbox: [] });
    await persist({
      ...getPersistSnapshot(get()),
      inbox: [],
    });
  },
}));

function getPersistSnapshot(state) {
  return {
    permissionStatus: state.permissionStatus,
    hasSeenPermissionPrompt: state.hasSeenPermissionPrompt,
    preferences: state.preferences,
    inbox: state.inbox,
    scheduled: state.scheduled,
    lastRideAt: state.lastRideAt,
  };
}

export default useNotificationsStore;
