import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  Modal,
  Pressable,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Lock, Sparkles, ArrowUpRight, X } from "lucide-react-native";

import AppCard from "@/components/AppCard";
import AppButton from "@/components/AppButton";
import Chip from "@/components/Chip";
import ScoreRing from "@/components/analysis/ScoreRing";
import SubScoreRow from "@/components/analysis/SubScoreRow";
import { colors, spacing, radius, typography } from "@/theme/index";
import { useMediaAnalyzerStore } from "@/store/mediaAnalyzer";
import ScreenHeader from "@/components/layout/ScreenHeader";

function confidenceLabel(conf) {
  const c = Number(conf) || 0;
  if (c >= 85) return "High confidence";
  if (c >= 70) return "Medium confidence";
  return "Low confidence";
}

function confidenceTone(conf) {
  const c = Number(conf) || 0;
  if (c >= 85) return "green";
  if (c >= 70) return "orange";
  return "red";
}

export default function AIMediaAnalyzerResultsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();

  const getResultById = useMediaAnalyzerStore((s) => s.getResultById);
  const results = useMediaAnalyzerStore((s) => s.results);
  const getLastResultByType = useMediaAnalyzerStore(
    (s) => s.getLastResultByType,
  );

  const resultId = params?.resultId;

  const result = useMemo(() => {
    if (resultId) {
      return getResultById(String(resultId));
    }
    return (results || [])[0] || null;
  }, [getResultById, resultId, results]);

  const previous = useMemo(() => {
    if (!result?.ridingType) {
      return null;
    }
    return getLastResultByType(result.ridingType, result.id);
  }, [getLastResultByType, result?.id, result?.ridingType]);

  const delta = useMemo(() => {
    if (!previous) {
      return null;
    }
    const d =
      (Number(result?.overallScore) || 0) -
      (Number(previous.overallScore) || 0);
    return Math.round(d);
  }, [previous, result?.overallScore]);

  const [selectedSub, setSelectedSub] = useState(null);
  const [showPro, setShowPro] = useState(false);

  const onBack = useCallback(async () => {
    try {
      if (Platform.OS !== "web") {
        await Haptics.selectionAsync();
      }
    } catch (e) {
      console.error(e);
    }
    router.replace("/ai/media-analyzer");
  }, [router]);

  const openSubScore = useCallback(async (sub) => {
    try {
      if (Platform.OS !== "web") {
        await Haptics.selectionAsync();
      }
    } catch (e) {
      console.error(e);
    }
    setSelectedSub(sub);
  }, []);

  const closeSubScore = useCallback(() => {
    setSelectedSub(null);
  }, []);

  const onDrills = useCallback(async () => {
    if (!result?.id) {
      return;
    }
    try {
      if (Platform.OS !== "web") {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    } catch (e) {
      console.error(e);
    }
    router.push(`/ai/media-analyzer/drills?resultId=${result.id}`);
  }, [result?.id, router]);

  const onShare = useCallback(async () => {
    if (!result?.id) {
      return;
    }
    try {
      if (Platform.OS !== "web") {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (e) {
      console.error(e);
    }
    router.push(`/ai/media-analyzer/share?resultId=${result.id}`);
  }, [result?.id, router]);

  const onCompare = useCallback(async () => {
    try {
      if (Platform.OS !== "web") {
        await Haptics.selectionAsync();
      }
    } catch (e) {
      console.error(e);
    }

    // For MVP we keep compare as an inline card. Just scroll users’ eyes to it.
  }, []);

  if (!result) {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" />
        <ScreenHeader title="Analyzer Coach" showBack onBack={onBack} />

        <View style={{ paddingHorizontal: spacing.xl }}>
          <AppCard style={styles.emptyCard} pressable={false}>
            <Text style={styles.emptyTitle}>No results yet</Text>
            <Text style={styles.emptySub}>
              Run an analysis and it’ll show up here.
            </Text>
            <View style={{ marginTop: spacing.lg }}>
              <AppButton
                title="Start"
                onPress={() => router.replace("/ai/media-analyzer")}
              />
            </View>
          </AppCard>
        </View>
      </View>
    );
  }

  const confidenceText = confidenceLabel(result.confidence);
  const confTone = confidenceTone(result.confidence);

  const deltaText =
    delta === null ? null : delta >= 0 ? `+${delta}` : `${delta}`;

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <ScreenHeader title="Analyzer Coach" showBack onBack={onBack} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Results</Text>
        <Text style={styles.subtitle}>
          {result.ridingType} •{" "}
          {new Date(result.createdAt).toLocaleDateString()}
        </Text>

        <AppCard style={styles.heroCard} pressable={false}>
          <View style={styles.heroBadge}>
            <Sparkles size={16} color={colors.primary} strokeWidth={2.5} />
            <Text style={styles.heroBadgeText}>Overall score</Text>
          </View>

          <ScoreRing score={result.overallScore} size={150} />

          <View style={{ marginTop: spacing.lg, alignItems: "center" }}>
            <Chip label={confidenceText} tone={confTone} selected />
          </View>

          <Text style={styles.summary}>
            {result.summary ||
              "Nice work — let’s turn this into a clean repeat."}
          </Text>

          {previous ? (
            <View style={styles.compareCard}>
              <View style={styles.compareRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.compareTitle}>Compared to last time</Text>
                  <Text style={styles.compareSub}>
                    Wins: {Array.isArray(result.keyWins) ? result.keyWins.join(", ") : "N/A"}
                  </Text>
                </View>
                <View style={styles.deltaPill}>
                  <ArrowUpRight
                    size={14}
                    color={colors.primary}
                    strokeWidth={2.75}
                  />
                  <Text style={styles.deltaText}>{deltaText}</Text>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.compareCard}>
              <Text style={styles.compareTitle}>First attempt logged</Text>
              <Text style={styles.compareSub}>
                Run this again in a week — you’ll see your progress pop.
              </Text>
            </View>
          )}

          <View style={styles.actionGroup}>
            <AppButton title="Get Drills" onPress={onDrills} />
            <View style={styles.secondaryActions}>
              <View style={{ flex: 1 }}>
                <AppButton title="Share" onPress={onShare} variant="secondary" />
              </View>
              <View style={{ flex: 1 }}>
                <AppButton
                  title="Compare"
                  onPress={onCompare}
                  variant="ghost"
                />
              </View>
            </View>
          </View>
        </AppCard>

        <AppCard style={styles.subScoresCard} pressable={false}>
          <Text style={styles.sectionTitle}>Sub-scores</Text>
          <Text style={styles.sectionSub}>
            Tap one to get a quick fix + drill.
          </Text>

          <View style={{ marginTop: spacing.lg, gap: spacing.md }}>
            {(result.subScores || []).map((s, idx) => {
              return (
                <AppCard
                  key={`${s.key}:${idx}`}
                  style={styles.subScoreRowCard}
                  padding={0}
                  onPress={() => openSubScore(s)}
                >
                  <SubScoreRow
                    name={s.name}
                    score={s.score}
                    onPress={() => openSubScore(s)}
                  />
                </AppCard>
              );
            })}
          </View>
        </AppCard>
      </ScrollView>

      {/* Sub-score detail bottom sheet (simple modal MVP) */}
      <Modal visible={Boolean(selectedSub)} transparent animationType="slide">
        <Pressable style={styles.modalOverlay} onPress={closeSubScore} />
        <View
          style={[styles.modalSheet, { paddingBottom: insets.bottom + 16 }]}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{selectedSub?.name}</Text>
            <Pressable onPress={closeSubScore} hitSlop={10}>
              <X size={18} color={colors.textSecondary} strokeWidth={2.75} />
            </Pressable>
          </View>

          <Text style={styles.modalScore}>
            {Math.round(selectedSub?.score || 0)}/100
          </Text>

          <Text style={styles.modalSection}>Key cues</Text>
          {(selectedSub?.tips || []).slice(0, 2).map((t, idx) => (
            <Text key={`${t}:${idx}`} style={styles.modalBullet}>
              • {t}
            </Text>
          ))}

          <Text style={[styles.modalSection, { marginTop: spacing.md }]}>
            1 drill
          </Text>
          <Text style={styles.modalBullet}>
            • {selectedSub?.drill || "Focus reps"}
          </Text>

          <Text style={[styles.modalSection, { marginTop: spacing.md }]}>
            Common mistake
          </Text>
          <Text style={styles.modalBullet}>
            • {selectedSub?.commonMistake || "Overthinking it"}
          </Text>

          <View style={{ marginTop: spacing.xl }}>
            <AppButton title="Got it" onPress={closeSubScore} />
          </View>
        </View>
      </Modal>

      {/* Pro gate modal (optional) */}
      <Modal visible={showPro} transparent animationType="fade">
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowPro(false)}
        />
        <View
          style={[styles.proModalCard, { marginBottom: insets.bottom + 24 }]}
        >
          <Text style={styles.proModalTitle}>Unlock advanced coaching</Text>
          <Text style={styles.proModalSub}>
            Get frame-by-frame notes, more drills, and a weekly plan built from
            your weakest areas.
          </Text>
          <View style={{ marginTop: spacing.lg }}>
            <AppButton
              title="Continue Free"
              onPress={() => setShowPro(false)}
              variant="secondary"
            />
            <View style={{ height: spacing.sm }} />
            <AppButton
              title="Upgrade (stub)"
              onPress={() => setShowPro(false)}
            />
          </View>
        </View>
      </Modal>
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
    fontFamily: typography.fontFamily.semibold,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },

  heroCard: {
    backgroundColor: colors.surfaceWarm,
    borderColor: colors.border,
  },
  heroBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.round,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primarySoft2,
    marginBottom: spacing.md,
  },
  heroBadgeText: {
    fontSize: typography.sm,
    fontFamily: typography.fontFamily.bold,
    color: colors.primary,
  },
  summary: {
    marginTop: spacing.lg,
    fontSize: typography.base,
    lineHeight: 20,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
    textAlign: "center",
  },

  compareCard: {
    marginTop: spacing.xl,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceWarm,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  compareRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  compareTitle: {
    fontSize: 15,
    lineHeight: 17,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  deltaPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.round,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primarySoft2,
  },
  deltaText: {
    fontSize: typography.sm,
    fontFamily: typography.fontFamily.black,
    color: colors.primary,
  },
  compareSub: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 16,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textSecondary,
  },
  actionGroup: {
    marginTop: spacing.xl,
    gap: spacing.sm,
  },
  secondaryActions: {
    flexDirection: "row",
    gap: spacing.sm,
  },

  subScoresCard: {
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
  subScoreRowCard: {
    backgroundColor: colors.surfaceWarm,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: radius.lg,
    overflow: "hidden",
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
  },

  proCard: {
    marginTop: spacing.lg,
    backgroundColor: colors.surfaceWarm,
    borderColor: colors.border,
  },
  proRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  proIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.round,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primarySoft2,
    alignItems: "center",
    justifyContent: "center",
  },
  proTitle: {
    fontSize: 16,
    lineHeight: 18,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  proSub: {
    marginTop: 4,
    fontSize: typography.sm,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textSecondary,
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

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  modalSheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  modalTitle: {
    fontSize: 18,
    lineHeight: 20,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  modalScore: {
    marginTop: spacing.md,
    fontSize: 28,
    lineHeight: 30,
    fontFamily: typography.fontFamily.black,
    color: colors.primary,
    letterSpacing: -0.6,
  },
  modalSection: {
    marginTop: spacing.lg,
    fontSize: 14,
    lineHeight: 16,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    letterSpacing: -0.1,
  },
  modalBullet: {
    marginTop: 8,
    fontSize: typography.base,
    lineHeight: 19,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },

  proModalCard: {
    position: "absolute",
    left: spacing.xl,
    right: spacing.xl,
    bottom: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: radius.xxl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
  },
  proModalTitle: {
    fontSize: 18,
    lineHeight: 20,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  proModalSub: {
    marginTop: 8,
    fontSize: typography.base,
    lineHeight: 20,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
});
