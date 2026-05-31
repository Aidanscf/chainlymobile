import React from "react";
import { View, Text, Modal, Pressable, StyleSheet } from "react-native";
import { Share2, Copy, Trash2 } from "lucide-react-native";
import AppButton from "@/components/AppButton";
import { MenuRow } from "../components/MenuRow";
import { colors, spacing, radius, typography, shadows } from "@/theme/index";

export function PresetMenuModal({
  visible,
  preset,
  onCopyShareCard,
  onDuplicate,
  onDelete,
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
        <Pressable style={styles.menuCard} onPress={() => {}}>
          <Text style={styles.menuTitle} numberOfLines={1}>
            {preset?.name || "Preset"}
          </Text>

          <View style={{ height: spacing.md }} />

          <MenuRow
            icon={Share2}
            title="Copy share card"
            onPress={() => {
              onClose();
              onCopyShareCard();
            }}
          />
          <MenuRow
            icon={Copy}
            title="Duplicate"
            onPress={() => {
              onClose();
              onDuplicate();
            }}
          />
          <MenuRow
            icon={Trash2}
            title="Delete"
            danger
            onPress={() => {
              onClose();
              onDelete();
            }}
          />

          <View style={{ height: spacing.sm }} />
          <AppButton title="Close" variant="secondary" onPress={onClose} />
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
  menuCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    ...shadows.large,
  },
  menuTitle: {
    fontSize: 16,
    lineHeight: 18,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
  },
});
