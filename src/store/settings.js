import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "chainly_settings_v1";

const defaultSettings = {
  onboarding: {
    onboardingComplete: false,
    accountConnected: false,
    proUnlocked: false,
    completedAt: null,
  },

  // --- Sync metadata (local-first, safe)
  // Used for simple last-write-wins when syncing onboarding/profile answers.
  syncMeta: {
    profileUpdatedAt: null,
  },

  /**
   * Canonical profile/preferences used by onboarding + settings.
   * These are the fields the onboarding funnel writes to immediately.
   */
  userProfile: {
    skillLevel: "Intermediate", // Beginner | Intermediate | Advanced
    ridingFrequency: "2-3x/week", // 1x/week | 2-3x/week | 4-6x/week | Daily
    ridingGoals: ["Improve skills"],
    primaryDiscipline: "Trail", // Trail | Enduro | XC | DH/Bike Park | Gravel/Road
    terrainPreference: ["Flow"], // Tech | Flow | Jumps | Steeps | Climbs
    maintenanceMindset: "I’m decent", // I baby it | I’m decent | I ride it hard | What maintenance?
    yearlySpendRange: "$250–750", // $0–250 | $250–750 | $750–1500 | $1500–3000 | $3000+
    units: "Metric", // Metric | Imperial
  },

  bikeInfo: {
    hasBike: true,
    bikeType: "Mountain", // Mountain | Gravel/Road | Multiple
    primaryBikeId: null,
  },

  // Saved regardless of system permission state.
  notificationPrefs: {
    rideNudgesEnabled: true,
    maintenanceRemindersEnabled: true,
    streakAlertsEnabled: true,
    friendNudgesEnabled: true,
    preferredTime: "Evening", // Morning | Afternoon | Evening
  },

  // --- Existing settings structure (kept for backwards compatibility)
  profile: {
    name: "Rider",
    email: "",
    avatarUri: null,
  },

  riding: {
    defaultBikeId: null,
    goals: ["Improve skills"], // Get fitter | Ride more | Improve skills | Prepare for trips
    terrain: ["Flow"], // Tech | Flow | Jumps | Climbs
    typicalDurationMins: 60,
    skillLevel: "Intermediate", // Beginner | Intermediate | Advanced
  },

  ai: {
    coachingStyle: "Encouraging", // Encouraging | Balanced | Direct
    analysisStrictness: "Normal", // Forgiving | Normal | Strict
    autoSaveAIResults: true,
    allowAISkillUpdates: true,
    toolsEnabled: false, // Activated during onboarding or settings
  },

  social: {
    profileVisibility: "Friends", // Everyone | Friends | Private
    allowCompare: true,
    allowActivityView: true,
    allowFriendNudges: true,
  },

  data: {
    stravaConnected: false,
  },

  appearance: {
    units: "Metric", // Metric | Imperial
    language: "English",
  },

  advanced: {
    showDeveloper: false,
  },
};

function safeParse(str) {
  try {
    return JSON.parse(str);
  } catch (e) {
    return null;
  }
}

async function persist(value) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch (e) {
    console.error(e);
  }
}

function structuredCloneSafe(obj) {
  try {
    // Hermes supports structuredClone in modern builds, but fall back safely.
    if (typeof structuredClone === "function") {
      return structuredClone(obj);
    }
  } catch (e) {
    // ignore
  }
  return JSON.parse(JSON.stringify(obj));
}

function applyCanonicalMappings(next) {
  // Keep older parts of the app working while we transition to the canonical fields.
  const up = next?.userProfile || {};

  // skill
  if (typeof up.skillLevel === "string") {
    next.riding = next.riding || {};
    next.riding.skillLevel = up.skillLevel;
  }

  // goals
  if (Array.isArray(up.ridingGoals)) {
    next.riding = next.riding || {};
    next.riding.goals = up.ridingGoals;
  }

  // terrain
  if (Array.isArray(up.terrainPreference)) {
    next.riding = next.riding || {};
    next.riding.terrain = up.terrainPreference;
  }

  // units
  if (typeof up.units === "string") {
    next.appearance = next.appearance || {};
    next.appearance.units = up.units;
  }

  // default bike
  if (next?.bikeInfo && "primaryBikeId" in next.bikeInfo) {
    next.riding = next.riding || {};
    next.riding.defaultBikeId = next.bikeInfo.primaryBikeId || null;
  }

  return next;
}

