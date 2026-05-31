import React from "react";
import { View, Text, Switch, StyleSheet } from "react-native";
import { colors, spacing, radius, typography } from "@/theme/index";

export function ToggleRow({ icon: Icon, title, sub, value, onValueChange }) {
  return (
    <View style={styles.rowCard}>
      <View style={styles.rowLeft}>
        <View style={styles.iconWrap}>
          <Icon size={18} color={colors.primary} strokeWidth={2.75} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.rowTitle}>{title}</Text>
          <Text style={styles.rowSub}>{sub}</Text>
        </View>
      </View>
      <Switch value={value} onValueChange={onValueChange} />
    </View>
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
});
