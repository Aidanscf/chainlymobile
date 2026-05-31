import React, { useEffect, useMemo } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams } from "expo-router";

import ScreenHeader from "@/components/layout/ScreenHeader";
import { colors } from "@/theme/index";
import { useChainlyStore } from "@/store/chainlyStore";

import { useBikeData } from "./_hooks/useBikeData";
import { useMaintenanceHistory } from "./_hooks/useMaintenanceHistory";
import { useRecentRides } from "./_hooks/useRecentRides";
import { useMaintenanceQuests } from "./_hooks/useMaintenanceQuests";
import { useStravaSync } from "./_hooks/useStravaSync";
import { useBikeActions } from "./_hooks/useBikeActions";

import { MechanicWorkbench } from "./_components/MechanicWorkbench";
import { HealthBreakdown } from "./_components/HealthBreakdown";
import { SpecsPreview } from "./_components/SpecsPreview";
import { MaintenanceQuests } from "./_components/MaintenanceQuests";
import { MaintenanceHistorySection } from "./_components/MaintenanceHistorySection";
import { ServiceWorkordersSection } from "./_components/ServiceWorkordersSection";
import { RecentRidesSection } from "./_components/RecentRidesSection";

export default function BikeDetailScreen() {
  const insets = useSafeAreaInsets();
  const { bikeId } = useLocalSearchParams();

  const id = useMemo(() => {
    if (!bikeId) return "";
    return String(bikeId);
  }, [bikeId]);

  const {
    bike,
    maintenanceEvents,
    rides,
    displayedHealthScore,
    breakdown,
    previewSpecs,
    parts,
  } = useBikeData(id);

  const title = bike?.name || "Bike";

  const { maintenanceHistory, hasMaintenanceHistory } =
    useMaintenanceHistory(maintenanceEvents);

  const quests = useMaintenanceQuests(bike, rides, maintenanceEvents);

  const { recentRides, hasRecentRides } = useRecentRides(rides, id);

  const { onBack, onSpecSheet, onTuneMaintenance, onAddRideManually } =
    useBikeActions(id);

  const { onAddRideWithStrava, stravaTitle, stravaDisabled } =
    useStravaSync(id);

  // IMPORTANT: don't subscribe to the store action here.
  // Subscribing to actions can change the function identity across renders,
  // causing the effect below to re-run forever.
  useEffect(() => {
    if (!id) return;

    // Best-effort: pulls canonical specs + components (falls back safely offline)
    const { hydrateBikeGarageFromServer } = useChainlyStore.getState();
    hydrateBikeGarageFromServer?.(id);
  }, [id]);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <ScreenHeader title={title} showBack onBack={onBack} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: insets.bottom + 28 }}
        showsVerticalScrollIndicator={false}
      >
        <MechanicWorkbench
          bike={bike}
          parts={parts}
          displayedHealthScore={displayedHealthScore}
          stravaTitle={stravaTitle}
          stravaDisabled={stravaDisabled}
          onAddRideWithStrava={onAddRideWithStrava}
          onAddRideManually={onAddRideManually}
          onSpecSheet={onSpecSheet}
          onTuneMaintenance={onTuneMaintenance}
        />

        <HealthBreakdown breakdown={breakdown} />

        <SpecsPreview previewSpecs={previewSpecs} onSpecSheet={onSpecSheet} />

        <MaintenanceQuests quests={quests} />

        <MaintenanceHistorySection
          maintenanceHistory={maintenanceHistory}
          hasMaintenanceHistory={hasMaintenanceHistory}
        />

        <ServiceWorkordersSection bikeId={id} />

        <RecentRidesSection
          recentRides={recentRides}
          hasRecentRides={hasRecentRides}
          stravaTitle={stravaTitle}
          stravaDisabled={stravaDisabled}
          onAddRideWithStrava={onAddRideWithStrava}
          onAddRideManually={onAddRideManually}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
});
