import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  Alert,
  Modal,
  Pressable,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import ScreenHeader from "@/components/layout/ScreenHeader";
import AppCard from "@/components/AppCard";
import AppButton from "@/components/AppButton";
import LeagueBadge from "@/components/friends/LeagueBadge.jsx";
import StatCompareRow from "@/components/friends/StatCompareRow.jsx";
import { colors, spacing, radius, typography } from "@/theme/index";
import { useFriendsStore } from "@/store/friends.js";
import useNotificationsStore from "@/store/notifications";
import { apiFetch } from "@/services/apiClient";
import { useAuth } from "@/utils/auth";

const STAT_KEYS = [
  { key: "jumping", label: "Jumping" },
  { key: "cornering", label: "Cornering" },
  { key: "drops", label: "Drops" },
  { key: "flow", label: "Flow" },
  { key: "tech", label: "Tech" },
  { key: "climbing", label: "Climbing" },
];

function normalizeFriendProfilePayload(payload) {
  const id = payload?.id ? String(payload.id) : "";
  const name = payload?.display_name ? String(payload.display_name) : "Rider";
  const avatarUrl = payload?.avatar_url ? String(payload.avatar_url) : null;
  const avatarFallback = `https://i.pravatar.cc/150?u=${encodeURIComponent(id || name)}`;

  const stats =
    payload?.stat_tree && typeof payload.stat_tree === "object"
      ? payload.stat_tree
      : {};

  return {
    id,
    name,
    avatar: avatarUrl || avatarFallback,
    leagueTier: payload?.league_tier ? String(payload.league_tier) : "Bronze",
    leagueRank:
      typeof payload?.league_rank === "number"
        ? payload.league_rank
        : Number(payload?.league_rank || 0),
    overallScore:
      typeof payload?.overall_score === "number"
        ? payload.overall_score
        : Number(payload?.overall_score || 0),
    bikeHealthScore:
      typeof payload?.bike_health_score === "number"
        ? payload.bike_health_score
        : Number(payload?.bike_health_score || 0),
    stats,
  };
}

