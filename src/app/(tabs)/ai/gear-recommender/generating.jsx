import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { Sparkles, ChevronRight, RotateCcw } from "lucide-react-native";

import ScreenHeader from "@/components/layout/ScreenHeader";
import AppCard from "@/components/AppCard";
import AppButton from "@/components/AppButton";
import { colors, spacing, typography, radius } from "@/theme/index";
import { useChainlyStore } from "@/store/chainlyStore";
import { useGearStore } from "@/store/gearStore";
import useSettingsStore from "@/store/settings";
import { riderCharacter } from "@/data/mock";
import { inferBikeCompatibilityProfile } from "@/utils/compatibility";
import { generateGearRecommendationsJob } from "@/utils/ai/gearRecommender";

export default function GearRecommenderGeneratingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();

  const wizard = useGearStore((s) => s.wizard);
  const setResults = useGearStore((s) => s.setResults);
  const resetWizard = useGearStore((s) => s.resetWizard);

  const userProfile = useSettingsStore((s) => s.settings.userProfile);
  const bikeInfo = useSettingsStore((s) => s.settings.bikeInfo);

  const bikes = useChainlyStore((s) => s.bikes);
  const getBikeById = useChainlyStore((s) => s.getBikeById);
  const getBikeDetailById = useChainlyStore((s) => s.getBikeDetailById);

  const [error, setError] = useState(null);
  const [pct, setPct] = useState(12);

  const startedRef = useRef(false);

  const from = useMemo(() => {
    const raw = params?.from;
    return raw ? String(raw) : null;
  }, [params?.from]);

  const selectedBike = useMemo(() => {
    const fromStore = getBikeById?.(wizard.bikeId);
    return fromStore || bikes?.[0] || null;
  }, [bikes, getBikeById, wizard.bikeId]);

  const bikeDetail = useMemo(() => {
    if (!selectedBike) {
      return null;
    }
    return getBikeDetailById?.(selectedBike.id);
  }, [getBikeDetailById, selectedBike]);

  const bikeProfile = useMemo(() => {
    if (!selectedBike) {
      return null;
    }
    return inferBikeCompatibilityProfile({ bike: selectedBike, bikeDetail });
  }, [bikeDetail, selectedBike]);

  const focusLabel = useMemo(() => {
    const f = String(wizard?.focus || "");
    if (f === "brakes") return "Brakes";
    if (f === "drivetrain") return "Drivetrain";
    if (f === "suspension") return "Suspension";
    if (f === "wheels_tires") return "Wheels & Tires";
    if (f === "cockpit") return "Cockpit";
    return "Gear";
  }, [wizard?.focus]);

  const onBack = useCallback(() => {
    router.back();
  }, [router]);

  const onRetry = useCallback(async () => {
    setError(null);
    setPct(12);

    try {
      if (typeof Haptics.selectionAsync === "function") {
        await Haptics.selectionAsync();
      }
    } catch (e) {
      // no-op
    }

    startedRef.current = false;
  }, []);

  const onReset = useCallback(async () => {
    try {
      if (typeof Haptics.notificationAsync === "function") {
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Warning,
        );
      }
    } catch (e) {
      // no-op
    }

    resetWizard();
    router.replace("/ai/gear-recommender");
  }, [resetWizard, router]);

  useEffect(() => {
    if (error) {
      return;
    }

    // Fake progress to keep this screen feeling alive.
    const handle = setInterval(() => {
      setPct((p) => {
        const next = p + (p < 55 ? 6 : p < 80 ? 3 : 1);
        return Math.min(95, next);
      });
    }, 420);

    return () => clearInterval(handle);
  }, [error]);

  useEffect(() => {
    if (startedRef.current) return;

    // We need a bike profile to generate solid results.
    if (!selectedBike || !bikeProfile) {
      return;
    }

    startedRef.current = true;

    (async () => {
      try {
        const recs = await generateGearRecommendationsJob({
          wizard,
          bikeProfile,
          riderCharacter,
          userProfile,
          bikeInfo,
        });

        setPct(100);
        setResults(recs);

        router.replace({
          pathname: "/ai/gear-recommender/results",
          params: from ? { from } : undefined,
        });
      } catch (e) {
        console.error(e);
        setError(String(e?.message || "Could not generate recommendations"));
      }
    })();
  }, [
    bikeInfo,
    bikeProfile,
    from,
    generateGearRecommendationsJob,
    router,
    selectedBike,
    setResults,
    userProfile,
    wizard,
  ]);

  const headerAction = (
    <Pressable
      onPress={onReset}
      hitSlop={10}
      style={styles.headerIconBtn}
      accessibilityRole="button"
      accessibilityLabel="Reset"
    >
      <RotateCcw size={18} color={colors.textSecondary} strokeWidth={2.75} />
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <ScreenHeader
        title="Generating"
        showBack
        onBack={onBack}
        rightAction={headerAction}
      />

      <View
        style={{
          flex: 1,
          padding: spacing.xl,
          paddingBottom: insets.bottom + 28,
        }}
      >
        <AppCard style={styles.card}>
          <View style={styles.topRow}>
            <View style={styles.iconCircle}>
              <Sparkles size={18} color={colors.primary} strokeWidth={2.75} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Building your picks</Text>
              <Text style={styles.subtitle} numberOfLines={2}>
                {focusLabel} recommendations for{" "}
                {selectedBike?.name || "your bike"}.
              </Text>
            </View>
            <View style={styles.pctPill}>
              <Text style={styles.pctText}>{Math.round(pct)}%</Text>
              <ChevronRight
                size={16}
                color={colors.textSecondary}
                strokeWidth={2.75}
              />
            </View>
          </View>

          <View style={{ height: spacing.lg }} />

          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${pct}%` }]} />
          </View>

          <Text style={styles.progressHint}>
            {error
              ? "Something went sideways. Try again."
              : pct < 35
                ? "Checking compatibility + budget…"
                : pct < 70
                  ? "Scoring your best upgrades…"
                  : "Writing the short version (no fluff)…"}
          </Text>

          {error ? (
            <View style={{ marginTop: spacing.lg }}>
              <AppCard style={styles.errorCard}>
                <Text style={styles.errorTitle}>
                  Couldn’t generate recommendations
                </Text>
                <Text style={styles.errorText}>{error}</Text>
                <View style={{ height: spacing.lg }} />
                <View style={{ flexDirection: "row", gap: spacing.md }}>
                  <View style={{ flex: 1 }}>
                    <AppButton title="Retry" onPress={onRetry} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <AppButton
                      title="Back to Wizard"
                      variant="secondary"
                      onPress={() => router.replace("/ai/gear-recommender")}
                    />
                  </View>
                </View>
              </AppCard>
            </View>
          ) : (
            <View style={{ marginTop: spacing.xl }}>
              <Text style={styles.smallPrint}>
                Tip: you can tweak focus, terrain, and budget anytime.
              </Text>
            </View>
          )}
        </AppCard>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  headerIconBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.round,
    alignItems: "center",
    justifyContent: "center",
  },

  card: {
    backgroundColor: colors.surface,
    borderColor: colors.borderLight,
  },

  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: radius.round,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primarySoft2,
    alignItems: "center",
    justifyContent: "center",
  },

  title: {
    fontSize: 18,
    lineHeight: 20,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  subtitle: {
    marginTop: 4,
    fontSize: typography.sm,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textSecondary,
  },

  pctPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: radius.round,
    backgroundColor: colors.surfaceWarm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pctText: {
    fontSize: 13,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
  },

  progressTrack: {
    height: 10,
    borderRadius: 999,
    backgroundColor: colors.borderLight,
    overflow: "hidden",
  },
  progressFill: {
    height: 10,
    borderRadius: 999,
    backgroundColor: colors.primary,
  },

  progressHint: {
    marginTop: spacing.md,
    fontSize: typography.sm,
    lineHeight: 16,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textSecondary,
  },

  smallPrint: {
    fontSize: typography.sm,
    lineHeight: 16,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },

  errorCard: {
    backgroundColor: colors.surfaceWarm,
    borderColor: colors.border,
  },
  errorTitle: {
    fontSize: 16,
    lineHeight: 18,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
  },
  errorText: {
    marginTop: 6,
    fontSize: typography.sm,
    lineHeight: 16,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
});
