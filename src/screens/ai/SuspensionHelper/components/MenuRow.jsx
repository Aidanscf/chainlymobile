import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { ChevronRight } from "lucide-react-native";
import { colors, spacing, radius, typography } from "@/theme/index";

export function MenuRow({ icon: Icon, title, onPress, danger = false }) {
  const fg = danger ? colors.danger : colors.textPrimary;
  const iconColor = danger ? colors.danger : colors.primary;

  return (
    <Pressable onPress={onPress} style={styles.menuRow} hitSlop={10}>
      <View style={styles.menuIcon}>
        <Icon size={16} color={iconColor} strokeWidth={2.75} />
      </View>
      <Text style={[styles.menuRowText, { color: fg }]}>{title}</Text>
      <ChevronRight size={18} color={colors.textSecondary} strokeWidth={2.75} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: 12,
  },
  menuIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.round,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primarySoft2,
    alignItems: "center",
    justifyContent: "center",
  },
  menuRowText: {
    flex: 1,
    fontSize: typography.base,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
  },
});
