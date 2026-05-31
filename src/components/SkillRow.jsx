import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import {
  Mountain,
  CornerDownRight,
  TrendingUp,
  Waves,
  Zap,
  ArrowUpRight,
} from "lucide-react-native";
import { colors, spacing, radius, typography } from "../theme/index";

const iconMap = {
  Jumping: Zap,
  Cornering: CornerDownRight,
  Drops: ArrowUpRight,
  Flow: Waves,
  Tech: TrendingUp,
  Climbing: Mountain,
};

export default function SkillRow({ label, value, color }) {
  const Icon = useMemo(() => iconMap[label] || TrendingUp, [label]);

  return (
    <View style={styles.row}>
      <View style={[styles.iconWrap, { backgroundColor: colors.surfaceWarm }]}>
        <Icon size={18} color={color} strokeWidth={2.5} />
      </View>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.spacer} />
      <Text style={[styles.value, { color }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderLight,
    backgroundColor: colors.surface,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.round,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.md,
  },
  label: {
    fontSize: typography.base,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textPrimary,
  },
  spacer: {
    flex: 1,
  },
  value: {
    fontSize: 18,
    fontFamily: typography.fontFamily.black,
    letterSpacing: -0.2,
  },
});
