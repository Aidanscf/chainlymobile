// Retention-First Leagues MVP (CLS-Q)
// Pure, defensive scoring helpers.
// NOTE: All functions in this file must be PURE and must never throw.

const TIERS = [
  "Bronze",
  "Silver",
  "Gold",
  "Platinum",
  "Diamond",
  "Master",
  "Legend",
];

const TIER_THRESHOLDS = {
  Bronze: 6000,
  Silver: 8000,
  Gold: 10000,
  Platinum: 11500,
  Diamond: 13000,
  Master: 14500,
  Legend: 16000,
};

const CAPS = {
  ride: 7200,
  engagement: 3600,
  bikeCare: 2400,
  share: 900,
  consistency: 2700,
};

const ENGAGEMENT_POINTS = {
  upload_bike_photo: 50,
  ai_diagnostics: 100,
  view_fix_guide: 40,
  save_gear_recommendation: 40,
  use_suspension_helper: 60,
  analyze_ride: 80,
};

const MAINTENANCE_POINTS = {
  chain_check: 80,
  brake_check: 80,
  suspension_service_log: 120,
  drivetrain_clean_log: 60,
};

const SHARE_POINTS = {
  profile_card_share: 80,
  league_progress_share: 40,
};

function safeNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function clamp(n, min, max) {
  const x = safeNumber(n);
  if (x < min) return min;
  if (x > max) return max;
  return x;
}

function safeDate(input) {
  try {
    if (!input) return null;
    if (input instanceof Date) {
      const t = input.getTime();
      return Number.isFinite(t) ? input : null;
    }
    const d = new Date(input);
    const t = d.getTime();
    return Number.isFinite(t) ? d : null;
  } catch (e) {
    return null;
  }
}

export function getQuarterKey(dateInput) {
  try {
    const d = safeDate(dateInput);
    if (!d) return "1970-Q1";

    const year = d.getFullYear();
    const month = d.getMonth(); // 0-based
    const q = month <= 2 ? 1 : month <= 5 ? 2 : month <= 8 ? 3 : 4;
    return `${year}-Q${q}`;
  } catch (e) {
    return "1970-Q1";
  }
}

function getISOWeekYearAndNumber(date) {
  // Defensive ISO week calc.
  // Reference approach: shift to Thursday, then week 1 contains Jan 4.
  try {
    const d = safeDate(date);
    if (!d) return { year: 1970, week: 1 };

    const utc = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const day = utc.getUTCDay() || 7; // 1..7
    utc.setUTCDate(utc.getUTCDate() + 4 - day);

    const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1));
    const diffDays = Math.floor((utc - yearStart) / 86400000);
    const week = Math.ceil((diffDays + 1) / 7);

    return {
      year: utc.getUTCFullYear(),
      week: clamp(week, 1, 53),
    };
  } catch (e) {
    return { year: 1970, week: 1 };
  }
}

export function getWeekKey(dateInput) {
  try {
    const d = safeDate(dateInput);
    if (!d) return "1970-W01";

    const { year, week } = getISOWeekYearAndNumber(d);
    return `${year}-W${String(week).padStart(2, "0")}`;
  } catch (e) {
    return "1970-W01";
  }
}

function getWeekIndex(weekKey) {
  try {
    const s = typeof weekKey === "string" ? weekKey : "";
    const [y, w] = s.split("-W");
    const year = safeNumber(y);
    const week = safeNumber(w);
    // ISO years can have 53 weeks; using 54 keeps monotonic ordering safe.
    return year * 54 + clamp(week, 1, 53);
  } catch (e) {
    return 0;
  }
}

