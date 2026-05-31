import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  Alert,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import {
  Crown,
  Sparkles,
  Wrench,
  Map,
  Dumbbell,
  ShieldCheck,
  Check,
} from "lucide-react-native";

import ScreenContainer from "@/components/layout/ScreenContainer";
import AppCard from "@/components/AppCard";
import { colors, spacing, radius, typography, shadows } from "@/theme/index";
import useSettingsStore from "@/store/settings";
import useOnboardingStore from "@/store/onboarding";
import { FEATURE_TRIP_PLANNER_ENABLED } from "@/utils/featureFlags";

import OnboardingBackground from "@/components/onboarding/OnboardingBackground.jsx";
import OnboardingTopBar from "@/components/onboarding/OnboardingTopBar.jsx";
import StickyCTA from "@/components/onboarding/StickyCTA.jsx";

function BenefitCard({ icon: Icon, title, sub }) {
  return (
    <AppCard style={styles.benefitCard} pressable={false} padding={16}>
      <View style={styles.benefitRow}>
        <View style={styles.benefitIcon}>
          <Icon size={18} color={colors.primary} strokeWidth={2.75} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.benefitTitle}>{title}</Text>
          <Text style={styles.benefitSub}>{sub}</Text>
        </View>
        <View style={styles.benefitCheck}>
          <Check size={18} color={colors.primary} strokeWidth={3} />
        </View>
      </View>
    </AppCard>
  );
}

