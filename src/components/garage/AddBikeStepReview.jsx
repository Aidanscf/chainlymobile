import React, { useMemo } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Image } from "expo-image";

import AppCard from "@/components/AppCard";
import { ChevronLeft } from "lucide-react-native";
import { colors, spacing, radius, typography } from "@/theme/index";

function SummaryRow({ label, value, first }) {
  return (
    <View style={[styles.row, first ? styles.rowFirst : null]}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue} numberOfLines={2}>
        {value || "—"}
      </Text>
    </View>
  );
}

export default function StepReview({ draft, onEditStep }) {
  const img = draft?.image_url || null;

  const headerLine = useMemo(() => {
    const name = String(draft?.name || "").trim() || "New Bike";
    const type = String(draft?.bike_type || "Trail").trim();
    return `${name} • ${type}`;
  }, [draft?.bike_type, draft?.name]);

  return (
    <View>
      <AppCard style={styles.card}>
        <Text style={styles.cardTitle}>Ready to roll</Text>
        <Text style={styles.cardSub}>
          Double check the highlights. You can edit anything later in the Spec
          Sheet.
        </Text>

        <View style={styles.editRow}>
          {[0, 1, 2, 3, 4].map((idx) => {
            const label =
              idx === 0
                ? "Basics"
                : idx === 1
                  ? "Specs"
                  : idx === 2
                    ? "Suspension"
                    : idx === 3
                      ? "Drivetrain"
                      : "Wheels";
            return (
              <Pressable
                key={label}
                onPress={() => onEditStep?.(idx)}
                hitSlop={8}
                style={styles.editChip}
              >
                <ChevronLeft size={14} color={colors.primary} strokeWidth={3} />
                <Text style={styles.editChipText}>Edit {label}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.summaryHeader}>
          <View style={styles.imagePreview}>
            {img ? (
              <Image
                source={img}
                style={styles.image}
                contentFit="cover"
                transition={150}
              />
            ) : (
              <View style={styles.imageEmpty}>
                <Text style={styles.imageEmptyText}>No photo</Text>
              </View>
            )}
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.headerLine} numberOfLines={2}>
              {headerLine}
            </Text>
            <Text style={styles.headerHint}>Tap Back to edit any section.</Text>
          </View>
        </View>

        <SummaryRow label="Wheel size" value={draft?.wheel_size} first />
        <SummaryRow label="Hub driver" value={draft?.hub_driver} />
        <SummaryRow
          label="Drivetrain"
          value={
            draft?.drivetrain_speed != null
              ? `${draft.drivetrain_speed}-speed`
              : null
          }
        />
        <SummaryRow label="Brake mount" value={draft?.brake_mount} />
        <SummaryRow
          label="Max rotor"
          value={draft?.rotor_size ? `${draft.rotor_size}mm` : null}
        />
        <SummaryRow
          label="Fork"
          value={
            draft?.fork_brand || draft?.fork_model
              ? `${draft?.fork_brand || ""} ${draft?.fork_model || ""}`.trim()
              : null
          }
        />
        <SummaryRow
          label="Shock"
          value={
            draft?.shock_brand || draft?.shock_model
              ? `${draft?.shock_brand || ""} ${draft?.shock_model || ""}`.trim()
              : null
          }
        />
        <SummaryRow
          label="Tires"
          value={
            draft?.tire_front_model || draft?.tire_rear_model
              ? `${draft?.tire_front_model || "Front"} / ${draft?.tire_rear_model || "Rear"}`
              : null
          }
        />
      </AppCard>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.borderLight,
    padding: spacing.xl,
  },
  cardTitle: {
    fontSize: 18,
    lineHeight: 20,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  cardSub: {
    marginTop: 6,
    fontSize: typography.base,
    lineHeight: 19,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
  summaryHeader: {
    flexDirection: "row",
    gap: spacing.lg,
    marginTop: spacing.lg,
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  imagePreview: {
    width: 84,
    height: 84,
    borderRadius: radius.xl,
    backgroundColor: colors.surfaceWarm,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imageEmpty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  imageEmptyText: {
    fontSize: typography.sm,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textTertiary,
  },
  headerLine: {
    fontSize: 16,
    lineHeight: 18,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  headerHint: {
    marginTop: 6,
    fontSize: typography.sm,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textSecondary,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  rowFirst: {
    borderTopWidth: 0,
    paddingTop: 0,
  },
  rowLabel: {
    width: "46%",
    fontSize: typography.sm,
    lineHeight: 16,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
  rowValue: {
    width: "52%",
    textAlign: "right",
    fontSize: typography.base,
    lineHeight: 18,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  editRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
  },
  editChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.round,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primarySoft2,
  },
  editChipText: {
    fontSize: typography.sm,
    fontFamily: typography.fontFamily.black,
    color: colors.primary,
  },
});
