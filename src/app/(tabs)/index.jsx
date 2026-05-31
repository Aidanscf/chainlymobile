import React, { useMemo } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Bell, Settings, Sparkles, Trophy, Camera } from "lucide-react-native";
import { colors, spacing, radius, typography } from "../../theme/index";
import { quickActions, leagueData, riderCharacter } from "../../data/mock";
import { useChainlyStore } from "@/store/chainlyStore";
import { useRidesStore } from "@/store/rides";
import { useUserCharacter } from "@/store/userCharacter";
import { useMediaAnalyzerStore } from "@/store/mediaAnalyzer";
import { computeMaintenanceQuests } from "@/utils/maintenanceQuests";
import { FEATURE_TRIP_PLANNER_ENABLED } from "@/utils/featureFlags";
import AppCard from "../../components/AppCard";
import SectionHeader from "../../components/SectionHeader";
import BikeCard from "../../components/BikeCard";
import QuickActionCard from "../../components/QuickActionCard";

// Demo bikes use small numeric ids like "1"; real bikes use UUIDs.
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const bikes = useChainlyStore((s) => s.bikes);
  const maintenanceEventsByBikeId = useChainlyStore(
    (s) => s.maintenanceEventsByBikeId,
  );
  const rides = useRidesStore((s) => s.rides);

  // Get user's current character data
  const userCharacter = useUserCharacter();
  const hasCharacter = userCharacter.hasCharacter();
  const characterData = userCharacter.getCharacterData();

  // Build dynamic character display data
  const displayCharacter = useMemo(() => {
    if (!hasCharacter || !characterData) {
      // New user - show placeholder
      return {
        characterName: "Your Rider Character",
        subtitle: "Unlock your character by analyzing your first ride",
        avatar: null,
        overall: 0,
        isPlaceholder: true,
      };
    }

    // User has completed analysis - show their actual character
    return {
      characterName: characterData.name,
      subtitle: characterData.subtitle,
      avatar: characterData.avatar,
      overall: userCharacter.overallScore || riderCharacter.overall,
      isPlaceholder: false,
    };
  }, [hasCharacter, characterData, userCharacter.overallScore]);

  const bikesWithQuestUI = useMemo(() => {
    const list = Array.isArray(bikes) ? bikes : [];
    const eventsMap = maintenanceEventsByBikeId || {};
    const ridesList = Array.isArray(rides) ? rides : [];

    return list.map((bike) => {
      const id = String(bike?.id || "");

      // Preserve demo bike UI exactly as-is.
      if (!UUID_REGEX.test(id)) {
        return bike;
      }

      const maintenanceEvents = Array.isArray(eventsMap?.[id])
        ? eventsMap[id]
        : [];

      const quests = computeMaintenanceQuests({
        bike,
        rides: ridesList,
        maintenanceEvents,
      });

      return {
        ...bike,
        // UI-only quest summary used by BikeCard.
        questStats: {
          urgent: quests.urgent.length,
          dueSoon: quests.dueSoon.length,
          completed: quests.ok.length,
        },
      };
    });
  }, [bikes, maintenanceEventsByBikeId, rides]);

  const strengths = riderCharacter.strengths.slice(0, 3);

  const onOpenLeagues = useMemo(() => {
    return () => router.push("/leagues/overview");
  }, [router]);

  const rawQuickActions = Array.isArray(quickActions) ? quickActions : [];

  const analyzerCoachAction = useMemo(() => {
    return {
      id: "analyzer-coach",
      title: "Analyzer Coach",
      icon: "Video",
      route: "/ai/media-analyzer",
    };
  }, []);

  const visibleQuickActions = useMemo(() => {
    // Ensure we don't accidentally render duplicates if this gets added to mocks later.
    const base = rawQuickActions.filter(
      (a) => a?.route !== "/ai/media-analyzer",
    );

    const tripPlannerIndex = base.findIndex(
      (a) => a?.route === "/ai/trip-planner",
    );

    // While Trip Planner is hidden, replace its Home tile with Analyzer Coach
    // so the grid stays intentional with no empty gap.
    if (!FEATURE_TRIP_PLANNER_ENABLED) {
      const withoutTripPlanner = base.filter(
        (a) => a?.route !== "/ai/trip-planner",
      );

      if (tripPlannerIndex >= 0) {
        return [
          ...base.slice(0, tripPlannerIndex),
          analyzerCoachAction,
          ...base
            .slice(tripPlannerIndex + 1)
            .filter((a) => a?.route !== "/ai/trip-planner"),
        ];
      }

      // Fallback: if the Trip Planner tile isn't in the list, just prepend Analyzer Coach.
      return [analyzerCoachAction, ...withoutTripPlanner];
    }

    // When Trip Planner is enabled, keep it AND also show Analyzer Coach right after it
    // (this keeps Analyzer Coach near the other AI entries).
    if (tripPlannerIndex >= 0) {
      return [
        ...base.slice(0, tripPlannerIndex + 1),
        analyzerCoachAction,
        ...base.slice(tripPlannerIndex + 1),
      ];
    }

    return [...base, analyzerCoachAction];
  }, [analyzerCoachAction, rawQuickActions, FEATURE_TRIP_PLANNER_ENABLED]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <AppCard
          style={styles.headerCard}
          padding={spacing.lg}
          pressable={false}
        >
          <View style={styles.headerInner}>
            <View style={styles.logoContainer}>
              <View style={styles.logoIconWrap}>
                <Image
                  source="https://ucarecdn.com/b00584be-6519-4cce-a262-fcfdd2400ee7/-/format/auto/"
                  style={styles.logoIcon}
                  contentFit="contain"
                />
              </View>
              <View>
                <Text style={styles.logoText}>Chainly</Text>
                <Text style={styles.logoSub}>Ride Smarter</Text>
              </View>
            </View>

            <View style={styles.headerActions}>
              <AppCard
                style={styles.headerIconButton}
                onPress={() => router.push("/notifications")}
              >
                <Bell size={20} color={colors.primary} strokeWidth={2.25} />
              </AppCard>
              <AppCard
                style={styles.headerIconButton}
                onPress={() => router.push("/settings")}
              >
                <Settings size={20} color={colors.primary} strokeWidth={2.25} />
              </AppCard>
            </View>
          </View>
        </AppCard>

        {/* Rider Character (preview) */}
        <AppCard
          style={styles.characterCard}
          onPress={() => router.push("/leagues/character")}
        >
          <View style={styles.heroTopRow}>
            <View style={styles.heroBadge}>
              <Sparkles size={16} color={colors.primary} strokeWidth={2.5} />
              <Text style={styles.heroBadgeText}>Rider Character</Text>
            </View>
            <View style={styles.scoreChip}>
              <Text style={styles.scoreChipLabel}>Overall</Text>
              <Text style={styles.scoreChipValue}>
                {displayCharacter.overall}
              </Text>
            </View>
          </View>

          <View style={styles.avatarRing}>
            <View style={styles.avatarRingInner}>
              <Image
                source={displayCharacter.avatar}
                style={styles.avatar}
                contentFit="cover"
              />
            </View>
          </View>

          <Text style={styles.characterName}>
            {displayCharacter.characterName}
          </Text>

          <View style={styles.strengthRow}>
            {strengths.map((s) => (
              <View key={s} style={styles.strengthChip}>
                <Text style={styles.strengthChipText}>{s}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.heroHint}>Tap to open your Skill Tree →</Text>
        </AppCard>

        {/* Recommended Trips (discovery module) */}
        {/* (Removed) RecommendedTripsCarousel */}

        {/* Bikes + Quests */}
        <SectionHeader
          title="My Bikes"
          subtitle="Keep your rigs happy"
          action="Add"
          onActionPress={() => router.push("/garage/add-bike")}
        />
        {bikesWithQuestUI.map((bike) => (
          <BikeCard
            key={bike.id}
            bike={bike}
            onPress={() => router.push(`/garage/${bike.id}`)}
          />
        ))}

        {/* AI Tools */}
        <SectionHeader
          title="AI Tools"
          subtitle="Quick helpers when you’re stuck"
        />
        <View style={styles.quickActionsGrid}>
          {visibleQuickActions.map((action) => {
            const onPress = () => {
              if (action?.route) {
                router.push(action.route);
                return;
              }
              console.log("Action", action.title);
            };

            return (
              <View key={action.id} style={styles.quickActionWrap}>
                <QuickActionCard
                  icon={action.icon}
                  title={action.title}
                  color={colors.primary}
                  onPress={onPress}
                />
              </View>
            );
          })}
        </View>

        {/* Leagues */}
        <SectionHeader
          title="Leagues"
          subtitle="Chasing that next tier"
          action="View All"
          onActionPress={onOpenLeagues}
        />

        <AppCard style={styles.leagueCard} onPress={onOpenLeagues}>
          <View style={styles.leagueHeader}>
            <View style={styles.trophyContainer}>
              <Trophy size={28} color={colors.warning} strokeWidth={2.25} />
            </View>
            <View style={styles.leagueInfo}>
              <Text style={styles.leagueTier}>{leagueData.tier}</Text>
              <Text style={styles.leaguePercentile}>
                {leagueData.percentile}
              </Text>
            </View>
          </View>
          <View style={styles.leagueStats}>
            <View style={styles.leagueStat}>
              <Text style={styles.leagueRank}>
                #{leagueData.rank.toLocaleString()}
              </Text>
              <Text style={styles.leagueLabel}>Your Rank</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.leagueStat}>
              <Text style={styles.leagueRank}>
                {leagueData.placesFromPromotion}
              </Text>
              <Text style={styles.leagueLabel}>To Promotion</Text>
            </View>
          </View>
        </AppCard>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.xl,
  },

  headerCard: {
    marginBottom: spacing.xxl,
    borderWidth: 1,
    borderColor: colors.borderLight,
    backgroundColor: colors.surface,
  },
  headerInner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  logoIconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.round,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primarySoft2,
    alignItems: "center",
    justifyContent: "center",
  },
  logoIcon: {
    width: 30,
    height: 30,
  },
  logoText: {
    fontSize: 22,
    lineHeight: 24,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  logoSub: {
    marginTop: 2,
    fontSize: typography.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },

  headerActions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  headerIconButton: {
    width: 44,
    height: 44,
    borderRadius: radius.round,
    alignItems: "center",
    justifyContent: "center",
    padding: 0,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primarySoft2,
    // Remove card shadow inside a card for a cleaner “accent pill” look.
    shadowColor: "transparent",
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
  },

  characterCard: {
    backgroundColor: colors.surface, // match bike cards (pure white)
    borderColor: colors.borderLight,
    alignItems: "center",
    paddingVertical: spacing.xxl,
    marginBottom: spacing.xxxl,
  },
  heroTopRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.lg,
  },
  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.round,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primarySoft2,
  },
  heroBadgeText: {
    fontSize: typography.sm,
    fontFamily: typography.fontFamily.bold,
    color: colors.primary,
  },
  scoreChip: {
    alignItems: "flex-end",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.round,
    backgroundColor: colors.primarySoft, // contrast vs white
    borderWidth: 1,
    borderColor: colors.primarySoft2,
  },
  scoreChipLabel: {
    fontSize: 11,
    fontFamily: typography.fontFamily.semibold,
    color: colors.primary,
  },
  scoreChipValue: {
    marginTop: 2,
    fontSize: 22,
    lineHeight: 22,
    fontFamily: typography.fontFamily.black,
    color: colors.primary,
    letterSpacing: -0.2,
  },

  avatarRing: {
    width: 118,
    height: 118,
    borderRadius: radius.round,
    backgroundColor: colors.primarySoft2,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.primary,
  },
  avatarRingInner: {
    width: 106,
    height: 106,
    borderRadius: radius.round,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: radius.round,
  },
  characterName: {
    marginTop: spacing.lg,
    fontSize: 24,
    lineHeight: 26,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    letterSpacing: -0.5,
    textAlign: "center",
  },
  strengthRow: {
    marginTop: spacing.md,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: spacing.sm,
  },
  strengthChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.round,
    backgroundColor: colors.primarySoft, // tags pop on white
    borderWidth: 1,
    borderColor: colors.primarySoft2,
  },
  strengthChipText: {
    fontSize: typography.sm,
    fontFamily: typography.fontFamily.bold,
    color: colors.primary,
  },
  heroHint: {
    marginTop: spacing.lg,
    fontSize: typography.sm,
    lineHeight: 17,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textSecondary,
  },

  quickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: spacing.xxxl,
    marginTop: spacing.sm,
  },
  quickActionWrap: {
    width: "50%",
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.lg,
  },

  leagueCard: {
    marginBottom: spacing.xl,
  },
  leagueHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.xl,
    gap: spacing.lg,
  },
  trophyContainer: {
    width: 64,
    height: 64,
    borderRadius: radius.round,
    backgroundColor: colors.iconBgYellow,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.warningSoft,
  },
  leagueInfo: {
    flex: 1,
  },
  leagueTier: {
    fontSize: 20,
    lineHeight: 22,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    letterSpacing: -0.2,
  },
  leaguePercentile: {
    fontSize: typography.base,
    lineHeight: 18,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
  leagueStats: {
    flexDirection: "row",
    alignItems: "center",
  },
  leagueStat: {
    flex: 1,
    alignItems: "center",
  },
  leagueRank: {
    fontSize: 24,
    lineHeight: 26,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    letterSpacing: -0.4,
  },
  leagueLabel: {
    fontSize: typography.sm,
    lineHeight: 16,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
  divider: {
    width: 1,
    height: 44,
    backgroundColor: colors.border,
  },
});
