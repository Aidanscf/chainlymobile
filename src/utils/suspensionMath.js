// Simple suspension baseline math (MVP)
// Goal: confident starting point, not an engineering calculator.

function clamp(n, min, max) {
  const x = Number.isFinite(Number(n)) ? Number(n) : 0;
  return Math.min(max, Math.max(min, x));
}

function round(n, step) {
  const s = Number(step || 1);
  const x = Number.isFinite(Number(n)) ? Number(n) : 0;
  return Math.round(x / s) * s;
}

export function lbsToKg(lbs) {
  return Number(lbs) * 0.45359237;
}

export function kgToLbs(kg) {
  return Number(kg) / 0.45359237;
}

export function normalizeWeightKg({ value, unit }) {
  const v = Number(value);
  if (!Number.isFinite(v) || v <= 0) {
    return null;
  }
  if (unit === "lbs") {
    return lbsToKg(v);
  }
  return v;
}

export function getSagTargets({ style }) {
  const s = String(style || "trail").toLowerCase();

  // Fork target in percent
  const fork =
    s === "xc" ? 18 : s === "bike park" ? 22 : s === "enduro" ? 21 : 20;

  // Shock target in percent
  const shock =
    s === "xc" ? 26 : s === "bike park" ? 32 : s === "enduro" ? 30 : 28;

  return {
    forkPct: fork,
    shockPct: shock,
  };
}

function styleFactor(style) {
  const s = String(style || "trail").toLowerCase();
  if (s === "xc") return 0.95;
  if (s === "enduro") return 1.05;
  if (s === "bike park") return 1.1;
  return 1.0; // trail
}

export function computeBaselineForComponent({
  component,
  weightKg,
  style,
  terrainBias,
  skillLevel,
}) {
  if (!component) {
    return null;
  }

  const weight = Number(weightKg);
  const weightSafe = Number.isFinite(weight) ? weight : 72;

  const bias = Array.isArray(terrainBias) ? terrainBias : [];
  const wantsJumps = bias.includes("jumps");
  const wantsTech = bias.includes("tech");
  const wantsFlow = bias.includes("flow");

  const sagTargets = getSagTargets({ style });
  const sagTarget =
    component.type === "fork" ? sagTargets.forkPct : sagTargets.shockPct;

  // --- PSI baseline (air) ---
  let psi = null;
  let springRate = null;

  if (component.airOrCoil === "air") {
    const baseFactor = component.type === "fork" ? 1.1 : 1.65;

    const sFactor = styleFactor(style);
    const terrainBoost = wantsJumps ? 1.06 : wantsTech ? 1.03 : 1.0;

    // Gentle skill tweak: beginners get a touch more support, advanced slightly softer start.
    const level = String(skillLevel || "intermediate").toLowerCase();
    const skillFactor =
      level === "beginner" ? 1.03 : level === "advanced" ? 0.98 : 1.0;

    const rawPsi =
      weightSafe * baseFactor * sFactor * terrainBoost * skillFactor;
    const maxPsi = Number(component.maxPsi || 999);
    psi = clamp(round(rawPsi, 2), 40, Math.max(60, maxPsi * 0.95));
  } else {
    // Coil: give a spring-rate hint only (very rough)
    // (Riders still need to confirm with manufacturer / shop.)
    const rawRate = weightSafe * (component.type === "shock" ? 4.2 : 0);
    springRate = round(rawRate, 25);
  }

  // --- Clicks baseline (mid-range, adjusted for vibe) ---
  const r = component.clickRanges?.rebound || { min: 0, max: 16 };
  const c = component.clickRanges?.compression || { min: 0, max: 12 };

  const rMid = Math.round((r.min + r.max) / 2);
  const cMid = Math.round((c.min + c.max) / 2);

  // Flow = a bit more open comp; Tech = a bit slower rebound.
  let rebound = rMid + (wantsTech ? -1 : 0) + (wantsFlow ? 1 : 0);
  let compression = cMid + (wantsJumps ? 2 : 0) + (wantsFlow ? -1 : 0);

  rebound = clamp(rebound, r.min, r.max);
  compression = clamp(compression, c.min, c.max);

  // Tokens: simple starter recommendation
  let tokens = null;
  if (component.supportsTokens) {
    const base = wantsJumps
      ? 2
      : String(style || "").toLowerCase() === "bike park"
        ? 2
        : 1;
    tokens = clamp(base, 0, 5);
  }

  return {
    sagTargetPct: sagTarget,
    psi,
    springRate,
    reboundClicks: rebound,
    compressionClicks: compression,
    tokens,
  };
}

export function applyAdjustmentToSettings({ settings, component, adjustment }) {
  if (!settings || !component || !adjustment) {
    return settings;
  }

  const next = { ...settings };
  const kind = adjustment.kind;
  const delta = Number(adjustment.delta || 0);

  if (kind === "psi" && Number.isFinite(next.psi)) {
    const maxPsi = Number(component.maxPsi || 999);
    next.psi = clamp(
      round(Number(next.psi) + delta, 1),
      30,
      Math.max(40, maxPsi * 0.98),
    );
  }

  if (kind === "rebound") {
    const r = component.clickRanges?.rebound || { min: 0, max: 16 };
    next.reboundClicks = clamp(
      Number(next.reboundClicks) + delta,
      r.min,
      r.max,
    );
  }

  if (kind === "compression") {
    const c = component.clickRanges?.compression || { min: 0, max: 12 };
    next.compressionClicks = clamp(
      Number(next.compressionClicks) + delta,
      c.min,
      c.max,
    );
  }

  if (kind === "tokens" && component.supportsTokens) {
    next.tokens = clamp(Number(next.tokens || 0) + delta, 0, 6);
  }

  return next;
}
