import { useCallback } from "react";
import { useRouter } from "expo-router";

export function useBikeActions(bikeId) {
  const router = useRouter();

  const onBack = useCallback(() => {
    router.back();
  }, [router]);

  const onSpecSheet = useCallback(() => {
    router.push(`/garage/${bikeId}/spec-sheet`);
  }, [bikeId, router]);

  const onTuneMaintenance = useCallback(() => {
    router.push(`/garage/${bikeId}/maintenance`);
  }, [bikeId, router]);

  const onAddRideManually = useCallback(() => {
    if (!bikeId) return;
    router.push({ pathname: "/AddManualRide", params: { bikeId } });
  }, [bikeId, router]);

  return {
    onBack,
    onSpecSheet,
    onTuneMaintenance,
    onAddRideManually,
  };
}
