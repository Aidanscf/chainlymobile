import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, spacing, radius, typography, shadows } from "@/theme/index";

export function Toast({ message }) {
  if (!message) return null;

  return (
    <View pointerEvents="none" style={styles.toastWrap}>
      <View style={styles.toastCard}>
        <Text style={styles.toastText}>{message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  toastWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 24,
    alignItems: "center",
    paddingHorizontal: spacing.xl,
  },
  toastCard: {
    backgroundColor: colors.textPrimary,
    borderRadius: radius.round,
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    ...shadows.large,
  },
  toastText: {
    fontSize: typography.sm,
    fontFamily: typography.fontFamily.black,
    color: "#fff",
  },
});
