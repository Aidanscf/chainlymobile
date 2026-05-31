// Simple app-level feature flags.
//
// NOTE: The platform can also power feature flags via env vars,
// but this project currently doesn't expose a safe env var for this toggle.
//
// Flip this to `true` when user accounts are configured for this project.
export const ACCOUNTS_ENABLED = true;

// Server persistence + scoped queries (safe incremental rollout).
//
// Rules:
// - If false -> behave exactly as local-only (no server calls for bikes/rides/presets/profile)
// - If true  -> sync is enabled ONLY when authenticated
export const SERVER_SYNC_ENABLED = true;

// ---------------------------------------------------------------------------
// Retention-First Leagues MVP
//
// Non-negotiable safety: this controls visibility + tracking for Leagues MVP.
// When false: there should be NO behavior changes in the app.
export const FEATURE_LEAGUES_MVP = true;

// Debug tooling for leagues (hidden route). Keep OFF by default.
export const FEATURE_LEAGUES_MVP_DEBUG = false;

// ---------------------------------------------------------------------------
// Trip Planner (temporary hide)
//
// To re-enable Trip Planner:
// Set FEATURE_TRIP_PLANNER_ENABLED = true
export const FEATURE_TRIP_PLANNER_ENABLED = false;
