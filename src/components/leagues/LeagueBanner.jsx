import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  Share,
  Platform,
  Animated,
} from "react-native";
import { Trophy, ChevronRight } from "lucide-react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import AppCard from "@/components/AppCard";
import AppButton from "@/components/AppButton";
import LeagueProgressBreakdown from "@/components/leagues/LeagueProgressBreakdown";
import { colors, spacing, radius, typography } from "@/theme/index";
import { emitLeaguePointsFeedback } from "@/utils/leagues/pointsFeedback";

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
  ensureLeagueQuarterCurrent,
  getLeagueUserKeyFromUser,
} from "@/utils/leagues/leagueState";
import { trackLeagueShare } from "@/utils/leagues/track";
import {
  guardLeaguesAsync,
  isLeaguesMvpActive,
  getLeaguesDisableReason,
} from "@/utils/leagues/runtime";

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

export default function LeagueBanner({ user, expanded = false, onPress }) {
  const queryClient = useQueryClient();

  const userKey = useMemo(() => {
    return getLeagueUserKeyFromUser(user);
  }, [user]);

  const leaguesActive = isLeaguesMvpActive();

  const stateQuery = useQuery({
    queryKey: ["leagues-mvp", "quarter-state", userKey],
    enabled: leaguesActive,
    queryFn: async () => {
      return await ensureLeagueQuarterCurrent(userKey, new Date());
    },
  });

  const [trackWidth, setTrackWidth] = useState(0);
  const progressWidthAnim = useRef(new Animated.Value(0)).current;
  const lastClsqRef = useRef(null);

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

    const clsq = calcCLSQ(s);

    const tier = s.current_tier || "Bronze";
    const nextTier = getNextTier(tier);
    const nextThreshold = nextTier ? getTierThreshold(nextTier) : null;

    const progressPct =
      nextThreshold && nextThreshold > 0
        ? Math.max(0, Math.min(1, clsq / nextThreshold))
        : 1;

    return {
      tier,
      quarterKey: s.quarter_key || "",
      clsq: safeInt(clsq),
      rideScore,
      consistency,
      engagement,
      bikeCare,
      share,
      activeWeeksCount,
      longestStreak,
      nextTier,
      nextThreshold: nextThreshold != null ? safeInt(nextThreshold) : null,
      progressPct,
    };
  }, [stateQuery.data]);

  useEffect(() => {
    // Feedback loop: show +points toast when CLS-Q increases (share, rides, etc.)
    if (!computed) {
      return;
    }

    const prev = lastClsqRef.current;
    const next = safeInt(computed.clsq);
    lastClsqRef.current = next;

    if (typeof prev === "number") {
      const delta = next - prev;
      if (delta > 0) {
        emitLeaguePointsFeedback(delta);
      }
    }
  }, [computed?.clsq]);

  useEffect(() => {
    // Subtle progress bar animation (safe fallback if layout not measured).
    if (!computed) {
      return;
    }

    const pct = Number(computed.progressPct);
    const pct01 = Number.isFinite(pct) ? Math.max(0, Math.min(1, pct)) : 0;
    const target = trackWidth > 0 ? pct01 * trackWidth : 0;

    if (trackWidth <= 0) {
      return;
    }

    try {
      Animated.timing(progressWidthAnim, {
        toValue: target,
        duration: 260,
        useNativeDriver: false,
      }).start();
    } catch (e) {
      // no-op
    }
  }, [computed?.progressPct, progressWidthAnim, trackWidth]);

  const onShare = useCallback(async () => {
    await guardLeaguesAsync(
      "LeagueBanner.onShare",
      async () => {
        if (!computed) {
          return;
        }

        const message = `I\u2019m riding in Chainly Leagues. Tier: ${computed.tier}. CLS-Q: ${computed.clsq}.`;

        // Share API behavior differs by platform; keep this super defensive.
        const res = await Share.share(
          Platform.OS === "web" ? { message } : { message },
        );

        const sharedAction = res?.action;
        const didShare =
          sharedAction == null || sharedAction === Share.sharedAction;

        if (didShare) {
          await trackLeagueShare(userKey, "profile_card_share", new Date());
          await queryClient.invalidateQueries({
            queryKey: ["leagues-mvp", "quarter-state", userKey],
          });
        }
      },
      null,
    );
  }, [computed, queryClient, userKey]);

  if (!leaguesActive) {
    // Kill switch placeholder (only visible if flag is on but leagues disabled for session)
    // When FEATURE_LEAGUES_MVP is false, this piece should never render.
    const reason = getLeaguesDisableReason();
    const reasonText = reason?.source ? `(${reason.source})` : "";

    return (
      <AppCard style={styles.card} pressable={false}>
        <View style={styles.headerRow}>
          <View style={styles.iconWrap}>
            <Trophy size={22} color={colors.warning} strokeWidth={2.5} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Leagues</Text>
            <Text style={styles.subtle}>
              Temporarily unavailable {reasonText}
            </Text>
          </View>
        </View>
      </AppCard>
    );
  }

  if (stateQuery.isLoading || !computed) {
    return (
      <AppCard style={styles.card} onPress={onPress} pressable={!!onPress}>
        <View style={styles.headerRow}>
          <View style={styles.iconWrap}>
            <Trophy size={22} color={colors.warning} strokeWidth={2.5} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Leagues</Text>
            <Text style={styles.subtle}>Loading your quarter\u2026</Text>
          </View>
          <View style={styles.metaRight}>
            <ChevronRight size={18} color={colors.textSecondary} />
          </View>
        </View>
      </AppCard>
    );
  }

  const rows = [
    { label: "Ride Score", value: computed.rideScore },
    { label: "Consistency Bonus", value: computed.consistency },
    { label: "Engagement", value: computed.engagement },
    { label: "Bike Care", value: computed.bikeCare },
    { label: "Share Bonus", value: computed.share },
  ];

  const hasNext = !!computed.nextTier && !!computed.nextThreshold;
  const nextThreshold = computed.nextThreshold || 0;
  const remaining = hasNext ? Math.max(0, nextThreshold - computed.clsq) : 0;
  const ptsLine = hasNext
    ? `${formatPts(computed.clsq)} / ${formatPts(nextThreshold)} pts`
    : `${formatPts(computed.clsq)} pts`;

  const progressLabel = hasNext ? `Next: ${computed.nextTier}` : "Top tier";
  const pillLabel = onPress ? "View progress" : "3-mo cycle";

  return (
    <AppCard style={styles.card} onPress={onPress} pressable={!!onPress}>
      <View style={styles.headerRow}>
        <View style={styles.iconWrap}>
          <Trophy size={22} color={colors.warning} strokeWidth={2.5} />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{computed.tier}</Text>
          <Text style={styles.subtle}>{ptsLine}</Text>
        </View>

        <View style={styles.metaRight}>
          <Text style={styles.metaTiny}>{computed.quarterKey}</Text>
          <View style={styles.pill}>
            <Text style={styles.pillText}>{pillLabel}</Text>
            <ChevronRight size={14} color={colors.textSecondary} />
          </View>
        </View>
      </View>

      {/* Progress bar */}
      <View style={{ marginTop: spacing.md }}>
        <View
          style={styles.progressTrack}
          onLayout={(e) => {
            try {
              const w = e?.nativeEvent?.layout?.width;
              if (Number.isFinite(w) && w > 0) {
                setTrackWidth(w);

                // Ensure initial width is correct immediately.
                const pct = Number(computed.progressPct);
                const pct01 = Number.isFinite(pct)
                  ? Math.max(0, Math.min(1, pct))
                  : 0;
                progressWidthAnim.setValue(pct01 * w);
              }
            } catch (err) {
              // no-op
            }
          }}
        >
          <Animated.View
            style={[
              styles.progressFill,
              {
                width:
                  trackWidth > 0
                    ? progressWidthAnim
                    : `${Math.round(computed.progressPct * 100)}%`,
              },
            ]}
          />
        </View>
        <View style={styles.progressRow}>
          <Text style={styles.progressLabel}>{progressLabel}</Text>
          <Text style={styles.progressLabel}>
            {hasNext
              ? `${formatPts(remaining)} to go`
              : "Resets every 3 months"}
          </Text>
        </View>
      </View>

      {/* Expanded details (inline) */}
      {expanded ? (
        <View style={{ marginTop: spacing.lg }}>
          {hasNext ? (
            <View style={styles.nextTierCallout}>
              <Text style={styles.nextTierTitle}>
                Next Tier: {computed.nextTier}
              </Text>
              <Text style={styles.nextTierSub}>
                You need {formatPts(remaining)} more points
              </Text>
            </View>
          ) : null}

          <LeagueProgressBreakdown rows={rows} />

          <View style={{ marginTop: spacing.lg }}>
            <AppButton title="Share my Rider Card" onPress={onShare} />
          </View>
        </View>
      ) : null}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    paddingVertical: spacing.lg,
  },
  headerRow: {
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
  title: {
    fontSize: 20,
    lineHeight: 22,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  subtle: {
    marginTop: 4,
    fontSize: typography.base,
    lineHeight: 18,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
  metaRight: {
    alignItems: "flex-end",
  },
  metaTiny: {
    fontSize: 11,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textSecondary,
  },
  pill: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.round,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  pillText: {
    fontSize: 12,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textSecondary,
  },

  progressTrack: {
    height: 10,
    borderRadius: 8,
    backgroundColor: colors.borderLight,
    overflow: "hidden",
  },
  progressFill: {
    height: 10,
    borderRadius: 8,
    backgroundColor: colors.primary,
  },
  progressRow: {
    marginTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  progressLabel: {
    fontSize: 12,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },

  breakRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  breakLabel: {
    fontSize: 14,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textPrimary,
  },
  breakValue: {
    fontSize: 14,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
  },

  nextTierCallout: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceWarm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  nextTierTitle: {
    fontSize: 14,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
  },
  nextTierSub: {
    marginTop: 4,
    fontSize: 13,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textSecondary,
  },
});
