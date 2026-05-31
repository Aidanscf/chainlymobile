import React from "react";
import { View, Text, StyleSheet } from "react-native";
import AppCard from "@/components/AppCard";
import AppButton from "@/components/AppButton";
import { colors, spacing, typography } from "@/theme/index";
import { Badge } from "./Badge";
import { formatShortDate, formatDistanceKm } from "../_utils/formatters";

export function RecentRidesSection({
  recentRides,
  hasRecentRides,
  stravaTitle,
  stravaDisabled,
  onAddRideWithStrava,
  onAddRideManually,
}) {
  return (
    <>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Rides</Text>
        <Text style={styles.sectionSub}>
          Your latest logs for this bike (manual + Strava).
        </Text>
      </View>

      <AppCard style={styles.recentRidesCard} pressable={false}>
        {!hasRecentRides ? (
          <>
            <Text style={styles.emptyTitle}>
              No rides logged for this bike yet.
            </Text>
            <Text style={styles.emptySub}>
              Add a ride to kick off wear tracking and unlock quests.
            </Text>
            <View style={{ height: spacing.lg }} />
            <AppButton
              title={stravaTitle}
              onPress={onAddRideWithStrava}
              disabled={stravaDisabled}
            />
            <View style={{ height: spacing.md }} />
            <AppButton
              title="Add Ride Manually"
              onPress={onAddRideManually}
              variant="secondary"
            />
          </>
        ) : (
          recentRides.map((r, idx) => {
            const whenIso =
              r?.ride_at ||
              r?.ride_date ||
              r?.start_date ||
              r?.created_at ||
              null;
            const when = formatShortDate(whenIso);

            const distanceRaw =
              r?.distance_km ?? r?.distance ?? r?.distanceKm ?? null;
            const distanceLabel =
              distanceRaw == null ? "" : formatDistanceKm(distanceRaw);

            const durationRaw =
              r?.duration_minutes ??
              r?.duration_min ??
              r?.durationMinutes ??
              null;
            const durationLabel =
              durationRaw == null ? "" : `${Number(durationRaw)} min`;

            const elevationRaw =
              r?.elevation_gain_m ??
              r?.elevation_gain ??
              r?.elevationGainM ??
              null;
            const elevationLabel =
              elevationRaw == null
                ? ""
                : `${Math.round(Number(elevationRaw))} m`;

            const meta = [distanceLabel, durationLabel, elevationLabel]
              .filter(Boolean)
              .join(" • ");

            const src = String(r?.source || "");
            const isStrava = src === "strava";

            const rowBorder = idx === 0 ? null : styles.rideRowBorder;

            return (
              <View
                key={String(r?.id || idx)}
                style={[styles.rideRow, rowBorder]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.rideTitle}>{when || "Ride"}</Text>
                  {meta ? <Text style={styles.rideMeta}>{meta}</Text> : null}
                </View>

                <Badge
                  tone={isStrava ? "due" : "done"}
                  text={isStrava ? "Strava" : "Manual"}
                />
              </View>
            );
          })
        )}
      </AppCard>
    </>
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    marginTop: spacing.xxl,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  sectionTitle: {
    fontSize: 20,
    lineHeight: 22,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  sectionSub: {
    marginTop: 6,
    fontSize: typography.base,
    lineHeight: 19,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
  recentRidesCard: {
    marginHorizontal: spacing.xl,
  },
  emptyTitle: {
    fontSize: 16,
    lineHeight: 18,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
  },
  emptySub: {
    marginTop: 6,
    fontSize: typography.base,
    lineHeight: 20,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
  rideRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
  },
  rideRowBorder: {
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  rideTitle: {
    fontSize: typography.base,
    lineHeight: 18,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  rideMeta: {
    marginTop: 3,
    fontSize: typography.sm,
    lineHeight: 16,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
});
