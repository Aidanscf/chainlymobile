import {
  createDiagnosisFromImage,
  createMaintenanceItemFromDiagnosis,
} from "@/utils/ai/photoMechanic";
import { startAIJob, waitForAIJob } from "@/services/aiJobClient";
import { apiFetch } from "@/services/apiClient";
import { isServerSyncActive } from "@/utils/serverSync";
import AsyncStorage from "@react-native-async-storage/async-storage";

const HISTORY_KEY = "chainly_mechanic_chats_v1";

const CATEGORY_BY_AREA = {
  brakes: "brakes",
  suspension: "suspension",
  tires: "tires",
  wheels: "tires",
  drivetrain: "drivetrain",
  frame: "frame",
};

function chatBody(diagnosis) {
  const body = {
    diagnosisTitle: diagnosis.diagnosisTitle || "",
    summary: diagnosis.summary || "",
    confidence: diagnosis.confidence,
    system_area: diagnosis.system_area ?? null,
    warnings: Array.isArray(diagnosis.warnings) ? diagnosis.warnings : [],
    fixSteps: Array.isArray(diagnosis.fixSteps) ? diagnosis.fixSteps : [],
    imageUri: diagnosis.imageUri ?? null,
    bikeId: diagnosis.bikeId ?? null,
    symptomsSelected: Array.isArray(diagnosis.symptomsSelected)
      ? diagnosis.symptomsSelected
      : [],
    parts: Array.isArray(diagnosis.parts) ? diagnosis.parts : [],
    tools: Array.isArray(diagnosis.tools) ? diagnosis.tools : [],
    guides: Array.isArray(diagnosis.guides) ? diagnosis.guides : [],
    saveStatus: diagnosis.saveStatus || "not_saved",
  };
  if (diagnosis.detectedCategory) body.detectedCategory = diagnosis.detectedCategory;
  if (diagnosis.createdAt) body.createdAt = diagnosis.createdAt;
  if (diagnosis.serverChatId) body.id = String(diagnosis.serverChatId);
  return body;
}

function replaceChat(set, tempId, chat) {
  set((state) => {
    const rest = (state.diagnosisHistory || []).filter(
      (item) => item.id !== tempId && item.id !== chat.id,
    );
    const nextHistory = [chat, ...rest].slice(0, 20);
    persistHistory(nextHistory);
    const current = state.currentDiagnosis;
    const nextCurrent =
      current && (current.id === tempId || current.id === chat.id)
        ? chat
        : current;
    return {
      diagnosisHistory: nextHistory,
      currentDiagnosis: nextCurrent,
    };
  });
}
function persistHistory(list) {
  AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(list || [])).catch((e) => {
    console.error(e);
  });
}

function toChatSession(diagnosis) {
  if (!diagnosis || typeof diagnosis !== "object") return null;
  const title = String(diagnosis.diagnosisTitle || "").trim();
  const summary = String(diagnosis.summary || "").trim();
  if (!title && !summary) return null;

  const raw = Number(diagnosis.confidence);
  const confidence = Number.isFinite(raw)
    ? Math.round(raw > 1 ? raw : raw * 100)
    : 0;
  const area = String(diagnosis.system_area || "").toLowerCase();
  const steps = Array.isArray(diagnosis.fixSteps) ? diagnosis.fixSteps : [];

  return {
    id: String(diagnosis.id || Date.now()),
    createdAt: diagnosis.createdAt || new Date().toISOString(),
    imageUri: diagnosis.imageUri || null,
    bikeId: diagnosis.bikeId || null,
    detectedCategory: CATEGORY_BY_AREA[area] || "other",
    confidence,
    symptomsSelected: [],
    summary,
    warnings: Array.isArray(diagnosis.warnings) ? diagnosis.warnings : [],
    fixSteps: steps.map((step) =>
      typeof step === "string"
        ? {
            title: step,
            detail: "",
            completed: false,
            safetyLevel: "low",
            estimatedTimeMin: 5,
          }
        : step,
    ),
    parts: Array.isArray(diagnosis.parts) ? diagnosis.parts : [],
    tools: Array.isArray(diagnosis.tools) ? diagnosis.tools : [],
    guides: Array.isArray(diagnosis.guides) ? diagnosis.guides : [],
    saveStatus: "not_saved",
    diagnosisTitle: title || "AI Bike Helper",
  };
}

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

          persistHistory(nextHistory);

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
      persistHistory([]);
      if (!isServerSyncActive()) return;
      apiFetch("/api/ai/mechanic/chats", { method: "DELETE" }).catch((e) => {
        console.error(e);
      });
    },

    hydrateDiagnosisHistory: async () => {
      try {
        const raw = await AsyncStorage.getItem(HISTORY_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        if (Array.isArray(parsed) && parsed.length) {
          set({ diagnosisHistory: parsed });
        }
      } catch (e) {
        console.error(e);
      }

      if (!isServerSyncActive()) return;
      try {
        const res = await apiFetch("/api/ai/mechanic/chats", { method: "GET" });
        const chats = Array.isArray(res?.chats) ? res.chats.slice(0, 20) : [];
        set({ diagnosisHistory: chats });
        persistHistory(chats);
      } catch (e) {
        console.error(e);
      }
    },

    recordMechanicChat: async (diagnosis) => {
      const session = toChatSession(diagnosis);
      if (!session) return null;

      set((state) => {
        const nextHistory = [session, ...(state.diagnosisHistory || [])]
          .filter((item, idx, arr) => arr.findIndex((x) => x.id === item.id) === idx)
          .slice(0, 20);
        persistHistory(nextHistory);
        return {
          diagnosisHistory: nextHistory,
          currentDiagnosis: session,
        };
      });

      if (!isServerSyncActive()) return session;

      try {
        const res = await apiFetch("/api/ai/mechanic/chats", {
          method: "POST",
          body: JSON.stringify(chatBody(diagnosis)),
        });
        const saved = res?.chat;
        if (saved?.id) {
          replaceChat(set, session.id, saved);
          return saved;
        }
      } catch (e) {
        console.error(e);
      }
      return session;
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

        persistHistory(nextHistory);

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
