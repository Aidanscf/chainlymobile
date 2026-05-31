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
import { useTripsStore } from "@/store/trips";
import { FEATURE_TRIP_PLANNER_ENABLED } from "@/utils/featureFlags";

export default function AITripPlannerGeneratingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();

  const wizard = useTripsStore((s) => s.wizard);
  const plan = useTripsStore((s) => s.currentPlan);
  const loading = useTripsStore((s) => s.loading);
  const progress = useTripsStore((s) => s.aiProgress);
  const generatePreviewPlan = useTripsStore((s) => s.generatePreviewPlan);
  const resetWizard = useTripsStore((s) => s.resetWizard);

  const [error, setError] = useState(null);
  const startedRef = useRef(false);

  const from = useMemo(() => {
    const raw = params?.from;
    return raw ? String(raw) : null;
  }, [params?.from]);

  const destName = useMemo(() => {
    const name = wizard?.destination?.name;
    return name ? String(name) : "your destination";
  }, [wizard?.destination?.name]);

  const pct = useMemo(() => {
    const n = Number(progress || 0);
    if (!Number.isFinite(n)) return 0;
    return Math.max(0, Math.min(100, Math.round(n)));
  }, [progress]);

  const onBack = useCallback(() => {
    // Let users bail out quickly.
    router.back();
  }, [router]);

  const onRetry = useCallback(async () => {
    setError(null);

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
    router.replace("/ai/trip-planner");
  }, [resetWizard, router]);

  useEffect(() => {
    if (!FEATURE_TRIP_PLANNER_ENABLED) {
      return;
    }

    // If we already have a plan and we're not loading anymore, go to preview.
    if (plan && !loading) {
      router.replace({
        pathname: "/ai/trip-planner/overview",
        params: from ? { from } : undefined,
      });
    }
  }, [from, loading, plan, router]);

  useEffect(() => {
    if (!FEATURE_TRIP_PLANNER_ENABLED) {
      return;
    }

    if (startedRef.current) return;
    if (!wizard?.destination) return;

    startedRef.current = true;

    (async () => {
      try {
        await generatePreviewPlan();
        // navigation handled by the other effect
      } catch (e) {
        console.error(e);
        setError(String(e?.message || "Could not generate plan"));
      }
    })();
  }, [generatePreviewPlan, wizard?.destination]);

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

  if (!FEATURE_TRIP_PLANNER_ENABLED) {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" />

        <ScreenHeader
          title="Trip Planner"
          showBack
          onBack={() => router.replace("/ai")}
        />

        <View
          style={{
            flex: 1,
            padding: spacing.xl,
            paddingBottom: insets.bottom + 28,
          }}
        >
          <AppCard
            pressable={false}
            style={{
              backgroundColor: colors.surfaceWarm,
              borderColor: colors.border,
            }}
          >
            <Text
              style={{
                fontSize: 18,
                lineHeight: 20,
                fontFamily: typography.fontFamily.black,
                color: colors.textPrimary,
              }}
            >
              Trip Planner coming back soon.
            </Text>
            <Text
              style={{
                marginTop: 6,
                fontSize: typography.base,
                lineHeight: 19,
                fontFamily: typography.fontFamily.regular,
                color: colors.textSecondary,
              }}
            >
              We’re polishing a new version. Check back soon.
            </Text>
            <View style={{ height: spacing.lg }} />
            <AppButton
              title="Back to AI Hub"
              onPress={() => router.replace("/ai")}
            />
          </AppCard>
        </View>
      </View>
    );
  }

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
              <Text style={styles.title}>Building your plan</Text>
              <Text style={styles.subtitle} numberOfLines={2}>
                Trails-first itinerary for {destName}.
              </Text>
            </View>
            <View style={styles.pctPill}>
              <Text style={styles.pctText}>{pct}%</Text>
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
                ? "Picking trails that match your vibe…"
                : pct < 70
                  ? "Laying out each day + bailouts…"
                  : "Adding food, stay, and packing…"}
          </Text>

          {error ? (
            <View style={{ marginTop: spacing.lg }}>
              <AppCard style={styles.errorCard}>
                <Text style={styles.errorTitle}>Couldn’t generate plan</Text>
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
                      onPress={() => router.replace("/ai/trip-planner")}
                    />
                  </View>
                </View>
              </AppCard>
            </View>
          ) : (
            <View style={{ marginTop: spacing.xl }}>
              <Text style={styles.smallPrint}>
                Tip: you can change duration, difficulty, and budget anytime.
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
