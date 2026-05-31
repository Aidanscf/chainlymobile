import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { Map as MapIcon, List, ChevronRight } from "lucide-react-native";

import { colors, spacing, typography, radius, shadows } from "@/theme/index";
import AppCard from "@/components/AppCard";
import AppButton from "@/components/AppButton";
import Chip from "@/components/Chip";
import { useTripsStore } from "@/store/trips";
import {
  difficultyTone,
  formatDifficultyLabel,
  listTrailsForDestination,
} from "../../../../services/trailsService";
import { whyThisFitsText } from "@/utils/tripScoring";
import ScreenHeader from "@/components/layout/ScreenHeader";
import { FEATURE_TRIP_PLANNER_ENABLED } from "@/utils/featureFlags";

// Conditionally import MapView only on native platforms
let MapView, Marker, PROVIDER_GOOGLE;
if (Platform.OS !== "web") {
  const Maps = require("react-native-maps");
  MapView = Maps.default;
  Marker = Maps.Marker;
  PROVIDER_GOOGLE = Maps.PROVIDER_GOOGLE;
}

function TrailCard({ trail, whyText, onPress }) {
  const tone = difficultyTone(trail.difficulty);
  const diffLabel = formatDifficultyLabel(trail.difficulty);
  const chipTone =
    tone === "red" ? "red" : tone === "green" ? "green" : "neutral";

  return (
    <AppCard padding={spacing.lg} style={styles.trailCard} onPress={onPress}>
      <View style={styles.trailTopRow}>
        <Text style={styles.trailName} numberOfLines={1}>
          {trail.name}
        </Text>
        <ChevronRight
          size={18}
          color={colors.textSecondary}
          strokeWidth={2.75}
        />
      </View>

      <View style={{ marginTop: spacing.sm }}>
        <Chip label={diffLabel} tone={chipTone} selected />
      </View>

      <Text
        style={styles.trailMeta}
      >{`${trail.distanceKm} km • ${trail.climbingM} m`}</Text>
      <Text style={styles.trailWhy} numberOfLines={2}>
        {whyText}
      </Text>
    </AppCard>
  );
}

