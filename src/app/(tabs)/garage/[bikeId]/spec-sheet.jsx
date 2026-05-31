import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
  TextInput,
  Alert,
  Switch,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  Pencil,
  Ruler,
  Settings,
  SlidersHorizontal,
  Circle,
  Disc,
  Hand,
  X,
  ChevronDown,
  ChevronRight,
} from "lucide-react-native";

import ScreenHeader from "@/components/layout/ScreenHeader";
import AppCard from "@/components/AppCard";
import AppButton from "@/components/AppButton";
import KeyboardAvoidingAnimatedView from "@/components/KeyboardAvoidingAnimatedView";
import { colors, spacing, radius, typography, shadows } from "@/theme/index";
import { useChainlyStore } from "@/store/chainlyStore";

function SectionIcon({ Icon }) {
  return (
    <View style={styles.sectionIcon}>
      <Icon size={18} color={colors.primary} strokeWidth={2.5} />
    </View>
  );
}

function SpecRow({ label, value, onEdit, first }) {
  return (
    <View style={[styles.row, first && styles.rowFirst]}>
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={styles.rowRight}>
        <Text style={styles.rowValue} numberOfLines={2}>
          {value}
        </Text>
        <Pressable onPress={onEdit} hitSlop={10} style={styles.editButton}>
          <Pencil size={16} color={colors.textTertiary} strokeWidth={2.5} />
        </Pressable>
      </View>
    </View>
  );
}

function ToggleSpecRow({ label, value, onToggle, first, disabled, helper }) {
  const valueText = value ? "Tubeless" : "Tubes";
  return (
    <View style={[styles.row, first && styles.rowFirst]}>
      <View style={{ flex: 1, paddingRight: spacing.md }}>
        <Text style={[styles.rowLabel, { width: "auto" }]}>{label}</Text>
        {helper ? <Text style={styles.rowHelper}>{helper}</Text> : null}
      </View>

      <View style={styles.rowRight}>
        <Text style={styles.rowValue} numberOfLines={1}>
          {valueText}
        </Text>
        <Switch
          value={!!value}
          onValueChange={onToggle}
          disabled={disabled}
          trackColor={{
            false: colors.border,
            true: colors.primary,
          }}
          thumbColor={colors.surface}
        />
      </View>
    </View>
  );
}