export function calcRideScoreQuarter(rides) {
  try {
    const list = Array.isArray(rides) ? rides : [];

    const scored = list
      .map((r) => {
        const durationMin = safeNumber(r?.duration_min);
        if (durationMin < 20) {
          return 0;
        }

        let mult = 1.0;
        if (durationMin >= 90) {
          mult = 1.4;
        } else if (durationMin >= 45) {
          mult = 1.2;
        }

        // Base points are fixed at 100 per qualifying ride.
        return Math.round(100 * mult);
      })
      .filter((p) => safeNumber(p) > 0)
      .sort((a, b) => b - a)
      .slice(0, 48);

    const sum = scored.reduce((acc, p) => acc + safeNumber(p), 0);
    return Math.floor(clamp(sum, 0, CAPS.ride));
  } catch (e) {
    return 0;
  }
}

export function calcActiveWeeksInQuarter(rides) {
  try {
    const list = Array.isArray(rides) ? rides : [];

    const weekToDays = new Map();

    for (const r of list) {
      const d = safeDate(r?.start_iso);
      if (!d) continue;

      const weekKey = getWeekKey(d);
      const dayKey = d.toISOString().slice(0, 10); // YYYY-MM-DD (UTC)

      if (!weekToDays.has(weekKey)) {
        weekToDays.set(weekKey, new Set());
      }
      weekToDays.get(weekKey).add(dayKey);
    }

    const activeWeekKeys = [];
    for (const [weekKey, daySet] of weekToDays.entries()) {
      const dayCount = daySet?.size || 0;
      if (dayCount >= 2) {
        activeWeekKeys.push(weekKey);
      }
    }

    // Stable ordering for streak calc.
    activeWeekKeys.sort((a, b) => getWeekIndex(a) - getWeekIndex(b));

    return activeWeekKeys;
  } catch (e) {
    return [];
  }
}

export function calcLongestActiveWeekStreak(activeWeekKeys) {
  try {
    const list = Array.isArray(activeWeekKeys) ? activeWeekKeys : [];
    const uniqSorted = Array.from(new Set(list)).sort(
      (a, b) => getWeekIndex(a) - getWeekIndex(b),
    );

    let best = 0;
    let cur = 0;
    let prev = null;

    for (const wk of uniqSorted) {
      const idx = getWeekIndex(wk);
      if (prev == null) {
        cur = 1;
      } else {
        cur = idx === prev + 1 ? cur + 1 : 1;
      }
      prev = idx;
      if (cur > best) best = cur;
    }

    return Math.floor(clamp(best, 0, 99));
  } catch (e) {
    return 0;
  }
}

export function calcConsistencyBonusQuarter(activeWeeksCount, longestStreak) {
  try {
    const c = Math.floor(clamp(activeWeeksCount, 0, 999));

    let sectionA = 0;
    if (c >= 13) sectionA = 1800;
    else if (c >= 10) sectionA = 1500;
    else if (c >= 7) sectionA = 1100;
    else if (c >= 4) sectionA = 700;
    else if (c >= 1) sectionA = 300;

    const streak = Math.floor(clamp(longestStreak, 0, 12));
    const sectionB = Math.floor(clamp(75 * streak, 0, 900));

    return Math.floor(clamp(sectionA + sectionB, 0, CAPS.consistency));
  } catch (e) {
    return 0;
  }
}

export function calcEngagementScoreQuarter(eventsMap) {
  try {
    const m = eventsMap && typeof eventsMap === "object" ? eventsMap : {};

    let sum = 0;
    for (const [action, pts] of Object.entries(ENGAGEMENT_POINTS)) {
      const count = Math.floor(clamp(m?.[action], 0, 9999));
      sum += count * pts;
    }

    return Math.floor(clamp(sum, 0, CAPS.engagement));
  } catch (e) {
    return 0;
  }
}

export function calcMaintenanceScoreQuarter(maintenanceMap) {
  try {
    const m =
      maintenanceMap && typeof maintenanceMap === "object"
        ? maintenanceMap
        : {};

    let sum = 0;
    for (const [action, pts] of Object.entries(MAINTENANCE_POINTS)) {
      const count = Math.floor(clamp(m?.[action], 0, 9999));
      sum += count * pts;
    }

    return Math.floor(clamp(sum, 0, CAPS.bikeCare));
  } catch (e) {
    return 0;
  }
}

