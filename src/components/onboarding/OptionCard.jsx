import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Check } from "lucide-react-native";

import AppCard from "@/components/AppCard";
import { colors, spacing, radius, typography, shadows } from "@/theme/index";

/**
 * Big, icon-led selectable card.
 * - layout="row": icon left + text
 * - layout="tile": icon top + centered text (good for grids)
 */
export default function OptionCard({
  icon: Icon,
  title,
  subtitle = null,
  selected = false,
  onPress,
  layout = "row", // row | tile
}) {
  const cardStyle = useMemo(() => {
    const bg = selected ? colors.primarySoft : colors.surface;
    const bd = selected ? colors.primary : colors.border;
    return {
      backgroundColor: bg,
      borderColor: bd,
      borderWidth: 1,
    };
  }, [selected]);

  const iconWrapStyle = useMemo(() => {
    const bg = selected ? colors.primarySoft2 : colors.surfaceWarm;
    const bd = selected ? colors.primary : colors.border;
    return {
      backgroundColor: bg,
      borderColor: bd,
    };
  }, [selected]);

  const titleColor = selected ? colors.primary : colors.textPrimary;

  const content =
    layout === "tile" ? (
      <View style={styles.tileInner}>
        <View style={[styles.iconWrap, iconWrapStyle]}>
          <Icon size={22} color={titleColor} strokeWidth={2.75} />
        </View>
        <Text style={[styles.tileTitle, { color: titleColor }]}>{title}</Text>
        {subtitle ? (
          <Text style={styles.tileSub} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
    ) : (
      <View style={styles.rowInner}>
        <View style={[styles.iconWrap, iconWrapStyle]}>
          <Icon size={20} color={titleColor} strokeWidth={2.75} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.rowTitle, { color: titleColor }]}>{title}</Text>
          {subtitle ? <Text style={styles.rowSub}>{subtitle}</Text> : null}
        </View>
        {selected ? (
          <View style={styles.checkWrap}>
            <Check size={18} color={colors.primary} strokeWidth={3} />
          </View>
        ) : (
          <View style={styles.checkSpacer} />
        )}
      </View>
    );

  return (
    <AppCard
      onPress={onPress}
      pressable={true}
      padding={layout === "tile" ? spacing.lg : spacing.lg}
      style={[styles.cardBase, cardStyle]}
    >
      {content}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  cardBase: {
    ...shadows.small,
  },

  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.round,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  // row layout
  rowInner: {
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  rowTitle: {
    fontSize: 16,
    lineHeight: 18,
    fontFamily: typography.fontFamily.black,
    letterSpacing: -0.2,
  },
  rowSub: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 16,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
  checkWrap: {
    width: 32,
    height: 32,
    borderRadius: radius.round,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primarySoft2,
    alignItems: "center",
    justifyContent: "center",
  },
  checkSpacer: {
    width: 32,
    height: 32,
  },

  // tile layout
  tileInner: {
    minHeight: 92,
    alignItems: "center",
    justifyContent: "center",
  },
  tileTitle: {
    marginTop: spacing.sm,
    fontSize: 14,
    lineHeight: 16,
    fontFamily: typography.fontFamily.black,
    textAlign: "center",
  },
  tileSub: {
    marginTop: 6,
    fontSize: 11,
    lineHeight: 14,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    textAlign: "center",
  },
});
