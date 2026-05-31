import React from "react";
import { Text } from "react-native";
import AppCard from "@/components/AppCard";
import { colors, spacing, typography } from "@/theme/index";

export function SafetyAlert({ safetyAlertText }) {
  if (!safetyAlertText) return null;

  return (
    <AppCard style={styles.safetyCard}>
      <Text style={styles.safetyTitle}>Safety Alert</Text>
      <Text style={styles.safetyText}>{safetyAlertText}</Text>
    </AppCard>
  );
}

const styles = {
  safetyCard: {
    backgroundColor: colors.dangerLight,
    borderWidth: 1,
    borderColor: "#FFD0CD",
  },
  safetyTitle: {
    fontSize: 16,
    lineHeight: 18,
    fontFamily: typography.fontFamily.black,
    color: colors.danger,
    marginBottom: spacing.sm,
  },
  safetyText: {
    fontSize: typography.base,
    lineHeight: 19,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textPrimary,
  },
};