export function calcShareBonusQuarter(shareState) {
  try {
    const s = shareState && typeof shareState === "object" ? shareState : {};
    const events =
      s?.share_events && typeof s.share_events === "object"
        ? s.share_events
        : {};
    const weekCounts =
      s?.share_week_key_counts && typeof s.share_week_key_counts === "object"
        ? s.share_week_key_counts
        : {};

    let totalShares = 0;
    let rawPoints = 0;

    for (const [shareType, pts] of Object.entries(SHARE_POINTS)) {
      const count = Math.floor(clamp(events?.[shareType], 0, 9999));
      totalShares += count;
      rawPoints += count * pts;
    }

    let eligibleShares = 0;
    for (const count of Object.values(weekCounts)) {
      eligibleShares += Math.floor(clamp(count, 0, 3));
    }

    let points = rawPoints;
    if (
      totalShares > 0 &&
      eligibleShares >= 0 &&
      eligibleShares < totalShares
    ) {
      // Defensive scaling if data got corrupted (keeps per-week cap meaningful).
      points = Math.floor(rawPoints * (eligibleShares / totalShares));
    }

    return Math.floor(clamp(points, 0, CAPS.share));
  } catch (e) {
    return 0;
  }
}

export function calcCLSQ(state) {
  try {
    const rides = Array.isArray(state?.rides) ? state.rides : [];

    const rideScore = calcRideScoreQuarter(rides);

    const activeWeekKeys = calcActiveWeeksInQuarter(rides);
    const activeWeeksCount = activeWeekKeys.length;
    const longestStreak = calcLongestActiveWeekStreak(activeWeekKeys);
    const consistency = calcConsistencyBonusQuarter(
      activeWeeksCount,
      longestStreak,
    );

    const engagement = calcEngagementScoreQuarter(state?.engagement_events);
    const bikeCare = calcMaintenanceScoreQuarter(state?.maintenance_events);
    const share = calcShareBonusQuarter(state?.share_state);

    const total =
      safeNumber(rideScore) +
      safeNumber(consistency) +
      safeNumber(engagement) +
      safeNumber(bikeCare) +
      safeNumber(share);

    return Math.floor(clamp(total, 0, 999999));
  } catch (e) {
    return 0;
  }
}

export function getTierThreshold(tier) {
  try {
    const t = typeof tier === "string" ? tier : "";
    return Math.floor(clamp(TIER_THRESHOLDS?.[t], 0, 999999));
  } catch (e) {
    return 0;
  }
}

export function getNextTier(tier) {
  try {
    const idx = TIERS.indexOf(String(tier || ""));
    if (idx < 0) return "Silver";
    return TIERS[idx + 1] || null;
  } catch (e) {
    return null;
  }
}

export function getPrevTier(tier) {
  try {
    const idx = TIERS.indexOf(String(tier || ""));
    if (idx <= 0) return null;
    return TIERS[idx - 1] || null;
  } catch (e) {
    return null;
  }
}

export function getTierFromCLSQ(cls) {
  try {
    const score = Math.floor(clamp(cls, 0, 999999));

    // Default to Bronze, even if the user hasn't hit the Bronze target yet.
    let best = "Bronze";

    for (const tier of TIERS) {
      const threshold = getTierThreshold(tier);
      if (score >= threshold) {
        best = tier;
      }
    }

    return best;
  } catch (e) {
    return "Bronze";
  }
}

export function listTiers() {
  return [...TIERS];
}

export function getCaps() {
  return { ...CAPS };
}

export function getEngagementPointMap() {
  return { ...ENGAGEMENT_POINTS };
}

export function getMaintenancePointMap() {
  return { ...MAINTENANCE_POINTS };
}

export function getSharePointMap() {
  return { ...SHARE_POINTS };
}
