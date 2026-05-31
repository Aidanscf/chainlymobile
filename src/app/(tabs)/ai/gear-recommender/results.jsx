import React, { useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import * as Linking from "expo-linking";
import * as Haptics from "expo-haptics";
import { BadgeCheck, AlertTriangle } from "lucide-react-native";

import { colors, spacing, typography, radius, shadows } from "@/theme/index";
import AppCard from "@/components/AppCard";
import AppButton from "@/components/AppButton";
import Chip from "@/components/Chip";
import { useGearStore } from "@/store/gearStore";
import ScreenHeader from "@/components/layout/ScreenHeader";

async function openExternal(url) {
  if (!url) {
    return;
  }
  try {
    const can = await Linking.canOpenURL(url);
    if (!can) {
      return;
    }
    await Linking.openURL(url);
  } catch (error) {
    console.error(error);
  }
}

export default function GearRecommenderResultsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const results = useGearStore((s) => s.results);
  const setCompare = useGearStore((s) => s.setCompare);

  const top = results?.top || null;
  const alternatives = Array.isArray(results?.alternatives)
    ? results.alternatives
    : [];

  const onBack = useCallback(() => {
    router.back();
  }, [router]);

  const onCompare = useCallback(
    async (right) => {
      try {
        await Haptics.selectionAsync();
      } catch (e) {
        // no-op
      }
      setCompare({ left: top, right });
      router.push("/ai/gear-recommender/compare");
    },
    [router, setCompare, top],
  );

  if (!top) {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" />
        <ScreenHeader title="Your Picks" showBack />

        <View style={{ padding: spacing.xl }}>
          <Text style={styles.title}>No results yet</Text>
          <Text style={styles.subtitle}>
            Go back and try a different component focus.
          </Text>

          <AppButton title="Back to Wizard" onPress={onBack} size="large" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScreenHeader title="Your Picks" showBack />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: spacing.xl,
          paddingBottom: insets.bottom + 28,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Your picks</Text>
        <Text style={styles.subtitle}>
          Premium upgrades — filtered for your setup.
        </Text>

        {/* Compatibility alert */}
        {results?.alert ? (
          <AppCard
            style={{
              backgroundColor: colors.primarySoft,
              borderColor: colors.primarySoft2,
              marginBottom: spacing.lg,
            }}
            padding={spacing.lg}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: spacing.md,
              }}
            >
              <View style={styles.warnIcon}>
                <AlertTriangle
                  size={18}
                  color={colors.primary}
                  strokeWidth={2.75}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.warnTitle}>
                  {String(results.alert.title || "Compatibility Notice")}
                </Text>
                <Text style={styles.warnText}>
                  {String(results.alert.message || "")}
                </Text>
              </View>
            </View>
          </AppCard>
        ) : null}

        {/* Hero recommendation */}
        <AppCard style={styles.heroCard} padding={spacing.xl}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              gap: spacing.md,
              marginBottom: spacing.lg,
            }}
          >
            <Chip
              label={`${Math.round(top.match || 0)}% Match`}
              tone="orange"
              selected
            />
            <Text style={styles.retailer}>{String(top.retailer || "")}</Text>
          </View>

          <Text style={styles.heroName}>{String(top.name || "Product")}</Text>
          <Text style={styles.heroPrice}>{String(top.price || "")}</Text>

          <View style={styles.trustRow}>
            {(top.trust || []).slice(0, 2).map((t, idx) => (
              <View key={`${t}-${idx}`} style={styles.trustPill}>
                <BadgeCheck
                  size={14}
                  color={colors.success}
                  strokeWidth={2.75}
                />
                <Text style={styles.trustText}>{String(t || "")}</Text>
              </View>
            ))}
          </View>

          <View style={styles.divider} />

          <AppCard
            style={{
              backgroundColor: colors.surfaceWarm,
              borderColor: colors.border,
            }}
            padding={spacing.lg}
          >
            <Text style={styles.whyTitle}>Why this fits you</Text>
            <Text style={styles.whyText}>
              {String(top.why || "This product matches your requirements.")}
            </Text>
          </AppCard>

          <View
            style={{
              flexDirection: "row",
              gap: spacing.md,
              marginTop: spacing.lg,
            }}
          >
            <View style={{ flex: 1 }}>
              <AppButton
                title="View Specs"
                variant="secondary"
                onPress={() =>
                  router.push({
                    pathname: "/ai/gear-recommender/compare",
                    params: { mode: "specs" },
                  })
                }
              />
            </View>
            <View style={{ flex: 1 }}>
              <AppButton
                title="Shop Now"
                onPress={() => openExternal(top.affiliateUrl)}
              />
            </View>
          </View>

          <Pressable
            onPress={() =>
              router.push({
                pathname: "/ai/gear-recommender/save",
                params: { productId: top.id },
              })
            }
            hitSlop={8}
            style={{ marginTop: spacing.md, alignItems: "center" }}
          >
            <Text style={styles.saveLater}>Save for later</Text>
          </Pressable>
        </AppCard>

        {/* Alternatives */}
        <Text style={styles.altTitle}>Alternative options</Text>
        <View style={{ gap: spacing.md }}>
          {alternatives.map((p, idx) => {
            const ok = p.compatibility?.compatible !== false;
            return (
              <AppCard
                key={p.id || `alt-${idx}`}
                padding={spacing.lg}
                style={styles.altCard}
                onPress={() => onCompare(p)}
              >
                <View style={styles.altHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.altName} numberOfLines={2}>
                      {String(p.name || "Product")}
                    </Text>
                    <Text style={styles.altPrice}>{String(p.price || "")}</Text>
                  </View>
                  <Chip
                    label={ok ? "Compatible" : "Check fit"}
                    tone={ok ? "green" : "orange"}
                    selected
                  />
                </View>

                <View style={styles.altMetaRow}>
                  <Text style={styles.altMeta}>
                    {Math.round(p.match || 0)}% match
                  </Text>
                  {p.retailer ? (
                    <>
                      <View style={styles.dot} />
                      <Text style={styles.altMeta}>{p.retailer}</Text>
                    </>
                  ) : null}
                </View>
              </AppCard>
            );
          })}
        </View>

        <View style={{ height: spacing.xxl }} />

        <AppButton
          title="Back to Wizard"
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

  warnIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.round,
    backgroundColor: colors.primarySoft2,
    borderWidth: 1,
    borderColor: colors.primarySoft2,
    alignItems: "center",
    justifyContent: "center",
  },
  warnTitle: {
    fontSize: 15,
    lineHeight: 17,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
  },
  warnText: {
    marginTop: 4,
    fontSize: typography.sm,
    lineHeight: 17,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textSecondary,
  },

  heroCard: {
    borderColor: colors.primary,
    borderWidth: 2,
  },

  retailer: {
    fontSize: typography.sm,
    fontFamily: typography.fontFamily.black,
    color: colors.textSecondary,
  },
  heroName: {
    fontSize: 20,
    lineHeight: 24,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    letterSpacing: -0.3,
    marginBottom: spacing.sm,
  },
  heroPrice: {
    fontSize: 24,
    lineHeight: 28,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },

  trustRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  trustPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.round,
    backgroundColor: colors.successSoft,
    borderWidth: 1,
    borderColor: "#CCF4DF",
  },
  trustText: {
    fontSize: typography.sm,
    fontFamily: typography.fontFamily.bold,
    color: colors.success,
  },

  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginBottom: spacing.lg,
  },

  whyTitle: {
    fontSize: 15,
    lineHeight: 17,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  whyText: {
    fontSize: typography.base,
    lineHeight: 20,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },

  saveLater: {
    fontSize: typography.sm,
    fontFamily: typography.fontFamily.bold,
    color: colors.primary,
  },

  altTitle: {
    marginTop: spacing.xxl,
    marginBottom: spacing.md,
    fontSize: 18,
    lineHeight: 20,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
  },
  altCard: {
    backgroundColor: colors.surface,
    borderColor: colors.borderLight,
  },

  altHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.md,
    marginBottom: spacing.sm,
  },

  altName: {
    fontSize: 16,
    lineHeight: 20,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    letterSpacing: -0.2,
    marginBottom: 6,
  },
  altPrice: {
    fontSize: 18,
    lineHeight: 22,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
  },

  altMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  altMeta: {
    fontSize: typography.sm,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textSecondary,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
  },
});
