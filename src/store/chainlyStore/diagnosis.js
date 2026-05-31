import {
  createDiagnosisFromImage,
  createMaintenanceItemFromDiagnosis,
} from "@/utils/ai/photoMechanic";
import { startAIJob, waitForAIJob } from "@/services/aiJobClient";

export function createDiagnosisActions(set, get) {
  return {
    startNewDiagnosis: ({ imageUri }) => {
      set({
        currentDiagnosis: {
          id: String(Date.now()),
          createdAt: new Date().toISOString(),
          imageUri,
          bikeId: null,
          detectedCategory: "other",
          confidence: 0,
          symptomsSelected: [],
          summary: "",
          warnings: [],
          fixSteps: [],
          parts: [],
          tools: [],
          guides: [],
          saveStatus: "not_saved",
        },
      });
    },

    analyzeDiagnosisFromImage: async ({ imageUri, useSample = false }) => {
      set({ diagnosisLoading: true });
      try {
        // Prefer the shared server job system (cacheable + auditable)
        let session = null;
        try {
          const { job } = await startAIJob({
            type: "photo_mechanic",
            input: { imageUri, useSample },
          });

          if (job?.id) {
            const waiter = waitForAIJob({
              jobId: job.id,
              pollIntervalMs: 650,
              timeoutMs: 20000,
            });
            const finalJob = await waiter.done;
            session = finalJob?.result || null;
          }
        } catch (e) {
          console.error(e);
        }

        // Fallback: local mock (offline safe)
        if (!session) {
          session = createDiagnosisFromImage(imageUri, { useSample });
        }

        // Give the UI a beat for the "Scanning your setup…" vibe.
        await new Promise((r) => setTimeout(r, 900));

        set((state) => {
          const nextHistory = [session, ...(state.diagnosisHistory || [])]
            .filter(
              (s, idx, arr) => arr.findIndex((x) => x.id === s.id) === idx,
            )
            .slice(0, 20);

          return {
            currentDiagnosis: session,
            diagnosisLoading: false,
            diagnosisHistory: nextHistory,
          };
        });

        return session;
      } catch (error) {
        console.error(error);
        set({ diagnosisLoading: false });
        throw error;
      }
    },

    toggleSymptom: (symptom) => {
      set((state) => {
        if (!state.currentDiagnosis) {
          return {};
        }
        const next = new Set(state.currentDiagnosis.symptomsSelected || []);
        if (next.has(symptom)) {
          next.delete(symptom);
        } else {
          next.add(symptom);
        }
        return {
          currentDiagnosis: {
            ...state.currentDiagnosis,
            symptomsSelected: Array.from(next),
          },
        };
      });
    },

    toggleFixStepCompleted: (idx) => {
      set((state) => {
        if (!state.currentDiagnosis) {
          return {};
        }
        const steps = state.currentDiagnosis.fixSteps || [];
        const nextSteps = steps.map((s, i) => {
          if (i !== idx) {
            return s;
          }
          return { ...s, completed: !s.completed };
        });
        return {
          currentDiagnosis: {
            ...state.currentDiagnosis,
            fixSteps: nextSteps,
          },
        };
      });
    },

    toggleToolHave: (toolName) => {
      set((state) => {
        if (!state.currentDiagnosis) {
          return {};
        }
        const tools = state.currentDiagnosis.tools || [];
        const next = tools.map((t) => {
          if (t.name !== toolName) {
            return t;
          }
          return { ...t, have: !t.have };
        });
        return {
          currentDiagnosis: {
            ...state.currentDiagnosis,
            tools: next,
          },
        };
      });
    },

    setCurrentDiagnosis: (session) => {
      set({ currentDiagnosis: session });
    },

    clearDiagnosisHistory: () => {
      set({ diagnosisHistory: [] });
    },

    saveDiagnosisToMaintenance: ({ bikeId, title, notes }) => {
      const session = get().currentDiagnosis;
      if (!session) {
        throw new Error("No active diagnosis session to save");
      }

      const maintenanceItem = createMaintenanceItemFromDiagnosis({
        bikeId,
        session,
        title,
        notes,
      });

      set((state) => {
        const nextBikes = state.bikes.map((b) => {
          if (String(b.id) !== String(bikeId)) {
            return b;
          }

          const nextQuestStats = {
            ...b.questStats,
            dueSoon: (b.questStats?.dueSoon || 0) + 1,
          };

          const nextQuests = Array.isArray(b.quests)
            ? [maintenanceItem.previewQuest, ...b.quests]
            : [maintenanceItem.previewQuest];

          return {
            ...b,
            quests: nextQuests.slice(0, 4),
            questStats: nextQuestStats,
          };
        });

        const bikeDetails = state.bikeDetailsById[String(bikeId)] || {
          maintenance: { urgent: [], dueSoon: [], completed: [] },
        };
        const nextDetails = {
          ...state.bikeDetailsById,
          [String(bikeId)]: {
            ...bikeDetails,
            maintenance: {
              urgent: bikeDetails.maintenance?.urgent || [],
              dueSoon: [
                maintenanceItem.maintenanceQuest,
                ...(bikeDetails.maintenance?.dueSoon || []),
              ],
              completed: bikeDetails.maintenance?.completed || [],
            },
          },
        };

        const savedSession = {
          ...session,
          bikeId: String(bikeId),
          saveStatus: "saved",
          savedAt: new Date().toISOString(),
        };

        const nextHistory = [savedSession, ...(state.diagnosisHistory || [])]
          .filter((s, idx, arr) => arr.findIndex((x) => x.id === s.id) === idx)
          .slice(0, 20);

        return {
          bikes: nextBikes,
          bikeDetailsById: nextDetails,
          savedDiagnoses: [savedSession, ...state.savedDiagnoses],
          diagnosisHistory: nextHistory,
          currentDiagnosis: savedSession,
        };
      });

      return maintenanceItem;
    },
  };
}
