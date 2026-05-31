import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Platform, Pressable } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import {
  Sparkles,
  Flame,
  Trophy,
  CalendarDays,
  Activity,
  Dumbbell,
  Wrench,
  Map,
  Mountain,
  Bike,
  AlertTriangle,
  Wallet,
  Coins,
  Crown,
  Ruler,
  MoveHorizontal,
  Layers,
  Route,
  Target,
  Zap,
} from "lucide-react-native";

import ScreenContainer from "@/components/layout/ScreenContainer";
import { colors, spacing, typography } from "@/theme/index";
import useSettingsStore from "@/store/settings";
import useOnboardingStore from "@/store/onboarding";

import OnboardingBackground from "@/components/onboarding/OnboardingBackground.jsx";
import OnboardingTopBar from "@/components/onboarding/OnboardingTopBar.jsx";
import OptionCard from "@/components/onboarding/OptionCard.jsx";
import StickyCTA from "@/components/onboarding/StickyCTA.jsx";

const GOAL_OPTIONS = [
  "Get fitter",
  "Ride more",
  "Improve skills",
  "Send bigger jumps",
  "Climb stronger",
  "Race/Leagues",
  "Trips & destinations",
  "Bike maintenance confidence",
];

const TERRAIN_OPTIONS = ["Tech", "Flow", "Jumps", "Steeps", "Climbs"];

function getOptionIcon(stepKey, option) {
  // Skill
  if (stepKey === "skillLevel") {
    if (option === "Beginner") return Sparkles;
    if (option === "Intermediate") return Flame;
    return Trophy;
  }

  // Frequency
  if (stepKey === "ridingFrequency") {
    if (option === "1x/week") return CalendarDays;
    if (option === "2-3x/week") return CalendarDays;
    if (option === "4-6x/week") return Activity;
    return Flame;
  }

  // Goals
  if (stepKey === "ridingGoals") {
    if (option === "Get fitter") return Dumbbell;
    if (option === "Ride more") return CalendarDays;
    if (option === "Improve skills") return Target;
    if (option === "Send bigger jumps") return Zap;
    if (option === "Climb stronger") return Mountain;
    if (option === "Race/Leagues") return Trophy;
    if (option === "Trips & destinations") return Map;
    return Wrench;
  }

  // Discipline
  if (stepKey === "primaryDiscipline") {
    if (option === "Trail") return Bike;
    if (option === "Enduro") return Flame;
    if (option === "XC") return Dumbbell;
    if (option === "DH/Bike Park") return Trophy;
    return Route;
  }

  // Terrain
  if (stepKey === "terrainPreference") {
    if (option === "Tech") return Wrench;
    if (option === "Flow") return Sparkles;
    if (option === "Jumps") return Zap;
    if (option === "Steeps") return Trophy;
    return Mountain;
  }

  // Maintenance
  if (stepKey === "maintenanceMindset") {
    if (option === "I baby it") return Sparkles;
    if (option === "I’m decent") return Wrench;
    if (option === "I ride it hard") return Flame;
    return AlertTriangle;
  }

  // Spend
  if (stepKey === "yearlySpendRange") {
    if (option === "$0–250") return Wallet;
    if (option === "$250–750") return Coins;
    if (option === "$750–1500") return Coins;
    if (option === "$1500–3000") return Trophy;
    return Crown;
  }

  // Units
  if (stepKey === "units") {
    if (option === "Metric") return Ruler;
    return MoveHorizontal;
  }

  // Has bike
  if (stepKey === "hasBike") {
    if (option === "Yes") return Bike;
    return Map;
  }

  // Bike type
  if (stepKey === "bikeType") {
    if (option === "Mountain") return Mountain;
    if (option === "Gravel/Road") return Route;
    return Layers;
  }

  return Sparkles;
}

