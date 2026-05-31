import React, { useCallback, useMemo } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { ChevronRight, Wrench } from "lucide-react-native";
import { colors, spacing, typography, radius } from "@/theme/index";
import QuickActionCard from "@/components/QuickActionCard";
import AppCard from "@/components/AppCard";
import { useChainlyStore } from "@/store/chainlyStore";
import { FEATURE_TRIP_PLANNER_ENABLED } from "@/utils/featureFlags";

export default function AIScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const diagnosisHistory = useChainlyStore((s) => s.diagnosisHistory);
  const setCurrentDiagnosis = useChainlyStore((s) => s.setCurrentDiagnosis);
  const clearDiagnosisHistory = useChainlyStore((s) => s.clearDiagnosisHistory);

  const aiFeatures = [
    {
      id: "1",
      title: "AI Bike Helper",
      icon: "Wrench",
      route: "/ai/photo-mechanic",
    },
    // NEW: Gear Recommender route
    {
      id: "2",
      title: "Gear Recommender",
      icon: "PackageSearch",
      route: "/ai/gear-recommender",
    },
    {
      id: "3",
      title: "AI Trip Planner",
      icon: "Map",
      route: "/ai/trip-planner",
    },
    // Photo & Video
    {
      id: "4",
      title: "Analyzer Coach",
      icon: "Video",
      route: "/ai/media-analyzer",
    },

    // ✅ Wire Suspension Helper into the AI stack
    {
      id: "5",
      title: "Suspension Helper",
      icon: "Settings",
      route: "/ai/suspension-helper",
    },
    // NEW: Riding Logs (full width)
    {
      id: "6",
      title: "Riding Logs",
      icon: "Camera",
      route: "/ai/riding-logs",
      wide: true, // span full width
    },
  ];

  const visibleAiFeatures = FEATURE_TRIP_PLANNER_ENABLED
    ? aiFeatures
    : // Hide Trip Planner entry point while keeping routes/screens intact.
      aiFeatures.filter((f) => f?.route !== "/ai/trip-planner");

  const onFeaturePress = useCallback(
    (feature) => {
      if (!feature?.route) {
        console.log("AI Feature", feature?.title);
        return;
      }
      router.push(feature.route);
    },
    [router],
  );

  const previousChats = useMemo(() => {
    const raw = Array.isArray(diagnosisHistory) ? diagnosisHistory : [];
    // newest first; keep it tight
    return raw.slice(0, 8);
  }, [diagnosisHistory]);

  const openChat = useCallback(
    (session) => {
      // AppCard already does a soft haptic on press.
      setCurrentDiagnosis(session);
      // For now, previous chats are Photo Mechanic sessions.
      router.push("/ai/photo-mechanic/results");
    },
    [router, setCurrentDiagnosis],
  );

  const onClear = useCallback(async () => {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch (error) {
      console.error(error);
    }
    clearDiagnosisHistory();
  }, [clearDiagnosisHistory]);

  const formatChatTime = useCallback((iso) => {
    try {
      const d = new Date(iso);
      const now = new Date();
      const sameDay =
        d.getFullYear() === now.getFullYear() &&
        d.getMonth() === now.getMonth() &&
        d.getDate() === now.getDate();
      if (sameDay) {
        return "Today";
      }
      return d.toLocaleDateString();
    } catch (e) {
      return "";
    }
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Tools Hub</Text>

        <View style={styles.grid}>
          {visibleAiFeatures.map((feature) => (
            <View
              key={feature.id}
              style={feature.wide ? styles.tileWrapWide : styles.tileWrap}
            >
              <QuickActionCard
                icon={feature.icon}
                title={feature.title}
                color={colors.primary}
                onPress={() => onFeaturePress(feature)}
              />
            </View>
          ))}
        </View>

        {/* Previous chats */}
        <View style={styles.prevHeaderRow}>
          <Text style={styles.prevTitle}>Previous chats</Text>
          {previousChats.length > 0 ? (
            <Text onPress={onClear} style={styles.prevClear}>
              Clear
            </Text>
          ) : (
            <View />
          )}
        </View>

        {previousChats.length === 0 ? (
          <AppCard style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No chats yet</Text>
            <Text style={styles.emptySub}>
              Run an AI Bike Helper scan and your recent fixes will show up
              here.
            </Text>
          </AppCard>
        ) : (
          <View style={{ gap: spacing.md }}>
            {previousChats.map((c) => {
              const metaLeft = `${Math.round(c.confidence || 0)}% • ${String(
                c.detectedCategory || "other",
              ).toUpperCase()}`;
              const metaRight = formatChatTime(c.createdAt);

              return (
                <AppCard
                  key={c.id}
                  style={styles.chatRow}
                  onPress={() => openChat(c)}
                >
                  <View style={styles.chatIcon}>
                    <Wrench
                      size={18}
                      color={colors.primary}
                      strokeWidth={2.75}
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.chatTitle}>
                      {c.diagnosisTitle || "AI Bike Helper"}
                    </Text>
                    <View style={styles.chatMetaRow}>
                      <Text style={styles.chatMeta}>{metaLeft}</Text>
                      <Text style={styles.chatMetaDot}>•</Text>
                      <Text style={styles.chatMeta}>{metaRight}</Text>
                    </View>
                  </View>

                  <ChevronRight
                    size={18}
                    color={colors.textSecondary}
                    strokeWidth={2.75}
                  />
                </AppCard>
              );
            })}
          </View>
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
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.xl,
  },
  title: {
    fontSize: 32,
    lineHeight: 34,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    letterSpacing: -0.6,
  },
  subtitle: {
    fontSize: typography.base,
    lineHeight: 20,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    marginBottom: spacing.xxxl,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: spacing.sm,
  },
  tileWrap: {
    width: "50%",
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.lg,
  },
  tileWrapWide: {
    width: "100%",
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.lg,
  },

  prevHeaderRow: {
    marginTop: spacing.xxl,
    marginBottom: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  prevTitle: {
    fontSize: 18,
    lineHeight: 20,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  prevClear: {
    fontSize: typography.sm,
    fontFamily: typography.fontFamily.bold,
    color: colors.primary,
  },

  emptyCard: {
    backgroundColor: colors.surfaceWarm,
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
    lineHeight: 19,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },

  chatRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.lg,
  },
  chatIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.round,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primarySoft2,
    alignItems: "center",
    justifyContent: "center",
  },
  chatTitle: {
    fontSize: 16,
    lineHeight: 18,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  chatMetaRow: {
    marginTop: 4,
    flexDirection: "row",
    alignItems: "center",
  },
  chatMeta: {
    fontSize: typography.sm,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textSecondary,
  },
  chatMetaDot: {
    marginHorizontal: 6,
    fontSize: typography.sm,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textSecondary,
  },
});
