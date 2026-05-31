import { AppState } from "react-native";

import { apiFetch } from "@/services/apiClient";
import { isServerSyncActive, getAuthedUserId } from "@/utils/serverSync";
import { addOutboxItem, getOutbox, removeOutboxItems } from "@/utils/outbox";
import { useSyncStore } from "@/store/sync";

import useChainlyStore from "@/store/chainlyStore";
import useRidesStore from "@/store/rides";
import useSettingsStore from "@/store/settings";
import useSuspensionStore from "@/store/suspension";

function devLog(...args) {
  const isDev = process.env.NODE_ENV !== "production";
  if (isDev) {
    console.log("[sync]", ...args);
  }
}

let appStateSub = null;
let didInit = false;
let initialSyncUserId = null;
let flushing = false;

async function syncProfileWithServer() {
  const settingsState = useSettingsStore.getState();
  const localSettings = settingsState?.settings || {};

  const localProfileUpdatedAt =
    localSettings?.syncMeta?.profileUpdatedAt || null;

  let server = null;
  try {
    server = await apiFetch("/api/profile", { method: "GET" });
  } catch (e) {
    devLog("profile GET failed", String(e?.message || e));
    // Offline / server down.
    return { ok: false, error: "Could not load profile" };
  }

  const serverProfile = server?.profile || null;
  const serverUpdatedAt = server?.updatedAt ? String(server.updatedAt) : null;

  const serverIsNewer =
    !!serverUpdatedAt &&
    (!localProfileUpdatedAt || serverUpdatedAt > localProfileUpdatedAt);

  if (serverIsNewer && serverProfile && typeof serverProfile === "object") {
    // Pull server -> merge into local.
    const next = {
      ...localSettings,
      userProfile: {
        ...(localSettings.userProfile || {}),
        ...(serverProfile.userProfile || {}),
      },
      notificationPrefs: {
        ...(localSettings.notificationPrefs || {}),
        ...(serverProfile.notificationPrefs || {}),
      },
      bikeInfo: {
        ...(localSettings.bikeInfo || {}),
        ...(serverProfile.bikeInfo || {}),
      },
      appearance: {
        ...(localSettings.appearance || {}),
        ...(serverProfile.appearance || {}),
      },
      syncMeta: {
        ...(localSettings.syncMeta || {}),
        profileUpdatedAt: serverUpdatedAt,
      },
    };

    await settingsState.setSettings(next);
    devLog("profile pulled", serverUpdatedAt);
    return { ok: true, direction: "pulled" };
  }

  // Local wins (or server empty): push local -> server (best-effort)
  try {
    const payload = {
      userProfile: localSettings.userProfile || {},
      notificationPrefs: localSettings.notificationPrefs || {},
      bikeInfo: localSettings.bikeInfo || {},
      appearance: localSettings.appearance || {},
      syncMeta: {
        profileUpdatedAt: localProfileUpdatedAt || new Date().toISOString(),
      },
    };

    const res = await apiFetch("/api/profile", {
      method: "PUT",
      body: JSON.stringify(payload),
    });

    const nextUpdatedAt = res?.updatedAt ? String(res.updatedAt) : null;
    if (nextUpdatedAt) {
      const next = {
        ...localSettings,
        syncMeta: {
          ...(localSettings.syncMeta || {}),
          profileUpdatedAt: nextUpdatedAt,
        },
      };
      await settingsState.setSettings(next);
    }

    devLog("profile pushed", nextUpdatedAt);
    return { ok: true, direction: "pushed" };
  } catch (e) {
    devLog("profile PUT failed", String(e?.message || e));
    return { ok: false, error: "Could not save profile" };
  }
}

