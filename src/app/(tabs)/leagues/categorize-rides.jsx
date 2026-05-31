import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Mountain, Wind, TrendingUp } from "lucide-react-native";

import AppCard from "@/components/AppCard";
import AppButton from "@/components/AppButton";
import { colors, spacing, radius, typography } from "@/theme/index";
import { apiFetch } from "@/services/apiClient";
import { useUserCharacter } from "@/store/userCharacter";

const FOCUS_OPTIONS = [
  {
    id: "flow",
    label: "Flow",
    description: "Berms, jumps, and smooth sections",
    icon: Wind,
    color: colors.primary,
  },
  {
    id: "tech",
    label: "Technical",
    description: "Roots, rocks, and gnarly features",
    icon: Mountain,
    color: colors.warning,
  },
  {
    id: "climb",
    label: "Climbing",
    description: "Uphill segments and endurance",
    icon: TrendingUp,
    color: colors.success,
  },
];

export default function CategorizeRidesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();
  const updateCharacter = useUserCharacter((s) => s.updateCharacter);

  const [selectedRide, setSelectedRide] = useState(null);
  const [selectedFocus, setSelectedFocus] = useState(null);

  // Fetch uncategorized rides
  const ridesQuery = useQuery({
    queryKey: ["rides", "uncategorized"],
    queryFn: async () => {
      return await apiFetch("/api/rides?uncategorized=true", { method: "GET" });
    },
  });

  // Categorize ride mutation
  const categorizeMutation = useMutation({
    mutationFn: async ({ rideId, rideFocus }) => {
      return await apiFetch(`/api/rides/${rideId}`, {
        method: "PATCH",
        body: JSON.stringify({ rideFocus }),
      });
    },
    onSuccess: async (data) => {
      // Update character store with new data
      if (data?.characterUpdate) {
        updateCharacter({
          badge: data.characterUpdate.badge,
          ridingType: data.characterUpdate.ridingType,
          overallScore: data.characterUpdate.overallScore,
        });
      }

      // Refresh rides and character data
      await queryClient.invalidateQueries({ queryKey: ["rides"] });
      await queryClient.invalidateQueries({ queryKey: ["character"] });

      setSelectedRide(null);
      setSelectedFocus(null);

      Alert.alert(
        "Ride Categorized!",
        `Your character has been updated based on your performance.`,
      );
    },
    onError: (error) => {
      console.error(error);
      Alert.alert("Error", "Could not categorize ride. Try again.");
    },
  });

  const handleCategorize = useCallback(() => {
    if (!selectedRide || !selectedFocus) return;

    categorizeMutation.mutate({
      rideId: selectedRide.id,
      rideFocus: selectedFocus,
    });
  }, [selectedRide, selectedFocus, categorizeMutation]);

  const rides = ridesQuery.data?.rides || [];
  const isLoading = ridesQuery.isLoading || categorizeMutation.isPending;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Categorize Rides</Text>
        <Text style={styles.headerSubtitle}>
          Help us understand your riding style by categorizing your Strava rides
        </Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 28 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {rides.length === 0 ? (
          <AppCard style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>All Caught Up!</Text>
            <Text style={styles.emptySubtitle}>
              You've categorized all your Strava rides. New rides will appear
              here after syncing.
            </Text>
            <AppButton
              title="Back to Character"
              onPress={() => router.back()}
              style={styles.backButton}
            />
          </AppCard>
        ) : (
          <>
            {/* Ride Selection */}
            <Text style={styles.sectionTitle}>
              Select a Ride ({rides.length} remaining)
            </Text>
            <View style={styles.ridesList}>
              {rides.slice(0, 5).map((ride) => {
                const isSelected = selectedRide?.id === ride.id;
                const title = ride?.meta?.title || "Untitled Ride";
                const distance = ride.distance_km
                  ? `${ride.distance_km.toFixed(1)} km`
                  : "";
                const elevation = ride.elevation_gain_m
                  ? `↑ ${Math.round(ride.elevation_gain_m)}m`
                  : "";
                const date = ride.ride_at
                  ? new Date(ride.ride_at).toLocaleDateString()
                  : "";

                return (
                  <AppCard
                    key={ride.id}
                    style={[
                      styles.rideCard,
                      isSelected && styles.rideCardSelected,
                    ]}
                    onPress={() => setSelectedRide(ride)}
                  >
                    <Text style={styles.rideTitle}>{title}</Text>
                    <View style={styles.rideStats}>
                      {distance && (
                        <Text style={styles.rideStat}>{distance}</Text>
                      )}
                      {elevation && (
                        <Text style={styles.rideStat}>{elevation}</Text>
                      )}
                      {date && <Text style={styles.rideStat}>{date}</Text>}
                    </View>
                  </AppCard>
                );
              })}
            </View>

            {/* Focus Selection */}
            {selectedRide && (
              <>
                <Text style={styles.sectionTitle}>What was the focus?</Text>
                <View style={styles.focusList}>
                  {FOCUS_OPTIONS.map((option) => {
                    const isSelected = selectedFocus === option.id;
                    const Icon = option.icon;

                    return (
                      <AppCard
                        key={option.id}
                        style={[
                          styles.focusCard,
                          isSelected && styles.focusCardSelected,
                        ]}
                        onPress={() => setSelectedFocus(option.id)}
                      >
                        <View style={styles.focusIcon}>
                          <Icon
                            size={24}
                            color={isSelected ? colors.surface : option.color}
                            strokeWidth={2.5}
                          />
                        </View>
                        <Text style={styles.focusLabel}>{option.label}</Text>
                        <Text style={styles.focusDesc}>
                          {option.description}
                        </Text>
                      </AppCard>
                    );
                  })}
                </View>

                <AppButton
                  title={
                    categorizeMutation.isPending
                      ? "Categorizing..."
                      : "Categorize Ride"
                  }
                  onPress={handleCategorize}
                  disabled={!selectedFocus || isLoading}
                  style={styles.submitButton}
                />
              </>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  headerTitle: {
    fontSize: 28,
    lineHeight: 32,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    letterSpacing: -0.6,
  },
  headerSubtitle: {
    marginTop: spacing.sm,
    fontSize: typography.base,
    lineHeight: 20,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
  scroll: { flex: 1 },
  content: { padding: spacing.xl },

  sectionTitle: {
    fontSize: 20,
    lineHeight: 22,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    letterSpacing: -0.2,
    marginBottom: spacing.lg,
  },

  ridesList: { marginBottom: spacing.xl, gap: spacing.md },
  rideCard: {
    paddingVertical: spacing.lg,
    borderWidth: 2,
    borderColor: "transparent",
  },
  rideCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  rideTitle: {
    fontSize: 18,
    lineHeight: 20,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  rideStats: {
    flexDirection: "row",
    gap: spacing.md,
  },
  rideStat: {
    fontSize: typography.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
  },

  focusList: { marginBottom: spacing.xl, gap: spacing.md },
  focusCard: {
    alignItems: "center",
    paddingVertical: spacing.xl,
    borderWidth: 2,
    borderColor: "transparent",
  },
  focusCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  focusIcon: {
    width: 64,
    height: 64,
    borderRadius: radius.round,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  focusLabel: {
    fontSize: 20,
    lineHeight: 22,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  focusDesc: {
    fontSize: typography.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    textAlign: "center",
  },

  submitButton: {
    marginTop: spacing.lg,
  },

  emptyCard: {
    alignItems: "center",
    paddingVertical: spacing.xxl,
  },
  emptyTitle: {
    fontSize: 24,
    lineHeight: 26,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  emptySubtitle: {
    fontSize: typography.base,
    lineHeight: 22,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  backButton: {
    minWidth: 200,
  },
});
