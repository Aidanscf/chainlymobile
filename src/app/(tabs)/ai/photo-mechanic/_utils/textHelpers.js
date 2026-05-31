export function buildIssueText(issueText, selectedChips, guidedContext) {
  const t = String(issueText || "").trim();
  const chips = Array.isArray(selectedChips) ? selectedChips : [];

  const ctx =
    guidedContext && typeof guidedContext === "object" ? guidedContext : null;
  const started = Array.isArray(ctx?.started) ? ctx.started : [];
  const happens = Array.isArray(ctx?.happens) ? ctx.happens : [];
  const severity = Array.isArray(ctx?.severity) ? ctx.severity : [];
  const changes = Array.isArray(ctx?.changes) ? ctx.changes : [];

  const lines = [];
  if (chips.length) {
    lines.push(`Context tags: ${chips.join(", ")}`);
  }

  const hasGuided =
    started.length || happens.length || severity.length || changes.length;
  if (hasGuided) {
    lines.push("Additional context:");
    if (started.length) lines.push(`Issue started: ${started.join(", ")}`);
    if (happens.length) lines.push(`Happens: ${happens.join(", ")}`);
    if (severity.length) lines.push(`Severity: ${severity.join(", ")}`);
    if (changes.length) lines.push(`Recent changes: ${changes.join(", ")}`);
  }

  if (!lines.length) {
    return t;
  }

  return `${t}\n\n${lines.join("\n")}`.trim();
}

export function isNonEmptyString(x) {
  return typeof x === "string" && x.trim().length > 0;
}
