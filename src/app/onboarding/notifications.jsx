import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
  Platform,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import {
  Bell,
  Wrench,
  Flame,
  Users,
  Sparkles,
  Clock,
} from "lucide-react-native";

import ScreenContainer from "@/components/layout/ScreenContainer";
import AppCard from "@/components/AppCard";
import { colors, spacing, radius, typography, shadows } from "@/theme/index";
import useSettingsStore from "@/store/settings";
import useNotificationsStore from "@/store/notifications";
import useOnboardingStore from "@/store/onboarding";
import {
  configureNotificationsHandler,
  getPermissionStatus,
  requestNotificationPermissions,
} from "@/utils/notifications";

import OnboardingBackground from "@/components/onboarding/OnboardingBackground.jsx";
import OnboardingTopBar from "@/components/onboarding/OnboardingTopBar.jsx";
import StickyCTA from "@/components/onboarding/StickyCTA.jsx";

function TimePill({ label, selected, onPress }) {
  const bg = selected ? colors.primary : colors.surface;
  const bd = selected ? colors.primary : colors.border;
  const tx = selected ? "#FFFFFF" : colors.textSecondary;

  return (
    <Pressable
      onPress={onPress}
      style={[styles.timePill, { backgroundColor: bg, borderColor: bd }]}
      hitSlop={10}
    >
      <Text style={[styles.timePillText, { color: tx }]}>{label}</Text>
    </Pressable>
  );
}

function PrefRow({ icon: Icon, title, sub, value, onValueChange }) {
  return (
    <AppCard style={styles.prefCard} pressable={false} padding={16}>
      <View style={styles.prefRow}>
        <View style={styles.prefIcon}>
          <Icon size={20} color={colors.primary} strokeWidth={2.75} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.prefTitle}>{title}</Text>
          <Text style={styles.prefSub}>{sub}</Text>
        </View>
        <Switch value={value} onValueChange={onValueChange} />
      </View>
    </AppCard>
  );
}

