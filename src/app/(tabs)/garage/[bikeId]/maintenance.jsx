import React, { useCallback, useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Alert } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ClipboardList } from "lucide-react-native";

import ScreenHeader from "@/components/layout/ScreenHeader";
import AppCard from "@/components/AppCard";
import AppButton from "@/components/AppButton";
import { colors, spacing, radius, typography } from "@/theme/index";
import { useChainlyStore } from "@/store/chainlyStore";
import { useRidesStore } from "@/store/rides";
import { computeMaintenanceQuests } from "@/utils/maintenanceQuests";

import { FEATURE_LEAGUES_MVP } from "@/utils/featureFlags";
import { useAuth } from "@/utils/auth/useAuth";
import { getLeagueUserKeyFromUser } from "@/utils/leagues/leagueState";
import { trackLeagueMaintenance } from "@/utils/leagues/track";

function Badge({ tone, text }) {
  const bg =
    tone === "urgent"
      ? colors.dangerLight
      : tone === "due"
        ? colors.warningSoft
        : colors.successSoft;

  const fg =
    tone === "urgent"
      ? colors.danger
      : tone === "due"
        ? colors.warning
        : colors.success;

  const border =
    tone === "urgent" ? "#FFD0CD" : tone === "due" ? "#FFE2B8" : "#CCF4DF";

  return (
    <View style={[styles.badge, { backgroundColor: bg, borderColor: border }]}>
      <Text style={[styles.badgeText, { color: fg }]}>{text}</Text>
    </View>
  );
}

