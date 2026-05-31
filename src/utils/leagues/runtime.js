// Retention-First Leagues MVP runtime guardrails.
//
// Goals:
// - Central feature flag gate
// - Kill switch: if anything throws, disable leagues for THIS app session
// - Never crash the app

import { FEATURE_LEAGUES_MVP } from "@/utils/featureFlags";

let leaguesDisabledThisSession = false;
let lastDisableReason = null;

export function isLeaguesMvpFlagEnabled() {
  return !!FEATURE_LEAGUES_MVP;
}

export function isLeaguesMvpActive() {
  return !!FEATURE_LEAGUES_MVP && !leaguesDisabledThisSession;
}

export function disableLeaguesThisSession(error, source) {
  leaguesDisabledThisSession = true;
  lastDisableReason = {
    at: new Date().toISOString(),
    source: source ? String(source) : "unknown",
    message: error?.message ? String(error.message) : String(error || "error"),
  };

  try {
    console.error("[leagues-mvp] disabled for session", lastDisableReason);
  } catch (e) {
    // no-op
  }
}

export function getLeaguesDisableReason() {
  return lastDisableReason;
}

export async function guardLeaguesAsync(source, fn, fallback) {
  if (!isLeaguesMvpFlagEnabled()) {
    return fallback;
  }
  if (leaguesDisabledThisSession) {
    return fallback;
  }

  try {
    return await fn();
  } catch (e) {
    disableLeaguesThisSession(e, source);
    return fallback;
  }
}

export function guardLeagues(source, fn, fallback) {
  if (!isLeaguesMvpFlagEnabled()) {
    return fallback;
  }
  if (leaguesDisabledThisSession) {
    return fallback;
  }

  try {
    return fn();
  } catch (e) {
    disableLeaguesThisSession(e, source);
    return fallback;
  }
}
