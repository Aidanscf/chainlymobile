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
import { ClipboardCheck, Play, ChevronRight } from "lucide-react-native";

import AppCard from "@/components/AppCard";
import AppButton from "@/components/AppButton";
import { colors, spacing, radius, typography, shadows } from "@/theme/index";
import { useChainlyStore } from "@/store/chainlyStore";
import { useSuspensionStore } from "@/store/suspension";
import SuspensionUnitCard from "./components/SuspensionUnitCard";
import ScreenHeader from "@/components/layout/ScreenHeader";

function formatPresetName({ bikeName, style }) {
  const d = new Date();
  const m = d.toLocaleString(undefined, { month: "short" });
  const day = d.getDate();
  return `${style || "Trail"} baseline • ${bikeName || "My bike"} • ${m} ${day}`;
}

export default function AISuspensionBaselineScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const session = useSuspensionStore((s) => s.session);
  const savePresetFromSession = useSuspensionStore(
    (s) => s.savePresetFromSession,
  );

  const getBikeById = useChainlyStore((s) => s.getBikeById);

  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  const bike = useMemo(
    () => (session.bikeId ? getBikeById(session.bikeId) : null),
    [getBikeById, session.bikeId],
  );

  const forkLabel = useMemo(() => {
    const name = session?.forkName;
    return name ? String(name) : "";
  }, [session?.forkName]);

  const shockLabel = useMemo(() => {
    const name = session?.shockName;
    return name ? String(name) : "";
  }, [session?.shockName]);

  const canRender = Boolean(session.forkSettings && session.shockSettings);

  const showToast = useCallback((msg) => {
    setToast(msg);
    if (toastTimer.current) {
      clearTimeout(toastTimer.current);
    }
    toastTimer.current = setTimeout(() => setToast(null), 1600);
  }, []);

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

  const onSavePreset = useCallback(async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {
      // no-op
    }

    try {
      const presetName = formatPresetName({
        bikeName: bike?.name,
        style: session.ridingStyle,
      });
      savePresetFromSession({
        name: presetName,
        terrainTag: (session.terrainBias || [])[0] || "tech",
      });
      showToast("Saved preset");
    } catch (error) {
      console.error(error);
      showToast("Could not save preset");
    }
  }, [
    bike?.name,
    savePresetFromSession,
    session.ridingStyle,
    session.terrainBias,
    showToast,
  ]);

  const onStartChecklist = useCallback(async () => {
    try {
      await Haptics.selectionAsync();
    } catch (e) {
      // no-op
    }
    router.push("/ai/suspension-helper/checklist");
  }, [router]);

  const onViewPresets = useCallback(() => {
    router.push("/ai/suspension-helper");
  }, [router]);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <ScreenHeader title="Suspension Helper" showBack onBack={onBack} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: spacing.xl,
          paddingBottom: insets.bottom + 28,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Baseline settings</Text>
        <Text style={styles.subtitle}>
          Great starting point for your weight + riding style. Set these, then
          we’ll dial in by feel.
        </Text>

        <AppCard style={styles.banner}>
          <View style={styles.bannerIcon}>
            <ClipboardCheck
              size={16}
              color={colors.primary}
              strokeWidth={2.5}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.bannerTitle}>Baseline, not gospel</Text>
            <Text style={styles.bannerSub}>
              Always double-check manufacturer limits. Small adjustments are the
              win.
            </Text>
          </View>
        </AppCard>

        {!canRender ? (
          <AppCard style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No setup yet</Text>
            <Text style={styles.emptySub}>
              Go back and generate a baseline setup first.
            </Text>
          </AppCard>
        ) : (
          <View style={{ gap: spacing.lg }}>
            <SuspensionUnitCard
              title="Fork"
              componentLabel={forkLabel}
              settings={session.forkSettings}
              tone="orange"
            />
            <SuspensionUnitCard
              title="Shock"
              componentLabel={shockLabel}
              settings={session.shockSettings}
            />
          </View>
        )}

        <View style={{ height: spacing.xl }} />

        <View style={{ gap: spacing.sm }}>
          <AppButton
            title="Start Setup Checklist"
            onPress={onStartChecklist}
            disabled={!canRender}
          />

          <View style={styles.twoCol}>
            <AppButton
              title="Save as Preset"
              onPress={onSavePreset}
              variant="secondary"
              disabled={!canRender}
              style={{ flex: 1 }}
            />
            <AppButton
              title="Presets"
              onPress={onViewPresets}
              variant="secondary"
              disabled={!session.bikeId}
              style={{ flex: 1 }}
            />
          </View>

          <Pressable
            onPress={() => router.push("/ai/suspension-helper/adjuster")}
            style={styles.skipLink}
            hitSlop={10}
          >
            <Play size={16} color={colors.primary} strokeWidth={2.75} />
            <Text style={styles.skipText}>Skip to adjustments</Text>
          </Pressable>
        </View>

        <View style={{ height: spacing.lg }} />

        <Pressable
          onPress={() => router.push("/ai/suspension-helper")}
          style={styles.inlineLink}
          hitSlop={10}
        >
          <ChevronRight size={16} color={colors.primary} strokeWidth={2.75} />
          <Text style={styles.inlineLinkText}>Back to presets</Text>
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

  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.primarySoft,
    borderColor: colors.primarySoft2,
    marginBottom: spacing.lg,
  },
  bannerIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.round,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primarySoft2,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.small,
  },
  bannerTitle: {
    fontSize: 16,
    lineHeight: 18,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
  },
  bannerSub: {
    marginTop: 4,
    fontSize: typography.sm,
    lineHeight: 17,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textSecondary,
  },

  emptyCard: {
    backgroundColor: colors.surfaceWarm,
    borderColor: colors.border,
  },
  emptyTitle: {
    fontSize: 16,
    lineHeight: 18,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
  },
  emptySub: {
    marginTop: 6,
    fontSize: typography.base,
    lineHeight: 19,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },

  twoCol: {
    flexDirection: "row",
    gap: spacing.md,
  },

  skipLink: {
    marginTop: spacing.sm,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
  },
  skipText: {
    fontSize: typography.sm,
    fontFamily: typography.fontFamily.black,
    color: colors.primary,
  },

  inlineLink: {
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
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
