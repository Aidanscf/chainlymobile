import React, { useCallback, useEffect, useMemo } from "react";
import { View, Text, StyleSheet, ScrollView, AppState } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { Trophy, Activity, Wrench, Share2, Bike } from "lucide-react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import ScreenHeader from "@/components/layout/ScreenHeader";
import AppCard from "@/components/AppCard";
import AppButton from "@/components/AppButton";
import LeagueProgressBreakdown from "@/components/leagues/LeagueProgressBreakdown";
import LeagueHelpContent from "@/components/leagues/LeagueHelpContent";
import { colors, spacing, radius, typography } from "@/theme/index";
import { useAuth } from "@/utils/auth/useAuth";
import {
  ensureLeagueQuarterCurrent,
  getLeagueUserKeyFromUser,
  addLeagueRide,
} from "@/utils/leagues/leagueState";
import {
  calcRideScoreQuarter,
  calcActiveWeeksInQuarter,
  calcLongestActiveWeekStreak,
  calcConsistencyBonusQuarter,
  calcEngagementScoreQuarter,
  calcMaintenanceScoreQuarter,
  calcShareBonusQuarter,
  calcCLSQ,
  getNextTier,
  getTierThreshold,
} from "@/utils/leagues/calcCLSQ";
import {
  guardLeaguesAsync,
  isLeaguesMvpActive,
  getLeaguesDisableReason,
} from "@/utils/leagues/runtime";
import {
  trackLeagueEngagement,
  trackLeagueMaintenance,
  trackLeagueShare,
} from "@/utils/leagues/track";
import { leagueEvents } from "@/utils/leagues/leagueEvents";
import { FEATURE_LEAGUES_MVP_DEBUG } from "@/utils/featureFlags";

function safeInt(n) {
  const x = Number(n);
  return Number.isFinite(x) ? Math.floor(x) : 0;
}

function formatPts(n) {
  try {
    return safeInt(n).toLocaleString();
  } catch (e) {
    return String(safeInt(n));
  }
}

function isTrulyEmptyState(s) {
  const rides = Array.isArray(s?.rides) ? s.rides : [];
  const eng =
    s?.engagement_events && typeof s.engagement_events === "object"
      ? s.engagement_events
      : {};
  const maint =
    s?.maintenance_events && typeof s.maintenance_events === "object"
      ? s.maintenance_events
      : {};
  const share =
    s?.share_state?.share_events &&
    typeof s.share_state.share_events === "object"
      ? s.share_state.share_events
      : {};

  const hasEng = Object.keys(eng).length > 0;
  const hasMaint = Object.keys(maint).length > 0;
  const hasShare = Object.keys(share).length > 0;

  return rides.length === 0 && !hasEng && !hasMaint && !hasShare;
}

