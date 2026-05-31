import React, { useMemo } from "react";
import { View, Text } from "react-native";
import { colors, radius, spacing, typography } from "@/theme/index";

export default function StatCompareRow({
  label,
  leftName,
  rightName,
  leftValue,
  rightValue,
}) {
  const max = Math.max(leftValue || 0, rightValue || 0, 1);
  const leftPct = (leftValue || 0) / max;
  const rightPct = (rightValue || 0) / max;

  const winner = useMemo(() => {
    if ((leftValue || 0) === (rightValue || 0)) return "tie";
    return (leftValue || 0) > (rightValue || 0) ? "left" : "right";
  }, [leftValue, rightValue]);

  const microcopy = useMemo(() => {
    if (winner === "tie") {
      return `You\u2019re both strong in ${label}`;
    }
    const who = winner === "left" ? leftName : rightName;
    return `${who} is stronger in ${label}`;
  }, [label, leftName, rightName, winner]);

  return (
    <View style={{ marginBottom: spacing.md }}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "baseline",
        }}
      >
        <Text
          style={{
            fontSize: typography.sm,
            fontFamily: typography.fontFamily.black,
            color: colors.textPrimary,
            letterSpacing: -0.2,
          }}
        >
          {label}
        </Text>
        <Text
          style={{
            fontSize: 11,
            fontFamily: typography.fontFamily.semibold,
            color: colors.textSecondary,
          }}
        >
          {microcopy}
        </Text>
      </View>

      <View style={{ height: 10 }} />

      <View
        style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}
      >
        <View style={{ flex: 1, alignItems: "flex-start" }}>
          <Text
            style={{
              fontSize: 11,
              fontFamily: typography.fontFamily.semibold,
              color: colors.textSecondary,
            }}
          >
            {leftValue}
          </Text>
          <View
            style={{
              width: "100%",
              height: 10,
              borderRadius: radius.round,
              backgroundColor: colors.borderLight,
              overflow: "hidden",
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <View
              style={{
                width: `${Math.round(leftPct * 100)}%`,
                height: "100%",
                backgroundColor:
                  winner === "left" ? colors.primary : colors.primarySoft2,
              }}
            />
          </View>
        </View>

        <Text
          style={{
            fontSize: 11,
            fontFamily: typography.fontFamily.black,
            color: colors.textTertiary,
          }}
        >
          VS
        </Text>

        <View style={{ flex: 1, alignItems: "flex-end" }}>
          <Text
            style={{
              fontSize: 11,
              fontFamily: typography.fontFamily.semibold,
              color: colors.textSecondary,
            }}
          >
            {rightValue}
          </Text>
          <View
            style={{
              width: "100%",
              height: 10,
              borderRadius: radius.round,
              backgroundColor: colors.borderLight,
              overflow: "hidden",
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <View
              style={{
                width: `${Math.round(rightPct * 100)}%`,
                height: "100%",
                backgroundColor:
                  winner === "right" ? colors.primary : colors.primarySoft2,
                alignSelf: "flex-end",
              }}
            />
          </View>
        </View>
      </View>
    </View>
  );
}
