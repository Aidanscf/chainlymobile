import React, { useCallback, useMemo } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Sparkles } from "lucide-react-native";

import AppCard from "@/components/AppCard";
import AppButton from "@/components/AppButton";
import Chip from "@/components/Chip";
import { colors, spacing, radius, typography } from "@/theme/index";
import { useChainlyStore } from "@/store/chainlyStore";
import {
  CATEGORY_LABELS,
  CATEGORY_COLORS,
  SYMPTOMS_BY_CATEGORY,
} from "@/utils/ai/photoMechanic";
import ScreenHeader from "@/components/layout/ScreenHeader";

export default function PhotoMechanicContextScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const diagnosis = useChainlyStore((s) => s.currentDiagnosis);
  const toggleSymptom = useChainlyStore((s) => s.toggleSymptom);

  const category = diagnosis?.detectedCategory || "other";
  const categoryLabel = CATEGORY_LABELS[category] || "Other";
  const categoryColor = CATEGORY_COLORS[category] || colors.textSecondary;

  const symptomsSelected = diagnosis?.symptomsSelected || [];

  const symptomGroups = useMemo(() => {
    const groups = Object.keys(SYMPTOMS_BY_CATEGORY).map((cat) => {
      const isSuggested = cat === category;
      return {
        title: CATEGORY_LABELS[cat] || cat,
        items: SYMPTOMS_BY_CATEGORY[cat],
        tone: isSuggested ? "orange" : "neutral",
        suggested: isSuggested,
      };
    });

    groups.push({
      title: "Not sure",
      items: ["Not sure"],
      tone: "neutral",
      suggested: false,
    });

    return groups;
  }, [category]);

  const onConfirm = useCallback(() => {
    router.push("/ai/photo-mechanic/results");
  }, [router]);

  if (!diagnosis) {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" />
        <ScreenHeader title="Context" showBack />
        <View style={{ paddingHorizontal: spacing.xl }}>
          <Text style={styles.title}>No photo yet</Text>
          <Text style={styles.subtitle}>Go back and upload a photo first.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <ScreenHeader title="Context" showBack />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: insets.bottom + 28 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>What feels off?</Text>
        <Text style={styles.subtitle}>
          This helps me avoid bad guesses. Pick what you’re actually feeling.
        </Text>

        <AppCard style={styles.suggestCard}>
          <View style={styles.suggestTop}>
            <View style={styles.suggestBadge}>
              <Sparkles size={14} color={colors.primary} strokeWidth={2.5} />
              <Text style={styles.suggestBadgeText}>Suggestion</Text>
            </View>
            <View
              style={[
                styles.categoryPill,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.categoryText, { color: categoryColor }]}>
                Looks like: {categoryLabel}
              </Text>
            </View>
          </View>

          <View style={styles.photoRow}>
            <Image
              source={diagnosis.imageUri}
              style={styles.thumb}
              contentFit="cover"
              transition={150}
            />
            <Text style={styles.photoHint}>
              If this is the wrong area, go back and pick a clearer photo.
            </Text>
          </View>
        </AppCard>

        <View style={{ height: spacing.lg }} />

        {symptomGroups.map((g) => (
          <View key={g.title} style={{ marginBottom: spacing.lg }}>
            <View style={styles.groupTitleRow}>
              <Text style={styles.groupTitle}>{g.title}</Text>
              {g.suggested ? (
                <View style={styles.suggestTag}>
                  <Text style={styles.suggestTagText}>Suggested</Text>
                </View>
              ) : null}
            </View>
            <View style={styles.chipsWrap}>
              {g.items.map((s) => {
                const selected = symptomsSelected.includes(s);
                return (
                  <Chip
                    key={s}
                    label={s}
                    selected={selected}
                    tone={g.tone}
                    onPress={() => toggleSymptom(s)}
                    style={styles.chip}
                  />
                );
              })}
            </View>
          </View>
        ))}

        <AppButton title="Confirm Symptoms" onPress={onConfirm} />
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
    marginBottom: spacing.lg,
  },

  suggestCard: {
    backgroundColor: colors.surfaceWarm,
    borderColor: colors.border,
  },
  suggestTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  suggestBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.round,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primarySoft2,
  },
  suggestBadgeText: {
    fontSize: typography.xs,
    fontFamily: typography.fontFamily.black,
    color: colors.primary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  categoryPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.round,
    borderWidth: 1,
  },
  categoryText: {
    fontSize: typography.sm,
    fontFamily: typography.fontFamily.bold,
  },

  photoRow: {
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
  photoHint: {
    flex: 1,
    fontSize: typography.base,
    lineHeight: 19,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textSecondary,
  },

  groupTitle: {
    fontSize: 16,
    lineHeight: 18,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  chipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  chip: {
    marginBottom: 0,
  },
  groupTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  suggestTag: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.round,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primarySoft2,
  },
  suggestTagText: {
    fontSize: typography.xs,
    fontFamily: typography.fontFamily.black,
    color: colors.primary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
