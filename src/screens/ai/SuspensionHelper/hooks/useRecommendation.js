import { useMemo } from "react";

export function useRecommendation(selectedBikeId, recState) {
  const recommended = useMemo(() => {
    // MVP: heuristic / stub that still feels like a coach.
    if (!selectedBikeId) return null;
    if (recState.status !== "open") return null;

    return {
      id: `rec:${selectedBikeId}`,
      context: "After your last ride, we noticed you bottomed out twice.",
      suggestion: "+5 PSI rear shock and +1 click compression.",
      shockDelta: { psiDelta: 5, compressionDelta: 1 },
    };
  }, [recState.status, selectedBikeId]);

  return recommended;
}
