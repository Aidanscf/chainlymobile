import React from "react";
import { View, Text } from "react-native";
import AppCard from "@/components/AppCard";
import AppButton from "@/components/AppButton";
import { colors, spacing, typography } from "@/theme/index";

export function ErrorCard({ error, onRetry }) {
  if (!error) return null;

  return (
    <AppCard style={styles.errorCard}>
      <Text style={styles.errorTitle}>Something went wrong</Text>
      <Text style={styles.errorText}>{error}</Text>
      <View style={{ marginTop: spacing.md }}>
        <AppButton title="Try again" onPress={onRetry} />
      </View>
    </AppCard>
  );
}

const styles = {
  errorCard: {
    backgroundColor: colors.dangerLight,
    borderWidth: 1,
    borderColor: "#FFD0CD",
    marginBottom: spacing.lg,
  },
  errorTitle: {
    fontSize: 16,
    lineHeight: 18,
    fontFamily: typography.fontFamily.black,
    color: colors.danger,
    marginBottom: spacing.sm,
  },
  errorText: {
    fontSize: typography.base,
    lineHeight: 19,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textPrimary,
  },
};
