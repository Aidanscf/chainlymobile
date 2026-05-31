import React, { useCallback, useMemo } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Sparkles } from "lucide-react-native";

import { colors, spacing, typography, radius, shadows } from "@/theme/index";
import AppCard from "@/components/AppCard";
import AppButton from "@/components/AppButton";
import Chip from "@/components/Chip";
import { useGearStore } from "@/store/gearStore";
import ScreenHeader from "@/components/layout/ScreenHeader";

function SpecRow({ label, left, right, highlightLeft, highlightRight }) {
  return (
    <View style={styles.specRow}>
      <Text style={styles.specLabel}>{label}</Text>
      <View style={styles.specCols}>
        <View style={[styles.specCell, highlightLeft && styles.bestCell]}>
          <Text style={styles.specValue}>{left || "—"}</Text>
        </View>
        <View style={[styles.specCell, highlightRight && styles.bestCell]}>
          <Text style={styles.specValue}>{right || "—"}</Text>
        </View>
      </View>
    </View>
  );
}

function safeText(x) {
  return String(x ?? "").trim();
}

function firstNonEmpty(list) {
  const arr = Array.isArray(list) ? list : [];
  for (const item of arr) {
    const t = safeText(item);
    if (t) {
      return t;
    }
  }
  return "";
}

function shortWhyText(why) {
  const w = safeText(why);
  if (!w) {
    return "";
  }

  // Prefer the first paragraph/line.
  const first =
    w
      .split("\n")
      .map((s) => safeText(s))
      .filter(Boolean)[0] || "";
  if (first.length <= 80) {
    return first;
  }
  return `${first.slice(0, 77)}…`;
}

