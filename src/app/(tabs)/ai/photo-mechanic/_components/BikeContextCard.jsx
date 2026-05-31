import React from "react";
import { View, Text, Pressable, ActivityIndicator } from "react-native";
import AppCard from "@/components/AppCard";
import { colors, spacing, radius, typography } from "@/theme/index";

export function BikeContextCard({
  selectedBike,
  bikeList,
  bikesQuery,
  canChangeBikeContext,
  isLoading,
  step,
  onOpenBikePicker,
  onClearBikeContext,
}) {
  return (
    <AppCard style={styles.contextCard}>
      <View style={styles.contextTopRow}>
        <Text style={styles.contextTitle}>Add bike context (optional)</Text>
        {selectedBike ? (
          <Pressable
            onPress={onClearBikeContext}
            hitSlop={10}
            disabled={!canChangeBikeContext || isLoading}
          >
            <Text
              style={[
                styles.contextAction,
                !canChangeBikeContext || isLoading
                  ? styles.contextActionDisabled
                  : null,
              ]}
            >
              Clear
            </Text>
          </Pressable>
        ) : null}
      </View>

      <Pressable
        onPress={onOpenBikePicker}
        disabled={!canChangeBikeContext || isLoading}
        style={[
          styles.contextSelectRow,
          !canChangeBikeContext || isLoading
            ? styles.contextSelectRowDisabled
            : null,
        ]}
      >
        <View style={{ flex: 1 }}>
          <Text style={styles.contextSelectLabel}>Bike</Text>
          <Text style={styles.contextSelectValue} numberOfLines={1}>
            {selectedBike?.name
              ? String(selectedBike.name)
              : bikeList.length
                ? "Select a bike"
                : bikesQuery.isLoading
                  ? "Loading bikes…"
                  : "No bikes yet"}
          </Text>
        </View>
        {bikesQuery.isLoading ? (
          <ActivityIndicator size="small" color={colors.textSecondary} />
        ) : null}
      </Pressable>

      {step !== "describe" ? (
        <Text style={styles.contextNote}>
          Note: bike context can only be changed before you tap Next.
        </Text>
      ) : null}
    </AppCard>
  );
}

const styles = {
  contextCard: {
    marginBottom: spacing.lg,
    backgroundColor: colors.surfaceWarm,
    borderColor: colors.border,
  },
  contextTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  contextTitle: {
    fontSize: 14,
    lineHeight: 16,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
  },
  contextAction: {
    fontSize: 13,
    fontFamily: typography.fontFamily.bold,
    color: colors.textSecondary,
  },
  contextActionDisabled: {
    opacity: 0.5,
  },
  contextSelectRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  contextSelectRowDisabled: {
    opacity: 0.7,
  },
  contextSelectLabel: {
    fontSize: typography.sm,
    fontFamily: typography.fontFamily.bold,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  contextSelectValue: {
    fontSize: typography.base,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textPrimary,
  },
  contextNote: {
    marginTop: spacing.sm,
    fontSize: typography.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
};

export default BikeContextCard;
