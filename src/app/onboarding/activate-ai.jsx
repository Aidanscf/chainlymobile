import React, { useCallback, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Platform,
  Image,
  ScrollView,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Video, Wrench, Sparkles } from "lucide-react-native";

import ScreenContainer from "@/components/layout/ScreenContainer";
import OnboardingBackground from "@/components/onboarding/OnboardingBackground";
import OnboardingTopBar from "@/components/onboarding/OnboardingTopBar";
import StickyCTA from "@/components/onboarding/StickyCTA";
import AppCard from "@/components/AppCard";
import { colors, spacing, radius, typography, shadows } from "@/theme/index";
import useSettingsStore from "@/store/settings";
import useOnboardingStore from "@/store/onboarding";

export default function ActivateAIScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const setSettings = useSettingsStore((s) => s.setSettings);
  const settings = useSettingsStore((s) => s.settings);
  const setProgress = useOnboardingStore((s) => s.setProgress);

  const [activating, setActivating] = React.useState(false);

  // Floating animation for logo
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setProgress({
      currentStepIndex: 105,
      lastRoute: "/onboarding/activate-ai",
    });
  }, [setProgress]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 2400,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2400,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [floatAnim]);

  const translateY = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -12],
  });

  const onBack = useCallback(() => {
    router.back();
  }, [router]);

  const onEnableAI = useCallback(async () => {
    setActivating(true);

    try {
      if (Platform.OS !== "web") {
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success,
        );
      }
    } catch (e) {
      // no-op
    }

    // Set ai_tools_enabled flag
    const next = {
      ...settings,
      ai: {
        ...settings.ai,
        toolsEnabled: true,
      },
    };

    await setSettings(next);

    // Small delay for satisfaction
    await new Promise((resolve) => setTimeout(resolve, 400));

    router.push("/onboarding/done");
  }, [router, setSettings, settings]);

  const onNotNow = useCallback(async () => {
    try {
      if (Platform.OS !== "web") {
        await Haptics.selectionAsync();
      }
    } catch (e) {
      // no-op
    }

    // Set ai_tools_enabled to false
    const next = {
      ...settings,
      ai: {
        ...settings.ai,
        toolsEnabled: false,
      },
    };

    await setSettings(next);

    router.push("/onboarding/done");
  }, [router, setSettings, settings]);

  return (
    <ScreenContainer safeBottom style={styles.container}>
      <StatusBar style="dark" />
      <OnboardingBackground variant="warm" />

      <OnboardingTopBar title="AI Tools" onBack={onBack} />

      <View style={{ flex: 1 }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingTop: spacing.xl,
            paddingHorizontal: spacing.xl,
            paddingBottom: 12,
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* Illustration Section */}
          <View style={styles.illustrationContainer}>
            <Animated.View
              style={[styles.logoContainer, { transform: [{ translateY }] }]}
            >
              {/* Chainly Logo Placeholder - using a circle with chain link icon */}
              <View style={styles.logoCircle}>
                <Sparkles size={48} color={colors.primary} strokeWidth={2.5} />
              </View>
            </Animated.View>

            {/* Background decorative elements */}
            <View style={styles.decorativeElements}>
              <View style={[styles.sparkle, styles.sparkle1]}>
                <Sparkles
                  size={16}
                  color={colors.primaryLight}
                  strokeWidth={2}
                />
              </View>
              <View style={[styles.sparkle, styles.sparkle2]}>
                <Sparkles size={12} color={colors.primary} strokeWidth={2} />
              </View>
              <View style={[styles.sparkle, styles.sparkle3]}>
                <Sparkles
                  size={14}
                  color={colors.primaryLight}
                  strokeWidth={2}
                />
              </View>
            </View>
          </View>

          {/* Text Block */}
          <View style={styles.textBlock}>
            <Text style={styles.headline}>Activate Chainly AI</Text>

            <Text style={styles.subheadline}>
              Get coaching from your riding clips and keep your bike dialed with
              smart maintenance logs.
            </Text>

            <Text style={styles.microcopy}>
              Chainly analyzes your video or photo, then gives clear tips and
              tracks your bike's health over time.
            </Text>
          </View>

          {/* Feature Highlights */}
          <View style={styles.featuresContainer}>
            <AppCard style={styles.featureCard} pressable={false} padding={16}>
              <View style={styles.featureRow}>
                <View style={styles.featureIcon}>
                  <Video size={20} color={colors.primary} strokeWidth={2.75} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.featureLabel}>AI Bike Coach</Text>
                  <Text style={styles.featureDesc}>
                    Upload a clip → get form tips for jumps, drops, cornering,
                    and steep tech.
                  </Text>
                </View>
              </View>
            </AppCard>

            <AppCard style={styles.featureCard} pressable={false} padding={16}>
              <View style={styles.featureRow}>
                <View style={styles.featureIcon}>
                  <Wrench size={20} color={colors.primary} strokeWidth={2.75} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.featureLabel}>Mechanic Logs</Text>
                  <Text style={styles.featureDesc}>
                    Log fixes and get a bike health score + reminders.
                  </Text>
                </View>
              </View>
            </AppCard>
          </View>

          <View style={{ height: 170 }} />
        </ScrollView>

        {/* Sticky CTA */}
        <StickyCTA
          primaryTitle={activating ? "Activating…" : "Enable AI Tools"}
          onPrimary={onEnableAI}
          primaryLoading={activating}
          secondaryTitle="Not now"
          onSecondary={onNotNow}
          footnote="You can enable this later in settings"
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  illustrationContainer: {
    alignItems: "center",
    paddingVertical: spacing.xxxl,
    position: "relative",
    height: 180,
  },

  logoContainer: {
    alignItems: "center",
    justifyContent: "center",
  },

  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: radius.round,
    backgroundColor: colors.primarySoft,
    borderWidth: 3,
    borderColor: colors.primarySoft2,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.medium,
  },

  decorativeElements: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },

  sparkle: {
    position: "absolute",
    opacity: 0.6,
  },

  sparkle1: {
    top: 20,
    left: 40,
  },

  sparkle2: {
    top: 60,
    right: 50,
  },

  sparkle3: {
    bottom: 30,
    left: 60,
  },

  textBlock: {
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },

  headline: {
    fontSize: 32,
    lineHeight: 36,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    letterSpacing: -0.8,
    textAlign: "center",
  },

  subheadline: {
    fontSize: typography.lg,
    lineHeight: 23,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textPrimary,
    textAlign: "center",
  },

  microcopy: {
    fontSize: typography.sm,
    lineHeight: 18,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    textAlign: "center",
  },

  featuresContainer: {
    marginTop: spacing.xl,
    gap: spacing.sm,
  },

  featureCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    ...shadows.small,
  },

  featureRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
  },

  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.round,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primarySoft2,
    alignItems: "center",
    justifyContent: "center",
  },

  featureLabel: {
    fontSize: typography.base,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    marginBottom: 4,
  },

  featureDesc: {
    fontSize: typography.sm,
    lineHeight: 18,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
});