export default function AITripPlannerMapScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const plan = useTripsStore((s) => s.currentPlan);

  // On web, force list mode; on native, allow toggle
  const [mode, setMode] = useState("list");
  const [selectedTrailId, setSelectedTrailId] = useState(null);

  const destination = plan?.destination;

  const baseLat = useMemo(() => {
    const n = Number(destination?.lat);
    return Number.isFinite(n) ? n : null;
  }, [destination?.lat]);

  const baseLng = useMemo(() => {
    const n = Number(destination?.lng);
    return Number.isFinite(n) ? n : null;
  }, [destination?.lng]);

  const hasCoords = useMemo(() => {
    return baseLat !== null && baseLng !== null;
  }, [baseLat, baseLng]);

  const trails = useMemo(() => {
    if (!destination) return [];
    // Prefer the current plan's trail list (AI-backed plans may not exist in the mock dataset)
    const planned = Array.isArray(plan?.featuredTrails)
      ? plan.featuredTrails
      : [];
    if (planned.length) {
      return planned;
    }
    return listTrailsForDestination(destination.id);
  }, [destination, plan?.featuredTrails]);

  const region = useMemo(() => {
    const fallback = {
      latitude: 37.7749,
      longitude: -122.4194,
      latitudeDelta: 0.08,
      longitudeDelta: 0.08,
    };

    if (!destination || !hasCoords) {
      return fallback;
    }

    return {
      latitude: baseLat,
      longitude: baseLng,
      latitudeDelta: 0.12,
      longitudeDelta: 0.12,
    };
  }, [baseLat, baseLng, destination, hasCoords]);

  const selectedTrail = useMemo(() => {
    return trails.find((t) => t.id === selectedTrailId) || null;
  }, [selectedTrailId, trails]);

  const onBack = useCallback(() => {
    router.back();
  }, [router]);

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

  if (!plan || !destination) {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" />
        <ScreenHeader title="Trails" showBack />
        <View style={{ padding: spacing.xl }}>
          <AppCard
            style={{
              backgroundColor: colors.surfaceWarm,
              borderColor: colors.border,
            }}
          >
            <Text style={styles.emptyTitle}>No trails yet</Text>
            <Text style={styles.emptySub}>Generate a trip plan first.</Text>
          </AppCard>
        </View>
      </View>
    );
  }

  const isWeb = Platform.OS === "web";

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <ScreenHeader title="Trails" showBack onBack={onBack} />

      {!isWeb && (
        <View style={styles.modeRow}>
          <Pressable onPress={() => setMode("list")} style={{ flex: 1 }}>
            <View
              style={[
                styles.modePill,
                mode === "list" && styles.modePillActive,
              ]}
            >
              <List
                size={16}
                color={mode === "list" ? colors.primary : colors.textSecondary}
                strokeWidth={2.75}
              />
              <Text
                style={[
                  styles.modeText,
                  mode === "list" && { color: colors.primary },
                ]}
              >
                List
              </Text>
            </View>
          </Pressable>
          <Pressable onPress={() => setMode("map")} style={{ flex: 1 }}>
            <View
              style={[styles.modePill, mode === "map" && styles.modePillActive]}
            >
              <MapIcon
                size={16}
                color={mode === "map" ? colors.primary : colors.textSecondary}
                strokeWidth={2.75}
              />
              <Text
                style={[
                  styles.modeText,
                  mode === "map" && { color: colors.primary },
                ]}
              >
                Map
              </Text>
            </View>
          </Pressable>
        </View>
      )}

      {mode === "map" && !isWeb ? (
        <View style={{ flex: 1 }}>
          <MapView
            provider={PROVIDER_GOOGLE}
            style={{ flex: 1 }}
            initialRegion={region}
          >
            {trails.map((t, idx) => {
              // Slightly spread markers so they’re not all stacked.
              const originLat = hasCoords ? baseLat : region.latitude;
              const originLng = hasCoords ? baseLng : region.longitude;
              const lat = originLat + (idx % 3) * 0.003;
              const lng = originLng + (idx % 4) * 0.003;
              return (
                <Marker
                  key={t.id}
                  coordinate={{ latitude: lat, longitude: lng }}
                  title={t.name}
                  onPress={() => setSelectedTrailId(t.id)}
                />
              );
            })}
          </MapView>

          {selectedTrail ? (
            <View style={styles.mapBottomCardWrap}>
              <TrailCard
                trail={selectedTrail}
                whyText={whyThisFitsText({
                  trip: { socialProof: "perfect match" },
                  riderProfile: plan.riderProfile,
                  preferences: plan.preferences,
                })}
                onPress={() =>
                  router.push({
                    pathname: "/ai/trip-planner/trail/[trailId]",
                    params: { trailId: selectedTrail.id },
                  })
                }
              />
            </View>
          ) : null}
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            padding: spacing.xl,
            paddingBottom: insets.bottom + 24,
          }}
          showsVerticalScrollIndicator={false}
        >
          <View style={{ gap: spacing.md }}>
            {trails.map((t) => (
              <TrailCard
                key={t.id}
                trail={t}
                whyText={whyThisFitsText({
                  trip: { socialProof: "your vibe" },
                  riderProfile: plan.riderProfile,
                  preferences: plan.preferences,
                })}
                onPress={() =>
                  router.push({
                    pathname: "/ai/trip-planner/trail/[trailId]",
                    params: { trailId: t.id },
                  })
                }
              />
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  modeRow: {
    flexDirection: "row",
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  modePill: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: radius.round,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.small,
  },
  modePillActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  modeText: {
    fontSize: typography.base,
    fontFamily: typography.fontFamily.black,
    color: colors.textSecondary,
  },

  trailCard: {
    backgroundColor: colors.surface,
    borderColor: colors.borderLight,
  },
  trailTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  trailName: {
    flex: 1,
    fontSize: 16,
    lineHeight: 18,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
  },
  trailMeta: {
    marginTop: spacing.sm,
    fontSize: typography.sm,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textSecondary,
  },
  trailWhy: {
    marginTop: 6,
    fontSize: typography.sm,
    lineHeight: 16,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },

  mapBottomCardWrap: {
    position: "absolute",
    left: spacing.xl,
    right: spacing.xl,
    bottom: spacing.xl,
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
