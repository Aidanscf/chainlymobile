import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Sparkles } from "lucide-react-native";
import AppCard from "@/components/AppCard";
import AppButton from "@/components/AppButton";
import { colors, spacing, radius, typography } from "@/theme/index";

export function RecommendationCard({ recommendation, onAccept, onDismiss }) {
  if (!recommendation) {
    return (
      <AppCard style={styles.recEmpty} padding={spacing.xl} pressable={false}>
        <Text style={styles.recEmptyTitle}>No tweaks right now</Text>
        <Text style={styles.recEmptySub}>
          Ride a bit more and I'll start spotting patterns worth saving.
        </Text>
      </AppCard>
    );
  }

  return (
    <AppCard style={styles.recCard} padding={spacing.xl} pressable={false}>
      <View style={styles.recTop}>
        <View style={styles.recIcon}>
          <Sparkles size={18} color={colors.primary} strokeWidth={2.75} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.recContext}>{recommendation.context}</Text>
          <Text style={styles.recSuggestion}>{recommendation.suggestion}</Text>
        </View>
      </View>

      <View style={{ height: spacing.md }} />

      <View style={styles.recActions}>
        <AppButton title="Accept" onPress={onAccept} style={{ flex: 1 }} />
        <AppButton
          title="Dismiss"
          variant="secondary"
          onPress={onDismiss}
          style={{ flex: 1 }}
        />
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  recCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primarySoft2,
  },
  recTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  recIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.round,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primarySoft2,
    alignItems: "center",
    justifyContent: "center",
  },
  recContext: {
    fontSize: typography.base,
    lineHeight: 19,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textPrimary,
  },
  recSuggestion: {
    marginTop: 8,
    fontSize: typography.base,
    lineHeight: 19,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
  recActions: {
    flexDirection: "row",
    gap: spacing.md,
  },
  recEmpty: {
    backgroundColor: colors.surfaceWarm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  recEmptyTitle: {
    fontSize: typography.base,
    lineHeight: 18,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
  },
  recEmptySub: {
    marginTop: 6,
    fontSize: typography.base,
    lineHeight: 19,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
});
