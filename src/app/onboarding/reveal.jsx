import React, { useCallback, useEffect, useMemo } from "react";
import { View, Text, StyleSheet, ScrollView, Platform } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { Sparkles, Wrench } from "lucide-react-native";

import ScreenContainer from "@/components/layout/ScreenContainer";
import AppCard from "@/components/AppCard";
import { colors, spacing, radius, typography, shadows } from "@/theme/index";
import useSettingsStore from "@/store/settings";
import useOnboardingStore from "@/store/onboarding";
import { riderCharacter as baseCharacter } from "@/data/mock";

import OnboardingBackground from "@/components/onboarding/OnboardingBackground.jsx";
import OnboardingTopBar from "@/components/onboarding/OnboardingTopBar.jsx";
import StickyCTA from "@/components/onboarding/StickyCTA.jsx";

// Removed the "Bike Health Score" / scoring preview from onboarding.

export default function OnboardingRevealScreen() {
  const router = useRouter();

  const userProfile = useSettingsStore((s) => s.settings.userProfile);
  const bikeInfo = useSettingsStore((s) => s.settings.bikeInfo);

  const setProgress = useOnboardingStore((s) => s.setProgress);

  useEffect(() => {
    setProgress({ currentStepIndex: 100, lastRoute: "/onboarding/reveal" });
  }, [setProgress]);

  const character = useMemo(() => {
    const discipline = userProfile?.primaryDiscipline || "Trail";
    const goals = Array.isArray(userProfile?.ridingGoals)
      ? userProfile.ridingGoals
      : [];

    const wantsLeagues = goals.includes("Race/Leagues");

    const subtitle = wantsLeagues
      ? `Built for ${discipline} + Leagues`
      : `Built for ${discipline} progress`;

    // Get character name based on discipline
    let characterName = "The Trail Navigator";
    if (discipline === "Trail") {
      characterName = "The Trail Navigator";
    } else if (discipline === "Enduro") {
      characterName = "The Enduro Crusher";
    } else if (discipline === "XC") {
      characterName = "The XC Racer";
    } else if (discipline === "DH/Bike Park") {
      characterName = "The Downhill Destroyer";
    } else if (discipline === "Gravel/Road") {
      characterName = "The Gravel Grinder";
    }

    return {
      ...baseCharacter,
      characterName,
      subtitle,
    };
  }, [userProfile?.primaryDiscipline, userProfile?.ridingGoals]);

  const specRows = useMemo(() => {
    const discipline = userProfile?.primaryDiscipline || "Trail";
    const terrain = Array.isArray(userProfile?.terrainPreference)
      ? userProfile.terrainPreference
      : [];

    const terrainLabel = terrain.length
      ? terrain.slice(0, 2).join(" + ")
      : "Flow";

    return [
      { label: "Bike", value: bikeInfo?.bikeType || "Mountain" },
      { label: "Discipline", value: discipline },
      { label: "Terrain", value: terrainLabel },
      { label: "Units", value: userProfile?.units || "Metric" },
    ];
  }, [
    bikeInfo?.bikeType,
    userProfile?.primaryDiscipline,
    userProfile?.terrainPreference,
    userProfile?.units,
  ]);

  const onBack = useCallback(() => {
    router.back();
  }, [router]);

  const onContinue = useCallback(async () => {
    try {
      if (Platform.OS !== "web") {
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success,
        );
      }
    } catch (e) {
      // no-op
    }
    router.push("/onboarding/social-proof");
  }, [router]);

  return (
    <ScreenContainer safeBottom style={styles.container}>
      <StatusBar style="dark" />
      <OnboardingBackground variant="warm" />

      <OnboardingTopBar title="Rider Profile" onBack={onBack} />

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
          <View style={styles.heroHeader}>
            <View style={styles.heroBadge}>
              <Sparkles size={16} color={colors.primary} strokeWidth={2.5} />
              <Text style={styles.heroBadgeText}>Personalized preview</Text>
            </View>

            <Text style={styles.title}>Your rider profile is ready.</Text>
            <Text style={styles.subtitle}>
              We've personalized your experience based on your answers.
            </Text>
          </View>

          <View style={{ height: spacing.lg }} />

          <AppCard style={styles.characterCard} pressable={false} padding={18}>
            <View style={styles.characterTop}>
              <Text style={styles.characterLabel}>Character Card</Text>
            </View>

            <View style={styles.avatarRow}>
              <View style={styles.avatarRing}>
                <Image
                  source={{ uri: character.avatar }}
                  style={styles.avatar}
                  contentFit="cover"
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.characterName}>
                  {character.characterName}
                </Text>
                <Text style={styles.characterSub}>{character.subtitle}</Text>

                <View style={{ height: spacing.md }} />

                <View style={styles.microRow}>
                  <View style={styles.microDot} />
                  <Text style={styles.microText}>Tailored to your answers</Text>
                </View>
              </View>
            </View>
          </AppCard>

          <View style={{ height: spacing.md }} />

          <AppCard style={styles.splitCard} pressable={false} padding={18}>
            <View style={styles.splitHeader}>
              <View style={styles.splitIcon}>
                <Wrench size={18} color={colors.primary} strokeWidth={2.75} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.splitTitle}>Spec Sheet (preview)</Text>
                <Text style={styles.splitSub}>
                  Full bike details come later in Garage.
                </Text>
              </View>
            </View>

            <View style={{ height: spacing.md }} />

            <View style={{ gap: 10 }}>
              {specRows.map((r) => {
                return (
                  <View key={r.label} style={styles.specRow}>
                    <Text style={styles.specLabel}>{r.label}</Text>
                    <Text style={styles.specValue}>{r.value}</Text>
                  </View>
                );
              })}
            </View>
          </AppCard>

          <View style={{ height: 160 }} />
        </ScrollView>

        <View style={styles.footerFade} />
        <StickyCTA
          primaryTitle="Continue"
          onPrimary={onContinue}
          footnote="Next up: see how you stack up in Leagues."
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: colors.appBackground },

  heroHeader: {
    paddingTop: spacing.sm,
  },
  heroBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.round,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.small,
  },
  heroBadgeText: {
    fontSize: 12,
    fontFamily: typography.fontFamily.black,
    color: colors.textSecondary,
  },

  title: {
    marginTop: spacing.lg,
    fontSize: 36,
    lineHeight: 40,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    letterSpacing: -1,
  },
  subtitle: {
    marginTop: spacing.sm,
    fontSize: 15,
    lineHeight: 20,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textSecondary,
  },

  characterCard: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceWarm,
    borderRadius: 26,
  },
  characterTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  characterLabel: {
    fontSize: 12,
    fontFamily: typography.fontFamily.black,
    color: colors.textSecondary,
    letterSpacing: 1,
    textTransform: "uppercase",
  },

  avatarRow: {
    marginTop: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
  },
  avatarRing: {
    width: 92,
    height: 92,
    borderRadius: radius.round,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.primary,
    overflow: "hidden",
  },
  avatar: { width: "100%", height: "100%" },

  characterName: {
    fontSize: 18,
    lineHeight: 20,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
  },
  characterSub: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 17,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textSecondary,
  },

  microRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  microDot: {
    width: 8,
    height: 8,
    borderRadius: radius.round,
    backgroundColor: colors.primary,
  },
  microText: {
    fontSize: 12,
    fontFamily: typography.fontFamily.black,
    color: colors.textSecondary,
  },

  splitCard: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  splitHeader: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  splitIcon: {
    width: 42,
    height: 42,
    borderRadius: radius.round,
    backgroundColor: colors.surfaceWarm,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  splitTitle: {
    fontSize: 16,
    lineHeight: 18,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
  },
  splitSub: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 16,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textSecondary,
  },

  specRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  specLabel: {
    fontSize: 12,
    fontFamily: typography.fontFamily.black,
    color: colors.textSecondary,
  },
  specValue: {
    fontSize: 12,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
  },

  footerFade: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 120,
    backgroundColor: colors.appBackground,
    opacity: 0.85,
  },
});
