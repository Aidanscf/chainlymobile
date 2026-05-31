import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Bot } from "lucide-react-native";
import AppCard from "@/components/AppCard";
import { SectionHeader } from "@/settings/components/SectionHeader";
import { Divider } from "@/settings/components/Divider";
import { Row } from "@/settings/components/Row";
import { ToggleRow } from "@/settings/components/ToggleRow";
import { colors, spacing, typography } from "@/theme/index";

export function AISection({ settings, update, onHaptic }) {
  return (
    <>
      <SectionHeader title="AI & coaching" />
      <AppCard style={styles.sectionCard} pressable={false}>
        <Row
          icon={Bot}
          title="Coaching style"
          sub={settings?.ai?.coachingStyle || "Encouraging"}
          onPress={async () => {
            await onHaptic();
            const current = settings?.ai?.coachingStyle || "Encouraging";
            const next =
              current === "Encouraging"
                ? "Balanced"
                : current === "Balanced"
                  ? "Direct"
                  : "Encouraging";
            await update("ai.coachingStyle", next);
          }}
        />
        <Divider />
        <Row
          icon={Bot}
          title="Analysis strictness"
          sub={settings?.ai?.analysisStrictness || "Normal"}
          onPress={async () => {
            await onHaptic();
            const current = settings?.ai?.analysisStrictness || "Normal";
            const next =
              current === "Forgiving"
                ? "Normal"
                : current === "Normal"
                  ? "Strict"
                  : "Forgiving";
            await update("ai.analysisStrictness", next);
          }}
        />
        <Divider />
        <ToggleRow
          icon={Bot}
          title="Auto-save AI results"
          sub="Keep your coaching history for comparisons"
          value={!!settings?.ai?.autoSaveAIResults}
          onValueChange={(v) => update("ai.autoSaveAIResults", !!v)}
        />
        <Divider />
        <ToggleRow
          icon={Bot}
          title="AI can update skill stats"
          sub="Lets Analyzer Coach grow your skills over time"
          value={!!settings?.ai?.allowAISkillUpdates}
          onValueChange={(v) => update("ai.allowAISkillUpdates", !!v)}
        />
        <Text style={styles.sectionHint}>
          Customize how intense or chill your AI coach feels.
        </Text>
      </AppCard>
    </>
  );
}

const styles = StyleSheet.create({
  sectionCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    padding: 0,
    overflow: "hidden",
  },
  sectionHint: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    marginTop: -6,
    fontSize: 12,
    lineHeight: 16,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
});
