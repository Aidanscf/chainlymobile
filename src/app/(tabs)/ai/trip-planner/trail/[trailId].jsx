import React, { useCallback, useMemo } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as Linking from "expo-linking";
import { Image } from "expo-image";

import { colors, spacing, typography, radius } from "@/theme/index";
import AppCard from "@/components/AppCard";
import AppButton from "@/components/AppButton";
import Chip from "@/components/Chip";
import ScreenHeader from "@/components/layout/ScreenHeader";
import { useTripsStore } from "@/store/trips";
import {
  getTrailById,
  difficultyTone,
  formatDifficultyLabel,
} from "../../../../../services/trailsService";
import { whyThisFitsText } from "@/utils/tripScoring";
import { FEATURE_TRIP_PLANNER_ENABLED } from "@/utils/featureFlags";

export default function AITripTrailDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();

  const plan = useTripsStore((s) => s.currentPlan);

  const trailId = useMemo(() => {
    const raw = params?.trailId;
    return String(Array.isArray(raw) ? raw[0] : raw || "");
  }, [params?.trailId]);

  const trail = useMemo(() => {
    if (!trailId) return null;
    const fromPlan = Array.isArray(plan?.featuredTrails)
      ? plan.featuredTrails.find((t) => String(t?.id) === String(trailId))
      : null;
    if (fromPlan) {
      return fromPlan;
    }
    return getTrailById(trailId);
  }, [plan?.featuredTrails, trailId]);

  const diffLabel = useMemo(() => {
    if (!trail) return "";
    return formatDifficultyLabel(trail.difficulty);
  }, [trail]);

  const chipTone = useMemo(() => {
    const tone = difficultyTone(trail?.difficulty);
    return tone === "red" ? "red" : tone === "green" ? "green" : "neutral";
  }, [trail]);

  const whyText = useMemo(() => {
    if (!plan || !trail) {
      return "";
    }
    return whyThisFitsText({
      trip: { socialProof: "you’ll like this" },
      riderProfile: plan.riderProfile,
      preferences: plan.preferences,
    });
  }, [plan, trail]);

  const onBack = useCallback(() => {
    router.back();
  }, [router]);

  const onOpenMaps = useCallback(async () => {
    if (!plan?.destination) {
      return;
    }

    const { lat, lng, name } = plan.destination;

    const latNum = Number(lat);
    const lngNum = Number(lng);
    const hasCoords = Number.isFinite(latNum) && Number.isFinite(lngNum);

    const query = hasCoords
      ? `${latNum},${lngNum} (${name})`
      : String(name || "");

    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      query,
    )}`;

    try {
      const can = await Linking.canOpenURL(url);
      if (!can) {
        return;
      }
      await Linking.openURL(url);
    } catch (error) {
      console.error(error);
    }
  }, [plan?.destination]);

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

  if (!trail) {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" />
        <ScreenHeader title="Trail Detail" showBack onBack={onBack} />

        <View style={{ padding: spacing.xl }}>
          <AppCard
            style={{
              backgroundColor: colors.surfaceWarm,
              borderColor: colors.border,
            }}
          >
            <Text style={styles.emptyTitle}>Trail not found</Text>
            <Text style={styles.emptySub}>
              Try another trail from the map list.
            </Text>
          </AppCard>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <ScreenHeader title="Trail Detail" showBack onBack={onBack} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: spacing.xl,
          paddingBottom: insets.bottom + 24,
        }}
        showsVerticalScrollIndicator={false}
      >
        <AppCard style={styles.heroCard} padding={0}>
          <Image
            source={trail.image}
            style={styles.heroImage}
            contentFit="cover"
            transition={150}
          />
          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>{trail.name}</Text>
            <View style={styles.heroMetaRow}>
              <Chip label={diffLabel} tone={chipTone} selected />
              <View style={styles.heroPill}>
                <Text
                  style={styles.heroPillText}
                >{`${trail.distanceKm} km • ${trail.climbingM} m`}</Text>
              </View>
            </View>

            <Text style={styles.whyText}>{whyText}</Text>
          </View>
        </AppCard>

        <View style={{ height: spacing.xl }} />

        <AppCard style={styles.notesCard}>
          <Text style={styles.notesTitle}>Why you’ll like it</Text>
          <Text style={styles.notesText}>{whyText}</Text>
          <Text style={[styles.notesText, { marginTop: spacing.md }]}>
            Pro tip: ride it once smooth, then spice it up.
          </Text>
        </AppCard>

        <View style={{ height: spacing.xl }} />

        <AppButton
          title="Open area in Maps"
          onPress={onOpenMaps}
          variant="secondary"
        />

        <View style={{ height: spacing.sm }} />

        <AppButton title="Back to Trails" onPress={() => router.back()} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  heroCard: {
    overflow: "hidden",
    backgroundColor: colors.surface,
    borderColor: colors.borderLight,
  },
  heroImage: {
    width: "100%",
    height: 180,
  },
  heroContent: {
    padding: spacing.xl,
  },
  heroTitle: {
    fontSize: 20,
    lineHeight: 22,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  heroMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  heroPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.round,
    backgroundColor: colors.surfaceWarm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  heroPillText: {
    fontSize: typography.sm,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
  },
  whyText: {
    marginTop: spacing.md,
    fontSize: typography.base,
    lineHeight: 19,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },

  notesCard: {
    backgroundColor: colors.surfaceWarm,
    borderColor: colors.border,
  },
  notesTitle: {
    fontSize: 16,
    lineHeight: 18,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
  },
  notesText: {
    marginTop: spacing.sm,
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