async function syncBikesRidesPresetsFromServer() {
  // Bikes
  const bikeState = useChainlyStore.getState();
  await bikeState?.hydrateBikesFromServer?.();

  // Rides
  const ridesState = useRidesStore.getState();
  await ridesState?.hydrateFromServer?.();

  // Presets (per bike)
  const bikes = Array.isArray(useChainlyStore.getState().bikes)
    ? useChainlyStore.getState().bikes
    : [];

  const ids = bikes.map((b) => (b?.id ? String(b.id) : null)).filter(Boolean);

  for (const bikeId of ids) {
    try {
      await useSuspensionStore.getState().hydratePresetsFromServer?.(bikeId);
    } catch (e) {
      console.error(e);
    }
  }
}

export async function flushOutbox({ reason } = {}) {
  if (!isServerSyncActive()) {
    return { ok: false, skipped: true, reason: "inactive" };
  }

  const userId = getAuthedUserId();
  if (!userId) {
    return { ok: false, skipped: true, reason: "no-user" };
  }

  if (flushing) {
    return { ok: true, skipped: true, reason: "already-flushing" };
  }

  flushing = true;
  useSyncStore.getState().setSyncing(true);
  useSyncStore.getState().clearError();

  try {
    const outbox = await getOutbox();
    const queue = outbox.filter(
      (x) => !x?.userId || String(x.userId) === userId,
    );

    if (!queue.length) {
      // Also flush legacy pending bike creates (offline wizard flow)
      try {
        await useChainlyStore.getState().processPendingBikeCreates?.();
      } catch (e) {
        // no-op
      }

      return { ok: true, flushed: 0 };
    }

    devLog("flushOutbox start", {
      reason: reason || "unknown",
      count: queue.length,
    });

    let flushed = 0;

    for (const item of queue) {
      try {
        if (item.type === "createBike") {
          await apiFetch("/api/bikes", {
            method: "POST",
            body: JSON.stringify(item.payload || {}),
          });
        } else if (item.type === "updateBike") {
          const bikeId = String(item?.payload?.bikeId || "");
          await apiFetch(`/api/bikes/${bikeId}`, {
            method: "PUT",
            body: JSON.stringify(item?.payload?.patch || {}),
          });
        } else if (item.type === "deleteBike") {
          const bikeId = String(item?.payload?.bikeId || "");
          await apiFetch(`/api/bikes/${bikeId}`, { method: "DELETE" });
        } else if (item.type === "createRide") {
          await apiFetch("/api/rides", {
            method: "POST",
            body: JSON.stringify(item.payload || {}),
          });
        } else if (item.type === "deleteRide") {
          const rideId = String(item?.payload?.rideId || "");
          await apiFetch(`/api/rides/${rideId}`, { method: "DELETE" });
        } else if (item.type === "createPreset") {
          const bikeId = String(item?.payload?.bikeId || "");
          await apiFetch(`/api/bikes/${bikeId}/presets`, {
            method: "POST",
            body: JSON.stringify(item.payload || {}),
          });
        } else if (item.type === "updatePreset") {
          const presetId = String(item?.payload?.presetId || "");
          await apiFetch(`/api/presets/${presetId}`, {
            method: "PUT",
            body: JSON.stringify(item?.payload?.patch || {}),
          });
        } else if (item.type === "deletePreset") {
          const presetId = String(item?.payload?.presetId || "");
          await apiFetch(`/api/presets/${presetId}`, { method: "DELETE" });
        } else if (item.type === "saveProfile") {
          await apiFetch("/api/profile", {
            method: "PUT",
            body: JSON.stringify(item.payload || {}),
          });
        } else if (item.type === "upsertComponent") {
          const bikeId = String(item?.payload?.bikeId || "");
          const payload = { ...item.payload };
          delete payload.bikeId;
          await apiFetch(`/api/bikes/${bikeId}/components`, {
            method: "POST",
            body: JSON.stringify(payload),
          });
        } else if (item.type === "createWorkorder") {
          const bikeId = String(item?.payload?.bikeId || "");
          const payload = { ...item.payload };
          delete payload.bikeId;
          await apiFetch(`/api/bikes/${bikeId}/workorders`, {
            method: "POST",
            body: JSON.stringify(payload),
          });
        } else {
          // Unknown type; drop it to avoid blocking forever.
          devLog("drop unknown outbox item", item.type);
        }

        flushed += 1;

        await removeOutboxItems(
          (x) => x?.createdAt === item.createdAt && x?.type === item.type,
        );
      } catch (e) {
        // Stop on first failure (likely offline)
        devLog("flushOutbox failed", item.type);
        throw e;
      }
    }

    // After flushing the main outbox, also flush legacy pending bike creates.
    try {
      await useChainlyStore.getState().processPendingBikeCreates?.();
    } catch (e) {
      // no-op
    }

    await useSyncStore.getState().setLastSyncedAt(new Date().toISOString());

    devLog("flushOutbox done", { flushed });
    return { ok: true, flushed };
  } catch (e) {
    console.error(e);
    useSyncStore.getState().setError("Sync failed. Try again.");
    return { ok: false, error: String(e?.message || e) };
  } finally {
    flushing = false;
    useSyncStore.getState().setSyncing(false);
  }
}

