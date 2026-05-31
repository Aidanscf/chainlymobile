import React from "react";
import { View, Text, StyleSheet } from "react-native";
import {
  Link,
  Disc,
  Bike,
  SlidersHorizontal,
  ShieldCheck,
} from "lucide-react-native";
import { spacing, typography, colors } from "@/theme/index";
import { HealthTile } from "./HealthTile";

export function HealthBreakdown({ breakdown }) {
  return (
    <>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Health Score Breakdown</Text>
        <Text style={styles.sectionSub}>
          What's feeling great… and what needs love.
        </Text>
      </View>

      <View style={styles.healthGrid}>
        {breakdown.map((b) => {
          let Icon = ShieldCheck;
          if (b.icon === "drivetrain" || b.icon === "chain") Icon = Link;
          if (b.icon === "brakes") Icon = Disc;
          if (b.icon === "suspension") Icon = SlidersHorizontal;
          if (b.icon === "tires") Icon = Bike;

          return (
            <HealthTile
              key={b.key}
              label={b.label}
              score={b.score}
              icon={Icon}
            />
          );
        })}
      </View>
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
  healthGrid: {
    paddingHorizontal: spacing.xl,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: spacing.md,
  },
});
