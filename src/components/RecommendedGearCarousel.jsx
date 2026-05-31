import React, { useMemo } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { BadgeCheck, AlertTriangle } from "lucide-react-native";

import AppCard from "@/components/AppCard";
import { colors, spacing, typography, radius } from "@/theme/index";

export default function RecommendedGearCarousel({
  title = "Recommended for You",
  subtitle = "Based on your bike, riding style, and what other riders are upgrading",
  items,
  onSelectItem,
  loading = false,
}) {
  const list = useMemo(() => {
    return Array.isArray(items) ? items : [];
  }, [items]);

  if (list.length === 0) {
    return null;
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0, marginTop: spacing.lg }}
        contentContainerStyle={{ paddingRight: spacing.xl }}
      >
        {list.map((item) => {
          const isLoading = loading || !!item?.isLoading;
          const ok = item?.compatible !== false;
          const tag = String(item?.tag || "").trim();
          const match =
            typeof item?.matchScore === "number"
              ? Math.round(item.matchScore)
              : null;
          const key = item?.productId || item?.id;

          return (
            <View key={key} style={{ marginRight: spacing.md }}>
              <AppCard
                padding={spacing.lg}
                style={styles.card}
                onPress={() => {
                  if (isLoading) {
                    return;
                  }
                  onSelectItem?.(item);
                }}
              >
                {isLoading ? (
                  <View style={{ gap: 8 }}>
                    <View style={styles.skelLine} />
                    <View style={[styles.skelLine, { width: 140 }]} />
                    <View style={[styles.skelLine, { width: 90 }]} />
                    <View style={[styles.skelLine, { width: 160 }]} />
                  </View>
                ) : (
                  <>
                    {/* Header: Tags and Match */}
                    <View style={styles.headerRow}>
                      {tag ? (
                        <View style={styles.badge}>
                          <Text style={styles.badgeText} numberOfLines={1}>
                            {tag}
                          </Text>
                        </View>
                      ) : null}
                      {match !== null ? (
                        <View style={styles.matchPill}>
                          <Text style={styles.matchText}>{match}%</Text>
                        </View>
                      ) : null}
                    </View>

                    {/* Gear Name */}
                    <Text style={styles.name} numberOfLines={2}>
                      {item.name}
                    </Text>

                    {/* Price */}
                    <Text style={styles.price}>{item.price || ""}</Text>

                    {/* Short Description */}
                    {item?.buddyCopy ? (
                      <Text style={styles.description} numberOfLines={2}>
                        {item.buddyCopy}
                      </Text>
                    ) : null}

                    {/* Divider */}
                    <View style={styles.divider} />

                    {/* Compatibility */}
                    <View style={styles.fitRow}>
                      {ok ? (
                        <BadgeCheck
                          size={16}
                          color={colors.success}
                          strokeWidth={2.75}
                        />
                      ) : (
                        <AlertTriangle
                          size={16}
                          color={colors.primary}
                          strokeWidth={2.75}
                        />
                      )}
                      <Text
                        style={[
                          styles.fitText,
                          ok ? styles.fitOk : styles.fitWarn,
                        ]}
                      >
                        {ok ? "Fits your bike" : "Check fit"}
                      </Text>
                    </View>
                  </>
                )}
              </AppCard>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: spacing.xxl,
  },

  title: {
    fontSize: 18,
    lineHeight: 20,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  subtitle: {
    marginTop: 6,
    fontSize: typography.base,
    lineHeight: 19,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },

  card: {
    width: 240,
    backgroundColor: colors.surface,
    borderColor: colors.borderLight,
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },

  badge: {
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: radius.round,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primarySoft2,
  },
  badgeText: {
    fontSize: typography.sm,
    fontFamily: typography.fontFamily.black,
    color: colors.primary,
  },

  matchPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: radius.round,
    backgroundColor: colors.surfaceWarm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  matchText: {
    fontSize: typography.sm,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
  },

  name: {
    fontSize: 16,
    lineHeight: 20,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    letterSpacing: -0.2,
    marginBottom: spacing.sm,
  },

  price: {
    fontSize: 18,
    lineHeight: 22,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },

  description: {
    fontSize: typography.sm,
    lineHeight: 17,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },

  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginBottom: spacing.md,
  },

  fitRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  fitText: {
    fontSize: typography.sm,
    fontFamily: typography.fontFamily.bold,
  },
  fitOk: {
    color: colors.success,
  },
  fitWarn: {
    color: colors.primary,
  },

  skelLine: {
    height: 12,
    width: 180,
    borderRadius: radius.round,
    backgroundColor: colors.borderLight,
  },
});
