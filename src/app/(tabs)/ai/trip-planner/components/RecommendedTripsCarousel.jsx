import React, { useMemo } from "react";
import { View, Text, StyleSheet, FlatList } from "react-native";

import Chip from "../../../../../components/Chip";
import { colors, spacing, typography } from "../../../../../theme/index";
import DestinationCard from "./DestinationCard";

const FILTERS = [
  { key: "trending", label: "Trending" },
  { key: "weekend", label: "Weekend" },
  { key: "park", label: "Bike Park" },
  { key: "techflow", label: "Tech Flow" },
  { key: "climbs", label: "Big Climbs" },
];

export default function RecommendedTripsCarousel({
  title = "Recommended Trips",
  subtitle = "Handpicked trips based on your riding style and what’s trending",
  destinations,
  selectedFilter,
  onSelectFilter,
  onPressDestination,
  riderCharacter,
  userProfile,
}) {
  const data = useMemo(() => {
    const list = Array.isArray(destinations) ? destinations : [];
    return list;
  }, [destinations]);

  return (
    <View style={{ marginTop: spacing.xxl }}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>

      <View style={styles.chipsRow}>
        {FILTERS.map((f) => (
          <Chip
            key={f.key}
            label={f.label}
            tone="orange"
            selected={selectedFilter === f.key}
            onPress={() => onSelectFilter?.(f.key)}
          />
        ))}
      </View>

      <FlatList
        horizontal
        data={data}
        keyExtractor={(item) => String(item.id)}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingRight: spacing.xl }}
        renderItem={({ item }) => (
          <View style={{ marginRight: spacing.md }}>
            <DestinationCard
              destination={item}
              riderCharacter={riderCharacter}
              userProfile={userProfile}
              variant="recommended"
              onPress={() => onPressDestination?.(item)}
            />
          </View>
        )}
        snapToAlignment="start"
        decelerationRate="fast"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 18,
    lineHeight: 20,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  subtitle: {
    marginTop: 6,
    fontSize: typography.base,
    lineHeight: 19,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
});
