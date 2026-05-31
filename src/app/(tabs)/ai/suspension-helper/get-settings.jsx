import React, {
  useCallback,
  useMemo,
  useRef,
  useState,
  useEffect,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import {
  ChevronLeft,
  ChevronRight,
  Bike,
  Sliders,
  Sparkles,
} from "lucide-react-native";

import AppCard from "@/components/AppCard";
import AppButton from "@/components/AppButton";
import Chip from "@/components/Chip";
import { colors, spacing, radius, typography, shadows } from "@/theme/index";
import { useChainlyStore } from "@/store/chainlyStore";
import { useSuspensionStore } from "@/store/suspension";
import { normalizeWeightKg } from "@/utils/suspensionMath";
import {
  TERRAIN_OPTIONS,
  WEATHER_OPTIONS,
} from "@/screens/ai/SuspensionHelper/constants/filterOptions";
import {
  terrainLabel,
  weatherLabel,
} from "@/screens/ai/SuspensionHelper/utils/labelHelpers";

function ProgressPills({ step, total }) {
  return (
    <View style={styles.progressRow}>
      {Array.from({ length: total }).map((_, idx) => {
        const active = idx + 1 <= step;
        return (
          <View
            key={idx}
            style={[
              styles.progressPill,
              { backgroundColor: active ? colors.primary : colors.borderLight },
            ]}
          />
        );
      })}
      <Text style={styles.progressText}>{`Step ${step} of ${total}`}</Text>
    </View>
  );
}

export default function AISuspensionWizardScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const bikes = useChainlyStore((s) => s.bikes);
  const getBikeById = useChainlyStore((s) => s.getBikeById);
  const hydrateBikeGarageFromServer = useChainlyStore(
    (s) => s.hydrateBikeGarageFromServer,
  );

  const session = useSuspensionStore((s) => s.session);
  const resetSession = useSuspensionStore((s) => s.resetSession);
  const setSessionField = useSuspensionStore((s) => s.setSessionField);
  const toggleTerrainBias = useSuspensionStore((s) => s.toggleTerrainBias);
  const autoFillBikeSuspensionFromGarage = useSuspensionStore(
    (s) => s.autoFillBikeSuspensionFromGarage,
  );

  const [step, setStep] = useState(1);

  const toastTimer = useRef(null);
  const [toast, setToast] = useState(null);

  const selectedBike = useMemo(() => {
    if (!session.bikeId) {
      return null;
    }
    return getBikeById(session.bikeId);
  }, [getBikeById, session.bikeId]);

  const forkName = useMemo(() => {
    const name = session?.forkName;
    return name ? String(name) : null;
  }, [session?.forkName]);

  const shockName = useMemo(() => {
    const name = session?.shockName;
    return name ? String(name) : null;
  }, [session?.shockName]);

  const showToast = useCallback((message) => {
    setToast(message);
    if (toastTimer.current) {
      clearTimeout(toastTimer.current);
    }
    toastTimer.current = setTimeout(() => setToast(null), 1600);
  }, []);

  // Best-effort: keep Garage canonical bike+components synced so Suspension Helper can prefill.
  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      const id = String(session.bikeId || "");
      if (!id) return;
      try {
        await hydrateBikeGarageFromServer(id);
      } catch (e) {
        console.error(e);
      }
      if (cancelled) return;
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [hydrateBikeGarageFromServer, session.bikeId]);

  // Auto-fill fork/shock/travel from the selected bike + spec sheet.
  useEffect(() => {
    const id = String(session.bikeId || "");
    if (!id) return;
    if (String(session.autoFilledBikeId || "") === id) return;

    autoFillBikeSuspensionFromGarage({ bikeId: id }).catch((e) => {
      console.error(e);
    });
  }, [
    autoFillBikeSuspensionFromGarage,
    session.autoFilledBikeId,
    session.bikeId,
  ]);

  const onBackToPresets = useCallback(async () => {
    try {
      if (Platform.OS !== "web") {
        await Haptics.selectionAsync();
      }
    } catch (error) {
      console.error(error);
    }
    // main suspension helper page is presets
    router.replace("/ai/suspension-helper");
  }, [router]);

  const onReset = useCallback(async () => {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch (e) {
      // no-op
    }
    resetSession();
    setStep(1);
    showToast("Reset setup");
  }, [resetSession, showToast]);

  const canNextStep1 = Boolean(session.bikeId);

  const weightValidKg = useMemo(() => {
    return normalizeWeightKg({
      value: session.weightKg,
      unit: session.weightUnit,
    });
  }, [session.weightKg, session.weightUnit]);

  const canNextStep2 = Boolean(
    weightValidKg && weightValidKg >= 35 && weightValidKg <= 140,
  );

  const canNextStep3 = Boolean(
    session.ridingStyle && (session.terrainBias || []).length > 0,
  );

  const canGenerate = Boolean(
    canNextStep1 && canNextStep2 && canNextStep3 && session.skillLevel,
  );

  const onNext = useCallback(async () => {
    try {
      await Haptics.selectionAsync();
    } catch (e) {
      // no-op
    }

    if (step === 1 && !canNextStep1) {
      showToast("Pick a bike first");
      return;
    }
    if (step === 2 && !canNextStep2) {
      showToast("Enter a real rider weight");
      return;
    }
    if (step === 3 && !canNextStep3) {
      showToast("Pick a style + terrain vibe");
      return;
    }

    setStep((s) => Math.min(4, s + 1));
  }, [canNextStep1, canNextStep2, canNextStep3, showToast, step]);

  const onPrev = useCallback(async () => {
    try {
      await Haptics.selectionAsync();
    } catch (e) {
      // no-op
    }
    setStep((s) => Math.max(1, s - 1));
  }, []);

  const onGenerate = useCallback(async () => {
    if (!canGenerate) {
      showToast("One more thing — finish the setup cards");
      return;
    }

    const wKg = weightValidKg;
    if (!wKg) {
      showToast("Enter rider weight");
      return;
    }

    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      // no-op
    }

    // Baseline generation happens in a dedicated loading screen.
    router.push("/ai/suspension-helper/generating");
  }, [canGenerate, router, showToast, weightValidKg]);

  const styleLabel = useMemo(() => {
    const s = String(session.ridingStyle || "Trail");
    return s;
  }, [session.ridingStyle]);

  const biasSummary = useMemo(() => {
    const list = Array.isArray(session.terrainBias) ? session.terrainBias : [];
    if (list.length === 0) {
      return "—";
    }
    return list.map((x) => x[0].toUpperCase() + x.slice(1)).join(" • ");
  }, [session.terrainBias]);

  const conditionsLabel = useMemo(() => {
    const c = String(session.conditions || "general");
    if (c === "general") return "All-around";
    return weatherLabel(c);
  }, [session.conditions]);

  const terrainChoices = useMemo(() => {
    const base = Array.isArray(TERRAIN_OPTIONS) ? TERRAIN_OPTIONS : [];
    return Array.from(new Set([...base, "race"]));
  }, []);

  const conditionsChoices = useMemo(() => {
    const base = Array.isArray(WEATHER_OPTIONS) ? WEATHER_OPTIONS : [];
    return ["general", ...base];
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />

      {/* Top nav */}
      <View style={styles.topNav}>
        <AppCard style={styles.backButton} onPress={onBackToPresets}>
          <ChevronLeft
            size={20}
            color={colors.textPrimary}
            strokeWidth={2.75}
          />
        </AppCard>

        <Text style={styles.topNavTitle}>Suspension Helper</Text>

        <Pressable onPress={onReset} hitSlop={10} style={styles.resetBtn}>
          <Text style={styles.resetText}>Reset</Text>
        </Pressable>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: spacing.xl,
          paddingBottom: insets.bottom + 28,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Suspension Helper</Text>
        <Text style={styles.subtitle}>
          Dial it in without guessing. We’ll start with a solid baseline, then
          tune it like a coach.
        </Text>

        <ProgressPills step={step} total={4} />

        {/* Step 1 */}
        {step === 1 ? (
          <View style={{ gap: spacing.lg }}>
            <AppCard style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardIcon}>
                  <Bike size={16} color={colors.primary} strokeWidth={2.5} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>Bike selection</Text>
                  <Text style={styles.cardSub}>
                    Pick the rig you’re setting up today.
                  </Text>
                </View>
              </View>

              <View style={styles.rowWrap}>
                {(Array.isArray(bikes) ? bikes : []).slice(0, 6).map((b) => {
                  const selected =
                    String(session.bikeId || "") === String(b.id);
                  return (
                    <Chip
                      key={b.id}
                      label={b.name}
                      tone="orange"
                      selected={selected}
                      onPress={() => setSessionField("bikeId", String(b.id))}
                    />
                  );
                })}
              </View>

              {!selectedBike ? (
                <Text style={styles.helper}>
                  No worries — pick any bike for now. You can refine later.
                </Text>
              ) : (
                <Text style={styles.helper}>Selected: {selectedBike.name}</Text>
              )}
            </AppCard>

            <AppCard style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardIcon}>
                  <Sliders size={16} color={colors.primary} strokeWidth={2.5} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>Fork + Shock</Text>
                  <Text style={styles.cardSub}>
                    Pulled from your bike spec sheet.
                  </Text>
                </View>
              </View>

              <Text style={styles.sectionLabel}>FORK</Text>
              <Text style={styles.helper}>{forkName || "—"}</Text>

              <View style={{ height: spacing.lg }} />

              <Text style={styles.sectionLabel}>SHOCK</Text>
              <Text style={styles.helper}>{shockName || "—"}</Text>

              <Text style={styles.helper}>
                Tip: edit your bike spec sheet in Garage if this is wrong.
              </Text>
            </AppCard>
          </View>
        ) : null}

        {/* Step 2 */}
        {step === 2 ? (
          <View style={{ gap: spacing.lg }}>
            <AppCard style={styles.card}>
              <View style={styles.cardHeader}>
                <View
                  style={[
                    styles.cardIcon,
                    { backgroundColor: colors.primarySoft },
                  ]}
                >
                  <Sparkles
                    size={16}
                    color={colors.primary}
                    strokeWidth={2.5}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>Rider weight</Text>
                  <Text style={styles.cardSub}>
                    With gear on. Hydration counts.
                  </Text>
                </View>
              </View>

              <View style={styles.inputRow}>
                <TextInput
                  value={
                    session.weightKg == null ? "" : String(session.weightKg)
                  }
                  onChangeText={(t) =>
                    setSessionField("weightKg", t.replace(/[^0-9.]/g, ""))
                  }
                  placeholder={
                    session.weightUnit === "lbs" ? "e.g. 170" : "e.g. 77"
                  }
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="numeric"
                  style={styles.input}
                />
                <View style={{ flexDirection: "row", gap: spacing.sm }}>
                  <Chip
                    label="lbs"
                    tone="orange"
                    selected={session.weightUnit === "lbs"}
                    onPress={() => setSessionField("weightUnit", "lbs")}
                  />
                  <Chip
                    label="kg"
                    tone="orange"
                    selected={session.weightUnit === "kg"}
                    onPress={() => setSessionField("weightUnit", "kg")}
                  />
                </View>
              </View>

              <Text style={styles.helper}>
                This is the biggest lever. Get weight right and the rest gets
                easy.
              </Text>
            </AppCard>
          </View>
        ) : null}

        {/* Step 3 */}
        {step === 3 ? (
          <View style={{ gap: spacing.lg }}>
            <AppCard style={styles.card}>
              <Text style={styles.cardTitle}>Riding style</Text>
              <Text style={styles.cardSub}>
                How you ride sets the “support vs comfort” vibe.
              </Text>

              <View style={styles.rowWrap}>
                {["Trail", "Enduro", "Bike Park", "XC"].map((s) => (
                  <Chip
                    key={s}
                    label={s}
                    tone="orange"
                    selected={session.ridingStyle === s}
                    onPress={() => setSessionField("ridingStyle", s)}
                  />
                ))}
              </View>
            </AppCard>

            <AppCard style={styles.card}>
              <Text style={styles.cardTitle}>Terrain bias</Text>
              <Text style={styles.cardSub}>Pick what you want more of.</Text>

              <View style={styles.rowWrap}>
                {terrainChoices.map((t) => {
                  const label = t === "race" ? "Race" : terrainLabel(t);
                  const selected = (session.terrainBias || []).includes(t);
                  return (
                    <Chip
                      key={t}
                      label={label}
                      tone="orange"
                      selected={selected}
                      onPress={() => toggleTerrainBias(t)}
                    />
                  );
                })}
              </View>

              <Text style={styles.helper}>Selected vibe: {biasSummary}</Text>
            </AppCard>

            <AppCard style={styles.card}>
              <Text style={styles.cardTitle}>Conditions</Text>
              <Text style={styles.cardSub}>
                This nudges traction vs support. Quick pick is fine.
              </Text>

              <View style={styles.rowWrap}>
                {conditionsChoices.map((c) => {
                  const label =
                    c === "general" ? "All-around" : weatherLabel(c);
                  const selected =
                    String(session.conditions || "general") === String(c);
                  return (
                    <Chip
                      key={c}
                      label={label}
                      tone="neutral"
                      selected={selected}
                      onPress={() => setSessionField("conditions", c)}
                    />
                  );
                })}
              </View>

              <Text style={styles.helper}>Selected: {conditionsLabel}</Text>
            </AppCard>
          </View>
        ) : null}

        {/* Step 4 */}
        {step === 4 ? (
          <View style={{ gap: spacing.lg }}>
            <AppCard style={styles.card}>
              <Text style={styles.cardTitle}>Skill level</Text>
              <Text style={styles.cardSub}>
                This just nudges the baseline. You’ll tune it with feel.
              </Text>

              <View style={styles.rowWrap}>
                {["Beginner", "Intermediate", "Advanced"].map((lvl) => (
                  <Chip
                    key={lvl}
                    label={lvl}
                    tone="orange"
                    selected={session.skillLevel === lvl}
                    onPress={() => setSessionField("skillLevel", lvl)}
                  />
                ))}
              </View>
            </AppCard>

            <AppCard
              style={[
                styles.card,
                {
                  backgroundColor: colors.primarySoft,
                  borderColor: colors.primarySoft2,
                },
              ]}
            >
              <Text style={styles.cardTitle}>Quick review</Text>
              <Text style={styles.reviewLine}>
                Bike: {selectedBike?.name || "—"}
              </Text>
              <Text style={styles.reviewLine}>Style: {styleLabel}</Text>
              <Text style={styles.reviewLine}>Terrain: {biasSummary}</Text>
              <Text style={styles.reviewLine}>
                Conditions: {conditionsLabel}
              </Text>
              <Text style={styles.reviewLine}>
                Weight: {session.weightKg || "—"} {session.weightUnit}
              </Text>
              <Text style={styles.reviewLine}>Fork: {forkName || "—"}</Text>
              <Text style={styles.reviewLine}>Shock: {shockName || "—"}</Text>

              <Text style={styles.helper}>
                Perfect is not the goal — a confident starting point is.
              </Text>
            </AppCard>
          </View>
        ) : null}

        <View style={{ height: spacing.xl }} />

        {/* Footer controls */}
        <View style={styles.footerRow}>
          <AppButton
            title="Back"
            variant="secondary"
            onPress={onPrev}
            disabled={step === 1}
            style={{ flex: 1 }}
          />

          {step < 4 ? (
            <AppButton title="Next" onPress={onNext} style={{ flex: 1 }} />
          ) : (
            <AppButton
              title="Generate Baseline Setup"
              onPress={onGenerate}
              style={{ flex: 1 }}
              disabled={!canGenerate}
            />
          )}
        </View>

        <View style={{ height: spacing.md }} />

        <Pressable
          onPress={() => router.push("/ai/suspension-helper")}
          style={styles.inlineLink}
          hitSlop={8}
        >
          <Text style={styles.inlineLinkText}>Back to presets</Text>
          <ChevronRight size={16} color={colors.primary} strokeWidth={2.75} />
        </Pressable>
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

  topNav: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: radius.round,
    alignItems: "center",
    justifyContent: "center",
    padding: 0,
  },
  topNavTitle: {
    fontSize: 16,
    lineHeight: 18,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  resetBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: radius.round,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  resetText: {
    fontSize: typography.sm,
    fontFamily: typography.fontFamily.bold,
    color: colors.textSecondary,
  },

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
    marginBottom: spacing.xl,
  },

  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  progressPill: {
    height: 8,
    flex: 1,
    borderRadius: radius.round,
  },
  progressText: {
    marginLeft: spacing.sm,
    fontSize: typography.sm,
    fontFamily: typography.fontFamily.bold,
    color: colors.textSecondary,
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
    backgroundColor: colors.iconBgOrange,
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

  sectionLabel: {
    marginTop: spacing.md,
    fontSize: typography.xs,
    fontFamily: typography.fontFamily.black,
    color: colors.textSecondary,
    letterSpacing: 1.1,
  },

  helper: {
    marginTop: spacing.md,
    fontSize: typography.sm,
    lineHeight: 17,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textSecondary,
  },

  rowWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.md,
  },

  inputRow: {
    marginTop: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  input: {
    flex: 1,
    backgroundColor: colors.surfaceWarm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    fontSize: typography.base,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
  },

  reviewLine: {
    marginTop: 6,
    fontSize: typography.base,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textPrimary,
  },

  footerRow: {
    flexDirection: "row",
    gap: spacing.md,
  },

  inlineLink: {
    marginTop: spacing.sm,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
  },
  inlineLinkText: {
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
