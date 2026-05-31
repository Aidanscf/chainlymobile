import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, StyleSheet, Animated, Easing } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { CheckCircle2, Sparkles } from "lucide-react-native";

import ScreenContainer from "@/components/layout/ScreenContainer";
import { colors, spacing, radius, typography, shadows } from "@/theme/index";
import useOnboardingStore from "@/store/onboarding";

import OnboardingBackground from "@/components/onboarding/OnboardingBackground.jsx";

const STEPS = [
  "Calibrating your rider stats",
  "Preparing your character card",
  "Setting up bike health tracking",
  "Unlocking personalized recommendations",
];

export default function OnboardingBuildingProfileScreen() {
  const router = useRouter();

  const setProgress = useOnboardingStore((s) => s.setProgress);

  const [active, setActive] = useState(0);

  // Simple, calm spinner
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setProgress({
      currentStepIndex: 99,
      lastRoute: "/onboarding/building-profile",
    });
  }, [setProgress]);

  useEffect(() => {
    Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 1400,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();
  }, [spin]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      for (let i = 0; i < STEPS.length; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        await new Promise((r) => setTimeout(r, i === 0 ? 650 : 800));
        if (cancelled) return;
        setActive(i + 1);
      }

      await new Promise((r) => setTimeout(r, 450));
      if (cancelled) return;

      router.replace("/onboarding/reveal");
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [router]);

  const subtitle = useMemo(() => {
    return "Building your Rider Profile…";
  }, []);

  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <ScreenContainer safeTop safeBottom style={styles.container}>
      <StatusBar style="dark" />
      <OnboardingBackground variant="calm" />

      <View style={styles.inner}>
        <View style={styles.center}>
          <View style={styles.ringOuter}>
            <Animated.View
              style={[styles.ringInner, { transform: [{ rotate }] }]}
            >
              <View style={styles.dot} />
            </Animated.View>
            <View style={styles.ringIcon}>
              <Sparkles size={26} color={colors.primary} strokeWidth={2.75} />
            </View>
          </View>

          <Text style={styles.title}>{subtitle}</Text>

          <View style={{ height: spacing.xl }} />

          <View style={styles.stepList}>
            {STEPS.map((label, idx) => {
              const done = active > idx;
              const current = active === idx;
              const tone = done
                ? colors.success
                : current
                  ? colors.primary
                  : colors.textTertiary;

              return (
                <View key={label} style={styles.stepRow}>
                  <View
                    style={[
                      styles.stepDot,
                      {
                        borderColor: done ? colors.success : colors.border,
                        backgroundColor: done
                          ? colors.successSoft
                          : colors.surface,
                      },
                    ]}
                  >
                    {done ? (
                      <CheckCircle2
                        size={16}
                        color={colors.success}
                        strokeWidth={2.75}
                      />
                    ) : (
                      <View
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: radius.round,
                          backgroundColor: tone,
                        }}
                      />
                    )}
                  </View>
                  <Text
                    style={[
                      styles.stepText,
                      {
                        color: done
                          ? colors.textPrimary
                          : current
                            ? colors.textPrimary
                            : colors.textSecondary,
                      },
                    ]}
                  >
                    {label}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        <Text style={styles.tip}>
          Tip: your profile works offline. If you ever sign in later, we'll sync
          it.
        </Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.appBackground,
  },
  inner: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    justifyContent: "space-between",
  },

  center: {
    flex: 1,
    justifyContent: "center",
    paddingTop: spacing.xl,
  },

  ringOuter: {
    alignSelf: "center",
    width: 140,
    height: 140,
    borderRadius: radius.round,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.large,
  },
  ringInner: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: radius.round,
    alignItems: "center",
    justifyContent: "flex-start",
  },
  dot: {
    marginTop: 10,
    width: 10,
    height: 10,
    borderRadius: radius.round,
    backgroundColor: colors.primary,
  },
  ringIcon: {
    width: 76,
    height: 76,
    borderRadius: radius.round,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primarySoft2,
    alignItems: "center",
    justifyContent: "center",
  },

  title: {
    marginTop: spacing.xl,
    textAlign: "center",
    fontSize: 28,
    lineHeight: 32,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    letterSpacing: -0.7,
  },

  stepList: {
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  stepDot: {
    width: 32,
    height: 32,
    borderRadius: radius.round,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 18,
    fontFamily: typography.fontFamily.semibold,
  },

  tip: {
    paddingBottom: spacing.lg,
    textAlign: "center",
    fontSize: 12,
    lineHeight: 16,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textTertiary,
  },
});
