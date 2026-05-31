import React, { useCallback, useEffect, useRef } from "react";
import { View, Text, Animated, Platform, ScrollView } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { Sparkles } from "lucide-react-native";

import ScreenContainer from "@/components/layout/ScreenContainer";
import { colors, spacing, radius, typography } from "@/theme/index";
import useOnboardingStore from "@/store/onboarding";
import OnboardingBackground from "@/components/onboarding/OnboardingBackground.jsx";
import StickyCTA from "@/components/onboarding/StickyCTA.jsx";

const CHAINLY_LOGO_URL =
  "https://ucarecdn.com/2dad7912-5620-4993-b434-106566c17ea2/-/format/auto/";

const SOLUTION_ITEMS = [
  "AI diagnostics for your bike",
  "Smart maintenance tracking",
  "Personalized riding insights",
  "Suspension setup guidance",
  "Performance tracking & goals",
  "Competitive leagues & friends",
];

export default function OnboardingSolutionScreen() {
  const router = useRouter();
  const setProgress = useOnboardingStore((s) => s.setProgress);

  // Fade animations
  const logoAnim = useRef(new Animated.Value(0)).current;
  const headerAnim = useRef(new Animated.Value(0)).current;
  const itemAnims = useRef(
    SOLUTION_ITEMS.map(() => new Animated.Value(0)),
  ).current;

  useEffect(() => {
    setProgress({
      currentStepIndex: 0.9,
      lastRoute: "/onboarding/solution",
    });

    // Logo fade + scale
    Animated.spring(logoAnim, {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();

    // Header appears after logo
    setTimeout(() => {
      Animated.timing(headerAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }, 300);

    // Stagger solution items
    setTimeout(() => {
      Animated.stagger(
        80,
        itemAnims.map((anim) =>
          Animated.timing(anim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
        ),
      ).start();
    }, 700);
  }, [setProgress, logoAnim, headerAnim, itemAnims]);

  const onContinue = useCallback(async () => {
    try {
      if (Platform.OS !== "web") await Haptics.selectionAsync();
    } catch (e) {
      // no-op
    }

    await setProgress({
      currentStepIndex: 1,
      lastRoute: "/onboarding/questions",
    });

    router.push("/onboarding/questions");
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
          {/* Logo */}
          <Animated.View
            style={{
              alignSelf: "center",
              marginTop: spacing.xl,
              opacity: logoAnim,
              transform: [
                {
                  scale: logoAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 1],
                  }),
                },
              ],
            }}
          >
            <View
              style={{
                width: 100,
                height: 100,
                borderRadius: radius.round,
                backgroundColor: colors.primarySoft,
                borderWidth: 3,
                borderColor: colors.primary,
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
              }}
            >
              <Image
                source={{ uri: CHAINLY_LOGO_URL }}
                style={{ width: 70, height: 70 }}
                contentFit="contain"
              />
            </View>
          </Animated.View>

          <View style={{ height: spacing.xl }} />

          {/* Header */}
          <Animated.View
            style={{
              opacity: headerAnim,
              transform: [
                {
                  translateY: headerAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                },
              ],
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                marginBottom: spacing.md,
              }}
            >
              <Sparkles size={20} color={colors.primary} strokeWidth={2.5} />
              <Text
                style={{
                  fontSize: 13,
                  fontFamily: typography.fontFamily.black,
                  color: colors.primary,
                  letterSpacing: 1,
                  textTransform: "uppercase",
                }}
              >
                Introducing
              </Text>
            </View>

            <Text
              style={{
                fontSize: 42,
                lineHeight: 48,
                fontFamily: typography.fontFamily.black,
                color: colors.textPrimary,
                letterSpacing: -1.5,
                textAlign: "center",
              }}
            >
              Chainly
            </Text>
            <Text
              style={{
                fontSize: 17,
                lineHeight: 24,
                fontFamily: typography.fontFamily.semibold,
                color: colors.textSecondary,
                textAlign: "center",
                marginTop: spacing.sm,
              }}
            >
              One app. All the tools you need.
            </Text>
          </Animated.View>

          <View style={{ height: spacing.xxl }} />

          {/* Solution bullets */}
          <View style={{ gap: spacing.lg }}>
            {SOLUTION_ITEMS.map((text, idx) => {
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
        </ScrollView>

        <StickyCTA
          primaryTitle="Let's Get Started"
          onPrimary={onContinue}
          secondaryTitle="Skip"
          onSecondary={onSkip}
        />
      </View>
    </ScreenContainer>
  );
}
