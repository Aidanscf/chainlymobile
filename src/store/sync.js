import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

const META_KEY = "chainly_sync_meta_v1";

function safeParse(str) {
  try {
    return JSON.parse(str);
  } catch (e) {
    return null;
  }
}

async function persist(meta) {
  try {
    await AsyncStorage.setItem(META_KEY, JSON.stringify(meta));
  } catch (e) {
    console.error(e);
  }
}

export const useSyncStore = create((set, get) => ({
  hydrated: false,

  outboxCount: 0,
  lastSyncedAt: null,
  syncing: false,
  error: null,

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(META_KEY);
      const parsed = raw ? safeParse(raw) : null;
      set({
        hydrated: true,
        outboxCount: Number(parsed?.outboxCount || 0),
        lastSyncedAt: parsed?.lastSyncedAt ? String(parsed.lastSyncedAt) : null,
        syncing: false,
        error: null,
      });
    } catch (e) {
      console.error(e);
      set({ hydrated: true });
    }
  },

  setOutboxCount: async (count) => {
    const next = Math.max(0, Number(count || 0));
    set({ outboxCount: next });
    await persist({
      outboxCount: next,
      lastSyncedAt: get().lastSyncedAt,
    });
  },

  setLastSyncedAt: async (iso) => {
    const next = iso ? String(iso) : null;
    set({ lastSyncedAt: next });
    await persist({
      outboxCount: get().outboxCount,
      lastSyncedAt: next,
    });
  },

  setSyncing: (syncing) => set({ syncing: !!syncing }),
  setError: (error) => set({ error: error ? String(error) : null }),
  clearError: () => set({ error: null }),
}));

// Add default export for compatibility
export default useSyncStore;
