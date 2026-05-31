import { apiFetch, logEvent } from "@/services/apiClient";
import { uuidv4 } from "@/utils/uuid";
import { isServerSyncActive, getAuthedUserId } from "@/utils/serverSync";
import { addOutboxItem, getOutbox } from "@/utils/outbox";
import {
  persistBikes,
  persistComponentsMap,
  readPersistedBikes,
  persistPendingBikeCreates,
  readPersistedPendingBikeCreates,
  persistMaintenanceEventsMap,
} from "./persistence";
import {
  buildSpecSheetFromCanonical,
  buildSpecPreviewFromCanonical,
} from "./specSheet";
import {
  normalizeWheelSizeInput,
  normalizeHubDriverInput,
  normalizeBrakeMountInput,
  normalizeIntRangeInput,
} from "./normalization";

// UUID validation regex (used to protect demo bikes, which have small numeric ids)
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidUUID(str) {
  return UUID_REGEX.test(String(str || "").trim());
}

async function getPendingDeletedBikeIds() {
  try {
    const outbox = await getOutbox();
    const ids = outbox
      .filter((x) => x?.type === "deleteBike")
      .map((x) => String(x?.payload?.bikeId || ""))
      .filter(Boolean);
    return new Set(ids);
  } catch (e) {
    return new Set();
  }
}

