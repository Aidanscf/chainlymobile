import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Image } from "expo-image";
import {
  Wrench,
  Link,
  Disc,
  Bike,
  SlidersHorizontal,
} from "lucide-react-native";
import AppCard from "@/components/AppCard";
import AppButton from "@/components/AppButton";
import { colors, spacing, radius, typography } from "@/theme/index";
import { StatusDot } from "./StatusDot";
import { getStateColor } from "../_utils/healthUtils";

export function MechanicWorkbench({
  bike,
  parts,
  displayedHealthScore,
  stravaTitle,
  stravaDisabled,
  onAddRideWithStrava,
  onAddRideManually,
  onSpecSheet,
  onTuneMaintenance,
}) {
  return (
    <AppCard style={styles.workbenchCard}>
      <View style={styles.workbenchTop}>
        <Text style={styles.workbenchTitle}>Mechanic's Workbench</Text>
        <View style={styles.workbenchChip}>
          <Wrench size={14} color={colors.primary} strokeWidth={2.5} />
          <Text style={styles.workbenchChipText}>Spot check</Text>
        </View>
      </View>

      <View style={styles.workbenchCanvas}>
        <Image
          source={bike?.image}
          style={styles.bikeImage}
          contentFit="contain"
          transition={150}
        />

        <StatusDot
          icon={Link}
          score={parts.drivetrain ?? 82}
          style={styles.dotChain}
        />
        <StatusDot
          icon={Disc}
          score={parts.brakes ?? 55}
          style={styles.dotBrakes}
        />
        <StatusDot
          icon={SlidersHorizontal}
          score={parts.suspension ?? 78}
          style={styles.dotSuspension}
        />
        <StatusDot
          icon={Bike}
          score={parts.tires ?? 90}
          style={styles.dotTires}
        />
      </View>

      <View style={styles.healthScoreRow}>
        <Text style={styles.healthScoreLabel}>Health Score</Text>
        <Text
          style={[
            styles.healthScoreValue,
            { color: getStateColor(displayedHealthScore) },
          ]}
        >
          {displayedHealthScore}%
        </Text>
      </View>

      <View style={styles.rideCtaGroup}>
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
      </View>

      <View style={styles.ctaRow}>
        <View style={styles.ctaHalf}>
          <AppButton title="View Spec Sheet" onPress={onSpecSheet} />
        </View>
        <View style={styles.ctaHalf}>
          <AppButton
            title="Tune Maintenance"
            onPress={onTuneMaintenance}
            variant="secondary"
          />
        </View>
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  workbenchCard: {
    marginHorizontal: spacing.xl,
    marginTop: spacing.sm,
  },
  workbenchTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  workbenchTitle: {
    fontSize: 18,
    lineHeight: 20,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  workbenchChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.round,
    borderWidth: 1,
    borderColor: colors.primarySoft2,
  },
  workbenchChipText: {
    fontSize: typography.xs,
    fontFamily: typography.fontFamily.semibold,
    color: colors.primary,
  },
  workbenchCanvas: {
    height: 230,
    borderRadius: radius.xl,
    backgroundColor: colors.surfaceWarm,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  bikeImage: {
    width: "92%",
    height: "92%",
    opacity: 0.95,
  },
  dotChain: {
    left: 14,
    top: 34,
  },
  dotBrakes: {
    right: 14,
    top: 54,
  },
  dotSuspension: {
    left: 24,
    bottom: 54,
  },
  dotTires: {
    right: 24,
    bottom: 34,
  },
  healthScoreRow: {
    marginTop: spacing.lg,
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
  },
  healthScoreLabel: {
    fontSize: typography.base,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textPrimary,
  },
  healthScoreValue: {
    fontSize: 26,
    lineHeight: 28,
    fontFamily: typography.fontFamily.black,
    letterSpacing: -0.5,
  },
  rideCtaGroup: {
    marginTop: spacing.lg,
  },
  ctaRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  ctaHalf: {
    flex: 1,
  },
});
