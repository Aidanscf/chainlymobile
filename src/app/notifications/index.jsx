import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import {
  Bell,
  Sparkles,
  ChevronRight,
  Trash2,
  Bike,
  Wrench,
  Flame,
  Users,
} from "lucide-react-native";

import ScreenHeader from "@/components/layout/ScreenHeader";
import AppCard from "@/components/AppCard";
import AppButton from "@/components/AppButton";
import { colors, spacing, radius, typography } from "@/theme/index";
import useNotificationsStore from "@/store/notifications";
import {
  cancelAllNotifications,
  configureNotificationsHandler,
  getPermissionStatus,
  scheduleMaintenanceReminder,
  scheduleRideNudge,
  scheduleStreakPing,
} from "@/utils/notifications";
import { FEATURE_TRIP_PLANNER_ENABLED } from "@/utils/featureFlags";

function iconForType(type) {
  if (type === "maintenance") return Wrench;
  if (type === "streak") return Flame;
  if (type === "friend") return Users;
  return Bike;
}

export default function NotificationsCenterScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const hydrated = useNotificationsStore((s) => s.hydrated);
  const permissionStatus = useNotificationsStore((s) => s.permissionStatus);
  const hasSeenPermissionPrompt = useNotificationsStore(
    (s) => s.hasSeenPermissionPrompt,
  );
  const prefs = useNotificationsStore((s) => s.preferences);
  const inbox = useNotificationsStore((s) => s.inbox);
  const scheduled = useNotificationsStore((s) => s.scheduled);

  const hydrate = useNotificationsStore((s) => s.hydrate);
  const setPermissionStatus = useNotificationsStore(
    (s) => s.setPermissionStatus,
  );
  const setScheduled = useNotificationsStore((s) => s.setScheduled);
  const clearInbox = useNotificationsStore((s) => s.clearInbox);

  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  const showToast = useCallback((msg) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 1600);
  }, []);

  const onBack = useCallback(async () => {
    try {
      if (Platform.OS !== "web") {
        await Haptics.selectionAsync();
      }
    } catch (e) {
      // no-op
    }
    router.back();
  }, [router]);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    (async () => {
      try {
        configureNotificationsHandler();
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

  const needsPrompt = hydrated && !hasSeenPermissionPrompt;

  const statusLabel = useMemo(() => {
    if (permissionStatus === "granted") return "Enabled";
    if (permissionStatus === "denied") return "Off";
    return "Not set";
  }, [permissionStatus]);

  const visibleScheduled = useMemo(() => {
    const list = Array.isArray(scheduled) ? scheduled : [];
    if (FEATURE_TRIP_PLANNER_ENABLED) {
      return list;
    }
    // Hide Trip Planner deep links from scheduled UI.
    return list.filter((n) => n?.deepLink !== "/ai/trip-planner");
  }, [scheduled]);

  const visibleRecent = useMemo(() => {
    const list = Array.isArray(inbox) ? inbox : [];
    const sliced = list.slice(0, 12);

    if (FEATURE_TRIP_PLANNER_ENABLED) {
      return sliced;
    }

    // Hide Trip Planner deep links from the inbox UI.
    return sliced.filter((n) => n?.deepLink !== "/ai/trip-planner");
  }, [inbox]);

  const onOpenPrefs = useCallback(async () => {
    try {
      if (Platform.OS !== "web") await Haptics.selectionAsync();
    } catch (e) {
      // no-op
    }
    router.push("/settings/notifications");
  }, [router]);

  const onEnable = useCallback(() => {
    router.push("/onboarding/notification-permission");
  }, [router]);

  const onQuickSchedule = useCallback(async () => {
    try {
      if (Platform.OS !== "web") {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (e) {
      // no-op
    }

    try {
      if (permissionStatus !== "granted") {
        showToast("Enable notifications first");
        return;
      }

      const next = [];

      if (prefs.rideNudges?.enabled && FEATURE_TRIP_PLANNER_ENABLED) {
        const id = await scheduleRideNudge({
          deepLink: "/ai/trip-planner",
          title: "Quick ride idea",
          body: "60 minutes • tech flow • perfect warm-up ride.",
          delayMin: 0.2,
        });
        next.push({
          id,
          type: "ride",
          deepLink: "/ai/trip-planner",
          scheduledAt: new Date().toISOString(),
        });
      }

      if (prefs.maintenanceAlerts?.enabled) {
        const id = await scheduleMaintenanceReminder({
          deepLink: "/garage",
          title: "Maintenance heads-up",
          body: "Chain lube due soon — 2 minutes now saves a ride later.",
          delayMin: 0.35,
        });
        next.push({
          id,
          type: "maintenance",
          deepLink: "/garage",
          scheduledAt: new Date().toISOString(),
        });
      }

      if (prefs.streakAlerts?.enabled) {
        const id = await scheduleStreakPing({
          deepLink: "/leagues/character",
          title: "Streak check",
          body: "You’re 2 days away from breaking your streak. Tiny ride counts.",
          delayMin: 0.5,
        });
        next.push({
          id,
          type: "streak",
          deepLink: "/leagues/character",
          scheduledAt: new Date().toISOString(),
        });
      }

      await setScheduled(next);
      showToast("Queued a few gentle nudges");
    } catch (e) {
      console.error(e);
      showToast("Couldn’t schedule nudges");
    }
  }, [permissionStatus, prefs, setScheduled, showToast]);

  const onCancelAll = useCallback(async () => {
    try {
      await cancelAllNotifications();
      await setScheduled([]);
      showToast("Cleared scheduled notifications");
    } catch (e) {
      console.error(e);
      showToast("Couldn’t clear scheduled notifications");
    }
  }, [setScheduled, showToast]);

  const onClearInbox = useCallback(async () => {
    await clearInbox();
    showToast("Cleared");
  }, [clearInbox, showToast]);

  if (!hydrated) return null;

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <ScreenHeader title="Notifications" showBack onBack={onBack} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: spacing.xl,
          paddingBottom: insets.bottom + 28,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.pageIntro}>
          <View style={styles.introTopRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.pageTitle}>Notifications</Text>
              <Text style={styles.pageSub}>
                Encouraging nudges. You’re in control.
              </Text>
            </View>
            <View style={styles.statusPill}>
              <View
                style={[
                  styles.dot,
                  {
                    backgroundColor:
                      permissionStatus === "granted"
                        ? colors.success
                        : colors.border,
                  },
                ]}
              />
              <Text style={styles.statusText}>{statusLabel}</Text>
            </View>
          </View>
        </View>

        {needsPrompt ? (
          <AppCard style={styles.heroCard} pressable={false}>
            <View style={styles.heroTop}>
              <View style={styles.heroIcon}>
                <Bell size={18} color={colors.primary} strokeWidth={2.75} />
              </View>
              <View style={styles.heroBadge}>
                <Sparkles size={16} color={colors.primary} strokeWidth={2.5} />
                <Text style={styles.heroBadgeText}>New</Text>
              </View>
            </View>
            <Text style={styles.heroTitle}>Want “go ride” nudges?</Text>
            <Text style={styles.heroSub}>
              Weather vibes, streak saves, maintenance heads-ups, and optional
              friend pings.
            </Text>
            <View style={{ height: spacing.md }} />
            <AppButton title="Enable Ride Reminders" onPress={onEnable} />
            <Pressable
              onPress={onOpenPrefs}
              style={styles.inlineLink}
              hitSlop={10}
            >
              <Text style={styles.inlineLinkText}>Or tune preferences</Text>
              <ChevronRight
                size={16}
                color={colors.primary}
                strokeWidth={2.75}
              />
            </Pressable>
          </AppCard>
        ) : null}

        <View style={{ height: spacing.lg }} />

        <AppCard pressable={false}>
          <Text style={styles.sectionTitle}>Quick actions</Text>
          <Text style={styles.sectionSub}>
            For testing: queue a few local nudges.
          </Text>
          <View style={{ height: spacing.md }} />
          <View style={{ gap: spacing.sm }}>
            <AppButton
              title="Schedule a few nudges"
              onPress={onQuickSchedule}
            />
            <View style={styles.twoCol}>
              <AppButton
                title="Preferences"
                variant="secondary"
                onPress={onOpenPrefs}
                style={{ flex: 1 }}
              />
              <AppButton
                title="Cancel"
                variant="secondary"
                onPress={onCancelAll}
                style={{ flex: 1 }}
              />
            </View>
          </View>
          {visibleScheduled?.length ? (
            <View style={{ marginTop: spacing.md }}>
              <Text style={styles.smallMeta}>
                {visibleScheduled.length} scheduled
              </Text>
            </View>
          ) : null}
        </AppCard>

        <View style={{ height: spacing.lg }} />

        <View style={styles.rowBetween}>
          <View>
            <Text style={styles.sectionTitle}>Recent nudges</Text>
            <Text style={styles.sectionSub}>
              Tap to jump to the right screen.
            </Text>
          </View>
          {visibleRecent.length ? (
            <Pressable
              onPress={onClearInbox}
              style={styles.clearBtn}
              hitSlop={10}
            >
              <Trash2
                size={16}
                color={colors.textSecondary}
                strokeWidth={2.5}
              />
            </Pressable>
          ) : null}
        </View>

        <View style={{ height: spacing.md }} />

        {visibleRecent.length === 0 ? (
          <AppCard pressable={false} style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No nudges yet</Text>
            <Text style={styles.emptySub}>
              Schedule a test nudge to see how it feels.
            </Text>
          </AppCard>
        ) : (
          <View style={{ gap: spacing.sm }}>
            {visibleRecent.map((n) => (
              <Pressable
                key={n.id}
                onPress={() => {
                  if (n.deepLink) router.push(n.deepLink);
                }}
              >
                <AppCard style={styles.nudgeRow} pressable={false}>
                  <View style={styles.nudgeIconWrap}>
                    {(() => {
                      const Icon = iconForType(n.type);
                      return (
                        <Icon
                          size={16}
                          color={colors.primary}
                          strokeWidth={2.75}
                        />
                      );
                    })()}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.nudgeTitle} numberOfLines={1}>
                      {n.title}
                    </Text>
                    <Text style={styles.nudgeBody} numberOfLines={2}>
                      {n.body}
                    </Text>
                  </View>
                  <ChevronRight
                    size={18}
                    color={colors.textSecondary}
                    strokeWidth={2.75}
                  />
                </AppCard>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>

      {toast ? (
        <View
          pointerEvents="none"
          style={[styles.toastWrap, { paddingBottom: insets.bottom + 18 }]}
        >
          <View style={styles.toastCard}>
            <Text style={styles.toastText}>{toast}</Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  pageIntro: {
    marginBottom: spacing.lg,
  },
  introTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  pageTitle: {
    fontSize: 30,
    lineHeight: 32,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    letterSpacing: -0.6,
  },
  pageSub: {
    marginTop: 6,
    fontSize: typography.base,
    lineHeight: 20,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },

  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.round,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dot: { width: 10, height: 10, borderRadius: radius.round },
  statusText: {
    fontSize: typography.sm,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
  },

  heroCard: { backgroundColor: colors.surfaceWarm, borderColor: colors.border },
  heroTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  heroIcon: {
    width: 42,
    height: 42,
    borderRadius: radius.round,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primarySoft2,
    alignItems: "center",
    justifyContent: "center",
  },
  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.round,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  heroBadgeText: {
    fontSize: typography.sm,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
  },
  heroTitle: {
    marginTop: spacing.lg,
    fontSize: 22,
    lineHeight: 24,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
  },
  heroSub: {
    marginTop: 8,
    fontSize: typography.base,
    lineHeight: 20,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },

  inlineLink: {
    marginTop: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "center",
    paddingVertical: 8,
  },
  inlineLinkText: {
    fontSize: typography.sm,
    fontFamily: typography.fontFamily.black,
    color: colors.primary,
  },

  sectionTitle: {
    fontSize: 20,
    lineHeight: 22,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
  },
  sectionSub: {
    marginTop: 6,
    fontSize: typography.base,
    lineHeight: 20,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },

  twoCol: { flexDirection: "row", gap: spacing.md },
  smallMeta: {
    fontSize: 12,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textSecondary,
  },

  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  clearBtn: { paddingTop: 6, paddingLeft: 10, paddingBottom: 8 },

  emptyCard: { backgroundColor: colors.surface, borderColor: colors.border },
  emptyTitle: {
    fontSize: 18,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
  },
  emptySub: {
    marginTop: 6,
    fontSize: typography.base,
    lineHeight: 20,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },

  nudgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surfaceWarm,
    borderColor: colors.border,
  },
  nudgeIconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.round,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primarySoft2,
    alignItems: "center",
    justifyContent: "center",
  },
  nudgeTitle: {
    fontSize: 14,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
  },
  nudgeBody: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 16,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },

  toastWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
  },
  toastCard: {
    backgroundColor: colors.textPrimary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    maxWidth: 320,
  },
  toastText: {
    color: "white",
    fontSize: 12,
    fontFamily: typography.fontFamily.bold,
  },
});
