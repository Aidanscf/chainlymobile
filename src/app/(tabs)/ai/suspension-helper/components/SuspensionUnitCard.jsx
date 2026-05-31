import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Gauge, Undo2, SlidersHorizontal, Layers } from "lucide-react-native";
import AppCard from "@/components/AppCard";
import { colors, spacing, radius, typography } from "@/theme/index";

function StatRow({ icon: Icon, label, value, sub }) {
  return (
    <View style={styles.statRow}>
      <View style={styles.statIcon}>
        <Icon size={16} color={colors.primary} strokeWidth={2.5} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.statLabel}>{label}</Text>
        {sub ? <Text style={styles.statSub}>{sub}</Text> : null}
      </View>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

export default function SuspensionUnitCard({
  title,
  componentLabel,
  settings,
  tone = "warm",
}) {
  const headerSub = useMemo(() => {
    if (!componentLabel) {
      return "";
    }
    return componentLabel;
  }, [componentLabel]);

  const sagValue =
    settings?.sagTargetPct != null ? `${settings.sagTargetPct}%` : "—";

  const psiLine = useMemo(() => {
    if (!settings) {
      return null;
    }

    if (settings.psi != null) {
      return {
        label: "Air pressure",
        value: `${Math.round(settings.psi)} PSI`,
      };
    }

    if (settings.springRate != null) {
      return {
        label: "Spring rate",
        value: `${Math.round(settings.springRate)} lb/in`,
      };
    }

    return {
      label: "Spring",
      value: "Check manufacturer",
    };
  }, [settings]);

  const reboundValue =
    settings?.reboundClicks != null
      ? `${Math.round(settings.reboundClicks)} clicks`
      : "—";
  const compValue =
    settings?.compressionClicks != null
      ? `${Math.round(settings.compressionClicks)} clicks`
      : "—";

  const tokensValue =
    settings?.tokens != null
      ? `${Math.round(settings.tokens)} token${settings.tokens === 1 ? "" : "s"}`
      : null;

  const cardStyle = tone === "orange" ? styles.cardOrange : styles.card;

  return (
    <AppCard style={cardStyle}>
      <Text style={styles.title}>{title}</Text>
      {headerSub ? <Text style={styles.sub}>{headerSub}</Text> : null}

      <View style={{ height: spacing.lg }} />

      <StatRow
        icon={Gauge}
        label="Sag target"
        value={sagValue}
        sub="Get this right first"
      />
      <View style={styles.divider} />

      {psiLine ? (
        <>
          <StatRow
            icon={SlidersHorizontal}
            label={psiLine.label}
            value={psiLine.value}
            sub="Baseline recommendation"
          />
          <View style={styles.divider} />
        </>
      ) : null}

      <StatRow
        icon={Undo2}
        label="Rebound"
        value={reboundValue}
        sub="Start here — then tune on trail"
      />
      <View style={styles.divider} />

      <StatRow
        icon={SlidersHorizontal}
        label="Compression"
        value={compValue}
        sub="Support vs comfort"
      />

      {tokensValue ? (
        <>
          <View style={styles.divider} />
          <StatRow
            icon={Layers}
            label="Volume tokens"
            value={tokensValue}
            sub="Only if your fork/shock supports it"
          />
        </>
      ) : null}

      <View style={{ marginTop: spacing.md }}>
        <Text style={styles.note}>
          Always double-check manufacturer limits. These are baseline
          recommendations — your perfect setup is a few rides away.
        </Text>
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceWarm,
    borderColor: colors.border,
  },
  cardOrange: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primarySoft2,
  },
  title: {
    fontSize: 18,
    lineHeight: 20,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  sub: {
    marginTop: 6,
    fontSize: typography.sm,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textSecondary,
  },

  statRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  statIcon: {
    width: 34,
    height: 34,
    borderRadius: radius.round,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  statLabel: {
    fontSize: typography.sm,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    letterSpacing: -0.1,
  },
  statSub: {
    marginTop: 2,
    fontSize: 12,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textSecondary,
  },
  statValue: {
    fontSize: 16,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: 2,
  },
  note: {
    fontSize: typography.sm,
    lineHeight: 17,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textSecondary,
  },
});
