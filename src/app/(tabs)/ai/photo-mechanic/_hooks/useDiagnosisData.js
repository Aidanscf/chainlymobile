import { useMemo } from "react";
import { isNonEmptyString } from "../_utils/textHelpers";

function confidence01(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0.7;
  return n > 1 ? n / 100 : n;
}

export function useDiagnosisData(diagnosis) {
  const safetyAlertText = useMemo(() => {
    const fromPlan = diagnosis?.fix_plan?.safety_alert;
    if (isNonEmptyString(fromPlan)) return String(fromPlan).trim();
    const warnings = Array.isArray(diagnosis?.warnings) ? diagnosis.warnings : [];
    if (isNonEmptyString(warnings[0])) return String(warnings[0]).trim();
    if (isNonEmptyString(diagnosis?.see_shop_if)) {
      return String(diagnosis.see_shop_if).trim();
    }
    return null;
  }, [diagnosis]);

  const candidates = useMemo(() => {
    const list = diagnosis?.likely_issue_candidates;
    if (Array.isArray(list) && list.length) return list;
    if (!diagnosis?.diagnosisTitle && !diagnosis?.summary) return [];

    const score = confidence01(diagnosis?.confidence);
    const causes = Array.isArray(diagnosis?.likely_causes)
      ? diagnosis.likely_causes.filter(isNonEmptyString)
      : [];
    const area = isNonEmptyString(diagnosis?.system_area)
      ? `System: ${diagnosis.system_area}`
      : null;

    return [
      {
        issue: diagnosis.diagnosisTitle || "Likely issue",
        confidence: score,
        severity: score >= 0.75 ? "high" : score >= 0.5 ? "medium" : "low",
        evidence: [diagnosis.summary, area].filter(isNonEmptyString),
        quick_checks: causes,
      },
    ];
  }, [diagnosis]);

  const fixPlan = useMemo(() => {
    const fp = diagnosis?.fix_plan;
    const planSteps = Array.isArray(fp?.steps) ? fp.steps : [];
    if (fp && typeof fp === "object" && (isNonEmptyString(fp.summary) || planSteps.length)) {
      return fp;
    }

    const steps = Array.isArray(diagnosis?.fixSteps)
      ? diagnosis.fixSteps.filter(isNonEmptyString)
      : [];
    const summary = isNonEmptyString(diagnosis?.summary) ? diagnosis.summary : "";
    if (!summary && !steps.length) return null;

    const warnings = Array.isArray(diagnosis?.warnings) ? diagnosis.warnings : [];
    return {
      summary,
      steps,
      avoid: warnings.slice(1).filter(isNonEmptyString),
    };
  }, [diagnosis]);

  const resources = useMemo(() => {
    const list = diagnosis?.resources;
    return Array.isArray(list) ? list : [];
  }, [diagnosis?.resources]);

  return {
    safetyAlertText,
    candidates,
    fixPlan,
    resources,
  };
}
