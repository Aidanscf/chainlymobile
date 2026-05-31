import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, spacing, radius, typography } from "@/theme/index";

export function Badge({ tone, text }) {
  const bg =
    tone === "urgent"
      ? colors.dangerLight
      : tone === "due"
        ? colors.warningSoft
        : colors.successSoft;

  const fg =
    tone === "urgent"
      ? colors.danger
      : tone === "due"
        ? colors.warning
        : colors.success;

  const border =
    tone === "urgent" ? "#FFD0CD" : tone === "due" ? "#FFE2B8" : "#CCF4DF";

  return (
    <View style={[styles.badge, { backgroundColor: bg, borderColor: border }]}>
      <Text style={[styles.badgeText, { color: fg }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.round,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: typography.xs,
    lineHeight: 14,
    fontFamily: typography.fontFamily.black,
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
});

export default Badge;
