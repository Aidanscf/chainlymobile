// Retention-First Leagues MVP - local persisted quarter state
//
// Safety rules:
// - AsyncStorage only (no schema changes)
// - Never throw (all exported fns are defensive)
// - Quarter rollover logic lives here

import AsyncStorage from "@react-native-async-storage/async-storage";

import useRidesStore from "@/store/rides";
import {
  calcCLSQ,
  getQuarterKey,
  getWeekKey,
  getNextTier,
  getPrevTier,
  getTierThreshold,
} from "@/utils/leagues/calcCLSQ";
import { guardLeaguesAsync } from "@/utils/leagues/runtime";
import { leagueEvents } from "@/utils/leagues/leagueEvents";

const STORAGE_PREFIX = "chainly_league_quarter_state_v1:";

function safeParse(str) {
  try {
    return JSON.parse(str);
  } catch (e) {
    return null;
  }
}

function safeString(x) {
  return x == null ? "" : String(x);
}

function safeObject(x) {
  return x && typeof x === "object" ? x : {};
}

function safeArray(x) {
  return Array.isArray(x) ? x : [];
}

function safeIsoNow(now) {
  try {
    const d = now instanceof Date ? now : new Date(now || Date.now());
    return d.toISOString();
  } catch (e) {
    return new Date().toISOString();
  }
}

function getDayKey(iso) {
  try {
    const d = new Date(iso);
    if (!Number.isFinite(d.getTime())) return null;
    return d.toISOString().slice(0, 10);
  } catch (e) {
    return null;
  }
}

export function getLeagueUserKeyFromUser(user) {
  // Use auth user id when available; otherwise fall back to anon.
  const id = user?.id ? safeString(user.id).trim() : "";
  return id ? id : "anon";
}

export function getLeagueStorageKey(userKey) {
  return `${STORAGE_PREFIX}${safeString(userKey || "anon")}`;
}

export function getDefaultLeagueQuarterState({ quarterKey, nowIso }) {
  return {
    quarter_key: safeString(quarterKey || getQuarterKey(new Date())),
    rides: [],
    engagement_events: {},
    maintenance_events: {},
    // share state nested so calcShareBonusQuarter has a single param
    share_state: {
      share_events: {},
      share_week_key_counts: {},
    },
    last_quarter_cls: 0,
    current_tier: "Bronze",
    last_rollover_iso: nowIso || safeIsoNow(),
    // internal bookkeeping (still safe to persist)
    last_checked_day: null,
  };
}

function normalizeLeagueState(raw, now) {
  const nowIso = safeIsoNow(now);
  const fallback = getDefaultLeagueQuarterState({ nowIso });
  const obj = raw && typeof raw === "object" ? raw : {};

  const quarterKey = safeString(obj.quarter_key) || fallback.quarter_key;

  const rides = safeArray(obj.rides)
    .map((r) => {
      const startIso = safeString(r?.start_iso);
      const durationMin = Number(r?.duration_min);
      const elevationM = r?.elevation_m;
      if (!startIso) return null;
      if (!Number.isFinite(new Date(startIso).getTime())) return null;
      return {
        start_iso: startIso,
        duration_min: Number.isFinite(durationMin) ? durationMin : 0,
        // elevation_m may exist but MUST NOT be used by scoring
        elevation_m: elevationM == null ? undefined : elevationM,
      };
    })
    .filter(Boolean)
    .slice(0, 400);

  const engagement = safeObject(obj.engagement_events);
  const maintenance = safeObject(obj.maintenance_events);

  const shareState = safeObject(obj.share_state);
  const shareEvents = safeObject(shareState.share_events);
  const shareWeekCounts = safeObject(shareState.share_week_key_counts);

  const lastQuarter = Number(obj.last_quarter_cls);
  const currentTier = safeString(obj.current_tier) || "Bronze";
  const lastRolloverIso = safeString(obj.last_rollover_iso) || nowIso;

  return {
    quarter_key: quarterKey,
    rides,
    engagement_events: engagement,
    maintenance_events: maintenance,
    share_state: {
      share_events: shareEvents,
      share_week_key_counts: shareWeekCounts,
    },
    last_quarter_cls: Number.isFinite(lastQuarter) ? lastQuarter : 0,
    current_tier: currentTier,
    last_rollover_iso: lastRolloverIso,
    last_checked_day: obj.last_checked_day || null,
  };
}

export async function loadLeagueQuarterState(userKey) {
  return await guardLeaguesAsync(
    "loadLeagueQuarterState",
    async () => {
      const key = getLeagueStorageKey(userKey);
      const raw = await AsyncStorage.getItem(key);
      if (!raw) {
        return getDefaultLeagueQuarterState({ nowIso: safeIsoNow() });
      }

      const parsed = safeParse(raw);
      return normalizeLeagueState(parsed, new Date());
    },
    getDefaultLeagueQuarterState({ nowIso: safeIsoNow() }),
  );
}

