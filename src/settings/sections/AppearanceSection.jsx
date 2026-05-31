import React from "react";
import { View, Alert, StyleSheet } from "react-native";
import { Palette } from "lucide-react-native";
import AppCard from "@/components/AppCard";
import { SectionHeader } from "../components/SectionHeader";
import { Divider } from "../components/Divider";
import { Row } from "../components/Row";
import { colors } from "@/theme/index";

export function AppearanceSection({ settings, update, onHaptic }) {
  return (
    <>
      <SectionHeader title="Appearance & app behavior" />
      <AppCard style={styles.sectionCard} pressable={false}>
        <Row
          icon={Palette}
          title="Units"
          sub={settings?.appearance?.units || "Metric"}
          onPress={async () => {
            await onHaptic();
            const next =
              settings?.appearance?.units === "Metric" ? "Imperial" : "Metric";
            await update("appearance.units", next);
          }}
        />
        <Divider />
        <Row
          icon={Palette}
          title="Language"
          sub={settings?.appearance?.language || "English"}
          onPress={async () => {
            await onHaptic();
            Alert.alert("Language", "Stub for now — English only.");
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
