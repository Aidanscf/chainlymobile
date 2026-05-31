// Retention-First Leagues MVP - tracking wrappers
//
// Rules:
// - Must never throw
// - Must obey FEATURE_LEAGUES_MVP
// - Must enforce weekly share cap

import {
  mutateLeagueQuarterState,
  incrementMapCounter,
  trackShareWithWeeklyCap,
} from "@/utils/leagues/leagueState";
import { guardLeaguesAsync } from "@/utils/leagues/runtime";

export async function trackLeagueEngagement(userKey, actionType, now) {
  return await guardLeaguesAsync(
    "trackLeagueEngagement",
    async () => {
      const action = actionType ? String(actionType) : "";
      if (!action) return null;

      return await mutateLeagueQuarterState(
        userKey,
        (state) => ({
          ...state,
          engagement_events: incrementMapCounter(
            state?.engagement_events,
            action,
            1,
          ),
        }),
        now,
      );
    },
    null,
  );
}

export async function trackLeagueMaintenance(userKey, actionType, now) {
  return await guardLeaguesAsync(
    "trackLeagueMaintenance",
    async () => {
      const action = actionType ? String(actionType) : "";
      if (!action) return null;

      return await mutateLeagueQuarterState(
        userKey,
        (state) => ({
          ...state,
          maintenance_events: incrementMapCounter(
            state?.maintenance_events,
            action,
            1,
          ),
        }),
        now,
      );
    },
    null,
  );
}

export async function trackLeagueShare(userKey, shareType, nowDate) {
  return await guardLeaguesAsync(
    "trackLeagueShare",
    async () => {
      const type = shareType ? String(shareType) : "";
      if (!type) return null;

      return await mutateLeagueQuarterState(
        userKey,
        (state) =>
          trackShareWithWeeklyCap({
            state,
            shareType: type,
            nowDate: nowDate || new Date(),
          }),
        nowDate,
      );
    },
    null,
  );
}
