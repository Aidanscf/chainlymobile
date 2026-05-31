import React from "react";
import { View, Text, StyleSheet } from "react-native";
import AppCard from "@/components/AppCard";
import AppButton from "@/components/AppButton";
import { colors, spacing, typography } from "@/theme/index";

export function EmptyStateCard({ title, subtitle, buttonTitle, onPress }) {
  return (
    <AppCard style={styles.emptyCard} padding={spacing.xl} pressable={false}>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptySub}>{subtitle}</Text>
      <View style={{ height: spacing.lg }} />
      <AppButton title={buttonTitle} onPress={onPress} />
    </AppCard>
  );
}

const styles = StyleSheet.create({
  emptyCard: {
    backgroundColor: colors.surfaceWarm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyTitle: {
    fontSize: 18,
    lineHeight: 20,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
  },
  emptySub: {
    marginTop: 8,
    fontSize: typography.base,
    lineHeight: 20,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
});
