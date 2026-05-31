import React, { useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Alert,
} from "react-native";

import AppCard from "@/components/AppCard";
import Chip from "@/components/Chip";
import { ChevronDown } from "lucide-react-native";
import { colors, spacing, radius, typography } from "@/theme/index";

const WHEEL_SIZES = ["26", "27.5", "29", "Mullet"];
const WHEEL_CONFIGS = [
  { key: "29", label: '29"' },
  { key: "27.5", label: '27.5"' },
  { key: "mullet_29f_27.5r", label: "Mullet (29F / 27.5R)" },
  { key: "mixed_other", label: "Mixed / Other" },
  { key: "unknown", label: "Unknown" },
];
const HUB_DRIVERS = ["HG", "XD", "MicroSpline"];
const DRIVETRAIN_SPEEDS = [10, 11, 12];
const BRAKE_MOUNTS = ["Post", "Flat"];

function FieldError({ text }) {
  if (!text) return null;
  return <Text style={styles.errorText}>{text}</Text>;
}

function RowLabel({ text }) {
  return <Text style={styles.label}>{text}</Text>;
}

function ChipRow({ options, selected, onSelect, tone = "orange" }) {
  return (
    <View style={styles.chipsWrap}>
      {options.map((opt) => {
        const key = String(opt);
        const sel = String(selected) === key;
        return (
          <Chip
            key={key}
            label={key}
            tone={tone}
            selected={sel}
            onPress={() => onSelect(opt)}
            style={{ marginRight: spacing.sm, marginBottom: spacing.sm }}
          />
        );
      })}
    </View>
  );
}

function SelectRow({ label, valueLabel, onPress }) {
  return (
    <View style={{ marginTop: spacing.lg }}>
      <RowLabel text={label} />
      <Pressable onPress={onPress} style={styles.selectRow} hitSlop={8}>
        <Text style={styles.selectValue} numberOfLines={1}>
          {valueLabel}
        </Text>
        <ChevronDown size={18} color={colors.textTertiary} strokeWidth={2.5} />
      </Pressable>
    </View>
  );
}

export default function StepSpecs({ draft, setDraft, fieldErrors }) {
  const setField = useCallback(
    (key, value) => {
      setDraft((d) => ({ ...d, [key]: value }));
    },
    [setDraft],
  );

  const helper = useMemo(() => {
    return "These help us recommend compatible parts.";
  }, []);

  const wheelConfigKey = String(draft?.wheel_config || "unknown");
  const wheelConfigLabel = useMemo(() => {
    const found = WHEEL_CONFIGS.find((x) => x.key === wheelConfigKey);
    return found ? found.label : "Unknown";
  }, [wheelConfigKey]);

  const onPickWheelConfig = useCallback(() => {
    Alert.alert("Wheel config", "Pick your wheel setup.", [
      ...WHEEL_CONFIGS.map((opt) => ({
        text: opt.label,
        onPress: () => setField("wheel_config", opt.key),
      })),
      { text: "Cancel", style: "cancel" },
    ]);
  }, [setField]);

  return (
    <View>
      <AppCard style={styles.card}>
        <Text style={styles.cardTitle}>Bike standards</Text>
        <Text style={styles.cardSub}>{helper}</Text>

        <View style={{ marginTop: spacing.lg }}>
          <RowLabel text="Wheel size" />
          <ChipRow
            options={WHEEL_SIZES}
            selected={draft?.wheel_size}
            onSelect={(v) => setField("wheel_size", v)}
          />
          <FieldError text={fieldErrors?.wheel_size} />
        </View>

        <SelectRow
          label="Wheel config"
          valueLabel={wheelConfigLabel}
          onPress={onPickWheelConfig}
        />

        <View style={{ marginTop: spacing.md }}>
          <RowLabel text="Frame size" />
          <TextInput
            value={draft?.frame_size}
            onChangeText={(t) => setField("frame_size", t)}
            placeholder="S / M / L / XL or 54"
            placeholderTextColor={colors.textTertiary}
            style={[
              styles.input,
              fieldErrors?.frame_size ? styles.inputError : null,
            ]}
            autoCorrect={false}
          />
          <FieldError text={fieldErrors?.frame_size} />
        </View>

        <View style={{ marginTop: spacing.lg }}>
          <RowLabel text="Hub driver" />
          <ChipRow
            options={HUB_DRIVERS}
            selected={draft?.hub_driver}
            onSelect={(v) => setField("hub_driver", v)}
          />
          <FieldError text={fieldErrors?.hub_driver} />
        </View>

        <View style={{ marginTop: spacing.lg }}>
          <RowLabel text="Drivetrain speed" />
          <ChipRow
            options={DRIVETRAIN_SPEEDS}
            selected={draft?.drivetrain_speed}
            onSelect={(v) => setField("drivetrain_speed", v)}
          />
          <FieldError text={fieldErrors?.drivetrain_speed} />
        </View>

        <View style={{ marginTop: spacing.lg }}>
          <RowLabel text="Brake mount" />
          <ChipRow
            options={BRAKE_MOUNTS}
            selected={draft?.brake_mount}
            onSelect={(v) => setField("brake_mount", v)}
          />
          <FieldError text={fieldErrors?.brake_mount} />
        </View>

        <View style={{ marginTop: spacing.lg }}>
          <RowLabel text="Max rotor size (mm)" />
          <TextInput
            value={draft?.rotor_size != null ? String(draft.rotor_size) : ""}
            onChangeText={(t) => setField("rotor_size", t)}
            placeholder="e.g. 203"
            placeholderTextColor={colors.textTertiary}
            style={[
              styles.input,
              fieldErrors?.rotor_size ? styles.inputError : null,
            ]}
            keyboardType="number-pad"
          />
          <FieldError text={fieldErrors?.rotor_size} />
        </View>
      </AppCard>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.borderLight,
    padding: spacing.xl,
  },
  cardTitle: {
    fontSize: 18,
    lineHeight: 20,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  cardSub: {
    marginTop: 6,
    fontSize: typography.base,
    lineHeight: 19,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
  label: {
    fontSize: typography.xs,
    fontFamily: typography.fontFamily.black,
    color: colors.textSecondary,
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
  chipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: spacing.sm,
  },
  input: {
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
  inputError: {
    borderColor: colors.danger,
  },
  errorText: {
    marginTop: 6,
    fontSize: typography.sm,
    fontFamily: typography.fontFamily.semibold,
    color: colors.danger,
  },
  selectRow: {
    marginTop: 8,
    minHeight: 46,
    backgroundColor: colors.surfaceWarm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectValue: {
    flex: 1,
    paddingRight: spacing.md,
    fontSize: typography.base,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textPrimary,
  },
});
