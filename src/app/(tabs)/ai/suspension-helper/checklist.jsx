import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  Pressable,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import {
  CheckCircle2,
  Circle,
  Timer,
  Sparkles,
  ChevronRight,
} from "lucide-react-native";

import AppCard from "@/components/AppCard";
import AppButton from "@/components/AppButton";
import { colors, spacing, radius, typography, shadows } from "@/theme/index";
import { useSuspensionStore } from "@/store/suspension";
import ScreenHeader from "@/components/layout/ScreenHeader";

const CHECKLIST = [
  {
    key: "sag",
    title: "Set sag",
    tip: "Aim for the baseline % — measure twice, pump once.",
    minutes: 5,
  },
  {
    key: "rebound",
    title: "Set rebound",
    tip: "Start at the baseline clicks. You’re just establishing a baseline feel.",
    minutes: 2,
  },
  {
    key: "compression",
    title: "Set compression",
    tip: "Think support vs comfort. We’ll tune on trail next.",
    minutes: 2,
  },
  {
    key: "recheck",
    title: "Check air pressure again",
    tip: "Pressure can change after cycling the suspension.",
    minutes: 1,
  },
  {
    key: "bounce",
    title: "Bounce test",
    tip: "A few curb drops or parking lot compressions. You’re checking balance front/rear.",
    minutes: 2,
  },
];

export default function AISuspensionChecklistScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const completed = useSuspensionStore((s) => s.session.checklistCompleted);
  const toggleChecklistItem = useSuspensionStore((s) => s.toggleChecklistItem);

  const total = CHECKLIST.length;
  const doneCount = useMemo(() => {
    return CHECKLIST.reduce(
      (acc, item) => (completed?.[item.key] ? acc + 1 : acc),
      0,
    );
  }, [completed]);

  const allDone = doneCount === total;

  const toastTimer = useRef(null);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message) => {
    setToast(message);
    if (toastTimer.current) {
      clearTimeout(toastTimer.current);
    }
    toastTimer.current = setTimeout(() => setToast(null), 1600);
  }, []);

  const onBack = useCallback(async () => {
    try {
      if (Platform.OS !== "web") {
        await Haptics.selectionAsync();
      }
    } catch (error) {
      console.error(error);
    }
    router.back();
  }, [router]);

  const onToggle = useCallback(
    async (key) => {
      try {
        await Haptics.selectionAsync();
      } catch (e) {
        // no-op
      }
      toggleChecklistItem(key);

      const nextDone = Boolean(!completed?.[key]);
      if (nextDone) {
        showToast("Nice. Keep rolling.");
      }
    },
    [completed, showToast, toggleChecklistItem],
  );

  const onGoRide = useCallback(async () => {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      // no-op
    }
    router.push("/ai/suspension-helper/adjuster");
  }, [router]);

  const onSkip = useCallback(() => {
    router.push("/ai/suspension-helper/adjuster");
  }, [router]);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <ScreenHeader title="Suspension Helper" showBack onBack={onBack} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: spacing.xl,
          paddingBottom: insets.bottom + 28,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Setup checklist</Text>
        <Text style={styles.subtitle}>
          Quick, calm, and effective. Do this once and tuning gets way easier.
        </Text>

        <AppCard
          style={[
            styles.progressCard,
            allDone ? styles.progressCardDone : null,
          ]}
        >
          <View style={styles.progressIcon}>
            <Sparkles size={16} color={colors.primary} strokeWidth={2.5} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.progressTitle}>
              {doneCount}/{total} complete
            </Text>
            <Text style={styles.progressSub}>
              {allDone
                ? "You’re ready to ride."
                : "One step at a time — you’ve got this."}
            </Text>
          </View>
          <ChevronRight
            size={18}
            color={colors.textSecondary}
            strokeWidth={2.75}
          />
        </AppCard>

        <View style={{ gap: spacing.md }}>
          {CHECKLIST.map((item) => {
            const isDone = Boolean(completed?.[item.key]);
            const Icon = isDone ? CheckCircle2 : Circle;
            const iconColor = isDone ? colors.success : colors.textSecondary;

            return (
              <AppCard
                key={item.key}
                style={[styles.stepCard, isDone ? styles.stepCardDone : null]}
                onPress={() => onToggle(item.key)}
              >
                <View style={styles.stepHeader}>
                  <View
                    style={[
                      styles.checkIcon,
                      isDone ? styles.checkIconDone : null,
                    ]}
                  >
                    <Icon size={18} color={iconColor} strokeWidth={2.75} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.stepTitle}>{item.title}</Text>
                    <Text style={styles.stepTip}>{item.tip}</Text>
                  </View>
                </View>

                <View style={styles.metaRow}>
                  <Timer
                    size={14}
                    color={colors.textSecondary}
                    strokeWidth={2.5}
                  />
                  <Text style={styles.metaText}>{item.minutes} min</Text>
                </View>
              </AppCard>
            );
          })}
        </View>

        <View style={{ height: spacing.xl }} />

        <View style={{ gap: spacing.sm }}>
          <AppButton title="Go Ride" onPress={onGoRide} />
          <Pressable onPress={onSkip} style={styles.skipLink} hitSlop={10}>
            <Text style={styles.skipText}>Skip to adjustments</Text>
          </Pressable>
        </View>
      </ScrollView>

      {toast ? (
        <View pointerEvents="none" style={styles.toastWrap}>
          <View style={styles.toastCard}>
            <Text style={styles.toastText}>{toast}</Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  title: {
    fontSize: 32,
    lineHeight: 34,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    letterSpacing: -0.6,
  },
  subtitle: {
    marginTop: spacing.sm,
    fontSize: typography.base,
    lineHeight: 20,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },

  progressCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surfaceWarm,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  progressCardDone: {
    backgroundColor: colors.successSoft,
    borderColor: "#CCF4DF",
  },
  progressIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.round,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.small,
  },
  progressTitle: {
    fontSize: 16,
    lineHeight: 18,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
  },
  progressSub: {
    marginTop: 4,
    fontSize: typography.sm,
    lineHeight: 17,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textSecondary,
  },

  stepCard: {
    backgroundColor: colors.surface,
    borderColor: colors.borderLight,
  },
  stepCardDone: {
    backgroundColor: colors.successSoft,
    borderColor: "#CCF4DF",
  },
  stepHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  checkIcon: {
    width: 34,
    height: 34,
    borderRadius: radius.round,
    backgroundColor: colors.surfaceWarm,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  checkIconDone: {
    backgroundColor: "#DDF7EA",
    borderColor: "#CCF4DF",
  },
  stepTitle: {
    fontSize: 16,
    lineHeight: 18,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  stepTip: {
    marginTop: 6,
    fontSize: typography.base,
    lineHeight: 19,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },

  metaRow: {
    marginTop: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaText: {
    fontSize: typography.sm,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textSecondary,
  },

  skipLink: {
    marginTop: spacing.sm,
    alignSelf: "center",
    paddingVertical: 8,
  },
  skipText: {
    fontSize: typography.sm,
    fontFamily: typography.fontFamily.black,
    color: colors.primary,
  },

  toastWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 24,
    alignItems: "center",
    paddingHorizontal: spacing.xl,
  },
  toastCard: {
    backgroundColor: colors.textPrimary,
    borderRadius: radius.round,
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    ...shadows.large,
  },
  toastText: {
    fontSize: typography.sm,
    fontFamily: typography.fontFamily.black,
    color: "#fff",
  },
});