export default function GearCompareScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const compare = useGearStore((s) => s.compare);
  const top = compare?.left || null;
  const right = compare?.right || null;

  const onBack = useCallback(() => router.back(), [router]);

  const best = useMemo(() => {
    const leftScore = Math.round(top?.match || 0);
    const rightScore = Math.round(right?.match || 0);
    if (rightScore > leftScore) {
      return "right";
    }
    return "left";
  }, [right, top]);

  const onChoose = useCallback(async () => {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      // no-op
    }

    const chosen = best === "right" ? right : top;
    if (!chosen) {
      return;
    }
    router.push({
      pathname: "/ai/gear-recommender/save",
      params: { productId: chosen.id },
    });
  }, [best, right, router, top]);

  if (!top || !right) {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" />
        <ScreenHeader title="Compare" showBack />
        <View style={{ padding: spacing.xl }}>
          <Text style={styles.title}>Compare</Text>
          <Text style={styles.subtitle}>
            Pick an alternative from Results first.
          </Text>
          <AppButton title="Back" onPress={onBack} />
        </View>
      </View>
    );
  }

  const leftIsBest = best === "left";
  const rightIsBest = best === "right";

  // Build better compare rows using whatever we already have (no fetching).
  const leftAttrs =
    top?.attrs && typeof top.attrs === "object" ? top.attrs : {};
  const rightAttrs =
    right?.attrs && typeof right.attrs === "object" ? right.attrs : {};

  const leftCompat =
    safeText(leftAttrs?.compatibility) ||
    safeText(top?.compatibility?.reason) ||
    (top?.compatibility?.compatible === false ? "Check fit" : "Looks good");

  const rightCompat =
    safeText(rightAttrs?.compatibility) ||
    safeText(right?.compatibility?.reason) ||
    (right?.compatibility?.compatible === false ? "Check fit" : "Looks good");

  const leftTrust = firstNonEmpty(top?.trust);
  const rightTrust = firstNonEmpty(right?.trust);

  const leftWhy = shortWhyText(top?.why);
  const rightWhy = shortWhyText(right?.why);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScreenHeader title="Compare" showBack />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: spacing.xl,
          paddingBottom: insets.bottom + 28,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Compare picks</Text>
        <Text style={styles.subtitle}>
          Keep it clean. Choose the one that fits you best.
        </Text>

        <View style={{ flexDirection: "row", gap: spacing.md }}>
          <AppCard
            style={[styles.pickCard, leftIsBest && styles.bestCard]}
            padding={spacing.lg}
          >
            <Chip
              label={`${Math.round(top.match || 0)}% Match`}
              tone="orange"
              selected
            />
            <Text style={styles.pickName} numberOfLines={2}>
              {top.name}
            </Text>
            <Text style={styles.pickPrice}>{top.price}</Text>
            {leftIsBest ? (
              <View style={styles.bestBadge}>
                <Sparkles size={14} color={colors.primary} strokeWidth={2.75} />
                <Text style={styles.bestBadgeText}>Best for you</Text>
              </View>
            ) : null}
          </AppCard>

          <AppCard
            style={[styles.pickCard, rightIsBest && styles.bestCard]}
            padding={spacing.lg}
          >
            <Chip
              label={`${Math.round(right.match || 0)}% Match`}
              tone="orange"
              selected
            />
            <Text style={styles.pickName} numberOfLines={2}>
              {right.name}
            </Text>
            <Text style={styles.pickPrice}>{right.price}</Text>
            {rightIsBest ? (
              <View style={styles.bestBadge}>
                <Sparkles size={14} color={colors.primary} strokeWidth={2.75} />
                <Text style={styles.bestBadgeText}>Best for you</Text>
              </View>
            ) : null}
          </AppCard>
        </View>

        <View style={{ height: spacing.xl }} />

        <AppCard
          padding={spacing.lg}
          style={{
            backgroundColor: colors.surfaceWarm,
            borderColor: colors.border,
          }}
        >
          <Text style={styles.compareTitle}>Key differences</Text>

          <SpecRow
            label="Why this fits"
            left={leftWhy}
            right={rightWhy}
            highlightLeft={leftIsBest}
            highlightRight={rightIsBest}
          />

          <SpecRow
            label="Fit / Trust"
            left={leftTrust}
            right={rightTrust}
            highlightLeft={leftIsBest}
            highlightRight={rightIsBest}
          />

          <SpecRow
            label="Compatibility"
            left={leftCompat}
            right={rightCompat}
            highlightLeft={leftIsBest}
            highlightRight={rightIsBest}
          />

          <SpecRow
            label="Weight"
            left={safeText(leftAttrs?.weight)}
            right={safeText(rightAttrs?.weight)}
            highlightLeft={leftIsBest}
            highlightRight={rightIsBest}
          />
          <SpecRow
            label="Durability"
            left={safeText(leftAttrs?.durability)}
            right={safeText(rightAttrs?.durability)}
            highlightLeft={leftIsBest}
            highlightRight={rightIsBest}
          />
          <SpecRow
            label="Riding style fit"
            left={safeText(leftAttrs?.ridingFit)}
            right={safeText(rightAttrs?.ridingFit)}
            highlightLeft={leftIsBest}
            highlightRight={rightIsBest}
          />
          <SpecRow
            label="Price"
            left={safeText(top?.price)}
            right={safeText(right?.price)}
            highlightLeft={leftIsBest}
            highlightRight={rightIsBest}
          />
        </AppCard>

        <View style={{ height: spacing.xl }} />

        <AppButton title="Choose This" onPress={onChoose} size="large" />
        <View style={{ height: spacing.md }} />
        <AppButton
          title="Back to Results"
          variant="secondary"
          onPress={onBack}
          size="large"
        />
      </ScrollView>
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

  pickCard: {
    flex: 1,
    minHeight: 148,
    backgroundColor: colors.surface,
  },
  bestCard: {
    borderColor: colors.primary,
  },
  pickName: {
    marginTop: spacing.md,
    fontSize: 15,
    lineHeight: 18,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
  },
  pickPrice: {
    marginTop: 6,
    fontSize: 18,
    lineHeight: 22,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
  },
  bestBadge: {
    marginTop: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.round,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primarySoft2,
    alignSelf: "flex-start",
  },
  bestBadgeText: {
    fontSize: typography.sm,
    fontFamily: typography.fontFamily.black,
    color: colors.primary,
  },

  compareTitle: {
    fontSize: 16,
    lineHeight: 18,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },

  specRow: {
    marginTop: spacing.sm,
  },
  specLabel: {
    fontSize: typography.sm,
    fontFamily: typography.fontFamily.black,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  specCols: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  specCell: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
  },
  bestCell: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  specValue: {
    fontSize: typography.base,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
  },
});
