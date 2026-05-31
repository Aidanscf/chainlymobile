import React from "react";
import { View, Text } from "react-native";
import AppCard from "@/components/AppCard";
import Chip from "@/components/Chip";
import { colors, spacing, radius, typography } from "@/theme/index";
import { severityTone, confidencePct } from "../_utils/displayHelpers";

export function LikelyIssuesCard({ candidates }) {
  return (
    <AppCard style={styles.card}>
      <Text style={styles.sectionTitle}>Likely Issues</Text>
      {candidates.length ? (
        <View style={{ marginTop: spacing.md, gap: spacing.md }}>
          {candidates.slice(0, 5).map((c, idx) => {
            const pct = confidencePct(c?.confidence);
            const sev = String(c?.severity || "low");
            const tone = severityTone(sev);

            const evidence = Array.isArray(c?.evidence) ? c.evidence : [];
            const checks = Array.isArray(c?.quick_checks) ? c.quick_checks : [];

            return (
              <View
                key={`${String(c?.issue || idx)}_${idx}`}
                style={styles.issueCard}
              >
                <View style={styles.issueTopRow}>
                  <Text style={styles.issueTitle}>{c?.issue}</Text>
                  <Chip
                    label={`${sev.toUpperCase()} • ${pct}%`}
                    selected
                    tone={tone}
                  />
                </View>

                {evidence.length ? (
                  <View style={{ marginTop: spacing.sm }}>
                    {evidence.slice(0, 3).map((e) => (
                      <Text key={e} style={styles.bulletText}>
                        • {e}
                      </Text>
                    ))}
                  </View>
                ) : null}

                {checks.length ? (
                  <View style={{ marginTop: spacing.sm }}>
                    <Text style={styles.miniHeader}>Quick checks</Text>
                    {checks.slice(0, 3).map((e) => (
                      <Text key={e} style={styles.bulletText}>
                        • {e}
                      </Text>
                    ))}
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>
      ) : (
        <Text style={styles.emptyText}>
          No likely issues returned. Try adding a bit more detail and running it
          again.
        </Text>
      )}
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
  issueCard: {
    padding: spacing.lg,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  issueTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  issueTitle: {
    flex: 1,
    fontSize: 16,
    lineHeight: 18,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    letterSpacing: -0.2,
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