export async function saveLeagueQuarterState(userKey, state) {
  return await guardLeaguesAsync(
    "saveLeagueQuarterState",
    async () => {
      const key = getLeagueStorageKey(userKey);
      const normalized = normalizeLeagueState(state, new Date());
      await AsyncStorage.setItem(key, JSON.stringify(normalized));
      return normalized;
    },
    null,
  );
}

function isSameDay(isoA, isoB) {
  const a = getDayKey(isoA);
  const b = getDayKey(isoB);
  return !!a && !!b && a === b;
}

function dedupeRides(rides) {
  try {
    const list = safeArray(rides);
    const seen = new Set();
    const out = [];

    for (const r of list) {
      const startIso = safeString(r?.start_iso);
      const durationMin = Number(r?.duration_min);
      const key = `${startIso}|${Number.isFinite(durationMin) ? durationMin : 0}`;
      if (!startIso) continue;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({
        start_iso: startIso,
        duration_min: Number.isFinite(durationMin) ? durationMin : 0,
        elevation_m: r?.elevation_m,
      });
    }

    // Keep newest-ish first (by start time)
    out.sort((a, b) => {
      const ta = new Date(a.start_iso).getTime();
      const tb = new Date(b.start_iso).getTime();
      return tb - ta;
    });

    return out.slice(0, 400);
  } catch (e) {
    return safeArray(rides).slice(0, 400);
  }
}

function ridesSignature(rides) {
  try {
    const list = safeArray(rides);
    // Only sample first 50 for speed.
    return list
      .slice(0, 50)
      .map((r) => `${safeString(r?.start_iso)}|${Number(r?.duration_min) || 0}`)
      .join(";");
  } catch (e) {
    return "";
  }
}

function syncRidesFromLocalStore(state, quarterKey) {
  // Best-effort, local-only ingestion from the existing rides store.
  // This must never throw.
  try {
    const ridesStore = useRidesStore.getState?.();
    const rides = safeArray(ridesStore?.rides);

    if (!rides.length) {
      return state;
    }

    const nextRides = [...safeArray(state?.rides)];

    for (const r of rides) {
      const startIso = safeString(r?.ride_at || r?.created_at);
      if (!startIso) continue;

      const d = new Date(startIso);
      if (!Number.isFinite(d.getTime())) continue;

      const qk = getQuarterKey(d);
      if (qk !== quarterKey) continue;

      const durationMin = Number(r?.duration_min);

      nextRides.push({
        start_iso: startIso,
        duration_min: Number.isFinite(durationMin) ? durationMin : 0,
        // Preserve elevation for backwards compat only (never used)
        elevation_m:
          r?.elevation_gain ?? r?.elevation_gain_m ?? r?.elevationGainM,
      });
    }

    return {
      ...state,
      rides: dedupeRides(nextRides),
    };
  } catch (e) {
    return state;
  }
}

export async function ensureLeagueQuarterCurrent(userKey, now) {
  return await guardLeaguesAsync(
    "ensureLeagueQuarterCurrent",
    async () => {
      const nowIso = safeIsoNow(now);
      const today = getDayKey(nowIso);
      const currentQuarterKey = getQuarterKey(now || new Date());

      const existing = await loadLeagueQuarterState(userKey);
      const state = normalizeLeagueState(existing, now || new Date());

      // Once-per-day guard (still allows quarter rollover instantly).
      if (today && state.last_checked_day && state.last_checked_day === today) {
        // Still sync rides from the store (best-effort, fast).
        const synced = syncRidesFromLocalStore(state, currentQuarterKey);

        const ridesChanged =
          ridesSignature(synced?.rides) !== ridesSignature(state?.rides);

        if (synced?.quarter_key !== state?.quarter_key || ridesChanged) {
          const saved = await saveLeagueQuarterState(userKey, {
            ...synced,
            last_checked_day: today,
          });

          // Emit only when we actually pulled in new rides during the day.
          if (ridesChanged) {
            try {
              leagueEvents.emitUpdated();
            } catch (e) {
              // no-op
            }
          }

          return saved || synced;
        }
        return state;
      }

      // Quarter rollover
      if (safeString(state.quarter_key) !== safeString(currentQuarterKey)) {
        const lastQuarterCls = calcCLSQ(state);
        const inactive = safeArray(state.rides).length === 0;

        const currentTier = safeString(state.current_tier) || "Bronze";
        const nextTier = getNextTier(currentTier);
        const prevTier = getPrevTier(currentTier);

        let updatedTier = currentTier;

        const nextThreshold = nextTier ? getTierThreshold(nextTier) : null;
        if (nextThreshold != null && lastQuarterCls >= nextThreshold) {
          updatedTier = nextTier;
        } else {
          const currentThreshold = getTierThreshold(currentTier);
          const sixtyPct = Math.floor(currentThreshold * 0.6);

          if (
            inactive &&
            prevTier &&
            lastQuarterCls < sixtyPct &&
            currentTier !== "Bronze"
          ) {
            updatedTier = prevTier;
          }
        }

        const reset = getDefaultLeagueQuarterState({
          quarterKey: currentQuarterKey,
          nowIso,
        });

        const rolled = {
          ...reset,
          current_tier: updatedTier,
          last_quarter_cls: Math.floor(lastQuarterCls || 0),
          last_rollover_iso: nowIso,
          last_checked_day: today,
        };

        // Also sync rides for the new quarter (if any already exist in store)
        const synced = syncRidesFromLocalStore(rolled, currentQuarterKey);
        const saved = await saveLeagueQuarterState(userKey, synced);

        // Emit on rollover so any open league UIs refresh instantly.
        try {
          leagueEvents.emitUpdated();
        } catch (e) {
          // no-op
        }

        return saved || synced;
      }

      // Same quarter: just sync rides and mark checked.
      const synced = syncRidesFromLocalStore(state, currentQuarterKey);
      const merged = {
        ...synced,
        last_checked_day: today,
      };

      const saved = await saveLeagueQuarterState(userKey, merged);
      return saved || merged;
    },
    null,
  );
}

