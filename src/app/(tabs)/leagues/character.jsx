import React, { useMemo, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Image } from "expo-image";
import {
  Trophy,
  ArrowUpRight,
  Share2,
  Sparkles,
  Camera,
} from "lucide-react-native";
import { useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import AppCard from "@/components/AppCard";
import AppButton from "@/components/AppButton";
import SkillRadar from "@/components/SkillRadar";
import SkillRow from "@/components/SkillRow";
import { colors, spacing, radius, typography } from "@/theme/index";
import { riderCharacter } from "@/data/mock";
import { useUserCharacter } from "@/store/userCharacter";
import { apiFetch } from "@/services/apiClient";
import { runManualSync } from "@/utils/syncManager";
import {
  ACCOUNTS_ENABLED,
  SERVER_SYNC_ENABLED,
  FEATURE_LEAGUES_MVP,
} from "@/utils/featureFlags";
import { useAuth } from "@/utils/auth/useAuth";
import LeagueBanner from "@/components/leagues/LeagueBanner";

function scoreColor(score) {
  if (score >= 75) return colors.success;
  if (score >= 50) return colors.warning;
  return colors.danger;
}

export default function RiderCharacterScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { isReady, isAuthenticated, signIn, user } = useAuth();

  // Get character data from store
  const hasCharacter = useUserCharacter((s) => s.hasCharacter());
  const getCharacterData = useUserCharacter((s) => s.getCharacterData);
  const overallScore = useUserCharacter((s) => s.overallScore);
  const ridingType = useUserCharacter((s) => s.ridingType);

  // Get the actual character data if it exists
  const characterData = useMemo(() => {
    if (!hasCharacter) return null;
    const data = getCharacterData();
    return data;
  }, [hasCharacter, getCharacterData]);

  const onOpenLeagueOverview = useCallback(() => {
    router.push("/leagues/overview");
  }, [router]);

  const skills = useMemo(() => {
    return riderCharacter.skills.map((s) => ({
      ...s,
      color: s.color || scoreColor(s.value),
    }));
  }, []);

  const statusQuery = useQuery({
    queryKey: ["strava", "status", "character"],
    enabled: !!(
      isReady &&
      isAuthenticated &&
      ACCOUNTS_ENABLED &&
      SERVER_SYNC_ENABLED
    ),
    queryFn: async () => {
      return await apiFetch("/api/strava/status", { method: "GET" });
    },
  });

  const syncMutation = useMutation({
    mutationFn: async () => {
      return await apiFetch("/api/strava/sync", { method: "POST" });
    },
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: ["strava", "status"] });
      try {
        await runManualSync({ reason: "strava" });
      } catch (e) {
        console.error(e);
      }

      // Navigate to ride review screen to categorize rides
      const inserted = data?.inserted || 0;
      if (inserted > 0) {
        router.push("/(tabs)/ai/strava-ride-review");
      } else {
        Alert.alert("Success", "Strava rides synced");
      }
    },
    onError: (e) => {
      console.error(e);
      Alert.alert("Couldn't sync", "Try again in a bit.");
    },
  });

  const onAddRideWithStrava = useCallback(() => {
    if (!ACCOUNTS_ENABLED || !SERVER_SYNC_ENABLED) {
      Alert.alert(
        "Not available",
        "Strava sync needs Accounts + Server Sync enabled in this build.",
      );
      return;
    }

    if (!isReady) {
      return;
    }

    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    const connected = !!statusQuery.data?.connected;
    if (!connected) {
      router.push("/settings/strava");
      return;
    }

    syncMutation.mutate();
  }, [
    isAuthenticated,
    isReady,
    router,
    signIn,
    statusQuery.data,
    syncMutation,
  ]);

  const onGetRiderCharacterAnalysis = useCallback(() => {
    router.push("/(tabs)/ai/media-analyzer");
  }, [router]);

  const addRideTitle = syncMutation.isPending
    ? "Syncing…"
    : "Add Ride with Strava";

  const disableAddRide = syncMutation.isPending || statusQuery.isLoading;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 28 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* League banner */}
        {FEATURE_LEAGUES_MVP ? (
          <View style={{ marginBottom: spacing.lg }}>
            <LeagueBanner
              user={user}
              expanded={false}
              onPress={onOpenLeagueOverview}
            />
          </View>
        ) : (
          <AppCard style={styles.rankCard}>
            <View style={styles.rankLeft}>
              <View style={styles.trophyWrap}>
                <Trophy size={28} color={colors.warning} strokeWidth={2.5} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rankTier}>
                  {riderCharacter.league.tier}
                </Text>
                <Text style={styles.rankPercentile}>
                  {riderCharacter.league.percentile}
                </Text>
              </View>
            </View>

            <View style={styles.rankRight}>
              <Text style={styles.rankNumber}>
                #{riderCharacter.league.rank}
              </Text>
              <View
                style={[
                  styles.deltaPill,
                  {
                    backgroundColor:
                      riderCharacter.league.delta >= 0
                        ? colors.successSoft
                        : colors.dangerLight,
                    borderColor:
                      riderCharacter.league.delta >= 0
                        ? colors.success
                        : colors.danger,
                  },
                ]}
              >
                <ArrowUpRight
                  size={14}
                  color={
                    riderCharacter.league.delta >= 0
                      ? colors.success
                      : colors.danger
                  }
                  strokeWidth={3}
                />
                <Text
                  style={[
                    styles.deltaText,
                    {
                      color:
                        riderCharacter.league.delta >= 0
                          ? colors.success
                          : colors.danger,
                    },
                  ]}
                >
                  {Math.abs(riderCharacter.league.delta)}
                </Text>
              </View>
            </View>
          </AppCard>
        )}

        {/* Empty State - New Users */}
        {!hasCharacter ? (
          <>
            <AppCard style={styles.emptyCard}>
              <View style={styles.emptyIconWrap}>
                <Sparkles size={32} color={colors.primary} strokeWidth={2.5} />
              </View>

              <Text style={styles.emptyTitle}>
                Discover Your Rider Character
              </Text>
              <Text style={styles.emptySubtitle}>
                Complete your first ride analysis to unlock your personalized
                character, skill breakdown, and riding insights.
              </Text>

              <View style={styles.emptyBenefits}>
                <View style={styles.benefitRow}>
                  <View style={styles.benefitDot} />
                  <Text style={styles.benefitText}>Track your progression</Text>
                </View>
                <View style={styles.benefitRow}>
                  <View style={styles.benefitDot} />
                  <Text style={styles.benefitText}>
                    Get personalized badges
                  </Text>
                </View>
                <View style={styles.benefitRow}>
                  <View style={styles.benefitDot} />
                  <Text style={styles.benefitText}>Compare with friends</Text>
                </View>
              </View>

              <AppButton
                title="Get Rider Character Analysis"
                onPress={onGetRiderCharacterAnalysis}
                icon={
                  <Camera size={20} color={colors.surface} strokeWidth={2.5} />
                }
              />
            </AppCard>

            {/* Stats Update Section */}
            <Text style={styles.sectionTitleSolo}>Or Update Your Stats</Text>

            <AppButton
              title={addRideTitle}
              onPress={onAddRideWithStrava}
              style={styles.cta}
              disabled={disableAddRide}
            />
          </>
        ) : (
          <>
            {/* Character hero - Show actual character data */}
            <AppCard style={styles.heroCard}>
              <View style={styles.heroTopRow}>
                <View style={styles.heroBadge}>
                  <Sparkles
                    size={16}
                    color={colors.primary}
                    strokeWidth={2.5}
                  />
                  <Text style={styles.heroBadgeText}>Rider Character</Text>
                </View>
                <View style={styles.scoreChip}>
                  <Text style={styles.scoreChipLabel}>Overall</Text>
                  <Text style={styles.scoreChipValue}>{overallScore || 0}</Text>
                </View>
              </View>

              <View style={styles.avatarRing}>
                <View style={styles.avatarRingInner}>
                  {characterData?.avatar ? (
                    <Image
                      source={{ uri: characterData.avatar }}
                      style={styles.avatar}
                      contentFit="cover"
                    />
                  ) : null}
                </View>
              </View>

              <Text style={styles.characterName}>
                {characterData?.name || "Unknown Character"}
              </Text>
              <Text style={styles.characterSubtitle}>
                {characterData?.subtitle || ""}
              </Text>

              {ridingType ? (
                <View style={styles.ridingTypePill}>
                  <Text style={styles.ridingTypeText}>
                    Specializes in {ridingType}
                  </Text>
                </View>
              ) : null}
            </AppCard>

            {/* Skill web */}
            <AppCard style={styles.webCard}>
              <Text style={styles.sectionTitle}>Skill Web</Text>
              <Text style={styles.sectionSubtitle}>
                Your riding style, visualized.
              </Text>

              <View style={styles.radarWrap}>
                <SkillRadar
                  skills={skills.map((s) => ({
                    label: s.label,
                    value: s.value,
                  }))}
                  size={280}
                  stroke={colors.primary}
                  fill={colors.primarySoft2}
                />
              </View>
            </AppCard>

            {/* Skill breakdown */}
            <Text style={styles.sectionTitleSolo}>Skill Breakdown</Text>
            <View style={styles.skillList}>
              {skills.map((s) => (
                <View key={s.key} style={styles.skillRowWrap}>
                  <SkillRow label={s.label} value={s.value} color={s.color} />
                </View>
              ))}
            </View>

            {/* Highlights */}
            <Text style={styles.sectionTitleSolo}>Last Ride Highlights</Text>
            <AppCard
              style={styles.highlightCard}
              onPress={() => console.log("Share")}
            >
              <View style={styles.highlightMedia}>
                <Image
                  source={riderCharacter.highlight.image}
                  style={styles.highlightImage}
                  contentFit="cover"
                />
              </View>
              <View style={styles.highlightInfo}>
                <Text style={styles.highlightTitle}>
                  {riderCharacter.highlight.title}
                </Text>
                <Text style={styles.highlightDesc}>
                  {riderCharacter.highlight.description}
                </Text>
                <View style={styles.highlightMetaRow}>
                  <View style={styles.miniChip}>
                    <Text style={styles.miniChipText}>
                      {riderCharacter.highlight.tag}
                    </Text>
                  </View>
                  <View style={styles.sharePill}>
                    <Share2
                      size={14}
                      color={colors.primary}
                      strokeWidth={2.5}
                    />
                    <Text style={styles.sharePillText}>Share</Text>
                  </View>
                </View>
              </View>
            </AppCard>

            {/* Stats Update Section */}
            <Text style={styles.sectionTitleSolo}>Update Your Stats</Text>

            {/* New Primary CTA (requested) */}
            <AppButton
              title={addRideTitle}
              onPress={onAddRideWithStrava}
              style={styles.cta}
              disabled={disableAddRide}
            />

            {/* Ride Analysis Button */}
            <AppButton
              title="Ride Analysis"
              onPress={() => router.push("/(tabs)/ai/media-analyzer")}
              style={styles.cta}
              icon={
                <Camera size={20} color={colors.surface} strokeWidth={2.5} />
              }
            />
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  content: { padding: spacing.xl },

  rankCard: {
    paddingVertical: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.lg,
    backgroundColor: colors.surface,
  },
  rankLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
    flex: 1,
  },
  trophyWrap: {
    width: 56,
    height: 56,
    borderRadius: radius.round,
    backgroundColor: colors.warningSoft,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.warning,
  },
  rankTier: {
    fontSize: 20,
    lineHeight: 22,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  rankPercentile: {
    marginTop: 4,
    fontSize: typography.base,
    lineHeight: 18,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
  rankRight: { alignItems: "flex-end" },
  rankNumber: {
    fontSize: 22,
    lineHeight: 24,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  deltaPill: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.round,
    borderWidth: 1,
  },
  deltaText: {
    fontSize: typography.sm,
    fontFamily: typography.fontFamily.black,
  },

  // Empty state styles
  emptyCard: {
    alignItems: "center",
    paddingVertical: spacing.xxl,
    marginBottom: spacing.lg,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: radius.round,
    backgroundColor: colors.primarySoft,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontSize: 24,
    lineHeight: 28,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    letterSpacing: -0.4,
    textAlign: "center",
    marginBottom: spacing.md,
  },
  emptySubtitle: {
    fontSize: typography.base,
    lineHeight: 22,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  emptyBenefits: {
    width: "100%",
    marginBottom: spacing.xl,
    gap: spacing.md,
  },
  benefitRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  benefitDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  benefitText: {
    fontSize: typography.base,
    fontFamily: typography.fontFamily.medium,
    color: colors.textPrimary,
  },

  heroCard: {
    backgroundColor: colors.surface,
    borderColor: colors.borderLight,
    alignItems: "center",
    paddingVertical: spacing.xxl,
    marginBottom: spacing.lg,
  },
  heroTopRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.lg,
  },
  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.round,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primarySoft2,
  },
  heroBadgeText: {
    fontSize: typography.sm,
    fontFamily: typography.fontFamily.bold,
    color: colors.primary,
  },
  scoreChip: {
    alignItems: "flex-end",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.round,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primarySoft2,
  },
  scoreChipLabel: {
    fontSize: 11,
    fontFamily: typography.fontFamily.semibold,
    color: colors.primary,
  },
  scoreChipValue: {
    marginTop: 2,
    fontSize: 22,
    lineHeight: 22,
    fontFamily: typography.fontFamily.black,
    color: colors.primary,
    letterSpacing: -0.2,
  },

  avatarRing: {
    width: 132,
    height: 132,
    borderRadius: radius.round,
    backgroundColor: colors.primarySoft2,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.primary,
  },
  avatarRingInner: {
    width: 118,
    height: 118,
    borderRadius: radius.round,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatar: {
    width: 112,
    height: 112,
    borderRadius: radius.round,
  },
  characterName: {
    marginTop: spacing.lg,
    fontSize: 26,
    lineHeight: 28,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    letterSpacing: -0.6,
    textAlign: "center",
  },
  characterSubtitle: {
    marginTop: 8,
    fontSize: typography.base,
    lineHeight: 20,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    textAlign: "center",
  },
  ridingTypePill: {
    marginTop: spacing.md,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.round,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primarySoft2,
  },
  ridingTypeText: {
    fontSize: typography.sm,
    fontFamily: typography.fontFamily.bold,
    color: colors.primary,
  },

  webCard: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 22,
    lineHeight: 24,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  sectionSubtitle: {
    marginTop: 6,
    fontSize: typography.base,
    lineHeight: 20,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
  radarWrap: {
    marginTop: spacing.lg,
    alignItems: "center",
  },

  sectionTitleSolo: {
    fontSize: 22,
    lineHeight: 24,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    letterSpacing: -0.2,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  skillList: {},
  skillRowWrap: {
    marginBottom: spacing.md,
  },

  highlightCard: {
    padding: 0,
    overflow: "hidden",
    marginBottom: spacing.xl,
  },
  highlightMedia: {
    height: 160,
    backgroundColor: colors.borderLight,
  },
  highlightImage: {
    width: "100%",
    height: "100%",
  },
  highlightInfo: {
    padding: spacing.lg,
  },
  highlightTitle: {
    fontSize: 20,
    lineHeight: 22,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  highlightDesc: {
    marginTop: 8,
    fontSize: typography.base,
    lineHeight: 20,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
  highlightMetaRow: {
    marginTop: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  miniChip: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: radius.round,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primarySoft2,
  },
  miniChipText: {
    fontSize: typography.sm,
    fontFamily: typography.fontFamily.bold,
    color: colors.primary,
  },
  sharePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: radius.round,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  sharePillText: {
    fontSize: typography.sm,
    fontFamily: typography.fontFamily.bold,
    color: colors.primary,
  },

  cta: {
    marginBottom: spacing.md,
  },
  ctaSecondary: {
    marginBottom: spacing.lg,
  },
});
