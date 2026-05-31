import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  Pressable,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import {
  Bell,
  Wrench,
  Flame,
  Users,
  ChevronRight,
  Moon,
} from "lucide-react-native";

import ScreenHeader from "@/components/layout/ScreenHeader";
import AppCard from "@/components/AppCard";
import AppButton from "@/components/AppButton";
import { colors, spacing, radius, typography } from "@/theme/index";
import useNotificationsStore from "@/store/notifications";
import { getPermissionStatus } from "@/utils/notifications";

function Seg({ label, selected, onPress }) {
  const bg = selected ? colors.primarySoft : colors.surface;
  const bd = selected ? colors.primarySoft2 : colors.border;
  const tx = selected ? colors.primary : colors.textSecondary;
  return (
    <Pressable
      onPress={onPress}
      style={[styles.seg, { backgroundColor: bg, borderColor: bd }]}
      hitSlop={10}
    >
      <Text style={[styles.segText, { color: tx }]}>{label}</Text>
    </Pressable>
  );
}

export default function NotificationPreferencesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const hydrated = useNotificationsStore((s) => s.hydrated);
  const prefs = useNotificationsStore((s) => s.preferences);
  const permissionStatus = useNotificationsStore((s) => s.permissionStatus);

  const hydrate = useNotificationsStore((s) => s.hydrate);
  const setPreferences = useNotificationsStore((s) => s.setPreferences);
  const setPermissionStatus = useNotificationsStore(
    (s) => s.setPermissionStatus,
  );

  const [local, setLocal] = useState(prefs);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    setLocal(prefs);
  }, [prefs]);

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

  const onBack = useCallback(() => {
    router.back();
  }, [router]);

  const apply = useCallback(
    async (next) => {
      setLocal(next);
      await setPreferences(next);
    },
    [setPreferences],
  );

  const setRideEnabled = useCallback(
    (enabled) => {
      const next = {
        ...local,
        rideNudges: { ...local.rideNudges, enabled },
      };
      apply(next);
    },
    [apply, local],
  );

  const rideEnabled = !!local?.rideNudges?.enabled;

  const onSetFrequency = useCallback(
    (freq) => {
      const next = {
        ...local,
        rideNudges: { ...local.rideNudges, frequency: freq },
      };
      apply(next);
    },
    [apply, local],
  );

  const onSetTime = useCallback(
    (t) => {
      const next = {
        ...local,
        rideNudges: { ...local.rideNudges, preferredTime: t },
      };
      apply(next);
    },
    [apply, local],
  );

  const onToggle = useCallback(
    (key, enabled) => {
      const next = { ...local, [key]: { ...local[key], enabled } };
      apply(next);
    },
    [apply, local],
  );

  const dndEnabled = !!local?.doNotDisturb?.enabled;

  const onToggleDnd = useCallback(
    (enabled) => {
      const next = {
        ...local,
        doNotDisturb: {
          ...(local.doNotDisturb || {}),
          enabled: !!enabled,
        },
      };
      apply(next);
    },
    [apply, local],
  );

  const onDndPreset = useCallback(
    (preset) => {
      const nextRange =
        preset === "late"
          ? { start: "22:00", end: "06:30" }
          : preset === "early"
            ? { start: "20:30", end: "06:30" }
            : { start: "21:00", end: "07:00" };

      const next = {
        ...local,
        doNotDisturb: {
          ...(local.doNotDisturb || {}),
          enabled: true,
          start: nextRange.start,
          end: nextRange.end,
        },
      };
      apply(next);
    },
    [apply, local],
  );

  const dndSummary = useMemo(() => {
    const start = local?.doNotDisturb?.start || "21:00";
    const end = local?.doNotDisturb?.end || "07:00";
    return `${start}–${end}`;
  }, [local?.doNotDisturb?.start, local?.doNotDisturb?.end]);

  const permissionHint = useMemo(() => {
    if (permissionStatus === "granted") return "Enabled";
    if (permissionStatus === "denied")
      return "Off (you can turn it on in system settings)";
    return "Not set";
  }, [permissionStatus]);

  const onRequest = useCallback(async () => {
    try {
      if (Platform.OS !== "web") await Haptics.selectionAsync();
    } catch (e) {
      // no-op
    }
    router.push("/onboarding/notification-permission");
  }, [router]);

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
        <Text style={styles.title}>Your nudges</Text>
        <Text style={styles.subtitle}>
          Supportive. Not spammy. Always optional.
        </Text>

        <View style={{ height: spacing.lg }} />

        <AppCard style={styles.permissionCard} pressable={false}>
          <View style={styles.permissionTop}>
            <View style={styles.permissionIcon}>
              <Bell size={18} color={colors.primary} strokeWidth={2.75} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>System permission</Text>
              <Text style={styles.cardSub}>{permissionHint}</Text>
            </View>
            <ChevronRight
              size={18}
              color={colors.textSecondary}
              strokeWidth={2.75}
            />
          </View>
          <View style={{ height: spacing.md }} />
          <AppButton title="Enable / Update permission" onPress={onRequest} />
        </AppCard>

        <View style={{ height: spacing.lg }} />

        <PrefCard
          icon={Bell}
          title="Go ride reminders"
          sub="We’ll nudge you when it’s a good time — based on your vibe."
          value={rideEnabled}
          onValueChange={setRideEnabled}
        />

        {rideEnabled ? (
          <AppCard style={styles.subCard} pressable={false}>
            <Text style={styles.subTitle}>Frequency</Text>
            <View style={styles.segRow}>
              <Seg
                label="Few"
                selected={local.rideNudges.frequency === "few"}
                onPress={() => onSetFrequency("few")}
              />
              <Seg
                label="Normal"
                selected={local.rideNudges.frequency === "normal"}
                onPress={() => onSetFrequency("normal")}
              />
              <Seg
                label="Often"
                selected={local.rideNudges.frequency === "often"}
                onPress={() => onSetFrequency("often")}
              />
            </View>

            <View style={{ height: spacing.md }} />

            <Text style={styles.subTitle}>Preferred time</Text>
            <View style={styles.segRow}>
              <Seg
                label="Morning"
                selected={local.rideNudges.preferredTime === "Morning"}
                onPress={() => onSetTime("Morning")}
              />
              <Seg
                label="Afternoon"
                selected={local.rideNudges.preferredTime === "Afternoon"}
                onPress={() => onSetTime("Afternoon")}
              />
              <Seg
                label="Evening"
                selected={local.rideNudges.preferredTime === "Evening"}
                onPress={() => onSetTime("Evening")}
              />
            </View>

            <Text style={styles.subHint}>
              We’ll keep it light — you can always dial this back.
            </Text>
          </AppCard>
        ) : null}

        <View style={{ height: spacing.md }} />

        <PrefCard
          icon={Wrench}
          title="Bike maintenance reminders"
          sub="We’ll remind you before issues become problems."
          value={!!local.maintenanceAlerts.enabled}
          onValueChange={(v) => onToggle("maintenanceAlerts", v)}
        />

        <View style={{ height: spacing.md }} />

        <PrefCard
          icon={Flame}
          title="Streaks & progress"
          sub="Celebrate wins. Save streaks. Keep it fun."
          value={!!local.streakAlerts.enabled}
          onValueChange={(v) => onToggle("streakAlerts", v)}
        />

        <View style={{ height: spacing.md }} />

        <PrefCard
          icon={Users}
          title="Friend ride nudges"
          sub="Friends can invite you to ride (you can turn this off anytime)."
          value={!!local.friendNudges.enabled}
          onValueChange={(v) => onToggle("friendNudges", v)}
        />

        <View style={{ height: spacing.md }} />

        {/* Do Not Disturb */}
        <AppCard style={styles.prefCard} pressable={false}>
          <View style={styles.prefTop}>
            <View style={styles.prefIcon}>
              <Moon size={18} color={colors.primary} strokeWidth={2.75} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Do Not Disturb</Text>
              <Text style={styles.cardSub}>
                Quiet hours so nudges land at the right time.
              </Text>
            </View>
            <Switch value={dndEnabled} onValueChange={onToggleDnd} />
          </View>

          {dndEnabled ? (
            <View style={{ paddingTop: spacing.md }}>
              <Text style={styles.dndRange}>{dndSummary}</Text>
              <Text style={styles.dndHint}>
                Quick presets for now. Time picker can come next.
              </Text>

              <View style={{ height: spacing.sm }} />

              <View style={styles.segRow}>
                <Seg
                  label="Standard"
                  selected={dndSummary === "21:00–07:00"}
                  onPress={() => onDndPreset("standard")}
                />
                <Seg
                  label="Late"
                  selected={dndSummary === "22:00–06:30"}
                  onPress={() => onDndPreset("late")}
                />
                <Seg
                  label="Early"
                  selected={dndSummary === "20:30–06:30"}
                  onPress={() => onDndPreset("early")}
                />
              </View>
            </View>
          ) : null}
        </AppCard>

        <View style={{ height: spacing.xxxl }} />
      </ScrollView>
    </View>
  );
}

