import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "chainly_ai_jobs_v1";

function safeParse(raw) {
  try {
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

async function persist(list) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    console.error(e);
  }
}

export const useAIJobsStore = create((set, get) => ({
  hydrated: false,
  jobs: [], // {id,type,status,createdAt,updatedAt,inputHash}

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      const parsed = raw ? safeParse(raw) : null;
      if (Array.isArray(parsed)) {
        set({ jobs: parsed.slice(0, 50), hydrated: true });
        return;
      }
    } catch (e) {
      console.error(e);
    }
    set({ hydrated: true });
  },

  rememberJob: async (job) => {
    if (!job?.id) return;
    const row = {
      id: String(job.id),
      type: String(job.type || ""),
      status: String(job.status || ""),
      createdAt: job.createdAt || null,
      updatedAt: job.updatedAt || null,
      inputHash: job.inputHash || null,
    };

    set((state) => {
      const current = Array.isArray(state.jobs) ? state.jobs : [];
      const next = [row, ...current]
        .filter(
          (x, idx, arr) =>
            arr.findIndex((y) => String(y.id) === String(x.id)) === idx,
        )
        .slice(0, 50);
      return { jobs: next };
    });

    await persist(get().jobs);
  },

  updateJob: async (job) => {
    if (!job?.id) return;

    set((state) => {
      const current = Array.isArray(state.jobs) ? state.jobs : [];
      const next = current.map((j) =>
        String(j.id) !== String(job.id)
          ? j
          : {
              ...j,
              status: String(job.status || j.status),
              updatedAt: job.updatedAt || j.updatedAt,
            },
      );
      return { jobs: next };
    });

    await persist(get().jobs);
  },
}));

export default useAIJobsStore;
