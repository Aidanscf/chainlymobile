import React, { useCallback, useEffect, useRef } from "react";
import { View, Text, Animated, Platform, ScrollView } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";

import ScreenContainer from "@/components/layout/ScreenContainer";
import { colors, spacing, radius, typography } from "@/theme/index";
import useOnboardingStore from "@/store/onboarding";
import OnboardingBackground from "@/components/onboarding/OnboardingBackground.jsx";
import StickyCTA from "@/components/onboarding/StickyCTA.jsx";

const GAP_ITEMS = [
  "Diagnose bike issues",
  "Track maintenance & health",
  "Get real coaching feedback",
  "Dial in suspension correctly",
  "Improve technique with guidance",
  "Compete and connect with other riders",
];

export default function OnboardingGapScreen() {
  const router = useRouter();
  const setProgress = useOnboardingStore((s) => s.setProgress);

  // Fade animations
  const itemAnims = useRef(GAP_ITEMS.map(() => new Animated.Value(0))).current;
  const closingAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setProgress({
      currentStepIndex: 0.8,
      lastRoute: "/onboarding/gap",
    });

    // Stagger fade-in for gap items
    Animated.stagger(
      100,
      itemAnims.map((anim) =>
        Animated.timing(anim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ),
    ).start();

    // Delay closing statement
    setTimeout(() => {
      Animated.timing(closingAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();
    }, 1000);
  }, [setProgress, itemAnims, closingAnim]);

  const onContinue = useCallback(async () => {
    try {
      if (Platform.OS !== "web") await Haptics.selectionAsync();
    } catch (e) {
      // no-op
    }

    await setProgress({
      currentStepIndex: 0.9,
      lastRoute: "/onboarding/solution",
    });

    router.push("/onboarding/solution");
  }, [router, setProgress]);

  const onSkip = useCallback(() => {
    router.push("/onboarding/questions");
  }, [router]);

  return (
    <ScreenContainer
      safeTop
      safeBottom
      style={{ backgroundColor: colors.appBackground }}
    >
      <StatusBar style="dark" />
      <OnboardingBackground variant="warm" />

      <View style={{ flex: 1, paddingHorizontal: spacing.xl }}>
        <ScrollView 
          style={{ flex: 1 }} 
          contentContainerStyle={{ paddingTop: spacing.xxl, paddingBottom: spacing.xl }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={{ gap: spacing.md }}>
            <Text
              style={{
                fontSize: 42,
                lineHeight: 48,
                fontFamily: typography.fontFamily.black,
                color: colors.textPrimary,
                letterSpacing: -1.5,
              }}
            >
              The tools are scattered.
            </Text>
            <Text
              style={{
                fontSize: 17,
                lineHeight: 24,
                fontFamily: typography.fontFamily.semibold,
                color: colors.textSecondary,
              }}
            >
              There's no single place that helps riders:
            </Text>
          </View>

          <View style={{ height: spacing.xxl }} />

          {/* Gap bullets */}
          <View style={{ gap: spacing.lg }}>
            {GAP_ITEMS.map((text, idx) => {
              return (
                <Animated.View
                  key={text}
                  style={{
                    flexDirection: "row",
                    alignItems: "flex-start",
                    gap: spacing.md,
                    paddingLeft: spacing.sm,
                    opacity: itemAnims[idx],
                    transform: [
                      {
                        translateY: itemAnims[idx].interpolate({
                          inputRange: [0, 1],
                          outputRange: [10, 0],
                        }),
                      },
                    ],
                  }}
                >
                  <View
                    style={{
                      marginTop: 8,
                      width: 8,
                      height: 8,
                      borderRadius: radius.round,
                      backgroundColor: colors.primary,
                      opacity: 0.8,
                    }}
                  />
                  <Text
                    style={{
                      flex: 1,
                      fontSize: 16,
                      lineHeight: 22,
                      fontFamily: typography.fontFamily.semibold,
                      color: colors.textPrimary,
                    }}
                  >
                    {text}
                  </Text>
                </Animated.View>
              );
            })}
          </View>

          <View style={{ flex: 1 }} />

          {/* Closing statement */}
          <Animated.View
            style={{
              alignItems: "center",
              paddingVertical: spacing.xl,
              opacity: closingAnim,
              transform: [
                {
                  translateY: closingAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [15, 0],
                  }),
                },
              ],
            }}
          >
            <View
              style={{
                width: 60,
                height: 2,
                borderRadius: radius.round,
                backgroundColor: colors.primary,
                opacity: 0.5,
                marginBottom: spacing.lg,
              }}
            />
            <Text
              style={{
                fontSize: 18,
                lineHeight: 26,
                fontFamily: typography.fontFamily.bold,
                color: colors.textPrimary,
                textAlign: "center",
                letterSpacing: -0.5,
              }}
            >
              Biking is powerful.{"\n"}But the system around it isn't.
            </Text>
          </Animated.View>

          <View style={{ height: spacing.xl }} />
        </ScrollView>

        <StickyCTA
          primaryTitle="Continue"
          onPrimary={onContinue}
          secondaryTitle="Skip"
          onSecondary={onSkip}
        />
      </View>
    </ScreenContainer>
  );
}
