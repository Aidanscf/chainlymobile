import { useMemo } from "react";
import { useChainlyStore } from "@/store/chainlyStore";
import { useSuspensionStore } from "@/store/suspension";

export function useBikeSelection() {
  const bikes = useChainlyStore((s) => s.bikes);
  const getBikeById = useChainlyStore((s) => s.getBikeById);
  const session = useSuspensionStore((s) => s.session);

  const bikeList = useMemo(() => {
    return Array.isArray(bikes) ? bikes : [];
  }, [bikes]);

  const selectedBikeId = useMemo(() => {
    return (
      session?.bikeId ||
      (bikeList[0]?.id != null ? String(bikeList[0].id) : null)
    );
  }, [bikeList, session?.bikeId]);

  const selectedBike = useMemo(() => {
    if (!selectedBikeId) return null;
    return getBikeById(String(selectedBikeId));
  }, [getBikeById, selectedBikeId]);

  const selectedBikeLabel = useMemo(() => {
    if (selectedBike?.name) return selectedBike.name;
    if (bikeList.length === 0) return "No bikes yet";
    return "Select a bike";
  }, [bikeList.length, selectedBike?.name]);

  return {
    bikeList,
    selectedBikeId,
    selectedBike,
    selectedBikeLabel,
  };
}
