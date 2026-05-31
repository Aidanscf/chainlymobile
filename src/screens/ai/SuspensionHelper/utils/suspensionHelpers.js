export function nowIso() {
  return new Date().toISOString();
}

export function applyDeltaToSettings(settings, delta) {
  const s = settings || {};
  const next = { ...s };

  if (delta?.psiDelta) {
    const base = Number(next.psi || 0);
    const candidate = base + Number(delta.psiDelta || 0);
    next.psi = Number.isFinite(candidate) ? candidate : next.psi;
  }
  if (delta?.compressionDelta) {
    const base = Number(next.compressionClicks || 0);
    const candidate = base + Number(delta.compressionDelta || 0);
    next.compressionClicks = Number.isFinite(candidate)
      ? candidate
      : next.compressionClicks;
  }
  if (delta?.reboundDelta) {
    const base = Number(next.reboundClicks || 0);
    const candidate = base + Number(delta.reboundDelta || 0);
    next.reboundClicks = Number.isFinite(candidate)
      ? candidate
      : next.reboundClicks;
  }

  return next;
}
