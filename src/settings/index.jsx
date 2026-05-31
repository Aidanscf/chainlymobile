import React, { useCallback } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";

import ScreenHeader from "@/components/layout/ScreenHeader";
import { colors, spacing, typography } from "@/theme/index";
import { useSettingsData } from "./hooks/useSettingsData";
import { useSyncData } from "./hooks/useSyncData";
import { useSettingsActions } from "./hooks/useSettingsActions";
import { AccountSection } from "./sections/AccountSection.jsx";
import SyncSection from "@/SyncSection";
import { RidingSection } from "./sections/RidingSection.jsx";
import { AISection } from "./sections/AISection.jsx";
import { NotificationsSection } from "./sections/NotificationsSection.jsx";
import { SocialSection } from "./sections/SocialSection.jsx";
import { DataSection } from "./sections/DataSection.jsx";
import { AppearanceSection } from "./sections/AppearanceSection.jsx";
import { SafetySection } from "./sections/SafetySection.jsx";
import { SupportSection } from "./sections/SupportSection.jsx";
import { AdvancedSection } from "./sections/AdvancedSection.jsx";

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const {
    hydrated,
    settings,
    update,
    toggleDeveloper,
    resetAll,
    profileSubtitle,
    planLabel,
    notificationSummary,
    notificationCenterSummary,
    showDeveloper,
  } = useSettingsData();

  const { syncing, syncError, syncSummary, pendingSummary } = useSyncData();

  const {
    onHaptic,
    onSyncNow,
    onManageSubscription,
    onRestorePurchases,
    onLogout,
    onConfirmReset,
    onVersionTap,
  } = useSettingsActions({ update, resetAll, toggleDeveloper, router });

  const onBack = useCallback(() => {
    router.back();
  }, [router]);

  if (!hydrated) return null;

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <ScreenHeader title="Settings" showBack onBack={onBack} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: spacing.xl,
          paddingBottom: insets.bottom + 28,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Your control center</Text>
        <Text style={styles.subtitle}>
          Set it once. Ride with more confidence.
        </Text>

        <View style={{ height: spacing.lg }} />

        <AccountSection
          settings={settings}
          profileSubtitle={profileSubtitle}
          planLabel={planLabel}
          onHaptic={onHaptic}
          onManageSubscription={onManageSubscription}
          onRestorePurchases={onRestorePurchases}
          onLogout={onLogout}
        />

        <View style={{ height: spacing.xl }} />

        <SyncSection
          syncing={syncing}
          syncError={syncError}
          syncSummary={syncSummary}
          pendingSummary={pendingSummary}
          onSyncNow={onSyncNow}
        />

        <View style={{ height: spacing.xl }} />

        <RidingSection
          settings={settings}
          update={update}
          onHaptic={onHaptic}
        />

        <View style={{ height: spacing.xl }} />

        <AISection settings={settings} update={update} onHaptic={onHaptic} />

        <View style={{ height: spacing.xl }} />

        <NotificationsSection
          notificationCenterSummary={notificationCenterSummary}
          notificationSummary={notificationSummary}
        />

        <View style={{ height: spacing.xl }} />

        <SocialSection
          settings={settings}
          update={update}
          onHaptic={onHaptic}
        />

        <View style={{ height: spacing.xl }} />

        <DataSection settings={settings} update={update} onHaptic={onHaptic} />

        <View style={{ height: spacing.xl }} />

        <AppearanceSection
          settings={settings}
          update={update}
          onHaptic={onHaptic}
        />

        <View style={{ height: spacing.xl }} />

        <SafetySection onHaptic={onHaptic} />

        <View style={{ height: spacing.xl }} />

        <SupportSection onHaptic={onHaptic} onVersionTap={onVersionTap} />

        {showDeveloper ? (
          <>
            <View style={{ height: spacing.xl }} />
            <AdvancedSection
              onHaptic={onHaptic}
              onConfirmReset={onConfirmReset}
            />
          </>
        ) : null}

        <View style={{ height: spacing.xxxl }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  title: {
    fontSize: 30,
    lineHeight: 32,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    letterSpacing: -0.6,
  },
  subtitle: {
    marginTop: 6,
    fontSize: typography.base,
    lineHeight: 20,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
});
