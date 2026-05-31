import React from "react";
import { View, Text, StyleSheet } from "react-native";
import AppCard from "@/components/AppCard";
import { colors, spacing, typography } from "@/theme/index";
import { Badge } from "./Badge";
import { formatShortDate, formatMaintenanceType } from "../_utils/formatters";

export function MaintenanceHistorySection({
  maintenanceHistory,
  hasMaintenanceHistory,
}) {
  return (
    <>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Maintenance History</Text>
        <Text style={styles.sectionSub}>
          Your last 5 maintenance logs for this bike.
        </Text>
      </View>

      <AppCard style={styles.maintenanceHistoryCard} pressable={false}>
        {!hasMaintenanceHistory ? (
          <Text style={styles.emptyQuestsText}>No maintenance logged yet.</Text>
        ) : (
          maintenanceHistory.map((e, idx) => {
            const iso =
              e?.performed_at ||
              e?.performedAt ||
              e?.created_at ||
              e?.createdAt ||
              null;
            const when = formatShortDate(iso);

            const action = e?.action || e?.type || e?.event_type || "";
            const title = formatMaintenanceType(action);

            const note = String(e?.note || "").trim();
            const showBorder = idx !== 0;
            const rowBorderStyle = showBorder
              ? styles.maintenanceHistoryRowBorder
              : null;

            return (
              <View
                key={String(e?.id || idx)}
                style={[styles.maintenanceHistoryRow, rowBorderStyle]}
              >
                <View style={{ flex: 1, paddingRight: spacing.md }}>
                  <Text style={styles.maintenanceHistoryTitle}>{title}</Text>
                  <Text style={styles.maintenanceHistoryMeta}>
                    {when || ""}
                  </Text>
                  {note ? (
                    <Text style={styles.maintenanceHistoryNote}>{note}</Text>
                  ) : null}
                </View>

                <Badge tone="done" text="Logged" />
              </View>
            );
          })
        )}
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
  maintenanceHistoryCard: {
    marginHorizontal: spacing.xl,
  },
  maintenanceHistoryRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
  },
  maintenanceHistoryRowBorder: {
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  maintenanceHistoryTitle: {
    fontSize: typography.base,
    lineHeight: 18,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  maintenanceHistoryMeta: {
    marginTop: 4,
    fontSize: typography.sm,
    lineHeight: 16,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textSecondary,
  },
  maintenanceHistoryNote: {
    marginTop: 6,
    fontSize: typography.sm,
    lineHeight: 16,
    fontFamily: typography.fontFamily.regular,
    color: colors.textTertiary,
  },
  emptyQuestsText: {
    fontSize: typography.base,
    lineHeight: 18,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
});
