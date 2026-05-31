import React from "react";
import { View, Text } from "react-native";
import AppCard from "@/components/AppCard";
import AppButton from "@/components/AppButton";
import { colors, spacing, typography } from "@/theme/index";
import { isNonEmptyString } from "../_utils/textHelpers";

export function FixPlanCard({ fixPlan, onStartOver }) {
  return (
    <AppCard style={styles.card}>
      <Text style={styles.sectionTitle}>Fix Plan</Text>

      {isNonEmptyString(fixPlan?.summary) ? (
        <Text style={styles.planSummary}>{fixPlan?.summary}</Text>
      ) : (
        <Text style={styles.emptyText}>No fix plan returned. Try again.</Text>
      )}

      {Array.isArray(fixPlan?.tools) && fixPlan.tools.length ? (
        <View style={{ marginTop: spacing.md }}>
          <Text style={styles.miniHeader}>Tools</Text>
          {fixPlan.tools.slice(0, 6).map((t) => (
            <Text key={t} style={styles.bulletText}>
              • {t}
            </Text>
          ))}
        </View>
      ) : null}

      {Array.isArray(fixPlan?.parts) && fixPlan.parts.length ? (
        <View style={{ marginTop: spacing.md }}>
          <Text style={styles.miniHeader}>Parts (categories)</Text>
          {fixPlan.parts.slice(0, 6).map((t) => (
            <Text key={t} style={styles.bulletText}>
              • {t}
            </Text>
          ))}
        </View>
      ) : null}

      {Array.isArray(fixPlan?.steps) && fixPlan.steps.length ? (
        <View style={{ marginTop: spacing.md }}>
          <Text style={styles.miniHeader}>Steps</Text>
          {fixPlan.steps.slice(0, 6).map((t) => (
            <Text key={t} style={styles.bulletText}>
              • {t}
            </Text>
          ))}
        </View>
      ) : null}

      {Array.isArray(fixPlan?.avoid) && fixPlan.avoid.length ? (
        <View style={{ marginTop: spacing.md }}>
          <Text style={styles.miniHeader}>Common mistakes</Text>
          {fixPlan.avoid.slice(0, 5).map((t) => (
            <Text key={t} style={styles.bulletText}>
              • {t}
            </Text>
          ))}
        </View>
      ) : null}

      <View style={{ marginTop: spacing.xl, gap: spacing.sm }}>
        <AppButton title="Start over" onPress={onStartOver} />
      </View>
    </AppCard>
  );
}

const styles = {
  card: {
    backgroundColor: colors.surfaceWarm,
    borderColor: colors.border,
  },
  sectionTitle: {
    fontSize: 18,
    lineHeight: 20,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    letterSpacing: -0.2,
    marginBottom: spacing.sm,
  },
  planSummary: {
    marginTop: spacing.sm,
    fontSize: typography.base,
    lineHeight: 19,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textPrimary,
  },
  miniHeader: {
    fontSize: typography.sm,
    fontFamily: typography.fontFamily.bold,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  bulletText: {
    fontSize: typography.base,
    lineHeight: 19,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textPrimary,
    marginBottom: 6,
  },
  emptyText: {
    marginTop: spacing.md,
    fontSize: typography.base,
    lineHeight: 19,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
};
