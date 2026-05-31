import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { AlertCircle, Clock, CheckCircle2 } from "lucide-react-native";

import AppCard from "@/components/AppCard";
import { colors, spacing, radius, typography, shadows } from "@/theme/index";
import { getQuestStatusUI } from "@/utils/questStatusUI";

export function MaintenanceQuests({ quests }) {
  const urgent = Array.isArray(quests?.urgent) ? quests.urgent : [];
  const dueSoon = Array.isArray(quests?.dueSoon) ? quests.dueSoon : [];
  const ok = Array.isArray(quests?.ok) ? quests.ok : [];

  const pills = useMemo(() => {
    const u = urgent.map((q) => ({ ...q, _status: "due" }));
    const d = dueSoon.map((q) => ({ ...q, _status: "due_soon" }));
    const o = ok.map((q) => ({ ...q, _status: "ok" }));
    return [...u, ...d, ...o];
  }, [dueSoon, ok, urgent]);

  const hasAny = pills.length > 0;

  return (
    <>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Maintenance Quests</Text>
        <Text style={styles.sectionSub}>Keep it smooth.</Text>
      </View>

      <AppCard style={styles.maintenanceCard} pressable={false}>
        {!hasAny ? (
          <Text style={styles.emptyQuestsText}>
            No quests yet. Log rides to power maintenance countdowns.
          </Text>
        ) : (
          <View style={styles.pillsWrap}>
            {pills.map((q) => {
              const ui = getQuestStatusUI(q?._status);
              const subtitle = q?.subtitle;

              const Icon =
                ui.status === "DUE"
                  ? AlertCircle
                  : ui.status === "DUE_SOON"
                    ? Clock
                    : CheckCircle2;

              return (
                <View
                  key={q.id}
                  style={[
                    styles.pill,
                    {
                      backgroundColor: ui.bg,
                      borderColor: ui.border,
                    },
                  ]}
                >
                  <View style={styles.pillLeft}>
                    <Icon size={16} color={ui.fg} strokeWidth={2.5} />
                  </View>

                  <View style={styles.pillMiddle}>
                    <Text style={styles.pillTitle}>{q.title}</Text>
                    {subtitle ? (
                      <Text style={styles.pillSubtitle}>{subtitle}</Text>
                    ) : null}
                  </View>

                  <View style={[styles.statusChip, { borderColor: ui.fg }]}>
                    <Text style={[styles.statusChipText, { color: ui.fg }]}>
                      {ui.label}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
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
  maintenanceCard: {
    marginHorizontal: spacing.xl,
  },

  pillsWrap: {
    gap: spacing.sm,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: radius.round,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    ...shadows.small,
  },
  pillLeft: {
    width: 28,
    height: 28,
    borderRadius: radius.round,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  pillMiddle: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  pillTitle: {
    fontSize: typography.base,
    lineHeight: 18,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  pillSubtitle: {
    marginTop: 3,
    fontSize: typography.sm,
    lineHeight: 16,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textSecondary,
  },
  statusChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.round,
    backgroundColor: colors.surface,
    borderWidth: 1,
  },
  statusChipText: {
    fontSize: typography.xs,
    lineHeight: 14,
    fontFamily: typography.fontFamily.black,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },

  emptyQuestsText: {
    fontSize: typography.base,
    lineHeight: 18,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
});