export default function LeagueOverviewScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const queryClient = useQueryClient();

  const { isReady, user } = useAuth();

  const leaguesActive = isLeaguesMvpActive();

  const userKey = useMemo(() => {
    return getLeagueUserKeyFromUser(user);
  }, [user]);

  const stateQuery = useQuery({
    queryKey: ["leagues-mvp", "quarter-state", userKey],
    enabled: !!(leaguesActive && isReady),
    queryFn: async () => {
      return await ensureLeagueQuarterCurrent(userKey, new Date());
    },
  });

  const computed = useMemo(() => {
    const s = stateQuery.data;
    if (!s) {
      return null;
    }

    const rides = Array.isArray(s.rides) ? s.rides : [];

    const rideScore = calcRideScoreQuarter(rides);

    const activeWeekKeys = calcActiveWeeksInQuarter(rides);
    const activeWeeksCount = activeWeekKeys.length;
    const longestStreak = calcLongestActiveWeekStreak(activeWeekKeys);
    const consistency = calcConsistencyBonusQuarter(
      activeWeeksCount,
      longestStreak,
    );

    const engagement = calcEngagementScoreQuarter(s.engagement_events);
    const bikeCare = calcMaintenanceScoreQuarter(s.maintenance_events);
    const share = calcShareBonusQuarter(s.share_state);

    const clsq = safeInt(calcCLSQ(s));

    const tier = s.current_tier || "Bronze";
    const nextTier = getNextTier(tier);
    const nextThreshold = nextTier ? getTierThreshold(nextTier) : null;

    const hasNext = !!nextTier && nextThreshold != null && nextThreshold > 0;

    const progressPct = hasNext
      ? Math.max(0, Math.min(1, clsq / nextThreshold))
      : 1;

    const remaining = hasNext ? Math.max(0, safeInt(nextThreshold) - clsq) : 0;

    return {
      state: s,
      tier,
      clsq,
      nextTier,
      nextThreshold: nextThreshold != null ? safeInt(nextThreshold) : null,
      progressPct,
      remaining,
      rideScore: safeInt(rideScore),
      consistency: safeInt(consistency),
      engagement: safeInt(engagement),
      bikeCare: safeInt(bikeCare),
      share: safeInt(share),
      activeWeeksCount: safeInt(activeWeeksCount),
      longestStreak: safeInt(longestStreak),
      quarterKey: String(s.quarter_key || ""),
      lastRolloverIso: String(s.last_rollover_iso || ""),
      ridesCount: Array.isArray(rides) ? rides.length : 0,
    };
  }, [stateQuery.data]);

  const refetchState = useCallback(async () => {
    try {
      await stateQuery.refetch();
    } catch (e) {
      // no-op
    }
  }, [stateQuery]);

  useEffect(() => {
    if (!leaguesActive || !isReady) {
      return;
    }

    // Live updates when league state changes anywhere.
    const off = leagueEvents.on("updated", () => {
      try {
        queryClient.invalidateQueries({
          queryKey: ["leagues-mvp", "quarter-state", userKey],
        });
      } catch (e) {
        // no-op
      }
    });

    return off;
  }, [isReady, leaguesActive, queryClient, userKey]);

  useFocusEffect(
    useCallback(() => {
      if (!leaguesActive || !isReady) {
        return;
      }
      refetchState();
    }, [isReady, leaguesActive, refetchState]),
  );

  useEffect(() => {
    if (!leaguesActive || !isReady) {
      return;
    }

    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        refetchState();
      }
    });

    return () => {
      try {
        sub.remove();
      } catch (e) {
        // no-op
      }
    };
  }, [isReady, leaguesActive, refetchState]);

  const rows = useMemo(() => {
    if (!computed) {
      return [];
    }

    return [
      { label: "Ride Score", value: computed.rideScore },
      { label: "Consistency Bonus", value: computed.consistency },
      { label: "Engagement", value: computed.engagement },
      { label: "Bike Care", value: computed.bikeCare },
      { label: "Share Bonus", value: computed.share },
    ];
  }, [computed]);

  const onBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const onTestRide = useCallback(async () => {
    if (!leaguesActive || !isReady) {
      return;
    }

    await guardLeaguesAsync(
      "LeagueOverviewScreen.testRide",
      async () => {
        const now = new Date();
        await addLeagueRide(
          userKey,
          {
            start_iso: now.toISOString(),
            duration_min: 48,
          },
          now,
        );
      },
      null,
    );
  }, [isReady, leaguesActive, userKey]);

  const onTestEngagement = useCallback(async () => {
    if (!leaguesActive || !isReady) {
      return;
    }
    await trackLeagueEngagement(userKey, "test_engagement", new Date());
  }, [isReady, leaguesActive, userKey]);

  const onTestMaintenance = useCallback(async () => {
    if (!leaguesActive || !isReady) {
      return;
    }
    await trackLeagueMaintenance(userKey, "test_maintenance", new Date());
  }, [isReady, leaguesActive, userKey]);

  const onTestShare = useCallback(async () => {
    if (!leaguesActive || !isReady) {
      return;
    }
    await trackLeagueShare(userKey, "test_share", new Date());
  }, [isReady, leaguesActive, userKey]);

  const disableReason = useMemo(() => {
    if (leaguesActive) {
      return null;
    }
    return getLeaguesDisableReason();
  }, [leaguesActive]);

  const emptyState = useMemo(() => {
    if (!computed?.state) {
      return false;
    }
    return isTrulyEmptyState(computed.state);
  }, [computed?.state]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />

      <ScreenHeader title="League Progress" showBack onBack={onBack} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: spacing.xl,
          paddingBottom: insets.bottom + 28,
        }}
        showsVerticalScrollIndicator={false}
      >
        {!leaguesActive ? (
          <AppCard style={styles.heroCard} pressable={false}>
            <View style={styles.heroRow}>
              <View style={styles.iconWrap}>
                <Trophy size={22} color={colors.warning} strokeWidth={2.5} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.heroTitle}>Leagues</Text>
                <Text style={styles.heroSub}>
                  Temporarily unavailable
                  {disableReason?.source ? ` (${disableReason.source})` : ""}
                </Text>
              </View>
            </View>
          </AppCard>
        ) : stateQuery.isLoading || !computed ? (
          <AppCard style={styles.heroCard} pressable={false}>
            <View style={styles.heroRow}>
              <View style={styles.iconWrap}>
                <Trophy size={22} color={colors.warning} strokeWidth={2.5} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.heroTitle}>Loading…</Text>
                <Text style={styles.heroSub}>Calculating your quarter…</Text>
              </View>
            </View>
          </AppCard>
        ) : emptyState ? (
          <AppCard style={styles.heroCard} pressable={false}>
            <View style={styles.heroRow}>
              <View style={styles.iconWrap}>
                <Trophy size={22} color={colors.warning} strokeWidth={2.5} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.heroTitle}>No activity yet</Text>
                <Text style={styles.heroSub}>
                  Log a ride or use an AI tool — your points will show up here.
                </Text>
              </View>
            </View>
          </AppCard>
        ) : (
          <AppCard style={styles.heroCard} pressable={false}>
            <View style={styles.heroRow}>
              <View style={styles.iconWrap}>
                <Trophy size={22} color={colors.warning} strokeWidth={2.5} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.heroTitle}>Tier: {computed.tier}</Text>
                <Text style={styles.heroSub}>Resets every 3 months</Text>
              </View>
            </View>

            <View style={{ height: spacing.lg }} />

            <View style={styles.bigNumbersRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.bigLabel}>CLS-Q</Text>
                <Text style={styles.bigValue}>{formatPts(computed.clsq)}</Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={styles.bigLabel}>Next tier</Text>
                <Text style={styles.bigValueSmall}>
                  {computed.nextTier
                    ? `${computed.nextTier} (${formatPts(
                        computed.nextThreshold || 0,
                      )})`
                    : "Max tier reached"}
                </Text>
              </View>
            </View>

            {computed.nextTier && computed.nextThreshold ? (
              <View style={{ marginTop: spacing.md }}>
                <Text style={styles.needLine}>
                  Need {formatPts(computed.remaining)} more points
                </Text>
              </View>
            ) : (
              <View style={{ marginTop: spacing.md }}>
                <Text style={styles.needLine}>Max tier reached</Text>
              </View>
            )}

            <View style={{ marginTop: spacing.md }}>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${Math.round(computed.progressPct * 100)}%` },
                  ]}
                />
              </View>
              <View style={styles.progressMetaRow}>
                <Text style={styles.progressMetaText}>
                  {formatPts(computed.clsq)} /{" "}
                  {formatPts(computed.nextThreshold || 0)}
                </Text>
                <Text style={styles.progressMetaText}>
                  {Math.round(computed.progressPct * 100)}%
                </Text>
              </View>
            </View>

            <LeagueProgressBreakdown rows={rows} />
          </AppCard>
        )}

        {leaguesActive ? (
          <LeagueHelpContent currentTier={computed?.tier} />
        ) : null}

        {FEATURE_LEAGUES_MVP_DEBUG && computed ? (
          <View style={{ marginTop: spacing.xl }}>
            <Text style={styles.debugTitle}>Debug</Text>

            <AppCard style={styles.debugCard} pressable={false}>
              <Text style={styles.debugLine}>
                quarter_key: {computed.quarterKey || ""}
              </Text>
              <Text style={styles.debugLine}>rides: {computed.ridesCount}</Text>
              <Text style={styles.debugLine}>
                active weeks: {computed.activeWeeksCount} (streak:{" "}
                {computed.longestStreak})
              </Text>
              <Text style={styles.debugLine}>
                last rollover: {computed.lastRolloverIso || ""}
              </Text>
            </AppCard>

            <View style={{ height: spacing.lg }} />

            <Text style={styles.debugTitle}>Test Actions</Text>
            <View style={{ gap: spacing.md }}>
              <AppButton
                title="Add test ride"
                onPress={onTestRide}
                leftIcon={
                  <Bike size={18} color={colors.primary} strokeWidth={2.5} />
                }
                variant="secondary"
              />
              <AppButton
                title="Add test engagement"
                onPress={onTestEngagement}
                leftIcon={
                  <Activity
                    size={18}
                    color={colors.primary}
                    strokeWidth={2.5}
                  />
                }
                variant="secondary"
              />
              <AppButton
                title="Add test maintenance"
                onPress={onTestMaintenance}
                leftIcon={
                  <Wrench size={18} color={colors.primary} strokeWidth={2.5} />
                }
                variant="secondary"
              />
              <AppButton
                title="Add test share"
                onPress={onTestShare}
                leftIcon={
                  <Share2 size={18} color={colors.primary} strokeWidth={2.5} />
                }
                variant="secondary"
              />
            </View>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  heroCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },

  heroRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },

  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.round,
    backgroundColor: colors.warningSoft,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.warning,
  },

  heroTitle: {
    fontSize: 18,
    lineHeight: 20,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  heroSub: {
    marginTop: 4,
    fontSize: typography.sm,
    lineHeight: 16,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textSecondary,
  },

  bigNumbersRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  bigLabel: {
    fontSize: 12,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textSecondary,
  },
  bigValue: {
    marginTop: 4,
    fontSize: 30,
    lineHeight: 32,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    letterSpacing: -0.6,
  },
  bigValueSmall: {
    marginTop: 4,
    fontSize: 14,
    lineHeight: 18,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
  },

  needLine: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textSecondary,
  },

  progressTrack: {
    height: 10,
    borderRadius: 999,
    backgroundColor: colors.borderLight,
    overflow: "hidden",
  },
  progressFill: {
    height: 10,
    borderRadius: 999,
    backgroundColor: colors.primary,
  },
  progressMetaRow: {
    marginTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  progressMetaText: {
    fontSize: 12,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },

  debugTitle: {
    fontSize: 16,
    lineHeight: 18,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  debugCard: {
    backgroundColor: colors.surfaceWarm,
    borderColor: colors.border,
  },
  debugLine: {
    fontSize: typography.sm,
    lineHeight: 16,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    marginBottom: 8,
  },
});
