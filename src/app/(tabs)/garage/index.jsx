import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { Trash2 } from "lucide-react-native";
import { colors, spacing, typography, radius } from "../../../theme/index";
import { useChainlyStore } from "@/store/chainlyStore";
import { useRidesStore } from "@/store/rides";
import SectionHeader from "../../../components/SectionHeader";
import BikeCard from "../../../components/BikeCard";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidUUID(str) {
  return UUID_REGEX.test(String(str || "").trim());
}

export default function GarageScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const bikes = useChainlyStore((s) => s.bikes);
  const rides = useRidesStore((s) => s.rides);

  const [manageMode, setManageMode] = useState(false);
  const [deletingBikeId, setDeletingBikeId] = useState(null);

  const list = Array.isArray(bikes) ? bikes : [];

  const ridesByBikeId = useMemo(() => {
    const map = new Map();
    const all = Array.isArray(rides) ? rides : [];
    for (const r of all) {
      const id = r?.bike_id ? String(r.bike_id) : null;
      if (!id) continue;
      map.set(id, (map.get(id) || 0) + 1);
    }
    return map;
  }, [rides]);

  const onDeleteBike = useCallback(
    (bike) => {
      const id = String(bike?.id || "");
      const name = bike?.name ? String(bike.name) : "this bike";

      if (!isValidUUID(id)) {
        Alert.alert("Not available", "Demo bikes can’t be deleted.");
        return;
      }

      if (deletingBikeId) {
        return;
      }

      const rideCount = ridesByBikeId.get(id) || 0;
      const rideNote = rideCount
        ? `\n\nRides linked to this bike will be kept but unassigned.`
        : "";

      Alert.alert(
        `Delete ${name}?`,
        `This will remove the bike and its maintenance tracking from your account.${rideNote}`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: async () => {
              try {
                setDeletingBikeId(id);

                const res = await useChainlyStore
                  .getState()
                  .deleteBikeSafe?.(id);

                if (!res?.ok) {
                  throw new Error(res?.error || "Delete failed");
                }

                // Keep rides but detach them locally to avoid dangling UI references.
                try {
                  await useRidesStore.getState().unassignRidesForBike?.(id);
                } catch (e) {
                  console.error(e);
                }

                Alert.alert("Deleted", "Bike removed.");
              } catch (e) {
                console.error(e);
                Alert.alert("Couldn’t delete bike", "Please try again.");
              } finally {
                setDeletingBikeId(null);
              }
            },
          },
        ],
      );
    },
    [deletingBikeId, ridesByBikeId],
  );

  const manageActionLabel = manageMode ? "Done" : "Manage";

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Garage</Text>
        <Text style={styles.subtitle}>
          All your bikes, all your quests. Keep ’em dialed.
        </Text>

        <SectionHeader
          title="Your Bikes"
          action="Add"
          onActionPress={() => router.push("/garage/add-bike")}
        />

        {list.map((bike) => (
          <BikeCard
            key={bike.id}
            bike={bike}
            onPress={() => router.push(`/garage/${bike.id}`)}
          />
        ))}

        {/* Manage Bikes (delete UI) */}
        <View style={{ height: spacing.xxl }} />

        <SectionHeader
          title="Manage Bikes"
          action={manageActionLabel}
          onActionPress={() => setManageMode((v) => !v)}
        />

        <Text style={styles.manageSub}>
          Remove bikes you no longer use. This can’t be undone.
        </Text>

        {manageMode ? (
          <View style={styles.manageList}>
            {list.length ? (
              list.map((b) => {
                const id = String(b?.id || "");
                const canDelete = isValidUUID(id);
                const isDeleting = deletingBikeId === id;

                const rightLabel = !canDelete
                  ? "Demo"
                  : isDeleting
                    ? "Deleting…"
                    : "Delete";

                const rightDisabled = !canDelete || !!deletingBikeId;

                return (
                  <View key={`manage-${id}`} style={styles.manageRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.manageName} numberOfLines={1}>
                        {b?.name ? String(b.name) : "Bike"}
                      </Text>
                      <Text style={styles.manageMeta}>
                        {canDelete
                          ? "Tap delete to remove"
                          : "Demo bikes can’t be deleted"}
                      </Text>
                    </View>

                    <Pressable
                      onPress={() => onDeleteBike(b)}
                      disabled={rightDisabled}
                      hitSlop={10}
                    >
                      <View
                        style={[
                          styles.deleteButton,
                          !canDelete ? styles.deleteButtonDisabled : null,
                        ]}
                      >
                        {canDelete ? (
                          <Trash2 size={14} color={colors.surface} />
                        ) : null}
                        <Text style={styles.deleteButtonText}>
                          {rightLabel}
                        </Text>
                      </View>
                    </Pressable>
                  </View>
                );
              })
            ) : (
              <View style={styles.emptyManage}>
                <Text style={styles.emptyManageTitle}>No bikes yet</Text>
                <Text style={styles.emptyManageSub}>
                  Add a bike to start tracking maintenance.
                </Text>
              </View>
            )}
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.xl,
  },
  title: {
    fontSize: 32,
    lineHeight: 34,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    letterSpacing: -0.6,
  },
  subtitle: {
    fontSize: typography.base,
    lineHeight: 20,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    marginBottom: spacing.xxxl,
  },

  manageSub: {
    marginTop: -spacing.lg,
    marginBottom: spacing.lg,
    fontSize: typography.base,
    lineHeight: 18,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },

  manageList: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: radius.xl,
    overflow: "hidden",
  },
  manageRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  manageName: {
    fontSize: typography.base,
    lineHeight: 18,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textPrimary,
  },
  manageMeta: {
    marginTop: 3,
    fontSize: typography.sm,
    lineHeight: 16,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },

  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: colors.danger,
    borderRadius: radius.round,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  deleteButtonDisabled: {
    backgroundColor: colors.border,
  },
  deleteButtonText: {
    fontSize: typography.sm,
    fontFamily: typography.fontFamily.black,
    color: colors.surface,
  },

  emptyManage: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  emptyManageTitle: {
    fontSize: typography.base,
    lineHeight: 18,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
  },
  emptyManageSub: {
    marginTop: 6,
    fontSize: typography.base,
    lineHeight: 18,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
});
