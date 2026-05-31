import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  Linking,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { PlayCircle, Plus } from "lucide-react-native";

import ScreenHeader from "@/components/layout/ScreenHeader";
import AppCard from "@/components/AppCard";
import AppButton from "@/components/AppButton";
import Chip from "@/components/Chip";
import { colors, spacing, radius, typography } from "@/theme/index";
import { useMediaAnalyzerStore } from "@/store/mediaAnalyzer";
import { recommendedVideos } from "@/data/drillsLibrary";

export default function AIMediaAnalyzerDrillsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();

  const getResultById = useMediaAnalyzerStore((s) => s.getResultById);
  const addDrillToPlan = useMediaAnalyzerStore((s) => s.addDrillToPlan);

  const resultId = params?.resultId;
  const result = useMemo(() => {
    if (!resultId) {
      return null;
    }
    return getResultById(String(resultId));
  }, [getResultById, resultId]);

  const [toast, setToast] = useState(null);

  const onBack = useCallback(async () => {
    try {
      if (Platform.OS !== "web") {
        await Haptics.selectionAsync();
      }
    } catch (e) {
      console.error(e);
    }
    router.back();
  }, [router]);

  const onShare = useCallback(() => {
    if (!result?.id) {
      return;
    }
    router.push(`/ai/media-analyzer/share?resultId=${result.id}`);
  }, [result?.id, router]);

  const onAdd = useCallback(
    async (drill) => {
      try {
        addDrillToPlan(drill, result?.id);
        if (Platform.OS !== "web") {
          await Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Success,
          );
        }
        setToast("Added to training plan");
        setTimeout(() => setToast(null), 1300);
      } catch (e) {
        console.error(e);
      }
    },
    [addDrillToPlan, result?.id],
  );

  const vids = useMemo(() => {
    const type = result?.ridingType;
    if (!type) {
      return [];
    }
    return recommendedVideos[type] || [];
  }, [result?.ridingType]);

  if (!result) {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" />
        <ScreenHeader title="Drills" showBack onBack={onBack} />

        <View style={{ paddingHorizontal: spacing.xl }}>
          <AppCard style={styles.emptyCard} pressable={false}>
            <Text style={styles.emptyTitle}>No result found</Text>
            <Text style={styles.emptySub}>
              Go back to Results and try again.
            </Text>
          </AppCard>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <ScreenHeader title="Drills" showBack onBack={onBack} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Top 3 drills for you</Text>
        <Text style={styles.subtitle}>
          Built from your weakest areas — do these once and re-test.
        </Text>

        {toast ? (
          <View style={styles.toast}>
            <Text style={styles.toastText}>{toast}</Text>
          </View>
        ) : null}

        <View style={{ gap: spacing.md }}>
          {(result.drills || []).map((d) => {
            return (
              <AppCard key={d.id} style={styles.drillCard} pressable={false}>
                <View style={styles.drillTopRow}>
                  <Text style={styles.drillName}>{d.name}</Text>
                  <Chip label={d.time} tone="orange" selected />
                </View>
                <Text style={styles.drillGoal}>{d.goal}</Text>

                <View style={{ marginTop: spacing.md }}>
                  {(d.steps || []).slice(0, 3).map((s, idx) => (
                    <Text key={`${d.id}:${idx}`} style={styles.stepBullet}>
                      • {s}
                    </Text>
                  ))}
                </View>

                <View style={styles.drillMetaRow}>
                  <Chip label={d.difficulty} />
                  <View style={{ flex: 1 }} />
                  <AppCard style={styles.addButton} onPress={() => onAdd(d)}>
                    <Plus size={16} color={colors.primary} strokeWidth={2.75} />
                  </AppCard>
                </View>
              </AppCard>
            );
          })}
        </View>

        <AppCard style={styles.videoCard} pressable={false}>
          <Text style={styles.sectionTitle}>Recommended videos</Text>
          <Text style={styles.sectionSub}>Quick links (stub for now)</Text>

          <View style={{ marginTop: spacing.md, gap: spacing.sm }}>
            {vids.map((v) => (
              <AppCard
                key={v.title}
                style={styles.videoRow}
                onPress={() => {
                  try {
                    Linking.openURL(v.url);
                  } catch (e) {
                    console.error(e);
                  }
                }}
              >
                <PlayCircle
                  size={18}
                  color={colors.primary}
                  strokeWidth={2.75}
                />
                <Text style={styles.videoTitle}>{v.title}</Text>
              </AppCard>
            ))}
          </View>
        </AppCard>

        <View style={{ marginTop: spacing.xl }}>
          <AppButton title="Share Results" onPress={onShare} />
        </View>
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
    paddingHorizontal: spacing.xl,
  },

  title: {
    fontSize: 28,
    lineHeight: 30,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: typography.base,
    lineHeight: 20,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },

  toast: {
    alignSelf: "flex-start",
    marginBottom: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.round,
    backgroundColor: colors.successSoft,
    borderWidth: 1,
    borderColor: "#CCF4DF",
  },
  toastText: {
    fontSize: typography.sm,
    fontFamily: typography.fontFamily.bold,
    color: colors.success,
  },

  drillCard: {
    backgroundColor: colors.surfaceWarm,
    borderColor: colors.border,
  },
  drillTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  drillName: {
    flex: 1,
    fontSize: 16,
    lineHeight: 18,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  drillGoal: {
    marginTop: 6,
    fontSize: typography.base,
    lineHeight: 19,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
  stepBullet: {
    marginTop: 6,
    fontSize: typography.base,
    lineHeight: 19,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
  },
  drillMetaRow: {
    marginTop: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: radius.round,
    alignItems: "center",
    justifyContent: "center",
    padding: 0,
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },

  videoCard: {
    marginTop: spacing.lg,
    backgroundColor: colors.surface,
    borderColor: colors.borderLight,
  },
  sectionTitle: {
    fontSize: 18,
    lineHeight: 20,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  sectionSub: {
    marginTop: 4,
    fontSize: typography.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
  videoRow: {
    paddingVertical: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  videoTitle: {
    flex: 1,
    fontSize: typography.base,
    lineHeight: 19,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textPrimary,
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
});
