import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useChainlyStore } from "@/store/chainlyStore";
import { useAuthStore } from "@/utils/auth/store";

const isDev = process.env.NODE_ENV !== "production";

export function useBikes() {
  // Keep this screen aligned with Garage (single source of truth).
  // Garage reads bikes from the Chainly store; the store knows when to use
  // server sync vs local-only.
  const bikes = useChainlyStore((s) => s.bikes);
  const hydrateBikesFromLocal = useChainlyStore((s) => s.hydrateBikesFromLocal);
  const hydrateBikesFromServer = useChainlyStore(
    (s) => s.hydrateBikesFromServer,
  );

  const authHydrated = useAuthStore((s) => s.hydrated);
  const authStatus = useAuthStore((s) => s.status);
  const authUserId = useAuthStore((s) => s.user?.id);

  // Ensure auth state is hydrated so server sync can activate when available.
  useEffect(() => {
    if (!authHydrated) {
      useAuthStore
        .getState()
        .hydrateAuth()
        .catch((e) => console.error(e));
    }
  }, [authHydrated]);

  const bikesQuery = useQuery({
    queryKey: ["bikes", authStatus, authUserId || "anon", authHydrated],
    queryFn: async () => {
      if (isDev) {
        console.log("[ai.photo-mechanic] bikes query", {
          authHydrated,
          authStatus,
          userId: authUserId || null,
        });
      }

      // Hydrate local first for instant-ish UX.
      try {
        await hydrateBikesFromLocal?.();
      } catch (e) {
        if (isDev) console.log("[ai.photo-mechanic] hydrate local failed");
      }

      // Then best-effort server hydrate. This internally no-ops when sync isn't active.
      let serverResult = null;
      try {
        serverResult = await hydrateBikesFromServer?.();
      } catch (e) {
        serverResult = null;
      }

      // The store is the truth; query just reflects "is loading" / "can retry".
      const latest = useChainlyStore.getState().bikes;
      const latestList = Array.isArray(latest) ? latest : [];

      // Only treat as an error if we truly have nothing to show.
      // hydrateBikesFromServer returns null on failure.
      if (!latestList.length && serverResult === null) {
        throw new Error("Could not load bikes");
      }

      return latestList;
    },
    staleTime: 1000 * 30,
  });

  const bikeList = useMemo(() => {
    return Array.isArray(bikes) ? bikes : [];
  }, [bikes]);

  return {
    bikesQuery,
    bikeList,
  };
}
