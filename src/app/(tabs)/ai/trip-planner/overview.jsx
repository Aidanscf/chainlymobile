import React, { useCallback, useMemo } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { ChevronRight, ShieldCheck, Route } from "lucide-react-native";

import { colors, spacing, typography, radius, shadows } from "@/theme/index";
import AppCard from "@/components/AppCard";
import AppButton from "@/components/AppButton";
import Chip from "@/components/Chip";
import { useTripsStore } from "@/store/trips";
import { whyThisFitsText } from "@/utils/tripScoring";
import ScreenHeader from "@/components/layout/ScreenHeader";
import { FEATURE_TRIP_PLANNER_ENABLED } from "@/utils/featureFlags";

export default function AITripPlannerOverviewScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();

  const plan = useTripsStore((s) => s.currentPlan);
  const wizard = useTripsStore((s) => s.wizard);
  const loading = useTripsStore((s) => s.loading);
  const generateFull = useTripsStore((s) => s.generateFullPlanFromPreview);

  const onBack = useCallback(() => {
    router.back();
  }, [router]);

  const fitText = useMemo(() => {
    if (!plan) {
      return "";
    }
    // We don't have the exact rec in state, so use a generic fit message.
    return whyThisFitsText({
      trip: { socialProof: "high reward" },
      riderProfile: plan.riderProfile,
      preferences: plan.preferences,
    });
  }, [plan]);

  const onViewItinerary = useCallback(async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (e) {
      // no-op
    }

    try {
      await generateFull();
      router.push("/ai/trip-planner/results");
    } catch (error) {
      console.error(error);
    }
  }, [generateFull, router]);

  const topStats = useMemo(() => {
    if (!plan) {
      return null;
    }
    const dist = plan.summary?.distanceKm ?? 0;
    const climb = plan.summary?.climbingM ?? 0;
    return `${plan.durationDays} day${plan.durationDays === 1 ? "" : "s"} • ~${dist} km • ~${climb.toLocaleString()} m`;
  }, [plan]);

  const subtitle = useMemo(() => {
    const fromHome = params?.from === "home";
    if (fromHome) {
      return "Trip Plan Preview — made from your Recommended Trips pick.";
    }
    return "Trip Plan Preview — tweak anything, then generate the full itinerary.";
  }, [params?.from]);

  if (!FEATURE_TRIP_PLANNER_ENABLED) {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" />
        <ScreenHeader
          title="Trip Planner"
          showBack
          onBack={() => router.replace("/ai")}
        />
        <View
          style={{ padding: spacing.xl, paddingBottom: insets.bottom + 28 }}
        >
          <AppCard
            pressable={false}
            style={{
              backgroundColor: colors.surfaceWarm,
              borderColor: colors.border,
            }}
          >
            <Text style={styles.emptyTitle}>
              Trip Planner coming back soon.
            </Text>
            <Text style={styles.emptySub}>
              We’re polishing a new version. Check back soon.
            </Text>
            <View style={{ height: spacing.lg }} />
            <AppButton
              title="Back to AI Hub"
              onPress={() => router.replace("/ai")}
            />
          </AppCard>
        </View>
      </View>
    );
  }

  if (!plan) {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" />
        <ScreenHeader title="Trip Preview" showBack />
        <View style={{ padding: spacing.xl }}>
          <AppCard
            style={{
              backgroundColor: colors.surfaceWarm,
              borderColor: colors.border,
            }}
          >
            <Text style={styles.emptyTitle}>No plan yet</Text>
            <Text style={styles.emptySub}>
              Head back to the wizard and generate a plan.
            </Text>
            <View style={{ height: spacing.lg }} />
            <AppButton
              title="Open Trip Wizard"
              onPress={() => router.replace("/ai/trip-planner")}
            />
          </AppCard>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <ScreenHeader title="Trip Preview" showBack onBack={onBack} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: spacing.xl,
          paddingBottom: insets.bottom + 28,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Plan Your Adventure</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>

        <AppCard style={styles.previewCard}>
          <View style={styles.previewTopRow}>
            <View style={styles.previewIcon}>
              <Route size={18} color={colors.primary} strokeWidth={2.75} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.previewTitle}>{plan.destination?.name}</Text>
              <Text style={styles.previewMeta}>{topStats}</Text>
            </View>
            <Chip label="Shareable" tone="orange" selected />
          </View>

          <Text style={styles.fitText}>{fitText}</Text>

          <View style={styles.itinPreviewWrap}>
            <Text style={styles.sectionLabel}>DAILY ITINERARY (PREVIEW)</Text>
            <View style={{ gap: spacing.sm, marginTop: spacing.md }}>
              {(plan.itineraryDays || []).slice(0, 3).map((d) => (
                <View key={d.id} style={styles.itinRow}>
                  <Text style={styles.itinRowTitle} numberOfLines={1}>
                    {d.title}
                  </Text>
                  <ChevronRight
                    size={18}
                    color={colors.textSecondary}
                    strokeWidth={2.75}
                  />
                </View>
              ))}
            </View>
          </View>
        </AppCard>

        <View style={{ height: spacing.xl }} />

        <View style={styles.twoColRow}>
          <AppCard padding={spacing.lg} style={styles.smallCard}>
            <View style={styles.smallTop}>
              <ShieldCheck
                size={18}
                color={colors.success}
                strokeWidth={2.75}
              />
              <Text style={styles.smallTitle}>Logistics</Text>
            </View>
            <Text style={styles.smallSub}>
              Stay + food picks included so you don’t end up eating gas-station
              jerky.
            </Text>
          </AppCard>

          <AppCard padding={spacing.lg} style={styles.smallCard}>
            <View style={styles.smallTop}>
              <ShieldCheck
                size={18}
                color={colors.warning}
                strokeWidth={2.75}
              />
              <Text style={styles.smallTitle}>Safety</Text>
            </View>
            <Text style={styles.smallSub}>
              Access notes + send-smart reminders.
            </Text>
          </AppCard>
        </View>

        <View style={{ height: spacing.xl }} />

        <AppButton
          title={loading ? "Generating…" : "View Itinerary"}
          onPress={onViewItinerary}
          size="large"
          loading={loading}
        />

        <Text style={styles.ctaNote}>
          You can still tweak difficulty, vibes, and budget in the wizard.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  title: {
    fontSize: 32,
    lineHeight: 34,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    letterSpacing: -0.6,
  },
  subtitle: {
    marginTop: spacing.sm,
    fontSize: typography.base,
    lineHeight: 20,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },

  previewCard: {
    backgroundColor: colors.surface,
    borderColor: colors.borderLight,
  },
  previewTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  previewIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.round,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primarySoft2,
    alignItems: "center",
    justifyContent: "center",
  },
  previewTitle: {
    fontSize: 18,
    lineHeight: 20,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  previewMeta: {
    marginTop: 4,
    fontSize: typography.sm,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textSecondary,
  },

  fitText: {
    marginTop: spacing.lg,
    fontSize: typography.base,
    lineHeight: 19,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },

  itinPreviewWrap: {
    marginTop: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: spacing.xl,
  },
  sectionLabel: {
    fontSize: typography.xs,
    fontFamily: typography.fontFamily.black,
    color: colors.textSecondary,
    letterSpacing: 1.1,
  },
  itinRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceWarm,
  },
  itinRowTitle: {
    flex: 1,
    marginRight: spacing.sm,
    fontSize: 15,
    lineHeight: 18,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
  },

  twoColRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  smallCard: {
    flex: 1,
    backgroundColor: colors.surfaceWarm,
    borderColor: colors.border,
  },
  smallTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  smallTitle: {
    fontSize: 16,
    lineHeight: 18,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
  },
  smallSub: {
    fontSize: typography.sm,
    lineHeight: 16,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },

  ctaNote: {
    marginTop: spacing.md,
    fontSize: typography.sm,
    lineHeight: 17,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textSecondary,
    textAlign: "center",
  },

  emptyTitle: {
    fontSize: 18,
    lineHeight: 20,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
  },
  emptySub: {
    marginTop: 6,
    fontSize: typography.base,
    lineHeight: 19,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
});