export const useSettingsStore = create((set, get) => ({
  hydrated: false,
  settings: defaultSettings,

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      const parsed = raw ? safeParse(raw) : null;
      if (parsed) {
        // Controlled merge so removed settings don't come back from older storage.
        let merged = {
          ...defaultSettings,
          ...parsed,

          onboarding: {
            ...defaultSettings.onboarding,
            ...(parsed.onboarding || {}),
          },

          syncMeta: {
            ...defaultSettings.syncMeta,
            ...(parsed.syncMeta || {}),
          },

          userProfile: {
            ...defaultSettings.userProfile,
            ...(parsed.userProfile || {}),
          },

          bikeInfo: {
            ...defaultSettings.bikeInfo,
            ...(parsed.bikeInfo || {}),
          },

          notificationPrefs: {
            ...defaultSettings.notificationPrefs,
            ...(parsed.notificationPrefs || {}),
          },

          profile: { ...defaultSettings.profile, ...(parsed.profile || {}) },
          riding: { ...defaultSettings.riding, ...(parsed.riding || {}) },
          ai: { ...defaultSettings.ai, ...(parsed.ai || {}) },
          social: {
            ...defaultSettings.social,
            ...(parsed.social || {}),
          },
          data: { ...defaultSettings.data, ...(parsed.data || {}) },
          appearance: {
            ...defaultSettings.appearance,
            ...(parsed.appearance || {}),
          },
          advanced: { ...defaultSettings.advanced, ...(parsed.advanced || {}) },
        };

        // Explicitly strip legacy keys (from older versions)
        if (merged.social && "blockedUsers" in merged.social) {
          delete merged.social.blockedUsers;
        }
        if (merged.appearance) {
          delete merged.appearance.theme;
          delete merged.appearance.videoAutoplay;
          delete merged.appearance.haptics;
          delete merged.appearance.reduceMotion;
        }

        merged = applyCanonicalMappings(merged);

        set({ settings: merged, hydrated: true });
        return;
      }
    } catch (e) {
      console.error(e);
    }
    set({ hydrated: true });
  },

  setSettings: async (next) => {
    const withMappings = applyCanonicalMappings(structuredCloneSafe(next));

    // If a caller updated onboarding/profile settings, bump the local updatedAt.
    if (!withMappings.syncMeta) {
      withMappings.syncMeta = { ...defaultSettings.syncMeta };
    }

    set({ settings: withMappings });
    await persist(withMappings);
  },

  update: async (path, value) => {
    const current = get().settings;
    const next = structuredCloneSafe(current);

    // path like: "profile.name" or "appearance.units"
    const parts = String(path).split(".");
    let node = next;
    for (let i = 0; i < parts.length - 1; i += 1) {
      const key = parts[i];
      node[key] = node[key] || {};
      node = node[key];
    }
    node[parts[parts.length - 1]] = value;

    // If we're editing onboarding/profile answers, bump the updatedAt used for sync.
    const isProfileLike =
      path.startsWith("userProfile.") ||
      path.startsWith("notificationPrefs.") ||
      path.startsWith("bikeInfo.") ||
      path.startsWith("appearance.units");

    if (isProfileLike) {
      next.syncMeta = next.syncMeta || {};
      next.syncMeta.profileUpdatedAt = new Date().toISOString();
    }

    // Keep legacy keys from being reintroduced.
    if (next.social && "blockedUsers" in next.social) {
      delete next.social.blockedUsers;
    }
    if (next.appearance) {
      delete next.appearance.theme;
      delete next.appearance.videoAutoplay;
      delete next.appearance.haptics;
      delete next.appearance.reduceMotion;
    }

    const withMappings = applyCanonicalMappings(next);

    set({ settings: withMappings });
    await persist(withMappings);
  },

  markOnboardingComplete: async () => {
    const current = get().settings;
    const next = structuredCloneSafe(current);
    next.onboarding = next.onboarding || {};
    next.onboarding.onboardingComplete = true;
    next.onboarding.completedAt = new Date().toISOString();

    const withMappings = applyCanonicalMappings(next);

    set({ settings: withMappings });
    await persist(withMappings);
  },

  toggleDeveloper: async () => {
    const current = get().settings;
    const next = structuredCloneSafe(current);
    next.advanced.showDeveloper = !next.advanced.showDeveloper;
    set({ settings: next });
    await persist(next);
  },

  resetAll: async () => {
    set({ settings: defaultSettings });
    await persist(defaultSettings);
  },
}));

export default useSettingsStore;