export default function OnboardingQuestionsScreen() {
  const router = useRouter();

  const hydrated = useSettingsStore((s) => s.hydrated);
  const hydrateSettings = useSettingsStore((s) => s.hydrate);
  const update = useSettingsStore((s) => s.update);

  const userProfile = useSettingsStore((s) => s.settings.userProfile);
  const bikeInfo = useSettingsStore((s) => s.settings.bikeInfo);

  const setProgress = useOnboardingStore((s) => s.setProgress);

  const steps = useMemo(() => {
    return [
      {
        key: "skillLevel",
        title: "What's your skill level?",
        subtitle:
          "You can choose multiple options to help customize chainly to your preferences.",
        kind: "single",
        options: ["Beginner", "Intermediate", "Advanced"],
        get: () => userProfile?.skillLevel,
        set: (v) => update("userProfile.skillLevel", v),
      },
      {
        key: "ridingFrequency",
        title: "How often do you ride?",
        subtitle:
          "You can choose multiple options to help customize chainly to your preferences.",
        kind: "single",
        options: ["1x/week", "2-3x/week", "4-6x/week", "Daily"],
        get: () => userProfile?.ridingFrequency,
        set: (v) => update("userProfile.ridingFrequency", v),
      },
      {
        key: "ridingGoals",
        title: "What are your goals?",
        subtitle:
          "You can choose multiple options to help customize chainly to your preferences.",
        kind: "multi",
        options: GOAL_OPTIONS,
        get: () => userProfile?.ridingGoals || [],
        toggle: async (opt) => {
          const current = Array.isArray(userProfile?.ridingGoals)
            ? userProfile.ridingGoals
            : [];
          const has = current.includes(opt);
          const next = has
            ? current.filter((x) => x !== opt)
            : [...current, opt];
          await update("userProfile.ridingGoals", next);
        },
      },
      {
        key: "primaryDiscipline",
        title: "Primary discipline",
        subtitle: "So we can tailor trips, gear, and coaching.",
        kind: "single",
        options: ["Trail", "Enduro", "XC", "DH/Bike Park", "Gravel/Road"],
        get: () => userProfile?.primaryDiscipline,
        set: (v) => update("userProfile.primaryDiscipline", v),
      },
      {
        key: "terrainPreference",
        title: "Terrain you love",
        subtitle: "Pick what makes you smile.",
        kind: "multi",
        options: TERRAIN_OPTIONS,
        get: () => userProfile?.terrainPreference || [],
        toggle: async (opt) => {
          const current = Array.isArray(userProfile?.terrainPreference)
            ? userProfile.terrainPreference
            : [];
          const has = current.includes(opt);
          const next = has
            ? current.filter((x) => x !== opt)
            : [...current, opt];
          await update("userProfile.terrainPreference", next);
        },
      },
      {
        key: "maintenanceMindset",
        title: "How do you treat your bike?",
        subtitle: "Honesty makes the mechanic smarter.",
        kind: "single",
        options: [
          "I baby it",
          "I’m decent",
          "I ride it hard",
          "What maintenance?",
        ],
        get: () => userProfile?.maintenanceMindset,
        set: (v) => update("userProfile.maintenanceMindset", v),
      },
      {
        key: "yearlySpendRange",
        title: "Yearly spend on biking",
        subtitle: "We’ll match recommendations to your budget.",
        kind: "single",
        options: ["$0–250", "$250–750", "$750–1500", "$1500–3000", "$3000+"],
        get: () => userProfile?.yearlySpendRange,
        set: (v) => update("userProfile.yearlySpendRange", v),
      },
      {
        key: "units",
        title: "Units",
        subtitle: "Keep your rides and setups consistent.",
        kind: "single",
        options: ["Metric", "Imperial"],
        get: () => userProfile?.units,
        set: (v) => update("userProfile.units", v),
      },
      {
        key: "hasBike",
        title: "Do you have a bike yet?",
        subtitle: "",
        kind: "single",
        options: ["Yes", "Not yet"],
        get: () => (bikeInfo?.hasBike ? "Yes" : "Not yet"),
        set: (v) => update("bikeInfo.hasBike", v === "Yes"),
      },
      {
        key: "bikeType",
        title: "What do you ride?",
        subtitle: "This helps the Gear Recommender.",
        kind: "single",
        options: ["Mountain", "Gravel/Road", "Multiple"],
        get: () => bikeInfo?.bikeType,
        set: (v) => update("bikeInfo.bikeType", v),
      },
    ];
  }, [bikeInfo?.bikeType, bikeInfo?.hasBike, update, userProfile]);

  const stepCount = steps.length;
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    if (!hydrated) {
      hydrateSettings();
    }
  }, [hydrateSettings, hydrated]);

  useEffect(() => {
    setProgress({
      currentStepIndex: stepIndex + 1,
      lastRoute: "/onboarding/questions",
    });
  }, [setProgress, stepIndex]);

  const step = steps[stepIndex];

  const value = useMemo(() => {
    if (!step) return null;
    if (step.kind === "multi") {
      return step.get?.() || [];
    }
    return step.get?.() ?? null;
  }, [step]);

  const canContinue = useMemo(() => {
    if (!step) return false;
    if (step.kind === "multi") {
      const list = Array.isArray(value) ? value : [];
      return list.length > 0;
    }
    return !!value;
  }, [step, value]);

  const onBack = useCallback(async () => {
    if (stepIndex === 0) {
      router.back();
      return;
    }

    try {
      if (Platform.OS !== "web") await Haptics.selectionAsync();
    } catch (e) {
      // no-op
    }

    setStepIndex((x) => Math.max(0, x - 1));
  }, [router, stepIndex]);

  const onNext = useCallback(async () => {
    if (!canContinue) {
      return;
    }

    try {
      if (Platform.OS !== "web") await Haptics.selectionAsync();
    } catch (e) {
      // no-op
    }

    if (stepIndex >= stepCount - 1) {
      await setProgress({
        currentStepIndex: stepCount + 1,
        lastRoute: "/onboarding/building-profile",
      });
      router.replace("/onboarding/building-profile");
      return;
    }

    setStepIndex((x) => Math.min(stepCount - 1, x + 1));
  }, [canContinue, router, setProgress, stepCount, stepIndex]);

  const onSkip = useCallback(async () => {
    try {
      if (Platform.OS !== "web") await Haptics.selectionAsync();
    } catch (e) {
      // no-op
    }

    if (stepIndex >= stepCount - 1) {
      await setProgress({
        currentStepIndex: stepCount + 1,
        lastRoute: "/onboarding/building-profile",
      });
      router.replace("/onboarding/building-profile");
      return;
    }

    setStepIndex((x) => Math.min(stepCount - 1, x + 1));
  }, [router, setProgress, stepCount, stepIndex]);

  const onSelectSingle = useCallback(
    async (opt) => {
      try {
        if (Platform.OS !== "web") await Haptics.selectionAsync();
      } catch (e) {
        // no-op
      }

      await step.set(opt);
    },
    [step],
  );

  const onToggleMulti = useCallback(
    async (opt) => {
      try {
        if (Platform.OS !== "web") await Haptics.selectionAsync();
      } catch (e) {
        // no-op
      }

      await step.toggle(opt);
    },
    [step],
  );

  const ctaLabel = useMemo(() => {
    if (stepIndex === stepCount - 1) {
      return "Build my profile";
    }
    return "Continue";
  }, [stepCount, stepIndex]);

  const helperHint = useMemo(() => {
    if (!step) return null;
    if (canContinue) return null;
    if (step.kind === "multi") return "Pick at least one.";
    return "Pick one to continue.";
  }, [canContinue, step]);

  const gridMode = useMemo(() => {
    if (!step) return false;
    return (
      step.key === "ridingGoals" ||
      step.key === "terrainPreference" ||
      step.key === "primaryDiscipline" ||
      step.key === "bikeType" ||
      step.key === "skillLevel"
    );
  }, [step]);

  if (!hydrated || !step) {
    return null;
  }

  const selectedSet = step.kind === "multi" ? new Set(value || []) : null;

  return (
    <ScreenContainer safeBottom style={styles.container}>
      <StatusBar style="dark" />
      <OnboardingBackground variant="warm" />

      <OnboardingTopBar
        title="Onboarding"
        stepIndex={stepIndex}
        stepCount={stepCount}
        onBack={onBack}
        rightSlot={
          <Pressable onPress={onSkip} hitSlop={10}>
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
        }
      />

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
          <Text style={styles.question}>{step.title}</Text>
          <Text style={styles.sub}>{step.subtitle}</Text>

          <View style={{ height: spacing.xl }} />

          {gridMode ? (
            <View style={styles.grid}>
              {step.options.map((opt) => {
                const selected =
                  step.kind === "multi" ? selectedSet.has(opt) : value === opt;

                const Icon = getOptionIcon(step.key, opt);
                return (
                  <View key={opt} style={styles.gridItem}>
                    <OptionCard
                      icon={Icon}
                      title={opt}
                      selected={selected}
                      layout="tile"
                      onPress={() => {
                        if (step.kind === "multi") {
                          onToggleMulti(opt);
                          return;
                        }
                        onSelectSingle(opt);
                      }}
                    />
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={{ gap: spacing.md }}>
              {step.options.map((opt) => {
                const selected = value === opt;
                const Icon = getOptionIcon(step.key, opt);
                return (
                  <OptionCard
                    key={opt}
                    icon={Icon}
                    title={opt}
                    selected={selected}
                    onPress={() => onSelectSingle(opt)}
                  />
                );
              })}
            </View>
          )}

          <View style={{ height: spacing.xl }} />

          <View style={{ height: 110 }} />
        </ScrollView>

        <View style={styles.footerShadow} />
        <StickyCTA
          primaryTitle={ctaLabel}
          onPrimary={onNext}
          primaryDisabled={!canContinue}
          secondaryTitle={stepIndex === 0 ? null : "Back"}
          onSecondary={stepIndex === 0 ? null : onBack}
          footnote={helperHint}
          compact
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: colors.appBackground },

  question: {
    fontSize: 34,
    lineHeight: 38,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    letterSpacing: -0.9,
  },
  sub: {
    marginTop: spacing.sm,
    fontSize: 15,
    lineHeight: 20,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textSecondary,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  gridItem: {
    width: "48%",
  },

  footerShadow: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 88,
    backgroundColor: colors.appBackground,
    opacity: 0.85,
  },
  skipText: {
    fontSize: 12,
    fontFamily: typography.fontFamily.black,
    color: colors.primary,
  },
});
