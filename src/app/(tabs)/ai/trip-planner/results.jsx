import React, { useCallback, useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import {
  RotateCcw,
  Map,
  Share2,
  ChevronDown,
  ChevronUp,
  Check,
} from "lucide-react-native";

import { colors, spacing, typography, radius, shadows } from "@/theme/index";
import AppCard from "@/components/AppCard";
import AppButton from "@/components/AppButton";
import Chip from "@/components/Chip";
import { useTripsStore } from "@/store/trips";
import { whyThisFitsText } from "@/utils/tripScoring";
import {
  difficultyTone,
  formatDifficultyLabel,
} from "../../../../services/trailsService";
import ScreenHeader from "@/components/layout/ScreenHeader";
import { FEATURE_TRIP_PLANNER_ENABLED } from "@/utils/featureFlags";

function StatPill({ label, value }) {
  return (
    <View style={styles.statPill}>
      <Text style={styles.statPillLabel}>{label}</Text>
      <Text style={styles.statPillValue}>{value}</Text>
    </View>
  );
}

export default function AITripPlannerResultsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const plan = useTripsStore((s) => s.currentPlan);
  const resetWizard = useTripsStore((s) => s.resetWizard);
  const toggleChecklistItem = useTripsStore((s) => s.toggleChecklistItem);

  const [expanded, setExpanded] = useState(() => new Set(["day-1"]));

  const onBack = useCallback(() => {
    router.back();
  }, [router]);

  const onReset = useCallback(async () => {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch (e) {
      // no-op
    }
    resetWizard();
    router.replace("/ai/trip-planner");
  }, [resetWizard, router]);

  const onOpenMap = useCallback(() => {
    router.push("/ai/trip-planner/map");
  }, [router]);

  const onShare = useCallback(() => {
    router.push("/ai/trip-planner/share");
  }, [router]);

  const fitText = useMemo(() => {
    if (!plan) {
      return "";
    }
    return whyThisFitsText({
      trip: { socialProof: "high reward" },
      riderProfile: plan.riderProfile,
      preferences: plan.preferences,
    });
  }, [plan]);

  const headerBadges = useMemo(() => {
    if (!plan) return [];
    const tags = [];
    if (plan.preferences?.wantsFlow) tags.push("Flow");
    if (plan.preferences?.wantsTech) tags.push("Tech");
    if (plan.preferences?.wantsJumps) tags.push("Jumps");
    return tags.slice(0, 3);
  }, [plan]);

  const summaryLine = useMemo(() => {
    if (!plan) return "";
    const dist = plan.summary?.distanceKm ?? 0;
    const climb = plan.summary?.climbingM ?? 0;
    return `${plan.durationDays} day${plan.durationDays === 1 ? "" : "s"} • ~${dist} km • ~${climb.toLocaleString()} m`;
  }, [plan]);

  const toggleDay = useCallback((dayId) => {
    setExpanded((prev) => {
      const next = new Set(Array.from(prev));
      if (next.has(dayId)) {
        next.delete(dayId);
      } else {
        next.add(dayId);
      }
      return next;
    });
  }, []);

  const headerActions = (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
      <Pressable onPress={onOpenMap} hitSlop={10} style={styles.headerIconBtn}>
        <Map size={18} color={colors.textPrimary} strokeWidth={2.75} />
      </Pressable>
      <Pressable onPress={onShare} hitSlop={10} style={styles.headerIconBtn}>
        <Share2 size={18} color={colors.textPrimary} strokeWidth={2.75} />
      </Pressable>
      <Pressable onPress={onReset} hitSlop={10} style={styles.headerIconBtn}>
        <RotateCcw size={18} color={colors.textSecondary} strokeWidth={2.75} />
      </Pressable>
    </View>
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
          style={{ padding: spacing.xl, paddingBottom: insets.bottom + 28 }}
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

  if (!plan) {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" />
        <ScreenHeader title="Itinerary" showBack />
        <View style={{ padding: spacing.xl }}>
          <AppCard
            style={{
              backgroundColor: colors.surfaceWarm,
              borderColor: colors.border,
            }}
          >
            <Text style={styles.emptyTitle}>No trip plan loaded</Text>
            <Text style={styles.emptySub}>
              Head back to the wizard and generate a plan.
            </Text>
            <View style={{ height: spacing.lg }} />
            <AppButton
              title="Open Trip Wizard"
              onPress={() => router.replace("/ai/trip-planner")}
            />
          </AppCard>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <ScreenHeader
        title="Itinerary"
        showBack
        onBack={onBack}
        rightAction={headerActions}
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: spacing.xl,
          paddingBottom: insets.bottom + 28,
        }}
        showsVerticalScrollIndicator={false}
      >
        <AppCard style={styles.planHeaderCard}>
          <Text style={styles.planTitle}>{plan.destination?.name}</Text>
          <Text style={styles.planMeta}>{summaryLine}</Text>

          <View style={styles.badgeRow}>
            {headerBadges.map((b) => (
              <Chip key={b} label={b} tone="orange" selected />
            ))}
            <Chip label="Rider Favorite" tone="orange" selected />
          </View>

          <Text style={styles.fitText}>{fitText}</Text>

          <View style={styles.statRow}>
            <StatPill label="Budget" value={plan.constraints?.budget || "$$"} />
            <StatPill
              label="Group"
              value={String(plan.constraints?.groupSize || 1)}
            />
            <StatPill
              label="Stay"
              value={plan.constraints?.accommodationType || "Lodge"}
            />
          </View>
        </AppCard>

        {/* Daily itinerary */}
        <View style={{ marginTop: spacing.xxl }}>
          <Text style={styles.sectionTitle}>Daily Itinerary</Text>
          <View style={{ gap: spacing.md }}>
            {(plan.itineraryDays || []).map((day) => {
              const isOpen = expanded.has(day.id);
              return (
                <AppCard
                  key={day.id}
                  padding={spacing.lg}
                  style={styles.dayCard}
                >
                  <Pressable
                    onPress={() => toggleDay(day.id)}
                    style={styles.dayHeaderRow}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.dayTitle}>{day.title}</Text>
                      <Text style={styles.daySub}>
                        {`${(day.entries || []).length} blocks • tap to ${isOpen ? "collapse" : "expand"}`}
                      </Text>
                    </View>
                    {isOpen ? (
                      <ChevronUp
                        size={18}
                        color={colors.textSecondary}
                        strokeWidth={2.75}
                      />
                    ) : (
                      <ChevronDown
                        size={18}
                        color={colors.textSecondary}
                        strokeWidth={2.75}
                      />
                    )}
                  </Pressable>

                  {isOpen ? (
                    <View style={{ marginTop: spacing.md, gap: spacing.sm }}>
                      {(day.entries || []).map((e) => (
                        <View key={e.id} style={styles.entryRow}>
                          <Text style={styles.entryTime}>{e.time}</Text>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.entryTitle}>{e.title}</Text>
                            <Text style={styles.entrySub}>
                              {e.duration} • {e.tips}
                            </Text>
                          </View>
                        </View>
                      ))}

                      <View style={{ height: spacing.sm }} />
                      <AppButton
                        title="Open Day View"
                        variant="secondary"
                        onPress={() =>
                          router.push({
                            pathname: "/ai/trip-planner/day/[dayIndex]",
                            params: { dayIndex: String(day.dayIndex) },
                          })
                        }
                      />
                    </View>
                  ) : null}
                </AppCard>
              );
            })}
          </View>
        </View>

        {/* Featured trails */}
        <View style={{ marginTop: spacing.xxl }}>
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>Featured Trails</Text>
            <Text style={styles.sectionAction} onPress={onOpenMap}>
              See all
            </Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingRight: spacing.xl }}
          >
            {(plan.featuredTrails || []).map((t) => {
              const tone = difficultyTone(t.difficulty);
              const diffLabel = formatDifficultyLabel(t.difficulty);
              return (
                <View key={t.id} style={{ marginRight: spacing.md }}>
                  <AppCard
                    padding={spacing.lg}
                    style={styles.trailCard}
                    onPress={() =>
                      router.push({
                        pathname: "/ai/trip-planner/trail/[trailId]",
                        params: { trailId: t.id },
                      })
                    }
                  >
                    <Text style={styles.trailName} numberOfLines={1}>
                      {t.name}
                    </Text>
                    <View style={{ marginTop: spacing.sm }}>
                      <Chip
                        label={diffLabel}
                        tone={
                          tone === "red"
                            ? "red"
                            : tone === "green"
                              ? "green"
                              : "neutral"
                        }
                        selected
                      />
                    </View>
                    <Text
                      style={styles.trailMeta}
                    >{`${t.distanceKm} km • ${t.climbingM} m`}</Text>
                  </AppCard>
                </View>
              );
            })}
          </ScrollView>
        </View>

        {/* Logistics */}
        <View style={{ marginTop: spacing.xxl }}>
          <Text style={styles.sectionTitle}>Logistics</Text>
          <View style={{ gap: spacing.md, marginTop: spacing.md }}>
            <AppCard padding={spacing.lg} style={styles.logisticsCard}>
              <Text style={styles.logisticsTitle}>Stay</Text>
              {(plan.logistics?.stay || []).map((s) => (
                <View key={s.id} style={styles.logisticsRow}>
                  <Text style={styles.logisticsName}>{s.name}</Text>
                  <Text
                    style={styles.logisticsMeta}
                  >{`${s.type} • ${s.rating}`}</Text>
                </View>
              ))}
            </AppCard>

            <AppCard padding={spacing.lg} style={styles.logisticsCard}>
              <Text style={styles.logisticsTitle}>Eat</Text>
              {(plan.logistics?.eat || []).map((e) => (
                <View key={e.id} style={styles.logisticsRow}>
                  <Text style={styles.logisticsName}>{e.name}</Text>
                  <Text
                    style={styles.logisticsMeta}
                  >{`${e.vibe} • ${e.rating}`}</Text>
                </View>
              ))}
            </AppCard>
          </View>
        </View>

        {/* Essentials */}
        <View style={{ marginTop: spacing.xxl }}>
          <Text style={styles.sectionTitle}>Essentials</Text>
          <AppCard style={styles.essentialsCard}>
            <Text style={styles.essentialsLabel}>Safety notes</Text>
            {(plan.essentials?.safetyNotes || []).map((n) => (
              <Text key={n} style={styles.essentialsItem}>{`• ${n}`}</Text>
            ))}

            <View style={{ height: spacing.md }} />

            <Text style={styles.essentialsLabel}>Access notes</Text>
            {(plan.essentials?.accessNotes || []).map((n) => (
              <Text key={n} style={styles.essentialsItem}>{`• ${n}`}</Text>
            ))}
          </AppCard>
        </View>

        {/* Packing checklist */}
        <View style={{ marginTop: spacing.xxl }}>
          <Text style={styles.sectionTitle}>Packing Checklist</Text>
          <AppCard style={styles.checklistCard}>
            <View style={{ gap: spacing.sm }}>
              {(plan.packingChecklist || []).map((item) => {
                const checked = Boolean(item.checked);
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => toggleChecklistItem(item.id)}
                    style={[styles.checkRow, checked && styles.checkRowChecked]}
                  >
                    <View
                      style={[
                        styles.checkBox,
                        checked && {
                          backgroundColor: colors.primary,
                          borderColor: colors.primary,
                        },
                      ]}
                    >
                      {checked ? (
                        <Check size={14} color="#fff" strokeWidth={3} />
                      ) : null}
                    </View>
                    <Text
                      style={[
                        styles.checkText,
                        checked && { color: colors.textPrimary },
                      ]}
                    >
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={{ height: spacing.lg }} />
            <AppButton title="Save + Share" onPress={onShare} size="large" />
          </AppCard>
        </View>

        <View style={{ height: spacing.xl }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.round,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.small,
  },

  planHeaderCard: {
    backgroundColor: colors.surface,
    borderColor: colors.borderLight,
  },
  planTitle: {
    fontSize: 22,
    lineHeight: 24,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  planMeta: {
    marginTop: spacing.xs,
    fontSize: typography.sm,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textSecondary,
  },
  badgeRow: {
    marginTop: spacing.md,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  fitText: {
    marginTop: spacing.md,
    fontSize: typography.base,
    lineHeight: 19,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },

  statRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  statPill: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceWarm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statPillLabel: {
    fontSize: 11,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textSecondary,
  },
  statPillValue: {
    marginTop: 3,
    fontSize: 14,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
  },

  sectionRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontSize: 18,
    lineHeight: 20,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  sectionAction: {
    fontSize: typography.sm,
    fontFamily: typography.fontFamily.bold,
    color: colors.primary,
  },

  dayCard: {
    backgroundColor: colors.surface,
    borderColor: colors.borderLight,
  },
  dayHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  dayTitle: {
    fontSize: 16,
    lineHeight: 18,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
  },
  daySub: {
    marginTop: 4,
    fontSize: typography.sm,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textSecondary,
  },

  entryRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceWarm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  entryTime: {
    width: 72,
    fontSize: typography.sm,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
  },
  entryTitle: {
    fontSize: 14,
    lineHeight: 16,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
  },
  entrySub: {
    marginTop: 4,
    fontSize: typography.sm,
    lineHeight: 16,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },

  trailCard: {
    width: 220,
    backgroundColor: colors.surface,
    borderColor: colors.borderLight,
  },
  trailName: {
    fontSize: 15,
    lineHeight: 17,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
  },
  trailMeta: {
    marginTop: spacing.sm,
    fontSize: typography.sm,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textSecondary,
  },

  logisticsCard: {
    backgroundColor: colors.surfaceWarm,
    borderColor: colors.border,
  },
  logisticsTitle: {
    fontSize: 16,
    lineHeight: 18,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  logisticsRow: {
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  logisticsName: {
    fontSize: 14,
    lineHeight: 16,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
  },
  logisticsMeta: {
    marginTop: 4,
    fontSize: typography.sm,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textSecondary,
  },

  essentialsCard: {
    backgroundColor: colors.surface,
    borderColor: colors.borderLight,
  },
  essentialsLabel: {
    fontSize: typography.sm,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  essentialsItem: {
    fontSize: typography.base,
    lineHeight: 19,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    marginBottom: 6,
  },

  checklistCard: {
    backgroundColor: colors.surface,
    borderColor: colors.borderLight,
  },
  checkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceWarm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  checkRowChecked: {
    borderColor: colors.primarySoft2,
    backgroundColor: colors.primarySoft,
  },
  checkBox: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  checkText: {
    flex: 1,
    fontSize: typography.base,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textSecondary,
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
