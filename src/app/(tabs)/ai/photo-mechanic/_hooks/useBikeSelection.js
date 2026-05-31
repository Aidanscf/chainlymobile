import { useState, useMemo, useCallback } from "react";
import { buildBikeProfileForAI } from "../_utils/bikeProfileBuilder";

export function useBikeSelection(bikeList) {
  const [selectedBikeId, setSelectedBikeId] = useState(null);

  const selectedBike = useMemo(() => {
    if (!selectedBikeId) return null;
    return (
      bikeList.find((b) => String(b?.id) === String(selectedBikeId)) || null
    );
  }, [bikeList, selectedBikeId]);

  const bikeProfile = useMemo(() => {
    return buildBikeProfileForAI(selectedBike);
  }, [selectedBike]);

  const onSelectBike = useCallback(
    (bikeId) => {
      setSelectedBikeId(bikeId ? String(bikeId) : null);
    },
    [setSelectedBikeId],
  );

  const clearBikeContext = useCallback(() => {
    setSelectedBikeId(null);
  }, []);

  return {
    selectedBikeId,
    selectedBike,
    bikeProfile,
    onSelectBike,
    clearBikeContext,
  };
}
