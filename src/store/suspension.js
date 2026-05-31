import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { apiFetch } from "@/services/apiClient";
import { uuidv4 } from "@/utils/uuid";
import { isServerSyncActive, getAuthedUserId } from "@/utils/serverSync";
import { addOutboxItem } from "@/utils/outbox";
import useChainlyStore from "@/store/chainlyStore";
import { startAIJob, waitForAIJob } from "@/services/aiJobClient";
import { normalizeWeightKg } from "@/utils/suspensionMath";
import { listForks, listShocks } from "@/data/suspensionComponents.mock";

const PRESETS_KEY = "chainly_presets_v1";

function safeParse(str) {
  try {
    return JSON.parse(str);
  } catch (e) {
    return null;
  }
}

async function persistPresets(presets) {
  try {
    await AsyncStorage.setItem(PRESETS_KEY, JSON.stringify(presets || []));
  } catch (e) {
    console.error(e);
  }
}

async function readPersistedPresets() {
  try {
    const raw = await AsyncStorage.getItem(PRESETS_KEY);
    if (!raw) return null;
    const parsed = safeParse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch (e) {
    console.error(e);
    return null;
  }
}

function safeString(x) {
  return typeof x === "string" ? x : x == null ? "" : String(x);
}

function uniq(arr) {
  return Array.from(new Set(Array.isArray(arr) ? arr : []));
}

function formatSummary(settings) {
  const s = settings || {};
  const psi = Number(s.psi || 0);
  const r = s.reboundClicks;
  const c = s.compressionClicks;

  const psiText = psi ? `${Math.round(psi)} PSI` : "— PSI";
  const rText = r == null ? "R —" : `R ${r}`;
  const cText = c == null ? "C —" : `C ${c}`;

  return `${psiText} • ${rText} • ${cText}`;
}

function pickSpecComponentName(components, type) {
  const list = Array.isArray(components) ? components : [];
  const found = list.find((c) => String(c?.component_type) === String(type));
  const name = found?.name;
  return name == null ? null : String(name);
}

function resolveMockComponentId({ type, name }) {
  const n = String(name || "").toLowerCase();

  const list = type === "fork" ? listForks() : listShocks();

  if (n) {
    for (const c of list) {
      const label =
        `${String(c?.brand || "")} ${String(c?.model || "")}`.toLowerCase();
      if (!label.trim()) continue;

      // loose match both directions (handles users entering partial model names)
      if (label.includes(n) || n.includes(label)) {
        return c.id;
      }
    }

    // fallback: brand-only match
    for (const c of list) {
      const brand = String(c?.brand || "").toLowerCase();
      if (brand && n.includes(brand)) {
        return c.id;
      }
    }
  }

  // Last resort: pick a generic mock component so the Adjuster can still apply changes.
  return list?.[0]?.id || null;
}

export const useSuspensionStore = create((set, get) => ({
  // Active setup session (used across wizard -> baseline -> checklist -> adjuster)
  session: {
    bikeId: null,

    forkComponentId: null,
    shockComponentId: null,

    // Auto-prefill context from Garage (canonical bike engine)
    autoFilledBikeId: null,
    bikeTravelFrontMm: null,
    bikeTravelRearMm: null,
    forkName: null,
    shockName: null,

    weightKg: null,
    weightUnit: "lbs", // lbs | kg (UI)

    ridingStyle: "Trail", // Trail | Enduro | Bike Park | XC
    terrainBias: ["tech"], // tech | flow | jumps | trail | park | xc | race (multi)
    conditions: "general", // general | dry | wet | loose | dusty
    skillLevel: "Intermediate", // Beginner | Intermediate | Advanced

    forkSettings: null,
    shockSettings: null,

    checklistCompleted: {},
    symptomsSelected: [],

    activePresetId: null,
    lastUpdatedAt: null,
  },

  // --- AI baseline generation state ---
  aiLoading: false,
  aiJobId: null,
  aiProgress: 0,

  // Saved presets per bike
  presets: [],
  presetsHydratedFromLocal: false,
  presetsHydratedFromServer: false,
  presetsSyncError: null,
  presetsLastSyncedAt: null,

  hydratePresetsFromLocal: async () => {
    const local = await readPersistedPresets();
    if (local && local.length) {
      set({ presets: local, presetsHydratedFromLocal: true });
      return local;
    }
    set({ presetsHydratedFromLocal: true });
    await persistPresets(get().presets);
    return null;
  },

  hydratePresetsFromServer: async (bikeId) => {
    if (!isServerSyncActive()) {
      set({ presetsHydratedFromServer: true, presetsSyncError: null });
      return [];
    }

    const id = safeString(bikeId);
    if (!id) return [];

    try {
      const res = await apiFetch(`/api/bikes/${id}/presets`, { method: "GET" });
      const serverPresets = Array.isArray(res?.presets) ? res.presets : [];

      if (serverPresets.length) {
        set((state) => {
          const current = Array.isArray(state.presets) ? state.presets : [];
          const byId = new Map(current.map((p) => [safeString(p.id), p]));

          const mapped = serverPresets.map((sp) => {
            const existing = byId.get(safeString(sp.id));
            return {
              ...(existing || {}),
              id: safeString(sp.id),
              name: safeString(sp.name),
              bikeId: safeString(sp.bike_id),
              terrainTag: safeString(sp.terrain_tag || "trail"),
              weatherTag: safeString(sp.weather_tag || "dry"),
              forkSettings: sp.fork_settings || {},
              shockSettings: sp.shock_settings || {},
              createdAt: sp.created_at
                ? String(sp.created_at)
                : existing?.createdAt,
              lastUsedAt: sp.last_used_at
                ? String(sp.last_used_at)
                : existing?.lastUsedAt,
              notes: safeString(sp.notes || existing?.notes || ""),
            };
          });

          const incomingIds = new Set(mapped.map((p) => safeString(p.id)));
          const localOnly = current.filter(
            (p) => !incomingIds.has(safeString(p.id)),
          );

          return {
            presets: [...mapped, ...localOnly],
            presetsHydratedFromServer: true,
            presetsSyncError: null,
            presetsLastSyncedAt: new Date().toISOString(),
          };
        });

        await persistPresets(get().presets);
        return serverPresets;
      }

      set({
        presetsHydratedFromServer: true,
        presetsSyncError: null,
        presetsLastSyncedAt: new Date().toISOString(),
      });
      return [];
    } catch (e) {
      console.error(e);
      set({
        presetsHydratedFromServer: true,
        presetsSyncError: "Could not sync presets",
      });
      return null;
    }
  },

  // Simple service tracking (MVP)
  // key: `${bikeId}:${componentType}` -> { hoursSinceService, recommendedInterval }
  service: {},

  // ---- Session actions ----
  resetSession: () => {
    set({
      session: {
        bikeId: null,
        forkComponentId: null,
        shockComponentId: null,

        // Auto-prefill context from Garage (canonical bike engine)
        autoFilledBikeId: null,
        bikeTravelFrontMm: null,
        bikeTravelRearMm: null,
        forkName: null,
        shockName: null,

        weightKg: null,
        weightUnit: "lbs",
        ridingStyle: "Trail",
        terrainBias: ["tech"],
        conditions: "general",
        skillLevel: "Intermediate",
        forkSettings: null,
        shockSettings: null,
        checklistCompleted: {},
        symptomsSelected: [],
        activePresetId: null,
        lastUpdatedAt: null,
      },
      aiLoading: false,
      aiJobId: null,
      aiProgress: 0,
    });
  },

  setSessionField: (key, value) => {
    set((state) => ({
      session: {
        ...state.session,
        [key]: value,
        lastUpdatedAt: new Date().toISOString(),
      },
    }));
  },

  toggleTerrainBias: (tag) => {
    set((state) => {
      const next = new Set(state.session.terrainBias || []);
      if (next.has(tag)) {
        next.delete(tag);
      } else {
        next.add(tag);
      }
      return {
        session: {
          ...state.session,
          terrainBias: Array.from(next),
          lastUpdatedAt: new Date().toISOString(),
        },
      };
    });
  },

  toggleSymptom: (symptomKey) => {
    set((state) => {
      const next = new Set(state.session.symptomsSelected || []);
      if (next.has(symptomKey)) {
        next.delete(symptomKey);
      } else {
        next.add(symptomKey);
      }
      return {
        session: {
          ...state.session,
          symptomsSelected: Array.from(next),
          lastUpdatedAt: new Date().toISOString(),
        },
      };
    });
  },

  clearSymptoms: () => {
    set((state) => ({
      session: {
        ...state.session,
        symptomsSelected: [],
        lastUpdatedAt: new Date().toISOString(),
      },
    }));
  },

  toggleChecklistItem: (key) => {
    set((state) => {
      const prev = state.session.checklistCompleted || {};
      const next = { ...prev, [key]: !prev[key] };
      return {
        session: {
          ...state.session,
          checklistCompleted: next,
          lastUpdatedAt: new Date().toISOString(),
        },
      };
    });
  },

  setComputedSettings: ({ forkSettings, shockSettings }) => {
    set((state) => ({
      session: {
        ...state.session,
        forkSettings: forkSettings || null,
        shockSettings: shockSettings || null,
        lastUpdatedAt: new Date().toISOString(),
      },
    }));
  },

  autoFillBikeSuspensionFromGarage: async ({ bikeId }) => {
    const id = String(bikeId || "");
    if (!id) return null;

    // Best-effort: hydrate full bike detail (components + spec sheet)
    try {
      const hydrateBikeGarageFromServer =
        useChainlyStore.getState?.().hydrateBikeGarageFromServer;
      if (typeof hydrateBikeGarageFromServer === "function") {
        await hydrateBikeGarageFromServer(id);
      }
    } catch (e) {
      // best-effort only
      console.error(e);
    }

    const chain = useChainlyStore.getState?.();
    const bike = chain?.getBikeById?.(id) || null;
    const comps = chain?.getComponentsForBike?.(id) || [];

    const forkName = pickSpecComponentName(comps, "fork");
    const shockName = pickSpecComponentName(comps, "shock");

    const travelFront =
      bike?.suspension_travel_front != null
        ? Number(bike.suspension_travel_front)
        : bike?.suspensionTravelFrontMm != null
          ? Number(bike.suspensionTravelFrontMm)
          : null;
    const travelRear =
      bike?.suspension_travel_rear != null
        ? Number(bike.suspension_travel_rear)
        : bike?.suspensionTravelRearMm != null
          ? Number(bike.suspensionTravelRearMm)
          : null;

    // Resolve mock component IDs for the adjuster logic (best-effort)
    const forkComponentId = resolveMockComponentId({
      type: "fork",
      name: forkName,
    });
    const shockComponentId = resolveMockComponentId({
      type: "shock",
      name: shockName,
    });

    set((state) => ({
      session: {
        ...state.session,
        bikeId: id,
        autoFilledBikeId: id,
        bikeTravelFrontMm:
          Number.isFinite(travelFront) && travelFront > 0 ? travelFront : null,
        bikeTravelRearMm:
          Number.isFinite(travelRear) && travelRear > 0 ? travelRear : null,
        forkName: forkName || null,
        shockName: shockName || null,
        forkComponentId:
          state.session.forkComponentId || forkComponentId || null,
        shockComponentId:
          state.session.shockComponentId || shockComponentId || null,
        lastUpdatedAt: new Date().toISOString(),
      },
    }));

    return { forkName, shockName, travelFront, travelRear };
  },

  generateBaselineFromAI: async () => {
    const s = get().session;
    const bikeId = String(s?.bikeId || "");

    if (!bikeId) {
      throw new Error("Pick a bike first");
    }

    // Ensure we have fork/shock names + travel from the bike spec sheet.
    if (String(s?.autoFilledBikeId || "") !== bikeId) {
      await get().autoFillBikeSuspensionFromGarage({ bikeId });
    }

    const sessionNow = get().session;

    const wKg = normalizeWeightKg({
      value: sessionNow.weightKg,
      unit: sessionNow.weightUnit,
    });

    if (!wKg || wKg < 35 || wKg > 140) {
      throw new Error("Enter a real rider weight");
    }

    const ridingStyle = String(sessionNow?.ridingStyle || "Trail");
    const terrainBias = Array.isArray(sessionNow?.terrainBias)
      ? sessionNow.terrainBias
      : [];
    const skillLevel = String(sessionNow?.skillLevel || "Intermediate");
    const conditions = String(sessionNow?.conditions || "general");

    if (!ridingStyle) {
      throw new Error("Pick a riding style");
    }
    if (!terrainBias.length) {
      throw new Error("Pick at least one terrain vibe");
    }

    set({ aiLoading: true, aiProgress: 0, aiJobId: null });

    try {
      // Keep it feeling premium
      await new Promise((r) => setTimeout(r, 250));

      const input = {
        weightKg: wKg,
        ridingStyle,
        terrainBias,
        skillLevel,
        conditions,
        bikeTravelFrontMm: sessionNow?.bikeTravelFrontMm ?? null,
        bikeTravelRearMm: sessionNow?.bikeTravelRearMm ?? null,
        forkName: sessionNow?.forkName ?? null,
        shockName: sessionNow?.shockName ?? null,
      };

      const { job } = await startAIJob({
        type: "suspension_baseline",
        input,
      });

      if (!job?.id) {
        throw new Error("Could not start suspension job");
      }

      set({
        aiJobId: String(job.id),
        aiProgress: Number(job.progress || 0) || 0,
      });

      let finalJob = job;
      if (String(job.status || "") !== "completed") {
        const waiter = waitForAIJob({
          jobId: job.id,
          pollIntervalMs: 650,
          timeoutMs: 35000,
          onProgress: (j) => {
            const nextProg = Number(j?.progress || 0) || 0;
            set({ aiProgress: Math.max(0, Math.min(100, nextProg)) });
          },
        });
        finalJob = await waiter.done;
      }

      const res = finalJob?.result || null;
      const forkSettings = res?.forkSettings || null;
      const shockSettings = res?.shockSettings || null;

      if (!forkSettings || !shockSettings) {
        throw new Error("AI response missing fork/shock settings");
      }

      get().setComputedSettings({ forkSettings, shockSettings });
      get().ensureServiceTrackers({ bikeId });

      set({ aiLoading: false, aiProgress: 100 });
      return { forkSettings, shockSettings, job: finalJob };
    } catch (e) {
      console.error(e);
      set({ aiLoading: false });
      throw e;
    }
  },

  // ---- Presets ----
  savePresetFromSession: ({ name, terrainTag, weatherTag }) => {
    const s = get().session;
    if (!s.bikeId || !s.forkSettings || !s.shockSettings) {
      throw new Error("Missing session data to save preset");
    }

    const presetId = uuidv4();
    const createdAt = new Date().toISOString();
    const preset = {
      id: presetId,
      name: safeString(name || ""),
      bikeId: safeString(s.bikeId),
      terrainTag: safeString(terrainTag || (s.terrainBias || [])[0] || "trail"),
      weatherTag: safeString(weatherTag || "dry"),
      forkComponentId: s.forkComponentId,
      shockComponentId: s.shockComponentId,
      forkSettings: s.forkSettings,
      shockSettings: s.shockSettings,
      createdAt,
      lastUsedAt: null,
      notes: "",
    };

    set((state) => ({
      presets: [preset, ...(state.presets || [])],
      session: {
        ...state.session,
        activePresetId: presetId,
        lastUpdatedAt: createdAt,
      },
    }));

    // Ensure service trackers exist for this bike
    get().ensureServiceTrackers({ bikeId: s.bikeId });

    // Persist locally (offline-first)
    persistPresets(get().presets);

    // Best-effort server sync
    const payload = {
      id: preset.id,
      bikeId: preset.bikeId,
      name: preset.name,
      notes: preset.notes,
      terrainTag: preset.terrainTag,
      weatherTag: preset.weatherTag,
      forkSettings: preset.forkSettings,
      shockSettings: preset.shockSettings,
      lastUsedAt: preset.lastUsedAt,
    };

    if (isServerSyncActive()) {
      apiFetch(`/api/bikes/${preset.bikeId}/presets`, {
        method: "POST",
        body: JSON.stringify(payload),
      }).catch(async (e) => {
        console.error(e);
        await addOutboxItem({
          type: "createPreset",
          userId: getAuthedUserId(),
          payload,
        });
      });
    }

    return preset;
  },

  deletePreset: (presetId) => {
    const id = safeString(presetId);

    set((state) => ({
      presets: (state.presets || []).filter((p) => safeString(p.id) !== id),
      session:
        safeString(state.session.activePresetId) === id
          ? { ...state.session, activePresetId: null }
          : state.session,
    }));

    persistPresets(get().presets);

    if (isServerSyncActive()) {
      apiFetch(`/api/presets/${id}`, { method: "DELETE" }).catch(async (e) => {
        console.error(e);
        await addOutboxItem({
          type: "deletePreset",
          userId: getAuthedUserId(),
          payload: { presetId: id },
        });
      });
    }
  },

  applyPreset: (presetId) => {
    const preset = (get().presets || []).find((p) => p.id === presetId) || null;
    if (!preset) {
      return;
    }

    const usedAt = new Date().toISOString();

    set((state) => ({
      presets: (state.presets || []).map((p) =>
        p.id === presetId ? { ...p, lastUsedAt: usedAt } : p,
      ),
      session: {
        ...state.session,
        bikeId: preset.bikeId,
        forkComponentId: preset.forkComponentId,
        shockComponentId: preset.shockComponentId,
        forkSettings: preset.forkSettings,
        shockSettings: preset.shockSettings,
        activePresetId: preset.id,
        lastUpdatedAt: usedAt,
      },
    }));

    persistPresets(get().presets);

    if (isServerSyncActive()) {
      apiFetch(`/api/presets/${presetId}`, {
        method: "PUT",
        body: JSON.stringify({ lastUsedAt: usedAt }),
      }).catch(async (e) => {
        console.error(e);
        await addOutboxItem({
          type: "updatePreset",
          userId: getAuthedUserId(),
          payload: {
            presetId: safeString(presetId),
            patch: { lastUsedAt: usedAt },
          },
        });
      });
    }

    get().ensureServiceTrackers({ bikeId: preset.bikeId });
  },

  duplicatePreset: (presetId) => {
    const preset = (get().presets || []).find((p) => p.id === presetId) || null;
    if (!preset) {
      return null;
    }

    const newId = uuidv4();
    const createdAt = new Date().toISOString();

    const copy = {
      ...preset,
      id: newId,
      name: `${safeString(preset.name || "Preset")} Copy`,
      createdAt,
      lastUsedAt: null,
    };

    set((state) => ({
      presets: [copy, ...(state.presets || [])],
    }));

    persistPresets(get().presets);

    // Treat as a new preset on the server (best-effort).
    const payload = {
      id: copy.id,
      bikeId: copy.bikeId,
      name: copy.name,
      notes: copy.notes,
      terrainTag: copy.terrainTag,
      weatherTag: copy.weatherTag,
      forkSettings: copy.forkSettings,
      shockSettings: copy.shockSettings,
      lastUsedAt: copy.lastUsedAt,
    };

    if (isServerSyncActive()) {
      apiFetch(`/api/bikes/${copy.bikeId}/presets`, {
        method: "POST",
        body: JSON.stringify(payload),
      }).catch(async (e) => {
        console.error(e);
        await addOutboxItem({
          type: "createPreset",
          userId: getAuthedUserId(),
          payload,
        });
      });
    }

    return copy;
  },

  renamePreset: (presetId, name) => {
    set((state) => ({
      presets: (state.presets || []).map((p) =>
        p.id === presetId ? { ...p, name: safeString(name) } : p,
      ),
    }));

    persistPresets(get().presets);

    if (isServerSyncActive()) {
      apiFetch(`/api/presets/${safeString(presetId)}`, {
        method: "PUT",
        body: JSON.stringify({ name: safeString(name) }),
      }).catch(async (e) => {
        console.error(e);
        await addOutboxItem({
          type: "updatePreset",
          userId: getAuthedUserId(),
          payload: {
            presetId: safeString(presetId),
            patch: { name: safeString(name) },
          },
        });
      });
    }
  },

  updatePresetNotes: (presetId, notes) => {
    set((state) => ({
      presets: (state.presets || []).map((p) =>
        p.id === presetId ? { ...p, notes: safeString(notes) } : p,
      ),
    }));

    persistPresets(get().presets);

    if (isServerSyncActive()) {
      apiFetch(`/api/presets/${safeString(presetId)}`, {
        method: "PUT",
        body: JSON.stringify({ notes: safeString(notes) }),
      }).catch(async (e) => {
        console.error(e);
        await addOutboxItem({
          type: "updatePreset",
          userId: getAuthedUserId(),
          payload: {
            presetId: safeString(presetId),
            patch: { notes: safeString(notes) },
          },
        });
      });
    }
  },

  updatePresetTags: (presetId, { terrainTag, weatherTag }) => {
    set((state) => ({
      presets: (state.presets || []).map((p) => {
        if (p.id !== presetId) {
          return p;
        }
        return {
          ...p,
          terrainTag:
            terrainTag == null ? p.terrainTag : safeString(terrainTag),
          weatherTag:
            weatherTag == null ? p.weatherTag : safeString(weatherTag),
        };
      }),
    }));

    persistPresets(get().presets);

    if (isServerSyncActive()) {
      apiFetch(`/api/presets/${safeString(presetId)}`, {
        method: "PUT",
        body: JSON.stringify({ terrainTag, weatherTag }),
      }).catch(async (e) => {
        console.error(e);
        await addOutboxItem({
          type: "updatePreset",
          userId: getAuthedUserId(),
          payload: {
            presetId: safeString(presetId),
            patch: {
              terrainTag: terrainTag == null ? undefined : terrainTag,
              weatherTag: weatherTag == null ? undefined : weatherTag,
            },
          },
        });
      });
    }
  },

  // ---- Service tracking (MVP) ----
  ensureServiceTrackers: ({ bikeId }) => {
    const id = safeString(bikeId);
    if (!id) {
      return;
    }

    set((state) => {
      const next = { ...(state.service || {}) };

      const forkKey = `${id}:fork`;
      const shockKey = `${id}:shock`;

      if (!next[forkKey]) {
        next[forkKey] = {
          componentId: forkKey,
          hoursSinceService: 0,
          recommendedInterval: 50,
        };
      }
      if (!next[shockKey]) {
        next[shockKey] = {
          componentId: shockKey,
          hoursSinceService: 0,
          recommendedInterval: 60,
        };
      }

      return { service: next };
    });
  },

  addRideHours: ({ bikeId, hours }) => {
    const id = safeString(bikeId);
    const h = Number(hours || 0);
    if (!id || !Number.isFinite(h) || h <= 0) {
      return;
    }

    set((state) => {
      const next = { ...(state.service || {}) };
      const forkKey = `${id}:fork`;
      const shockKey = `${id}:shock`;

      const fork = next[forkKey] || {
        hoursSinceService: 0,
        recommendedInterval: 50,
      };
      const shock = next[shockKey] || {
        hoursSinceService: 0,
        recommendedInterval: 60,
      };

      next[forkKey] = {
        ...fork,
        componentId: forkKey,
        hoursSinceService: Number(fork.hoursSinceService || 0) + h,
      };
      next[shockKey] = {
        ...shock,
        componentId: shockKey,
        hoursSinceService: Number(shock.hoursSinceService || 0) + h,
      };

      return { service: next };
    });
  },

  resetService: ({ bikeId, type }) => {
    const id = safeString(bikeId);
    const t = safeString(type);
    if (!id || !t) {
      return;
    }

    set((state) => {
      const next = { ...(state.service || {}) };
      const key = `${id}:${t}`;
      const prev = next[key];
      if (!prev) {
        return { service: next };
      }
      next[key] = { ...prev, hoursSinceService: 0 };
      return { service: next };
    });
  },

  // ---- Selectors ----
  getPresetsForBike: (bikeId) => {
    const id = safeString(bikeId);
    const list = get().presets || [];
    return list.filter((p) => safeString(p.bikeId) === id);
  },

  getServiceStatus: ({ bikeId, type }) => {
    const id = safeString(bikeId);
    const t = safeString(type);
    const key = `${id}:${t}`;
    const entry = (get().service || {})[key] || null;
    if (!entry) {
      return null;
    }

    const hours = Number(entry.hoursSinceService || 0);
    const interval = Number(entry.recommendedInterval || 50);
    const remaining = Math.max(0, interval - hours);

    return {
      ...entry,
      remainingHours: remaining,
      isDueSoon: remaining <= 10,
      isOverdue: hours > interval,
    };
  },

  getSharePayloadForBike: (bikeId) => {
    const list = get().getPresetsForBike(bikeId);
    const top = list.slice(0, 3);
    return {
      bikeId: safeString(bikeId),
      topPresets: top.map((p) => ({
        id: p.id,
        name: p.name,
        terrainTag: p.terrainTag,
        weatherTag: p.weatherTag,
        createdAt: p.createdAt,
        forkSettings: p.forkSettings,
        shockSettings: p.shockSettings,
      })),
    };
  },

  getSharePayloadForPreset: (presetId) => {
    const preset = (get().presets || []).find((p) => p.id === presetId) || null;
    if (!preset) {
      return null;
    }

    return {
      id: preset.id,
      name: preset.name,
      notes: preset.notes,
      terrainTag: preset.terrainTag,
      weatherTag: preset.weatherTag,
      forkSummary: formatSummary(preset.forkSettings),
      shockSummary: formatSummary(preset.shockSettings),
    };
  },
}));

export default useSuspensionStore;
