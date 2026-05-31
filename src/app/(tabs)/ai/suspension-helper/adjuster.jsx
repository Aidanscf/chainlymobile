import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  Pressable,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Sparkles, Wand2, Save, ChevronRight } from "lucide-react-native";

import ScreenHeader from "@/components/layout/ScreenHeader";
import AppCard from "@/components/AppCard";
import AppButton from "@/components/AppButton";
import Chip from "@/components/Chip";
import { colors, spacing, radius, typography, shadows } from "@/theme/index";
import { useSuspensionStore } from "@/store/suspension";
import { getComponentById } from "@/data/suspensionComponents.mock";
import { SYMPTOMS, symptomAdjustments } from "@/utils/symptomAdjustments";
import { applyAdjustmentToSettings } from "@/utils/suspensionMath";

export default function AISuspensionAdjusterScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const session = useSuspensionStore((s) => s.session);
  const toggleSymptom = useSuspensionStore((s) => s.toggleSymptom);
  const clearSymptoms = useSuspensionStore((s) => s.clearSymptoms);
  const setComputedSettings = useSuspensionStore((s) => s.setComputedSettings);
  const savePresetFromSession = useSuspensionStore(
    (s) => s.savePresetFromSession,
  );

  const forkComponent = useMemo(
    () => getComponentById(session.forkComponentId),
    [session.forkComponentId],
  );
  const shockComponent = useMemo(
    () => getComponentById(session.shockComponentId),
    [session.shockComponentId],
  );

  const toastTimer = useRef(null);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message) => {
    setToast(message);
    if (toastTimer.current) {
      clearTimeout(toastTimer.current);
    }
    toastTimer.current = setTimeout(() => setToast(null), 1600);
  }, []);

  const selectedSymptoms = useMemo(() => {
    return Array.isArray(session.symptomsSelected)
      ? session.symptomsSelected
      : [];
  }, [session.symptomsSelected]);

  const fixes = useMemo(() => {
    return selectedSymptoms
      .map((key) => {
        const mapping = symptomAdjustments[key];
        if (!mapping) {
          return null;
        }
        return {
          key,
          title: mapping.title,
          advice: mapping.advice,
          fork: mapping.fork || [],
          shock: mapping.shock || [],
        };
      })
      .filter(Boolean);
  }, [selectedSymptoms]);

  const onBack = useCallback(async () => {
    try {
      if (Platform.OS !== "web") {
        await Haptics.selectionAsync();
      }
    } catch (error) {
      console.error(error);
    }
    router.back();
  }, [router]);

  const onApply = useCallback(async () => {
    if (!session.forkSettings || !session.shockSettings) {
      showToast("Generate a baseline first");
      return;
    }

    if (selectedSymptoms.length === 0) {
      showToast("Pick at least one symptom");
      return;
    }

    let nextFork = session.forkSettings;
    let nextShock = session.shockSettings;

    for (const sKey of selectedSymptoms) {
      const mapping = symptomAdjustments[sKey];
      if (!mapping) continue;

      for (const adj of mapping.fork || []) {
        if (forkComponent) {
          nextFork = applyAdjustmentToSettings({
            settings: nextFork,
            component: forkComponent,
            adjustment: adj,
          });
        }
      }
      for (const adj of mapping.shock || []) {
        if (shockComponent) {
          nextShock = applyAdjustmentToSettings({
            settings: nextShock,
            component: shockComponent,
            adjustment: adj,
          });
        }
      }
    }

    setComputedSettings({ forkSettings: nextFork, shockSettings: nextShock });

    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      // no-op
    }

    showToast("Adjustments applied");
  }, [
    forkComponent,
    selectedSymptoms,
    session.forkSettings,
    session.shockSettings,
    setComputedSettings,
    shockComponent,
    showToast,
  ]);

  const onSavePreset = useCallback(async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {
      // no-op
    }

    try {
      const d = new Date();
      const m = d.toLocaleString(undefined, { month: "short" });
      const name = `Tuned preset • ${m} ${d.getDate()}`;
      savePresetFromSession({
        name,
        terrainTag: (session.terrainBias || [])[0] || "tech",
      });
      showToast("Saved updated preset");
    } catch (error) {
      console.error(error);
      showToast("Could not save preset");
    }
  }, [savePresetFromSession, session.terrainBias, showToast]);

  const onClear = useCallback(async () => {
    try {
      await Haptics.selectionAsync();
    } catch (e) {
      // no-op
    }
    clearSymptoms();
  }, [clearSymptoms]);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <ScreenHeader title="Adjustments" showBack onBack={onBack} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: spacing.xl,
          paddingBottom: insets.bottom + 28,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>How did the ride feel?</Text>
        <Text style={styles.subtitle}>
          Pick what you felt. I’ll turn it into one small, confident adjustment.
        </Text>

        <AppCard style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIcon}>
              <Sparkles size={16} color={colors.primary} strokeWidth={2.5} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Symptoms</Text>
              <Text style={styles.cardSub}>
                Multi-select is fine. We’ll keep it simple.
              </Text>
            </View>
          </View>

          <View style={styles.rowWrap}>
            {SYMPTOMS.map((s) => {
              const selected = selectedSymptoms.includes(s.key);
              return (
                <Chip
                  key={s.key}
                  label={s.label}
                  tone="orange"
                  selected={selected}
                  onPress={() => toggleSymptom(s.key)}
                />
              );
            })}
          </View>

          <Pressable onPress={onClear} style={styles.clearLink} hitSlop={10}>
            <Text style={styles.clearText}>Clear</Text>
          </Pressable>
        </AppCard>

        {fixes.length > 0 ? (
          <View style={{ marginTop: spacing.lg, gap: spacing.md }}>
            {fixes.map((f) => {
              const forkFixes = Array.isArray(f.fork) ? f.fork : [];
              const shockFixes = Array.isArray(f.shock) ? f.shock : [];

              return (
                <AppCard key={f.key} style={styles.fixCard}>
                  <View style={styles.fixHeader}>
                    <View style={styles.fixIcon}>
                      <Wand2
                        size={16}
                        color={colors.primary}
                        strokeWidth={2.5}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.fixTitle}>{f.title}</Text>
                      <Text style={styles.fixSub}>{f.advice}</Text>
                    </View>
                  </View>

                  <View style={{ height: spacing.md }} />

                  {forkFixes.length > 0 ? (
                    <>
                      <Text style={styles.sectionLabel}>FORK</Text>
                      <View style={{ gap: 8, marginTop: 8 }}>
                        {forkFixes.map((x, idx) => (
                          <View key={idx} style={styles.adjustRow}>
                            <Text style={styles.adjustText}>{x.label}</Text>
                            <Text style={styles.adjustTag}>Try it</Text>
                          </View>
                        ))}
                      </View>
                    </>
                  ) : null}

                  {shockFixes.length > 0 ? (
                    <>
                      <Text
                        style={[styles.sectionLabel, { marginTop: spacing.lg }]}
                      >
                        SHOCK
                      </Text>
                      <View style={{ gap: 8, marginTop: 8 }}>
                        {shockFixes.map((x, idx) => (
                          <View key={idx} style={styles.adjustRow}>
                            <Text style={styles.adjustText}>{x.label}</Text>
                            <Text style={styles.adjustTag}>Try it</Text>
                          </View>
                        ))}
                      </View>
                    </>
                  ) : null}

                  <Text style={styles.fixNote}>
                    Make one change at a time, then re-ride the same section.
                    That’s how you learn fast.
                  </Text>
                </AppCard>
              );
            })}
          </View>
        ) : null}

        <View style={{ height: spacing.xl }} />

        <View style={{ gap: spacing.sm }}>
          <AppButton title="Apply Adjustments" onPress={onApply} />
          <View style={styles.twoCol}>
            <AppButton
              title="Save Updated Preset"
              onPress={onSavePreset}
              variant="secondary"
              style={{ flex: 1 }}
            />
            <AppButton
              title="Presets"
              onPress={() => router.push("/ai/suspension-helper")}
              variant="secondary"
              style={{ flex: 1 }}
            />
          </View>

          <Pressable
            onPress={() => router.push("/ai/suspension-helper/baseline")}
            style={styles.backToBaseline}
            hitSlop={10}
          >
            <ChevronRight size={16} color={colors.primary} strokeWidth={2.75} />
            <Text style={styles.backToBaselineText}>Back to baseline</Text>
          </Pressable>
        </View>
      </ScrollView>

      {toast ? (
        <View pointerEvents="none" style={styles.toastWrap}>
          <View style={styles.toastCard}>
            <Text style={styles.toastText}>{toast}</Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  title: {
    fontSize: 32,
    lineHeight: 34,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    letterSpacing: -0.6,
  },
  subtitle: {
    marginTop: spacing.sm,
    fontSize: typography.base,
    lineHeight: 20,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },

  card: {
    backgroundColor: colors.surface,
    borderColor: colors.borderLight,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.round,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primarySoft2,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.small,
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

  rowWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.md,
  },

  clearLink: {
    marginTop: spacing.md,
    alignSelf: "flex-start",
    paddingVertical: 6,
  },
  clearText: {
    fontSize: typography.sm,
    fontFamily: typography.fontFamily.black,
    color: colors.primary,
  },

  fixCard: {
    backgroundColor: colors.surfaceWarm,
    borderColor: colors.border,
  },
  fixHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  fixIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.round,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.small,
  },
  fixTitle: {
    fontSize: 16,
    lineHeight: 18,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  fixSub: {
    marginTop: 6,
    fontSize: typography.base,
    lineHeight: 19,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },

  sectionLabel: {
    fontSize: typography.xs,
    fontFamily: typography.fontFamily.black,
    color: colors.textSecondary,
    letterSpacing: 1.1,
  },

  adjustRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
  },
  adjustText: {
    fontSize: typography.base,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  adjustTag: {
    fontSize: typography.sm,
    fontFamily: typography.fontFamily.black,
    color: colors.primary,
  },

  fixNote: {
    marginTop: spacing.lg,
    fontSize: typography.sm,
    lineHeight: 17,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textSecondary,
  },

  twoCol: {
    flexDirection: "row",
    gap: spacing.md,
  },

  backToBaseline: {
    marginTop: spacing.sm,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
  },
  backToBaselineText: {
    fontSize: typography.sm,
    fontFamily: typography.fontFamily.black,
    color: colors.primary,
  },

  toastWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 24,
    alignItems: "center",
    paddingHorizontal: spacing.xl,
  },
  toastCard: {
    backgroundColor: colors.textPrimary,
    borderRadius: radius.round,
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    ...shadows.large,
  },
  toastText: {
    fontSize: typography.sm,
    fontFamily: typography.fontFamily.black,
    color: "#fff",
  },
});
