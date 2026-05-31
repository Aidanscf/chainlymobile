import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Image } from "expo-image";

import AppCard from "../../../../../components/AppCard";
import {
  colors,
  spacing,
  typography,
  radius,
  shadows,
} from "../../../../../theme/index";
import {
  whyFitsYou,
  pickSuggestedDuration,
} from "../../../../../utils/destinationScoring";

const CARD_WIDTH = 270;
const CARD_HEIGHT = 190;

function MiniPill({ label, tone }) {
  const bg =
    tone === "orange"
      ? colors.primarySoft
      : tone === "dark"
        ? colors.textPrimary
        : colors.surfaceWarm;
  const border = tone === "orange" ? colors.primarySoft2 : colors.border;
  const text = tone === "dark" ? "#fff" : colors.textPrimary;

  return (
    <View style={[styles.pill, { backgroundColor: bg, borderColor: border }]}>
      <Text style={[styles.pillText, { color: text }]}>{label}</Text>
    </View>
  );
}

export default function DestinationCard({
  destination,
  riderCharacter,
  userProfile,
  variant = "recommended", // recommended | bucket
  onPress,
  leftOverlay,
  rightOverlay,
}) {
  const duration = useMemo(
    () => pickSuggestedDuration(destination),
    [destination],
  );

  const why = useMemo(() => {
    if (variant !== "recommended") {
      return destination?.whyLegendary || "Worth the effort.";
    }
    return whyFitsYou({ destination, riderCharacter, userProfile });
  }, [destination, riderCharacter, userProfile, variant]);

  const badges = useMemo(() => {
    const list = Array.isArray(destination?.ridingBadges)
      ? destination.ridingBadges
      : [];
    return list.slice(0, 2);
  }, [destination]);

  const statsLine = useMemo(() => {
    const km = destination?.stats?.distanceKm ?? null;
    const m = destination?.stats?.climbingM ?? null;
    if (!km || !m) {
      return null;
    }
    return `~${km} km • ~${Number(m).toLocaleString()} m`;
  }, [destination]);

  const socialProof = destination?.socialProof || "Popular Right Now";

  return (
    <AppCard
      padding={0}
      style={styles.card}
      onPress={onPress}
      pressable={Boolean(onPress)}
    >
      <View style={styles.imageWrap}>
        {destination?.image ? (
          <Image
            source={{ uri: destination.image }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={150}
          />
        ) : null}

        <View style={styles.imageOverlay} />

        <View style={styles.overlayRowTop}>
          <View style={{ flex: 1 }}>{leftOverlay || null}</View>
          {rightOverlay ? <View>{rightOverlay}</View> : null}
        </View>

        <View style={styles.overlayRowBottom}>
          <MiniPill label={socialProof} tone="orange" />
        </View>
      </View>

      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>
          {destination?.name}
        </Text>
        <Text style={styles.region} numberOfLines={1}>
          {destination?.region}
        </Text>

        <View style={styles.badgeRow}>
          {badges.map((b) => (
            <MiniPill key={b} label={b} />
          ))}
          <MiniPill label={duration} />
        </View>

        {statsLine ? <Text style={styles.stats}>{statsLine}</Text> : null}

        <Text style={styles.microcopy} numberOfLines={2}>
          {why}
        </Text>
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    overflow: "hidden",
    borderColor: colors.borderLight,
    backgroundColor: colors.surface,
    ...shadows.small,
  },

  imageWrap: {
    height: CARD_HEIGHT,
    width: "100%",
    backgroundColor: colors.surfaceWarm,
    overflow: "hidden",
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.10)",
  },

  overlayRowTop: {
    position: "absolute",
    top: spacing.md,
    left: spacing.md,
    right: spacing.md,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  overlayRowBottom: {
    position: "absolute",
    bottom: spacing.md,
    left: spacing.md,
    right: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
  },

  body: {
    padding: spacing.lg,
  },
  name: {
    fontSize: 16,
    lineHeight: 18,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  region: {
    marginTop: 3,
    fontSize: typography.sm,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textSecondary,
  },

  badgeRow: {
    marginTop: spacing.md,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  stats: {
    marginTop: spacing.sm,
    fontSize: typography.sm,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textSecondary,
  },

  microcopy: {
    marginTop: spacing.sm,
    fontSize: typography.base,
    lineHeight: 19,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
  },

  pill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.round,
    borderWidth: 1,
  },
  pillText: {
    fontSize: 12,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
  },
});