function PrefCard({ icon: Icon, title, sub, value, onValueChange }) {
  return (
    <AppCard style={styles.prefCard} pressable={false}>
      <View style={styles.prefTop}>
        <View style={styles.prefIcon}>
          <Icon size={18} color={colors.primary} strokeWidth={2.75} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={styles.cardSub}>{sub}</Text>
        </View>
        <Switch value={value} onValueChange={onValueChange} />
      </View>
    </AppCard>
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

  permissionCard: {
    backgroundColor: colors.surfaceWarm,
    borderColor: colors.border,
  },
  permissionTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  permissionIcon: {
    width: 42,
    height: 42,
    borderRadius: radius.round,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primarySoft2,
    alignItems: "center",
    justifyContent: "center",
  },

  prefCard: { backgroundColor: colors.surface, borderColor: colors.border },
  prefTop: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  prefIcon: {
    width: 42,
    height: 42,
    borderRadius: radius.round,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primarySoft2,
    alignItems: "center",
    justifyContent: "center",
  },

  cardTitle: {
    fontSize: 16,
    lineHeight: 18,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
  },
  cardSub: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 16,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },

  subCard: { backgroundColor: colors.surfaceWarm, borderColor: colors.border },
  subTitle: {
    fontSize: 14,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
  },
  subHint: {
    marginTop: spacing.md,
    fontSize: 12,
    lineHeight: 16,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },

  segRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm },
  seg: {
    flex: 1,
    borderWidth: 1,
    paddingVertical: 10,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  segText: {
    fontSize: 12,
    fontFamily: typography.fontFamily.black,
  },

  dndRange: {
    fontSize: 14,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
  },
  dndHint: {
    marginTop: 6,
    fontSize: 12,
    lineHeight: 16,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
});
