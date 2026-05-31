import React, { useCallback } from "react";
import { Text, StyleSheet, Pressable, ActivityIndicator } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { colors, spacing, radius, typography, shadows } from "../theme/index";
import * as Haptics from "expo-haptics";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const AppButton = ({
  title,
  onPress,
  variant = "primary", // primary | secondary | ghost
  size = "medium", // small | medium | large
  loading = false,
  disabled = false,
  style,
  textStyle,
}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const handlePressIn = useCallback(() => {
    if (disabled || loading) {
      return;
    }
    scale.value = withSpring(0.98, { damping: 18, stiffness: 260 });
  }, [disabled, loading, scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 18, stiffness: 260 });
  }, [scale]);

  const handlePress = useCallback(() => {
    if (disabled || loading) {
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  }, [disabled, loading, onPress]);

  const spinnerColor = variant === "primary" ? "#FFFFFF" : colors.textPrimary;

  return (
    <AnimatedPressable
      style={[
        styles.button,
        styles[variant],
        styles[size],
        animatedStyle,
        (disabled || loading) && styles.disabled,
        style,
      ]}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator color={spinnerColor} />
      ) : (
        <Text style={[styles.text, styles[`${variant}Text`], textStyle]}>
          {title}
        </Text>
      )}
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: radius.round,
    alignItems: "center",
    justifyContent: "center",
  },

  // Variants
  primary: {
    backgroundColor: colors.primary,
    ...shadows.small,
  },
  secondary: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ghost: {
    backgroundColor: "transparent",
  },

  // Sizes
  small: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  medium: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xxl,
  },
  large: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xxxl,
  },

  // Text
  text: {
    fontSize: typography.base,
    fontFamily: typography.fontFamily.semibold,
    letterSpacing: 0.2,
  },
  primaryText: {
    color: "#FFFFFF",
  },
  secondaryText: {
    color: colors.textPrimary,
  },
  ghostText: {
    color: colors.primary,
  },

  disabled: {
    opacity: 0.55,
  },
});

export default AppButton;
