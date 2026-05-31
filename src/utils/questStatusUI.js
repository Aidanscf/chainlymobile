import { colors } from "@/theme/index";

// UI-only mapping for Maintenance Quest statuses.
// IMPORTANT: This does not change any quest logic; it only maps existing statuses to colors/labels.
// Canonical statuses in the app today are: "due", "due_soon", "ok".

export function normalizeQuestStatus(status) {
  const s = String(status || "").toLowerCase();
  if (s === "due") return "DUE";
  if (s === "due_soon" || s === "duesoon") return "DUE_SOON";
  if (s === "done") return "DONE";
  return "OK";
}

export function getQuestStatusUI(status) {
  const s = normalizeQuestStatus(status);

  if (s === "DUE") {
    return {
      status: "DUE",
      label: "Urgent",
      bg: colors.dangerLight,
      border: colors.dangerLight,
      fg: colors.danger,
    };
  }

  if (s === "DUE_SOON") {
    return {
      status: "DUE_SOON",
      label: "Due Soon",
      bg: colors.warningSoft,
      border: colors.warningSoft,
      fg: colors.warning,
    };
  }

  if (s === "DONE") {
    return {
      status: "DONE",
      label: "Done",
      bg: colors.successSoft,
      border: colors.successSoft,
      fg: colors.success,
    };
  }

  return {
    status: "OK",
    label: "OK",
    bg: colors.successSoft,
    border: colors.successSoft,
    fg: colors.success,
  };
}
