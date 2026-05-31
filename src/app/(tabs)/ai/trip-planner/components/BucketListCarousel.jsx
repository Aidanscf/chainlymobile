import React, { useMemo } from "react";
import { View, Text, StyleSheet, FlatList, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { Heart, Sparkles } from "lucide-react-native";
import * as Haptics from "expo-haptics";

import {
  colors,
  spacing,
  typography,
  radius,
} from "../../../../../theme/index";
import DestinationCard from "./DestinationCard";
import { useBucketListStore } from "../../../../../store/bucketList";

export default function BucketListCarousel({
  title = "Bucket List Trips",
  subtitle = "Dream rides worth training for",
  destinations,
  onPressDestination,
  onToast,
}) {
  const router = useRouter();
  const toggle = useBucketListStore((s) => s.toggle);
  const isSaved = useBucketListStore((s) => s.isSaved);

  const data = useMemo(() => {
    const list = Array.isArray(destinations) ? destinations : [];
    return list;
  }, [destinations]);

  return (
    <View style={{ marginTop: spacing.xxl }}>
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>

        <Pressable
          onPress={() => router.push("/ai/trip-planner/bucket-list")}
          hitSlop={10}
          style={styles.viewAllBtn}
        >
          <Text style={styles.viewAllText}>View All</Text>
        </Pressable>
      </View>

      <FlatList
        horizontal
        data={data}
        keyExtractor={(item) => String(item.id)}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingRight: spacing.xl }}
        renderItem={({ item }) => {
          const saved = isSaved(item.id);
          return (
            <View style={{ marginRight: spacing.md }}>
              <DestinationCard
                destination={item}
                variant="bucket"
                onPress={() => onPressDestination?.(item)}
                rightOverlay={
                  <Pressable
                    onPress={async () => {
                      try {
                        await Haptics.selectionAsync();
                      } catch (e) {
                        // no-op
                      }

                      const added = toggle(item.id);
                      if (added) {
                        onToast?.("Added to Bucket List");
                      } else {
                        onToast?.("Removed from Bucket List");
                      }
                    }}
                    hitSlop={10}
                    style={styles.heartBtn}
                  >
                    <Heart
                      size={18}
                      strokeWidth={2.75}
                      color={saved ? colors.primary : colors.textPrimary}
                      fill={saved ? colors.primary : "transparent"}
                    />
                  </Pressable>
                }
                leftOverlay={
                  <View style={styles.bucketBadge}>
                    <Sparkles
                      size={14}
                      color={colors.primary}
                      strokeWidth={2.75}
                    />
                    <Text style={styles.bucketText}>Bucket</Text>
                  </View>
                }
              />
            </View>
          );
        }}
        snapToAlignment="start"
        decelerationRate="fast"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
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
  viewAllBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.round,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  viewAllText: {
    fontSize: typography.sm,
    fontFamily: typography.fontFamily.bold,
    color: colors.primary,
  },

  heartBtn: {
    width: 34,
    height: 34,
    borderRadius: radius.round,
    backgroundColor: "rgba(255,255,255,0.92)",
    borderWidth: 1,
    borderColor: colors.borderLight,
    alignItems: "center",
    justifyContent: "center",
  },

  bucketBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: radius.round,
    backgroundColor: "rgba(255,255,255,0.92)",
    borderWidth: 1,
    borderColor: colors.primarySoft2,
  },
  bucketText: {
    fontSize: 12,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
  },
});