export default function CompareStatsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();
  const queryClient = useQueryClient();

  const friendId = String(params.friendId || "");

  const { isReady, isAuthenticated, signIn } = useAuth();

  const me = useFriendsStore((s) => s.currentUser);

  const friendNudgesEnabled = useNotificationsStore(
    (s) => s.preferences?.friendNudges?.enabled,
  );

  const [nudgeOpen, setNudgeOpen] = useState(false);

  const profileQuery = useQuery({
    queryKey: ["friends", "profile", friendId],
    enabled: !!(isReady && isAuthenticated && friendId),
    queryFn: async () => {
      return await apiFetch(
        `/api/friends/profile?user_id=${encodeURIComponent(friendId)}`,
        {
          method: "GET",
        },
      );
    },
  });

  const friend = useMemo(() => {
    const payload = profileQuery.data?.profile;
    if (!payload) {
      return null;
    }
    return normalizeFriendProfilePayload(payload);
  }, [profileQuery.data?.profile]);

  const rows = useMemo(() => {
    const left = me?.stats || {};
    const right = friend?.stats || {};
    return STAT_KEYS.map((k) => ({
      ...k,
      left: typeof left[k.key] === "number" ? left[k.key] : 0,
      right: typeof right[k.key] === "number" ? right[k.key] : 0,
    }));
  }, [friend, me]);

  const onBack = useCallback(async () => {
    try {
      if (Platform.OS !== "web") {
        await Haptics.selectionAsync();
      }
    } catch (e) {
      // no-op
    }
    router.back();
  }, [router]);

  const nudgeMutation = useMutation({
    mutationFn: async () => {
      return await apiFetch("/api/friends/nudge", {
        method: "POST",
        body: JSON.stringify({ friend_user_id: friendId }),
      });
    },
    onSuccess: async (data) => {
      const status = data?.status ? String(data.status) : "sent";

      try {
        if (Platform.OS !== "web") {
          await Haptics.notificationAsync(
            status === "sent"
              ? Haptics.NotificationFeedbackType.Success
              : Haptics.NotificationFeedbackType.Warning,
          );
        }
      } catch (e) {
        // no-op
      }

      if (status === "failed_no_token") {
        Alert.alert(
          "Friend has notifications off",
          "They need to enable notifications to get nudges.",
        );
      } else if (status === "sent") {
        Alert.alert("Nudge sent", "Keep it friendly — the ride will happen.");
      } else {
        Alert.alert("Couldn’t send nudge", "Try again in a moment.");
      }

      setNudgeOpen(false);
    },
    onError: (e) => {
      console.error(e);
      setNudgeOpen(false);
      Alert.alert("Couldn’t send nudge", "Try again in a moment.");
    },
    onSettled: async () => {
      // Not strictly required, but keeps UI fresh.
      await queryClient.invalidateQueries({ queryKey: ["friends", "me"] });
      await queryClient.invalidateQueries({ queryKey: ["friends", "list"] });
    },
  });

  const onOpenNudge = useCallback(async () => {
    if (!friend) {
      return;
    }

    if (!friendNudgesEnabled) {
      Alert.alert(
        "Friend nudges are off",
        "Turn them on in Settings → Notifications if you want ride invites.",
      );
      return;
    }

    try {
      if (Platform.OS !== "web") {
        await Haptics.selectionAsync();
      }
    } catch (e) {
      // no-op
    }

    setNudgeOpen(true);
  }, [friend, friendNudgesEnabled]);

  if (!isReady) {
    return null;
  }

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" />
        <ScreenHeader title="Compare" showBack onBack={onBack} />
        <View style={{ padding: spacing.xl }}>
          <AppCard
            style={{ backgroundColor: colors.surface }}
            pressable={false}
          >
            <Text style={styles.missingTitle}>Sign in to view friends</Text>
            <Text style={styles.missingSub}>
              Friends are tied to your account.
            </Text>
            <View style={{ height: spacing.lg }} />
            <AppButton title="Sign In" onPress={() => router.push("/login")} />
          </AppCard>
        </View>
      </View>
    );
  }

  if (profileQuery.isLoading || !friend) {
    const errorText = profileQuery.isError
      ? "Couldn’t load friend profile"
      : "Loading…";

    return (
      <View style={styles.container}>
        <StatusBar style="dark" />
        <ScreenHeader title="Compare" showBack onBack={onBack} />

        <View style={{ padding: spacing.xl }}>
          <AppCard>
            <Text style={styles.missingTitle}>{errorText}</Text>
            <Text style={styles.missingSub}>Try again in a moment.</Text>
            <View style={{ height: spacing.lg }} />
            <AppButton
              title="Retry"
              onPress={() => profileQuery.refetch()}
              variant="secondary"
            />
          </AppCard>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <ScreenHeader title="Compare" showBack onBack={onBack} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: spacing.xl,
          paddingBottom: insets.bottom + 28,
        }}
        showsVerticalScrollIndicator={false}
      >
        <AppCard style={styles.headerCard} pressable={false}>
          <View style={styles.headerRow}>
            <View style={styles.side}>
              <View style={styles.avatarWrap}>
                <Image
                  source={me.avatar}
                  style={styles.avatar}
                  contentFit="cover"
                />
              </View>
              <Text style={styles.name}>You</Text>
              <LeagueBadge tier={me.leagueTier} compact />
            </View>

            <View style={styles.vsPill}>
              <Text style={styles.vsText}>VS</Text>
            </View>

            <View style={styles.side}>
              <View style={styles.avatarWrap}>
                <Image
                  source={friend.avatar}
                  style={styles.avatar}
                  contentFit="cover"
                />
              </View>
              <Text style={styles.name}>{friend.name.split(" ")[0]}</Text>
              <LeagueBadge tier={friend.leagueTier} compact />
            </View>
          </View>

          <View style={styles.scoreRow}>
            <View style={styles.scoreCol}>
              <Text style={styles.scoreLabel}>Overall</Text>
              <Text style={styles.scoreValue}>{me.overallScore}</Text>
            </View>
            <View style={styles.scoreCol}>
              <Text style={styles.scoreLabel}>Overall</Text>
              <Text style={styles.scoreValue}>{friend.overallScore}</Text>
            </View>
          </View>
        </AppCard>

        <AppCard style={styles.metaCard} pressable={false}>
          <Text style={styles.metaTitle}>Friend snapshot</Text>
          <Text style={styles.metaLine}>
            League: {friend.leagueTier} (rank #{friend.leagueRank})
          </Text>
          <Text style={styles.metaLine}>
            Bike health score: {friend.bikeHealthScore}
          </Text>
        </AppCard>

        <View style={{ height: spacing.lg }} />

        <Text style={styles.sectionTitle}>Core skills</Text>
        <Text style={styles.sectionSub}>
          Side-by-side compare — no weird competition.
        </Text>

        <View style={{ height: spacing.md }} />

        <AppCard style={styles.compareCard} pressable={false}>
          {rows.map((r) => (
            <StatCompareRow
              key={r.key}
              label={r.label}
              leftName="You"
              rightName={friend.name.split(" ")[0]}
              leftValue={r.left}
              rightValue={r.right}
            />
          ))}
        </AppCard>

        <View style={{ height: spacing.xl }} />

        <AppButton
          title="Nudge to Ride"
          onPress={onOpenNudge}
          loading={nudgeMutation.isPending}
        />
        <AppButton
          title="Back to Friends"
          variant="secondary"
          onPress={() => router.replace("/friends")}
          style={{ marginTop: spacing.sm }}
        />
      </ScrollView>

      <Modal
        visible={nudgeOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setNudgeOpen(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setNudgeOpen(false)}
        />
        <View
          style={[styles.modalSheet, { paddingBottom: insets.bottom + 16 }]}
        >
          <Text style={styles.modalTitle}>Send a ride nudge</Text>
          <Text style={styles.modalSub}>
            Playful and optional. Keep it friendly.
          </Text>

          <View style={{ height: spacing.md }} />

          {[
            "Ride today?",
            "Quick lap after work?",
            "Trail conditions look perfect 👀",
          ].map((p) => (
            <Pressable
              key={p}
              onPress={() => nudgeMutation.mutate()}
              style={styles.presetRow}
              hitSlop={10}
              disabled={nudgeMutation.isPending}
            >
              <Text style={styles.presetText}>{p}</Text>
            </Pressable>
          ))}

          <View style={{ height: spacing.lg }} />
          <AppButton
            title="Cancel"
            variant="secondary"
            onPress={() => setNudgeOpen(false)}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  headerCard: {
    backgroundColor: colors.surfaceWarm,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  side: {
    flex: 1,
    alignItems: "center",
    gap: 8,
  },
  avatarWrap: {
    width: 72,
    height: 72,
    borderRadius: radius.round,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: colors.primarySoft2,
    backgroundColor: colors.borderLight,
  },
  avatar: {
    width: "100%",
    height: "100%",
  },
  name: {
    fontSize: typography.sm,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
  },
  vsPill: {
    width: 48,
    height: 48,
    borderRadius: radius.round,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primarySoft2,
    alignItems: "center",
    justifyContent: "center",
  },
  vsText: {
    fontSize: typography.sm,
    fontFamily: typography.fontFamily.black,
    color: colors.primary,
  },

  scoreRow: {
    marginTop: spacing.lg,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  scoreCol: {
    flex: 1,
    alignItems: "center",
  },
  scoreLabel: {
    fontSize: 11,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textSecondary,
  },
  scoreValue: {
    marginTop: 4,
    fontSize: 26,
    lineHeight: 28,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    letterSpacing: -0.6,
  },

  metaCard: {
    backgroundColor: colors.surface,
  },
  metaTitle: {
    fontSize: 16,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
  },
  metaLine: {
    marginTop: 8,
    fontSize: typography.base,
    lineHeight: 20,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
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

  compareCard: {
    backgroundColor: colors.surface,
  },

  missingTitle: {
    fontSize: 18,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
  },
  missingSub: {
    marginTop: 6,
    fontSize: typography.base,
    lineHeight: 20,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.28)",
  },
  modalSheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: spacing.xl,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
  },
  modalSub: {
    marginTop: 6,
    fontSize: typography.base,
    lineHeight: 20,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
  presetRow: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceWarm,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  presetText: {
    fontSize: 14,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
  },
});
