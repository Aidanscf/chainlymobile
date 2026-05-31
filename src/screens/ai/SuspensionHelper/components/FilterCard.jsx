import React from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { Mountain, CloudRain } from "lucide-react-native";
import AppCard from "@/components/AppCard";
import Chip from "@/components/Chip";
import { colors, spacing, typography } from "@/theme/index";
import { TERRAIN_OPTIONS, WEATHER_OPTIONS } from "../constants/filterOptions";
import { terrainLabel, weatherLabel } from "../utils/labelHelpers";

export function FilterCard({
  terrainFilter,
  weatherFilter,
  onTerrainChange,
  onWeatherChange,
}) {
  return (
    <AppCard style={styles.filterCard} padding={spacing.lg} pressable={false}>
      <Text style={styles.filterTitle}>Quick filters</Text>

      <View style={{ height: spacing.sm }} />

      <ScrollView
        horizontal
        style={{ flexGrow: 0 }}
        showsHorizontalScrollIndicator={false}
      >
        <View style={styles.filterRow}>
          <Chip
            label="All terrain"
            selected={terrainFilter === "all"}
            tone="neutral"
            left={
              <Mountain
                size={14}
                color={colors.textSecondary}
                strokeWidth={2.75}
              />
            }
            onPress={() => onTerrainChange("all")}
          />
          {TERRAIN_OPTIONS.map((t) => (
            <Chip
              key={t}
              label={terrainLabel(t)}
              selected={terrainFilter === t}
              tone="orange"
              onPress={() => onTerrainChange(t)}
            />
          ))}
        </View>
      </ScrollView>

      <View style={{ height: spacing.sm }} />

      <ScrollView
        horizontal
        style={{ flexGrow: 0 }}
        showsHorizontalScrollIndicator={false}
      >
        <View style={styles.filterRow}>
          <Chip
            label="All conditions"
            selected={weatherFilter === "all"}
            tone="neutral"
            left={
              <CloudRain
                size={14}
                color={colors.textSecondary}
                strokeWidth={2.75}
              />
            }
            onPress={() => onWeatherChange("all")}
          />
          {WEATHER_OPTIONS.map((w) => (
            <Chip
              key={w}
              label={weatherLabel(w)}
              selected={weatherFilter === w}
              tone="neutral"
              onPress={() => onWeatherChange(w)}
            />
          ))}
        </View>
      </ScrollView>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  filterCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  filterTitle: {
    fontSize: typography.base,
    lineHeight: 18,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
  },
  filterRow: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingRight: spacing.lg,
  },
});
