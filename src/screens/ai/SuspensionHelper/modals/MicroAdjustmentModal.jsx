import React from "react";
import { View, Text, Modal, Pressable, StyleSheet } from "react-native";
import { X } from "lucide-react-native";
import AppCard from "@/components/AppCard";
import AppButton from "@/components/AppButton";
import { colors, spacing, radius, typography, shadows } from "@/theme/index";

export function MicroAdjustmentModal({
  visible,
  microItem,
  onApplyTemporary,
  onSaveAsPreset,
  onClose,
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.sheetOverlay} onPress={onClose}>
        <Pressable style={styles.sheetCard} onPress={() => {}}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>
              {microItem?.title || "Adjustment"}
            </Text>
            <Pressable onPress={onClose} hitSlop={10}>
              <X size={18} color={colors.textSecondary} strokeWidth={2.75} />
            </Pressable>
          </View>

          <Text style={styles.microExplain}>
            {microItem?.explanation || ""}
          </Text>

          <View style={{ height: spacing.md }} />

          <AppCard
            style={styles.microBox}
            padding={spacing.lg}
            pressable={false}
          >
            <Text style={styles.microBoxTitle}>Try this</Text>
            <View style={{ height: spacing.sm }} />
            {(microItem?.changes || []).map((c) => (
              <View key={c.label} style={styles.microChangeRow}>
                <View style={styles.microBullet} />
                <Text style={styles.microChangeText}>{c.label}</Text>
                <View style={styles.microAppliesPill}>
                  <Text style={styles.microAppliesText}>
                    {String(c.appliesTo || "").toUpperCase()}
                  </Text>
                </View>
              </View>
            ))}
          </AppCard>

          <View style={{ height: spacing.lg }} />

          <View style={{ gap: spacing.sm }}>
            <AppButton
              title="Apply as Temporary Adjustment"
              onPress={onApplyTemporary}
            />
            <AppButton
              title="Save as New Preset"
              variant="secondary"
              onPress={onSaveAsPreset}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheetOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
    padding: spacing.lg,
  },
  sheetCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    ...shadows.large,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sheetTitle: {
    fontSize: 18,
    lineHeight: 20,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  microExplain: {
    marginTop: spacing.md,
    fontSize: typography.base,
    lineHeight: 20,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
  microBox: {
    backgroundColor: colors.surfaceWarm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  microBoxTitle: {
    fontSize: typography.base,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
  },
  microChangeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: 8,
  },
  microBullet: {
    width: 8,
    height: 8,
    borderRadius: radius.round,
    backgroundColor: colors.primary,
  },
  microChangeText: {
    flex: 1,
    fontSize: typography.base,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textPrimary,
  },
  microAppliesPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.round,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  microAppliesText: {
    fontSize: typography.xs,
    fontFamily: typography.fontFamily.black,
    color: colors.textSecondary,
    letterSpacing: 0.4,
  },
});
