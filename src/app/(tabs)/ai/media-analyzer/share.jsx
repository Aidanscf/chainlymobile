import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  Share,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import * as Clipboard from "expo-clipboard";
import { Sparkles, Copy, Share2 } from "lucide-react-native";

import AppCard from "@/components/AppCard";
import AppButton from "@/components/AppButton";
import Chip from "@/components/Chip";
import { colors, spacing, radius, typography } from "@/theme/index";
import { useMediaAnalyzerStore } from "@/store/mediaAnalyzer";
import ScreenHeader from "@/components/layout/ScreenHeader";

export default function AIMediaAnalyzerShareScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();

  const getResultById = useMediaAnalyzerStore((s) => s.getResultById);

  const resultId = params?.resultId;

  const result = useMemo(() => {
    if (!resultId) {
      return null;
    }
    return getResultById(String(resultId));
  }, [getResultById, resultId]);

  const [toast, setToast] = useState(null);

  const shareText = useMemo(() => {
    const rt =
      result?.shareCardData?.ridingType || result?.ridingType || "Ride";
    const overall = Math.round(result?.overallScore || 0);
    const best = result?.shareCardData?.bestSubScore;
    const weak = result?.shareCardData?.weakestSubScore;

    const bestText = best ? `${best.name} ${Math.round(best.score)}` : "";
    const weakText = weak ? `${weak.name} ${Math.round(weak.score)}` : "";

    return `Chainly Analyzer Coach — ${rt}\nOverall: ${overall}/100\nBest: ${bestText}\nNext focus: ${weakText}`;
  }, [result]);

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

  const copy = useCallback(async () => {
    try {
      await Clipboard.setStringAsync(shareText);
      if (Platform.OS !== "web") {
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success,
        );
      }
      setToast("Copied");
      setTimeout(() => setToast(null), 1100);
    } catch (e) {
      console.error(e);
    }
  }, [shareText]);

  const share = useCallback(async () => {
    try {
      if (Platform.OS !== "web") {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      await Share.share({ message: shareText });
    } catch (e) {
      console.error(e);
    }
  }, [shareText]);

  if (!result) {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" />
        <ScreenHeader title="Share" showBack onBack={onBack} />
        <View style={{ paddingHorizontal: spacing.xl }}>
          <AppCard style={styles.emptyCard} pressable={false}>
            <Text style={styles.emptyTitle}>Nothing to share yet</Text>
            <Text style={styles.emptySub}>
              Go back to Results and try again.
            </Text>
          </AppCard>
        </View>
      </View>
    );
  }

  const data = result.shareCardData || {};
  const best = data.bestSubScore;
  const weak = data.weakestSubScore;

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <ScreenHeader title="Share" showBack onBack={onBack} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Share your results</Text>
        <Text style={styles.subtitle}>
          Quick and social. Screenshot-friendly.
        </Text>

        {toast ? (
          <View style={styles.toast}>
            <Text style={styles.toastText}>{toast}</Text>
          </View>
        ) : null}

        {/* Share card */}
        <View style={styles.shareFrame}>
          <View style={styles.shareCard}>
            <View style={styles.shareTopRow}>
              <View style={styles.brandBadge}>
                <Sparkles size={14} color={colors.primary} strokeWidth={2.5} />
                <Text style={styles.brandBadgeText}>Chainly</Text>
              </View>
              <Chip label={data.badge || "Coach Mode"} tone="orange" selected />
            </View>

            <Text style={styles.shareType}>
              {data.ridingType || result.ridingType}
            </Text>

            <View style={styles.shareScoreRow}>
              <Text style={styles.shareScore}>
                {Math.round(data.overallScore || 0)}
              </Text>
              <Text style={styles.shareScoreSuffix}>/100</Text>
            </View>

            <View style={styles.shareSplitRow}>
              <View style={styles.shareSplitCol}>
                <Text style={styles.shareLabel}>Best</Text>
                <Text style={styles.shareValue}>
                  {best ? `${best.name} ${Math.round(best.score)}` : "—"}
                </Text>
              </View>
              <View style={styles.shareSplitCol}>
                <Text style={styles.shareLabel}>Next focus</Text>
                <Text style={styles.shareValue}>
                  {weak ? `${weak.name} ${Math.round(weak.score)}` : "—"}
                </Text>
              </View>
            </View>

            <Text style={styles.shareFooter}>
              Analyzer Coach • built for progress
            </Text>
          </View>
        </View>

        <AppCard style={styles.tipCard} pressable={false}>
          <Text style={styles.tipTitle}>Pro tip</Text>
          <Text style={styles.tipSub}>
            For image sharing: take a screenshot of the card above, then share
            it.
          </Text>
        </AppCard>

        <View style={{ marginTop: spacing.lg }}>
          <AppButton title="Share" onPress={share} style={{}} />
          <View style={{ height: spacing.sm }} />
          <AppButton title="Copy text" onPress={copy} variant="secondary" />
        </View>

        <View style={styles.actionRow}>
          <AppCard style={styles.roundAction} onPress={share}>
            <Share2 size={18} color={colors.primary} strokeWidth={2.75} />
          </AppCard>
          <AppCard style={styles.roundAction} onPress={copy}>
            <Copy size={18} color={colors.primary} strokeWidth={2.75} />
          </AppCard>
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

  shareFrame: {
    borderRadius: radius.xxl,
    padding: 10,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primarySoft2,
  },
  shareCard: {
    borderRadius: radius.xxl,
    padding: spacing.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  shareTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  brandBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.round,
    backgroundColor: colors.surfaceWarm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  brandBadgeText: {
    fontSize: typography.sm,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    letterSpacing: -0.1,
  },
  shareType: {
    marginTop: spacing.lg,
    fontSize: 18,
    lineHeight: 20,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  shareScoreRow: {
    marginTop: spacing.md,
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
  },
  shareScore: {
    fontSize: 54,
    lineHeight: 54,
    fontFamily: typography.fontFamily.black,
    color: colors.primary,
    letterSpacing: -1.2,
  },
  shareScoreSuffix: {
    fontSize: 18,
    lineHeight: 20,
    fontFamily: typography.fontFamily.black,
    color: colors.textSecondary,
  },
  shareSplitRow: {
    marginTop: spacing.lg,
    flexDirection: "row",
    gap: spacing.md,
  },
  shareSplitCol: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceWarm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  shareLabel: {
    fontSize: 12,
    fontFamily: typography.fontFamily.bold,
    color: colors.textSecondary,
    letterSpacing: -0.1,
  },
  shareValue: {
    marginTop: 6,
    fontSize: typography.base,
    lineHeight: 19,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  shareFooter: {
    marginTop: spacing.lg,
    fontSize: 12,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textTertiary,
  },

  tipCard: {
    marginTop: spacing.lg,
    backgroundColor: colors.surfaceWarm,
    borderColor: colors.border,
  },
  tipTitle: {
    fontSize: 15,
    lineHeight: 17,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  tipSub: {
    marginTop: 6,
    fontSize: typography.base,
    lineHeight: 19,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },

  actionRow: {
    marginTop: spacing.md,
    flexDirection: "row",
    gap: spacing.md,
  },
  roundAction: {
    flex: 1,
    height: 52,
    borderRadius: radius.round,
    alignItems: "center",
    justifyContent: "center",
    padding: 0,
    backgroundColor: colors.surface,
    borderColor: colors.border,
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
