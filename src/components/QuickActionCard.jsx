import React, { useCallback } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { colors, spacing, radius, typography, shadows } from "../theme/index";
import * as LucideIcons from "lucide-react-native";
import * as Haptics from "expo-haptics";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const QuickActionCard = ({ icon, title, color = colors.primary, onPress }) => {
  const Icon = LucideIcons[icon] || LucideIcons.Sparkles;

  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => {
    return { transform: [{ scale: scale.value }] };
  });

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.985, { damping: 18, stiffness: 260 });
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 18, stiffness: 260 });
  }, [scale]);

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  }, [onPress]);

  return (
    <AnimatedPressable
      style={[styles.card, animatedStyle]}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <View style={styles.iconContainer}>
        <Icon size={24} color={color} strokeWidth={2.25} />
      </View>
      <Text style={styles.title}>{title}</Text>
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 124,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.small,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: radius.round,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
    backgroundColor: colors.iconBgOrange,
  },
  title: {
    fontSize: typography.sm,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textPrimary,
    textAlign: "center",
    lineHeight: 16,
  },
});

export default QuickActionCard;
