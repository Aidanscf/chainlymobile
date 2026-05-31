import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Shield } from "lucide-react-native";
import AppCard from "@/components/AppCard";
import { SectionHeader } from "@/settings/components/SectionHeader";
import { Divider } from "@/settings/components/Divider";
import { Row } from "@/settings/components/Row";
import { ToggleRow } from "@/settings/components/ToggleRow";
import { colors, spacing, typography } from "@/theme/index";

export function SocialSection({ settings, update, onHaptic }) {
  return (
    <>
      <SectionHeader title="Social & privacy" />
      <AppCard style={styles.sectionCard} pressable={false}>
        <Row
          icon={Shield}
          title="Who can see my profile"
          sub={settings?.social?.profileVisibility || "Friends"}
          onPress={async () => {
            await onHaptic();
            const current = settings?.social?.profileVisibility || "Friends";
            const next =
              current === "Everyone"
                ? "Friends"
                : current === "Friends"
                  ? "Private"
                  : "Everyone";
            await update("social.profileVisibility", next);
          }}
        />
        <Divider />
        <ToggleRow
          icon={Shield}
          title="Allow friend comparisons"
          sub="Lets friends compare stats and leagues"
          value={!!settings?.social?.allowCompare}
          onValueChange={(v) => update("social.allowCompare", !!v)}
        />
        <Divider />
        <ToggleRow
          icon={Shield}
          title="Allow activity visibility"
          sub="Show rides and progress to your crew"
          value={!!settings?.social?.allowActivityView}
          onValueChange={(v) => update("social.allowActivityView", !!v)}
        />
        <Divider />
        <ToggleRow
          icon={Shield}
          title="Allow ride nudges from friends"
          sub="Friends can tap 'Nudge to ride'"
          value={!!settings?.social?.allowFriendNudges}
          onValueChange={(v) => update("social.allowFriendNudges", !!v)}
        />
        <Text style={styles.sectionHint}>
          Privacy-first. You control the vibe.
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
