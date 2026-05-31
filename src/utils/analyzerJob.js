import { rubricsByType } from "@/utils/scoringRubrics";
import { drillsLibrary } from "@/data/drillsLibrary";
import { startAIJob, waitForAIJob } from "@/services/aiJobClient";

function clamp01To100(n) {
  const v = Number(n) || 0;
  return Math.max(0, Math.min(100, v));
}

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function round(n) {
  return Math.round(Number(n) || 0);
}

function pick(arr) {
  if (!Array.isArray(arr) || arr.length === 0) {
    return null;
  }
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickCharacterBadge(ridingType, overallScore) {
  if (overallScore >= 90) {
    return "Smooth Operator";
  }
  if (ridingType === "Jumps") return "Air Captain";
  if (ridingType === "Cornering") return "Berm Wizard";
  if (ridingType === "Drops") return "Drop Doctor";
  return "Tech Tamer";
}

function buildShareCardData(result) {
  const sorted = [...(result.subScores || [])].sort(
    (a, b) => b.score - a.score,
  );
  const best = sorted[0];
  const weak = sorted[sorted.length - 1];

  return {
    ridingType: result.ridingType,
    overallScore: result.overallScore,
    bestSubScore: best ? { name: best.name, score: best.score } : null,
    weakestSubScore: weak ? { name: weak.name, score: weak.score } : null,
    badge: pickCharacterBadge(result.ridingType, result.overallScore),
  };
}

export function generateMockAnalyzerResult({
  mediaUri,
  mediaType,
  ridingType,
  options,
  previousResult,
}) {
  const rubric = rubricsByType[ridingType];
  if (!rubric) {
    throw new Error(`Unknown ridingType: ${String(ridingType)}`);
  }

  // Friendly baseline: start around 65–86 with gentle variance.
  // If they’re using aggressive scoring, shift down a touch.
  const aggressive = Boolean(options?.aggressiveScoring);
  const beginnerFriendly = Boolean(options?.beginnerFriendly);

  const base = rand(68, 86) - (aggressive ? 6 : 0) + (beginnerFriendly ? 2 : 0);

  // We build sub-scores, then overall.
  const rawSubScores = rubric.subScores.map((s) => {
    const variance = rand(-12, 10);
    const score = clamp01To100(base + variance);

    return {
      key: s.key,
      name: s.name,
      score: round(score),
      notes: pick([
        "Solid foundation — this is close.",
        "You’re right there. One small cue will unlock it.",
        "This is your next easy win.",
      ]),
      tips: Array.isArray(s.cues) ? s.cues.slice(0, 2) : [],
      drill: s.drill,
      commonMistake: s.commonMistake,
    };
  });

  // Make at least one clear “weak” area so drills feel real.
  const weakestIdx = Math.floor(Math.random() * rawSubScores.length);
  rawSubScores[weakestIdx] = {
    ...rawSubScores[weakestIdx],
    score: clamp01To100(rawSubScores[weakestIdx].score - rand(10, 18)),
  };

  const overallScore = round(
    rawSubScores.reduce((acc, s) => acc + (Number(s.score) || 0), 0) /
      rawSubScores.length,
  );

  const confidence = round(clamp01To100(rand(72, 95)));

  const sortedByWeak = [...rawSubScores].sort((a, b) => a.score - b.score);
  const keyFixes = sortedByWeak.slice(0, 2).map((s) => s.name);
  const keyWins = [...rawSubScores]
    .sort((a, b) => b.score - a.score)
    .slice(0, 2)
    .map((s) => s.name);

  const summary = pick([
    "You’re stable and confident — let’s soften one piece so it feels effortless.",
    "Nice control. We’ll tighten one cue and you’ll feel it click fast.",
    "Strong base. A small timing tweak will make this look pro.",
  ]);

  // Drills: pick based on the 2 weakest sub-scores.
  const drillBank = drillsLibrary[ridingType] || {};
  const drillPicks = [];
  for (const weak of keyFixes) {
    const match = rawSubScores.find((s) => s.name === weak);
    const key = match?.key;
    const candidates = key ? drillBank[key] : null;
    const d = pick(candidates);
    if (d) {
      drillPicks.push(d);
    }
  }

  // Top 3 unique
  const drills = drillPicks
    .filter(Boolean)
    .filter((d, idx, arr) => arr.findIndex((x) => x.id === d.id) === idx)
    .slice(0, 3);

  const id = String(Date.now());

  const createdAt = new Date().toISOString();

  const result = {
    id,
    createdAt,
    mediaUri,
    mediaType,
    ridingType,
    overallScore,
    subScores: rawSubScores,
    confidence,
    keyWins,
    keyFixes,
    drills,
    shareCardData: null,
    previousOverallScore: previousResult?.overallScore ?? null,
  };

  result.shareCardData = buildShareCardData(result);

  return result;
}

export function startAnalysisJob({
  mediaUri,
  mediaType,
  ridingType,
  options,
  previousResult,
  onProgress,
}) {
  const steps = [
    "Uploading media",
    "Detecting rider + bike",
    "Measuring movement & form",
    "Scoring + generating drills",
    "Finalizing results",
  ];

  let cancelled = false;
  let innerCancel = null;

  const jobId = String(Date.now());
  const startedAt = Date.now();

  const emit = ({ progress, stepIndex }) => {
    onProgress?.({
      jobId,
      progress,
      stepIndex,
      steps,
      startedAt,
    });
  };

  const done = new Promise((resolve, reject) => {
    (async () => {
      try {
        emit({ progress: 0, stepIndex: 0 });

        // Server-backed job system (cacheable + auditable)
        const { job } = await startAIJob({
          type: "media_analyzer",
          input: {
            mediaUri,
            mediaType,
            ridingType,
            options: options || {},
            previousOverallScore: previousResult?.overallScore ?? null,
          },
        });

        if (!job?.id) {
          throw new Error("No job returned");
        }

        const waiter = waitForAIJob({
          jobId: job.id,
          pollIntervalMs: 650,
          timeoutMs: 30000,
          onProgress: (j) => {
            if (cancelled) {
              return;
            }
            const p = Math.max(0, Math.min(100, Number(j?.progress) || 0));
            const idx = Math.min(
              steps.length - 1,
              Math.floor((p / 100) * steps.length),
            );
            emit({ progress: p, stepIndex: idx });
          },
        });

        innerCancel = waiter.cancel;

        const finalJob = await waiter.done;
        if (cancelled) {
          reject(new Error("Analysis cancelled"));
          return;
        }

        const serverResult = finalJob?.result || null;
        if (serverResult) {
          // Update user character store with the new badge
          if (serverResult?.shareCardData?.badge) {
            try {
              const { useUserCharacter } = await import(
                "@/store/userCharacter"
              );
              useUserCharacter.getState().updateCharacter({
                badge: serverResult.shareCardData.badge,
                ridingType: serverResult.ridingType,
                overallScore: serverResult.overallScore,
              });
            } catch (err) {
              console.error("Failed to update user character:", err);
            }
          }
          resolve(serverResult);
          return;
        }

        // Fallback: local mock (offline safe)
        const localResult = generateMockAnalyzerResult({
          mediaUri,
          mediaType,
          ridingType,
          options,
          previousResult,
        });

        // Update user character store with the mock result
        if (localResult?.shareCardData?.badge) {
          try {
            const { useUserCharacter } = await import("@/store/userCharacter");
            useUserCharacter.getState().updateCharacter({
              badge: localResult.shareCardData.badge,
              ridingType: localResult.ridingType,
              overallScore: localResult.overallScore,
            });
          } catch (err) {
            console.error("Failed to update user character:", err);
          }
        }

        resolve(localResult);
      } catch (error) {
        console.error(error);

        // Fallback: local mock (offline safe)
        try {
          const localResult = generateMockAnalyzerResult({
            mediaUri,
            mediaType,
            ridingType,
            options,
            previousResult,
          });

          // Update user character store with the fallback result
          if (localResult?.shareCardData?.badge) {
            try {
              const { useUserCharacter } = await import(
                "@/store/userCharacter"
              );
              useUserCharacter.getState().updateCharacter({
                badge: localResult.shareCardData.badge,
                ridingType: localResult.ridingType,
                overallScore: localResult.overallScore,
              });
            } catch (err) {
              console.error("Failed to update user character:", err);
            }
          }

          resolve(localResult);
        } catch (e) {
          reject(error);
        }
      }
    })();
  });

  const cancel = () => {
    cancelled = true;
    try {
      innerCancel?.();
    } catch (e) {
      // no-op
    }
  };

  return { jobId, steps, cancel, done };
}