function formatShortDate(iso) {
  if (!iso) return "";
  const d = new Date(String(iso));
  if (!Number.isFinite(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatDistanceKm(distance) {
  const n = Number(distance);
  if (!Number.isFinite(n)) return "";
  const rounded = Math.round(n * 10) / 10;
  return `${rounded} km`;
}

export default function BikeMaintenanceScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();

  const { user } = useAuth();
  const leagueUserKey = useMemo(() => getLeagueUserKeyFromUser(user), [user]);

  const [logging, setLogging] = useState(false);

  const bikeId = useMemo(() => String(params?.bikeId || ""), [params?.bikeId]);

  const bike = useChainlyStore((s) => s.getBikeById(bikeId));
  const maintenanceEvents = useChainlyStore((s) =>
    s.getMaintenanceEventsForBike(bikeId),
  );

  const rides = useRidesStore((s) => s.rides);

  const quests = useMemo(() => {
    if (!bike) {
      return { urgent: [], dueSoon: [], ok: [] };
    }
    return computeMaintenanceQuests({
      bike,
      rides,
      maintenanceEvents,
    });
  }, [bike, maintenanceEvents, rides]);

  const urgent = quests.urgent;
  const dueSoon = quests.dueSoon;
  const completed = quests.ok;

  const title = bike?.name ? `${bike.name} Maintenance` : "Bike Maintenance";

  const onBack = useCallback(() => {
    router.back();
  }, [router]);

  const onAddRideManually = useCallback(() => {
    if (!bikeId) {
      router.push("/AddManualRide");
      return;
    }

    router.push({ pathname: "/AddManualRide", params: { bikeId } });
  }, [bikeId, router]);

  const logMaintenance = useCallback(
    async (type) => {
      if (logging) return;
      if (!bikeId) return;

      try {
        setLogging(true);
        await useChainlyStore.getState().logMaintenanceAndResetBikeHealth({
          bikeId,
          type,
          performedAt: new Date().toISOString(),
        });

        // Leagues MVP (Bike Care Bonus) - minimal, defensive hook.
        // IMPORTANT: this should never crash the maintenance screen.
        if (FEATURE_LEAGUES_MVP) {
          try {
            const t = String(type || "");
            let action = null;

            if (t === "drivetrain_service") action = "drivetrain_clean_log";
            else if (t === "chain_replace") action = "chain_check";
            else if (t === "brake_pads_replace" || t === "brake_bleed")
              action = "brake_check";
            else if (
              t === "fork_lower_service" ||
              t === "shock_air_can_service" ||
              t === "suspension_full_service"
            )
              action = "suspension_service_log";

            if (action) {
              // Fire and forget.
              trackLeagueMaintenance(leagueUserKey, action, new Date()).catch(
                () => {},
              );
            }
          } catch (e) {
            // no-op
          }
        }

        Alert.alert("Logged", "Maintenance saved — Health updated");
      } catch (e) {
        console.error(e);
        Alert.alert("Couldn’t log maintenance", "Try again.");
      } finally {
        setLogging(false);
      }
    },
    [bikeId, leagueUserKey, logging],
  );

  const onLogMaintenanceMenu = useCallback(() => {
    if (!bikeId) return;

    const isTubeless = Boolean(bike?.is_tubeless ?? bike?.tubeless ?? false);

    const actions = [
      { text: "Cancel", style: "cancel" },
      {
        text: "Check tire pressure",
        onPress: () => logMaintenance("tire_pressure_check"),
        style: "default",
      },
      ...(isTubeless
        ? [
            {
              text: "Top up tire sealant",
              onPress: () => logMaintenance("tire_sealant_topup"),
              style: "default",
            },
          ]
        : []),
      {
        text: "Brake pads replaced",
        onPress: () => logMaintenance("brake_pads_replace"),
        style: "default",
      },
      {
        text: "Brake bleed",
        onPress: () => logMaintenance("brake_bleed"),
        style: "default",
      },
      {
        text: "Tire replaced (front)",
        onPress: () => logMaintenance("tire_replace_front"),
        style: "default",
      },
      {
        text: "Tire replaced (rear)",
        onPress: () => logMaintenance("tire_replace_rear"),
        style: "default",
      },
      {
        text: "Chain replaced",
        onPress: () => logMaintenance("chain_replace"),
        style: "default",
      },
      {
        text: "Drivetrain service (clean/lube)",
        onPress: () => logMaintenance("drivetrain_service"),
        style: "default",
      },
      {
        text: "Fork lower service",
        onPress: () => logMaintenance("fork_lower_service"),
        style: "default",
      },
      {
        text: "Shock air can service",
        onPress: () => logMaintenance("shock_air_can_service"),
        style: "default",
      },
      {
        text: "Full suspension service",
        onPress: () => logMaintenance("suspension_full_service"),
        style: "default",
      },
    ];

    Alert.alert(
      "Log maintenance",
      "Choose what you did. This resets the related component health to 100 (where applicable).",
      actions,
    );
  }, [bike?.is_tubeless, bike?.tubeless, bikeId, logMaintenance]);

  const hasAny = urgent.length || dueSoon.length || completed.length;
  const emptySubtitle =
    "No quests yet. Log a ride or maintenance to start tracking wear.";

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />

      <ScreenHeader title={title} showBack onBack={onBack} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: spacing.xl,
          paddingBottom: insets.bottom + 28,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.pageTitle}>Maintenance Quests</Text>
        <Text style={styles.pageSub}>
          Realistic service intervals with countdowns based on your rides.
        </Text>

        <View style={{ height: spacing.lg }} />

        <AppCard style={styles.ctaCard} pressable={false}>
          <View style={styles.ctaTop}>
            <View style={styles.ctaIcon}>
              <ClipboardList
                size={18}
                color={colors.primary}
                strokeWidth={2.5}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.ctaTitle}>Log maintenance</Text>
              <Text style={styles.ctaSub}>
                This resets the part’s health back to 100 (where applicable).
              </Text>
            </View>
          </View>

          <View style={{ height: spacing.md }} />

          <AppButton
            title={logging ? "Saving…" : "Log maintenance"}
            onPress={onLogMaintenanceMenu}
            disabled={logging}
          />

          <View style={{ height: spacing.md }} />

          <AppButton
            title="Add Ride Manually"
            onPress={onAddRideManually}
            variant="secondary"
          />
        </AppCard>

        <View style={{ height: spacing.xl }} />

        {!hasAny ? (
          <AppCard style={styles.card} pressable={false}>
            <Text style={styles.emptyTitle}>All clear (for now)</Text>
            <Text style={styles.emptySub}>{emptySubtitle}</Text>
          </AppCard>
        ) : (
          <AppCard style={styles.card} pressable={false}>
            {urgent.length ? (
              <>
                <Text style={styles.groupTitle}>Urgent</Text>
                {urgent.map((t) => {
                  const subtitle = t.subtitle;
                  return (
                    <View key={t.id} style={styles.taskRowWrap}>
                      <View style={styles.taskTextWrap}>
                        <Text style={styles.taskTitle}>{t.title}</Text>
                        {subtitle ? (
                          <Text style={styles.taskSubtitle}>{subtitle}</Text>
                        ) : null}
                        {t.note ? (
                          <Text style={styles.taskNote}>{t.note}</Text>
                        ) : null}
                      </View>
                      <Badge tone="urgent" text="Due" />
                    </View>
                  );
                })}
                <View style={styles.groupDivider} />
              </>
            ) : null}

            {dueSoon.length ? (
              <>
                <Text style={styles.groupTitle}>Due soon</Text>
                {dueSoon.map((t) => {
                  const subtitle = t.subtitle;
                  return (
                    <View key={t.id} style={styles.taskRowWrap}>
                      <View style={styles.taskTextWrap}>
                        <Text style={styles.taskTitle}>{t.title}</Text>
                        {subtitle ? (
                          <Text style={styles.taskSubtitle}>{subtitle}</Text>
                        ) : null}
                        {t.note ? (
                          <Text style={styles.taskNote}>{t.note}</Text>
                        ) : null}
                      </View>
                      <Badge tone="due" text="Soon" />
                    </View>
                  );
                })}
                <View style={styles.groupDivider} />
              </>
            ) : null}

            {completed.length ? (
              <>
                <Text style={styles.groupTitle}>On track</Text>
                {completed.map((t) => {
                  const subtitle = t.subtitle;
                  return (
                    <View key={t.id} style={styles.taskRowWrap}>
                      <View style={styles.taskTextWrap}>
                        <Text style={[styles.taskTitle, styles.taskDone]}>
                          {t.title}
                        </Text>
                        {subtitle ? (
                          <Text style={styles.taskSubtitle}>{subtitle}</Text>
                        ) : null}
                        {t.note ? (
                          <Text style={styles.taskNote}>{t.note}</Text>
                        ) : null}
                      </View>
                      <Badge tone="done" text="OK" />
                    </View>
                  );
                })}
              </>
            ) : null}
          </AppCard>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  pageTitle: {
    fontSize: 30,
    lineHeight: 32,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    letterSpacing: -0.6,
    marginTop: spacing.sm,
  },
  pageSub: {
    marginTop: 6,
    fontSize: typography.base,
    lineHeight: 20,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },

  ctaCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  ctaTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  ctaIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.round,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primarySoft2,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaTitle: {
    fontSize: 16,
    lineHeight: 18,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  ctaSub: {
    marginTop: 2,
    fontSize: 12,
    lineHeight: 14,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textSecondary,
  },

  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },

  emptyTitle: {
    fontSize: 16,
    lineHeight: 18,
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

  groupTitle: {
    fontSize: typography.sm,
    lineHeight: 16,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  groupDivider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: spacing.md,
  },

  taskRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
  },
  taskTitle: {
    flex: 1,
    paddingRight: spacing.md,
    fontSize: typography.base,
    lineHeight: 18,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textPrimary,
  },
  taskDone: {
    color: colors.textSecondary,
    fontFamily: typography.fontFamily.regular,
  },

  badge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.round,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: typography.xs,
    lineHeight: 14,
    fontFamily: typography.fontFamily.black,
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },

  // Section header styles (match other screens)
  sectionTitle: {
    fontSize: 20,
    lineHeight: 22,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    letterSpacing: -0.3,
    marginTop: 0,
  },
  sectionSub: {
    marginTop: 6,
    fontSize: typography.base,
    lineHeight: 19,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },

  rideRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
  },
  rideRowBorder: {
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  rideTitle: {
    fontSize: typography.base,
    lineHeight: 18,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  rideMeta: {
    marginTop: 3,
    fontSize: typography.sm,
    lineHeight: 16,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },

  taskRowWrap: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
  },
  taskTextWrap: {
    flex: 1,
    paddingRight: spacing.md,
  },
  taskSubtitle: {
    marginTop: 3,
    fontSize: typography.sm,
    lineHeight: 16,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textSecondary,
  },
  taskNote: {
    marginTop: 6,
    fontSize: typography.sm,
    lineHeight: 16,
    fontFamily: typography.fontFamily.regular,
    color: colors.textTertiary,
  },
});
