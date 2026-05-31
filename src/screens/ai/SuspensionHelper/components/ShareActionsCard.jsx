import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Copy } from "lucide-react-native";
import AppCard from "@/components/AppCard";
import AppButton from "@/components/AppButton";
import { colors, spacing, radius, typography } from "@/theme/index";

export function ShareActionsCard({ onCopyShareCard, onShareLink }) {
  return (
    <AppCard style={styles.shareCard} padding={spacing.xl} pressable={false}>
      <View style={styles.shareTop}>
        <View style={styles.shareIcon}>
          <Copy size={18} color={colors.primary} strokeWidth={2.75} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.shareTitle}>Share presets</Text>
          <Text style={styles.shareSub}>
            Copies a clean share card you can paste in chat.
          </Text>
        </View>
      </View>

      <View style={{ height: spacing.md }} />

      <View style={{ gap: spacing.sm }}>
        <AppButton title="Copy share card" onPress={onCopyShareCard} />
        <AppButton
          title="Share link"
          variant="secondary"
          onPress={onShareLink}
        />
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  shareCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  shareTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  shareIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.round,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primarySoft2,
    alignItems: "center",
    justifyContent: "center",
  },
  shareTitle: {
    fontSize: 18,
    lineHeight: 20,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
  },
  shareSub: {
    marginTop: 6,
    fontSize: typography.sm,
    lineHeight: 17,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textSecondary,
  },
});
