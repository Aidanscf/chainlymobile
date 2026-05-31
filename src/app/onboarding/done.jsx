import React, { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { CheckCircle2, Sparkles } from "lucide-react-native";

import ScreenContainer from "@/components/layout/ScreenContainer";
import { colors, spacing, radius, typography, shadows } from "@/theme/index";
import useSettingsStore from "@/store/settings";
import useOnboardingStore from "@/store/onboarding";

import OnboardingBackground from "@/components/onboarding/OnboardingBackground.jsx";

export default function OnboardingDoneScreen() {
  const router = useRouter();

  const markOnboardingComplete = useSettingsStore(
    (s) => s.markOnboardingComplete,
  );
  const resetOnboardingProgress = useOnboardingStore((s) => s.reset);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        await markOnboardingComplete();
        await resetOnboardingProgress();
      } catch (e) {
        console.error(e);
      }

      if (!cancelled) {
        // Replace so back doesn't land in onboarding.
        router.replace("/(tabs)");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [markOnboardingComplete, resetOnboardingProgress, router]);

  return (
    <ScreenContainer safeTop safeBottom style={styles.container}>
      <StatusBar style="dark" />
      <OnboardingBackground variant="calm" />

      <View style={styles.center}>
        <View style={styles.iconStack}>
          <View style={styles.iconBubblePrimary}>
            <CheckCircle2 size={30} color={colors.success} strokeWidth={2.75} />
          </View>
          <View style={styles.iconBubbleSecondary}>
            <Sparkles size={30} color={colors.primary} strokeWidth={2.75} />
          </View>
        </View>

        <Text style={styles.title}>You’re in.</Text>
        <Text style={styles.subtitle}>Loading Chainly…</Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.appBackground,
  },
  center: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  iconStack: {
    flexDirection: "row",
    gap: spacing.md,
  },
  iconBubblePrimary: {
    width: 74,
    height: 74,
    borderRadius: radius.round,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.medium,
  },
  iconBubbleSecondary: {
    width: 74,
    height: 74,
    borderRadius: radius.round,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primarySoft2,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.medium,
  },
  title: {
    marginTop: spacing.xl,
    fontSize: 34,
    lineHeight: 38,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    letterSpacing: -0.9,
    textAlign: "center",
  },
  subtitle: {
    marginTop: spacing.sm,
    fontSize: 14,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textSecondary,
    textAlign: "center",
  },
});