export default function OnboardingPaywallScreen() {
  const router = useRouter();

  const update = useSettingsStore((s) => s.update);
  const userProfile = useSettingsStore((s) => s.settings.userProfile);

  const setProgress = useOnboardingStore((s) => s.setProgress);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setProgress({ currentStepIndex: 103, lastRoute: "/onboarding/paywall" });
  }, [setProgress]);

  const valueBullets = useMemo(() => {
    const goals = Array.isArray(userProfile?.ridingGoals)
      ? userProfile.ridingGoals
      : [];
    const terrain = Array.isArray(userProfile?.terrainPreference)
      ? userProfile.terrainPreference
      : [];

    const list = [];

    const wantsSkills =
      goals.includes("Improve skills") || goals.includes("Send bigger jumps");
    const wantsTrips = goals.includes("Trips & destinations");
    const wantsMaintenance =
      goals.includes("Bike maintenance confidence") ||
      userProfile?.maintenanceMindset === "What maintenance?";

    if (wantsSkills) {
      list.push({
        icon: Dumbbell,
        title: "Analyzer Coach",
        sub: "Personalized drills + progress cues",
      });
    }

    if (wantsMaintenance) {
      list.push({
        icon: Wrench,
        title: "AI Mechanic",
        sub: "Maintenance tracking that actually makes sense",
      });
    }

    if (wantsTrips || terrain.length) {
      if (FEATURE_TRIP_PLANNER_ENABLED) {
        list.push({
          icon: Map,
          title: "Trip Planner",
          sub: "Destinations tuned to your terrain + discipline",
        });
      }
    }

    list.push({
      icon: ShieldCheck,
      title: "Smarter gear picks",
      sub: "Compatibility-first recommendations",
    });

    return list.slice(0, 4);
  }, [
    userProfile?.maintenanceMindset,
    userProfile?.ridingGoals,
    userProfile?.terrainPreference,
  ]);

  const onBack = useCallback(() => {
    router.back();
  }, [router]);

  const onNotNow = useCallback(async () => {
    try {
      if (Platform.OS !== "web") await Haptics.selectionAsync();
    } catch (e) {
      // no-op
    }
    router.push("/onboarding/notifications");
  }, [router]);

  const onRestore = useCallback(async () => {
    try {
      if (Platform.OS !== "web") await Haptics.selectionAsync();
    } catch (e) {
      // no-op
    }
    Alert.alert("Restore purchases", "Paywall is stubbed in this build.");
  }, []);

  const onUnlock = useCallback(async () => {
    setLoading(true);
    try {
      if (Platform.OS !== "web") {
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success,
        );
      }
    } catch (e) {
      // no-op
    }

    try {
      // Stub: mark pro as unlocked locally.
      await update("onboarding.proUnlocked", true);
      await new Promise((r) => setTimeout(r, 350));
      router.push("/onboarding/notifications");
    } catch (e) {
      console.error(e);
      Alert.alert("Couldn’t unlock", "Try again in a moment.");
    } finally {
      setLoading(false);
    }
  }, [router, update]);

  return (
    <ScreenContainer safeBottom style={styles.container}>
      <StatusBar style="dark" />
      <OnboardingBackground variant="warm" />

      <OnboardingTopBar title="Chainly Pro" onBack={onBack} />

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
          <View style={styles.hero}>
            <View style={styles.heroBadge}>
              <Sparkles size={16} color={colors.primary} strokeWidth={2.5} />
              <Text style={styles.heroBadgeText}>Founder pricing</Text>
            </View>

            <View style={{ height: spacing.md }} />

            <View style={styles.heroIcon}>
              <Crown size={24} color={colors.primary} strokeWidth={2.75} />
            </View>

            <Text style={styles.title}>Unlock Chainly Pro</Text>
            <Text style={styles.subtitle}>
              Personalized perks based on your answers. You can keep using free
              mode anytime.
            </Text>
          </View>

          <View style={{ height: spacing.xl }} />

          <View style={{ gap: spacing.md }}>
            {valueBullets.map((b) => (
              <BenefitCard
                key={b.title}
                icon={b.icon}
                title={b.title}
                sub={b.sub}
              />
            ))}
          </View>

          <View style={{ height: spacing.xl }} />

          <AppCard style={styles.priceCard} pressable={false} padding={16}>
            <Text style={styles.priceBig}>$59 / year</Text>
            <Text style={styles.priceSmall}>Best value • Founder pricing</Text>
          </AppCard>

          <View style={{ height: spacing.md }} />

          <AppCard style={styles.priceCardAlt} pressable={false} padding={16}>
            <Text style={styles.priceBigAlt}>$9.99 / month</Text>
            <Text style={styles.priceSmallAlt}>Cancel anytime</Text>
          </AppCard>

          <View style={{ height: spacing.lg }} />

          <Pressable onPress={onRestore} hitSlop={10} style={styles.restoreRow}>
            <Text style={styles.restoreText}>Restore purchases</Text>
          </Pressable>

          <View style={{ height: 160 }} />
        </ScrollView>

        <View style={styles.footerFade} />
        <StickyCTA
          primaryTitle={loading ? "Unlocking…" : "Unlock Pro"}
          onPrimary={onUnlock}
          primaryLoading={loading}
          secondaryTitle="Not now"
          onSecondary={onNotNow}
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: colors.appBackground },

  hero: {
    paddingTop: spacing.sm,
    alignItems: "center",
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
  heroIcon: {
    width: 84,
    height: 84,
    borderRadius: radius.round,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primarySoft2,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.medium,
  },

  title: {
    marginTop: spacing.lg,
    fontSize: 34,
    lineHeight: 38,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    letterSpacing: -0.9,
    textAlign: "center",
  },
  subtitle: {
    marginTop: spacing.sm,
    fontSize: 15,
    lineHeight: 20,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textSecondary,
    textAlign: "center",
  },

  benefitCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  benefitRow: {
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  benefitIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.round,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primarySoft2,
    alignItems: "center",
    justifyContent: "center",
  },
  benefitTitle: {
    fontSize: 15,
    lineHeight: 17,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
  },
  benefitSub: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 16,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textSecondary,
  },
  benefitCheck: {
    width: 34,
    height: 34,
    borderRadius: radius.round,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primarySoft2,
    alignItems: "center",
    justifyContent: "center",
  },

  priceCard: {
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: "center",
  },
  priceBig: {
    fontSize: 20,
    fontFamily: typography.fontFamily.black,
    color: colors.primary,
  },
  priceSmall: {
    marginTop: 6,
    fontSize: 12,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textSecondary,
  },

  priceCardAlt: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
  },
  priceBigAlt: {
    fontSize: 18,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
  },
  priceSmallAlt: {
    marginTop: 6,
    fontSize: 12,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textSecondary,
  },

  restoreRow: {
    alignItems: "center",
    paddingVertical: 10,
  },
  restoreText: {
    fontSize: 13,
    fontFamily: typography.fontFamily.black,
    color: colors.textSecondary,
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
