export function severityTone(severity) {
  const s = String(severity || "").toLowerCase();
  if (s === "high") return "red";
  if (s === "medium") return "orange";
  return "neutral";
}

export function confidencePct(confidence01) {
  const n = Number(confidence01);
  if (!Number.isFinite(n)) return 0;
  return Math.round(Math.max(0, Math.min(1, n)) * 100);
}