export async function runInitialSyncOnce({ reason } = {}) {
  if (!isServerSyncActive()) {
    return { ok: false, skipped: true, reason: "inactive" };
  }

  const userId = getAuthedUserId();
  if (!userId) {
    return { ok: false, skipped: true, reason: "no-user" };
  }

  if (initialSyncUserId === userId) {
    return { ok: true, skipped: true, reason: "already" };
  }

  initialSyncUserId = userId;

  useSyncStore.getState().setSyncing(true);
  useSyncStore.getState().clearError();

  try {
    devLog("initial sync start", { reason: reason || "unknown", userId });

    await syncProfileWithServer();
    await syncBikesRidesPresetsFromServer();
    await flushOutbox({ reason: "initial" });

    await useSyncStore.getState().setLastSyncedAt(new Date().toISOString());

    devLog("initial sync done");
    return { ok: true };
  } catch (e) {
    console.error(e);
    useSyncStore
      .getState()
      .setError("Could not sync. You can keep using Chainly offline.");
    return { ok: false };
  } finally {
    useSyncStore.getState().setSyncing(false);
  }
}

export async function runManualSync({ reason } = {}) {
  if (!isServerSyncActive()) {
    return { ok: false, skipped: true, reason: "inactive" };
  }

  useSyncStore.getState().setSyncing(true);
  useSyncStore.getState().clearError();

  try {
    devLog("manual sync start", { reason: reason || "manual" });

    await syncProfileWithServer();
    await syncBikesRidesPresetsFromServer();
    await flushOutbox({ reason: reason || "manual" });

    await useSyncStore.getState().setLastSyncedAt(new Date().toISOString());

    devLog("manual sync done");
    return { ok: true };
  } catch (e) {
    console.error(e);
    useSyncStore.getState().setError("Sync failed. Try again.");
    return { ok: false };
  } finally {
    useSyncStore.getState().setSyncing(false);
  }
}

export function initSyncManager() {
  if (didInit) return;
  didInit = true;

  // Keep UI showing accurate outbox count.
  useSyncStore.getState().hydrate();
  getOutbox()
    .then((items) => {
      useSyncStore
        .getState()
        .setOutboxCount(Array.isArray(items) ? items.length : 0);
    })
    .catch(() => {
      // no-op
    });

  try {
    appStateSub = AppState.addEventListener("change", async (nextState) => {
      if (nextState === "active") {
        await flushOutbox({ reason: "foreground" });
      }
    });
  } catch (e) {
    // Web / older RN.
  }
}

export function teardownSyncManager() {
  try {
    appStateSub?.remove?.();
  } catch (e) {
    // no-op
  }
  appStateSub = null;
  didInit = false;
  initialSyncUserId = null;
}

// Convenience: enqueue a profile save without blocking UX.
export async function enqueueProfileSave(payload) {
  const userId = getAuthedUserId();
  await addOutboxItem({ type: "saveProfile", payload, userId });
}
