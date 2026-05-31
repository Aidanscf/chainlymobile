import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiFetch, logEvent } from "@/services/apiClient";
import { uuidv4 } from "@/utils/uuid";
import useChainlyStore from "@/store/chainlyStore";
import { isServerSyncActive, getAuthedUserId } from "@/utils/serverSync";
import { addOutboxItem } from "@/utils/outbox";

const STORAGE_KEY = "chainly_rides_v1";

// Prevent double-submit duplicates for the manual ride pipeline.
let saveManualRideInFlight = false;

function safeParse(str) {
  try {
    return JSON.parse(str);
  } catch (e) {
    return null;
  }
}

function normalizeRide(raw) {
  if (!raw || typeof raw !== "object") return null;

  // Canonicalize attachment field. This is NOT guesswork; it only maps legacy naming.
  const bikeId = raw.bike_id ?? raw.bikeId ?? null;

  return {
    ...raw,
    bike_id: bikeId == null ? null : String(bikeId),
  };
}

function normalizeRideList(list) {
  const src = Array.isArray(list) ? list : [];
  return src.map(normalizeRide).filter(Boolean);
}

async function persist(rides) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(rides));
  } catch (e) {
    console.error(e);
  }
}

async function readPersisted() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = safeParse(raw);
    if (!Array.isArray(parsed)) {
      return null;
    }
    return parsed;
  } catch (e) {
    console.error(e);
    return null;
  }
}

