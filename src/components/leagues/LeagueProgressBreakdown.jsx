import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { colors, spacing, typography } from "@/theme/index";

function safeNum(x) {
  const n = Number(x);
  return Number.isFinite(n) ? n : 0;
}

export default function LeagueProgressBreakdown({ rows }) {
  const list = useMemo(() => {
    const src = Array.isArray(rows) ? rows : [];
    return src
      .map((r) => {
        const label = r?.label ? String(r.label) : "";
        if (!label) return null;
        return {
          label,
          value: safeNum(r.value),
          cap: r?.cap == null ? null : safeNum(r.cap),
        };
      })
      .filter(Boolean);
  }, [rows]);

  if (!list.length) {
    return null;
  }

  return (
    <View style={{ marginTop: spacing.lg }}>
      {list.map((r) => {
        const capText = r.cap != null ? ` / ${Math.round(r.cap)}` : "";
        return (
          <View key={r.label} style={styles.row}>
            <Text style={styles.label}>{r.label}</Text>
            <Text style={styles.value}>
              {Math.round(r.value)}
              {capText} pts
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  label: {
    fontSize: 14,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textPrimary,
  },
  value: {
    fontSize: 14,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
  },
});
