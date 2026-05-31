import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";

import { colors, spacing, radius, typography, shadows } from "@/theme/index";

export default function MicroAdjustmentCard({
  icon: Icon,
  title,
  // subtitle intentionally unused: per UX, these tiles should be fast + scannable
  subtitle,
  onPress,
  style,
}) {
  return (
    <Pressable onPress={onPress} style={[styles.card, style]} hitSlop={10}>
      <View style={styles.iconWrap}>
        <Icon size={18} color={colors.primary} strokeWidth={2.75} />
      </View>
      <Text style={styles.title} numberOfLines={2}>
        {title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.small,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.round,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primarySoft2,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  title: {
    textAlign: "center",
    fontSize: typography.base,
    lineHeight: 18,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
});
