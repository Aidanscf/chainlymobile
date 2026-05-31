import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import ConfidenceRing from "@/components/ConfidenceRing";
import { colors, spacing, typography } from "@/theme/index";
import { scoreDescriptor } from "@/utils/scoringRubrics";

export default function ScoreRing({
  score,
  size = 140,
  label = "Overall",
  caption,
}) {
  const descriptor = useMemo(() => scoreDescriptor(score), [score]);
  const captionText = caption || descriptor;

  return (
    <View style={styles.wrap}>
      <ConfidenceRing
        value={score}
        size={size}
        strokeWidth={12}
        label={label}
        sublabel={captionText}
        color={colors.primary}
      />

      <View style={{ marginTop: spacing.md, alignItems: "center" }}>
        <Text style={styles.descriptor}>{descriptor}</Text>
        <Text style={styles.helper}>
          0–100 • built for progress, not perfection
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  descriptor: {
    fontSize: 18,
    lineHeight: 20,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  helper: {
    marginTop: 4,
    fontSize: typography.sm,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textSecondary,
  },
});
