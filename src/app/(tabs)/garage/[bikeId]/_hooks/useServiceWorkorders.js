import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { apiFetch, logEvent } from "@/services/apiClient";
import useUpload from "@/utils/useUpload";
import { uuidv4 } from "@/utils/uuid";
import { isServerSyncActive, getAuthedUserId } from "@/utils/serverSync";
import { addOutboxItem } from "@/utils/outbox";

import {
  listLocalWorkordersByBikeId,
  upsertLocalWorkorder,
  deleteLocalWorkorder,
  normalizeWorkorder,
  sortWorkordersNewestFirst,
} from "@/utils/serviceWorkorders";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidUUID(str) {
  return UUID_REGEX.test(String(str || "").trim());
}

function toYmd(dateLike) {
  if (!dateLike) return null;
  if (typeof dateLike === "string") {
    const s = dateLike.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    const d = new Date(s);
    if (Number.isFinite(d.getTime())) return d.toISOString().slice(0, 10);
    return null;
  }
  const d = dateLike instanceof Date ? dateLike : new Date(dateLike);
  if (!Number.isFinite(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

export function useServiceWorkorders(bikeId) {
  const id = useMemo(() => String(bikeId || "").trim(), [bikeId]);
  const queryClient = useQueryClient();
  const [upload, uploadState] = useUpload();

  const workordersQuery = useQuery({
    queryKey: ["workorders", id],
    enabled: !!id,
    queryFn: async () => {
      const local = await listLocalWorkordersByBikeId(id);

      const canUseServer =
        isServerSyncActive() && !!getAuthedUserId() && isValidUUID(id);

      if (!canUseServer) {
        return sortWorkordersNewestFirst(local);
      }

      try {
        const res = await apiFetch(`/api/bikes/${id}/workorders?limit=50`, {
          method: "GET",
        });
        const server = Array.isArray(res?.workorders) ? res.workorders : [];

        // Keep any local-only pending rows (offline add) until server catches up.
        const serverIds = new Set(server.map((w) => String(w?.id || "")));
        const localPending = local.filter(
          (w) => w?.pending && !serverIds.has(w.id),
        );

        const merged = [...server, ...localPending].map(normalizeWorkorder);
        return sortWorkordersNewestFirst(merged);
      } catch (e) {
        console.error(e);
        return sortWorkordersNewestFirst(local);
      }
    },
  });

  const createMutation = useMutation({
    mutationFn: async ({ title, serviceDate, imageAsset }) => {
      const t = String(title || "").trim();
      if (!t) {
        throw new Error("Title is required");
      }

      const ymd = toYmd(serviceDate);
      if (!ymd) {
        throw new Error("Date is required");
      }

      const nowYmd = new Date().toISOString().slice(0, 10);
      if (ymd > nowYmd) {
        throw new Error("Date can't be in the future");
      }

      if (!imageAsset) {
        throw new Error("Image is required");
      }

      const { url, mimeType, error } = await upload({
        reactNativeAsset: imageAsset,
      });

      if (error) {
        throw new Error(String(error));
      }

      if (!url || !mimeType || !String(mimeType).startsWith("image/")) {
        throw new Error("That doesn't look like an image");
      }

      const workorderId = uuidv4();
      const createdAt = new Date().toISOString();

      const optimistic = {
        id: workorderId,
        bike_id: id,
        title: t,
        service_date: ymd,
        image_url: url,
        created_at: createdAt,
        pending: true,

        // NEW: AI fields start idle; do NOT auto-run analysis
        ai_status: "idle",
        ai_summary: null,
        ai_summary_text: "",
        ai_confidence: null,
        ai_created_at: null,
        ai_error: null,
      };

      await upsertLocalWorkorder(optimistic);

      // Update UI immediately.
      queryClient.setQueryData(["workorders", id], (old) => {
        const prev = Array.isArray(old) ? old : [];
        const merged = [optimistic, ...prev]
          .map(normalizeWorkorder)
          .filter((x) => x.id && String(x.bike_id) === id)
          .filter(
            (x, idx, arr) =>
              arr.findIndex((y) => String(y.id) === String(x.id)) === idx,
          );
        return sortWorkordersNewestFirst(merged);
      });

      const canUseServer =
        isServerSyncActive() && !!getAuthedUserId() && isValidUUID(id);

      if (canUseServer) {
        try {
          await apiFetch(`/api/bikes/${id}/workorders`, {
            method: "POST",
            body: JSON.stringify({
              id: workorderId,
              title: t,
              serviceDate: ymd,
              imageUrl: url,
            }),
          });

          // Mark as non-pending locally (best-effort)
          await upsertLocalWorkorder({ ...optimistic, pending: false });
        } catch (e) {
          console.error(e);
          await addOutboxItem({
            type: "createWorkorder",
            userId: getAuthedUserId(),
            payload: {
              bikeId: id,
              id: workorderId,
              title: t,
              serviceDate: ymd,
              imageUrl: url,
            },
          });
        }
      } else {
        // No server available: keep it local-only.
        // If we have an authed user AND this is a real UUID bike, enqueue it for later.
        // (Avoid enqueueing demo bikes like "1"; those would block sync flush.)
        const userId = getAuthedUserId();
        if (userId && isValidUUID(id)) {
          await addOutboxItem({
            type: "createWorkorder",
            userId,
            payload: {
              bikeId: id,
              id: workorderId,
              title: t,
              serviceDate: ymd,
              imageUrl: url,
            },
          });
        }
      }

      await logEvent("ui.workorder.created", {
        bikeId: id,
        workorderId,
        title: t,
        serviceDate: ymd,
      });

      return { id: workorderId };
    },
    onSuccess: async () => {
      // Best-effort refresh.
      await queryClient.invalidateQueries({ queryKey: ["workorders", id] });
    },
  });

  const analyzeMutation = useMutation({
    mutationFn: async ({ workorder }) => {
      const w = normalizeWorkorder(workorder);
      if (!w?.id || !w?.bike_id) {
        throw new Error("Workorder not found");
      }
      if (!w?.image_url) {
        throw new Error("No image to analyze");
      }

      const canUseServer =
        isServerSyncActive() && !!getAuthedUserId() && isValidUUID(w.bike_id);

      if (!canUseServer) {
        throw new Error("AI analysis needs an online account session");
      }

      // Persist + show processing state immediately
      const processing = {
        ...w,
        ai_status: "processing",
        ai_error: null,
      };
      await upsertLocalWorkorder(processing);
      queryClient.setQueryData(["workorders", id], (old) => {
        const prev = Array.isArray(old) ? old : [];
        const next = prev
          .map(normalizeWorkorder)
          .map((x) => (String(x.id) === String(w.id) ? processing : x));
        return sortWorkordersNewestFirst(next);
      });

      await logEvent("ui.workorder.analyze_clicked", {
        bikeId: w.bike_id,
        workorderId: w.id,
      });

      const res = await apiFetch(`/api/workorders/analyze`, {
        method: "POST",
        body: JSON.stringify({
          bike_id: w.bike_id,
          workorder_id: w.id,
          image_url: w.image_url,
        }),
      });

      const updated = {
        ...processing,
        ai_status: "done",
        ai_summary: res?.summary ?? null,
        ai_summary_text: String(res?.summary_text || ""),
        ai_confidence:
          typeof res?.confidence === "number" ? Number(res.confidence) : null,
        ai_created_at: new Date().toISOString(),
        ai_error: null,
        pending: Boolean(w.pending),
      };

      await upsertLocalWorkorder(updated);

      queryClient.setQueryData(["workorders", id], (old) => {
        const prev = Array.isArray(old) ? old : [];
        const next = prev
          .map(normalizeWorkorder)
          .map((x) => (String(x.id) === String(w.id) ? updated : x));
        return sortWorkordersNewestFirst(next);
      });

      await logEvent("ui.workorder.analyze_success", {
        bikeId: w.bike_id,
        workorderId: w.id,
        confidence: updated.ai_confidence,
      });

      return { ok: true, workorder: updated };
    },
    onError: async (err, vars) => {
      try {
        const w = normalizeWorkorder(vars?.workorder);
        if (!w?.id || !w?.bike_id) return;

        const failed = {
          ...w,
          ai_status: "failed",
          ai_error: String(err?.message || "Analysis failed"),
        };

        await upsertLocalWorkorder(failed);
        queryClient.setQueryData(["workorders", id], (old) => {
          const prev = Array.isArray(old) ? old : [];
          const next = prev
            .map(normalizeWorkorder)
            .map((x) => (String(x.id) === String(w.id) ? failed : x));
          return sortWorkordersNewestFirst(next);
        });

        await logEvent("ui.workorder.analyze_failed", {
          bikeId: w.bike_id,
          workorderId: w.id,
          error: String(err?.message || "Analysis failed"),
        });
      } catch (e) {
        // no-op
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ workorder }) => {
      const w = normalizeWorkorder(workorder);
      if (!w?.id || !w?.bike_id) {
        throw new Error("Workorder not found");
      }

      const canUseServer =
        isServerSyncActive() && !!getAuthedUserId() && isValidUUID(w.bike_id);

      // Optimistically remove from UI + local storage
      await deleteLocalWorkorder({ bikeId: w.bike_id, workorderId: w.id });
      queryClient.setQueryData(["workorders", id], (old) => {
        const prev = Array.isArray(old) ? old : [];
        const next = prev
          .map(normalizeWorkorder)
          .filter((x) => String(x.id) !== String(w.id));
        return sortWorkordersNewestFirst(next);
      });

      if (canUseServer) {
        try {
          await apiFetch(`/api/workorders/${w.id}`, { method: "DELETE" });
        } catch (e) {
          console.error(e);
          await addOutboxItem({
            type: "deleteWorkorder",
            userId: getAuthedUserId(),
            payload: { bikeId: w.bike_id, workorderId: w.id },
          });
        }
      } else {
        const userId = getAuthedUserId();
        if (userId && isValidUUID(w.bike_id)) {
          await addOutboxItem({
            type: "deleteWorkorder",
            userId,
            payload: { bikeId: w.bike_id, workorderId: w.id },
          });
        }
      }

      await logEvent("ui.workorder.deleted", {
        bikeId: w.bike_id,
        workorderId: w.id,
      });

      return { ok: true };
    },
  });

  const items = Array.isArray(workordersQuery.data) ? workordersQuery.data : [];

  return {
    workorders: items,
    isLoading: workordersQuery.isLoading,
    isError: workordersQuery.isError,
    error: workordersQuery.error,
    refetch: workordersQuery.refetch,

    createWorkorder: createMutation.mutateAsync,
    creating: createMutation.isPending || uploadState.loading,

    analyzeWorkorder: analyzeMutation.mutateAsync,
    analyzing: analyzeMutation.isPending,

    deleteWorkorder: deleteMutation.mutateAsync,
    deleting: deleteMutation.isPending,
  };
}
