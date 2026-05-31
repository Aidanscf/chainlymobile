import React from "react";
import { Text, StyleSheet } from "react-native";
import { colors, spacing, typography } from "@/theme/index";

export function SectionHeader({ title }) {
  return <Text style={styles.sectionHeaderText}>{title}</Text>;
}

const styles = StyleSheet.create({
  sectionHeaderText: {
    marginBottom: spacing.sm,
    fontSize: 18,
    lineHeight: 20,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
});