export function createBikeActions(set, get) {
  return {
    hydrateBikesFromLocal: async () => {
      const local = await readPersistedBikes();
      if (local && local.length) {
        set({ bikes: local, bikesHydratedFromLocal: true });
        return local;
      }

      set({ bikesHydratedFromLocal: true });
      await persistBikes(get().bikes);
      return null;
    },

    setBikesFromServer: async (serverBikes) => {
      const incoming = Array.isArray(serverBikes) ? serverBikes : [];
      if (!incoming.length) {
        return [];
      }

      set((state) => {
        const current = Array.isArray(state.bikes) ? state.bikes : [];
        const byId = new Map(current.map((b) => [String(b.id), b]));
        const incomingIds = new Set(incoming.map((b) => String(b.id)));

        const mergedIncoming = incoming.map((sb) => {
          const existing = byId.get(String(sb.id));

          const serverScore = sb?.health_score;
          const hasServerScore = Number.isFinite(Number(serverScore));

          return {
            ...(existing || {}),
            ...sb,
            type: sb.bike_type ?? existing?.type,
            image: sb.image_url ?? existing?.image,
            // Normalize server snake_case -> app camelCase
            healthScore: hasServerScore
              ? Number(serverScore)
              : existing?.healthScore,
          };
        });

        // Keep local-only bikes (e.g. created offline, not synced yet).
        const localOnly = current.filter(
          (b) => !incomingIds.has(String(b?.id)),
        );

        return {
          bikes: [...mergedIncoming, ...localOnly],
          bikesHydratedFromServer: true,
          bikesSyncError: null,
          bikesLastSyncedAt: new Date().toISOString(),
        };
      });

      await persistBikes(get().bikes);
      return get().bikes;
    },

    hydrateBikesFromServer: async () => {
      // If server sync isn't active, behave as local-only.
      if (!isServerSyncActive()) {
        set({
          bikesHydratedFromServer: true,
          bikesSyncError: null,
        });
        return [];
      }

      try {
        const res = await apiFetch("/api/bikes", { method: "GET" });
        const serverBikesRaw = Array.isArray(res?.bikes) ? res.bikes : [];

        // If the user deleted bikes while offline (outbox), don't let them re-appear
        // during the next server hydrate.
        const deletedIds = await getPendingDeletedBikeIds();
        const serverBikes = deletedIds.size
          ? serverBikesRaw.filter((b) => !deletedIds.has(String(b?.id)))
          : serverBikesRaw;

        if (serverBikes.length) {
          await get().setBikesFromServer(serverBikes);
          return serverBikes;
        }

        set({
          bikesHydratedFromServer: true,
          bikesSyncError: null,
          bikesLastSyncedAt: new Date().toISOString(),
        });
        return [];
      } catch (error) {
        console.error(error);
        set({
          bikesSyncError: "Could not sync bikes",
          bikesHydratedFromServer: true,
        });
        return null;
      }
    },

    deleteBikeSafe: async (bikeId) => {
      const id = String(bikeId || "").trim();
      if (!id) {
        return { ok: false, error: "Bike id is required" };
      }

      const bike = get().getBikeById?.(id) || null;
      if (!bike) {
        return { ok: false, error: "Bike not found" };
      }

      // Protect demo bikes (seed bikes use non-UUID ids like "1", "2").
      if (!isValidUUID(id)) {
        return { ok: false, error: "Demo bikes can’t be deleted" };
      }

      // Optimistically remove locally first (prevents other screens from referencing it).
      set((state) => {
        const list = Array.isArray(state.bikes) ? state.bikes : [];
        const nextBikes = list.filter((b) => String(b?.id) !== id);

        const nextDetails = { ...(state.bikeDetailsById || {}) };
        delete nextDetails[id];

        const nextComponents = { ...(state.componentsByBikeId || {}) };
        delete nextComponents[id];

        const nextMaintenance = { ...(state.maintenanceEventsByBikeId || {}) };
        delete nextMaintenance[id];

        // Also drop any pending create payload for this bike (offline wizard).
        const pendingCreates = Array.isArray(state.pendingBikeCreates)
          ? state.pendingBikeCreates
          : [];
        const nextPendingCreates = pendingCreates.filter(
          (p) => String(p?.bike?.id) !== id,
        );

        return {
          bikes: nextBikes,
          bikeDetailsById: nextDetails,
          componentsByBikeId: nextComponents,
          maintenanceEventsByBikeId: nextMaintenance,
          pendingBikeCreates: nextPendingCreates,
        };
      });

      await persistBikes(get().bikes);
      await persistComponentsMap(get().componentsByBikeId);
      await persistMaintenanceEventsMap(get().maintenanceEventsByBikeId);
      await persistPendingBikeCreates(get().pendingBikeCreates);

      // Best-effort server delete (or enqueue for later).
      if (isServerSyncActive()) {
        try {
          await apiFetch(`/api/bikes/${id}`, { method: "DELETE" });
        } catch (e) {
          console.error(e);
          await addOutboxItem({
            type: "deleteBike",
            userId: getAuthedUserId(),
            payload: { bikeId: id },
          });
        }
      } else {
        // Offline / sync disabled: queue for later if we have an authed user.
        const userId = getAuthedUserId();
        if (userId) {
          await addOutboxItem({
            type: "deleteBike",
            userId,
            payload: { bikeId: id },
          });
        }
      }

      await logEvent("ui.bike.deleted", { bikeId: id, name: bike?.name });
      return { ok: true };
    },

    createBikeWizardOptimistic: async ({ bike, components }) => {
      const bikeId = uuidv4();
      const now = new Date().toISOString();

      const type =
        String(bike?.bike_type || bike?.type || "Trail").trim() || "Trail";

      const optimisticBike = {
        // canonical ids
        id: bikeId,
        created_at: now,

        // user-visible basics
        name: String(bike?.name || "").trim() || "New Bike",
        type,
        bike_type: type,

        // db-backed canonical fields
        wheel_size: bike?.wheel_size ?? null,
        hub_driver: bike?.hub_driver ?? null,
        brake_mount: bike?.brake_mount ?? null,
        rotor_size: bike?.rotor_size ?? null,
        drivetrain_speed: bike?.drivetrain_speed ?? null,
        suspension_travel_front: bike?.suspension_travel_front ?? null,
        suspension_travel_rear: bike?.suspension_travel_rear ?? null,
        image_url: bike?.image_url ?? null,
        brand: bike?.brand ?? null,
        model: bike?.model ?? null,
        model_year: bike?.model_year ?? null,
        frame_size: bike?.frame_size ?? null,

        // NEW: optional details
        purchase_date: bike?.purchase_date ?? null,
        purchase_year: bike?.purchase_year ?? null,
        serial_number: bike?.serial_number ?? null,
        wheel_config: bike?.wheel_config ?? "unknown",

        // UI-only fields
        level: 1,
        // New bikes should start at full health; derived breakdown uses 100s by default.
        healthScore: 100,
        questStats: { urgent: 0, dueSoon: 0, completed: 0 },
        quests: [],
        image: bike?.image_url ?? null,

        // NEW: tubeless flag (stored on the bike row server-side)
        is_tubeless: Boolean(bike?.is_tubeless ?? bike?.tubeless ?? true),
      };

      const componentsList = Array.isArray(components) ? components : [];
      const canonicalComponents = componentsList
        .filter((c) => c && c.component_type)
        .map((c) => ({
          ...c,
          bike_id: bikeId,
          component_type: String(c.component_type),
          name: c.name == null ? null : String(c.name),
          wear_percent: c.wear_percent == null ? 0 : c.wear_percent,
          install_date: c.install_date || now,
          came_with_bike: Boolean(c.came_with_bike ?? c.cameWithBike ?? false),
        }));

      // Ensure wear-tracked component rows exist locally so new bikes render
      // Drivetrain/Brakes/Tires/Suspension immediately (even before first ride).
      const ensureWearType = (type, name) => {
        const existing = canonicalComponents.find(
          (c) => String(c?.component_type) === String(type),
        );
        if (existing) return;
        canonicalComponents.unshift({
          bike_id: bikeId,
          component_type: type,
          name: name ?? null,
          wear_percent: 0,
          install_date: now,
        });
      };

      // Drivetrain (wear engine uses "chain")
      ensureWearType("chain", null);

      // Brakes (wear engine uses "pads")
      ensureWearType("pads", null);

      // Tires (wear engine uses "tire")
      ensureWearType("tire", null);

      set((state) => {
        const nextBikes = [optimisticBike, ...(state.bikes || [])]
          .filter(
            (x, idx, arr) =>
              arr.findIndex((y) => String(y.id) === String(x.id)) === idx,
          )
          .slice(0, 50);

        const nextComponents = { ...(state.componentsByBikeId || {}) };
        nextComponents[bikeId] = canonicalComponents;

        return {
          bikes: nextBikes,
          componentsByBikeId: nextComponents,
        };
      });

      await persistBikes(get().bikes);
      await persistComponentsMap(get().componentsByBikeId);

      await logEvent("ui.bike.added", {
        bikeId,
        name: optimisticBike.name,
        type: optimisticBike.type,
      });

      const payload = {
        bike: {
          id: bikeId,
          name: optimisticBike.name,
          type: optimisticBike.type,
          bike_type: optimisticBike.bike_type,
          wheel_size: optimisticBike.wheel_size,
          wheel_config: optimisticBike.wheel_config,
          hub_driver: optimisticBike.hub_driver,
          brake_mount: optimisticBike.brake_mount,
          rotor_size: optimisticBike.rotor_size,
          drivetrain_speed: optimisticBike.drivetrain_speed,
          suspension_travel_front: optimisticBike.suspension_travel_front,
          suspension_travel_rear: optimisticBike.suspension_travel_rear,
          image_url: optimisticBike.image_url,
          brand: optimisticBike.brand,
          model: optimisticBike.model,
          model_year: optimisticBike.model_year,
          frame_size: optimisticBike.frame_size,

          // NEW
          purchase_date: optimisticBike.purchase_date,
          purchase_year: optimisticBike.purchase_year,
          serial_number: optimisticBike.serial_number,

          // NEW
          is_tubeless: optimisticBike.is_tubeless,
        },
        components: canonicalComponents.map((c) => ({
          component_type: c.component_type,
          name: c.name,
          wear_percent: c.wear_percent,
          install_date: c.install_date,
          came_with_bike: c.came_with_bike,
        })),
      };

      return { bikeId, payload, bike: optimisticBike };
    },

    queuePendingBikeCreate: async (payload) => {
      const nextPayload =
        payload && typeof payload === "object" ? payload : null;
      const id = String(nextPayload?.bike?.id || "");
      if (!id) {
        return { ok: false };
      }

      set((state) => {
        const current = Array.isArray(state.pendingBikeCreates)
          ? state.pendingBikeCreates
          : [];
        const merged = [nextPayload, ...current].filter(
          (p, idx, arr) =>
            arr.findIndex(
              (x) => String(x?.bike?.id) === String(p?.bike?.id),
            ) === idx,
        );
        return { pendingBikeCreates: merged };
      });

      await persistPendingBikeCreates(get().pendingBikeCreates);
      return { ok: true };
    },

    markPendingBikeCreateDone: async (bikeId) => {
      const id = String(bikeId || "");
      if (!id) return;

      set((state) => {
        const current = Array.isArray(state.pendingBikeCreates)
          ? state.pendingBikeCreates
          : [];
        const next = current.filter((p) => String(p?.bike?.id) !== id);
        return { pendingBikeCreates: next };
      });

      await persistPendingBikeCreates(get().pendingBikeCreates);
    },

    processPendingBikeCreates: async () => {
      // Only attempt server flush when sync is active.
      if (!isServerSyncActive()) {
        return;
      }

      const persisted = await readPersistedPendingBikeCreates();
      const queue = Array.isArray(get().pendingBikeCreates)
        ? get().pendingBikeCreates
        : [];

      const merged = [...persisted, ...queue].filter(
        (p, idx, arr) =>
          arr.findIndex((x) => String(x?.bike?.id) === String(p?.bike?.id)) ===
          idx,
      );

      if (merged.length) {
        set({ pendingBikeCreates: merged });
        await persistPendingBikeCreates(merged);
      }

      // Try to sync sequentially (keep it safe / small).
      let remaining = merged;
      for (const payload of merged) {
        const id = String(payload?.bike?.id || "");
        if (!id) continue;
        try {
          await apiFetch("/api/bikes/create", {
            method: "POST",
            body: JSON.stringify(payload),
          });
          remaining = remaining.filter((p) => String(p?.bike?.id) !== id);
        } catch (e) {
          console.error(e);
          // stop early; likely offline
          break;
        }
      }

      set({ pendingBikeCreates: remaining });
      await persistPendingBikeCreates(remaining);
    },

    createBikeOptimistic: async ({ name, type }) => {
      const bikeId = uuidv4();
      const now = new Date().toISOString();

      const optimisticBike = {
        id: bikeId,
        name: String(name || "").trim() || "New Bike",
        type: String(type || "Trail"),
        bike_type: String(type || "Trail"),
        created_at: now,
        // New bikes start at full health; score is derived from breakdown.
        healthScore: 100,
        questStats: { urgent: 0, dueSoon: 0, completed: 0 },
        quests: [],
        image: null,
      };

      set((state) => {
        const next = [optimisticBike, ...(state.bikes || [])]
          .filter(
            (x, idx, arr) =>
              arr.findIndex((y) => String(y.id) === String(x.id)) === idx,
          )
          .slice(0, 50);
        return { bikes: next };
      });

      await persistBikes(get().bikes);

      // Only persist to server when sync is active.
      if (isServerSyncActive()) {
        try {
          await apiFetch("/api/bikes", {
            method: "POST",
            body: JSON.stringify({
              id: bikeId,
              name: optimisticBike.name,
              type: optimisticBike.type,
            }),
          });
        } catch (e) {
          console.error(e);
          await addOutboxItem({
            type: "createBike",
            userId: getAuthedUserId(),
            payload: {
              id: bikeId,
              name: optimisticBike.name,
              type: optimisticBike.type,
            },
          });
        }
      }

      await logEvent("ui.bike.created", {
        bikeId,
        name: optimisticBike.name,
        type: optimisticBike.type,
      });

      return optimisticBike;
    },

    updateBikeSpecValue: async ({
      bikeId,
      sectionKey,
      label,
      value,
      rowKey,
    }) => {
      const id = String(bikeId);
      const key = rowKey ? String(rowKey) : null;
      const dest = key || `${String(sectionKey)}:${String(label)}`;

      let bikePatch = null;
      let componentUpsert = null;
      let error = null;
      let warning = null;

      if (dest.startsWith("bike.")) {
        const field = dest.replace("bike.", "");

        if (field === "wheel_size") {
          bikePatch = { wheel_size: normalizeWheelSizeInput(value) };
        } else if (field === "hub_driver") {
          bikePatch = { hub_driver: normalizeHubDriverInput(value) };
        } else if (field === "brake_mount") {
          bikePatch = { brake_mount: normalizeBrakeMountInput(value) };
        } else if (field === "rotor_size") {
          const r = normalizeIntRangeInput(value, { min: 140, max: 220 });
          if (r.error) error = r.error;
          bikePatch = { rotor_size: r.value };
        } else if (field === "drivetrain_speed") {
          const r = normalizeIntRangeInput(value, { min: 7, max: 13 });
          if (r.error) error = r.error;
          bikePatch = { drivetrain_speed: r.value };

          const bike = get().getBikeById(id);
          const driver = String(bike?.hub_driver || "");
          if (r.value === 12 && driver === "HG") {
            warning =
              "Heads up: a lot of 12-speed cassettes need XD or MicroSpline. HG can work for some setups (NX), but double-check.";
          }
        } else if (field === "suspension_travel_front") {
          const r = normalizeIntRangeInput(value, { min: 0, max: 220 });
          if (r.error) error = r.error;
          bikePatch = { suspension_travel_front: r.value };
        } else if (field === "suspension_travel_rear") {
          const r = normalizeIntRangeInput(value, { min: 0, max: 220 });
          if (r.error) error = r.error;
          bikePatch = { suspension_travel_rear: r.value };
        } else if (field === "is_tubeless") {
          // NEW: allow editing tubeless setup from the spec sheet
          // Accepts booleans (Switch) and common string forms.
          let next = value;
          if (typeof next !== "boolean") {
            const s = String(next ?? "")
              .trim()
              .toLowerCase();
            if (["true", "1", "yes", "y", "tubeless"].includes(s)) {
              next = true;
            } else if (["false", "0", "no", "n", "tube", "tubes"].includes(s)) {
              next = false;
            } else {
              next = Boolean(next);
            }
          }
          bikePatch = { is_tubeless: Boolean(next) };
        } else if (field === "brake_pad_compound") {
          const raw = String(value ?? "")
            .trim()
            .toLowerCase();
          let next = "unknown";
          if (raw === "resin" || raw.includes("organic")) next = "resin";
          else if (raw === "semi_metallic" || raw.includes("semi"))
            next = "semi_metallic";
          else if (
            raw === "metallic" ||
            raw.includes("sinter") ||
            raw.includes("metal")
          )
            next = "metallic";
          else if (raw === "unknown") next = "unknown";

          bikePatch = { brake_pad_compound: next };
        } else if (field === "brake_fluid_type") {
          const raw = String(value ?? "")
            .trim()
            .toLowerCase();
          let next = "unknown";
          if (raw === "dot") next = "dot";
          else if (raw === "mineral" || raw.includes("mineral"))
            next = "mineral";
          else if (raw === "unknown") next = "unknown";

          bikePatch = { brake_fluid_type: next };
        } else if (field === "wheel_config") {
          const raw = String(value ?? "")
            .trim()
            .toLowerCase();
          const allowed = new Set([
            "29",
            "27.5",
            "mullet_29f_27.5r",
            "mixed_other",
            "unknown",
          ]);
          const next = allowed.has(raw) ? raw : "unknown";
          bikePatch = { wheel_config: next };
        } else if (field === "purchase_date") {
          const s = String(value ?? "").trim();
          if (s && !/^\d{4}-\d{2}-\d{2}$/.test(s)) {
            error = "Use a date like YYYY-MM-DD";
          } else {
            const y = s ? Number(s.slice(0, 4)) : null;
            bikePatch = {
              purchase_date: s || null,
              purchase_year: s && Number.isFinite(y) ? y : null,
            };
          }
        } else if (field === "serial_number") {
          const s = String(value ?? "").trim();
          bikePatch = { serial_number: s || null };
        }
      }

      if (dest.startsWith("component.")) {
        const parts = dest.split(".");
        const type = parts?.[1];
        if (!type) {
          error = "That spec isn't editable yet.";
        } else {
          componentUpsert = {
            component_type: type,
            name: String(value || "").trim() || null,
          };
        }
      }

      if (!bikePatch && !componentUpsert) {
        set((state) => {
          const current = state.bikeDetailsById?.[id] || null;
          if (!current) return {};

          const nextSpecSheet = Array.isArray(current.specSheet)
            ? current.specSheet.map((section) => {
                if (String(section?.key) !== String(sectionKey)) {
                  return section;
                }
                const nextRows = Array.isArray(section.rows)
                  ? section.rows.map((r) => {
                      if (String(r?.label) !== String(label)) {
                        return r;
                      }
                      return { ...r, value: String(value ?? "") };
                    })
                  : section.rows;
                return { ...section, rows: nextRows };
              })
            : current.specSheet;

          const nextPreview = Array.isArray(current.specPreview)
            ? current.specPreview.map((r) => {
                if (String(r?.label) !== String(label)) {
                  return r;
                }
                return { ...r, value: String(value ?? "") };
              })
            : current.specPreview;

          return {
            bikeDetailsById: {
              ...state.bikeDetailsById,
              [id]: {
                ...current,
                specSheet: nextSpecSheet,
                specPreview: nextPreview,
              },
            },
          };
        });

        return { ok: true, warning: null };
      }

      if (error) {
        return { ok: false, error };
      }

      if (bikePatch) {
        set((state) => {
          const list = Array.isArray(state.bikes) ? state.bikes : [];
          const next = list.map((b) => {
            if (String(b?.id) !== id) return b;
            return { ...b, ...bikePatch };
          });
          return { bikes: next };
        });
        await persistBikes(get().bikes);

        if (isServerSyncActive()) {
          try {
            await apiFetch(`/api/bikes/${id}`, {
              method: "PUT",
              body: JSON.stringify(bikePatch),
            });
          } catch (e) {
            console.error(e);
            await addOutboxItem({
              type: "updateBike",
              userId: getAuthedUserId(),
              payload: { bikeId: id, patch: bikePatch },
            });
          }
        }

        await logEvent("ui.bike.spec_updated", {
          bikeId: id,
          patch: bikePatch,
        });
      }

      if (componentUpsert) {
        set((state) => {
          const map = { ...(state.componentsByBikeId || {}) };
          const current = Array.isArray(map[id]) ? map[id] : [];
          const existingIdx = current.findIndex(
            (c) =>
              String(c?.component_type) ===
              String(componentUpsert.component_type),
          );

          const nextRow = {
            ...(existingIdx >= 0 ? current[existingIdx] : {}),
            bike_id: id,
            component_type: componentUpsert.component_type,
            name: componentUpsert.name,
          };

          const nextList =
            existingIdx >= 0
              ? current.map((c, idx) => (idx === existingIdx ? nextRow : c))
              : [nextRow, ...current];

          map[id] = nextList;
          return { componentsByBikeId: map };
        });

        await persistComponentsMap(get().componentsByBikeId);

        if (isServerSyncActive()) {
          try {
            await apiFetch(`/api/bikes/${id}/components`, {
              method: "POST",
              body: JSON.stringify(componentUpsert),
            });
          } catch (e) {
            console.error(e);
            await addOutboxItem({
              type: "upsertComponent",
              userId: getAuthedUserId(),
              payload: { bikeId: id, ...componentUpsert },
            });
          }
        }

        await logEvent("ui.component.updated", {
          bikeId: id,
          ...componentUpsert,
        });
      }

      set((state) => {
        const list = Array.isArray(state.bikes) ? state.bikes : [];
        const bike = list.find((b) => String(b?.id) === id) || null;
        const comps = (state.componentsByBikeId || {})[id] || [];
        if (!bike) return {};

        const specSheet = buildSpecSheetFromCanonical({
          bike,
          components: comps,
        });
        const specPreview = buildSpecPreviewFromCanonical({
          bike,
          components: comps,
        });
        const existing = state.bikeDetailsById?.[id] || {};

        return {
          bikeDetailsById: {
            ...(state.bikeDetailsById || {}),
            [id]: {
              ...existing,
              specSheet,
              specPreview,
            },
          },
        };
      });

      return { ok: true, warning };
    },
  };
}
