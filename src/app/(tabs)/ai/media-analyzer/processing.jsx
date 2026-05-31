import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { View, Text, StyleSheet, ScrollView, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Sparkles } from "lucide-react-native";

import ScreenHeader from "@/components/layout/ScreenHeader";
import AppCard from "@/components/AppCard";
import AppButton from "@/components/AppButton";
import Stepper from "@/components/analysis/Stepper";
import { colors, spacing, radius, typography } from "@/theme/index";
import { startAnalysisJob } from "@/utils/analyzerJob";
import { useMediaAnalyzerStore } from "@/store/mediaAnalyzer";

export default function AIMediaAnalyzerProcessingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const draft = useMediaAnalyzerStore((s) => s.draft);
  const addResult = useMediaAnalyzerStore((s) => s.addResult);
  const getLastResultByType = useMediaAnalyzerStore(
    (s) => s.getLastResultByType,
  );

  const [progress, setProgress] = useState(0);
  const [steps, setSteps] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [error, setError] = useState(null);

  const jobRef = useRef(null);

  const pctText = useMemo(() => `${Math.round(progress)}%`, [progress]);

  const playfulLine = useMemo(() => {
    if (activeIndex === 0) return "Warming up the upload…";
    if (activeIndex === 1) return "Finding rider + bike…";
    if (activeIndex === 2) return "Measuring movement & form…";
    if (activeIndex === 3) return "Scoring + picking drills…";
    return "Final polish…";
  }, [activeIndex]);

  const onCancel = useCallback(async () => {
    try {
      jobRef.current?.cancel?.();
      if (Platform.OS !== "web") {
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Warning,
        );
      }
    } catch (e) {
      console.error(e);
    }
    router.replace("/ai/media-analyzer");
  }, [router]);

  const onBack = useCallback(async () => {
    // Treat back as cancel (prevents half-finished jobs / weird state)
    await onCancel();
  }, [onCancel]);

  useEffect(() => {
    let mounted = true;

    async function run() {
      try {
        setError(null);

        if (!draft?.mediaUri || !draft?.mediaType || !draft?.ridingType) {
          router.replace("/ai/media-analyzer");
          return;
        }

        const previous = getLastResultByType(draft.ridingType);

        const job = startAnalysisJob({
          mediaUri: draft.mediaUri,
          mediaType: draft.mediaType,
          ridingType: draft.ridingType,
          options: draft.options || {},
          previousResult: previous,
          onProgress: ({ progress: p, stepIndex, steps: s }) => {
            if (!mounted) {
              return;
            }
            setProgress(p);
            setActiveIndex(stepIndex);
            setSteps(s);
          },
        });

        jobRef.current = job;

        const result = await job.done;
        if (!mounted) {
          return;
        }

        addResult(result);

        try {
          if (Platform.OS !== "web") {
            await Haptics.notificationAsync(
              Haptics.NotificationFeedbackType.Success,
            );
          }
        } catch (e) {
          console.error(e);
        }

        router.replace(`/ai/media-analyzer/results?resultId=${result.id}`);
      } catch (e) {
        if (!mounted) {
          return;
        }
        console.error(e);
        setError(String(e?.message || "Analysis failed"));
      }
    }

    run();

    return () => {
      mounted = false;
      try {
        jobRef.current?.cancel?.();
      } catch (e) {
        console.error(e);
      }
    };
  }, [addResult, draft, getLastResultByType, router]);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <ScreenHeader title="Analyzing" showBack onBack={onBack} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
      >
        <AppCard style={styles.heroCard} pressable={false}>
          <View style={styles.heroBadge}>
            <Sparkles size={16} color={colors.primary} strokeWidth={2.5} />
            <Text style={styles.heroBadgeText}>Analyzer job</Text>
          </View>

          <Text style={styles.title}>Dialing in your form…</Text>
          <Text style={styles.subtitle}>{playfulLine}</Text>

          <View style={styles.progressRow}>
            <Text style={styles.progressPct}>{pctText}</Text>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
          </View>

          <Stepper steps={steps} activeIndex={activeIndex} />

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorTitle}>Couldn’t finish analysis</Text>
              <Text style={styles.errorText}>{error}</Text>
              <View style={{ marginTop: spacing.md }}>
                <AppButton title="Back to Upload" onPress={onCancel} />
              </View>
            </View>
          ) : (
            <View style={{ marginTop: spacing.xl }}>
              <AppButton
                title="Cancel"
                onPress={onCancel}
                variant="secondary"
              />
            </View>
          )}
        </AppCard>
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

  title: {
    fontSize: 24,
    lineHeight: 26,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    letterSpacing: -0.4,
  },
  subtitle: {
    marginTop: 6,
    fontSize: typography.base,
    lineHeight: 19,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },

  progressRow: {
    marginTop: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  progressPct: {
    width: 52,
    fontSize: typography.sm,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
  },
  progressTrack: {
    flex: 1,
    height: 12,
    borderRadius: radius.round,
    backgroundColor: colors.borderLight,
    overflow: "hidden",
  },
  progressFill: {
    height: 12,
    borderRadius: radius.round,
    backgroundColor: colors.primary,
  },

  errorBox: {
    marginTop: spacing.xl,
    padding: spacing.lg,
    borderRadius: radius.xl,
    backgroundColor: colors.dangerLight,
    borderWidth: 1,
    borderColor: colors.border,
  },
  errorTitle: {
    fontSize: 15,
    lineHeight: 17,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
  },
  errorText: {
    marginTop: 6,
    fontSize: typography.sm,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textSecondary,
  },
});
