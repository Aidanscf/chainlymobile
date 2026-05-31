import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { ChevronRight } from "lucide-react-native";
import { colors, spacing, radius, typography } from "@/theme/index";

export function Row({
  icon: Icon,
  title,
  sub,
  onPress,
  highlight,
  danger,
  leftSlot,
}) {
  const bg = highlight ? colors.surfaceWarm : colors.surface;
  const rightColor = danger ? colors.danger : colors.textSecondary;

  return (
    <Pressable onPress={onPress} hitSlop={10}>
      <View style={[styles.rowCard, { backgroundColor: bg }]}>
        <View style={styles.rowLeft}>
          {leftSlot ? (
            <View style={styles.leftSlotWrap}>{leftSlot}</View>
          ) : (
            <View style={styles.iconWrap}>
              <Icon
                size={18}
                color={danger ? colors.danger : colors.primary}
                strokeWidth={2.75}
              />
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text
              style={[
                styles.rowTitle,
                danger ? { color: colors.danger } : null,
              ]}
            >
              {title}
            </Text>
            {sub ? <Text style={styles.rowSub}>{sub}</Text> : null}
          </View>
        </View>

        <ChevronRight size={18} color={rightColor} strokeWidth={2.75} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  rowCard: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    flex: 1,
    paddingRight: spacing.md,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: radius.round,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primarySoft2,
    alignItems: "center",
    justifyContent: "center",
  },
  rowTitle: {
    fontSize: 16,
    lineHeight: 18,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
  },
  rowSub: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 16,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
  leftSlotWrap: {
    width: 42,
    height: 42,
    borderRadius: radius.round,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
  },
});

export default Row;
