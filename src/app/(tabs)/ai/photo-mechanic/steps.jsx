import React, { useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { ShieldAlert, CheckCircle2, Circle } from "lucide-react-native";

import AppCard from "@/components/AppCard";
import AppButton from "@/components/AppButton";
import Chip from "@/components/Chip";
import { colors, spacing, radius, typography } from "@/theme/index";
import { useChainlyStore } from "@/store/chainlyStore";
import { openGuide } from "@/utils/ai/photoMechanic";
import ScreenHeader from "@/components/layout/ScreenHeader";

function safetyTone(level) {
  if (level === "high") return "red";
  if (level === "med") return "orange";
  return "green";
}

function safetyLabel(level) {
  if (level === "high") return "High";
  if (level === "med") return "Med";
  return "Low";
}

export default function PhotoMechanicStepsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const diagnosis = useChainlyStore((s) => s.currentDiagnosis);
  const toggleStep = useChainlyStore((s) => s.toggleFixStepCompleted);

  const steps = diagnosis?.fixSteps || [];

  const topNote = useMemo(() => {
    if (!diagnosis?.warnings?.length) {
      return "Take it slow. Do a low-speed test after any fix.";
    }
    return diagnosis.warnings[0];
  }, [diagnosis?.warnings]);

  const onNext = useCallback(() => {
    router.push("/ai/photo-mechanic/parts-tools");
  }, [router]);

  const onOpenGuide = useCallback(async () => {
    try {
      const g = diagnosis?.guides?.[0];
      if (!g?.url) return;
      await openGuide(g.url);
    } catch (e) {
      Alert.alert("Couldn’t open guide", "Try again in a moment.");
    }
  }, [diagnosis?.guides]);

  if (!diagnosis) {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" />
        <ScreenHeader title="Fix Steps" showBack />
        <View style={{ paddingHorizontal: spacing.xl }}>
          <Text style={styles.title}>No steps yet</Text>
          <Text style={styles.subtitle}>Go back to Results first.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <ScreenHeader title="Fix Steps" showBack />

      <View style={{ flex: 1 }}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={{ paddingBottom: (insets.bottom || 0) + 120 }}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Let’s get you rolling</Text>
          <Text style={styles.subtitle}>
            Check them off as you go. You’ve got this.
          </Text>

          <AppCard style={styles.beforeCard}>
            <View style={styles.beforeTop}>
              <View style={styles.beforeIcon}>
                <ShieldAlert
                  size={18}
                  color={colors.primary}
                  strokeWidth={2.5}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.beforeTitle}>Before you start</Text>
                <Text style={styles.beforeText}>{topNote}</Text>
              </View>
            </View>
            <AppButton
              title="Open Guide"
              onPress={onOpenGuide}
              variant="secondary"
            />
          </AppCard>

          <View style={{ height: spacing.lg }} />

          {steps.map((s, idx) => {
            const Icon = s.completed ? CheckCircle2 : Circle;
            const iconColor = s.completed
              ? colors.success
              : colors.textTertiary;
            const chipTone = safetyTone(s.safetyLevel);

            return (
              <AppCard
                key={`${idx}_${s.title}`}
                style={styles.stepCard}
                onPress={() => toggleStep(idx)}
              >
                <View style={styles.stepTop}>
                  <Icon size={22} color={iconColor} strokeWidth={2.5} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.stepTitle}>{s.title}</Text>
                    <Text style={styles.stepDetail}>{s.detail}</Text>
                  </View>
                </View>

                <View style={styles.stepMeta}>
                  <Chip
                    label={`${s.estimatedTimeMin} min`}
                    selected
                    tone="neutral"
                  />
                  <Chip
                    label={`${safetyLabel(s.safetyLevel)} safety`}
                    selected
                    tone={chipTone}
                  />
                </View>
              </AppCard>
            );
          })}
        </ScrollView>

        <View
          style={[styles.sticky, { paddingBottom: (insets.bottom || 0) + 16 }]}
        >
          <AppButton title="Next: Parts & Tools" onPress={onNext} />
        </View>
      </View>
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
    fontSize: 24,
    lineHeight: 26,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    letterSpacing: -0.4,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.base,
    lineHeight: 20,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },

  beforeCard: {
    backgroundColor: colors.surfaceWarm,
    borderColor: colors.border,
  },
  beforeTop: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "flex-start",
    marginBottom: spacing.md,
  },
  beforeIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.round,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primarySoft2,
    alignItems: "center",
    justifyContent: "center",
  },
  beforeTitle: {
    fontSize: 16,
    lineHeight: 18,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
  },
  beforeText: {
    marginTop: 4,
    fontSize: typography.base,
    lineHeight: 19,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textSecondary,
  },

  stepCard: {
    marginBottom: spacing.md,
  },
  stepTop: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "flex-start",
  },
  stepTitle: {
    fontSize: 16,
    lineHeight: 18,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  stepDetail: {
    marginTop: 4,
    fontSize: typography.base,
    lineHeight: 19,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
  stepMeta: {
    marginTop: spacing.md,
    flexDirection: "row",
    gap: spacing.sm,
    flexWrap: "wrap",
  },

  sticky: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.xl,
    paddingTop: 10,
    backgroundColor: "rgba(247,243,238,0.95)",
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
});
