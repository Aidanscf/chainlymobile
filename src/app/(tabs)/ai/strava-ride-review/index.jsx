import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Pressable,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Check, Mountain, Zap, Gauge } from "lucide-react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import ScreenHeader from "@/components/layout/ScreenHeader";
import AppCard from "@/components/AppCard";
import AppButton from "@/components/AppButton";
import { colors, spacing, radius, typography } from "@/theme/index";
import { apiFetch } from "@/services/apiClient";
import { useUserCharacter } from "@/store/userCharacter";

function RideFocusCard({
  focus,
  selected,
  onPress,
  icon: Icon,
  title,
  description,
}) {
  return (
    <Pressable onPress={onPress}>
      <AppCard
        style={[styles.focusCard, selected && styles.focusCardSelected]}
        pressable={false}
      >
        <View style={styles.focusIcon}>
          <Icon
            size={24}
            color={selected ? colors.primary : colors.textSecondary}
            strokeWidth={2.5}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={[styles.focusTitle, selected && styles.focusTitleSelected]}
          >
            {title}
          </Text>
          <Text style={styles.focusDesc}>{description}</Text>
        </View>
        {selected && (
          <View style={styles.checkmark}>
            <Check size={18} color={colors.surface} strokeWidth={3} />
          </View>
        )}
      </AppCard>
    </Pressable>
  );
}

