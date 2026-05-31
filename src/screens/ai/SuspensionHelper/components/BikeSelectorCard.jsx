import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Bike, ChevronRight } from "lucide-react-native";
import AppCard from "@/components/AppCard";
import { colors, spacing, radius, typography } from "@/theme/index";

export function BikeSelectorCard({ selectedBikeLabel, onPress }) {
  return (
    <AppCard style={styles.selectorCard} padding={spacing.xl} onPress={onPress}>
      <View style={styles.selectorTop}>
        <View style={styles.selectorIcon}>
          <Bike size={18} color={colors.primary} strokeWidth={2.75} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.selectorLabel}>Bike</Text>
          <Text style={styles.selectorValue} numberOfLines={1}>
            {selectedBikeLabel}
          </Text>
          <Text style={styles.selectorHelper}>Presets are saved per bike.</Text>
        </View>
        <ChevronRight
          size={18}
          color={colors.textSecondary}
          strokeWidth={2.75}
        />
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  selectorCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  selectorTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  selectorIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.round,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primarySoft2,
    alignItems: "center",
    justifyContent: "center",
  },
  selectorLabel: {
    fontSize: typography.xs,
    fontFamily: typography.fontFamily.black,
    color: colors.textSecondary,
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
  selectorValue: {
    marginTop: 6,
    fontSize: typography.lg,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  selectorHelper: {
    marginTop: 6,
    fontSize: typography.sm,
    lineHeight: 17,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textSecondary,
  },
});
