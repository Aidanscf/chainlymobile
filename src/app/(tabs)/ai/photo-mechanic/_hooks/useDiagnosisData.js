import { useMemo } from "react";
import { isNonEmptyString } from "../_utils/textHelpers";

export function useDiagnosisData(diagnosis) {
  const safetyAlertText = useMemo(() => {
    const t = diagnosis?.fix_plan?.safety_alert;
    return isNonEmptyString(t) ? String(t).trim() : null;
  }, [diagnosis?.fix_plan?.safety_alert]);

  const candidates = useMemo(() => {
    const list = diagnosis?.likely_issue_candidates;
    return Array.isArray(list) ? list : [];
  }, [diagnosis?.likely_issue_candidates]);

  const fixPlan = useMemo(() => {
    const fp = diagnosis?.fix_plan;
    return fp && typeof fp === "object" ? fp : null;
  }, [diagnosis?.fix_plan]);

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
