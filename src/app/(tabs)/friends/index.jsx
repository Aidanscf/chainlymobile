import React, { useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  Pressable,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import {
  UserPlus,
  ChevronRight,
  Sparkles,
  UsersRound,
} from "lucide-react-native";
import { useQuery } from "@tanstack/react-query";

import AppCard from "@/components/AppCard";
import AppButton from "@/components/AppButton";
import LeagueBadge from "@/components/friends/LeagueBadge.jsx";
import { colors, spacing, radius, typography, shadows } from "@/theme/index";
import { useFriendsStore } from "@/store/friends.js";
import { apiFetch } from "@/services/apiClient";
import { useAuth } from "@/utils/auth";

function keyStat(friend) {
  const s = friend?.stats || {};
  const pairs = [
    { key: "climbing", label: "Climbing", value: s.climbing },
    { key: "tech", label: "Tech", value: s.tech },
    { key: "flow", label: "Flow", value: s.flow },
    { key: "cornering", label: "Cornering", value: s.cornering },
  ].filter((x) => typeof x.value === "number");

  const best = pairs.sort((a, b) => (b.value || 0) - (a.value || 0))[0];
  if (!best) {
    return { label: "Overall", value: friend?.overallScore || 0 };
  }
  return best;
}

function normalizeFriendFromApi(raw) {
  const id = raw?.id ? String(raw.id) : "";
  const name = raw?.display_name ? String(raw.display_name) : "Rider";
  const avatarUrl = raw?.avatar_url ? String(raw.avatar_url) : null;
  const avatarFallback = `https://i.pravatar.cc/150?u=${encodeURIComponent(id || name)}`;

  return {
    id,
    name,
    avatar: avatarUrl || avatarFallback,
    characterTitle: "Riding buddy",
    leagueTier: raw?.league_tier ? String(raw.league_tier) : "Bronze",
    leagueRank:
      typeof raw?.league_rank === "number"
        ? raw.league_rank
        : Number(raw?.league_rank || 0),
    overallScore:
      typeof raw?.overall_score === "number"
        ? raw.overall_score
        : Number(raw?.overall_score || 0),
    stats:
      raw?.stat_tree_summary && typeof raw.stat_tree_summary === "object"
        ? raw.stat_tree_summary
        : {},
    bikeHealthScore:
      typeof raw?.bike_health_score === "number"
        ? raw.bike_health_score
        : Number(raw?.bike_health_score || 0),
  };
}

export default function FriendsHomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { isReady, isAuthenticated, signIn } = useAuth();

  const currentUser = useFriendsStore((s) => s.currentUser);

  const meQuery = useQuery({
    queryKey: ["friends", "me"],
    enabled: !!(isReady && isAuthenticated),
    queryFn: async () => {
      return await apiFetch("/api/friends/me", { method: "GET" });
    },
  });

  const listQuery = useQuery({
    queryKey: ["friends", "list"],
    enabled: !!(isReady && isAuthenticated),
    queryFn: async () => {
      return await apiFetch("/api/friends/list", { method: "GET" });
    },
  });

  const friends = useMemo(() => {
    const rows = listQuery.data?.friends;
    const arr = Array.isArray(rows) ? rows : [];
    return arr.map(normalizeFriendFromApi);
  }, [listQuery.data?.friends]);

  // Call these functions in useMemo to prevent infinite loops
  const leaderboard = useMemo(() => {
    const combined = [currentUser, ...(friends || [])];
    const sorted = combined
      .slice()
      .sort((a, b) => (b.overallScore || 0) - (a.overallScore || 0));
    return sorted.map((p, idx) => ({ ...p, rank: idx + 1 }));
  }, [friends, currentUser]);

  const featured = useMemo(() => {
    return (friends || [])[0] || null;
  }, [friends]);

  const friendsRow = useMemo(() => {
    return Array.isArray(friends) ? friends.slice(0, 12) : [];
  }, [friends]);

  const openFriendCompare = useCallback(
    (id) => {
      router.push(`/friends/${id}/compare`);
    },
    [router],
  );

  const openCommunity = useCallback(() => {
    router.push("/community");
  }, [router]);

  const renderFriendBubble = useCallback(
    ({ item }) => {
      return (
        <Pressable
          onPress={() => openFriendCompare(item.id)}
          style={styles.bubbleWrap}
          hitSlop={10}
        >
          <View style={styles.bubbleAvatarWrap}>
            <Image
              source={item.avatar}
              style={styles.bubbleAvatar}
              contentFit="cover"
            />
            <View style={styles.onlineDot} />
          </View>
          <Text style={styles.bubbleName} numberOfLines={1}>
            {String(item.name || "Rider").split(" ")[0]}
          </Text>
        </Pressable>
      );
    },
    [openFriendCompare],
  );

  const headerCopy = useMemo(() => {
    const incoming = Number(meQuery.data?.pending_incoming_count || 0);
    if (incoming > 0) {
      return `You have ${incoming} request${incoming === 1 ? "" : "s"}`;
    }
    return "Ride together. Level up together.";
  }, [meQuery.data?.pending_incoming_count]);

  const friendCode = useMemo(() => {
    const raw = meQuery.data?.friend_code;
    return raw ? String(raw) : null;
  }, [meQuery.data?.friend_code]);

  if (!isReady) {
    return null;
  }

  if (!isAuthenticated) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBar style="dark" />
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={{
            padding: spacing.xl,
            paddingBottom: insets.bottom + 24,
          }}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Friends</Text>
          <Text style={styles.subtitle}>
            Sign in to add friends and nudge rides.
          </Text>

          <View style={{ height: spacing.lg }} />

          <AppCard
            style={{ backgroundColor: colors.surface }}
            pressable={false}
          >
            <Text style={styles.sectionTitle}>
              Friends are tied to your account
            </Text>
            <Text style={styles.sectionSub}>
              Sign in and we’ll sync your crew across devices.
            </Text>
            <View style={{ height: spacing.lg }} />
            <AppButton title="Sign In" onPress={() => router.push("/login")} />
          </AppCard>
        </ScrollView>
      </View>
    );
  }

  const showLoading = listQuery.isLoading || meQuery.isLoading;
  const hasFriends = friends.length > 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{
          padding: spacing.xl,
          paddingBottom: insets.bottom + 24,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Friends</Text>
            <Text style={styles.subtitle}>{headerCopy}</Text>
          </View>
          <AppCard
            style={styles.addFriendButton}
            onPress={() => router.push("/friends/add-friend")}
          >
            <UserPlus size={18} color={colors.primary} strokeWidth={2.75} />
          </AppCard>
        </View>

        {/* Friend code callout */}
        <AppCard style={styles.codeCard} pressable={false}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Your friend code</Text>
            <Pressable
              onPress={() => router.push("/friends/add-friend")}
              style={styles.addLink}
              hitSlop={10}
            >
              <Text style={styles.addLinkText}>Add friend</Text>
              <ChevronRight
                size={16}
                color={colors.primary}
                strokeWidth={2.75}
              />
            </Pressable>
          </View>
          <Text style={styles.codeValue}>
            {friendCode || (showLoading ? "Loading…" : "—")}
          </Text>
          <Text style={styles.friendsRowHint}>
            Share your code or enter a friend’s code to connect.
          </Text>
        </AppCard>

        <View style={{ height: spacing.lg }} />

        {/* Community CTA */}
        <AppCard style={styles.communityCard} onPress={openCommunity}>
          <View style={styles.communityIconWrap}>
            <UsersRound size={22} color={colors.primary} strokeWidth={2.5} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.communityTitle}>Open Chainly Club</Text>
            <Text style={styles.communitySub}>
              Community • Events • Threads • Updates
            </Text>
          </View>
          <ChevronRight size={20} color={colors.primary} strokeWidth={2.75} />
        </AppCard>

        <View style={{ height: spacing.lg }} />

        {/* Friends Row */}
        <AppCard style={styles.friendsRowCard} pressable={false}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Your crew</Text>
            <Pressable
              onPress={() => router.push("/friends/add-friend")}
              style={styles.addLink}
              hitSlop={10}
            >
              <Text style={styles.addLinkText}>Manage</Text>
              <ChevronRight
                size={16}
                color={colors.primary}
                strokeWidth={2.75}
              />
            </Pressable>
          </View>

          {hasFriends ? (
            <FlatList
              data={friendsRow}
              keyExtractor={(item) => String(item.id)}
              horizontal
              style={{ flexGrow: 0 }}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingVertical: spacing.md }}
              renderItem={renderFriendBubble}
            />
          ) : (
            <View style={{ marginTop: spacing.md }}>
              <Text style={styles.friendsRowHint}>
                No friends yet — add your first friend with a code.
              </Text>
              <View style={{ height: spacing.md }} />
              <AppButton
                title="Add your first friend"
                onPress={() => router.push("/friends/add-friend")}
              />
            </View>
          )}
        </AppCard>

        <View style={{ height: spacing.lg }} />

        {/* Leaderboard */}
        <AppCard style={styles.leaderboardCard} pressable={false}>
          <Text style={styles.sectionTitle}>Leaderboard</Text>
          <Text style={styles.sectionSub}>
            Friendly ranks — pure motivation.
          </Text>

          <View style={{ height: spacing.md }} />

          {showLoading ? (
            <Text style={styles.friendsRowHint}>Loading friends…</Text>
          ) : null}

          {!showLoading && !hasFriends ? (
            <Text style={styles.friendsRowHint}>
              Add a friend to start the leaderboard.
            </Text>
          ) : null}

          {hasFriends ? (
            <View style={{ gap: spacing.sm }}>
              {leaderboard.slice(0, 6).map((p) => {
                const isMe = p.id === "me";
                const stat = keyStat(p);

                const onPressRow = () => {
                  if (!isMe) {
                    openFriendCompare(p.id);
                  }
                };

                return (
                  <Pressable
                    key={p.id}
                    onPress={onPressRow}
                    disabled={isMe}
                    style={[styles.rankRow, isMe ? styles.rankRowMe : null]}
                  >
                    <Text style={styles.rankNum}>{p.rank}</Text>

                    <View style={styles.rankAvatarWrap}>
                      <Image
                        source={p.avatar}
                        style={styles.rankAvatar}
                        contentFit="cover"
                      />
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={styles.rankName}>
                        {isMe ? "You" : p.name}
                      </Text>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 8,
                          marginTop: 6,
                        }}
                      >
                        <LeagueBadge tier={p.leagueTier} compact />
                        <Text style={styles.rankMeta}>#{p.leagueRank}</Text>
                      </View>
                    </View>

                    <View style={{ alignItems: "flex-end" }}>
                      <Text style={styles.rankStatValue}>{stat.value}</Text>
                      <Text style={styles.rankStatLabel}>{stat.label}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          ) : null}
        </AppCard>

        <View style={{ height: spacing.lg }} />

        {/* Featured friend */}
        {featured ? (
          <AppCard style={styles.featuredCard} pressable={false}>
            <View style={styles.featuredTopRow}>
              <View style={styles.featuredBadge}>
                <Sparkles size={16} color={colors.primary} strokeWidth={2.5} />
                <Text style={styles.featuredBadgeText}>Training partner</Text>
              </View>
              <LeagueBadge tier={featured.leagueTier} />
            </View>

            <View style={styles.featuredMainRow}>
              <View style={styles.featuredAvatarRing}>
                <View style={styles.featuredAvatarInner}>
                  <Image
                    source={featured.avatar}
                    style={styles.featuredAvatar}
                    contentFit="cover"
                  />
                </View>
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.featuredName}>{featured.name}</Text>
                <Text style={styles.featuredTitle}>
                  {featured.characterTitle}
                </Text>

                <View style={styles.featuredStatsRow}>
                  <View style={styles.miniStat}>
                    <Text style={styles.miniStatValue}>
                      {featured.stats.tech}
                    </Text>
                    <Text style={styles.miniStatLabel}>Tech</Text>
                  </View>
                  <View style={styles.miniStat}>
                    <Text style={styles.miniStatValue}>
                      {featured.stats.flow}
                    </Text>
                    <Text style={styles.miniStatLabel}>Flow</Text>
                  </View>
                  <View style={styles.miniStat}>
                    <Text style={styles.miniStatValue}>
                      {featured.stats.climbing}
                    </Text>
                    <Text style={styles.miniStatLabel}>Climb</Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={{ height: spacing.lg }} />

            <AppButton
              title="Compare"
              onPress={() => openFriendCompare(featured.id)}
            />
          </AppCard>
        ) : null}
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

  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: 32,
    lineHeight: 34,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    letterSpacing: -0.6,
  },
  subtitle: {
    fontSize: typography.base,
    lineHeight: 20,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
  addFriendButton: {
    width: 46,
    height: 46,
    borderRadius: radius.round,
    alignItems: "center",
    justifyContent: "center",
    padding: 0,
  },

  codeCard: {
    backgroundColor: colors.surface,
  },
  codeValue: {
    marginTop: spacing.md,
    fontSize: 22,
    letterSpacing: 1.2,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
  },

  friendsRowCard: {
    backgroundColor: colors.surface,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontSize: 22,
    lineHeight: 24,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  sectionSub: {
    marginTop: 6,
    fontSize: typography.base,
    lineHeight: 20,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
  addLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 6,
    paddingLeft: 10,
  },
  addLinkText: {
    fontSize: typography.sm,
    fontFamily: typography.fontFamily.black,
    color: colors.primary,
  },

  bubbleWrap: {
    width: 76,
    alignItems: "center",
    marginRight: spacing.md,
  },
  bubbleAvatarWrap: {
    width: 64,
    height: 64,
    borderRadius: radius.round,
    backgroundColor: colors.borderLight,
    borderWidth: 2,
    borderColor: colors.primarySoft2,
    overflow: "hidden",
    ...shadows.small,
  },
  bubbleAvatar: {
    width: "100%",
    height: "100%",
  },
  onlineDot: {
    position: "absolute",
    right: 4,
    bottom: 4,
    width: 12,
    height: 12,
    borderRadius: radius.round,
    backgroundColor: colors.success,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  bubbleName: {
    marginTop: 8,
    fontSize: 11,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
  },
  friendsRowHint: {
    marginTop: spacing.sm,
    fontSize: typography.sm,
    lineHeight: 17,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },

  leaderboardCard: {
    backgroundColor: colors.surface,
  },
  rankRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceWarm,
  },
  rankRowMe: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primarySoft2,
  },
  rankNum: {
    width: 22,
    textAlign: "center",
    fontSize: typography.sm,
    fontFamily: typography.fontFamily.black,
    color: colors.textSecondary,
  },
  rankAvatarWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.round,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.borderLight,
  },
  rankAvatar: {
    width: "100%",
    height: "100%",
  },
  rankName: {
    fontSize: 15,
    lineHeight: 16,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  rankMeta: {
    fontSize: 11,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textSecondary,
  },
  rankStatValue: {
    fontSize: 18,
    lineHeight: 18,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  rankStatLabel: {
    marginTop: 4,
    fontSize: 11,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textSecondary,
  },

  featuredCard: {
    backgroundColor: colors.surfaceWarm,
    borderColor: colors.border,
  },
  featuredTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  featuredBadge: {
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
  featuredBadgeText: {
    fontSize: typography.sm,
    fontFamily: typography.fontFamily.bold,
    color: colors.primary,
  },
  featuredMainRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
    marginTop: spacing.lg,
  },
  featuredAvatarRing: {
    width: 86,
    height: 86,
    borderRadius: radius.round,
    backgroundColor: colors.primarySoft2,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.primary,
  },
  featuredAvatarInner: {
    width: 76,
    height: 76,
    borderRadius: radius.round,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  featuredAvatar: {
    width: "100%",
    height: "100%",
  },
  featuredName: {
    fontSize: 18,
    lineHeight: 20,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  featuredTitle: {
    marginTop: 6,
    fontSize: typography.sm,
    lineHeight: 17,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textSecondary,
  },
  featuredStatsRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.md,
  },
  miniStat: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  miniStatValue: {
    fontSize: 18,
    lineHeight: 18,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  miniStatLabel: {
    marginTop: 4,
    fontSize: 11,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textSecondary,
  },

  communityCard: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primarySoft2,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  communityIconWrap: {
    width: 48,
    height: 48,
    borderRadius: radius.round,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primarySoft2,
    alignItems: "center",
    justifyContent: "center",
  },
  communityTitle: {
    fontSize: 18,
    lineHeight: 20,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  communitySub: {
    marginTop: 4,
    fontSize: typography.sm,
    lineHeight: 16,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textSecondary,
  },
});
