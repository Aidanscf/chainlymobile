import React, { useCallback } from "react";
import { Text, StyleSheet, Pressable, View } from "react-native";
import * as Haptics from "expo-haptics";
import { colors, spacing, radius, typography } from "@/theme/index";

export default function Chip({
  label,
  selected = false,
  tone = "neutral", // neutral | orange | green | red
  onPress,
  style,
  textStyle,
  left,
}) {
  const handlePress = useCallback(() => {
    Haptics.selectionAsync();
    onPress?.();
  }, [onPress]);

  let bg = colors.surface;
  let border = colors.border;
  let fg = colors.textPrimary;

  if (tone === "orange") {
    bg = selected ? colors.primarySoft2 : colors.primarySoft;
    border = selected ? colors.primary : colors.primarySoft2;
    fg = colors.primary;
  }
  if (tone === "green") {
    bg = selected ? "#DDF7EA" : colors.successSoft;
    border = selected ? colors.success : "#CCF4DF";
    fg = colors.success;
  }
  if (tone === "red") {
    bg = selected ? "#FFD7D5" : colors.dangerLight;
    border = selected ? colors.danger : "#FFD0CD";
    fg = colors.danger;
  }

  if (tone === "neutral" && selected) {
    bg = colors.surfaceWarm;
    border = colors.border;
  }

  const content = (
    <>
      {left ? <View style={{ marginRight: spacing.sm }}>{left}</View> : null}
      <Text style={[styles.text, { color: fg }, textStyle]}>{label}</Text>
    </>
  );

  return (
    <Pressable
      onPress={handlePress}
      style={[styles.chip, { backgroundColor: bg, borderColor: border }, style]}
      hitSlop={6}
    >
      <View style={styles.row}>{content}</View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.round,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  text: {
    fontSize: typography.sm,
    fontFamily: typography.fontFamily.bold,
    letterSpacing: -0.1,
  },
});
