import React, { useMemo } from "react";
import { View, Text } from "react-native";
import { colors, radius, typography } from "@/theme/index";

function tierMeta(tier) {
  const t = String(tier || "").toLowerCase();
  if (t.includes("diamond")) {
    return { bg: "#EEF2FF", border: "#C7D2FE", text: "#3730A3" };
  }
  if (t.includes("gold")) {
    return { bg: colors.warningSoft, border: colors.warning, text: "#7A4B00" };
  }
  if (t.includes("silver")) {
    return { bg: "#F1F5F9", border: "#CBD5E1", text: "#0F172A" };
  }
  return {
    bg: colors.primarySoft,
    border: colors.primarySoft2,
    text: colors.primary,
  };
}

export default function LeagueBadge({ tier, compact = false, style }) {
  const meta = useMemo(() => tierMeta(tier), [tier]);
  const label = tier || "Rider";

  return (
    <View
      style={[
        {
          paddingHorizontal: compact ? 10 : 12,
          paddingVertical: compact ? 6 : 8,
          borderRadius: radius.round,
          backgroundColor: meta.bg,
          borderWidth: 1,
          borderColor: meta.border,
        },
        style,
      ]}
    >
      <Text
        style={{
          fontSize: compact ? 11 : typography.sm,
          fontFamily: typography.fontFamily.bold,
          color: meta.text,
        }}
      >
        {label}
      </Text>
    </View>
  );
}
