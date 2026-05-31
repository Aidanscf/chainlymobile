import { findBike } from "./utils";
import {
  buildSpecSheetFromCanonical,
  buildSpecPreviewFromCanonical,
} from "./specSheet";
import { deriveGarageStatus } from "./maintenance";

export function createSelectors(get) {
  // IMPORTANT:
  // Zustand selectors are read during render. If a selector returns a new
  // object/array every time (even when underlying state didn't change), React
  // can get stuck in a re-render loop ("Maximum update depth exceeded").
  //
  // These small memo caches keep references stable when inputs are unchanged.
  const EMPTY_LIST = [];
  const detailMemoByBikeId = new Map();

  return {
    getBikeById: (bikeId) => {
      const { bikes } = get();
      return findBike(bikes, bikeId);
    },

    getComponentsForBike: (bikeId) => {
      const id = String(bikeId || "");
      const map = get().componentsByBikeId || {};
      const list = map?.[id];
      return Array.isArray(list) ? list : EMPTY_LIST;
    },

    getMaintenanceEventsForBike: (bikeId) => {
      const id = String(bikeId || "");
      const map = get().maintenanceEventsByBikeId || {};
      const list = map?.[id];
      return Array.isArray(list) ? list : EMPTY_LIST;
    },

    getBikeDetailById: (bikeId) => {
      const id = String(bikeId);
      const { bikeDetailsById } = get();
      const base = bikeDetailsById[String(id)] || bikeDetailsById[id] || null;

      const bike = get().getBikeById(id);
      const comps = get().getComponentsForBike(id);
      const events = get().getMaintenanceEventsForBike(id);

      const hasCanonical =
        !!bike?.wheel_size ||
        !!bike?.hub_driver ||
        !!bike?.brake_mount ||
        bike?.rotor_size != null ||
        bike?.drivetrain_speed != null ||
        bike?.suspension_travel_front != null ||
        bike?.suspension_travel_rear != null ||
        (Array.isArray(comps) && comps.length > 0);

      // If we can't compute derived fields, return base as-is (stable reference).
      if (!bike || !hasCanonical) {
        return base;
      }

      // Memoize derived objects by input references (base/bike/comps/events).
      const prev = detailMemoByBikeId.get(id);
      if (
        prev &&
        prev.base === base &&
        prev.bike === bike &&
        prev.comps === comps &&
        prev.events === events
      ) {
        return prev.value;
      }

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

      const value = {
        ...(base || {}),
        specSheet,
        specPreview,
        parts: derived.parts,
        componentHealth: derived.componentHealth,
        maintenance: derived.maintenance,
        healthScore: derived.healthScore,
      };

      detailMemoByBikeId.set(id, {
        base,
        bike,
        comps,
        events,
        value,
      });

      return value;
    },
  };
}
