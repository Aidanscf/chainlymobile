import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";

import AppButton from "@/components/AppButton";
import { colors, spacing, typography } from "@/theme/index";

export default function StickyCTA({
  primaryTitle,
  onPrimary,
  primaryDisabled = false,
  primaryLoading = false,
  primaryIcon = null,
  secondaryTitle = null,
  onSecondary = null,
  footnote = null,
  variant = "default", // default | warm | dark
  enhanced = false, // new enhanced style for welcome screen
  compact = false,
}) {
  const insets = useSafeAreaInsets();

  const bg =
    variant === "dark"
      ? "transparent"
      : variant === "warm"
        ? colors.surfaceWarm
        : colors.appBackground;

  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 14) }]}>
      <View
        style={[
          styles.inner,
          compact ? styles.innerCompact : null,
          { backgroundColor: bg },
        ]}
      >
        {enhanced ? (
          <Pressable
            onPress={onPrimary}
            disabled={primaryDisabled}
            style={styles.enhancedBtnWrap}
          >
            <LinearGradient
              colors={["#FF6B00", "#FF8533"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.enhancedBtn}
            >
              <Text style={styles.enhancedText}>{primaryTitle}</Text>
              {primaryIcon && (
                <View style={styles.iconWrap}>{primaryIcon}</View>
              )}
            </LinearGradient>
          </Pressable>
        ) : (
          <AppButton
            title={primaryTitle}
            onPress={onPrimary}
            disabled={primaryDisabled}
            loading={primaryLoading}
            size="large"
            style={[styles.primaryBtn, compact ? styles.primaryBtnCompact : null]}
            textStyle={styles.primaryText}
          />
        )}

        {secondaryTitle ? (
          <Pressable
            onPress={onSecondary}
            hitSlop={10}
            style={[styles.secondary, compact ? styles.secondaryCompact : null]}
          >
            <Text style={styles.secondaryText}>{secondaryTitle}</Text>
          </Pressable>
        ) : null}

        {footnote ? <Text style={styles.footnote}>{footnote}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.xl,
  },
  inner: {
    paddingTop: spacing.md,
  },
  innerCompact: {
    paddingTop: spacing.sm,
  },
  primaryBtn: {
    width: "100%",
    minHeight: 60,
    paddingVertical: 18,
  },
  primaryBtnCompact: {
    minHeight: 54,
    paddingVertical: 14,
  },
  primaryText: {
    fontSize: 16,
    fontFamily: typography.fontFamily.black,
    letterSpacing: -0.2,
  },

  // Enhanced CTA styles for welcome screen
  enhancedBtnWrap: {
    width: "100%",
    shadowColor: "#FF6B00",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  enhancedBtn: {
    width: "100%",
    minHeight: 60,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    paddingHorizontal: 24,
  },
  enhancedText: {
    fontSize: 17,
    fontFamily: typography.fontFamily.black,
    color: "#FFFFFF",
    letterSpacing: -0.3,
  },
  iconWrap: {
    marginLeft: 8,
  },

  secondary: {
    marginTop: spacing.sm,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
  },
  secondaryCompact: {
    marginTop: 6,
    paddingVertical: 8,
  },
  secondaryText: {
    fontSize: 13,
    fontFamily: typography.fontFamily.black,
    color: colors.textSecondary,
  },

  footnote: {
    marginTop: spacing.sm,
    textAlign: "center",
    fontSize: 11,
    lineHeight: 14,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textTertiary,
  },
});
