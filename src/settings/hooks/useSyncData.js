import { useMemo } from "react";
import { SERVER_SYNC_ENABLED, ACCOUNTS_ENABLED } from "@/utils/featureFlags";
import useChainlyStore from "@/store/chainlyStore";
import { useSyncStore } from "@/store/sync";

export function useSyncData() {
  const pendingBikeCreatesCount = useChainlyStore(
    (s) => (s.pendingBikeCreates || []).length,
  );

  const syncOutboxCount = useSyncStore((s) => s.outboxCount);
  const syncLastSyncedAt = useSyncStore((s) => s.lastSyncedAt);
  const syncError = useSyncStore((s) => s.error);
  const syncing = useSyncStore((s) => s.syncing);

  const pendingChangesCount =
    (syncOutboxCount || 0) + (pendingBikeCreatesCount || 0);

  const syncSummary = useMemo(() => {
    const last = syncLastSyncedAt ? String(syncLastSyncedAt) : null;
    if (!SERVER_SYNC_ENABLED) return "Off";
    if (!ACCOUNTS_ENABLED) return "Requires accounts";
    if (!last) return "Not synced yet";

    const d = new Date(last);
    if (Number.isNaN(d.getTime())) return "Last synced: —";
    return `Last synced: ${d.toLocaleString()}`;
  }, [syncLastSyncedAt]);

  const pendingSummary = useMemo(() => {
    if (!SERVER_SYNC_ENABLED) return "Offline-only";
    if (!pendingChangesCount) return "No offline changes";
    return `Offline changes pending: ${pendingChangesCount}`;
  }, [pendingChangesCount]);

  return {
    syncing,
    syncError,
    syncSummary,
    pendingSummary,
  };
}
