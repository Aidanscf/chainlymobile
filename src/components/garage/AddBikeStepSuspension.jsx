import React, { useCallback } from "react";
import { View, Text, StyleSheet, TextInput } from "react-native";

import AppCard from "@/components/AppCard";
import Chip from "@/components/Chip";
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

export default function StepSuspension({ draft, setDraft, fieldErrors }) {
  const setField = useCallback(
    (key, value) => {
      setDraft((d) => ({ ...d, [key]: value }));
    },
    [setDraft],
  );

  return (
    <View>
      <AppCard style={styles.card}>
        <Text style={styles.cardTitle}>Suspension setup</Text>
        <Text style={styles.cardSub}>
          These feed the Suspension Helper and service hour tracking.
        </Text>

        <Text style={styles.sectionTitle}>Fork</Text>

        <LabeledInput
          label="Fork brand"
          value={draft?.fork_brand}
          onChangeText={(t) => setField("fork_brand", t)}
          placeholder="e.g. Fox"
          error={fieldErrors?.fork_brand}
        />
        <LabeledInput
          label="Fork model"
          value={draft?.fork_model}
          onChangeText={(t) => setField("fork_model", t)}
          placeholder="e.g. 36 Float"
          error={fieldErrors?.fork_model}
        />
        <LabeledInput
          label="Fork travel (mm)"
          value={String(draft?.fork_travel_mm || "")}
          onChangeText={(t) => setField("fork_travel_mm", t)}
          placeholder="e.g. 150"
          keyboardType="number-pad"
          error={fieldErrors?.fork_travel_mm}
        />

        <View style={{ marginTop: spacing.lg }}>
          <RowLabel text="Fork spring" />
          <View style={styles.chipsWrap}>
            {["Air", "Coil"].map((v) => (
              <Chip
                key={v}
                label={v}
                tone="orange"
                selected={draft?.fork_spring === v}
                onPress={() => setField("fork_spring", v)}
                style={{ marginRight: spacing.sm, marginBottom: spacing.sm }}
              />
            ))}
          </View>
        </View>

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>Rear shock</Text>

        <LabeledInput
          label="Rear shock brand"
          value={draft?.shock_brand}
          onChangeText={(t) => setField("shock_brand", t)}
          placeholder="e.g. RockShox"
          error={fieldErrors?.shock_brand}
        />
        <LabeledInput
          label="Rear shock model"
          value={draft?.shock_model}
          onChangeText={(t) => setField("shock_model", t)}
          placeholder="e.g. Super Deluxe"
          error={fieldErrors?.shock_model}
        />
        <LabeledInput
          label="Rear travel (mm)"
          value={String(draft?.rear_travel_mm || "")}
          onChangeText={(t) => setField("rear_travel_mm", t)}
          placeholder="e.g. 140"
          keyboardType="number-pad"
          error={fieldErrors?.rear_travel_mm}
        />

        <View style={{ marginTop: spacing.lg }}>
          <RowLabel text="Shock spring" />
          <View style={styles.chipsWrap}>
            {["Air", "Coil"].map((v) => (
              <Chip
                key={v}
                label={v}
                tone="orange"
                selected={draft?.shock_spring === v}
                onPress={() => setField("shock_spring", v)}
                style={{ marginRight: spacing.sm, marginBottom: spacing.sm }}
              />
            ))}
          </View>
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
  chipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: spacing.sm,
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
