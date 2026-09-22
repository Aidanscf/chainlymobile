import { useCallback } from "react";
import { Alert } from "react-native";
import { useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/services/apiClient";
import { runManualSync } from "@/utils/syncManager";
import { ACCOUNTS_ENABLED, SERVER_SYNC_ENABLED } from "@/utils/featureFlags";
import { useAuth } from "@/utils/auth/useAuth";
import { useChainlyStore } from "@/store/chainlyStore";

export function useStravaSync(bikeId) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isReady, isAuthenticated, signIn } = useAuth();

  const statusQuery = useQuery({
    queryKey: ["strava", "status", "bike", bikeId],
    enabled: !!(
      bikeId &&
      isReady &&
      isAuthenticated &&
      ACCOUNTS_ENABLED &&
      SERVER_SYNC_ENABLED
    ),
    queryFn: async () => {
      return await apiFetch("/api/strava/status", { method: "GET" });
    },
  });

  const syncMutation = useMutation({
    mutationFn: async () => {
      // Note: backend sync is currently account-wide; bike association can be added later.
      return await apiFetch("/api/strava/sync", { method: "POST" });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["strava", "status"] });
      try {
        await runManualSync({ reason: "strava" });
      } catch (e) {
        console.error(e);
      }

      // Best-effort: refresh bike data (in case health score depends on rides later)
      try {
        if (bikeId) {
          const { hydrateBikeGarageFromServer } = useChainlyStore.getState();
          await hydrateBikeGarageFromServer?.(bikeId);
        }
      } catch (e) {
        console.error(e);
      }

      Alert.alert("Success", "Strava rides synced");
    },
    onError: (e) => {
      console.error(e);
      Alert.alert("Couldn't sync", "Try again in a bit.");
    },
  });

  const onAddRideWithStrava = useCallback(() => {
    if (!ACCOUNTS_ENABLED || !SERVER_SYNC_ENABLED) {
      Alert.alert(
        "Not available",
        "Strava sync needs Accounts + Server Sync enabled in this build.",
      );
      return;
    }

    if (!isReady) {
      return;
    }

    if (!isAuthenticated) {
      signIn();
      return;
    }

    const connected = !!statusQuery.data?.connected;
    if (!connected) {
      router.push("/settings/strava");
      return;
    }

    syncMutation.mutate();
  }, [
    isAuthenticated,
    isReady,
    router,
    signIn,
    statusQuery.data,
    syncMutation,
  ]);

  const stravaTitle = syncMutation.isPending
    ? "Syncing…"
    : "Add Ride with Strava";

  const stravaDisabled = syncMutation.isPending || statusQuery.isLoading;

  return {
    onAddRideWithStrava,
    stravaTitle,
    stravaDisabled,
  };
}
