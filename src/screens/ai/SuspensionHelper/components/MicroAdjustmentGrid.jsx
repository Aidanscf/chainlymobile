import React from "react";
import { View, StyleSheet } from "react-native";
import MicroAdjustmentCard from "@/components/suspension/MicroAdjustmentCard";
import { spacing } from "@/theme/index";

export function MicroAdjustmentGrid({ items, onItemPress }) {
  return (
    <View style={styles.microGrid}>
      {items.map((m) => (
        <MicroAdjustmentCard
          key={m.key}
          icon={m.icon}
          title={m.title}
          onPress={() => onItemPress(m)}
          style={styles.microTile}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  microGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: spacing.xs,
  },
  microTile: {
    width: "48%",
    minHeight: 124,
    marginBottom: spacing.lg,
  },
});
