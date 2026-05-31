import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { ChevronRight } from "lucide-react-native";
import { colors, spacing, typography, radius } from "@/theme/index";
import { scoreColor } from "@/utils/scoringRubrics";

export default function SubScoreRow({ name, score, onPress }) {
  const pct = useMemo(() => {
    const v = Math.max(0, Math.min(100, Number(score) || 0));
    return v;
  }, [score]);

  const barColor = useMemo(() => scoreColor(pct), [pct]);

  return (
    <View style={styles.wrap}>
      <View style={{ flex: 1 }}>
        <View style={styles.topRow}>
          <Text style={styles.name}>{name}</Text>
          <View style={styles.scoreWrap}>
            <Text style={styles.score}>{Math.round(pct)}</Text>
            <Text style={styles.scoreTotal}>/100</Text>
          </View>
        </View>
        <View style={styles.barTrack}>
          <View
            style={[
              styles.barFill,
              { width: `${pct}%`, backgroundColor: barColor },
            ]}
          />
        </View>
      </View>

      {onPress ? (
        <View style={styles.chevronWrap}>
          <ChevronRight
            size={16}
            color={colors.textTertiary}
            strokeWidth={3}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  name: {
    fontSize: 14,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  scoreWrap: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  score: {
    fontSize: 16,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
  },
  scoreTotal: {
    fontSize: 11,
    fontFamily: typography.fontFamily.bold,
    color: colors.textTertiary,
    marginLeft: 2,
  },
  barTrack: {
    height: 6,
    borderRadius: radius.round,
    backgroundColor: colors.borderLight,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: radius.round,
  },
  chevronWrap: {
    marginLeft: spacing.sm,
    opacity: 0.8,
  },
});
