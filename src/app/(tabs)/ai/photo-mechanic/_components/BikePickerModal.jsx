import React from "react";
import { View, Text, Modal, Pressable, ActivityIndicator } from "react-native";
import AppCard from "@/components/AppCard";
import AppButton from "@/components/AppButton";
import Chip from "@/components/Chip";
import { colors, spacing, radius, typography } from "@/theme/index";

export function BikePickerModal({
  visible,
  onClose,
  bikesQuery,
  bikeList,
  selectedBikeId,
  onSelectBike,
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
              <Text style={styles.sheetClose}>Close</Text>
            </Pressable>
          </View>
          <Text style={styles.sheetSub}>
            This helps the AI tailor advice (disc vs rim, tubeless, etc.).
          </Text>

          <View style={{ height: spacing.md }} />

          {bikesQuery.isLoading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color={colors.textSecondary} />
              <Text style={styles.loadingText}>Loading bikes…</Text>
            </View>
          ) : bikesQuery.isError ? (
            <AppCard style={styles.inlineErrorCard}>
              <Text style={styles.inlineErrorTitle}>Couldn't load bikes</Text>
              <Text style={styles.inlineErrorText}>
                You can still continue without bike context.
              </Text>
              <View style={{ marginTop: spacing.md }}>
                <AppButton
                  title="Retry"
                  variant="secondary"
                  onPress={() => bikesQuery.refetch()}
                />
              </View>
            </AppCard>
          ) : bikeList.length ? (
            <View style={{ gap: spacing.sm }}>
              {bikeList.map((b) => {
                const selected =
                  String(selectedBikeId || "") === String(b?.id || "");
                return (
                  <Pressable
                    key={String(b?.id)}
                    onPress={() => {
                      onSelectBike(b?.id);
                      onClose();
                    }}
                    style={[
                      styles.bikeRow,
                      selected ? styles.bikeRowSelected : null,
                    ]}
                  >
                    <Text style={styles.bikeRowText}>{b?.name}</Text>
                    {selected ? (
                      <Chip
                        label="Selected"
                        selected
                        tone="orange"
                        style={{ marginLeft: spacing.md }}
                      />
                    ) : null}
                  </Pressable>
                );
              })}

              <Pressable
                onPress={() => {
                  onSelectBike(null);
                  onClose();
                }}
                style={styles.bikeRow}
              >
                <Text style={styles.bikeRowText}>Continue without context</Text>
              </Pressable>
            </View>
          ) : (
            <Text style={styles.emptyText}>
              No bikes found yet. Add one in your Garage when you're ready.
            </Text>
          )}

          <View style={{ height: spacing.lg }} />
          <AppButton title="Done" variant="secondary" onPress={onClose} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = {
  sheetOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    padding: spacing.xl,
    justifyContent: "center",
  },
  sheetCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
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
  },
  sheetClose: {
    fontSize: 14,
    fontFamily: typography.fontFamily.bold,
    color: colors.textSecondary,
  },
  sheetSub: {
    marginTop: spacing.sm,
    fontSize: typography.base,
    lineHeight: 19,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
  bikeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceWarm,
  },
  bikeRowSelected: {
    borderColor: colors.accent,
  },
  bikeRowText: {
    flex: 1,
    fontSize: typography.base,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  loadingText: {
    fontSize: typography.base,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
  inlineErrorCard: {
    backgroundColor: colors.dangerLight,
    borderWidth: 1,
    borderColor: "#FFD0CD",
  },
  inlineErrorTitle: {
    fontSize: 16,
    lineHeight: 18,
    fontFamily: typography.fontFamily.black,
    color: colors.danger,
    marginBottom: spacing.sm,
  },
  inlineErrorText: {
    fontSize: typography.base,
    lineHeight: 19,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textPrimary,
  },
  emptyText: {
    fontSize: typography.base,
    lineHeight: 19,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
};
