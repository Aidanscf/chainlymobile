import React, { useCallback, useEffect, useMemo } from "react";
import { View, Text, StyleSheet, ScrollView, Platform } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Trophy, Medal, Sparkles } from "lucide-react-native";

import ScreenContainer from "@/components/layout/ScreenContainer";
import AppCard from "@/components/AppCard";
import { colors, spacing, radius, typography, shadows } from "@/theme/index";
import useOnboardingStore from "@/store/onboarding";
import { leagueData } from "@/data/mock";

import OnboardingBackground from "@/components/onboarding/OnboardingBackground.jsx";
import OnboardingTopBar from "@/components/onboarding/OnboardingTopBar.jsx";
import StickyCTA from "@/components/onboarding/StickyCTA.jsx";

export default function OnboardingSocialProofScreen() {
  const router = useRouter();

  const setProgress = useOnboardingStore((s) => s.setProgress);

  useEffect(() => {
    setProgress({
      currentStepIndex: 101,
      lastRoute: "/onboarding/social-proof",
    });
  }, [setProgress]);

  const topRiders = useMemo(() => {
    return [
      { id: "1", name: "Jake Thompson", points: 2450, rank: 1 },
      { id: "2", name: "Sarah Chen", points: 2380, rank: 2 },
      { id: "3", name: "Mike Rivera", points: 2310, rank: 3 },
      { id: "4", name: "Emma Davis", points: 2240, rank: 4 },
      { id: "5", name: "You", points: 2150, rank: leagueData.rank },
    ];
  }, []);

  const getRankIcon = useCallback((rank) => {
    if (rank === 1) {
      return <Trophy size={18} color={colors.warning} strokeWidth={2.5} />;
    }
    if (rank === 2) {
      return <Medal size={18} color="#B9BDC5" strokeWidth={2.5} />;
    }
    if (rank === 3) {
      return <Medal size={18} color="#CD7F32" strokeWidth={2.5} />;
    }
    return null;
  }, []);

  const onBack = useCallback(() => {
    router.back();
  }, [router]);

  const onSave = useCallback(async () => {
    try {
      if (Platform.OS !== "web") await Haptics.selectionAsync();
    } catch (e) {
      // no-op
    }

    await setProgress({
      currentStepIndex: 102,
      lastRoute: "/onboarding/account",
    });

    router.push({
      pathname: "/onboarding/account",
      params: { from: "social" },
    });
  }, [router, setProgress]);

  const onSkip = useCallback(() => {
    router.push("/onboarding/paywall");
  }, [router]);

  return (
    <ScreenContainer safeBottom style={styles.container}>
      <StatusBar style="dark" />
      <OnboardingBackground variant="warm" />

      <OnboardingTopBar title="Leagues" onBack={onBack} />

      <View style={{ flex: 1 }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingTop: spacing.xl,
            paddingHorizontal: spacing.xl,
            paddingBottom: 12,
          }}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>
            Riders like you are competing in Leagues.
          </Text>
          <Text style={styles.subtitle}>
            Your starting rank is ready. Save progress so you can climb tiers
            and compare stats.
          </Text>

          <View style={{ height: spacing.xl }} />

          <AppCard style={styles.rankCard} pressable={false} padding={18}>
            <View style={styles.rankTop}>
              <View style={styles.rankIconWrap}>
                <Sparkles size={20} color={colors.primary} strokeWidth={2.75} />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.rankTier}>{leagueData.tier}</Text>
                <Text style={styles.rankSub}>{leagueData.percentile}</Text>
              </View>

              <View style={styles.rankPill}>
                <Text style={styles.rankPillLabel}>Rank</Text>
                <Text style={styles.rankPillValue}>#{leagueData.rank}</Text>
              </View>
            </View>

            <View style={{ height: spacing.lg }} />

            <View style={styles.progressWrap}>
              <View style={[styles.progressFill, { width: "72%" }]} />
            </View>
            <Text style={styles.progressText}>
              Your starting rank is locked in.
            </Text>
          </AppCard>

          <View style={{ height: spacing.lg }} />

          <Text style={styles.sectionTitle}>Leaderboard (sample)</Text>

          <View style={{ height: spacing.md }} />

          <View style={{ gap: spacing.md }}>
            {topRiders.map((r) => {
              const isYou = r.name === "You";
              const icon = getRankIcon(r.rank);
              const cardStyle = isYou
                ? {
                    backgroundColor: colors.primarySoft,
                    borderColor: colors.primary,
                  }
                : null;

              const nameStyle = isYou ? { color: colors.primary } : null;

              return (
                <AppCard
                  key={r.id}
                  padding={16}
                  style={[styles.riderCard, cardStyle]}
                  pressable={false}
                >
                  <View style={styles.riderRow}>
                    <View style={styles.rankBox}>
                      {icon ? (
                        icon
                      ) : (
                        <Text style={styles.rankText}>{r.rank}</Text>
                      )}
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={[styles.riderName, nameStyle]}>
                        {r.name}
                      </Text>
                      <Text style={styles.riderMeta}>
                        {r.points.toLocaleString()} pts
                      </Text>
                    </View>
                  </View>
                </AppCard>
              );
            })}
          </View>

          <View style={{ height: 170 }} />
        </ScrollView>

        <View style={styles.footerFade} />
        <StickyCTA
          primaryTitle="Save my progress"
          onPrimary={onSave}
          secondaryTitle="Skip for now"
          onSecondary={onSkip}
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: colors.appBackground },

  title: {
    fontSize: 34,
    lineHeight: 38,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    letterSpacing: -0.9,
  },
  subtitle: {
    marginTop: spacing.sm,
    fontSize: 15,
    lineHeight: 20,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textSecondary,
  },

  rankCard: {
    backgroundColor: colors.surfaceWarm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rankTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  rankIconWrap: {
    width: 52,
    height: 52,
    borderRadius: radius.round,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primarySoft2,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.small,
  },
  rankTier: {
    fontSize: 18,
    lineHeight: 20,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
  },
  rankSub: {
    marginTop: 4,
    fontSize: 12,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textSecondary,
  },
  rankPill: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: radius.round,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
  },
  rankPillLabel: {
    fontSize: 10,
    fontFamily: typography.fontFamily.black,
    color: colors.textSecondary,
    letterSpacing: 1,
  },
  rankPillValue: {
    marginTop: 2,
    fontSize: 14,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
  },

  progressWrap: {
    height: 12,
    borderRadius: radius.round,
    backgroundColor: colors.borderLight,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: radius.round,
    backgroundColor: colors.primary,
  },
  progressText: {
    marginTop: spacing.sm,
    fontSize: 12,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textSecondary,
  },

  sectionTitle: {
    fontSize: 12,
    fontFamily: typography.fontFamily.black,
    color: colors.textSecondary,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },

  riderCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  riderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  rankBox: {
    width: 42,
    height: 42,
    borderRadius: radius.round,
    backgroundColor: colors.surfaceWarm,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  rankText: {
    fontSize: 14,
    fontFamily: typography.fontFamily.black,
    color: colors.textSecondary,
  },
  riderName: {
    fontSize: 15,
    lineHeight: 17,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
  },
  riderMeta: {
    marginTop: 4,
    fontSize: 12,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textSecondary,
  },

  footerFade: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 120,
    backgroundColor: colors.appBackground,
    opacity: 0.85,
  },
});
