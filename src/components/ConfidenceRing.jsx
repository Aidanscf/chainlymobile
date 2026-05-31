import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { colors, spacing, typography } from "@/theme/index";

export default function ConfidenceRing({
  value, // 0-100
  size = 92,
  strokeWidth = 10,
  color = colors.primary,
  label,
  sublabel,
}) {
  const clamped = Math.max(0, Math.min(100, Number(value) || 0));

  const r = useMemo(() => (size - strokeWidth) / 2, [size, strokeWidth]);
  const c = useMemo(() => 2 * Math.PI * r, [r]);
  const dashOffset = useMemo(() => c * (1 - clamped / 100), [c, clamped]);

  const title = label || "Confidence";
  const valueText = `${Math.round(clamped)}%`;

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={colors.borderLight}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeLinecap="round"
          strokeDasharray={`${c} ${c}`}
          strokeDashoffset={dashOffset}
          rotation={-90}
          originX={size / 2}
          originY={size / 2}
        />
      </Svg>

      <View style={styles.center}>
        <Text style={styles.centerLabel}>{title}</Text>
        <Text style={styles.centerValue}>{valueText}</Text>
        {sublabel ? <Text style={styles.centerSub}>{sublabel}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  center: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.sm,
  },
  centerLabel: {
    fontSize: 11,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textSecondary,
  },
  centerValue: {
    marginTop: 2,
    fontSize: 22,
    lineHeight: 22,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  centerSub: {
    marginTop: 2,
    fontSize: 11,
    fontFamily: typography.fontFamily.bold,
    color: colors.primary,
  },
});
