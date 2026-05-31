import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
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
import { colors, spacing, radius, typography, shadows } from "@/theme/index";
import useNotificationsStore from "@/store/notifications";
import { apiFetch } from "@/services/apiClient";
import { useAuth } from "@/utils/auth";

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

export default function FriendProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();
  const queryClient = useQueryClient();

  const friendId = String(params.friendId || "");

  const { isReady, isAuthenticated, signIn } = useAuth();

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

  const nudgeMutation = useMutation({
    mutationFn: async () => {
      return await apiFetch("/api/friends/nudge", {
        method: "POST",
        body: JSON.stringify({ friend_user_id: friendId }),
      });
    },
    onSuccess: (data) => {
      const status = data?.status ? String(data.status) : "sent";

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
      await queryClient.invalidateQueries({ queryKey: ["friends", "me"] });
      await queryClient.invalidateQueries({ queryKey: ["friends", "list"] });
    },
  });

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

  const onCompare = useCallback(async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {
      // no-op
    }
    router.push(`/friends/${friendId}/compare`);
  }, [friendId, router]);

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
        <ScreenHeader title="Profile" showBack onBack={onBack} />

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
      ? "Couldn’t load profile"
      : "Loading…";

    return (
      <View style={styles.container}>
        <StatusBar style="dark" />
        <ScreenHeader title="Profile" showBack onBack={onBack} />

        <View style={{ padding: spacing.xl }}>
          <AppCard>
            <Text style={styles.missingTitle}>{errorText}</Text>
            <Text style={styles.missingSub}>Try again in a moment.</Text>
            <View style={{ height: spacing.lg }} />
            <AppButton
              title="Retry"
              variant="secondary"
              onPress={() => profileQuery.refetch()}
            />
          </AppCard>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <ScreenHeader title="Profile" showBack onBack={onBack} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: spacing.xl,
          paddingBottom: insets.bottom + 28,
        }}
        showsVerticalScrollIndicator={false}
      >
        <AppCard style={styles.heroCard} pressable={false}>
          <View style={styles.heroTopRow}>
            <View style={styles.scoreChip}>
              <Text style={styles.scoreChipLabel}>Overall</Text>
              <Text style={styles.scoreChipValue}>{friend.overallScore}</Text>
            </View>
            <LeagueBadge tier={friend.leagueTier} />
          </View>

          <View style={styles.avatarRing}>
            <View style={styles.avatarRingInner}>
              <Image
                source={friend.avatar}
                style={styles.avatar}
                contentFit="cover"
              />
            </View>
          </View>

          <Text style={styles.name}>{friend.name}</Text>
          <Text style={styles.subtitle}>
            Bike health: {friend.bikeHealthScore}
          </Text>

          <View style={styles.metaRow}>
            <View style={styles.rankPill}>
              <Text style={styles.rankPillText}>Rank #{friend.leagueRank}</Text>
            </View>
          </View>
        </AppCard>

        <AppCard style={styles.actionsCard} pressable={false}>
          <Text style={styles.actionsTitle}>Ride together</Text>
          <Text style={styles.actionsSub}>
            Compare stats and send a nudge when you want to link up.
          </Text>

          <View style={{ height: spacing.md }} />

          <View style={{ gap: spacing.sm }}>
            <AppButton title="Compare Stats" onPress={onCompare} />
            <AppButton
              title="Nudge to Ride"
              onPress={onOpenNudge}
              variant="secondary"
              loading={nudgeMutation.isPending}
            />
          </View>
        </AppCard>
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

  heroCard: {
    backgroundColor: colors.surfaceWarm,
    borderColor: colors.border,
    alignItems: "center",
    paddingVertical: spacing.xxl,
    marginBottom: spacing.lg,
  },
  heroTopRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.lg,
  },
  scoreChip: {
    alignItems: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.round,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.small,
  },
  scoreChipLabel: {
    fontSize: 11,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textSecondary,
  },
  scoreChipValue: {
    marginTop: 2,
    fontSize: 22,
    lineHeight: 22,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },

  avatarRing: {
    width: 132,
    height: 132,
    borderRadius: radius.round,
    backgroundColor: colors.primarySoft2,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.primary,
  },
  avatarRingInner: {
    width: 118,
    height: 118,
    borderRadius: radius.round,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatar: {
    width: 112,
    height: 112,
    borderRadius: radius.round,
  },

  name: {
    marginTop: spacing.lg,
    fontSize: 26,
    lineHeight: 28,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    letterSpacing: -0.6,
    textAlign: "center",
  },
  subtitle: {
    marginTop: 8,
    fontSize: typography.base,
    lineHeight: 20,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    textAlign: "center",
  },

  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  rankPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.round,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rankPillText: {
    fontSize: typography.sm,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
  },

  actionsCard: {
    backgroundColor: colors.surface,
  },
  actionsTitle: {
    fontSize: 18,
    lineHeight: 20,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  actionsSub: {
    marginTop: 8,
    marginBottom: spacing.md,
    fontSize: typography.base,
    lineHeight: 20,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
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
