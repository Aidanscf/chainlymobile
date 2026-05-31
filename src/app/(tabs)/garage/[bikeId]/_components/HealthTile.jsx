import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, spacing, radius, typography } from "@/theme/index";
import { getStateColor } from "../_utils/healthUtils";

export function HealthTile({ label, score, icon: Icon }) {
  const c = getStateColor(score);

  return (
    <View style={styles.healthTile}>
      <View style={[styles.healthIconWrap, { borderColor: colors.border }]}>
        <Icon size={18} color={c} strokeWidth={2.5} />
      </View>
      <Text style={styles.healthLabel}>{label}</Text>
      <Text style={[styles.healthScore, { color: c }]}>{score}%</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  healthTile: {
    width: "48%",
    padding: spacing.lg,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  healthIconWrap: {
    width: 34,
    height: 34,
    borderRadius: radius.round,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    backgroundColor: colors.surfaceWarm,
    marginBottom: spacing.sm,
  },
  healthLabel: {
    fontSize: typography.sm,
    lineHeight: 16,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textSecondary,
  },
  healthScore: {
    marginTop: 6,
    fontSize: 20,
    lineHeight: 22,
    fontFamily: typography.fontFamily.black,
    letterSpacing: -0.2,
  },
});