export default function SpecSheetScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { bikeId } = useLocalSearchParams();

  const id = String(bikeId);
  const bike = useChainlyStore((s) => s.getBikeById(id));
  const detail = useChainlyStore((s) => s.getBikeDetailById(id));
  const updateBikeSpecValue = useChainlyStore((s) => s.updateBikeSpecValue);

  const sheet = detail?.specSheet || [];

  const hydrateBikeGarageFromServer = useChainlyStore(
    (s) => s.hydrateBikeGarageFromServer,
  );

  useEffect(() => {
    // Best-effort: pulls canonical specs + components (falls back safely offline)
    hydrateBikeGarageFromServer?.(id);
  }, [hydrateBikeGarageFromServer, id]);

  const [editing, setEditing] = useState(null); // { sectionKey, label, value, rowKey }
  const [draftValue, setDraftValue] = useState("");
  const inputRef = useRef(null);

  const [savingTubeless, setSavingTubeless] = useState(false);

  const isTubeless = useMemo(() => {
    return Boolean(bike?.is_tubeless ?? bike?.tubeless ?? false);
  }, [bike?.is_tubeless, bike?.tubeless]);

  const onToggleTubeless = useCallback(
    async (nextValue) => {
      if (!id) return;
      if (savingTubeless) return;

      try {
        setSavingTubeless(true);
        const result = await updateBikeSpecValue({
          bikeId: id,
          sectionKey: "wheels",
          label: "Tubeless setup",
          value: Boolean(nextValue),
          rowKey: "bike.is_tubeless",
        });

        if (result && result.ok === false) {
          Alert.alert("Can’t update setup", result.error || "Try again.");
          return;
        }
      } catch (e) {
        console.error(e);
        Alert.alert("Can’t update setup", "Try again.");
      } finally {
        setSavingTubeless(false);
      }
    },
    [id, savingTubeless, updateBikeSpecValue],
  );

  const editTitle = useMemo(() => {
    if (!editing) {
      return "Edit";
    }
    return String(editing.label || "Edit");
  }, [editing]);

  const onPickBrakePadCompound = useCallback(() => {
    if (!id) return;

    Alert.alert("Brake Pad Compound", "Pick the pad type you run.", [
      {
        text: "Resin (Organic)",
        onPress: async () => {
          await updateBikeSpecValue({
            bikeId: id,
            sectionKey: "brakes",
            label: "Brake Pad Compound",
            value: "resin",
            rowKey: "bike.brake_pad_compound",
          });
        },
      },
      {
        text: "Semi-metallic",
        onPress: async () => {
          await updateBikeSpecValue({
            bikeId: id,
            sectionKey: "brakes",
            label: "Brake Pad Compound",
            value: "semi_metallic",
            rowKey: "bike.brake_pad_compound",
          });
        },
      },
      {
        text: "Metallic (Sintered)",
        onPress: async () => {
          await updateBikeSpecValue({
            bikeId: id,
            sectionKey: "brakes",
            label: "Brake Pad Compound",
            value: "metallic",
            rowKey: "bike.brake_pad_compound",
          });
        },
      },
      {
        text: "Unknown",
        onPress: async () => {
          await updateBikeSpecValue({
            bikeId: id,
            sectionKey: "brakes",
            label: "Brake Pad Compound",
            value: "unknown",
            rowKey: "bike.brake_pad_compound",
          });
        },
      },
      { text: "Cancel", style: "cancel" },
    ]);
  }, [id, updateBikeSpecValue]);

  const onPickBrakeFluidType = useCallback(() => {
    if (!id) return;

    Alert.alert("Brake Fluid Type", "Pick the brake fluid your system uses.", [
      {
        text: "DOT",
        onPress: async () => {
          await updateBikeSpecValue({
            bikeId: id,
            sectionKey: "brakes",
            label: "Brake Fluid Type",
            value: "dot",
            rowKey: "bike.brake_fluid_type",
          });
        },
      },
      {
        text: "Mineral oil",
        onPress: async () => {
          await updateBikeSpecValue({
            bikeId: id,
            sectionKey: "brakes",
            label: "Brake Fluid Type",
            value: "mineral",
            rowKey: "bike.brake_fluid_type",
          });
        },
      },
      {
        text: "Unknown",
        onPress: async () => {
          await updateBikeSpecValue({
            bikeId: id,
            sectionKey: "brakes",
            label: "Brake Fluid Type",
            value: "unknown",
            rowKey: "bike.brake_fluid_type",
          });
        },
      },
      { text: "Cancel", style: "cancel" },
    ]);
  }, [id, updateBikeSpecValue]);

  const openEdit = useCallback(
    (sectionKey, row) => {
      const rowKey = row?.key ? String(row.key) : null;

      // Special-case: these are pickers, not free-text.
      if (rowKey === "bike.brake_pad_compound") {
        onPickBrakePadCompound();
        return;
      }
      if (rowKey === "bike.brake_fluid_type") {
        onPickBrakeFluidType();
        return;
      }

      if (rowKey === "bike.wheel_config") {
        Alert.alert("Wheel config", "Pick your wheel setup.", [
          {
            text: '29"',
            onPress: async () => {
              await updateBikeSpecValue({
                bikeId: id,
                sectionKey: "wheels",
                label: "Wheel Config",
                value: "29",
                rowKey: "bike.wheel_config",
              });
            },
          },
          {
            text: '27.5"',
            onPress: async () => {
              await updateBikeSpecValue({
                bikeId: id,
                sectionKey: "wheels",
                label: "Wheel Config",
                value: "27.5",
                rowKey: "bike.wheel_config",
              });
            },
          },
          {
            text: "Mullet (29F / 27.5R)",
            onPress: async () => {
              await updateBikeSpecValue({
                bikeId: id,
                sectionKey: "wheels",
                label: "Wheel Config",
                value: "mullet_29f_27.5r",
                rowKey: "bike.wheel_config",
              });
            },
          },
          {
            text: "Mixed / Other",
            onPress: async () => {
              await updateBikeSpecValue({
                bikeId: id,
                sectionKey: "wheels",
                label: "Wheel Config",
                value: "mixed_other",
                rowKey: "bike.wheel_config",
              });
            },
          },
          {
            text: "Unknown",
            onPress: async () => {
              await updateBikeSpecValue({
                bikeId: id,
                sectionKey: "wheels",
                label: "Wheel Config",
                value: "unknown",
                rowKey: "bike.wheel_config",
              });
            },
          },
          { text: "Cancel", style: "cancel" },
        ]);
        return;
      }

      setEditing({
        sectionKey: String(sectionKey),
        label: String(row?.label || ""),
        value: String(row?.value || ""),
        rowKey,
      });
      setDraftValue(String(row?.value || ""));
    },
    [id, onPickBrakeFluidType, onPickBrakePadCompound, updateBikeSpecValue],
  );

  const closeEdit = useCallback(() => {
    setEditing(null);
    setDraftValue("");
  }, []);

  useEffect(() => {
    if (!editing) {
      return;
    }
    const t = setTimeout(() => {
      try {
        inputRef.current?.focus?.();
      } catch (e) {
        // no-op
      }
    }, 80);
    return () => clearTimeout(t);
  }, [editing]);

  const onSave = useCallback(async () => {
    if (!editing) {
      return;
    }

    const nextRaw = String(draftValue || "");
    const next = nextRaw.trim();

    const allowEmpty =
      editing?.rowKey === "bike.purchase_date" ||
      editing?.rowKey === "bike.serial_number";

    if (!next && !allowEmpty) {
      Alert.alert(
        "Value can’t be empty",
        "Type the part name/spec, or tap Cancel.",
      );
      return;
    }

    const result = await updateBikeSpecValue({
      bikeId: id,
      sectionKey: editing.sectionKey,
      label: editing.label,
      value: allowEmpty ? next : next,
      rowKey: editing.rowKey,
    });

    if (result && result.ok === false) {
      Alert.alert("Can’t save that", result.error || "Invalid value");
      return;
    }

    if (result?.warning) {
      Alert.alert("Quick heads up", result.warning);
    }

    closeEdit();
  }, [closeEdit, draftValue, editing, id, updateBikeSpecValue]);

  const [showMoreDetails, setShowMoreDetails] = useState(false);

  const purchaseDateLabel = useMemo(() => {
    const raw = bike?.purchase_date ?? bike?.purchaseDate ?? null;
    if (!raw) return "—";
    return String(raw).slice(0, 10);
  }, [bike?.purchaseDate, bike?.purchase_date]);

  const serialLabel = useMemo(() => {
    const raw = bike?.serial_number ?? bike?.serialNumber ?? null;
    return raw ? String(raw) : "—";
  }, [bike?.serialNumber, bike?.serial_number]);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <ScreenHeader
        title="Full Spec Sheet"
        showBack
        onBack={() => router.back()}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: insets.bottom + 28 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <Text style={styles.bikeName}>{bike?.name || "Bike"}</Text>
          <Text style={styles.heroSub}>
            Tap a pencil to update your build. No stress — you can change it
            anytime.
          </Text>
        </View>

        {sheet.map((section) => {
          let Icon = Settings;
          if (section.key === "frame") Icon = Ruler;
          if (section.key === "drivetrain") Icon = Settings;
          if (section.key === "suspension") Icon = SlidersHorizontal;
          if (section.key === "wheels") Icon = Circle;
          if (section.key === "brakes") Icon = Disc;
          if (section.key === "cockpit") Icon = Hand;

          const injectTubelessRow = section.key === "wheels";

          return (
            <AppCard key={section.key} style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleWrap}>
                  <SectionIcon Icon={Icon} />
                  <Text style={styles.sectionTitle}>{section.title}</Text>
                </View>
              </View>

              {injectTubelessRow ? (
                <ToggleSpecRow
                  label="Tubeless setup"
                  value={isTubeless}
                  first
                  disabled={savingTubeless}
                  helper="Used for sealant reminders and tire tracking."
                  onToggle={onToggleTubeless}
                />
              ) : null}

              {section.rows.map((r, idx) => {
                const isFirst = idx === 0 && !injectTubelessRow;
                return (
                  <SpecRow
                    key={r.label}
                    label={r.label}
                    value={r.value}
                    first={isFirst}
                    onEdit={() => openEdit(section.key, r)}
                  />
                );
              })}
            </AppCard>
          );
        })}

        <AppCard style={styles.sectionCard}>
          <Pressable
            onPress={() => setShowMoreDetails((v) => !v)}
            hitSlop={10}
            style={styles.moreHeader}
          >
            <View style={styles.sectionTitleWrap}>
              <SectionIcon Icon={Ruler} />
              <Text style={styles.sectionTitle}>More details</Text>
            </View>
            {showMoreDetails ? (
              <ChevronDown size={18} color={colors.textTertiary} />
            ) : (
              <ChevronRight size={18} color={colors.textTertiary} />
            )}
          </Pressable>

          {showMoreDetails ? (
            <View style={{ marginTop: spacing.sm }}>
              <SpecRow
                first
                label="Purchase date"
                value={purchaseDateLabel}
                onEdit={() =>
                  openEdit("frame", {
                    key: "bike.purchase_date",
                    label: "Purchase date",
                    value: purchaseDateLabel === "—" ? "" : purchaseDateLabel,
                  })
                }
              />
              <SpecRow
                label="Serial number / ID"
                value={serialLabel}
                onEdit={() =>
                  openEdit("frame", {
                    key: "bike.serial_number",
                    label: "Serial number / ID",
                    value: serialLabel === "—" ? "" : serialLabel,
                  })
                }
              />
              {bike?.purchase_year ? (
                <View style={[styles.row, styles.rowFirst]}>
                  <Text style={styles.rowLabel}>Purchase year</Text>
                  <View style={styles.rowRight}>
                    <Text style={styles.rowValue}>
                      {String(bike.purchase_year)}
                    </Text>
                  </View>
                </View>
              ) : null}
            </View>
          ) : null}
        </AppCard>
      </ScrollView>

      <Modal
        visible={!!editing}
        transparent
        animationType="fade"
        onRequestClose={closeEdit}
      >
        <Pressable style={styles.modalOverlay} onPress={closeEdit}>
          <KeyboardAvoidingAnimatedView style={{ flex: 1 }} behavior="padding">
            <Pressable style={styles.modalCard} onPress={() => {}}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{editTitle}</Text>
                <Pressable
                  onPress={closeEdit}
                  hitSlop={10}
                  style={styles.modalCloseBtn}
                >
                  <X
                    size={18}
                    color={colors.textSecondary}
                    strokeWidth={2.75}
                  />
                </Pressable>
              </View>

              <Text style={styles.modalLabel}>New value</Text>
              <TextInput
                ref={inputRef}
                value={draftValue}
                onChangeText={setDraftValue}
                placeholder="Type the updated part/spec…"
                placeholderTextColor={colors.textTertiary}
                style={styles.modalInput}
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={onSave}
              />

              <View style={styles.modalActions}>
                <AppButton
                  title="Cancel"
                  variant="secondary"
                  onPress={closeEdit}
                  style={{ flex: 1 }}
                />
                <AppButton title="Save" onPress={onSave} style={{ flex: 1 }} />
              </View>

              <Text style={styles.modalHelper}>
                This updates your spec sheet and your Spec Summary on the bike
                page.
              </Text>
            </Pressable>
          </KeyboardAvoidingAnimatedView>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  scroll: {
    flex: 1,
  },

  hero: {
    paddingHorizontal: spacing.xl,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  bikeName: {
    fontSize: 26,
    lineHeight: 28,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    letterSpacing: -0.6,
  },
  heroSub: {
    marginTop: spacing.sm,
    fontSize: typography.base,
    lineHeight: 19,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },

  sectionCard: {
    marginHorizontal: spacing.xl,
    marginTop: spacing.lg,
  },
  sectionHeader: {
    marginBottom: spacing.md,
  },
  sectionTitleWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  sectionIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.round,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primarySoft2,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    fontSize: 18,
    lineHeight: 20,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },

  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  rowFirst: {
    borderTopWidth: 0,
    paddingTop: 0,
  },
  rowLabel: {
    width: "42%",
    fontSize: typography.sm,
    lineHeight: 16,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
  rowHelper: {
    marginTop: 6,
    fontSize: typography.xs,
    lineHeight: 14,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textTertiary,
  },
  rowRight: {
    width: "56%",
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "flex-end",
    gap: spacing.sm,
  },
  rowValue: {
    flex: 1,
    textAlign: "right",
    fontSize: typography.base,
    lineHeight: 18,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  editButton: {
    width: 28,
    height: 28,
    borderRadius: radius.round,
    backgroundColor: colors.borderLight,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
    padding: spacing.lg,
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    ...shadows.large,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.lg,
  },
  modalTitle: {
    flex: 1,
    fontSize: 18,
    lineHeight: 20,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.round,
    backgroundColor: colors.surfaceWarm,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: spacing.md,
  },
  modalLabel: {
    fontSize: typography.xs,
    fontFamily: typography.fontFamily.black,
    color: colors.textSecondary,
    letterSpacing: 1.1,
  },
  modalInput: {
    marginTop: 8,
    backgroundColor: colors.surfaceWarm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    fontSize: typography.base,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textPrimary,
  },
  modalActions: {
    marginTop: spacing.lg,
    flexDirection: "row",
    gap: spacing.md,
  },
  modalHelper: {
    marginTop: spacing.md,
    fontSize: typography.sm,
    lineHeight: 17,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textSecondary,
  },

  moreHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
});
