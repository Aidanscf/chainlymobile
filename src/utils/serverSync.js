import { ACCOUNTS_ENABLED, SERVER_SYNC_ENABLED } from "@/utils/featureFlags";
import { useAuthStore } from "@/utils/auth/store";

export function isServerSyncActive() {
  if (!SERVER_SYNC_ENABLED) return false;
  if (!ACCOUNTS_ENABLED) return false;

  const s = useAuthStore.getState();
  return s?.status === "authenticated" && !!s?.accessToken && !!s?.user?.id;
}

export function getAuthedUserId() {
  const s = useAuthStore.getState();
  return s?.status === "authenticated" && s?.user?.id
    ? String(s.user.id)
    : null;
}
