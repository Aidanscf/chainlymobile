import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Share,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Bookmark } from "lucide-react-native";

import { colors, spacing, typography, radius, shadows } from "@/theme/index";
import AppCard from "@/components/AppCard";
import AppButton from "@/components/AppButton";
import Chip from "@/components/Chip";
import { useTripsStore } from "@/store/trips";
import ScreenHeader from "@/components/layout/ScreenHeader";
import { FEATURE_TRIP_PLANNER_ENABLED } from "@/utils/featureFlags";

export default function AITripShareScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const plan = useTripsStore((s) => s.currentPlan);
  const saveTrip = useTripsStore((s) => s.saveTrip);

  const [saved, setSaved] = useState(false);

  const onBack = useCallback(() => {
    router.back();
  }, [router]);

  const shareText = useMemo(() => {
    if (!plan) {
      return "";
    }
    const dist = plan.summary?.distanceKm ?? 0;
    const climb = plan.summary?.climbingM ?? 0;

    const trails = (plan.shareCardData?.topTrails || []).slice(0, 3).join(", ");

    return `Chainly Trip Plan: ${plan.destination?.name}\n${plan.durationDays} day${plan.durationDays === 1 ? "" : "s"} • ~${dist} km • ~${climb.toLocaleString()} m\nTop trails: ${trails}\n\nBuilt with Chainly AI Trip Planner.`;
  }, [plan]);

  const onShare = useCallback(async () => {
    if (!plan) {
      return;
    }

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (e) {
      // no-op
    }

    try {
      await Share.share({ message: shareText });
    } catch (error) {
      console.error(error);
    }
  }, [plan, shareText]);

  const onSave = useCallback(async () => {
    if (!plan) {
      return;
    }
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      // no-op
    }
    saveTrip(plan);
    setSaved(true);
  }, [plan, saveTrip]);

  const onExportChecklist = useCallback(async () => {
    if (!plan) {
      return;
    }

    const items = (plan.packingChecklist || [])
      .map((i) => `• ${i.label}`)
      .join("\n");
    const msg = `Packing Checklist — ${plan.destination?.name}\n\n${items}`;

    try {
      await Share.share({ message: msg });
    } catch (error) {
      console.error(error);
    }
  }, [plan]);

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
          style={{ padding: spacing.xl, paddingBottom: insets.bottom + 24 }}
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
        <ScreenHeader title="Save + Share" showBack />
        <View style={{ padding: spacing.xl }}>
          <AppCard
            style={{
              backgroundColor: colors.surfaceWarm,
              borderColor: colors.border,
            }}
          >
            <Text style={styles.emptyTitle}>Nothing to share yet</Text>
            <Text style={styles.emptySub}>Generate a trip plan first.</Text>
          </AppCard>
        </View>
      </View>
    );
  }

  const badges = plan.shareCardData?.badges || [];
  const topTrails = (plan.shareCardData?.topTrails || []).slice(0, 3);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScreenHeader title="Save + Share" showBack onBack={onBack} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: spacing.xl,
          paddingBottom: insets.bottom + 24,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Share card preview */}
        <AppCard style={styles.shareCard}>
          <Text style={styles.shareTitle}>{plan.shareCardData?.title}</Text>
          <Text style={styles.shareSub}>{plan.shareCardData?.subtitle}</Text>

          <View style={styles.badgeRow}>
            {badges.map((b) => (
              <Chip key={b} label={b} tone="orange" selected />
            ))}
          </View>

          <View style={styles.trailsWrap}>
            <Text style={styles.sectionLabel}>TOP TRAILS</Text>
            <View style={{ marginTop: spacing.sm, gap: 6 }}>
              {topTrails.map((t) => (
                <Text key={t} style={styles.trailLine}>{`• ${t}`}</Text>
              ))}
            </View>
          </View>

          <View style={{ height: spacing.lg }} />
          <AppButton title="Share Trip" onPress={onShare} size="large" />

          <View style={{ height: spacing.sm }} />

          <AppButton
            title={saved ? "Saved to My Trips" : "Save to My Trips"}
            onPress={onSave}
            variant="secondary"
            disabled={saved}
          />

          <View style={{ height: spacing.sm }} />

          <AppButton
            title="Export Checklist"
            onPress={onExportChecklist}
            variant="ghost"
          />
        </AppCard>

        <View style={{ height: spacing.xl }} />

        <AppCard padding={spacing.lg} style={styles.hintCard}>
          <View style={styles.hintRow}>
            <View style={styles.hintIcon}>
              <Bookmark size={16} color={colors.primary} strokeWidth={2.75} />
            </View>
            <Text style={styles.hintTitle}>Pro move</Text>
          </View>
          <Text style={styles.hintText}>
            Save it first, then share — so you can tweak later without losing
            the vibe.
          </Text>
        </AppCard>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  // REMOVE headerRow/backBtn/title/subtitle styles (now handled by ScreenHeader + in-content headings)

  shareCard: {
    backgroundColor: colors.surface,
    borderColor: colors.borderLight,
  },
  shareTitle: {
    fontSize: 20,
    lineHeight: 22,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  shareSub: {
    marginTop: spacing.xs,
    fontSize: typography.base,
    lineHeight: 19,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
  badgeRow: {
    marginTop: spacing.md,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  trailsWrap: {
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
  trailLine: {
    fontSize: typography.base,
    lineHeight: 19,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textPrimary,
  },

  hintCard: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primarySoft2,
  },
  hintRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  hintIcon: {
    width: 28,
    height: 28,
    borderRadius: radius.round,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primarySoft2,
    alignItems: "center",
    justifyContent: "center",
  },
  hintTitle: {
    fontSize: 16,
    lineHeight: 18,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
  },
  hintText: {
    fontSize: typography.base,
    lineHeight: 19,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
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
