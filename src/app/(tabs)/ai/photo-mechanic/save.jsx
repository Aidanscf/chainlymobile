import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { CheckCircle2, Bike } from "lucide-react-native";

import KeyboardAvoidingAnimatedView from "@/components/KeyboardAvoidingAnimatedView";
import AppCard from "@/components/AppCard";
import AppButton from "@/components/AppButton";
import Chip from "@/components/Chip";
import { colors, spacing, radius, typography } from "@/theme/index";
import { useChainlyStore } from "@/store/chainlyStore";
import ScreenHeader from "@/components/layout/ScreenHeader";

export default function PhotoMechanicSaveScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const bikes = useChainlyStore((s) => s.bikes);
  const diagnosis = useChainlyStore((s) => s.currentDiagnosis);
  const save = useChainlyStore((s) => s.saveDiagnosisToMaintenance);

  const [bikeId, setBikeId] = useState(diagnosis?.bikeId || null);
  const [title, setTitle] = useState(
    diagnosis?.diagnosisTitle || "AI Bike Fix",
  );
  const [notes, setNotes] = useState("");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  const defaultNotes = useMemo(() => {
    const symptoms = diagnosis?.symptomsSelected?.length
      ? `Symptoms: ${diagnosis.symptomsSelected.join(", ")}`
      : null;
    const lines = [
      diagnosis?.summary ? diagnosis.summary : null,
      symptoms,
      diagnosis?.confidence != null
        ? `Confidence: ${diagnosis.confidence}%`
        : null,
    ].filter(Boolean);

    return lines.join("\n");
  }, [diagnosis?.confidence, diagnosis?.summary, diagnosis?.symptomsSelected]);

  const onSave = useCallback(() => {
    if (!diagnosis) {
      setError("No diagnosis to save.");
      return;
    }
    if (!bikeId) {
      setError("Pick a bike first.");
      return;
    }

    try {
      setError(null);
      save({
        bikeId,
        title: title?.trim() || diagnosis.diagnosisTitle,
        notes: (notes?.trim() || defaultNotes).trim(),
      });
      setSaved(true);
    } catch (e) {
      console.error(e);
      setError("Couldn’t save that. Try again.");
    }
  }, [bikeId, defaultNotes, diagnosis, notes, save, title]);

  const goToBike = useCallback(() => {
    if (!bikeId) {
      return;
    }
    router.push(`/garage/${bikeId}`);
  }, [bikeId, router]);

  if (!diagnosis) {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" />
        <ScreenHeader title="Save" showBack />
        <View style={{ paddingHorizontal: spacing.xl }}>
          <Text style={styles.title}>Nothing to save yet</Text>
          <Text style={styles.subtitle}>Go back to Results first.</Text>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingAnimatedView style={styles.container} behavior="padding">
      <StatusBar style="dark" />

      <ScreenHeader title="Save" showBack />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: insets.bottom + 28 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Save to Maintenance Log</Text>
        <Text style={styles.subtitle}>
          This becomes a quest in your garage. Future-you will be grateful.
        </Text>

        <AppCard style={styles.card}>
          <View style={styles.cardTop}>
            <View style={styles.cardIcon}>
              <Bike size={18} color={colors.primary} strokeWidth={2.5} />
            </View>
            <Text style={styles.cardTitle}>Pick a bike</Text>
          </View>

          <View style={styles.bikeList}>
            {bikes.map((b) => {
              const selected = String(b.id) === String(bikeId);
              return (
                <Pressable
                  key={b.id}
                  onPress={() => setBikeId(String(b.id))}
                  hitSlop={6}
                >
                  <View
                    style={[styles.bikeRow, selected && styles.bikeRowSelected]}
                  >
                    <Text style={styles.bikeName}>{b.name}</Text>
                    <Chip
                      label={`Lv ${b.level}`}
                      selected
                      tone={selected ? "orange" : "neutral"}
                    />
                  </View>
                </Pressable>
              );
            })}
          </View>
        </AppCard>

        <View style={{ height: spacing.lg }} />

        <AppCard style={styles.card}>
          <Text style={styles.inputLabel}>Title</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Fix brake rub"
            placeholderTextColor={colors.textTertiary}
            style={styles.input}
          />

          <View style={{ height: spacing.md }} />

          <Text style={styles.inputLabel}>Notes</Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder={defaultNotes}
            placeholderTextColor={colors.textTertiary}
            multiline
            style={[styles.input, styles.textArea]}
          />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <View style={{ height: spacing.md }} />
          <AppButton title="Save Diagnosis" onPress={onSave} />
        </AppCard>

        {saved ? (
          <AppCard style={styles.successCard}>
            <View style={styles.successTop}>
              <View style={styles.successIcon}>
                <CheckCircle2
                  size={20}
                  color={colors.success}
                  strokeWidth={2.5}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.successTitle}>Saved!</Text>
                <Text style={styles.successSub}>
                  It’s now a Due Soon quest in your garage.
                </Text>
              </View>
            </View>

            <AppButton title="Go to Bike Maintenance" onPress={goToBike} />

            <View style={{ height: spacing.sm }} />
            <AppButton
              title="Back to AI Hub"
              onPress={() => router.push("/ai")}
              variant="secondary"
            />
          </AppCard>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingAnimatedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  scroll: {
    flex: 1,
    paddingHorizontal: spacing.xl,
  },

  title: {
    fontSize: 24,
    lineHeight: 26,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    letterSpacing: -0.4,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.base,
    lineHeight: 20,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },

  card: {
    backgroundColor: colors.surface,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  cardIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.round,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primarySoft2,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    fontSize: 16,
    lineHeight: 18,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },

  bikeList: {
    gap: spacing.sm,
  },
  bikeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    backgroundColor: colors.surfaceWarm,
  },
  bikeRowSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  bikeName: {
    flex: 1,
    paddingRight: spacing.md,
    fontSize: typography.base,
    lineHeight: 18,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
  },

  inputLabel: {
    fontSize: typography.sm,
    fontFamily: typography.fontFamily.bold,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surfaceWarm,
    fontSize: typography.base,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textPrimary,
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: "top",
  },

  errorText: {
    marginTop: spacing.md,
    fontSize: typography.sm,
    fontFamily: typography.fontFamily.semibold,
    color: colors.danger,
  },

  successCard: {
    marginTop: spacing.lg,
    backgroundColor: colors.successSoft,
    borderColor: "#CCF4DF",
  },
  successTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  successIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.round,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: "#CCF4DF",
  },
  successTitle: {
    fontSize: 16,
    lineHeight: 18,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
  },
  successSub: {
    marginTop: 4,
    fontSize: typography.base,
    lineHeight: 19,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textSecondary,
  },
});
