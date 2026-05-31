import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";

import AppCard from "@/components/AppCard";
import { colors, spacing, radius, typography } from "@/theme/index";
import { listTiers, getTierThreshold } from "@/utils/leagues/calcCLSQ";

function formatPts(n) {
  try {
    const x = Number(n);
    const safe = Number.isFinite(x) ? Math.floor(x) : 0;
    return safe.toLocaleString();
  } catch (e) {
    return String(n ?? 0);
  }
}

const HELP_ROWS = [
  {
    title: "Ride Score",
    body: "You earn points for rides 20+ minutes. Only your top rides count each season, and longer rides give a small multiplier.",
  },
  {
    title: "Consistency Bonus",
    body: "You earn bonus points for riding on 2+ days in a week. The more active weeks you stack, the higher the bonus.",
  },
  {
    title: "Chainly Engagement",
    body: "Using Chainly features adds points—AI diagnostics, fix guides, gear saves, suspension helper, and ride analysis.",
  },
  {
    title: "Bike Care Bonus",
    body: "Logging maintenance adds points—chain, brakes, drivetrain cleaning, and suspension service.",
  },
  {
    title: "Friends Share Bonus",
    body: "Sharing your rider card or league progress adds points, capped weekly to prevent spam.",
  },
];

export default function LeagueHelpContent({ currentTier }) {
  const tiers = useMemo(() => {
    try {
      const list = listTiers();
      return Array.isArray(list) ? list : [];
    } catch (e) {
      return [];
    }
  }, []);

  const current = String(currentTier || "");

  return (
    <View style={{ marginTop: spacing.lg, gap: spacing.lg }}>
      <AppCard style={styles.card} pressable={false}>
        <Text style={styles.title}>League ranks</Text>

        <View style={{ height: spacing.md }} />

        {tiers.map((tier) => {
          const t = String(tier || "");
          const pts = getTierThreshold(t);
          const isCurrent = current && t === current;

          return (
            <View key={t} style={styles.rankRow}>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
              >
                <Text
                  style={[
                    styles.rankTier,
                    isCurrent ? styles.rankTierCurrent : null,
                  ]}
                >
                  {t}
                </Text>
                {isCurrent ? (
                  <View style={styles.currentPill}>
                    <Text style={styles.currentPillText}>Current</Text>
                  </View>
                ) : null}
              </View>
              <Text
                style={[
                  styles.rankPts,
                  isCurrent ? styles.rankTierCurrent : null,
                ]}
              >
                {formatPts(pts)} pts
              </Text>
            </View>
          );
        })}

        {String(currentTier || "") === "Legend" ? (
          <View style={{ marginTop: spacing.md }}>
            <Text style={styles.maxNote}>Max rank reached</Text>
          </View>
        ) : null}
      </AppCard>

      <AppCard style={styles.card} pressable={false}>
        <Text style={styles.title}>How points are counted</Text>
        <Text style={styles.subTitle}>Your score resets every 3 months</Text>

        <View style={{ height: spacing.md }} />

        {HELP_ROWS.map((row) => {
          const key = row.title;
          return (
            <View key={key} style={styles.helpRow}>
              <Text style={styles.helpTitle}>{row.title}</Text>
              <Text style={styles.helpBody}>{row.body}</Text>
            </View>
          );
        })}
      </AppCard>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },

  title: {
    fontSize: 16,
    lineHeight: 18,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
  },
  subTitle: {
    marginTop: 6,
    fontSize: typography.sm,
    lineHeight: 16,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },

  helpRow: {
    marginBottom: spacing.md,
  },
  helpTitle: {
    fontSize: typography.base,
    lineHeight: 18,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
  },
  helpBody: {
    marginTop: 4,
    fontSize: typography.sm,
    lineHeight: 16,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },

  rankRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  rankTier: {
    fontSize: typography.base,
    lineHeight: 18,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textPrimary,
  },
  rankPts: {
    fontSize: typography.sm,
    lineHeight: 16,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textSecondary,
  },
  rankTierCurrent: {
    fontFamily: typography.fontFamily.black,
    color: colors.primary,
  },

  currentPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.round,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primarySoft2,
  },
  currentPillText: {
    fontSize: 12,
    fontFamily: typography.fontFamily.black,
    color: colors.primary,
  },

  maxNote: {
    fontSize: typography.sm,
    lineHeight: 16,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textSecondary,
  },
});
