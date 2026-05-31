import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, spacing, radius, typography } from "../theme/index";

const StatPill = ({
  label,
  value,
  color = colors.primary,
  backgroundColor,
}) => {
  const bg = backgroundColor || colors.surfaceWarm;

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, { color }]}>{value}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  label: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    fontFamily: typography.fontFamily.regular,
  },
  value: {
    fontSize: 28,
    fontFamily: typography.fontFamily.black,
    lineHeight: 30,
    letterSpacing: -0.3,
  },
});

export default StatPill;
