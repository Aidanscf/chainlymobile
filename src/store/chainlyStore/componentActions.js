import { apiFetch } from "@/services/apiClient";
import { isServerSyncActive } from "@/utils/serverSync";
import {
  persistComponentsMap,
  persistMaintenanceEventsMap,
  persistBikes,
  readPersistedComponentsMap,
  readPersistedMaintenanceEventsMap,
} from "./persistence";
import {
  buildSpecSheetFromCanonical,
  buildSpecPreviewFromCanonical,
} from "./specSheet";
import { deriveGarageStatus } from "./maintenance";

export function createComponentActions(set, get) {
  return {
    // Hydration from local storage
    hydrateComponentsFromLocal: async () => {
      const map = await readPersistedComponentsMap();
      if (map) {
        set({ componentsByBikeId: map, componentsHydratedFromLocal: true });
        return map;
      }
      set({ componentsHydratedFromLocal: true });
      return null;
    },

    hydrateMaintenanceFromLocal: async () => {
      const map = await readPersistedMaintenanceEventsMap();
      if (map) {
        set({
          maintenanceEventsByBikeId: map,
          maintenanceHydratedFromLocal: true,
        });
        return map;
      }
      set({ maintenanceHydratedFromLocal: true });
      return null;
    },

    // Hydration from server
    hydrateBikeGarageFromServer: async (bikeId) => {
      if (!isServerSyncActive()) {
        return null;
      }

      const id = String(bikeId || "");
      if (!id) return null;

      try {
        const res = await apiFetch(`/api/bikes/${id}`, { method: "GET" });
        const serverBike = res?.bike || null;
        const serverComponents = Array.isArray(res?.components)
          ? res.components
          : [];
        const serverMaintenanceEvents = Array.isArray(res?.maintenanceEvents)
          ? res.maintenanceEvents
          : [];

        if (serverBike) {
          set((state) => {
            const list = Array.isArray(state.bikes) ? state.bikes : [];
            const next = list.map((b) => {
              if (String(b?.id) !== String(serverBike.id)) {
                return b;
              }
              return {
                ...b,
                ...serverBike,
                type: serverBike.bike_type ?? b.type,
                image: serverBike.image_url ?? b.image,
              };
            });
            return { bikes: next };
          });
          await persistBikes(get().bikes);
        }

        if (serverComponents) {
          set((state) => {
            const next = { ...(state.componentsByBikeId || {}) };
            next[id] = serverComponents;
            return { componentsByBikeId: next, componentsSyncError: null };
          });
          await persistComponentsMap(get().componentsByBikeId);
        }

        if (serverMaintenanceEvents) {
          set((state) => {
            const next = { ...(state.maintenanceEventsByBikeId || {}) };
            next[id] = serverMaintenanceEvents;
            return { maintenanceEventsByBikeId: next };
          });
          await persistMaintenanceEventsMap(get().maintenanceEventsByBikeId);
        }

        set((state) => {
          const list = Array.isArray(state.bikes) ? state.bikes : [];
          const bike = list.find((b) => String(b?.id) === id) || null;
          const comps = (state.componentsByBikeId || {})[id] || [];
          const events = (state.maintenanceEventsByBikeId || {})[id] || [];

          if (!bike) return {};

          const specSheet = buildSpecSheetFromCanonical({
            bike,
            components: comps,
          });
          const specPreview = buildSpecPreviewFromCanonical({
            bike,
            components: comps,
          });

          const derived = deriveGarageStatus({
            bike,
            components: comps,
            maintenanceEvents: events,
          });

          const existing = state.bikeDetailsById?.[id] || {};

          return {
            bikes: (state.bikes || []).map((b) =>
              String(b?.id) !== id
                ? b
                : {
                    ...b,
                    healthScore: derived.healthScore ?? b.healthScore,
                    questStats: {
                      ...(b.questStats || {}),
                      urgent: derived.urgentCount,
                      dueSoon: derived.dueSoonCount,
                    },
                  },
            ),
            bikeDetailsById: {
              ...(state.bikeDetailsById || {}),
              [id]: {
                ...existing,
                specSheet,
                specPreview,
                parts: derived.parts,
                componentHealth: derived.componentHealth,
                maintenance: derived.maintenance,
              },
            },
          };
        });

        return {
          bike: serverBike,
          components: serverComponents,
          maintenanceEvents: serverMaintenanceEvents,
        };
      } catch (e) {
        console.error(e);
        set({ componentsSyncError: "Could not sync bike details" });
        return null;
      }
    },

    /**
     * REQUIRED ENTRY POINT:
     * Log a maintenance action for a bike and reset the corresponding component health to 100.
     *
     * Safe behavior:
     * - Server sync ON: use server endpoint (/api/bikes/:id/maintenance-log) and hydrate.
     * - Server sync OFF: apply reset locally + persist offline, no crashes.
     */
    logMaintenanceAndResetBikeHealth: async ({
      bikeId,
      type,
      performedAt,
      note,
      meta,
    }) => {
      const id = String(bikeId || "").trim();
      const t = String(type || "").trim();
      if (!id) {
        throw new Error("bikeId is required");
      }
      if (!t) {
        throw new Error("type is required");
      }

      const nowIso = new Date().toISOString();
      const performedAtIso = performedAt ? String(performedAt) : nowIso;

      const localApply = async () => {
        const comps = get().getComponentsForBike(id);
        const list = Array.isArray(comps) ? [...comps] : [];

        const ensureType = (component_type) => {
          const existing = list.find(
            (c) => String(c?.component_type || "") === component_type,
          );
          if (existing) return existing;

          const base = {
            id: `local_${component_type}_${Date.now()}`,
            bike_id: id,
            component_type,
            name: null,
            wear_percent: 0,
            expected_life_km: null,
            service_hours:
              component_type === "fork" || component_type === "shock"
                ? 0
                : null,
            expected_service_hours:
              component_type === "fork"
                ? 50
                : component_type === "shock"
                  ? 60
                  : null,
            install_date: null,
            created_at: nowIso,
            updated_at: nowIso,
          };

          list.unshift(base);
          return base;
        };

        const reset = (component_type) => {
          const c = ensureType(component_type);
          c.wear_percent = 0;
          if (component_type === "fork" || component_type === "shock") {
            c.service_hours = 0;
          }
          c.updated_at = nowIso;
        };

        // Map maintenance log types to internal wear component rows.
        if (t === "brake_pads_replace" || t === "brake_bleed") {
          reset("pads");
        } else if (t === "tire_replace_front" || t === "tire_replace_rear") {
          reset("tire");
        } else if (t === "chain_replace" || t === "drivetrain_service") {
          reset("chain");
        } else if (t === "fork_lower_service") {
          reset("fork");
        } else if (t === "shock_air_can_service") {
          reset("shock");
        } else if (t === "suspension_full_service") {
          reset("fork");
          reset("shock");
        } else if (t === "tire_pressure_check" || t === "tire_sealant_topup") {
          // NEW: time-based quests. These create a maintenance log but do NOT reset component health.
          // (Pressure checks + sealant top-ups are preventative.)
        } else {
          throw new Error("Invalid maintenance log type");
        }

        const prevEvents = get().getMaintenanceEventsForBike(id);
        const nextEvents = Array.isArray(prevEvents) ? [...prevEvents] : [];

        // Store the log in the same list as threshold events (keeps persistence simple).
        nextEvents.unshift({
          id: `local_log_${t}_${Date.now()}`,
          bike_id: id,
          component_type:
            t === "fork_lower_service"
              ? "fork"
              : t === "shock_air_can_service"
                ? "shock"
                : t === "brake_pads_replace" || t === "brake_bleed"
                  ? "pads"
                  : t === "tire_replace_front" || t === "tire_replace_rear"
                    ? "tire"
                    : t === "tire_pressure_check" || t === "tire_sealant_topup"
                      ? "tire"
                      : "chain",
          action: t,
          performed_at: performedAtIso,
          note: note == null ? null : String(note),
          meta: meta && typeof meta === "object" ? meta : {},
          created_at: nowIso,
          title: null,
        });

        set((state) => {
          const nextComponents = { ...(state.componentsByBikeId || {}) };
          nextComponents[id] = list;

          const nextMaintenance = {
            ...(state.maintenanceEventsByBikeId || {}),
          };
          nextMaintenance[id] = nextEvents.slice(0, 50);

          return {
            componentsByBikeId: nextComponents,
            maintenanceEventsByBikeId: nextMaintenance,
          };
        });

        await persistComponentsMap(get().componentsByBikeId);
        await persistMaintenanceEventsMap(get().maintenanceEventsByBikeId);

        // Recompute derived health score + quest stats in the bike list and details.
        const bike = get().getBikeById(id);
        const derived = deriveGarageStatus({
          bike,
          components: list,
          maintenanceEvents: nextEvents,
        });

        set((state) => ({
          bikes: (state.bikes || []).map((b) =>
            String(b?.id) !== id
              ? b
              : {
                  ...b,
                  healthScore: derived.healthScore ?? b.healthScore,
                  questStats: {
                    ...(b.questStats || {}),
                    urgent: derived.urgentCount,
                    dueSoon: derived.dueSoonCount,
                  },
                },
          ),
          bikeDetailsById: {
            ...(state.bikeDetailsById || {}),
            [id]: {
              ...(state.bikeDetailsById?.[id] || {}),
              parts: derived.parts,
              componentHealth: derived.componentHealth,
              maintenance: derived.maintenance,
            },
          },
        }));

        return { ok: true, localOnly: true };
      };

      if (!isServerSyncActive()) {
        return await localApply();
      }

      // Server-first path
      try {
        const res = await apiFetch(`/api/bikes/${id}/maintenance-log`, {
          method: "POST",
          body: JSON.stringify({
            type: t,
            performedAt: performedAtIso,
            note: note == null ? null : String(note),
            meta: meta && typeof meta === "object" ? meta : {},
          }),
        });

        const serverBike = res?.bike || null;
        const serverComponents = Array.isArray(res?.components)
          ? res.components
          : [];
        const serverMaintenanceEvents = Array.isArray(res?.maintenanceEvents)
          ? res.maintenanceEvents
          : [];

        if (serverBike) {
          set((state) => {
            const list = Array.isArray(state.bikes) ? state.bikes : [];
            const next = list.map((b) => {
              if (String(b?.id) !== String(serverBike.id)) {
                return b;
              }
              return {
                ...b,
                ...serverBike,
                type: serverBike.bike_type ?? b.type,
                image: serverBike.image_url ?? b.image,
                healthScore:
                  serverBike.health_score ??
                  serverBike.healthScore ??
                  b.healthScore,
              };
            });
            return { bikes: next };
          });
          await persistBikes(get().bikes);
        }

        if (serverComponents) {
          set((state) => {
            const next = { ...(state.componentsByBikeId || {}) };
            next[id] = serverComponents;
            return { componentsByBikeId: next, componentsSyncError: null };
          });
          await persistComponentsMap(get().componentsByBikeId);
        }

        if (serverMaintenanceEvents) {
          set((state) => {
            const next = { ...(state.maintenanceEventsByBikeId || {}) };
            next[id] = serverMaintenanceEvents;
            return { maintenanceEventsByBikeId: next };
          });
          await persistMaintenanceEventsMap(get().maintenanceEventsByBikeId);
        }

        // Refresh derived detail using the same logic as hydrateBikeGarageFromServer.
        set((state) => {
          const list = Array.isArray(state.bikes) ? state.bikes : [];
          const bike = list.find((b) => String(b?.id) === id) || null;
          const comps = (state.componentsByBikeId || {})[id] || [];
          const events = (state.maintenanceEventsByBikeId || {})[id] || [];

          if (!bike) return {};

          const specSheet = buildSpecSheetFromCanonical({
            bike,
            components: comps,
          });
          const specPreview = buildSpecPreviewFromCanonical({
            bike,
            components: comps,
          });

          const derived = deriveGarageStatus({
            bike,
            components: comps,
            maintenanceEvents: events,
          });

          const existing = state.bikeDetailsById?.[id] || {};

          return {
            bikes: (state.bikes || []).map((b) =>
              String(b?.id) !== id
                ? b
                : {
                    ...b,
                    healthScore: derived.healthScore ?? b.healthScore,
                    questStats: {
                      ...(b.questStats || {}),
                      urgent: derived.urgentCount,
                      dueSoon: derived.dueSoonCount,
                    },
                  },
            ),
            bikeDetailsById: {
              ...(state.bikeDetailsById || {}),
              [id]: {
                ...existing,
                specSheet,
                specPreview,
                parts: derived.parts,
                componentHealth: derived.componentHealth,
                maintenance: derived.maintenance,
              },
            },
          };
        });

        return { ok: true };
      } catch (e) {
        console.error(e);
        // If server write fails (offline, etc.), fall back safely.
        return await localApply();
      }
    },
  };
}
