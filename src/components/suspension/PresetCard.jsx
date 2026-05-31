import React, { useMemo } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import {
  Pencil,
  MoreHorizontal,
  Mountain,
  CloudRain,
  Clock3,
} from "lucide-react-native";

import AppCard from "@/components/AppCard";
import AppButton from "@/components/AppButton";
import Chip from "@/components/Chip";
import { colors, spacing, radius, typography } from "@/theme/index";

function formatLastUsed(iso) {
  if (!iso) return "Never used";
  try {
    const d = new Date(iso);
    const days = Math.round((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
    if (days <= 0) return "Used today";
    if (days === 1) return "Used yesterday";
    return `Used ${days}d ago`;
  } catch (e) {
    return "Last used";
  }
}

function forkSummary(preset) {
  const fs = preset?.forkSettings || {};
  const psi = Number(fs.psi || 0);
  const r = fs.reboundClicks;
  const c = fs.compressionClicks;

  const psiText = psi ? `${Math.round(psi)} PSI` : "— PSI";
  const rText = r == null ? "R —" : `R ${r}`;
  const cText = c == null ? "C —" : `C ${c}`;

  return `Fork: ${psiText} • ${rText} • ${cText}`;
}

function shockSummary(preset) {
  const ss = preset?.shockSettings || {};
  const psi = Number(ss.psi || 0);
  const r = ss.reboundClicks;
  const c = ss.compressionClicks;

  const psiText = psi ? `${Math.round(psi)} PSI` : "— PSI";
  const rText = r == null ? "R —" : `R ${r}`;
  const cText = c == null ? "C —" : `C ${c}`;

  return `Shock: ${psiText} • ${rText} • ${cText}`;
}

export default function PresetCard({
  preset,
  active = false,
  onApply,
  onEdit,
  onDuplicate,
  onMenu,
}) {
  const terrain = preset?.terrainTag || "trail";
  const weather = preset?.weatherTag || "dry";

  const name = preset?.name || "Preset";
  const meta = useMemo(
    () => formatLastUsed(preset?.lastUsedAt),
    [preset?.lastUsedAt],
  );

  const forkLine = useMemo(() => forkSummary(preset), [preset]);
  const shockLine = useMemo(() => shockSummary(preset), [preset]);

  const cardStyle = active ? styles.cardActive : null;

  return (
    <AppCard
      style={[styles.card, cardStyle]}
      padding={spacing.xl}
      pressable={false}
    >
      <View style={styles.topRow}>
        <View style={{ flex: 1, paddingRight: spacing.md }}>
          <Text style={styles.name} numberOfLines={1}>
            {name}
          </Text>
          <View style={styles.metaRow}>
            <Clock3 size={14} color={colors.textTertiary} strokeWidth={2.75} />
            <Text style={styles.metaText}>{meta}</Text>
          </View>
        </View>

        <View style={styles.topActions}>
          <Pressable onPress={onEdit} hitSlop={10} style={styles.iconBtn}>
            <Pencil size={16} color={colors.primary} strokeWidth={2.75} />
          </Pressable>
          <Pressable onPress={onMenu} hitSlop={10} style={styles.iconBtn}>
            <MoreHorizontal
              size={18}
              color={colors.textSecondary}
              strokeWidth={2.75}
            />
          </Pressable>
        </View>
      </View>

      <View style={styles.tagRow}>
        <Chip
          label={terrainLabel(terrain)}
          tone="orange"
          selected
          left={
            <Mountain size={14} color={colors.primary} strokeWidth={2.75} />
          }
          style={styles.tagChip}
          onPress={() => {}}
        />
        <Chip
          label={weatherLabel(weather)}
          tone="neutral"
          selected
          left={
            <CloudRain
              size={14}
              color={colors.textSecondary}
              strokeWidth={2.75}
            />
          }
          style={styles.tagChip}
          onPress={() => {}}
        />
        {active ? (
          <View style={styles.activePill}>
            <Text style={styles.activePillText}>Active</Text>
          </View>
        ) : null}
      </View>

      <View style={{ marginTop: spacing.md }}>
        <Text style={styles.summary}>{forkLine}</Text>
        <Text style={[styles.summary, { marginTop: 4 }]}>{shockLine}</Text>
      </View>

      <View style={{ height: spacing.lg }} />

      <AppButton title="Apply setup" onPress={onApply} />

      <View style={styles.bottomRow}>
        <AppButton
          title="Edit"
          variant="secondary"
          onPress={onEdit}
          style={{ flex: 1 }}
        />
        <AppButton
          title="Duplicate"
          variant="secondary"
          onPress={onDuplicate}
          style={{ flex: 1 }}
        />
      </View>
    </AppCard>
  );
}

function terrainLabel(tag) {
  const t = String(tag || "").toLowerCase();
  if (t === "xc") return "XC";
  if (t === "tech") return "Tech";
  if (t === "flow") return "Flow";
  if (t === "park" || t === "bike park") return "Bike Park";
  if (t === "jumps") return "Jumps";
  return "Trail";
}

function weatherLabel(tag) {
  const w = String(tag || "").toLowerCase();
  if (w === "wet") return "Wet";
  if (w === "loose") return "Loose";
  if (w === "dusty") return "Dusty";
  return "Dry";
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
  },
  cardActive: {
    backgroundColor: colors.primarySoft,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  name: {
    fontSize: 18,
    lineHeight: 20,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  metaRow: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaText: {
    fontSize: typography.sm,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textTertiary,
  },
  topActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.round,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  tagRow: {
    marginTop: spacing.md,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: spacing.sm,
  },
  tagChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  activePill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.round,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primarySoft2,
  },
  activePillText: {
    fontSize: typography.xs,
    fontFamily: typography.fontFamily.black,
    color: colors.primary,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  summary: {
    fontSize: typography.sm,
    lineHeight: 17,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textSecondary,
  },
  bottomRow: {
    marginTop: spacing.md,
    flexDirection: "row",
    gap: spacing.md,
  },
});
