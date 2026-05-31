import React from "react";
import { View, Alert, StyleSheet } from "react-native";
import { Shield } from "lucide-react-native";
import AppCard from "@/components/AppCard";
import { SectionHeader } from "../components/SectionHeader";
import { Divider } from "../components/Divider";
import { Row } from "../components/Row";
import { colors } from "@/theme/index";

export function SafetySection({ onHaptic }) {
  return (
    <>
      <SectionHeader title="Safety & trust" />
      <AppCard style={styles.sectionCard} pressable={false}>
        <Row
          icon={Shield}
          title="Safety disclaimer"
          sub="Ride within your limits"
          onPress={async () => {
            await onHaptic();
            Alert.alert(
              "Safety first",
              "Chainly is coaching, not a guarantee. Wear your gear, check trails, and ride smart.",
            );
          }}
        />
        <Divider />
        <Row
          icon={Shield}
          title="AI limitations"
          sub="What the AI can and can't know"
          onPress={async () => {
            await onHaptic();
            Alert.alert(
              "AI limitations",
              "AI can miss context (trail conditions, camera angles, rider fatigue). Use it as a buddy — not a boss.",
            );
          }}
        />
        <Divider />
        <Row
          icon={Shield}
          title="Mechanical advice"
          sub="Not a substitute for a mechanic"
          onPress={async () => {
            await onHaptic();
            Alert.alert(
              "Mechanical advice",
              "If something feels unsafe, stop and get it checked. We'll keep guidance cautious.",
            );
          }}
        />
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
});
