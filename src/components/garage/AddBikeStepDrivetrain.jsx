import React, { useCallback } from "react";
import { View, Text, StyleSheet, TextInput } from "react-native";

import AppCard from "@/components/AppCard";
import { colors, spacing, radius, typography } from "@/theme/index";

function FieldError({ text }) {
  if (!text) return null;
  return <Text style={styles.errorText}>{text}</Text>;
}

function RowLabel({ text }) {
  return <Text style={styles.label}>{text}</Text>;
}

function LabeledInput({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  error,
}) {
  return (
    <View style={{ marginTop: spacing.lg }}>
      <RowLabel text={label} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textTertiary}
        style={[styles.input, error ? styles.inputError : null]}
        keyboardType={keyboardType}
        autoCorrect={false}
      />
      <FieldError text={error} />
    </View>
  );
}

export default function StepDrivetrain({ draft, setDraft, fieldErrors }) {
  const setField = useCallback(
    (key, value) => {
      setDraft((d) => ({ ...d, [key]: value }));
    },
    [setDraft],
  );

  return (
    <View>
      <AppCard style={styles.card}>
        <Text style={styles.cardTitle}>Drivetrain & brakes</Text>
        <Text style={styles.cardSub}>
          These map to your parts list so we can track wear and recommend
          compatible gear.
        </Text>

        <Text style={styles.sectionTitle}>Drivetrain</Text>
        <LabeledInput
          label="Crankset"
          value={draft?.crankset}
          onChangeText={(t) => setField("crankset", t)}
          placeholder="e.g. SRAM GX"
          error={fieldErrors?.crankset}
        />
        <LabeledInput
          label="Cassette"
          value={draft?.cassette}
          onChangeText={(t) => setField("cassette", t)}
          placeholder="e.g. 10–52T"
          error={fieldErrors?.cassette}
        />
        <LabeledInput
          label="Chain type"
          value={draft?.chain_type}
          onChangeText={(t) => setField("chain_type", t)}
          placeholder="e.g. Eagle 12-speed"
          error={fieldErrors?.chain_type}
        />

        {/* NEW: extra drivetrain slots */}
        <LabeledInput
          label="Derailleur model (optional)"
          value={draft?.derailleur_model}
          onChangeText={(t) => setField("derailleur_model", t)}
          placeholder="e.g. Shimano XT"
          error={null}
        />
        <LabeledInput
          label="Shifter model (optional)"
          value={draft?.shifter_model}
          onChangeText={(t) => setField("shifter_model", t)}
          placeholder="e.g. SRAM GX"
          error={null}
        />
        <LabeledInput
          label="Bottom bracket type (optional)"
          value={draft?.bottom_bracket_type}
          onChangeText={(t) => setField("bottom_bracket_type", t)}
          placeholder="e.g. DUB"
          error={null}
        />
        <LabeledInput
          label="Bottom bracket standard (optional)"
          value={draft?.bottom_bracket_standard}
          onChangeText={(t) => setField("bottom_bracket_standard", t)}
          placeholder="e.g. BSA 73"
          error={null}
        />

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>Brakes</Text>
        <LabeledInput
          label="Brake brand + model"
          value={draft?.brake_model}
          onChangeText={(t) => setField("brake_model", t)}
          placeholder="e.g. Shimano SLX 4-piston"
          error={fieldErrors?.brake_model}
        />
        <LabeledInput
          label="Front rotor (mm)"
          value={String(draft?.rotor_front_mm || "")}
          onChangeText={(t) => setField("rotor_front_mm", t)}
          placeholder="e.g. 203"
          keyboardType="number-pad"
          error={fieldErrors?.rotor_front_mm}
        />
        <LabeledInput
          label="Rear rotor (mm)"
          value={String(draft?.rotor_rear_mm || "")}
          onChangeText={(t) => setField("rotor_rear_mm", t)}
          placeholder="e.g. 180"
          keyboardType="number-pad"
          error={fieldErrors?.rotor_rear_mm}
        />

        {/* NEW: cockpit slot */}
        <View style={styles.divider} />
        <Text style={styles.sectionTitle}>Cockpit</Text>
        <LabeledInput
          label="Dropper post brand (optional)"
          value={draft?.dropper_brand}
          onChangeText={(t) => setField("dropper_brand", t)}
          placeholder="e.g. OneUp"
          error={null}
        />
        <LabeledInput
          label="Dropper post model (optional)"
          value={draft?.dropper_model}
          onChangeText={(t) => setField("dropper_model", t)}
          placeholder="e.g. V2"
          error={null}
        />
        <LabeledInput
          label="Dropper travel (mm) — optional"
          value={String(draft?.dropper_travel_mm || "")}
          onChangeText={(t) => setField("dropper_travel_mm", t)}
          placeholder="e.g. 170"
          keyboardType="number-pad"
          error={null}
        />
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
  sectionTitle: {
    marginTop: spacing.xl,
    fontSize: typography.sm,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    letterSpacing: -0.1,
  },
  label: {
    fontSize: typography.xs,
    fontFamily: typography.fontFamily.black,
    color: colors.textSecondary,
    letterSpacing: 1.1,
    textTransform: "uppercase",
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
  divider: {
    marginTop: spacing.xl,
    height: 1,
    backgroundColor: colors.borderLight,
  },
  errorText: {
    marginTop: 6,
    fontSize: typography.sm,
    fontFamily: typography.fontFamily.semibold,
    color: colors.danger,
  },
});