export default function StravaRideReviewScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [selectedRideFocus, setSelectedRideFocus] = useState(null);
  const [processing, setProcessing] = useState(false);

  // Get uncategorized rides
  const ridesQuery = useQuery({
    queryKey: ["rides", "uncategorized"],
    queryFn: async () => {
      return await apiFetch("/api/rides?uncategorized=true", { method: "GET" });
    },
  });

  const updateCharacter = useUserCharacter((s) => s.updateCharacter);

  const categorizeMutation = useMutation({
    mutationFn: async ({ rideId, focus }) => {
      return await apiFetch(`/api/rides/${rideId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rideFocus: focus }),
      });
    },
    onSuccess: async (data) => {
      // Update character if we got skill scores back
      if (data?.characterUpdate) {
        updateCharacter({
          badge: data.characterUpdate.badge,
          ridingType: data.characterUpdate.ridingType,
          overallScore: data.characterUpdate.overallScore,
        });
      }

      await queryClient.invalidateQueries({ queryKey: ["rides"] });

      // Check if there are more rides to categorize
      const remaining =
        ridesQuery.data?.rides?.filter((r) => r.id !== data.rideId) || [];

      if (remaining.length === 0) {
        Alert.alert(
          "All Set!",
          "Your character has been updated based on your Strava performance.",
          [
            {
              text: "View Character",
              onPress: () => router.push("/leagues/character"),
            },
          ],
        );
      }
    },
  });

  const currentRide = useMemo(() => {
    const uncategorized = ridesQuery.data?.rides || [];
    return uncategorized[0] || null;
  }, [ridesQuery.data]);

  const onSelectFocus = useCallback((focus) => {
    setSelectedRideFocus(focus);
  }, []);

  const onSubmit = useCallback(async () => {
    if (!selectedRideFocus || !currentRide) return;

    setProcessing(true);
    try {
      await categorizeMutation.mutateAsync({
        rideId: currentRide.id,
        focus: selectedRideFocus,
      });

      // Reset selection for next ride
      setSelectedRideFocus(null);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Couldn't categorize ride. Try again.");
    } finally {
      setProcessing(false);
    }
  }, [selectedRideFocus, currentRide, categorizeMutation]);

  const onSkip = useCallback(() => {
    router.back();
  }, [router]);

  const hasRides = (ridesQuery.data?.rides?.length || 0) > 0;
  const remainingCount = ridesQuery.data?.rides?.length || 0;

  if (ridesQuery.isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBar style="dark" />
        <ScreenHeader title="Review Rides" showBack onBack={onSkip} />
        <View style={styles.centerContent}>
          <Text style={styles.loadingText}>Loading rides...</Text>
        </View>
      </View>
    );
  }

  if (!hasRides) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBar style="dark" />
        <ScreenHeader title="Review Rides" showBack onBack={onSkip} />
        <View style={styles.centerContent}>
          <Text style={styles.emptyTitle}>No rides to review</Text>
          <Text style={styles.emptySubtitle}>
            Sync some Strava rides first, then come back to categorize them.
          </Text>
          <AppButton
            title="Go Back"
            onPress={onSkip}
            style={{ marginTop: spacing.xl }}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />

      <ScreenHeader title="Review Rides" showBack onBack={onSkip} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 140 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>What was the focus of this ride?</Text>
        <Text style={styles.subtitle}>
          {currentRide?.meta?.title || "Recent ride"} · {remainingCount} ride
          {remainingCount !== 1 ? "s" : ""} to review
        </Text>

        <View style={{ height: spacing.xl }} />

        <AppCard style={styles.rideCard} pressable={false}>
          <View style={styles.rideStats}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Distance</Text>
              <Text style={styles.statValue}>
                {currentRide?.distance_km?.toFixed(1) || "—"} km
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Elevation</Text>
              <Text style={styles.statValue}>
                {currentRide?.elevation_gain_m?.toFixed(0) || "—"} m
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Time</Text>
              <Text style={styles.statValue}>
                {currentRide?.moving_time_sec
                  ? `${Math.floor(currentRide.moving_time_sec / 60)}m`
                  : "—"}
              </Text>
            </View>
          </View>
        </AppCard>

        <View style={{ height: spacing.lg }} />

        <Text style={styles.sectionTitle}>Select Ride Focus</Text>
        <Text style={styles.sectionSubtitle}>
          This helps us calculate your skill scores based on Strava segment
          performance.
        </Text>

        <View style={{ height: spacing.md }} />

        <RideFocusCard
          focus="flow"
          selected={selectedRideFocus === "flow"}
          onPress={() => onSelectFocus("flow")}
          icon={Zap}
          title="Flow & Speed"
          description="Pumping, maintaining speed, cornering flow"
        />

        <View style={{ height: spacing.md }} />

        <RideFocusCard
          focus="tech"
          selected={selectedRideFocus === "tech"}
          onPress={() => onSelectFocus("tech")}
          icon={Gauge}
          title="Technical Riding"
          description="Rock gardens, roots, steep descents, drops"
        />

        <View style={{ height: spacing.md }} />

        <RideFocusCard
          focus="climb"
          selected={selectedRideFocus === "climb"}
          onPress={() => onSelectFocus("climb")}
          icon={Mountain}
          title="Climbing"
          description="Sustained climbs, elevation gain, endurance"
        />
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
        <AppButton
          title={processing ? "Analyzing..." : "Submit & Continue"}
          onPress={onSubmit}
          disabled={!selectedRideFocus || processing}
          style={styles.submitBtn}
        />
        <Pressable onPress={onSkip} style={styles.skipBtn}>
          <Text style={styles.skipText}>Skip for now</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: { flex: 1 },
  content: {
    padding: spacing.xl,
  },
  centerContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
  },

  title: {
    fontSize: 28,
    lineHeight: 32,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  subtitle: {
    marginTop: 8,
    fontSize: typography.base,
    lineHeight: 20,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },

  loadingText: {
    fontSize: typography.lg,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
  },

  emptyTitle: {
    fontSize: 24,
    lineHeight: 28,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    letterSpacing: -0.4,
    textAlign: "center",
  },
  emptySubtitle: {
    marginTop: spacing.md,
    fontSize: typography.base,
    lineHeight: 22,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    textAlign: "center",
  },

  rideCard: {
    backgroundColor: colors.surface,
  },
  rideStats: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statLabel: {
    fontSize: typography.sm,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  statValue: {
    marginTop: 6,
    fontSize: 20,
    lineHeight: 22,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border,
  },

  sectionTitle: {
    fontSize: 18,
    lineHeight: 20,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  sectionSubtitle: {
    marginTop: 6,
    fontSize: typography.sm,
    lineHeight: 18,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },

  focusCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
  },
  focusCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  focusIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.round,
    backgroundColor: colors.surfaceWarm,
    alignItems: "center",
    justifyContent: "center",
  },
  focusTitle: {
    fontSize: 16,
    lineHeight: 18,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  focusTitleSelected: {
    color: colors.primary,
  },
  focusDesc: {
    marginTop: 4,
    fontSize: typography.sm,
    lineHeight: 16,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
  checkmark: {
    width: 28,
    height: 28,
    borderRadius: radius.round,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },

  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
  },
  submitBtn: {
    marginBottom: spacing.md,
  },
  skipBtn: {
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  skipText: {
    fontSize: typography.base,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textSecondary,
  },
});
