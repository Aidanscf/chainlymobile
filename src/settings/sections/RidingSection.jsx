import React from "react";
import { View, Text, Alert, StyleSheet } from "react-native";
import { Bike, Target } from "lucide-react-native";
import AppCard from "@/components/AppCard";
import { SectionHeader } from "../components/SectionHeader";
import { Divider } from "../components/Divider";
import { Row } from "../components/Row";
import { colors, spacing, typography } from "@/theme/index";
import { FEATURE_TRIP_PLANNER_ENABLED } from "@/utils/featureFlags";

export function RidingSection({ settings, update, onHaptic }) {
  const terrainAlertBody = FEATURE_TRIP_PLANNER_ENABLED
    ? "MVP: editable in a follow-up screen. (Used by AI + Trip Planner.)"
    : "MVP: editable in a follow-up screen. (Used by AI.)";

  const sectionHintText = FEATURE_TRIP_PLANNER_ENABLED
    ? "These tune your AI coach + trip ideas."
    : "These tune your AI coach.";

  return (
    <>
      <SectionHeader title="Riding & bike preferences" />
      <AppCard style={styles.sectionCard} pressable={false}>
        <Row
          icon={Bike}
          title="Default bike"
          sub={settings?.riding?.defaultBikeId ? "Selected" : "Not set"}
          onPress={async () => {
            await onHaptic();
            Alert.alert(
              "Default bike",
              "MVP stub: we'll wire this to your Garage bikes next.",
            );
          }}
        />
        <Divider />
        <Row
          icon={Target}
          title="Riding goals"
          sub={(settings?.riding?.goals || []).join(" • ")}
          onPress={async () => {
            await onHaptic();
            Alert.alert(
              "Riding goals",
              "MVP: you can edit these in a follow-up screen. Want me to build it next?",
            );
          }}
        />
        <Divider />
        <Row
          icon={Target}
          title="Preferred terrain"
          sub={(settings?.riding?.terrain || []).join(" • ")}
          onPress={async () => {
            await onHaptic();
            Alert.alert("Terrain", terrainAlertBody);
          }}
        />
        <Divider />
        <Row
          icon={Target}
          title="Typical ride duration"
          sub={`${settings?.riding?.typicalDurationMins || 60} min`}
          onPress={async () => {
            await onHaptic();
            const next = settings?.riding?.typicalDurationMins === 60 ? 90 : 60;
            await update("riding.typicalDurationMins", next);
          }}
        />
        <Divider />
        <Row
          icon={Target}
          title="Skill level"
          sub={settings?.riding?.skillLevel || "Intermediate"}
          onPress={async () => {
            await onHaptic();
            const current = settings?.riding?.skillLevel || "Intermediate";
            const next =
              current === "Beginner"
                ? "Intermediate"
                : current === "Intermediate"
                  ? "Advanced"
                  : "Beginner";
            await update("riding.skillLevel", next);
          }}
        />
        <Text style={styles.sectionHint}>{sectionHintText}</Text>
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
