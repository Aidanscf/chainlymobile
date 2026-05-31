import { create } from "zustand";
import {
  bikes as seedBikes,
  bikeDetailsById as seedBikeDetailsById,
} from "@/data/mock";
import { deepClone } from "./chainlyStore/utils";
import { createBikeActions } from "./chainlyStore/bikeActions";
import { createComponentActions } from "./chainlyStore/componentActions";
import { createWearActions } from "./chainlyStore/wearActions";
import { createDiagnosisActions } from "./chainlyStore/diagnosis";
import { createSelectors } from "./chainlyStore/selectors";

export const useChainlyStore = create((set, get) => {
  // Create all action sets
  const bikeActions = createBikeActions(set, get);
  const componentActions = createComponentActions(set, get);
  const wearActions = createWearActions(set, get);
  const diagnosisActions = createDiagnosisActions(set, get);
  const selectors = createSelectors(get);

  // Debug: verify critical functions exist
  if (!componentActions.hydrateMaintenanceFromLocal) {
    console.error(
      "⚠️ hydrateMaintenanceFromLocal is missing from componentActions",
    );
  }
  if (!componentActions.hydrateComponentsFromLocal) {
    console.error(
      "⚠️ hydrateComponentsFromLocal is missing from componentActions",
    );
  }

  return {
    // --- Garage data ---
    bikes: deepClone(seedBikes),
    bikeDetailsById: deepClone(seedBikeDetailsById),

    // Pending creates (offline-safe)
    pendingBikeCreates: [],

    // Canonical components (per bike)
    componentsByBikeId: {},
    componentsHydratedFromLocal: false,
    componentsSyncError: null,

    // Maintenance events (per bike) - persisted for offline
    maintenanceEventsByBikeId: {},
    maintenanceHydratedFromLocal: false,

    // server sync state (additive)
    bikesHydratedFromLocal: false,
    bikesHydratedFromServer: false,
    bikesSyncError: null,
    bikesLastSyncedAt: null,

    // --- AI Photo Mechanic ---
    currentDiagnosis: null,
    diagnosisLoading: false,
    savedDiagnoses: [],
    diagnosisHistory: [],

    // ----- Selectors / helpers
    ...selectors,

    // ----- Bike Actions
    ...bikeActions,

    // ----- Component Actions
    ...componentActions,

    // ----- Wear Actions
    ...wearActions,

    // ----- Diagnosis Actions
    ...diagnosisActions,
  };
});

export default useChainlyStore;
