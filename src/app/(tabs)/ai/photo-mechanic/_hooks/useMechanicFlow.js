import { useState, useMemo, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiFetch } from "@/services/apiClient";
import { buildIssueText } from "../_utils/textHelpers";

export function useMechanicFlow(bikeProfile) {
  const [step, setStep] = useState("describe"); // describe | questions | results
  const [issueText, setIssueText] = useState("");
  const [selectedChips, setSelectedChips] = useState([]);

  // NEW: optional guided quick context (all multi-select)
  const [guidedContext, setGuidedContext] = useState({
    started: [],
    happens: [],
    severity: [],
    changes: [],
  });

  const [triage, setTriage] = useState(null);
  const [answers, setAnswers] = useState({});
  const [diagnosis, setDiagnosis] = useState(null);
  const [uiError, setUiError] = useState(null);

  const triageMutation = useMutation({
    mutationFn: async ({ issue_text }) => {
      return await apiFetch("/api/ai/mechanic/triage", {
        method: "POST",
        body: JSON.stringify({ issue_text, bike_profile: bikeProfile }),
      });
    },
    onSuccess: (data) => {
      const t = data?.triage || null;
      setTriage(t);
      setAnswers({});

      const followUps = Array.isArray(t?.follow_up_questions)
        ? t.follow_up_questions
        : [];
      const needsFollowUps = !!t?.follow_up_questions_needed;

      if (needsFollowUps && followUps.length) {
        setStep("questions");
        return;
      }

      // If triage didn't give follow-ups, fall back to diagnose immediately.
      const combined = buildIssueText(issueText, selectedChips, guidedContext);
      diagnoseMutation.mutate({
        issue_text: combined,
        answers: {},
      });
    },
    onError: (error) => {
      console.error(error);
      setUiError("Couldn't run triage. Please try again.");
    },
  });

  const diagnoseMutation = useMutation({
    mutationFn: async ({ issue_text, answers: answersMap }) => {
      return await apiFetch("/api/ai/mechanic/diagnose", {
        method: "POST",
        body: JSON.stringify({
          issue_text,
          answers: answersMap || {},
          bike_profile: bikeProfile,
        }),
      });
    },
    onSuccess: (data) => {
      setDiagnosis(data?.diagnosis || null);
      setStep("results");
    },
    onError: (error) => {
      console.error(error);
      setUiError("Couldn't get a diagnosis. Please try again.");
    },
  });

  const triageBusy = !!(triageMutation.isPending || triageMutation.isLoading);
  const diagnoseBusy = !!(
    diagnoseMutation.isPending || diagnoseMutation.isLoading
  );

  const loadingPhase = triageBusy ? "triage" : diagnoseBusy ? "diagnose" : null;

  const isLoading = !!loadingPhase;

  const canGoNext = useMemo(() => {
    const t = String(issueText || "").trim();
    return t.length >= 8;
  }, [issueText]);

  const followUps = useMemo(() => {
    const list = triage?.follow_up_questions;
    return Array.isArray(list) ? list : [];
  }, [triage]);

  const onToggleChip = useCallback((label) => {
    setSelectedChips((prev) => {
      const set = new Set(prev);
      if (set.has(label)) {
        set.delete(label);
      } else {
        set.add(label);
      }
      return Array.from(set);
    });
  }, []);

  const onToggleGuidedContext = useCallback((groupKey, label) => {
    if (!groupKey || !label) {
      return;
    }

    setGuidedContext((prev) => {
      const current = prev && typeof prev === "object" ? prev : {};
      const list = Array.isArray(current[groupKey]) ? current[groupKey] : [];
      const set = new Set(list);

      if (set.has(label)) {
        set.delete(label);
      } else {
        set.add(label);
      }

      return {
        ...current,
        [groupKey]: Array.from(set),
      };
    });
  }, []);

  const onNext = useCallback(() => {
    if (!canGoNext || isLoading) {
      return;
    }

    setUiError(null);
    setTriage(null);
    setDiagnosis(null);

    const combined = buildIssueText(issueText, selectedChips, guidedContext);

    triageMutation.mutate({
      issue_text: combined,
    });
  }, [
    canGoNext,
    isLoading,
    issueText,
    selectedChips,
    guidedContext,
    triageMutation,
  ]);

  const onSetAnswer = useCallback((id, value) => {
    if (!id) {
      return;
    }
    setAnswers((prev) => ({ ...prev, [id]: value }));
  }, []);

  const onGetDiagnosis = useCallback(() => {
    if (isLoading) {
      return;
    }

    setUiError(null);

    const combined = buildIssueText(issueText, selectedChips, guidedContext);

    diagnoseMutation.mutate({
      issue_text: combined,
      answers,
    });
  }, [
    answers,
    diagnoseMutation,
    isLoading,
    issueText,
    selectedChips,
    guidedContext,
  ]);

  const onStartOver = useCallback(() => {
    setUiError(null);
    setTriage(null);
    setDiagnosis(null);
    setAnswers({});
    setGuidedContext({ started: [], happens: [], severity: [], changes: [] });
    setSelectedChips([]);
    setIssueText("");
    setStep("describe");
  }, []);

  return {
    step,
    issueText,
    setIssueText,
    selectedChips,
    guidedContext,
    triage,
    answers,
    diagnosis,
    uiError,
    isLoading,
    loadingPhase,
    canGoNext,
    followUps,
    onToggleChip,
    onToggleGuidedContext,
    onNext,
    onSetAnswer,
    onGetDiagnosis,
    onStartOver,
  };
}
