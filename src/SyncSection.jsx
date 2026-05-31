import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Database, Download } from "lucide-react-native";
import AppCard from "@/components/AppCard";
import { SectionHeader } from "@/settings/components/SectionHeader";
import { Divider } from "@/settings/components/Divider";
import { Row } from "@/settings/components/Row";
import { colors, spacing, typography } from "@/theme/index";

export default function SyncSection({
  syncing,
  syncError,
  syncSummary,
  pendingSummary,
  onSyncNow,
}) {
  return (
    <>
      <SectionHeader title="Sync" />
      <AppCard style={styles.sectionCard} pressable={false}>
        <Row
          icon={Database}
          title={syncing ? "Syncing…" : "Sync now"}
          sub={syncSummary}
          onPress={onSyncNow}
        />
        <Divider />
        <Row
          icon={Download}
          title="Offline changes"
          sub={pendingSummary}
          onPress={onSyncNow}
        />
        {syncError ? (
          <Text style={styles.sectionHint}>{syncError}</Text>
        ) : (
          <Text style={styles.sectionHint}>
            Local-first always. If you're offline, we'll sync when you're back.
          </Text>
        )}
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
