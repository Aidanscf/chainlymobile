import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { CheckCircle2, Circle } from "lucide-react-native";
import { colors, spacing, typography, radius } from "@/theme/index";

export default function Stepper({ steps, activeIndex = 0 }) {
  const safeSteps = useMemo(() => {
    const arr = Array.isArray(steps) ? steps : [];
    return arr.slice(0, 8);
  }, [steps]);

  return (
    <View style={styles.wrap}>
      {safeSteps.map((title, idx) => {
        const done = idx < activeIndex;
        const active = idx === activeIndex;

        const Icon = done ? CheckCircle2 : Circle;
        const iconColor = done
          ? colors.success
          : active
            ? colors.primary
            : colors.textTertiary;

        const textColor = active ? colors.textPrimary : colors.textSecondary;

        return (
          <View key={`${title}:${idx}`} style={styles.row}>
            <Icon size={18} color={iconColor} strokeWidth={2.5} />
            <Text style={[styles.text, { color: textColor }]}>{title}</Text>
            {active ? <View style={styles.pulse} /> : null}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: spacing.lg,
    backgroundColor: colors.surfaceWarm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  text: {
    flex: 1,
    fontSize: typography.base,
    fontFamily: typography.fontFamily.semibold,
  },
  pulse: {
    width: 10,
    height: 10,
    borderRadius: radius.round,
    backgroundColor: colors.primary,
    opacity: 0.85,
  },
});