export const useRidesStore = create((set, get) => ({
  rides: [],
  hydratedFromLocal: false,
  hydratedFromServer: false,
  syncError: null,
  lastSyncedAt: null,

  hydrateFromLocal: async () => {
    const local = await readPersisted();
    const normalized = local ? normalizeRideList(local) : null;
    if (normalized && normalized.length) {
      set({ rides: normalized, hydratedFromLocal: true });
      // Best-effort persist normalization (keeps bike_id consistent across restarts)
      await persist(normalized);
      return normalized;
    }
    set({ hydratedFromLocal: true });
    return null;
  },

  setFromServer: async (serverRides) => {
    const list = normalizeRideList(serverRides);
    if (!list.length) {
      return [];
    }
    set({
      rides: list,
      hydratedFromServer: true,
      syncError: null,
      lastSyncedAt: new Date().toISOString(),
    });
    await persist(list);
    return list;
  },

  hydrateFromServer: async () => {
    if (!isServerSyncActive()) {
      set({ hydratedFromServer: true, syncError: null });
      return [];
    }

    try {
      const res = await apiFetch("/api/rides", { method: "GET" });
      const list = Array.isArray(res?.rides) ? res.rides : [];
      if (list.length) {
        await get().setFromServer(list);
        return list;
      }
      set({ hydratedFromServer: true, lastSyncedAt: new Date().toISOString() });
      return [];
    } catch (e) {
      console.error(e);
      set({ hydratedFromServer: true, syncError: "Could not sync rides" });
      return null;
    }
  },

  unassignRidesForBike: async (bikeId) => {
    const id = String(bikeId || "").trim();
    if (!id) return { ok: false };

    set((state) => {
      const current = Array.isArray(state.rides) ? state.rides : [];
      const next = current.map((r) => {
        if (String(r?.bike_id || "") !== id) return r;
        return { ...r, bike_id: null };
      });
      return { rides: next };
    });

    await persist(get().rides);
    return { ok: true };
  },

  /**
   * Manual ride save (SAFE):
   * - If server sync is active, use the server atomic pipeline.
   * - If server sync is inactive (or the server write fails), fall back to local persistence + local wear.
   *
   * This must never throw "Server sync is not active" (that's the bug).
   */
  saveManualRide: async (input) => {
    if (saveManualRideInFlight) {
      throw new Error("Manual ride save already in flight");
    }

    saveManualRideInFlight = true;

    try {
      // Canonical normalized object (used for both persistence + wear logic)
      const wearInput = {
        bikeId: String(input?.bikeId || ""),
        source: "manual",
        rideDate: String(input?.rideDate || ""),
        durationMinutes: Number(input?.durationMinutes),
        distanceKm:
          input?.distanceKm == null ? null : Number(input?.distanceKm),
        elevationGainM:
          input?.elevationGainM == null ? null : Number(input?.elevationGainM),
        terrainType: String(input?.terrainType || ""),
        intensityLevel: String(input?.intensityLevel || ""),
        notes: input?.notes == null ? null : String(input.notes),
      };

      if (!wearInput.bikeId) {
        throw new Error("bikeId is required");
      }

      // Stable client id so offline outbox can be idempotent on the server.
      const clientId = uuidv4();

      const meta = {
        intensityLevel: wearInput.intensityLevel,
        notes: wearInput.notes,
        terrainType: wearInput.terrainType,
        distanceKm: wearInput.distanceKm,
        elevationGainM: wearInput.elevationGainM,
      };

      const durationMin = Number.isFinite(wearInput.durationMinutes)
        ? wearInput.durationMinutes
        : null;

      const serverPayload = {
        id: clientId,
        bikeId: wearInput.bikeId,
        source: "manual",
        rideAt: wearInput.rideDate,
        durationMin,
        // distance is used by wear engine today; keep it consistent.
        distance: wearInput.distanceKm,
        distanceKm: wearInput.distanceKm,
        elevationGain: wearInput.elevationGainM,
        elevationGainM: wearInput.elevationGainM,
        movingTimeSec: durationMin != null ? durationMin * 60 : null,
        terrainTag: wearInput.terrainType,
        weatherTag: null,
        meta,
      };

      const writeLocal = async ({ reason } = {}) => {
        const now = new Date().toISOString();

        const ride = {
          id: clientId,
          bike_id: wearInput.bikeId,
          source: "manual",
          // Keep legacy ride shape used throughout the app
          distance: wearInput.distanceKm,
          elevation_gain: wearInput.elevationGainM,
          descent_m: null,
          duration_min: durationMin,
          terrain_tag: wearInput.terrainType || null,
          weather_tag: null,
          ride_at: wearInput.rideDate || null,
          meta,
          created_at: now,
          updated_at: now,
        };

        set((state) => {
          const existing = Array.isArray(state.rides) ? state.rides : [];
          const next = [ride, ...existing]
            .filter(
              (x, idx, arr) =>
                arr.findIndex((y) => String(y.id) === String(x.id)) === idx,
            )
            .slice(0, 200);
          return { rides: next };
        });

        await persist(get().rides);

        // Apply wear + refresh bike detail locally (offline-first)
        try {
          const { applyWearFromRide } = useChainlyStore.getState();
          await applyWearFromRide?.({ ride });
        } catch (e) {
          console.error(e);
        }

        // If we have a signed-in user, enqueue for later sync.
        try {
          const userId = getAuthedUserId();
          if (userId) {
            await addOutboxItem({
              type: "createRide",
              userId,
              payload: serverPayload,
            });
          }
        } catch (e) {
          // no-op
        }

        if (process.env.NODE_ENV !== "production") {
          console.log("[rides] saveManualRide local", {
            bikeId: wearInput.bikeId,
            rideId: clientId,
            reason: reason || "local",
          });
        }

        await logEvent("ui.ride.created", {
          rideId: clientId,
          bikeId: wearInput.bikeId,
          source: "manual",
          rideAt: wearInput.rideDate,
        });

        return { success: true, rideId: clientId, localOnly: true };
      };

      // If server sync is disabled, do a safe local write (no crash).
      if (!isServerSyncActive()) {
        return await writeLocal({ reason: "server-sync-inactive" });
      }

      // Server-first (atomic) when available.
      try {
        const res = await apiFetch("/api/rides", {
          method: "POST",
          body: JSON.stringify(serverPayload),
        });

        const createdRide = res?.ride || res || null;
        if (!createdRide?.id) {
          throw new Error("Ride was not returned from server");
        }

        // Update local rides list only after server success.
        set((state) => {
          const existing = Array.isArray(state.rides) ? state.rides : [];
          const next = [createdRide, ...existing]
            .filter(
              (x, idx, arr) =>
                arr.findIndex((y) => String(y.id) === String(x.id)) === idx,
            )
            .slice(0, 200);
          return { rides: next };
        });

        await persist(get().rides);

        // Pull canonical bike/components/maintenance back down (updates health score UI)
        try {
          const { hydrateBikeGarageFromServer } = useChainlyStore.getState();
          await hydrateBikeGarageFromServer?.(wearInput.bikeId);
        } catch (e) {
          console.error(e);
        }

        if (process.env.NODE_ENV !== "production") {
          console.log("[rides] saveManualRide server", {
            bikeId: wearInput.bikeId,
            rideId: createdRide.id,
          });
        }

        await logEvent("ui.ride.created", {
          rideId: createdRide.id,
          bikeId: wearInput.bikeId,
          source: "manual",
          rideAt: wearInput.rideDate,
        });

        return { success: true, rideId: createdRide.id };
      } catch (e) {
        console.error(e);
        // If the server write fails for any reason (offline / transient), fall back safely.
        return await writeLocal({ reason: "server-write-failed" });
      }
    } finally {
      saveManualRideInFlight = false;
    }
  },

  createRideOptimistic: async ({
    bikeId,
    distance,
    elevationGain,
    descentM,
    durationMin,
    terrainTag,
    weatherTag,
    rideAt, // NEW (optional)
    source, // NEW (optional)
    meta, // NEW (optional)
  }) => {
    const id = uuidv4();
    const now = new Date().toISOString();

    const normalizedSource = source ? String(source) : "manual";
    const normalizedMeta = meta && typeof meta === "object" ? meta : {};

    const ride = {
      id,
      bike_id: bikeId || null,
      distance: distance ?? null,
      elevation_gain: elevationGain ?? null,
      descent_m: descentM ?? null,
      duration_min: durationMin ?? null,
      terrain_tag: terrainTag || null,
      weather_tag: weatherTag || null,
      source: normalizedSource,
      ride_at: rideAt ? String(rideAt) : null,
      meta: normalizedMeta,
      created_at: now,
      updated_at: now,
    };

    set((state) => {
      const next = [ride, ...(state.rides || [])]
        .filter(
          (x, idx, arr) =>
            arr.findIndex((y) => String(y.id) === String(x.id)) === idx,
        )
        .slice(0, 200);
      return { rides: next };
    });

    await persist(get().rides);

    // Offline-first wear/maintenance: update the garage immediately.
    try {
      const { applyWearFromRide } = useChainlyStore.getState();
      await applyWearFromRide?.({ ride });
    } catch (e) {
      console.error(e);
    }

    const serverPayload = {
      id,
      bikeId: bikeId || null,
      source: normalizedSource,
      // Keep legacy fields for compatibility
      distance: distance ?? null,
      elevationGain: elevationGain ?? null,
      descentM: descentM ?? null,
      durationMin: durationMin ?? null,
      terrainTag: terrainTag || null,
      weatherTag: weatherTag || null,
      // New canonical / extra
      rideAt: rideAt ? String(rideAt) : null,
      distanceKm: distance ?? null,
      elevationGainM: elevationGain ?? null,
      movingTimeSec: durationMin != null ? Number(durationMin) * 60 : null,
      meta: normalizedMeta,
    };

    if (isServerSyncActive()) {
      try {
        await apiFetch("/api/rides", {
          method: "POST",
          body: JSON.stringify(serverPayload),
        });

        // Best-effort sync back (server is canonical when online)
        if (bikeId) {
          const { hydrateBikeGarageFromServer } = useChainlyStore.getState();
          hydrateBikeGarageFromServer?.(bikeId);
        }
      } catch (e) {
        console.error(e);
        await addOutboxItem({
          type: "createRide",
          userId: getAuthedUserId(),
          payload: serverPayload,
        });
      }
    }

    await logEvent("ui.ride.created", {
      rideId: id,
      bikeId: bikeId || null,
      source: normalizedSource,
      distance: distance ?? null,
      elevationGain: elevationGain ?? null,
      descentM: descentM ?? null,
      durationMin: durationMin ?? null,
      terrainTag: terrainTag || null,
      weatherTag: weatherTag || null,
      rideAt: rideAt ? String(rideAt) : null,
    });

    return ride;
  },
}));

export default useRidesStore;
