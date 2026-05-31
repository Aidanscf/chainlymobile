import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { ClipboardList } from "lucide-react-native";
import AppCard from "@/components/AppCard";
import AppButton from "@/components/AppButton";
import { colors, spacing, radius, typography } from "@/theme/index";

export function SpecsPreview({ previewSpecs, onSpecSheet }) {
  return (
    <>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Bike Specs</Text>
        <Text style={styles.sectionSub}>
          Your build, in a few juicy highlights.
        </Text>
      </View>

      <AppCard style={styles.specCard}>
        <View style={styles.specCardTop}>
          <View style={styles.specTitleWrap}>
            <View style={styles.specIcon}>
              <ClipboardList
                size={18}
                color={colors.primary}
                strokeWidth={2.5}
              />
            </View>
            <Text style={styles.specCardTitle}>Spec Summary</Text>
          </View>
          <Pressable onPress={onSpecSheet} hitSlop={10}>
            <Text style={styles.specLink}>View Full</Text>
          </Pressable>
        </View>

        {previewSpecs.map((r, idx) => {
          const rowStyle = idx === 0 ? styles.specRowFirst : null;
          return (
            <View key={r.label} style={[styles.specRow, rowStyle]}>
              <Text style={styles.specLabel}>{r.label}</Text>
              <Text style={styles.specValue} numberOfLines={1}>
                {r.value}
              </Text>
            </View>
          );
        })}

        <View style={{ height: spacing.lg }} />
        <AppButton title="View Full Spec Sheet" onPress={onSpecSheet} />
      </AppCard>
    </>
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    marginTop: spacing.xxl,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  sectionTitle: {
    fontSize: 20,
    lineHeight: 22,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  sectionSub: {
    marginTop: 6,
    fontSize: typography.base,
    lineHeight: 19,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
  specCard: {
    marginHorizontal: spacing.xl,
  },
  specCardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.lg,
  },
  specTitleWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  specIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.round,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.primarySoft2,
  },
  specCardTitle: {
    fontSize: 18,
    lineHeight: 20,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
  },
  specLink: {
    fontSize: typography.sm,
    fontFamily: typography.fontFamily.semibold,
    color: colors.primary,
  },
  specRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  specRowFirst: {
    borderTopWidth: 0,
    paddingTop: 0,
  },
  specLabel: {
    width: "42%",
    fontSize: typography.sm,
    lineHeight: 16,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
  specValue: {
    width: "56%",
    textAlign: "right",
    fontSize: typography.base,
    lineHeight: 18,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
});
