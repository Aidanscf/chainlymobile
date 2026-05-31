import React, { useMemo } from "react";
import { View, Text } from "react-native";
import AppCard from "@/components/AppCard";
import { colors, spacing, typography } from "@/theme/index";
import { getMoneySavedEstimate } from "../_utils/moneySaved";
import { SafetyAlert } from "./SafetyAlert";
import { LikelyIssuesCard } from "./LikelyIssuesCard";
import { FixPlanCard } from "./FixPlanCard";
import { ResourcesCard } from "./ResourcesCard";

export function ResultsStep({
  diagnosis,
  safetyAlertText,
  candidates,
  fixPlan,
  resources,
  onStartOver,
}) {
  const hasSteps = useMemo(() => {
    const steps = Array.isArray(fixPlan?.steps) ? fixPlan.steps : [];
    return steps.length > 0;
  }, [fixPlan?.steps]);

  const estimate = useMemo(() => {
    return getMoneySavedEstimate({ diagnosis, fixPlan });
  }, [diagnosis, fixPlan]);

  const showSavings = !!estimate && hasSteps;

  return (
    <View style={{ gap: spacing.lg }}>
      <SafetyAlert safetyAlertText={safetyAlertText} />
      <LikelyIssuesCard candidates={candidates} />
      <FixPlanCard fixPlan={fixPlan} onStartOver={onStartOver} />

      {showSavings ? (
        <AppCard style={styles.savingsCard}>
          <View style={{ marginBottom: spacing.sm }}>
            <Text style={styles.savingsTitle}>Money you could save</Text>
            <Text style={styles.savingsSubtitle}>
              If you fix this yourself instead of going to a shop.
            </Text>
          </View>

          <Text style={styles.savingsRow}>
            Typical shop cost: {estimate?.shopRangeText}
          </Text>
          <Text style={styles.savingsRow}>
            DIY parts/tools cost: {estimate?.diyRangeText}
          </Text>
          <Text style={styles.savingsBig}>
            You could save: ~${estimate?.savedApprox}
          </Text>
        </AppCard>
      ) : null}

      <ResourcesCard resources={resources} />
    </View>
  );
}

const styles = {
  savingsCard: {
    backgroundColor: colors.surfaceWarm,
    borderColor: colors.border,
  },
  savingsTitle: {
    fontSize: 16,
    lineHeight: 18,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
  },
  savingsSubtitle: {
    marginTop: 4,
    fontSize: typography.sm,
    lineHeight: 16,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textSecondary,
  },
  savingsRow: {
    fontSize: typography.base,
    lineHeight: 19,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textPrimary,
    marginBottom: 6,
  },
  savingsBig: {
    marginTop: spacing.sm,
    fontSize: 18,
    lineHeight: 20,
    fontFamily: typography.fontFamily.black,
    color: colors.primary,
  },
};
