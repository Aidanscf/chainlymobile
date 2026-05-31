import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Plus } from "lucide-react-native";
import AppCard from "@/components/AppCard";
import AppButton from "@/components/AppButton";
import { colors, spacing, radius, typography } from "@/theme/index";

export function CreateNewCard({ onPress }) {
  return (
    <AppCard style={styles.ctaCard} padding={spacing.xl} pressable={false}>
      <View style={styles.ctaTop}>
        <View style={styles.ctaIcon}>
          <Plus size={18} color={colors.primary} strokeWidth={2.75} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.ctaTitle}>Create New Setup</Text>
          <Text style={styles.ctaSub}>
            Answer a few questions and I'll generate a baseline.
          </Text>
        </View>
      </View>
      <View style={{ height: spacing.md }} />
      <AppButton title="Create New Setup" onPress={onPress} />
    </AppCard>
  );
}

const styles = StyleSheet.create({
  ctaCard: {
    marginTop: spacing.lg,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primarySoft2,
  },
  ctaTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  ctaIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.round,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primarySoft2,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaTitle: {
    fontSize: 18,
    lineHeight: 20,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  ctaSub: {
    marginTop: 6,
    fontSize: typography.sm,
    lineHeight: 17,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textSecondary,
  },
});
