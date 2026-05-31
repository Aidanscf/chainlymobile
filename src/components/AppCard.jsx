import React, { useCallback } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { colors, spacing, shadows, radius } from "../theme/index";
import * as Haptics from "expo-haptics";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const AppCard = ({
  children,
  style,
  onPress,
  padding = spacing.xl,
  pressable = true,
}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const handlePressIn = useCallback(() => {
    if (!onPress || !pressable) {
      return;
    }
    scale.value = withSpring(0.985, { damping: 18, stiffness: 260 });
  }, [onPress, pressable, scale]);

  const handlePressOut = useCallback(() => {
    if (!onPress || !pressable) {
      return;
    }
    scale.value = withSpring(1, { damping: 18, stiffness: 260 });
  }, [onPress, pressable, scale]);

  const handlePress = useCallback(() => {
    if (!onPress) {
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  }, [onPress]);

  if (onPress) {
    return (
      <AnimatedPressable
        style={[styles.card, { padding }, animatedStyle, style]}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        {children}
      </AnimatedPressable>
    );
  }

  return <View style={[styles.card, { padding }, style]}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    // Use spacing + soft shadows for separation (no borders by default)
    borderWidth: 0,
    borderColor: "transparent",
    ...shadows.small,
  },
});

export default AppCard;
