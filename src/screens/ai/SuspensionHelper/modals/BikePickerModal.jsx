import React from "react";
import { View, Text, Modal, Pressable, StyleSheet } from "react-native";
import { X, ChevronRight } from "lucide-react-native";
import AppButton from "@/components/AppButton";
import { colors, spacing, radius, typography, shadows } from "@/theme/index";

export function BikePickerModal({
  visible,
  bikeList,
  selectedBikeId,
  onSelectBike,
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
            <Text style={styles.sheetTitle}>Choose a bike</Text>
            <Pressable onPress={onClose} hitSlop={10}>
              <X size={18} color={colors.textSecondary} strokeWidth={2.75} />
            </Pressable>
          </View>
          <Text style={styles.sheetSub}>Presets are saved per bike.</Text>

          <View style={{ height: spacing.md }} />

          <View style={{ gap: spacing.sm }}>
            {bikeList.map((b) => {
              const selected = String(selectedBikeId || "") === String(b.id);
              return (
                <Pressable
                  key={b.id}
                  onPress={() => onSelectBike(b.id)}
                  style={[
                    styles.bikeRow,
                    selected ? styles.bikeRowSelected : null,
                  ]}
                >
                  <Text style={styles.bikeRowText}>{b.name}</Text>
                  {selected ? (
                    <View style={styles.selectedPill}>
                      <Text style={styles.selectedPillText}>Selected</Text>
                    </View>
                  ) : (
                    <ChevronRight
                      size={18}
                      color={colors.textSecondary}
                      strokeWidth={2.75}
                    />
                  )}
                </Pressable>
              );
            })}
          </View>

          <View style={{ height: spacing.lg }} />
          <AppButton title="Done" variant="secondary" onPress={onClose} />
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
  sheetSub: {
    marginTop: 6,
    fontSize: typography.sm,
    lineHeight: 17,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textSecondary,
  },
  bikeRow: {
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceWarm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  bikeRowSelected: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primarySoft2,
  },
  bikeRowText: {
    fontSize: typography.base,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
  },
  selectedPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.round,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectedPillText: {
    fontSize: typography.xs,
    fontFamily: typography.fontFamily.black,
    color: colors.primary,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
});
