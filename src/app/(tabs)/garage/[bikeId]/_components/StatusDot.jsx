import React from "react";
import { View, StyleSheet } from "react-native";
import { colors, radius } from "@/theme/index";
import { getStateColor } from "../_utils/healthUtils";

export function StatusDot({ icon: Icon, score, style }) {
  const c = getStateColor(score);

  return (
    <View style={[styles.dotOuter, { borderColor: c }, style]}>
      <View style={[styles.dotFill, { backgroundColor: c }]}>
        <Icon size={14} color="#FFFFFF" strokeWidth={2.75} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dotOuter: {
    position: "absolute",
    width: 40,
    height: 40,
    borderRadius: radius.round,
    backgroundColor: colors.surface,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  dotFill: {
    width: 30,
    height: 30,
    borderRadius: radius.round,
    alignItems: "center",
    justifyContent: "center",
  },
});
