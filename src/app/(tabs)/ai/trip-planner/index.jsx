import React, {
  useCallback,
  useMemo,
  useState,
  useRef,
  useEffect,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Switch,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { ChevronRight, MapPin, Sparkles, RotateCcw } from "lucide-react-native";

import ScreenHeader from "@/components/layout/ScreenHeader";
import { colors, spacing, typography, radius, shadows } from "@/theme/index";
import AppCard from "@/components/AppCard";
import AppButton from "@/components/AppButton";
import Chip from "@/components/Chip";
import { useChainlyStore } from "@/store/chainlyStore";
import { useTripsStore } from "@/store/trips";
import useSettingsStore from "@/store/settings";
import { autocompleteDestinations } from "../../../../services/geoService";
import { riderCharacter } from "@/data/mock";
import {
  destinations as mockDestinations,
  curatedBucketList,
} from "@/data/destinations.mock";
import {
  scoreDestination,
  durationLabelToDays,
  pickSuggestedDuration,
} from "@/utils/destinationScoring";
import { FEATURE_TRIP_PLANNER_ENABLED } from "@/utils/featureFlags";
import RecommendedTripsCarousel from "./components/RecommendedTripsCarousel";
import BucketListCarousel from "./components/BucketListCarousel";

const DURATION_OPTIONS = [
  { key: 1, label: "1 day" },
  { key: 2, label: "2 days" },
  { key: 3, label: "3 days" },
  { key: 4, label: "4 days" },
  { key: 5, label: "5 days" },
];

export default function AITripPlannerWizardScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();

  const userProfile = useSettingsStore((s) => s.settings.userProfile);

  const bikes = useChainlyStore((s) => s.bikes);

  const wizard = useTripsStore((s) => s.wizard);
  const loading = useTripsStore((s) => s.loading);
  const setDestination = useTripsStore((s) => s.setDestination);
  const setWizardField = useTripsStore((s) => s.setWizardField);
  const setWizardNestedField = useTripsStore((s) => s.setWizardNestedField);
  const resetWizard = useTripsStore((s) => s.resetWizard);
  // Plan generation is triggered in the Generating screen (so we can show a full-screen loader)

  const [destQuery, setDestQuery] = useState(wizard.destination?.name || "");
  const [destFocused, setDestFocused] = useState(false);

  const destQueryTrimmed = useMemo(() => {
    return String(destQuery || "").trim();
  }, [destQuery]);

  const canGenerate = useMemo(() => {
    return Boolean(wizard.destination || destQueryTrimmed);
  }, [destQueryTrimmed, wizard.destination]);

  const makeCustomDestinationFromQuery = useCallback(() => {
    const name = String(destQueryTrimmed || "").trim();
    if (!name) {
      return null;
    }

    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 40);

    const id = slug ? `custom-${slug}` : `custom-destination`;

    return {
      id,
      name,
      region: "",
      lat: null,
      lng: null,
    };
  }, [destQueryTrimmed]);

  const destinationSuggestions = useMemo(() => {
    if (!destFocused) {
      return [];
    }
    return autocompleteDestinations(destQuery);
  }, [destFocused, destQuery]);

  const selectedBike = useMemo(() => {
    const list = Array.isArray(bikes) ? bikes : [];
    return list[0] || null;
  }, [bikes]);

  const toastTimer = useRef(null);
  const [toast, setToast] = useState(null);

  const [recFilter, setRecFilter] = useState("trending");

  useEffect(() => {
    return () => {
      if (toastTimer.current) {
        clearTimeout(toastTimer.current);
      }
    };
  }, []);

  const showToast = useCallback((message) => {
    setToast(message);
    if (toastTimer.current) {
      clearTimeout(toastTimer.current);
    }
    toastTimer.current = setTimeout(() => setToast(null), 1600);
  }, []);

  const recommendedTrips = useMemo(() => {
    const list = Array.isArray(mockDestinations) ? mockDestinations : [];

    const scored = list
      .map((d) => ({
        d,
        score: scoreDestination({
          destination: d,
          riderCharacter,
          userProfile,
        }),
      }))
      .sort((a, b) => b.score - a.score)
      .map((x) => x.d);

    let filtered = scored;
    if (recFilter === "weekend") {
      filtered = scored.filter((d) =>
        (d.recommendedDurations || []).some(
          (x) =>
            String(x).toLowerCase().includes("half") || String(x).includes("2"),
        ),
      );
    } else if (recFilter === "park") {
      filtered = scored.filter((d) => (d.tags || []).includes("park"));
    } else if (recFilter === "techflow") {
      filtered = scored.filter(
        (d) =>
          (d.tags || []).includes("tech") || (d.tags || []).includes("flow"),
      );
    } else if (recFilter === "climbs") {
      filtered = scored.filter(
        (d) =>
          (d.tags || []).includes("epic") ||
          Number(d.stats?.climbingM || 0) >= 1500,
      );
    }

    // Always keep at least a few options
    if (filtered.length < 5) {
      filtered = scored;
    }

    return filtered.slice(0, 10);
  }, [recFilter, userProfile]);

  const bucketListTrips = useMemo(() => {
    const list = Array.isArray(curatedBucketList) ? curatedBucketList : [];
    return list.slice(0, 10);
  }, []);

  const prefillAndPlan = useCallback(
    async (destination, source) => {
      if (!destination) {
        return;
      }

      // Low friction: prefill + generate preview + open preview screen.
      resetWizard();

      const destPayload = {
        id: destination.id,
        name: destination.name,
        region: destination.region,
        lat: destination.lat,
        lng: destination.lng,
      };

      setDestination(destPayload);
      setDestQuery(destination.name);
      setDestFocused(false);

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

      // Trigger generation in a dedicated full-screen loader.
      router.push({
        pathname: "/ai/trip-planner/generating",
        params: { from: source || "discovery" },
      });
    },
    [
      resetWizard,
      router,
      setDestination,
      setWizardField,
      setWizardNestedField,
      showToast,
    ],
  );

  const onBack = useCallback(() => {
    // If you came in from Home (deep link), go back Home.
    // Otherwise always go back to the AI Hub screen.
    const fromHome = params?.from === "home";
    const target = fromHome ? "/" : "/ai";
    router.replace(target);
  }, [params?.from, router]);

  const onReset = useCallback(async () => {
    try {
      await Haptics.selectionAsync();
    } catch (e) {
      // no-op
    }
    resetWizard();
    setDestQuery("");
  }, [resetWizard]);

  const onSelectDestination = useCallback(
    async (destination) => {
      try {
        await Haptics.selectionAsync();
      } catch (e) {
        // no-op
      }
      setDestination(destination);
      setDestQuery(destination.name);
      setDestFocused(false);
    },
    [setDestination],
  );

  const tripSummaryText = useMemo(() => {
    if (!wizard.destination) {
      return "Pick a destination and I’ll build a plan with trails, food, and sleep.";
    }

    const wants = [];
    if (wizard.preferences?.wantsFlow) wants.push("flow");
    if (wizard.preferences?.wantsTech) wants.push("tech");
    if (wizard.preferences?.wantsJumps) wants.push("jumps");

    const vibe = wants.length ? wants.join(" + ") : "good times";
    const groupSize = Number(wizard.constraints?.groupSize || 1);
    const groupLabel = groupSize === 1 ? "solo" : `group of ${groupSize}`;

    return `Planning ${wizard.durationDays} day${wizard.durationDays === 1 ? "" : "s"} in ${wizard.destination.name} — ${vibe} focus, ${groupLabel}.`;
  }, [
    wizard.constraints?.groupSize,
    wizard.destination,
    wizard.durationDays,
    wizard.preferences,
  ]);

  const onGenerate = useCallback(async () => {
    if (!wizard.destination) {
      const custom = makeCustomDestinationFromQuery();
      if (!custom) {
        return;
      }
      setDestination(custom);
    }

    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      // no-op
    }

    router.push("/ai/trip-planner/generating");
  }, [
    makeCustomDestinationFromQuery,
    router,
    setDestination,
    wizard.destination,
  ]);

  const resetAction = (
    <Pressable
      onPress={onReset}
      hitSlop={10}
      style={{
        width: 44,
        height: 44,
        borderRadius: radius.round,
        alignItems: "center",
        justifyContent: "center",
      }}
      accessibilityRole="button"
      accessibilityLabel="Reset"
    >
      <RotateCcw size={18} color={colors.textSecondary} strokeWidth={2.75} />
    </Pressable>
  );

  // Trip Planner temporarily disabled (safe + reversible): keep routes/screens intact,
  // but remove from user flow.
  if (!FEATURE_TRIP_PLANNER_ENABLED) {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" />

        <ScreenHeader title="Trip Planner" showBack onBack={onBack} />

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
            <Text
              style={{
                fontSize: 18,
                lineHeight: 20,
                fontFamily: typography.fontFamily.black,
                color: colors.textPrimary,
              }}
            >
              Trip Planner coming back soon.
            </Text>
            <Text
              style={{
                marginTop: 6,
                fontSize: typography.base,
                lineHeight: 19,
                fontFamily: typography.fontFamily.regular,
                color: colors.textSecondary,
              }}
            >
              We’re polishing a new version. Check back soon.
            </Text>
            <View style={{ height: spacing.lg }} />
            <AppButton title="Back to AI Hub" onPress={onBack} />
          </AppCard>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <ScreenHeader
        title="Trip Planner"
        showBack
        onBack={onBack}
        rightAction={resetAction}
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: spacing.xl,
          paddingBottom: insets.bottom + 28,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>AI Trip Planner</Text>
        <Text style={styles.subtitle}>
          Trails to ride, places to eat, the right amount of send — with quick
          wins built in.
        </Text>

        {/* Trip Summary (mirrors screenshot vibe) */}
        <AppCard
          style={[
            styles.summaryCard,
            wizard.destination
              ? {
                  backgroundColor: colors.primarySoft,
                  borderColor: colors.primarySoft2,
                }
              : null,
          ]}
        >
          <View style={styles.summaryHeader}>
            <View style={styles.summaryIcon}>
              <Sparkles size={16} color={colors.primary} strokeWidth={2.5} />
            </View>
            <Text style={styles.summaryTitle}>Trip Summary</Text>
          </View>
          <Text style={styles.summaryText}>{tripSummaryText}</Text>
        </AppCard>

        {/* Main Wizard Card */}
        <AppCard style={styles.card}>
          {/* Destination */}
          <Text style={styles.sectionLabel}>DESTINATION</Text>
          <View style={styles.inputWrap}>
            <MapPin size={16} color={colors.textSecondary} strokeWidth={2.5} />
            <TextInput
              value={destQuery}
              onChangeText={(t) => {
                setDestQuery(t);
                if (!destFocused) setDestFocused(true);
              }}
              onFocus={() => setDestFocused(true)}
              onBlur={() => setTimeout(() => setDestFocused(false), 100)}
              placeholder="Search a destination…"
              placeholderTextColor={colors.textTertiary}
              style={styles.input}
              autoCorrect={false}
              autoCapitalize="words"
              returnKeyType="search"
            />
          </View>

          {destFocused && destinationSuggestions.length > 0 ? (
            <View style={styles.suggestionsWrap}>
              {destinationSuggestions.map((d) => {
                const selected = wizard.destination?.id === d.id;
                return (
                  <Pressable
                    key={d.id}
                    style={[
                      styles.suggestionRow,
                      selected && styles.suggestionSelected,
                    ]}
                    onPress={() => onSelectDestination(d)}
                  >
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.suggestionTitle,
                          selected && { color: colors.primary },
                        ]}
                      >
                        {d.name}
                      </Text>
                      <Text style={styles.suggestionSub}>{d.region}</Text>
                    </View>
                    <ChevronRight
                      size={18}
                      color={selected ? colors.primary : colors.textSecondary}
                      strokeWidth={2.75}
                    />
                  </Pressable>
                );
              })}
            </View>
          ) : null}

          <View style={styles.divider} />

          {/* Dates / duration */}
          <Text style={styles.sectionLabel}>DATES / DURATION</Text>
          <Text style={styles.hintText}>
            MVP: pick duration (dates coming soon — but the plan still feels
            real).
          </Text>
          <View style={styles.rowWrap}>
            {DURATION_OPTIONS.map((opt) => (
              <Chip
                key={opt.key}
                label={opt.label}
                tone="orange"
                selected={Number(wizard.durationDays) === opt.key}
                onPress={() => setWizardField("durationDays", opt.key)}
              />
            ))}
          </View>

          <View style={styles.divider} />

          {/* Rider + bike */}
          <Text style={styles.sectionLabel}>RIDER & BIKE</Text>
          <View style={{ gap: spacing.md, marginTop: spacing.md }}>
            <AppCard padding={spacing.lg} style={styles.inlineCard}>
              <Text style={styles.inlineTitle}>Rider</Text>
              <Text style={styles.inlineValue}>
                {wizard.riderProfile?.skillLevel || "Intermediate"} • Fitness:{" "}
                {wizard.riderProfile?.fitness || "Medium"}
              </Text>
              <Text style={styles.inlineSub}>
                Strengths: {(wizard.riderProfile?.strengths || []).join(" • ")}
              </Text>
            </AppCard>

            <AppCard padding={spacing.lg} style={styles.inlineCard}>
              <Text style={styles.inlineTitle}>Bike</Text>
              <Text style={styles.inlineValue}>
                {wizard.riderProfile?.bikeType || "Trail"} bike
              </Text>
              <Text style={styles.inlineSub}>
                Current rig: {selectedBike?.name || "Pick in Garage"}
              </Text>
            </AppCard>
          </View>

          <View style={styles.divider} />

          {/* Preferences */}
          <Text style={styles.sectionLabel}>TRAIL PREFERENCES</Text>

          <Text style={styles.filterLabel}>Difficulty</Text>
          <View style={styles.rowWrap}>
            {[
              { key: "easy", label: "Easy" },
              { key: "medium", label: "Medium" },
              { key: "hard", label: "Hard" },
            ].map((d) => (
              <Chip
                key={d.key}
                label={d.label}
                tone="orange"
                selected={wizard.preferences?.difficulty === d.key}
                onPress={() =>
                  setWizardNestedField("preferences", "difficulty", d.key)
                }
              />
            ))}
          </View>

          <View style={{ marginTop: spacing.lg, gap: spacing.md }}>
            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>Flow lines</Text>
              <Switch
                value={Boolean(wizard.preferences?.wantsFlow)}
                onValueChange={(v) =>
                  setWizardNestedField("preferences", "wantsFlow", v)
                }
                trackColor={{ true: colors.primaryLight, false: colors.border }}
                thumbColor={colors.surface}
              />
            </View>
            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>Tech spice</Text>
              <Switch
                value={Boolean(wizard.preferences?.wantsTech)}
                onValueChange={(v) =>
                  setWizardNestedField("preferences", "wantsTech", v)
                }
                trackColor={{ true: colors.primaryLight, false: colors.border }}
                thumbColor={colors.surface}
              />
            </View>
            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>Jump lines</Text>
              <Switch
                value={Boolean(wizard.preferences?.wantsJumps)}
                onValueChange={(v) =>
                  setWizardNestedField("preferences", "wantsJumps", v)
                }
                trackColor={{ true: colors.primaryLight, false: colors.border }}
                thumbColor={colors.surface}
              />
            </View>
          </View>

          <View style={styles.divider} />

          {/* Constraints */}
          <Text style={styles.sectionLabel}>TRIP CONSTRAINTS</Text>

          <Text style={styles.filterLabel}>Budget</Text>
          <View style={styles.rowWrap}>
            {["$", "$$", "$$$"].map((b) => (
              <Chip
                key={b}
                label={`Budget: ${b}`}
                tone="orange"
                selected={wizard.constraints?.budget === b}
                onPress={() => setWizardNestedField("constraints", "budget", b)}
              />
            ))}
          </View>

          <Text style={[styles.filterLabel, { marginTop: spacing.lg }]}>
            Group size
          </Text>
          <View style={styles.rowWrap}>
            {[1, 2, 3, 4].map((n) => (
              <Chip
                key={n}
                label={n === 1 ? "Solo" : `${n} riders`}
                tone="orange"
                selected={Number(wizard.constraints?.groupSize) === n}
                onPress={() =>
                  setWizardNestedField("constraints", "groupSize", n)
                }
              />
            ))}
          </View>

          <Text style={[styles.filterLabel, { marginTop: spacing.lg }]}>
            Stay
          </Text>
          <View style={styles.rowWrap}>
            {["Lodge", "Cabin", "Hotel", "Camp"].map((t) => (
              <Chip
                key={t}
                label={t}
                tone="orange"
                selected={wizard.constraints?.accommodationType === t}
                onPress={() =>
                  setWizardNestedField("constraints", "accommodationType", t)
                }
              />
            ))}
          </View>

          <View style={styles.divider} />

          <View style={{ height: spacing.xl }} />

          <AppButton
            title={loading ? "Generating…" : "Generate Trip Plan"}
            onPress={onGenerate}
            size="large"
            loading={loading}
            disabled={!canGenerate}
          />

          <Text style={styles.ctaNote}>
            Expect: trails + food + sleep + a tiny bit of hype.
          </Text>
        </AppCard>

        {/* Discovery modules live BELOW the wizard card as separate boxes */}
        <AppCard style={styles.discoveryCard}>
          <RecommendedTripsCarousel
            title="Recommended Trips"
            subtitle="Handpicked trips based on your riding style and what’s trending"
            destinations={recommendedTrips}
            selectedFilter={recFilter}
            onSelectFilter={setRecFilter}
            onPressDestination={(d) => prefillAndPlan(d, "recommended")}
            riderCharacter={riderCharacter}
            userProfile={userProfile}
          />
        </AppCard>

        <AppCard style={styles.discoveryCard}>
          <BucketListCarousel
            title="Bucket List Trips"
            subtitle="Dream rides worth training for"
            destinations={bucketListTrips}
            onPressDestination={(d) => prefillAndPlan(d, "bucket")}
            onToast={showToast}
          />
        </AppCard>
      </ScrollView>

      {toast ? (
        <View pointerEvents="none" style={styles.toastWrap}>
          <View style={styles.toastCard}>
            <Text style={styles.toastText}>{toast}</Text>
          </View>
        </View>
      ) : null}
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

  summaryCard: {
    backgroundColor: colors.surfaceWarm,
    borderColor: colors.border,
    marginBottom: spacing.xl,
  },
  summaryHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  summaryIcon: {
    width: 28,
    height: 28,
    borderRadius: radius.round,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  summaryTitle: {
    fontSize: 16,
    lineHeight: 18,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
  },
  summaryText: {
    fontSize: typography.base,
    lineHeight: 19,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },

  card: {
    backgroundColor: colors.surface,
    borderColor: colors.borderLight,
  },

  discoveryCard: {
    marginTop: spacing.xl,
    backgroundColor: colors.surface,
    borderColor: colors.borderLight,
  },

  sectionLabel: {
    fontSize: typography.xs,
    fontFamily: typography.fontFamily.black,
    color: colors.textSecondary,
    letterSpacing: 1.1,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: spacing.xl,
  },

  inputWrap: {
    marginTop: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceWarm,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: typography.base,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textPrimary,
  },

  suggestionsWrap: {
    marginTop: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  suggestionRow: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  suggestionSelected: {
    backgroundColor: colors.primarySoft,
  },
  suggestionTitle: {
    fontSize: 15,
    lineHeight: 18,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  suggestionSub: {
    marginTop: 2,
    fontSize: typography.sm,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textSecondary,
  },

  hintText: {
    marginTop: spacing.sm,
    fontSize: typography.sm,
    lineHeight: 16,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textSecondary,
  },

  rowWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.md,
  },

  inlineCard: {
    backgroundColor: colors.surfaceWarm,
    borderColor: colors.border,
  },
  inlineTitle: {
    fontSize: typography.sm,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
  },
  inlineValue: {
    marginTop: 4,
    fontSize: 15,
    lineHeight: 18,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  inlineSub: {
    marginTop: 6,
    fontSize: typography.sm,
    lineHeight: 16,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },

  filterLabel: {
    marginTop: spacing.md,
    fontSize: typography.sm,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
  },

  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  toggleLabel: {
    fontSize: typography.base,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textPrimary,
  },

  ctaNote: {
    marginTop: spacing.md,
    fontSize: typography.sm,
    lineHeight: 17,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textSecondary,
    textAlign: "center",
  },

  toastWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 24,
    alignItems: "center",
    paddingHorizontal: spacing.xl,
  },
  toastCard: {
    backgroundColor: colors.textPrimary,
    borderRadius: radius.round,
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    ...shadows.large,
  },
  toastText: {
    fontSize: typography.sm,
    fontFamily: typography.fontFamily.black,
    color: "#fff",
  },
});