export default function OnboardingNotificationsScreen() {
  const router = useRouter();

  const update = useSettingsStore((s) => s.update);
  const prefs = useSettingsStore((s) => s.settings.notificationPrefs);

  const hydratedNotif = useNotificationsStore((s) => s.hydrated);
  const hydrateNotif = useNotificationsStore((s) => s.hydrate);
  const permissionStatus = useNotificationsStore((s) => s.permissionStatus);
  const setPermissionStatus = useNotificationsStore(
    (s) => s.setPermissionStatus,
  );
  const setHasSeenPermissionPrompt = useNotificationsStore(
    (s) => s.setHasSeenPermissionPrompt,
  );
  const setPreferences = useNotificationsStore((s) => s.setPreferences);

  const setProgress = useOnboardingStore((s) => s.setProgress);

  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    hydrateNotif();
  }, [hydrateNotif]);

  useEffect(() => {
    setProgress({
      currentStepIndex: 104,
      lastRoute: "/onboarding/notifications",
    });
  }, [setProgress]);

  useEffect(() => {
    (async () => {
      try {
        const status = await getPermissionStatus();
        if (status && status !== permissionStatus) {
          await setPermissionStatus(status);
        }
      } catch (e) {
        console.error(e);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const local = useMemo(() => {
    return {
      rideNudgesEnabled: !!prefs?.rideNudgesEnabled,
      maintenanceRemindersEnabled: !!prefs?.maintenanceRemindersEnabled,
      streakAlertsEnabled: !!prefs?.streakAlertsEnabled,
      friendNudgesEnabled: !!prefs?.friendNudgesEnabled,
      preferredTime: prefs?.preferredTime || "Evening",
    };
  }, [prefs]);

  const applyAndMirror = useCallback(
    async (partial) => {
      const next = { ...local, ...partial };

      // 1) canonical profile pref store
      await update("notificationPrefs", next);

      // 2) existing notifications store (so /settings/notifications is pre-populated)
      const mapped = {
        rideNudges: {
          enabled: !!next.rideNudgesEnabled,
          frequency: "normal",
          preferredTime: next.preferredTime,
        },
        maintenanceAlerts: { enabled: !!next.maintenanceRemindersEnabled },
        streakAlerts: { enabled: !!next.streakAlertsEnabled },
        friendNudges: { enabled: !!next.friendNudgesEnabled },
        doNotDisturb: {
          enabled: false,
          start: "21:00",
          end: "07:00",
        },
      };

      try {
        await setPreferences(mapped);
      } catch (e) {
        console.error(e);
      }

      return next;
    },
    [local, setPreferences, update],
  );

  const onBack = useCallback(() => {
    router.back();
  }, [router]);

  const onNotNow = useCallback(async () => {
    try {
      if (Platform.OS !== "web") await Haptics.selectionAsync();
    } catch (e) {
      // no-op
    }

    await setHasSeenPermissionPrompt(true);
    router.push("/onboarding/activate-ai");
  }, [router, setHasSeenPermissionPrompt]);

  const onEnable = useCallback(async () => {
    setRequesting(true);

    try {
      if (Platform.OS !== "web") {
        await Haptics.selectionAsync();
      }
    } catch (e) {
      // no-op
    }

    try {
      configureNotificationsHandler();

      const existing = await getPermissionStatus();
      if (existing === "granted") {
        await setPermissionStatus("granted");
        await setHasSeenPermissionPrompt(true);
        router.push("/onboarding/activate-ai");
        return;
      }

      const status = await requestNotificationPermissions();
      await setPermissionStatus(status);
      await setHasSeenPermissionPrompt(true);

      try {
        if (Platform.OS !== "web") {
          await Haptics.notificationAsync(
            status === "granted"
              ? Haptics.NotificationFeedbackType.Success
              : Haptics.NotificationFeedbackType.Warning,
          );
        }
      } catch (e) {
        // no-op
      }

      router.push("/onboarding/activate-ai");
    } catch (e) {
      console.error(e);
      router.push("/onboarding/activate-ai");
    } finally {
      setRequesting(false);
    }
  }, [router, setHasSeenPermissionPrompt, setPermissionStatus]);

  const permissionHint = useMemo(() => {
    if (permissionStatus === "granted") return "Enabled";
    if (permissionStatus === "denied") return "Denied";
    return "Not set";
  }, [permissionStatus]);

  if (!hydratedNotif) {
    return null;
  }

  return (
    <ScreenContainer safeBottom style={styles.container}>
      <StatusBar style="dark" />
      <OnboardingBackground variant="warm" />

      <OnboardingTopBar title="Notifications" onBack={onBack} />

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
              <Text style={styles.heroBadgeText}>Value-first</Text>
            </View>

            <Text style={styles.title}>Want helpful nudges?</Text>
            <Text style={styles.subtitle}>
              Pick what you want — we’ll save it either way. System permission
              comes only after you tap Enable.
            </Text>
          </View>

          <View style={{ height: spacing.lg }} />

          <AppCard style={styles.permissionCard} pressable={false} padding={16}>
            <View style={styles.permissionRow}>
              <View style={styles.permissionIcon}>
                <Sparkles size={18} color={colors.primary} strokeWidth={2.75} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.permissionTitle}>System permission</Text>
                <Text style={styles.permissionSub}>
                  Current: {permissionHint}
                </Text>
              </View>
            </View>
          </AppCard>

          <View style={{ height: spacing.md }} />

          <PrefRow
            icon={Bell}
            title="Ride nudges"
            sub="A gentle push when it’s a good time to ride."
            value={local.rideNudgesEnabled}
            onValueChange={(v) => applyAndMirror({ rideNudgesEnabled: !!v })}
          />

          <View style={{ height: spacing.md }} />

          <PrefRow
            icon={Wrench}
            title="Maintenance reminders"
            sub="Heads-ups before small issues become big ones."
            value={local.maintenanceRemindersEnabled}
            onValueChange={(v) =>
              applyAndMirror({ maintenanceRemindersEnabled: !!v })
            }
          />

          <View style={{ height: spacing.md }} />

          <PrefRow
            icon={Flame}
            title="Streak alerts"
            sub="Celebrate wins. Keep it fun."
            value={local.streakAlertsEnabled}
            onValueChange={(v) => applyAndMirror({ streakAlertsEnabled: !!v })}
          />

          <View style={{ height: spacing.md }} />

          <PrefRow
            icon={Users}
            title="Friend nudges"
            sub="Friends can invite you to ride."
            value={local.friendNudgesEnabled}
            onValueChange={(v) => applyAndMirror({ friendNudgesEnabled: !!v })}
          />

          <View style={{ height: spacing.lg }} />

          <AppCard style={styles.timeCard} pressable={false} padding={16}>
            <View style={styles.timeHeader}>
              <View style={styles.timeIcon}>
                <Clock size={18} color={colors.primary} strokeWidth={2.75} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.timeTitle}>Preferred time</Text>
                <Text style={styles.timeSub}>When should nudges land?</Text>
              </View>
            </View>

            <View style={{ height: spacing.md }} />

            <View style={styles.timeRow}>
              <TimePill
                label="Morning"
                selected={local.preferredTime === "Morning"}
                onPress={() => applyAndMirror({ preferredTime: "Morning" })}
              />
              <TimePill
                label="Afternoon"
                selected={local.preferredTime === "Afternoon"}
                onPress={() => applyAndMirror({ preferredTime: "Afternoon" })}
              />
              <TimePill
                label="Evening"
                selected={local.preferredTime === "Evening"}
                onPress={() => applyAndMirror({ preferredTime: "Evening" })}
              />
            </View>
          </AppCard>

          <View style={{ height: 170 }} />
        </ScrollView>

        <View style={styles.footerFade} />
        <StickyCTA
          primaryTitle={requesting ? "Enabling…" : "Enable notifications"}
          onPrimary={onEnable}
          primaryLoading={requesting}
          secondaryTitle="Not now"
          onSecondary={onNotNow}
          footnote="Even if you say no, your preferences stay saved."
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: colors.appBackground },

  hero: {
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
    fontSize: 34,
    lineHeight: 38,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    letterSpacing: -0.9,
  },
  subtitle: {
    marginTop: spacing.sm,
    fontSize: 15,
    lineHeight: 20,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textSecondary,
  },

  permissionCard: {
    backgroundColor: colors.surfaceWarm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  permissionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  permissionIcon: {
    width: 46,
    height: 46,
    borderRadius: radius.round,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primarySoft2,
    alignItems: "center",
    justifyContent: "center",
  },
  permissionTitle: {
    fontSize: 15,
    lineHeight: 17,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
  },
  permissionSub: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 16,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textSecondary,
  },

  prefCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  prefRow: {
    minHeight: 70,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  prefIcon: {
    width: 46,
    height: 46,
    borderRadius: radius.round,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primarySoft2,
    alignItems: "center",
    justifyContent: "center",
  },
  prefTitle: {
    fontSize: 16,
    lineHeight: 18,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
  },
  prefSub: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 16,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textSecondary,
  },

  timeCard: {
    backgroundColor: colors.surfaceWarm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  timeHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  timeIcon: {
    width: 42,
    height: 42,
    borderRadius: radius.round,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primarySoft2,
    alignItems: "center",
    justifyContent: "center",
  },
  timeTitle: {
    fontSize: 14,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
  },
  timeSub: {
    marginTop: 4,
    fontSize: 12,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textSecondary,
  },
  timeRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  timePill: {
    flex: 1,
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  timePillText: {
    fontSize: 13,
    fontFamily: typography.fontFamily.black,
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
