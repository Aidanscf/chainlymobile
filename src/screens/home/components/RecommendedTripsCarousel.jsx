import React, { useCallback, useMemo } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useRouter } from "expo-router";

import {
  colors,
  spacing,
  typography,
  radius,
  shadows,
} from "../../../theme/index";
import AppCard from "../../../components/AppCard";
import Chip from "../../../components/Chip";
import {
  baseTripIdeas,
  groupTripsByCategory,
  rankTripsForRider,
} from "../../../utils/tripScoring";
import { useTripsStore } from "../../../store/trips";
import { FEATURE_TRIP_PLANNER_ENABLED } from "@/utils/featureFlags";

function TripCard({ trip, onPress }) {
  return (
    <AppCard style={styles.tripCard} padding={spacing.lg} onPress={onPress}>
      <View style={styles.topRow}>
        <Text style={styles.destination} numberOfLines={1}>
          {trip.destinationLabel}
        </Text>
        <View style={styles.socialPill}>
          <Text style={styles.socialPillText}>{trip.socialProof}</Text>
        </View>
      </View>

      <View style={styles.badgesRow}>
        {(trip.badges || []).slice(0, 3).map((b) => (
          <View key={b} style={styles.badgePill}>
            <Text style={styles.badgeText}>{b}</Text>
          </View>
        ))}
      </View>

      <View style={styles.metaRow}>
        <Text style={styles.metaText}>{trip.durationLabel}</Text>
        <Text style={styles.metaDot}>•</Text>
        <Text style={styles.metaText}>{trip.summary}</Text>
      </View>

      <Text style={styles.hint} numberOfLines={2}>
        {trip.categoryKey === "quick_wins"
          ? "Quick escapes for a fast dopamine hit."
          : trip.categoryKey === "bucket_list"
            ? "Big rides. Big smiles. Big screenshots."
            : "Weekend shred ideas built for your vibe."}
      </Text>
    </AppCard>
  );
}

export default function RecommendedTripsCarousel() {
  const router = useRouter();
  const prefill = useTripsStore((s) => s.prefillAndPreviewFromRecommendation);

  const ranked = useMemo(() => rankTripsForRider(baseTripIdeas), []);
  const grouped = useMemo(() => groupTripsByCategory(ranked), [ranked]);

  const sections = useMemo(() => {
    return [
      {
        key: "quick_wins",
        microcopy: "Quick wins",
        items: grouped.quick_wins.slice(0, 5),
      },
      {
        key: "weekend_shred",
        microcopy: "Weekend shred ideas",
        items: grouped.weekend_shred.slice(0, 5),
      },
      {
        key: "bucket_list",
        microcopy: "Bucket list",
        items: grouped.bucket_list.slice(0, 5),
      },
    ].filter((s) => s.items.length > 0);
  }, [grouped.bucket_list, grouped.quick_wins, grouped.weekend_shred]);

  const openTrip = useCallback(
    async (trip) => {
      try {
        await prefill({
          destinationId: trip.destinationId,
          durationDays: trip.durationDays,
        });
        router.push({
          pathname: "/ai/trip-planner/overview",
          params: { from: "home", recId: trip.id },
        });
      } catch (error) {
        console.error(error);
      }
    },
    [prefill, router],
  );

  if (!FEATURE_TRIP_PLANNER_ENABLED) {
    return null;
  }

  if (sections.length === 0) {
    return null;
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Recommended Trips</Text>
          <Text style={styles.subtitle}>
            Quick escapes, weekend shred, and top trips for your vibe.
          </Text>
        </View>
        <Chip label="Top for your vibe" tone="orange" selected />
      </View>

      {sections.map((section) => (
        <View key={section.key} style={{ marginTop: spacing.xl }}>
          <Text style={styles.sectionTitle}>{section.microcopy}</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.carouselContent}
          >
            {section.items.map((trip) => (
              <View key={trip.id} style={{ marginRight: spacing.md }}>
                <TripCard trip={trip} onPress={() => openTrip(trip)} />
              </View>
            ))}
          </ScrollView>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.xxxl,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  title: {
    fontSize: 22,
    lineHeight: 24,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  subtitle: {
    marginTop: spacing.xs,
    fontSize: typography.sm,
    lineHeight: 16,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },

  sectionTitle: {
    fontSize: typography.sm,
    fontFamily: typography.fontFamily.black,
    color: colors.textSecondary,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: spacing.md,
  },

  carouselContent: {
    paddingRight: spacing.xl,
  },

  tripCard: {
    width: 260,
    backgroundColor: colors.surface,
    borderColor: colors.borderLight,
    ...shadows.small,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  destination: {
    flex: 1,
    fontSize: 16,
    lineHeight: 18,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  socialPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.round,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primarySoft2,
  },
  socialPillText: {
    fontSize: 11,
    fontFamily: typography.fontFamily.bold,
    color: colors.primary,
  },

  badgesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  badgePill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.round,
    backgroundColor: colors.surfaceWarm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  badgeText: {
    fontSize: 12,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
  },

  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.md,
  },
  metaText: {
    fontSize: typography.sm,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textSecondary,
  },
  metaDot: {
    marginHorizontal: 6,
    fontSize: typography.sm,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textSecondary,
  },

  hint: {
    marginTop: spacing.md,
    fontSize: typography.sm,
    lineHeight: 16,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
});
