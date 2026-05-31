import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "chainly_onboarding_v1";

const defaultState = {
  currentStepIndex: 0,
  lastRoute: "/onboarding/welcome",
  startedAt: null,
};

function safeParse(str) {
  try {
    return JSON.parse(str);
  } catch (e) {
    return null;
  }
}

async function persist(state) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error(e);
  }
}

export const useOnboardingStore = create((set, get) => ({
  hydrated: false,
  ...defaultState,

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      const parsed = raw ? safeParse(raw) : null;
      if (parsed) {
        set({
          ...defaultState,
          ...parsed,
          hydrated: true,
        });
        return;
      }
    } catch (e) {
      console.error(e);
    }
    set({ hydrated: true });
  },

  setProgress: async ({ currentStepIndex, lastRoute }) => {
    const next = {
      ...getPersistSnapshot(get()),
      currentStepIndex:
        typeof currentStepIndex === "number"
          ? currentStepIndex
          : get().currentStepIndex,
      lastRoute: typeof lastRoute === "string" ? lastRoute : get().lastRoute,
      startedAt: get().startedAt || new Date().toISOString(),
    };

    set(next);
    await persist(next);
  },

  reset: async () => {
    set({ ...defaultState });
    await persist(defaultState);
  },
}));

function getPersistSnapshot(state) {
  return {
    currentStepIndex: state.currentStepIndex,
    lastRoute: state.lastRoute,
    startedAt: state.startedAt,
  };
}

export default useOnboardingStore;
