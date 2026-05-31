import React, { useCallback, useMemo } from "react";
import { View, Text, StyleSheet, ScrollView, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";

import ScreenHeader from "@/components/layout/ScreenHeader";
import AppCard from "@/components/AppCard";
import AppButton from "@/components/AppButton";
import { colors, spacing, typography } from "@/theme/index";

import {
  FEATURE_LEAGUES_MVP,
  FEATURE_LEAGUES_MVP_DEBUG,
} from "@/utils/featureFlags";
import { useAuth } from "@/utils/auth/useAuth";

import {
  ensureLeagueQuarterCurrent,
  getLeagueUserKeyFromUser,
  addLeagueRide,
  resetLeagueQuarterState,
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
} from "@/utils/leagues/calcCLSQ";
import {
  trackLeagueEngagement,
  trackLeagueMaintenance,
  trackLeagueShare,
} from "@/utils/leagues/track";

export default function LeagueDebugScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const router = useRouter();

  const { user } = useAuth();

  const userKey = useMemo(() => {
    return getLeagueUserKeyFromUser(user);
  }, [user]);

  const debugEnabled =
    process.env.NODE_ENV !== "production" && FEATURE_LEAGUES_MVP_DEBUG;

  const stateQuery = useQuery({
    queryKey: ["leagues-mvp", "quarter-state", userKey],
    enabled: !!(FEATURE_LEAGUES_MVP && debugEnabled),
    queryFn: async () => {
      return await ensureLeagueQuarterCurrent(userKey, new Date());
    },
  });

  const computed = useMemo(() => {
    const s = stateQuery.data;
    if (!s) return null;

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
    const maintenance = calcMaintenanceScoreQuarter(s.maintenance_events);
    const share = calcShareBonusQuarter(s.share_state);

    const clsq = calcCLSQ(s);

    return {
      rideScore,
      activeWeeksCount,
      longestStreak,
      consistency,
      engagement,
      maintenance,
      share,
      clsq,
    };
  }, [stateQuery.data]);

  const refresh = useCallback(async () => {
    await queryClient.invalidateQueries({
      queryKey: ["leagues-mvp", "quarter-state", userKey],
    });
  }, [queryClient, userKey]);

  const onBack = useCallback(() => {
    router.back();
  }, [router]);

  const addTestRide = useCallback(async () => {
    try {
      const nowIso = new Date().toISOString();
      await addLeagueRide(userKey, { start_iso: nowIso, duration_min: 30 });
      await refresh();
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Could not add test ride");
    }
  }, [refresh, userKey]);

  const addTestEngagement = useCallback(async () => {
    try {
      await trackLeagueEngagement(userKey, "ai_diagnostics", new Date());
      await refresh();
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Could not add engagement event");
    }
  }, [refresh, userKey]);

  const addTestMaintenance = useCallback(async () => {
    try {
      await trackLeagueMaintenance(userKey, "chain_check", new Date());
      await refresh();
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Could not add maintenance event");
    }
  }, [refresh, userKey]);

  const addTestShare = useCallback(async () => {
    try {
      await trackLeagueShare(userKey, "profile_card_share", new Date());
      await refresh();
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Could not add share event");
    }
  }, [refresh, userKey]);

  const onReset = useCallback(async () => {
    try {
      await resetLeagueQuarterState(userKey, new Date());
      await refresh();
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Could not reset league state");
    }
  }, [refresh, userKey]);

  if (!FEATURE_LEAGUES_MVP || !debugEnabled) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBar style="dark" />
        <ScreenHeader title="League Debug" showBack onBack={onBack} />
        <View style={{ padding: spacing.xl }}>
          <Text style={styles.title}>Debug disabled</Text>
          <Text style={styles.subtle}>
            Enable FEATURE_LEAGUES_MVP and FEATURE_LEAGUES_MVP_DEBUG (dev only).
          </Text>
        </View>
      </View>
    );
  }

  const s = stateQuery.data;

  const row = (label, value) => {
    const v = value == null ? "" : String(value);
    return (
      <View style={styles.row} key={label}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowValue}>{v}</Text>
      </View>
    );
  };

  const shareWeekCounts = s?.share_state?.share_week_key_counts;
  const shareEvents = s?.share_state?.share_events;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />
      <ScreenHeader title="League Debug" showBack onBack={onBack} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: spacing.xl,
          paddingBottom: insets.bottom + 28,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Retention-First Leagues (MVP)</Text>
        <Text style={styles.subtle}>
          Hidden debug view. Should never crash.
        </Text>

        <View style={{ height: spacing.lg }} />

        <AppCard pressable={false}>
          {row("userKey", userKey)}
          {row("quarter_key", s?.quarter_key)}
          {row("rides_count", Array.isArray(s?.rides) ? s.rides.length : 0)}
          {row("current_tier", s?.current_tier)}
          {row("last_quarter_cls", s?.last_quarter_cls)}
          {row("last_rollover_iso", s?.last_rollover_iso)}
        </AppCard>

        <View style={{ height: spacing.lg }} />

        <AppCard pressable={false}>
          {row("Ride Score", computed?.rideScore)}
          {row("Active weeks", computed?.activeWeeksCount)}
          {row("Longest week streak", computed?.longestStreak)}
          {row("Consistency bonus", computed?.consistency)}
          {row("Engagement score", computed?.engagement)}
          {row("Bike care bonus", computed?.maintenance)}
          {row("Friends share bonus", computed?.share)}
          {row("CLS-Q", computed?.clsq)}
        </AppCard>

        <View style={{ height: spacing.lg }} />

        <AppCard pressable={false}>
          {row("engagement_events", JSON.stringify(s?.engagement_events || {}))}
          {row(
            "maintenance_events",
            JSON.stringify(s?.maintenance_events || {}),
          )}
          {row("share_events", JSON.stringify(shareEvents || {}))}
          {row("share_week_key_counts", JSON.stringify(shareWeekCounts || {}))}
        </AppCard>

        <View style={{ height: spacing.xl }} />

        <AppButton title="Add test ride (30 min)" onPress={addTestRide} />
        <View style={{ height: spacing.md }} />
        <AppButton
          title="Add test engagement (AI diagnostics)"
          onPress={addTestEngagement}
          variant="secondary"
        />
        <View style={{ height: spacing.md }} />
        <AppButton
          title="Add test maintenance (chain check)"
          onPress={addTestMaintenance}
          variant="secondary"
        />
        <View style={{ height: spacing.md }} />
        <AppButton
          title="Add test share (profile card)"
          onPress={addTestShare}
          variant="secondary"
        />
        <View style={{ height: spacing.md }} />
        <AppButton
          title="Reset league state"
          onPress={onReset}
          variant="ghost"
        />

        <View style={{ height: spacing.xxxl }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  title: {
    fontSize: 24,
    lineHeight: 28,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
  },
  subtle: {
    marginTop: 6,
    fontSize: typography.base,
    lineHeight: 18,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
  row: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  rowLabel: {
    fontSize: 12,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textSecondary,
  },
  rowValue: {
    marginTop: 4,
    fontSize: 14,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
  },
});
