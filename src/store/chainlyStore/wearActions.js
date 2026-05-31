import { logEvent } from "@/services/apiClient";
import { computeWearDeltas, thresholdCrossings } from "@/utils/wearEngine";
import {
  computeEquivalentUsage,
  getBrakePadIntervals,
} from "@/utils/maintenanceQuests";
import {
  persistComponentsMap,
  persistMaintenanceEventsMap,
} from "./persistence";
import {
  deriveGarageStatus,
  componentWearPercent,
  buildMaintenanceTitleLocal,
} from "./maintenance";
import { safeNum, clamp, pickComponent } from "./utils";

export function createWearActions(set, get) {
  return {
    applyWearFromRide: async ({ ride }) => {
      const bikeId = String(ride?.bike_id || ride?.bikeId || "");
      if (!bikeId) return null;

      const comps = get().getComponentsForBike(bikeId);

      const { deltas } = computeWearDeltas({
        distanceKm: ride?.distance,
        descentM: ride?.descent_m ?? ride?.descentM,
        durationMin: ride?.duration_min ?? ride?.durationMin,
        terrainTag: ride?.terrain_tag ?? ride?.terrainTag,
        weatherTag: ride?.weather_tag ?? ride?.weatherTag,
      });

      // NEW (safe): brake pad wear is computed from equivalent ride load + pad compound interval.
      // We keep the existing wear engine deltas for drivetrain/tires/suspension.
      const bikeForIntervals = get().getBikeById?.(bikeId) || null;
      const bikeType = bikeForIntervals?.bike_type ?? bikeForIntervals?.type;
      const padIntervals = getBrakePadIntervals({ bike: bikeForIntervals });
      const intervalKm = Number(padIntervals?.intervalKm) || 0;
      const intervalHours = Number(padIntervals?.intervalHours) || 0;
      const eq = computeEquivalentUsage({ ride, bikeType });
      const ratioKm = intervalKm > 0 ? eq.equivKm / intervalKm : 0;
      const ratioH = intervalHours > 0 ? eq.equivHours / intervalHours : 0;
      const padsWearPctDelta = clamp(Math.max(ratioKm, ratioH) * 100, 0, 100);
      const deltasForLog = {
        ...deltas,
        padsWearPct: padsWearPctDelta,
        padsIntervalKm: intervalKm || null,
        padsIntervalHours: intervalHours || null,
      };

      const ensureType = (type) => {
        const existing = pickComponent(comps, type);
        if (existing) return existing;
        const base = {
          id: `local_${type}_${Date.now()}`,
          bike_id: bikeId,
          component_type: type,
          name: null,
          wear_percent: 0,
          expected_life_km: null,
          service_hours: type === "fork" || type === "shock" ? 0 : null,
          expected_service_hours:
            type === "fork" ? 50 : type === "shock" ? 60 : null,
          install_date: null,
          created_at: new Date().toISOString(),
        };
        comps.unshift(base);
        return base;
      };

      const chain = ensureType("chain");
      const pads = ensureType("pads");
      const tire = ensureType("tire");
      const fork = ensureType("fork");
      const shock = ensureType("shock");

      const before = {
        chain: componentWearPercent(chain),
        pads: componentWearPercent(pads),
        tire: componentWearPercent(tire),
        fork: componentWearPercent(fork),
        shock: componentWearPercent(shock),
      };

      chain.wear_percent = clamp(
        safeNum(chain.wear_percent) + safeNum(deltas.chainWearPct),
        0,
        100,
      );
      pads.wear_percent = clamp(
        safeNum(pads.wear_percent) + safeNum(padsWearPctDelta),
        0,
        100,
      );
      tire.wear_percent = clamp(
        safeNum(tire.wear_percent) + safeNum(deltas.tiresWearPct),
        0,
        100,
      );

      if (deltas.suspensionServiceHours > 0) {
        fork.service_hours =
          safeNum(fork.service_hours) + safeNum(deltas.suspensionServiceHours);
        shock.service_hours =
          safeNum(shock.service_hours) + safeNum(deltas.suspensionServiceHours);
      }

      const after = {
        chain: componentWearPercent(chain),
        pads: componentWearPercent(pads),
        tire: componentWearPercent(tire),
        fork: componentWearPercent(fork),
        shock: componentWearPercent(shock),
      };

      const nextEvents = [...(get().getMaintenanceEventsForBike(bikeId) || [])];

      const maybeAdd = (component_type, action, crossed) => {
        if (!crossed) return;
        nextEvents.unshift({
          id: `local_${component_type}_${action}_${Date.now()}`,
          bike_id: bikeId,
          component_type,
          action,
          title: buildMaintenanceTitleLocal({ component_type, action }),
          created_at: new Date().toISOString(),
        });
      };

      maybeAdd(
        "chain",
        "due_soon",
        thresholdCrossings({ beforePct: before.chain, afterPct: after.chain })
          .dueSoon,
      );
      maybeAdd(
        "chain",
        "urgent",
        thresholdCrossings({ beforePct: before.chain, afterPct: after.chain })
          .urgent,
      );

      maybeAdd(
        "pads",
        "due_soon",
        thresholdCrossings({ beforePct: before.pads, afterPct: after.pads })
          .dueSoon,
      );
      maybeAdd(
        "pads",
        "urgent",
        thresholdCrossings({ beforePct: before.pads, afterPct: after.pads })
          .urgent,
      );

      maybeAdd(
        "tire",
        "due_soon",
        thresholdCrossings({ beforePct: before.tire, afterPct: after.tire })
          .dueSoon,
      );
      maybeAdd(
        "tire",
        "urgent",
        thresholdCrossings({ beforePct: before.tire, afterPct: after.tire })
          .urgent,
      );

      maybeAdd(
        "fork",
        "due_soon",
        thresholdCrossings({ beforePct: before.fork, afterPct: after.fork })
          .dueSoon,
      );
      maybeAdd(
        "fork",
        "urgent",
        thresholdCrossings({ beforePct: before.fork, afterPct: after.fork })
          .urgent,
      );

      maybeAdd(
        "shock",
        "due_soon",
        thresholdCrossings({ beforePct: before.shock, afterPct: after.shock })
          .dueSoon,
      );
      maybeAdd(
        "shock",
        "urgent",
        thresholdCrossings({ beforePct: before.shock, afterPct: after.shock })
          .urgent,
      );

      set((state) => {
        const nextComponents = { ...(state.componentsByBikeId || {}) };
        nextComponents[bikeId] = comps;

        const nextMaintenance = { ...(state.maintenanceEventsByBikeId || {}) };
        nextMaintenance[bikeId] = nextEvents.slice(0, 50);

        return {
          componentsByBikeId: nextComponents,
          maintenanceEventsByBikeId: nextMaintenance,
        };
      });

      await persistComponentsMap(get().componentsByBikeId);
      await persistMaintenanceEventsMap(get().maintenanceEventsByBikeId);

      const bike = get().getBikeById(bikeId);
      const derived = deriveGarageStatus({
        bike,
        components: comps,
        maintenanceEvents: nextEvents,
      });

      set((state) => ({
        bikes: (state.bikes || []).map((b) =>
          String(b?.id) !== bikeId
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
          [bikeId]: {
            ...(state.bikeDetailsById?.[bikeId] || {}),
            parts: derived.parts,
            componentHealth: derived.componentHealth,
            maintenance: derived.maintenance,
          },
        },
      }));

      await logEvent("wear.local_applied", {
        bikeId,
        rideId: ride?.id || null,
        deltas: deltasForLog,
      });

      return { ok: true };
    },
  };
}