export async function mutateLeagueQuarterState(userKey, mutator, now) {
  return await guardLeaguesAsync(
    "mutateLeagueQuarterState",
    async () => {
      const current = await ensureLeagueQuarterCurrent(userKey, now);
      const base =
        current || getDefaultLeagueQuarterState({ nowIso: safeIsoNow(now) });

      let next = base;
      try {
        const res = mutator?.(base);
        next = res && typeof res === "object" ? res : base;
      } catch (e) {
        // If the mutator itself throws, do not crash the app.
        next = base;
      }

      const saved = await saveLeagueQuarterState(userKey, next);

      // Emit after explicit mutations only (avoid loops during ensureLeagueQuarterCurrent refetches).
      try {
        leagueEvents.emitUpdated();
      } catch (e) {
        // no-op
      }

      return saved || next;
    },
    null,
  );
}

export async function addLeagueRide(userKey, ride, now) {
  return await mutateLeagueQuarterState(
    userKey,
    (state) => {
      const startIso = safeString(ride?.start_iso);
      const durationMin = Number(ride?.duration_min);

      if (!startIso) return state;
      const t = new Date(startIso).getTime();
      if (!Number.isFinite(t)) return state;

      const next = {
        ...state,
        rides: dedupeRides([
          {
            start_iso: startIso,
            duration_min: Number.isFinite(durationMin) ? durationMin : 0,
            elevation_m: ride?.elevation_m,
          },
          ...safeArray(state.rides),
        ]),
      };

      return next;
    },
    now,
  );
}

export function incrementMapCounter(map, key, inc = 1) {
  const m = safeObject(map);
  const k = safeString(key);
  if (!k) return m;
  const cur = Number(m[k]);
  const nextVal =
    (Number.isFinite(cur) ? cur : 0) + (Number.isFinite(inc) ? inc : 1);
  return {
    ...m,
    [k]: Math.max(0, Math.min(9999, nextVal)),
  };
}

export function trackShareWithWeeklyCap({ state, shareType, nowDate }) {
  const sType = safeString(shareType);
  if (!sType) return state;

  const now = nowDate || new Date();
  const weekKey = getWeekKey(now);

  const shareState = safeObject(state?.share_state);
  const weekCounts = safeObject(shareState.share_week_key_counts);
  const currentWeekCount = Number(weekCounts?.[weekKey]);
  const weekCount = Number.isFinite(currentWeekCount) ? currentWeekCount : 0;

  if (weekCount >= 3) {
    return state;
  }

  const nextWeekCounts = {
    ...weekCounts,
    [weekKey]: weekCount + 1,
  };

  const shareEvents = safeObject(shareState.share_events);
  const currentTypeCount = Number(shareEvents?.[sType]);
  const typeCount = Number.isFinite(currentTypeCount) ? currentTypeCount : 0;

  return {
    ...state,
    share_state: {
      ...shareState,
      share_week_key_counts: nextWeekCounts,
      share_events: {
        ...shareEvents,
        [sType]: Math.max(0, Math.min(9999, typeCount + 1)),
      },
    },
  };
}

export async function resetLeagueQuarterState(userKey, now) {
  return await guardLeaguesAsync(
    "resetLeagueQuarterState",
    async () => {
      const state = getDefaultLeagueQuarterState({
        quarterKey: getQuarterKey(now || new Date()),
        nowIso: safeIsoNow(now),
      });
      const saved = await saveLeagueQuarterState(userKey, state);

      try {
        leagueEvents.emitUpdated();
      } catch (e) {
        // no-op
      }

      return saved || state;
    },
    null,
  );
}
