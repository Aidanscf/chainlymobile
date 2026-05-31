import React from "react";
import { View, Alert, StyleSheet } from "react-native";
import { RotateCcw, Trash2 } from "lucide-react-native";
import AppCard from "@/components/AppCard";
import { SectionHeader } from "../components/SectionHeader";
import { Divider } from "../components/Divider";
import { Row } from "../components/Row";
import { colors } from "@/theme/index";

export function AdvancedSection({ onHaptic, onConfirmReset }) {
  return (
    <>
      <SectionHeader title="Advanced" />
      <AppCard style={styles.sectionCard} pressable={false}>
        <Row
          icon={RotateCcw}
          title="Reset onboarding"
          sub="Show first-time flow again (stub)"
          onPress={async () => {
            await onHaptic();
            Alert.alert("Reset onboarding", "Stub for now.");
          }}
        />
        <Divider />
        <Row
          icon={RotateCcw}
          title="Reset tutorial hints"
          sub="Bring back tips and tooltips (stub)"
          onPress={async () => {
            await onHaptic();
            Alert.alert("Reset hints", "Stub for now.");
          }}
        />
        <Divider />
        <Row
          icon={Trash2}
          title="Reset all settings"
          sub="Back to defaults"
          onPress={onConfirmReset}
          danger
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
