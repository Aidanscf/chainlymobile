import React, { useCallback, useMemo } from "react";
import { View, Text, StyleSheet, Pressable, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { ChevronLeft } from "lucide-react-native";

import { colors, spacing, radius, shadows, typography } from "@/theme/index";
import useAccentColor from "@/utils/useAccentColor";

/**
 * Boxed header used on all pushed screens.
 * Root tab screens should use their own branded top bar.
 */
export default function ScreenHeader({
  title,
  showBack = true,
  rightAction = null,
  accentColor: accentOverride = null,
  onBack = null,
}) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const derivedAccent = useAccentColor();

  const accentColor = accentOverride || derivedAccent || colors.primary;

  const handleBack = useCallback(async () => {
    try {
      // If a screen provides its own back handler, let it fully control behavior.
      if (onBack) {
        await onBack();
        return;
      }

      if (Platform.OS !== "web") {
        await Haptics.selectionAsync();
      }
    } catch (e) {
      // no-op
    }

    try {
      router.back();
    } catch (e) {
      console.error(e);
    }
  }, [onBack, router]);

  const containerStyle = useMemo(() => {
    return {
      paddingTop: insets.top,
    };
  }, [insets.top]);

  const rightSlot = rightAction ? (
    rightAction
  ) : (
    <View style={styles.sideSlot} />
  );

  return (
    <View style={containerStyle}>
      <View style={styles.outer}>
        <View style={styles.box}>
          {showBack ? (
            <Pressable
              onPress={handleBack}
              hitSlop={10}
              style={styles.backHit}
              accessibilityRole="button"
              accessibilityLabel="Back"
            >
              <ChevronLeft size={22} color={accentColor} strokeWidth={3} />
            </Pressable>
          ) : (
            <View style={styles.sideSlot} />
          )}

          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>

          <View style={styles.rightWrap}>{rightSlot}</View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
  },

  box: {
    height: 56,
    paddingHorizontal: spacing.md,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    ...shadows.small,
  },

  backHit: {
    width: 44,
    height: 44,
    borderRadius: radius.round,
    alignItems: "center",
    justifyContent: "center",
  },

  sideSlot: {
    width: 44,
    height: 44,
  },

  title: {
    flex: 1,
    textAlign: "center",
    paddingHorizontal: spacing.sm,
    fontSize: 16,
    lineHeight: 18,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },

  rightWrap: {
    minWidth: 44,
    height: 44,
    alignItems: "flex-end",
    justifyContent: "center",
  },
});
