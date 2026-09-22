import React, { useMemo } from "react";
import { View, Alert, StyleSheet, Text } from "react-native";
import { Database, RotateCcw } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";

import { apiFetch } from "@/services/apiClient";
import { ACCOUNTS_ENABLED, SERVER_SYNC_ENABLED } from "@/utils/featureFlags";
import { useAuth } from "@/utils/auth/useAuth";
import AppCard from "@/components/AppCard";
import { SectionHeader } from "../components/SectionHeader";
import { Divider } from "../components/Divider";
import { Row } from "../components/Row";
import { colors, spacing, typography } from "@/theme/index";

export function DataSection({ settings, update, onHaptic }) {
  const router = useRouter();
  const { isReady, isAuthenticated } = useAuth();

  const statusQuery = useQuery({
    queryKey: ["strava", "status", "settings-row"],
    enabled: !!(
      isReady &&
      isAuthenticated &&
      ACCOUNTS_ENABLED &&
      SERVER_SYNC_ENABLED
    ),
    queryFn: async () => {
      return await apiFetch("/api/strava/status", { method: "GET" });
    },
  });

  const stravaSub = useMemo(() => {
    if (!ACCOUNTS_ENABLED || !SERVER_SYNC_ENABLED) {
      return "Manage connection";
    }

    if (!isReady) {
      return "Manage connection";
    }

    if (!isAuthenticated) {
      return "Sign in to connect";
    }

    if (statusQuery.isLoading) {
      return "Checking…";
    }

    if (statusQuery.data?.connected) {
      return "Connected";
    }

    return "Not connected";
  }, [
    isAuthenticated,
    isReady,
    statusQuery.data?.connected,
    statusQuery.isLoading,
  ]);

  return (
    <>
      <SectionHeader title="Data & integrations" />
      <AppCard style={styles.sectionCard} pressable={false}>
        <Row
          icon={Database}
          title="Strava"
          sub={stravaSub}
          onPress={async () => {
            await onHaptic();
            router.push("/settings/strava");
          }}
        />
        <Divider />
        <Row
          icon={Database}
          title="Import ride data"
          sub="Manual trigger (stub)"
          onPress={async () => {
            await onHaptic();
            Alert.alert("Import", "MVP stub — coming next.");
          }}
        />
        <Divider />
        <Row
          icon={RotateCcw}
          title="Reset AI recommendations"
          sub="Soft reset (doesn't delete rides)"
          onPress={async () => {
            await onHaptic();
            Alert.alert("Reset AI", "Stubbed — can be wired to stores next.");
          }}
        />
      </AppCard>
    </>
  );
}

const styles = StyleSheet.create({
  sectionCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    padding: 0,
    overflow: "hidden",
  },
});
