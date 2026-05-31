import React, { useMemo } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChevronLeft } from "lucide-react-native";

import { colors, spacing, radius, typography, shadows } from "@/theme/index";

export default function OnboardingTopBar({
  title,
  stepIndex = null,
  stepCount = null,
  onBack,
  rightSlot = null,
}) {
  const insets = useSafeAreaInsets();

  const stepLabel = useMemo(() => {
    if (typeof stepIndex !== "number" || typeof stepCount !== "number") {
      return null;
    }
    return `Step ${stepIndex + 1} of ${stepCount}`;
  }, [stepCount, stepIndex]);

  return (
    <View style={{ paddingTop: insets.top, paddingHorizontal: spacing.xl }}>
      <View style={styles.row}>
        {onBack ? (
          <Pressable
            onPress={onBack}
            hitSlop={10}
            style={styles.backBtn}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <ChevronLeft size={22} color={colors.textPrimary} strokeWidth={3} />
          </Pressable>
        ) : (
          <View style={{ width: 44, height: 44 }} />
        )}

        <View style={{ flex: 1, alignItems: "center" }}>
          {title ? <Text style={styles.title}>{title}</Text> : null}
          {stepLabel ? <Text style={styles.step}>{stepLabel}</Text> : null}
        </View>

        <View style={{ width: 44, height: 44, alignItems: "flex-end" }}>
          {rightSlot}
        </View>
      </View>

      {typeof stepIndex === "number" && typeof stepCount === "number" ? (
        <View style={styles.track}>
          <View
            style={[
              styles.fill,
              { width: `${Math.round(((stepIndex + 1) / stepCount) * 100)}%` },
            ]}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    height: 56,
    marginTop: spacing.sm,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.sm,
    ...shadows.small,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.round,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 14,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  step: {
    marginTop: 2,
    fontSize: 11,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textSecondary,
  },

  track: {
    marginTop: spacing.md,
    height: 10,
    borderRadius: radius.round,
    backgroundColor: colors.borderLight,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    backgroundColor: colors.primary,
    borderRadius: radius.round,
  },
});
