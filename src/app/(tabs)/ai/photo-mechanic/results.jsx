import React, { useCallback, useMemo } from "react";
import { View, Text, StyleSheet, ScrollView, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { AlertTriangle, Sparkles } from "lucide-react-native";

import AppCard from "@/components/AppCard";
import AppButton from "@/components/AppButton";
import ConfidenceRing from "@/components/ConfidenceRing";
import Chip from "@/components/Chip";
import { colors, spacing, radius, typography } from "@/theme/index";
import { useChainlyStore } from "@/store/chainlyStore";
import {
  CATEGORY_LABELS,
  CATEGORY_COLORS,
  openGuide,
} from "@/utils/ai/photoMechanic";
import ScreenHeader from "@/components/layout/ScreenHeader";

function confidenceCopy(confidence) {
  const n = Number(confidence) || 0;
  if (n >= 80) return "Pretty sure";
  if (n >= 50) return "Likely";
  return "Not sure — confirm symptoms";
}

export default function PhotoMechanicResultsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const diagnosis = useChainlyStore((s) => s.currentDiagnosis);

  const category = diagnosis?.detectedCategory || "other";
  const categoryLabel = CATEGORY_LABELS[category] || "Other";
  const categoryColor = CATEGORY_COLORS[category] || colors.textSecondary;

  const descriptor = useMemo(
    () => confidenceCopy(diagnosis?.confidence),
    [diagnosis?.confidence],
  );

  const onStartFix = useCallback(() => {
    router.push("/ai/photo-mechanic/steps");
  }, [router]);

  const onParts = useCallback(() => {
    router.push("/ai/photo-mechanic/parts-tools");
  }, [router]);

  const onSave = useCallback(() => {
    router.push("/ai/photo-mechanic/save");
  }, [router]);

  const onGuide = useCallback(async () => {
    try {
      const g = diagnosis?.guides?.[0];
      if (!g?.url) {
        return;
      }
      await openGuide(g.url);
    } catch (e) {
      Alert.alert("Couldn’t open guide", "Try again in a moment.");
    }
  }, [diagnosis?.guides]);

  if (!diagnosis) {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" />
        <ScreenHeader title="Results" showBack />
        <View style={{ paddingHorizontal: spacing.xl }}>
          <Text style={styles.title}>No diagnosis yet</Text>
          <Text style={styles.subtitle}>Upload a photo to get a result.</Text>
        </View>
      </View>
    );
  }

  const title = diagnosis.diagnosisTitle || "Diagnosis";

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <ScreenHeader title="Results" showBack />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: insets.bottom + 28 }}
        showsVerticalScrollIndicator={false}
      >
        <AppCard style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroTitle}>{title}</Text>
              <View style={styles.badgeRow}>
                <Chip
                  label={categoryLabel}
                  tone="orange"
                  selected
                  style={{ borderColor: categoryColor }}
                  textStyle={{ color: categoryColor }}
                />
                <View style={{ width: spacing.sm }} />
                <Chip label={descriptor} selected tone="neutral" />
              </View>
            </View>

            <ConfidenceRing
              value={diagnosis.confidence}
              color={
                categoryColor === colors.textSecondary
                  ? colors.primary
                  : categoryColor
              }
              sublabel={descriptor}
            />
          </View>

          <View style={styles.photoSummaryRow}>
            <Image
              source={diagnosis.imageUri}
              style={styles.thumb}
              contentFit="cover"
              transition={150}
            />
            <Text style={styles.summary}>{diagnosis.summary}</Text>
          </View>

          {diagnosis.warnings?.length ? (
            <View style={styles.warningWrap}>
              <View style={styles.warningTop}>
                <View style={styles.warningIcon}>
                  <AlertTriangle
                    size={18}
                    color={colors.danger}
                    strokeWidth={2.5}
                  />
                </View>
                <Text style={styles.warningTitle}>Safety heads-up</Text>
              </View>
              {diagnosis.warnings.map((w) => (
                <Text key={w} style={styles.warningText}>
                  • {w}
                </Text>
              ))}
            </View>
          ) : null}

          <View style={styles.ctaRow}>
            <View style={{ flex: 1 }}>
              <AppButton title="Start Fix" onPress={onStartFix} />
            </View>
            <View style={{ flex: 1 }}>
              <AppButton
                title="See Parts & Tools"
                onPress={onParts}
                variant="secondary"
              />
            </View>
          </View>

          <View style={styles.ctaRow2}>
            <View style={{ flex: 1 }}>
              <AppButton
                title="Save for Later"
                onPress={onSave}
                variant="ghost"
              />
            </View>
            <View style={{ flex: 1 }}>
              <AppButton
                title="Open Guide"
                onPress={onGuide}
                variant="secondary"
              />
            </View>
          </View>

          <View style={styles.sparkleHint}>
            <Sparkles size={16} color={colors.primary} strokeWidth={2.5} />
            <Text style={styles.sparkleText}>
              Your mechanic friend is on it.
            </Text>
          </View>
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
  },

  heroCard: {
    backgroundColor: colors.surfaceWarm,
    borderColor: colors.border,
  },
  heroTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.lg,
  },
  heroTitle: {
    fontSize: 22,
    lineHeight: 24,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    letterSpacing: -0.4,
  },
  badgeRow: {
    marginTop: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },

  photoSummaryRow: {
    marginTop: spacing.lg,
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "center",
  },
  thumb: {
    width: 78,
    height: 78,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  summary: {
    flex: 1,
    fontSize: typography.base,
    lineHeight: 19,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textPrimary,
  },

  warningWrap: {
    marginTop: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.xl,
    backgroundColor: colors.dangerLight,
    borderWidth: 1,
    borderColor: "#FFD0CD",
  },
  warningTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  warningIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.round,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#FFD0CD",
  },
  warningTitle: {
    fontSize: 16,
    lineHeight: 18,
    fontFamily: typography.fontFamily.black,
    color: colors.danger,
  },
  warningText: {
    fontSize: typography.base,
    lineHeight: 19,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textPrimary,
    marginBottom: 6,
  },

  ctaRow: {
    marginTop: spacing.lg,
    flexDirection: "row",
    gap: spacing.md,
  },
  ctaRow2: {
    marginTop: spacing.sm,
    flexDirection: "row",
    gap: spacing.md,
  },

  sparkleHint: {
    marginTop: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  sparkleText: {
    fontSize: typography.sm,
    fontFamily: typography.fontFamily.bold,
    color: colors.textSecondary,
  },
});
