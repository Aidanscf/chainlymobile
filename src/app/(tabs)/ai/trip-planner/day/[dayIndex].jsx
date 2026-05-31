import React, { useCallback, useMemo } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { ArrowUp, ArrowDown } from "lucide-react-native";

import { colors, spacing, typography, radius } from "@/theme/index";
import AppCard from "@/components/AppCard";
import AppButton from "@/components/AppButton";
import { useTripsStore } from "@/store/trips";
import ScreenHeader from "@/components/layout/ScreenHeader";
import { FEATURE_TRIP_PLANNER_ENABLED } from "@/utils/featureFlags";

function typeLabel(type) {
  if (type === "ride") return "Ride";
  if (type === "lunch") return "Lunch";
  if (type === "shop") return "Shop";
  if (type === "recovery") return "Recovery";
  return "";
}

export default function AITripItineraryDayScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();

  const plan = useTripsStore((s) => s.currentPlan);
  const moveEntry = useTripsStore((s) => s.moveEntry);

  const dayIndex = useMemo(() => {
    const raw = params?.dayIndex;
    const n = Number(Array.isArray(raw) ? raw[0] : raw);
    if (Number.isFinite(n)) {
      return n;
    }
    return 0;
  }, [params?.dayIndex]);

  const day = useMemo(() => {
    const days = Array.isArray(plan?.itineraryDays) ? plan.itineraryDays : [];
    return days[dayIndex] || null;
  }, [dayIndex, plan?.itineraryDays]);

  const onBack = useCallback(() => {
    router.back();
  }, [router]);

  const onMove = useCallback(
    async ({ idx, direction }) => {
      try {
        await Haptics.selectionAsync();
      } catch (e) {
        // no-op
      }
      moveEntry({ dayIndex, entryIndex: idx, direction });
    },
    [dayIndex, moveEntry],
  );

  if (!FEATURE_TRIP_PLANNER_ENABLED) {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" />
        <ScreenHeader
          title="Trip Planner"
          showBack
          onBack={() => router.replace("/ai")}
        />

        <View
          style={{ padding: spacing.xl, paddingBottom: insets.bottom + 24 }}
        >
          <AppCard
            pressable={false}
            style={{
              backgroundColor: colors.surfaceWarm,
              borderColor: colors.border,
            }}
          >
            <Text style={styles.emptyTitle}>
              Trip Planner coming back soon.
            </Text>
            <Text style={styles.emptySub}>
              We’re polishing a new version. Check back soon.
            </Text>
            <View style={{ height: spacing.lg }} />
            <AppButton
              title="Back to AI Hub"
              onPress={() => router.replace("/ai")}
            />
          </AppCard>
        </View>
      </View>
    );
  }

  if (!plan || !day) {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" />
        <ScreenHeader title="Itinerary" showBack onBack={onBack} />

        <View style={{ padding: spacing.xl }}>
          <AppCard
            style={{
              backgroundColor: colors.surfaceWarm,
              borderColor: colors.border,
            }}
          >
            <Text style={styles.emptyTitle}>Day not found</Text>
            <Text style={styles.emptySub}>Go back to your trip plan.</Text>
          </AppCard>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <ScreenHeader title="Itinerary" showBack onBack={onBack} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: spacing.xl,
          paddingBottom: insets.bottom + 24,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Itinerary</Text>
        <Text style={styles.subtitle}>{day.title}</Text>

        <Text style={styles.sectionLabel}>DAY TIMELINE</Text>
        <View style={{ gap: spacing.md, marginTop: spacing.md }}>
          {(day.entries || []).map((e, idx) => (
            <AppCard key={e.id} padding={spacing.lg} style={styles.entryCard}>
              <View style={styles.entryTopRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.entryTime}>{e.time}</Text>
                  <Text style={styles.entryTitle}>{e.title}</Text>
                  <Text
                    style={styles.entryMeta}
                  >{`${typeLabel(e.type)} • ${e.duration}`}</Text>
                </View>

                <View style={styles.moveCol}>
                  <Pressable
                    onPress={() => onMove({ idx, direction: "up" })}
                    hitSlop={8}
                    style={styles.moveBtn}
                  >
                    <ArrowUp
                      size={16}
                      color={colors.textSecondary}
                      strokeWidth={2.75}
                    />
                  </Pressable>
                  <Pressable
                    onPress={() => onMove({ idx, direction: "down" })}
                    hitSlop={8}
                    style={styles.moveBtn}
                  >
                    <ArrowDown
                      size={16}
                      color={colors.textSecondary}
                      strokeWidth={2.75}
                    />
                  </Pressable>
                </View>
              </View>

              <Text style={styles.entryTips}>{e.tips}</Text>
            </AppCard>
          ))}
        </View>

        <View style={{ height: spacing.xl }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  title: {
    fontSize: 22,
    lineHeight: 24,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  subtitle: {
    marginBottom: spacing.lg,
    fontSize: typography.sm,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textSecondary,
  },

  sectionLabel: {
    fontSize: typography.xs,
    fontFamily: typography.fontFamily.black,
    color: colors.textSecondary,
    letterSpacing: 1.1,
  },

  entryCard: {
    backgroundColor: colors.surface,
    borderColor: colors.borderLight,
  },
  entryTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  entryTime: {
    fontSize: typography.sm,
    fontFamily: typography.fontFamily.black,
    color: colors.primary,
  },
  entryTitle: {
    marginTop: 4,
    fontSize: 16,
    lineHeight: 18,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
  },
  entryMeta: {
    marginTop: 4,
    fontSize: typography.sm,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textSecondary,
  },
  entryTips: {
    marginTop: spacing.md,
    fontSize: typography.base,
    lineHeight: 19,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },

  moveCol: {
    gap: spacing.sm,
  },
  moveBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.round,
    backgroundColor: colors.surfaceWarm,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyTitle: {
    fontSize: 18,
    lineHeight: 20,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
  },
  emptySub: {
    marginTop: 6,
    fontSize: typography.base,
    lineHeight: 19,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
});
