import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Share,
  FlatList,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Heart, Share2 } from "lucide-react-native";

import AppCard from "../../../../components/AppCard";
import AppButton from "../../../../components/AppButton";
import Chip from "../../../../components/Chip";
import {
  colors,
  spacing,
  typography,
  radius,
  shadows,
} from "../../../../theme/index";
import {
  curatedBucketList,
  destinations,
} from "../../../../data/destinations.mock";
import { useBucketListStore } from "../../../../store/bucketList";
import { useTripsStore } from "../../../../store/trips";
import {
  durationLabelToDays,
  pickSuggestedDuration,
} from "../../../../utils/destinationScoring";
import ScreenHeader from "@/components/layout/ScreenHeader";
import { FEATURE_TRIP_PLANNER_ENABLED } from "@/utils/featureFlags";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "park", label: "Park" },
  { key: "tech", label: "Tech" },
  { key: "flow", label: "Flow" },
  { key: "epic", label: "Epic" },
];

function Segmented({ value, onChange }) {
  return (
    <View style={styles.segmentedWrap}>
      {[
        { key: "saved", label: "Saved" },
        { key: "curated", label: "Curated" },
      ].map((seg) => {
        const active = value === seg.key;
        return (
          <Pressable
            key={seg.key}
            onPress={() => onChange(seg.key)}
            style={[
              styles.segment,
              active && {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                ...shadows.small,
              },
            ]}
          >
            <Text
              style={[
                styles.segmentText,
                active ? { color: colors.textPrimary } : null,
              ]}
            >
              {seg.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function DestGridCard({ destination, saved, onPressPlan, onPressHeart }) {
  const duration = pickSuggestedDuration(destination);
  const tags = (destination?.tags || []).slice(0, 2);

  return (
    <AppCard padding={spacing.lg} style={styles.gridCard} pressable={false}>
      <View style={styles.gridTopRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.gridTitle} numberOfLines={1}>
            {destination?.name}
          </Text>
          <Text style={styles.gridSub} numberOfLines={1}>
            {destination?.region}
          </Text>
        </View>

        <Pressable
          onPress={onPressHeart}
          hitSlop={10}
          style={styles.heartSmall}
        >
          <Heart
            size={18}
            strokeWidth={2.75}
            color={saved ? colors.primary : colors.textPrimary}
            fill={saved ? colors.primary : "transparent"}
          />
        </Pressable>
      </View>

      <View style={styles.gridPillRow}>
        <Chip label="Bucket" tone="orange" selected />
        <Chip label={duration} tone="orange" selected={false} />
      </View>

      <View style={styles.gridPillRow}>
        {tags.map((t) => (
          <Chip
            key={t}
            label={t.charAt(0).toUpperCase() + t.slice(1)}
            tone="orange"
            selected={false}
          />
        ))}
      </View>

      <Text style={styles.gridWhy} numberOfLines={2}>
        {destination?.whyLegendary || "Trips worth the effort."}
      </Text>

      <View style={{ height: spacing.sm }} />
      <AppButton title="Plan This Trip" onPress={onPressPlan} />
    </AppCard>
  );
}

export default function TripPlannerBucketListScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [segment, setSegment] = useState("saved");
  const [filter, setFilter] = useState("all");

  const savedIds = useBucketListStore((s) => s.savedDestinationIds);
  const isSaved = useBucketListStore((s) => s.isSaved);
  const toggle = useBucketListStore((s) => s.toggle);

  const resetWizard = useTripsStore((s) => s.resetWizard);
  const setDestination = useTripsStore((s) => s.setDestination);
  const setWizardField = useTripsStore((s) => s.setWizardField);
  const setWizardNestedField = useTripsStore((s) => s.setWizardNestedField);
  const generatePreviewPlan = useTripsStore((s) => s.generatePreviewPlan);

  const allById = useMemo(() => {
    const map = new Map();
    (destinations || []).forEach((d) => map.set(String(d.id), d));
    return map;
  }, []);

  const savedDestinations = useMemo(() => {
    const ids = Array.isArray(savedIds) ? savedIds : [];
    return ids.map((id) => allById.get(String(id))).filter(Boolean);
  }, [allById, savedIds]);

  const curated = useMemo(() => {
    return Array.isArray(curatedBucketList) ? curatedBucketList : [];
  }, []);

  const filteredList = useMemo(() => {
    const list = segment === "saved" ? savedDestinations : curated;
    if (filter === "all") {
      return list;
    }
    return list.filter((d) => (d?.tags || []).includes(filter));
  }, [curated, filter, savedDestinations, segment]);

  const onBack = useCallback(() => {
    router.back();
  }, [router]);

  const planDestination = useCallback(
    async (destination) => {
      if (!destination) {
        return;
      }

      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (e) {
        // no-op
      }

      // Low friction: prefill + generate preview + open preview screen.
      resetWizard();
      setDestination({
        id: destination.id,
        name: destination.name,
        region: destination.region,
        lat: destination.lat,
        lng: destination.lng,
      });

      const durationLabel = pickSuggestedDuration(destination);
      const durationDays = durationLabelToDays(durationLabel);
      setWizardField("durationDays", durationDays);

      const tags = Array.isArray(destination.tags) ? destination.tags : [];
      setWizardNestedField("preferences", "terrainTags", tags);
      setWizardNestedField("preferences", "wantsFlow", tags.includes("flow"));
      setWizardNestedField("preferences", "wantsTech", tags.includes("tech"));
      setWizardNestedField("preferences", "wantsJumps", tags.includes("park"));

      const difficulty = tags.includes("epic") ? "hard" : "medium";
      setWizardNestedField("preferences", "difficulty", difficulty);

      try {
        await generatePreviewPlan();
        router.push({
          pathname: "/ai/trip-planner/overview",
          params: { from: "bucket" },
        });
      } catch (error) {
        console.error(error);
      }
    },
    [
      generatePreviewPlan,
      resetWizard,
      router,
      setDestination,
      setWizardField,
      setWizardNestedField,
    ],
  );

  const onToggle = useCallback(
    (destination, currentlySaved) => {
      if (!destination) {
        return;
      }

      if (currentlySaved) {
        Alert.alert(
          "Remove from Bucket List?",
          `${destination.name} will be removed from your saved list.`,
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Remove",
              style: "destructive",
              onPress: () => toggle(destination.id),
            },
          ],
        );
        return;
      }

      toggle(destination.id);
    },
    [toggle],
  );

  const onShare = useCallback(async () => {
    const top = savedDestinations.slice(0, 3);
    if (top.length === 0) {
      Alert.alert("No saved trips yet", "Add a few Bucket List trips first.");
      return;
    }

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (e) {
      // no-op
    }

    const lines = top
      .map((d, i) => `${i + 1}. ${d.name} — ${d.region}`)
      .join("\n");
    const message = `My Chainly Bucket List\n\n${lines}\n\nTrips worth the effort.`;

    try {
      await Share.share({ message });
    } catch (error) {
      console.error(error);
    }
  }, [savedDestinations]);

  const shareAction = (
    <Pressable
      onPress={onShare}
      hitSlop={10}
      style={{
        width: 44,
        height: 44,
        borderRadius: radius.round,
        alignItems: "center",
        justifyContent: "center",
      }}
      accessibilityRole="button"
      accessibilityLabel="Share"
    >
      <Share2 size={18} color={colors.textPrimary} strokeWidth={2.75} />
    </Pressable>
  );

  if (!FEATURE_TRIP_PLANNER_ENABLED) {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" />

        <ScreenHeader
          title="Trip Planner"
          showBack
          onBack={() => router.replace("/ai")}
        />

        <View
          style={{
            flex: 1,
            padding: spacing.xl,
            paddingBottom: insets.bottom + 28,
          }}
        >
          <AppCard
            pressable={false}
            style={{
              backgroundColor: colors.surfaceWarm,
              borderColor: colors.border,
            }}
          >
            <Text style={styles.emptyTitle}>
              Trip Planner coming back soon.
            </Text>
            <Text style={styles.emptySub}>
              We’re polishing a new version. Check back soon.
            </Text>
            <View style={{ height: spacing.lg }} />
            <AppButton
              title="Back to AI Hub"
              onPress={() => router.replace("/ai")}
            />
          </AppCard>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <ScreenHeader
        title="Bucket List"
        showBack
        onBack={onBack}
        rightAction={shareAction}
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: spacing.xl,
          paddingBottom: insets.bottom + 28,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Bucket List</Text>
        <Text style={styles.subtitle}>Trips worth the effort.</Text>

        <Segmented value={segment} onChange={setSegment} />

        <View style={styles.filtersRow}>
          {FILTERS.map((f) => (
            <Chip
              key={f.key}
              label={f.label}
              tone="orange"
              selected={filter === f.key}
              onPress={() => setFilter(f.key)}
            />
          ))}
        </View>

        {segment === "saved" && savedDestinations.length === 0 ? (
          <AppCard
            style={{
              marginTop: spacing.lg,
              backgroundColor: colors.surfaceWarm,
              borderColor: colors.border,
            }}
          >
            <Text style={styles.emptyTitle}>
              No saved Bucket List trips yet
            </Text>
            <Text style={styles.emptySub}>
              Jump to Curated and add a few dream rides.
            </Text>
          </AppCard>
        ) : null}

        <View style={{ marginTop: spacing.lg }}>
          <FlatList
            data={filteredList}
            keyExtractor={(item) => String(item.id)}
            numColumns={2}
            scrollEnabled={false}
            columnWrapperStyle={{ gap: spacing.md }}
            contentContainerStyle={{ gap: spacing.md }}
            renderItem={({ item }) => {
              const saved = isSaved(item.id);
              return (
                <View style={{ flex: 1 }}>
                  <DestGridCard
                    destination={item}
                    saved={saved}
                    onPressPlan={() => planDestination(item)}
                    onPressHeart={() => onToggle(item, saved)}
                  />
                </View>
              );
            }}
          />
        </View>

        <View style={{ height: spacing.xl }} />

        <AppCard
          padding={spacing.lg}
          style={{
            backgroundColor: colors.primarySoft,
            borderColor: colors.primarySoft2,
          }}
        >
          <View style={styles.shareRow}>
            <Text style={styles.shareTitle}>Share My Bucket List</Text>
            <Pressable
              onPress={onShare}
              hitSlop={10}
              style={styles.shareIconBtn}
            >
              <Share2 size={16} color={colors.primary} strokeWidth={2.75} />
            </Pressable>
          </View>
          <Text style={styles.shareSub}>
            Generates a simple share card with your top 3 destinations.
          </Text>
          <View style={{ height: spacing.md }} />
          <AppButton title="Share My Bucket List" onPress={onShare} />
        </AppCard>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  title: {
    fontSize: 32,
    lineHeight: 34,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    letterSpacing: -0.6,
  },
  subtitle: {
    marginTop: spacing.sm,
    fontSize: typography.base,
    lineHeight: 20,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },

  segmentedWrap: {
    flexDirection: "row",
    backgroundColor: colors.surfaceWarm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.round,
    padding: 4,
  },
  segment: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radius.round,
    borderWidth: 1,
    borderColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  segmentText: {
    fontSize: typography.sm,
    fontFamily: typography.fontFamily.black,
    color: colors.textSecondary,
  },

  filtersRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.lg,
  },

  gridCard: {
    backgroundColor: colors.surface,
    borderColor: colors.borderLight,
    minHeight: 224,
  },
  gridTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  gridTitle: {
    fontSize: 15,
    lineHeight: 17,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
  },
  gridSub: {
    marginTop: 4,
    fontSize: 12,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textSecondary,
  },
  heartSmall: {
    width: 34,
    height: 34,
    borderRadius: radius.round,
    backgroundColor: colors.surfaceWarm,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  gridPillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  gridWhy: {
    marginTop: spacing.md,
    fontSize: typography.sm,
    lineHeight: 16,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },

  emptyTitle: {
    fontSize: 16,
    lineHeight: 18,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
  },
  emptySub: {
    marginTop: 6,
    fontSize: typography.base,
    lineHeight: 19,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },

  shareRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  shareTitle: {
    fontSize: 16,
    lineHeight: 18,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
  },
  shareIconBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.round,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primarySoft2,
    alignItems: "center",
    justifyContent: "center",
  },
  shareSub: {
    fontSize: typography.base,
    lineHeight: 19,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
});
