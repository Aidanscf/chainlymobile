import React, { useCallback, useEffect } from "react";
import { View, Text, StyleSheet, Platform, Animated, ScrollView } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { Bike } from "lucide-react-native";

import ScreenContainer from "@/components/layout/ScreenContainer";
import AppCard from "@/components/AppCard";
import { colors, spacing, radius, typography, shadows } from "@/theme/index";
import useOnboardingStore from "@/store/onboarding";
import OnboardingBackground from "@/components/onboarding/OnboardingBackground.jsx";
import StickyCTA from "@/components/onboarding/StickyCTA.jsx";

const CHAINLY_LOGO_URL =
  "https://ucarecdn.com/2dad7912-5620-4993-b434-106566c17ea2/-/format/auto/";

export default function OnboardingWelcomeScreen() {
  const router = useRouter();
  const fadeAnim = new Animated.Value(0);

  const setProgress = useOnboardingStore((s) => s.setProgress);

  useEffect(() => {
    setProgress({ currentStepIndex: 0, lastRoute: "/onboarding/welcome" });

    // Subtle fade-in
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [setProgress]);

  const onGetStarted = useCallback(async () => {
    try {
      if (Platform.OS !== "web") await Haptics.selectionAsync();
    } catch (e) {
      // no-op
    }

    await setProgress({
      currentStepIndex: 0.5,
      lastRoute: "/onboarding/friction",
    });

    router.push("/onboarding/friction");
  }, [router, setProgress]);

  const onLogin = useCallback(async () => {
    try {
      if (Platform.OS !== "web") await Haptics.selectionAsync();
    } catch (e) {
      // no-op
    }

    router.push("/login");
  }, [router]);

  return (
    <ScreenContainer safeTop safeBottom style={styles.container}>
      <StatusBar style="dark" />
      <OnboardingBackground variant="warm" />

      {/* Abstract Mountain Contour Lines */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={styles.contourLine1} />
        <View style={styles.contourLine2} />
        <View style={styles.contourLine3} />
        <View style={styles.contourLine4} />
      </View>

      <Animated.View style={[styles.inner, { opacity: fadeAnim }]}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Logo Card - Centered & Large */}
          <View style={styles.logoSection}>
            <AppCard style={styles.logoCard} pressable={false} padding={24}>
              <View style={styles.logoBubble}>
                <Image
                  source={{ uri: CHAINLY_LOGO_URL }}
                  style={styles.logoImage}
                  contentFit="contain"
                />
              </View>
              <Text style={styles.logoText}>CHAINLY</Text>
            </AppCard>
          </View>

          {/* Hero Content: Icon + Headline Unit - Just above CTA */}
          <View style={styles.heroBottom}>
            {/* Orange Biker Icon - Geometric & Leaning */}
            <View style={styles.bikerIconContainer}>
              <View style={styles.bikerIconWrapper}>
                <Bike color={colors.primary} size={56} strokeWidth={2.5} />
              </View>
            </View>

            <Text style={styles.title}>Your AI bike helper.</Text>

            <View style={styles.pillContainer}>
              <View style={styles.miniPill}>
                <View style={styles.miniDot} />
                <Text style={styles.miniText}>Takes ~60 seconds</Text>
              </View>
            </View>
          </View>
        </ScrollView>

        <StickyCTA
          primaryTitle="Get Started"
          onPrimary={onGetStarted}
          secondaryTitle="Already have an account? Log in"
          onSecondary={onLogin}
        />
      </Animated.View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.appBackground,
  },
  inner: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
  },

  // Abstract Mountain Contours
  contourLine1: {
    position: "absolute",
    top: "15%",
    left: -100,
    right: -100,
    height: 1,
    backgroundColor: colors.textPrimary,
    opacity: 0.08,
    transform: [{ rotate: "-2deg" }],
  },
  contourLine2: {
    position: "absolute",
    top: "25%",
    left: -80,
    right: -80,
    height: 1,
    backgroundColor: colors.textPrimary,
    opacity: 0.1,
    transform: [{ rotate: "1deg" }],
  },
  contourLine3: {
    position: "absolute",
    top: "35%",
    left: -120,
    right: -120,
    height: 1,
    backgroundColor: colors.textPrimary,
    opacity: 0.06,
    transform: [{ rotate: "-1.5deg" }],
  },
  contourLine4: {
    position: "absolute",
    top: "45%",
    left: -90,
    right: -90,
    height: 1,
    backgroundColor: colors.textPrimary,
    opacity: 0.09,
    transform: [{ rotate: "2deg" }],
  },

  // Logo Section - Centered & Larger
  logoSection: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  logoCard: {
    alignItems: "center",
    borderRadius: 32,
    backgroundColor: colors.surface,
    ...shadows.large,
  },
  logoBubble: {
    width: 120,
    height: 120,
    borderRadius: radius.round,
    backgroundColor: colors.primarySoft,
    borderWidth: 2,
    borderColor: colors.primarySoft2,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  logoImage: {
    width: 90,
    height: 90,
  },
  logoText: {
    marginTop: spacing.lg,
    fontSize: 38,
    lineHeight: 42,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    letterSpacing: 2,
  },

  // Hero Bottom - Just Above CTA
  heroBottom: {
    alignItems: "center",
    marginBottom: spacing.lg,
  },

  // Orange Biker Icon
  bikerIconContainer: {
    marginBottom: spacing.md,
  },
  bikerIconWrapper: {
    transform: [{ rotate: "-8deg" }], // Slight lean for motion
  },

  title: {
    fontSize: 36,
    lineHeight: 42,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    letterSpacing: -1,
    textAlign: "center",
    marginBottom: spacing.sm,
  },

  pillContainer: {
    marginTop: spacing.md,
  },
  miniPill: {
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.round,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.small,
  },
  miniDot: {
    width: 8,
    height: 8,
    borderRadius: radius.round,
    backgroundColor: colors.primary,
  },
  miniText: {
    fontSize: 12,
    fontFamily: typography.fontFamily.black,
    color: colors.textSecondary,
  },
});
