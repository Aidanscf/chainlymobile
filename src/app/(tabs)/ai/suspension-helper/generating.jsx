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
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Sparkles, ChevronRight, RotateCcw } from "lucide-react-native";

import ScreenHeader from "@/components/layout/ScreenHeader";
import AppCard from "@/components/AppCard";
import AppButton from "@/components/AppButton";
import { colors, spacing, typography, radius } from "@/theme/index";
import { useSuspensionStore } from "@/store/suspension";

export default function AISuspensionGeneratingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const session = useSuspensionStore((s) => s.session);
  const aiLoading = useSuspensionStore((s) => s.aiLoading);
  const progress = useSuspensionStore((s) => s.aiProgress);
  const generateBaselineFromAI = useSuspensionStore(
    (s) => s.generateBaselineFromAI,
  );
  const resetSession = useSuspensionStore((s) => s.resetSession);

  const [error, setError] = useState(null);
  const startedRef = useRef(false);

  const bikeLabel = useMemo(() => {
    const name =
      session?.forkName || session?.shockName ? "your bike" : "your bike";
    return name;
  }, [session?.forkName, session?.shockName]);

  const pct = useMemo(() => {
    const n = Number(progress || 0);
    if (!Number.isFinite(n)) return 0;
    return Math.max(0, Math.min(100, Math.round(n)));
  }, [progress]);

  const onBack = useCallback(() => {
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

    resetSession();
    router.replace("/ai/suspension-helper/get-settings");
  }, [resetSession, router]);

  useEffect(() => {
    if (startedRef.current) return;
    if (!session?.bikeId) return;

    startedRef.current = true;

    (async () => {
      try {
        await generateBaselineFromAI();
        router.replace("/ai/suspension-helper/baseline");
      } catch (e) {
        console.error(e);
        setError(String(e?.message || "Could not generate baseline"));
      }
    })();
  }, [generateBaselineFromAI, router, session?.bikeId]);

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
              <Text style={styles.title}>Dialing your baseline</Text>
              <Text style={styles.subtitle} numberOfLines={2}>
                Safe starting point for {bikeLabel}.
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
                ? "Reading your bike + conditions…"
                : pct < 70
                  ? "Building safe sag + pressure targets…"
                  : "Setting rebound + support for your vibe…"}
          </Text>

          {error ? (
            <View style={{ marginTop: spacing.lg }}>
              <AppCard style={styles.errorCard}>
                <Text style={styles.errorTitle}>
                  Couldn’t generate baseline
                </Text>
                <Text style={styles.errorText}>{error}</Text>
                <View style={{ height: spacing.lg }} />
                <View style={{ flexDirection: "row", gap: spacing.md }}>
                  <View style={{ flex: 1 }}>
                    <AppButton title="Retry" onPress={onRetry} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <AppButton
                      title="Back"
                      variant="secondary"
                      onPress={() =>
                        router.replace("/ai/suspension-helper/get-settings")
                      }
                    />
                  </View>
                </View>
              </AppCard>
            </View>
          ) : (
            <View style={{ marginTop: spacing.xl }}>
              <Text style={styles.smallPrint}>
                Tip: set sag first, then clicks. One change at a time.
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
