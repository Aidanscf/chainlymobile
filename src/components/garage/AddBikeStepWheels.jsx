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

export default function StepWheels({ draft, setDraft, fieldErrors }) {
  const setField = useCallback(
    (key, value) => {
      setDraft((d) => ({ ...d, [key]: value }));
    },
    [setDraft],
  );

  return (
    <View>
      <AppCard style={styles.card}>
        <Text style={styles.cardTitle}>Wheels & tires</Text>
        <Text style={styles.cardSub}>
          Used for wear calculations, ride feel, and gear recommendations.
        </Text>

        <LabeledInput
          label="Wheelset model"
          value={draft?.wheelset_model}
          onChangeText={(t) => setField("wheelset_model", t)}
          placeholder="e.g. DT Swiss XM1700"
          error={fieldErrors?.wheelset_model}
        />

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>Front tire</Text>
        <LabeledInput
          label="Model"
          value={draft?.tire_front_model}
          onChangeText={(t) => setField("tire_front_model", t)}
          placeholder="e.g. Maxxis Assegai"
          error={fieldErrors?.tire_front_model}
        />
        <LabeledInput
          label="Width"
          value={draft?.tire_front_width}
          onChangeText={(t) => setField("tire_front_width", t)}
          placeholder='e.g. 2.5"'
          error={fieldErrors?.tire_front_width}
        />

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>Rear tire</Text>
        <LabeledInput
          label="Model"
          value={draft?.tire_rear_model}
          onChangeText={(t) => setField("tire_rear_model", t)}
          placeholder="e.g. Maxxis DHR II"
          error={fieldErrors?.tire_rear_model}
        />
        <LabeledInput
          label="Width"
          value={draft?.tire_rear_width}
          onChangeText={(t) => setField("tire_rear_width", t)}
          placeholder='e.g. 2.4"'
          error={fieldErrors?.tire_rear_width}
        />

        <View style={{ marginTop: spacing.xl }}>
          <RowLabel text="Tubeless" />
          <View style={styles.chipsWrap}>
            <Chip
              label="Yes"
              tone="green"
              selected={!!draft?.tubeless}
              onPress={() => setField("tubeless", true)}
              style={{ marginRight: spacing.sm }}
            />
            <Chip
              label="No"
              tone="red"
              selected={!draft?.tubeless}
              onPress={() => setField("tubeless", false)}
            />
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
  divider: {
    marginTop: spacing.xl,
    height: 1,
    backgroundColor: colors.borderLight,
  },
  chipsWrap: {
    flexDirection: "row",
    marginTop: spacing.sm,
  },
  errorText: {
    marginTop: 6,
    fontSize: typography.sm,
    fontFamily: typography.fontFamily.semibold,
    color: colors.danger,
  },
});
