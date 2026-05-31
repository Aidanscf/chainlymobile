import { create } from "zustand";

function clamp01To100(n) {
  const v = Number(n) || 0;
  return Math.max(0, Math.min(100, v));
}

const DEFAULT_SKILLS = {
  Jumping: 62,
  Cornering: 66,
  Drops: 60,
  Flow: 70,
  Tech: 64,
  Climbing: 68,
};

function bumpSkill(current, delta) {
  const next = clamp01To100((Number(current) || 0) + (Number(delta) || 0));
  return next;
}

function mapTypeToPrimarySkill(ridingType) {
  switch (ridingType) {
    case "Jumps":
      return "Jumping";
    case "Drops":
      return "Drops";
    case "Cornering":
      return "Cornering";
    case "Steep Tech":
      return "Tech";
    default:
      return null;
  }
}

export const useMediaAnalyzerStore = create((set, get) => ({
  // In-progress flow state
  draft: null, // { mediaUri, mediaType, ridingType, options }
  setDraft: (partial) => {
    set((state) => ({
      draft: {
        ...(state.draft || {}),
        ...(partial || {}),
      },
    }));
  },
  clearDraft: () => set({ draft: null }),

  // Analyzer results history
  results: [],
  addResult: (result) => {
    if (!result?.id) {
      throw new Error("addResult requires result.id");
    }

    const primarySkill = mapTypeToPrimarySkill(result.ridingType);

    set((state) => {
      const prevByType = (state.results || []).find(
        (r) => r.ridingType === result.ridingType,
      );

      // Small, positive, consumer-app style progression.
      // If they improved vs last time, bump a bit more.
      const prevScore = Number(prevByType?.overallScore);
      const currentScore = Number(result.overallScore);
      const improved = Number.isFinite(prevScore)
        ? currentScore - prevScore
        : 0;

      const baseDelta = 1.2;
      const improvementDelta = Math.max(0, improved) * 0.04;
      const primaryDelta = baseDelta + improvementDelta;

      const nextSkills = { ...(state.skillStats || DEFAULT_SKILLS) };
      if (primarySkill) {
        nextSkills[primarySkill] = bumpSkill(
          nextSkills[primarySkill],
          primaryDelta,
        );
      }

      // Light “halo” progression.
      if (result.ridingType === "Jumps") {
        nextSkills.Flow = bumpSkill(nextSkills.Flow, 0.4);
      }
      if (result.ridingType === "Steep Tech") {
        nextSkills.Climbing = bumpSkill(nextSkills.Climbing, 0.25);
      }

      const nextResults = [result, ...(state.results || [])]
        .filter((r, idx, arr) => arr.findIndex((x) => x.id === r.id) === idx)
        .slice(0, 50);

      return {
        results: nextResults,
        skillStats: nextSkills,
      };
    });
  },

  getResultById: (id) => {
    const results = get().results || [];
    return results.find((r) => String(r.id) === String(id)) || null;
  },

  getResultsByType: (ridingType) => {
    const results = get().results || [];
    return results.filter((r) => r.ridingType === ridingType);
  },

  getLastResultByType: (ridingType, excludeId) => {
    const results = get().results || [];
    const filtered = results.filter((r) => r.ridingType === ridingType);
    const without = excludeId
      ? filtered.filter((r) => String(r.id) !== String(excludeId))
      : filtered;
    return without[0] || null;
  },

  // Simple local drill plan (MVP)
  trainingPlan: [],
  addDrillToPlan: (drill, sourceResultId) => {
    if (!drill?.id) {
      return;
    }
    set((state) => {
      const entry = {
        id: `${drill.id}:${String(sourceResultId || "")}:${Date.now()}`,
        drill,
        sourceResultId: sourceResultId || null,
        createdAt: new Date().toISOString(),
      };
      return {
        trainingPlan: [entry, ...(state.trainingPlan || [])].slice(0, 30),
      };
    });
  },

  skillStats: DEFAULT_SKILLS,
}));

export default useMediaAnalyzerStore;
