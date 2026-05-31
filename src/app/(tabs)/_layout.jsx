import React, { useEffect, useMemo } from "react";
import { Tabs, router } from "expo-router";
import { Home, Wrench, Cog, Trophy, Users } from "lucide-react-native";
import { StackActions } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, typography } from "../../theme/index";
import { useQueryClient } from "@tanstack/react-query";

import { FEATURE_LEAGUES_MVP } from "@/utils/featureFlags";
import { useAuth } from "@/utils/auth/useAuth";
import {
  ensureLeagueQuarterCurrent,
  getLeagueUserKeyFromUser,
} from "@/utils/leagues/leagueState";
import { guardLeaguesAsync } from "@/utils/leagues/runtime";
import useRidesStore from "@/store/rides";
import { calcCLSQ } from "@/utils/leagues/calcCLSQ";
import { emitLeaguePointsFeedback } from "@/utils/leagues/pointsFeedback";

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { isReady, user } = useAuth();
  const queryClient = useQueryClient();

  const ridesCount = useRidesStore((s) =>
    Array.isArray(s.rides) ? s.rides.length : 0,
  );

  const leagueUserKey = useMemo(() => {
    return getLeagueUserKeyFromUser(user);
  }, [user]);

  const lastKnownClsqRef = React.useRef(null);
  const leaguesRefreshInFlightRef = React.useRef(false);

  useEffect(() => {
    // Leagues MVP quarter rollover check (safe + gated).
    if (!FEATURE_LEAGUES_MVP) {
      return;
    }

    if (!isReady) {
      return;
    }

    guardLeaguesAsync(
      "TabLayout.ensureLeagueQuarterCurrent",
      async () => {
        const s = await ensureLeagueQuarterCurrent(leagueUserKey, new Date());

        // Keep the LeagueBanner UI in sync without needing a manual refresh.
        try {
          queryClient.setQueryData(
            ["leagues-mvp", "quarter-state", leagueUserKey],
            s,
          );
        } catch (e) {
          // no-op
        }

        const clsq = calcCLSQ(s);
        if (Number.isFinite(clsq)) {
          lastKnownClsqRef.current = Math.floor(clsq);
        }
      },
      null,
    );
  }, [isReady, leagueUserKey, queryClient]);

  useEffect(() => {
    // Feedback loop: when rides change, re-check league state and emit a tiny points toast.
    // This does NOT change scoring logic; it only mirrors the new CLS-Q.
    if (!FEATURE_LEAGUES_MVP) {
      return;
    }
    if (!isReady) {
      return;
    }

    if (leaguesRefreshInFlightRef.current) {
      return;
    }

    leaguesRefreshInFlightRef.current = true;

    guardLeaguesAsync(
      "TabLayout.leagueFeedbackFromRides",
      async () => {
        const s = await ensureLeagueQuarterCurrent(leagueUserKey, new Date());

        // Update react-query cache so LeagueBanner updates immediately.
        try {
          queryClient.setQueryData(
            ["leagues-mvp", "quarter-state", leagueUserKey],
            s,
          );
        } catch (e) {
          // no-op
        }

        const nextClsqRaw = calcCLSQ(s);
        const nextClsq = Number.isFinite(nextClsqRaw)
          ? Math.floor(nextClsqRaw)
          : 0;

        const prev = lastKnownClsqRef.current;
        lastKnownClsqRef.current = nextClsq;

        if (typeof prev === "number") {
          const delta = nextClsq - prev;
          if (delta > 0) {
            emitLeaguePointsFeedback(delta);
          }
        }
      },
      null,
    ).finally(() => {
      leaguesRefreshInFlightRef.current = false;
    });
  }, [FEATURE_LEAGUES_MVP, isReady, leagueUserKey, ridesCount, queryClient]);

  // Safety: Leagues tab should always land on Rider Character first.
  const leaguesHref = "/leagues";

  return (
    <Tabs
      initialRouteName="index"
      screenOptions={{
        headerShown: false,

        // Global app canvas behind ALL tab scenes
        sceneContainerStyle: {
          backgroundColor: colors.appBackground,
        },

        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          paddingTop: 8,
          paddingBottom: Math.max(insets.bottom, 10),
          height: 66 + Math.max(insets.bottom, 10),
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarLabelStyle: {
          fontSize: typography.xs,
          fontFamily: typography.fontFamily.semibold,
          marginBottom: 8,
        },
      }}
    >
      {/* Tab order MUST remain: Home → Garage → AI → Leagues → Friends */}
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <Home color={color} size={24} strokeWidth={2} />
          ),
        }}
      />

      {/* Folder route: /(tabs)/garage/index.jsx */}
      <Tabs.Screen
        name="garage"
        options={{
          title: "Garage",
          // Clear separation:
          // - Tab button always goes to Garage overview: /garage
          // - Bike cards navigate to bike profile: /garage/[bikeId]
          tabBarIcon: ({ color }) => (
            <Wrench color={color} size={24} strokeWidth={2} />
          ),
        }}
      />

      {/* Folder route: /(tabs)/ai/index.jsx */}
      <Tabs.Screen
        name="ai"
        options={{
          title: "Tools",
          tabBarIcon: ({ color }) => (
            <Cog color={color} size={24} strokeWidth={2} />
          ),
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            // Only hijack *re-pressing the already-focused tab*.
            // IMPORTANT: Do NOT block programmatic navigation like router.push('/ai/photo-mechanic/steps').
            try {
              const rootState = navigation.getState();
              const activeRouteName =
                rootState?.routes?.[rootState?.index]?.name;
              const isAlreadyOnAiTab = activeRouteName === "ai";

              if (!isAlreadyOnAiTab) {
                return;
              }

              e.preventDefault();

              const aiRoute = rootState?.routes?.find((r) => r.name === "ai");
              const aiStackKey = aiRoute?.state?.key;

              if (aiStackKey) {
                navigation.dispatch({
                  ...StackActions.popToTop(),
                  target: aiStackKey,
                });
              }

              navigation.navigate("ai");
            } catch (error) {
              console.error(error);
              navigation.navigate("ai");
            }
          },
        })}
      />

      {/* Folder route: /(tabs)/leagues/index.jsx */}
      <Tabs.Screen
        name="leagues"
        options={{
          title: "Leagues",
          tabBarIcon: ({ color }) => (
            <Trophy color={color} size={24} strokeWidth={2} />
          ),
        }}
      />

      {/* Folder route: /(tabs)/friends/index.jsx */}
      <Tabs.Screen
        name="friends"
        options={{
          title: "Community",
          // Use the same "Friends" icon shown in your screenshot
          tabBarIcon: ({ color }) => (
            <Users color={color} size={24} strokeWidth={2} />
          ),
        }}
      />
    </Tabs>
  );
}
