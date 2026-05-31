import React, { useCallback, useMemo, useState } from "react";
import { View, Text, StyleSheet, Platform, Pressable } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { BellRing, Sparkles } from "lucide-react-native";

import ScreenHeader from "@/components/layout/ScreenHeader";
import AppCard from "@/components/AppCard";
import AppButton from "@/components/AppButton";
import { colors, spacing, radius, typography, shadows } from "@/theme/index";
import useNotificationsStore from "@/store/notifications";
import {
  configureNotificationsHandler,
  getPermissionStatus,
  requestNotificationPermissions,
} from "@/utils/notifications";

export default function NotificationPermissionScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const hydrated = useNotificationsStore((s) => s.hydrated);
  const permissionStatus = useNotificationsStore((s) => s.permissionStatus);
  const setPermissionStatus = useNotificationsStore(
    (s) => s.setPermissionStatus,
  );
  const setHasSeenPermissionPrompt = useNotificationsStore(
    (s) => s.setHasSeenPermissionPrompt,
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const statusLabel = useMemo(() => {
    if (permissionStatus === "granted") return "Enabled";
    if (permissionStatus === "denied") return "Off";
    return "Not set";
  }, [permissionStatus]);

  const onBack = useCallback(() => {
    router.back();
  }, [router]);

  const onNotNow = useCallback(async () => {
    try {
      if (Platform.OS !== "web") {
        await Haptics.selectionAsync();
      }
    } catch (e) {
      // no-op
    }
    await setHasSeenPermissionPrompt(true);
    router.replace("/(tabs)");
  }, [router, setHasSeenPermissionPrompt]);

  const onEnable = useCallback(async () => {
    setError(null);
    setLoading(true);

    try {
      configureNotificationsHandler();

      const existing = await getPermissionStatus();
      if (existing === "granted") {
        await setPermissionStatus("granted");
        await setHasSeenPermissionPrompt(true);
        router.replace("/notifications");
        return;
      }

      const status = await requestNotificationPermissions();
      await setPermissionStatus(status);
      await setHasSeenPermissionPrompt(true);

      try {
        await Haptics.notificationAsync(
          status === "granted"
            ? Haptics.NotificationFeedbackType.Success
            : Haptics.NotificationFeedbackType.Warning,
        );
      } catch (e) {
        // no-op
      }

      router.replace("/notifications");
    } catch (e) {
      console.error(e);
      setError("Couldn’t request notifications. Try again in a moment.");
    } finally {
      setLoading(false);
    }
  }, [router, setHasSeenPermissionPrompt, setPermissionStatus]);

  if (!hydrated) {
    return null;
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <ScreenHeader title="Ride Reminders" showBack onBack={onBack} />

      <View style={{ padding: spacing.xl, flex: 1 }}>
        <AppCard style={styles.heroCard} pressable={false}>
          <View style={styles.heroIconWrap}>
            <View style={styles.heroIcon}>
              <BellRing size={22} color={colors.primary} strokeWidth={2.75} />
            </View>
            <View style={styles.heroBadge}>
              <Sparkles size={16} color={colors.primary} strokeWidth={2.5} />
              <Text style={styles.heroBadgeText}>Go Ride nudges</Text>
            </View>
          </View>

          <Text style={styles.title}>
            Want a nudge when it’s a great day to ride?
          </Text>
          <Text style={styles.subtitle}>
            We’ll keep it friendly — like a riding buddy who knows your vibe.
          </Text>

          <View style={{ height: spacing.lg }} />

          <View style={{ gap: spacing.sm }}>
            <Bullet text="Ride reminders that fit your schedule" />
            <Bullet text="Maintenance heads-ups before things break" />
            <Bullet text="Friends can nudge you to ride" />
          </View>

          <View style={{ height: spacing.xl }} />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <AppButton
            title={loading ? "Enabling…" : "Enable Ride Reminders"}
            loading={loading}
            onPress={onEnable}
          />

          <Pressable
            onPress={onNotNow}
            style={styles.secondaryLink}
            hitSlop={10}
          >
            <Text style={styles.secondaryLinkText}>Not now</Text>
            <Text style={styles.secondaryMeta}>Current: {statusLabel}</Text>
          </Pressable>
        </AppCard>
      </View>
    </View>
  );
}

function Bullet({ text }) {
  return (
    <View style={styles.bulletRow}>
      <View style={styles.bulletDot} />
      <Text style={styles.bulletText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  heroCard: {
    backgroundColor: colors.surfaceWarm,
    borderColor: colors.border,
    borderRadius: 24,
    ...shadows.small,
  },
  heroIconWrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  heroIcon: {
    width: 48,
    height: 48,
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

  title: {
    marginTop: spacing.xl,
    fontSize: 26,
    lineHeight: 28,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    letterSpacing: -0.6,
  },
  subtitle: {
    marginTop: 10,
    fontSize: typography.base,
    lineHeight: 20,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },

  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  bulletDot: {
    marginTop: 8,
    width: 8,
    height: 8,
    borderRadius: radius.round,
    backgroundColor: colors.primary,
  },
  bulletText: {
    flex: 1,
    fontSize: typography.base,
    lineHeight: 20,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textPrimary,
  },

  errorText: {
    marginBottom: spacing.md,
    fontSize: typography.sm,
    fontFamily: typography.fontFamily.semibold,
    color: colors.danger,
  },

  secondaryLink: {
    marginTop: spacing.md,
    alignItems: "center",
    paddingVertical: 10,
  },
  secondaryLinkText: {
    fontSize: typography.sm,
    fontFamily: typography.fontFamily.black,
    color: colors.textSecondary,
  },
  secondaryMeta: {
    marginTop: 4,
    fontSize: 11,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textTertiary,
  },
});
