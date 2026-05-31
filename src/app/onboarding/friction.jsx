import React, { useCallback, useEffect, useRef } from "react";
import { View, Text, Animated, Platform, ScrollView } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import {
  AlertCircle,
  TrendingDown,
  Wrench,
  Settings,
  Users,
} from "lucide-react-native";

import ScreenContainer from "@/components/layout/ScreenContainer";
import { colors, spacing, radius, typography } from "@/theme/index";
import useOnboardingStore from "@/store/onboarding";
import OnboardingBackground from "@/components/onboarding/OnboardingBackground.jsx";
import StickyCTA from "@/components/onboarding/StickyCTA.jsx";

const PROBLEM_ITEMS = [
  {
    icon: AlertCircle,
    text: "What's actually wrong with their bike",
  },
  {
    icon: Wrench,
    text: "When parts need maintenance",
  },
  {
    icon: Settings,
    text: "How to set up suspension correctly",
  },
  {
    icon: TrendingDown,
    text: "If their technique is improving",
  },
  {
    icon: Users,
    text: "How they compare to other riders",
  },
];

const CONSEQUENCE_ITEMS = [
  "Waste money on unnecessary upgrades",
  "Ride with poor setups",
  "Progress slower than they should",
  "Miss small issues before they become expensive",
  "Feel disconnected from a real riding community",
];

export default function OnboardingFrictionScreen() {
  const router = useRouter();
  const setProgress = useOnboardingStore((s) => s.setProgress);

  // Fade animations for each bullet
  const problemAnims = useRef(
    PROBLEM_ITEMS.map(() => new Animated.Value(0)),
  ).current;
  const consequenceAnims = useRef(
    CONSEQUENCE_ITEMS.map(() => new Animated.Value(0)),
  ).current;

  useEffect(() => {
    setProgress({
      currentStepIndex: 0.5,
      lastRoute: "/onboarding/friction",
    });

    // Stagger fade-in for problem items
    Animated.stagger(
      120,
      problemAnims.map((anim) =>
        Animated.timing(anim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ),
    ).start();

    // Delay consequence items slightly
    setTimeout(() => {
      Animated.stagger(
        100,
        consequenceAnims.map((anim) =>
          Animated.timing(anim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
        ),
      ).start();
    }, 800);
  }, [setProgress, problemAnims, consequenceAnims]);

  const onContinue = useCallback(async () => {
    try {
      if (Platform.OS !== "web") await Haptics.selectionAsync();
    } catch (e) {
      // no-op
    }

    await setProgress({
      currentStepIndex: 0.75,
      lastRoute: "/onboarding/gap",
    });

    router.push("/onboarding/gap");
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
              Most riders are guessing.
            </Text>
            <Text
              style={{
                fontSize: 17,
                lineHeight: 24,
                fontFamily: typography.fontFamily.semibold,
                color: colors.textSecondary,
              }}
            >
              When it comes to their bike and their progress.
            </Text>
          </View>

          <View style={{ height: spacing.xl }} />

          {/* Problem bullets */}
          <View style={{ gap: spacing.lg }}>
            {PROBLEM_ITEMS.map((item, idx) => {
              const IconComponent = item.icon;
              return (
                <Animated.View
                  key={item.text}
                  style={{
                    flexDirection: "row",
                    alignItems: "flex-start",
                    gap: spacing.md,
                    opacity: problemAnims[idx],
                    transform: [
                      {
                        translateY: problemAnims[idx].interpolate({
                          inputRange: [0, 1],
                          outputRange: [10, 0],
                        }),
                      },
                    ],
                  }}
                >
                  <View style={{ marginTop: 2 }}>
                    <IconComponent
                      size={20}
                      color={colors.primary}
                      strokeWidth={2.5}
                    />
                  </View>
                  <Text
                    style={{
                      flex: 1,
                      fontSize: 16,
                      lineHeight: 22,
                      fontFamily: typography.fontFamily.semibold,
                      color: colors.textPrimary,
                    }}
                  >
                    {item.text}
                  </Text>
                </Animated.View>
              );
            })}
          </View>

          <View style={{ height: spacing.xxl }} />

          {/* Consequence section */}
          <View>
            <Text
              style={{
                fontSize: 15,
                lineHeight: 20,
                fontFamily: typography.fontFamily.bold,
                color: colors.textSecondary,
              }}
            >
              So they:
            </Text>

            <View style={{ height: spacing.md }} />

            <View style={{ gap: spacing.md }}>
              {CONSEQUENCE_ITEMS.map((text, idx) => {
                return (
                  <Animated.View
                    key={text}
                    style={{
                      flexDirection: "row",
                      alignItems: "flex-start",
                      gap: spacing.sm,
                      paddingLeft: spacing.sm,
                      opacity: consequenceAnims[idx],
                      transform: [
                        {
                          translateY: consequenceAnims[idx].interpolate({
                            inputRange: [0, 1],
                            outputRange: [8, 0],
                          }),
                        },
                      ],
                    }}
                  >
                    <View
                      style={{
                        marginTop: 8,
                        width: 6,
                        height: 6,
                        borderRadius: radius.round,
                        backgroundColor: colors.textTertiary,
                      }}
                    />
                    <Text
                      style={{
                        flex: 1,
                        fontSize: 14,
                        lineHeight: 20,
                        fontFamily: typography.fontFamily.semibold,
                        color: colors.textSecondary,
                      }}
                    >
                      {text}
                    </Text>
                  </Animated.View>
                );
              })}
            </View>
          </View>
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
