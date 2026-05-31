import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { View, Text, StyleSheet, ScrollView, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import * as Linking from "expo-linking";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Link2, RefreshCw, Unlink2 } from "lucide-react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import ScreenHeader from "@/components/layout/ScreenHeader";
import AppCard from "@/components/AppCard";
import AppButton from "@/components/AppButton";
import { colors, spacing, typography } from "@/theme/index";
import { apiFetch } from "@/services/apiClient";
import { runManualSync } from "@/utils/syncManager";
import { ACCOUNTS_ENABLED, SERVER_SYNC_ENABLED } from "@/utils/featureFlags";
import { useAuth } from "@/utils/auth/useAuth";

const PKCE_STORAGE_KEY = "chainly_strava_oauth_state_v1";

function formatWhen(ts) {
  if (!ts) return null;
  const d = new Date(ts);
  if (!Number.isFinite(d.getTime())) return null;
  return d.toLocaleString();
}

function buildAuthorizeUrl({ clientId, redirectUri, state }) {
  const qs = new URLSearchParams();
  qs.set("client_id", String(clientId));
  qs.set("redirect_uri", redirectUri);
  qs.set("response_type", "code");
  qs.set("approval_prompt", "auto");
  qs.set("scope", "activity:read_all");
  qs.set("state", state);

  return `https://www.strava.com/oauth/mobile/authorize?${qs.toString()}`;
}

export default function SettingsStravaScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { isReady, isAuthenticated, signIn } = useAuth();

  const [uiError, setUiError] = useState(null);

  const handledRef = useRef(false);
  const lastStateRef = useRef(null);

  const redirectUri = useMemo(() => "chainly://strava/callback", []);

  const statusQuery = useQuery({
    queryKey: ["strava", "status"],
    enabled: !!(
      isReady &&
      isAuthenticated &&
      ACCOUNTS_ENABLED &&
      SERVER_SYNC_ENABLED
    ),
    queryFn: async () => {
      return await apiFetch("/api/strava/status", { method: "GET" });
    },
  });

  const syncMutation = useMutation({
    mutationFn: async () => {
      return await apiFetch("/api/strava/sync", { method: "POST" });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["strava", "status"] });
      try {
        await runManualSync({ reason: "strava" });
      } catch (e) {
        // Keep UI stable; rides sync is best-effort.
        console.error(e);
      }
    },
    onError: (e) => {
      console.error(e);
      setUiError("Couldn’t sync from Strava. Try again in a bit.");
    },
  });

  const exchangeMutation = useMutation({
    mutationFn: async ({ code }) => {
      return await apiFetch("/api/strava/exchange", {
        method: "POST",
        body: JSON.stringify({ code }),
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["strava", "status"] });
      syncMutation.mutate();
    },
    onError: (e) => {
      console.error(e);
      setUiError("Couldn’t connect Strava. Try again.");
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: async () => {
      return await apiFetch("/api/strava/disconnect", { method: "POST" });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["strava", "status"] });
    },
    onError: (e) => {
      console.error(e);
      setUiError("Couldn’t disconnect. Try again.");
    },
  });

  const maybeHandleCallbackUrl = useCallback(
    async (url) => {
      if (!url) return;

      const parsed = Linking.parse(url);
      const path = parsed?.path ? String(parsed.path) : "";

      // expo-linking strips leading "/"; handle both.
      const isCallback =
        path === "strava/callback" || path === "/strava/callback";
      if (!isCallback) return;

      if (handledRef.current) return;
      handledRef.current = true;

      const qp = parsed?.queryParams || {};
      const code = qp?.code ? String(qp.code) : null;
      const error = qp?.error ? String(qp.error) : null;
      const state = qp?.state ? String(qp.state) : null;

      const storedState = await AsyncStorage.getItem(PKCE_STORAGE_KEY);
      const expectedState = storedState ? String(storedState) : null;
      if (expectedState && state && expectedState !== state) {
        setUiError("Security check failed. Please try connecting again.");
        return;
      }

      if (error) {
        setUiError("Strava sign-in was canceled.");
        return;
      }

      if (!code) {
        setUiError("Couldn’t read the Strava code. Try again.");
        return;
      }

      setUiError(null);
      exchangeMutation.mutate({ code });
    },
    [exchangeMutation],
  );

  useEffect(() => {
    const sub = Linking.addEventListener("url", (event) => {
      maybeHandleCallbackUrl(event?.url);
    });

    Linking.getInitialURL()
      .then((url) => {
        if (url) {
          maybeHandleCallbackUrl(url);
        }
      })
      .catch(() => {
        // no-op
      });

    return () => {
      try {
        sub?.remove?.();
      } catch (e) {
        // no-op
      }
    };
  }, [maybeHandleCallbackUrl]);

  const onBack = useCallback(() => {
    router.back();
  }, [router]);

  const onConnect = useCallback(async () => {
    setUiError(null);

    if (!ACCOUNTS_ENABLED || !SERVER_SYNC_ENABLED) {
      Alert.alert(
        "Enable accounts",
        "Strava sync needs Accounts + Server Sync enabled in this build.",
      );
      return;
    }

    if (!isReady) {
      return;
    }

    if (!isAuthenticated) {
      signIn();
      return;
    }

    const clientId = statusQuery?.data?.clientId
      ? String(statusQuery.data.clientId)
      : null;

    if (!clientId) {
      setUiError(
        "Missing Strava client id. Check server env STRAVA_CLIENT_ID.",
      );
      return;
    }

    // Reset callback handler so a fresh connect can run.
    handledRef.current = false;

    const state = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
    lastStateRef.current = state;
    await AsyncStorage.setItem(PKCE_STORAGE_KEY, state);

    const url = buildAuthorizeUrl({ clientId, redirectUri, state });

    try {
      await Linking.openURL(url);
    } catch (e) {
      console.error(e);
      setUiError("Couldn’t open Strava. Try again.");
    }
  }, [
    isAuthenticated,
    isReady,
    redirectUri,
    signIn,
    statusQuery?.data?.clientId,
  ]);

  const onSyncNow = useCallback(async () => {
    setUiError(null);
    syncMutation.mutate();
  }, [syncMutation]);

  const onDisconnect = useCallback(() => {
    Alert.alert(
      "Disconnect Strava?",
      "We’ll remove your Strava tokens from Chainly. Your imported rides will stay.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Disconnect",
          style: "destructive",
          onPress: () => disconnectMutation.mutate(),
        },
      ],
    );
  }, [disconnectMutation]);

  const connected = !!statusQuery?.data?.connected;
  const athleteText = statusQuery?.data?.athlete?.username
    ? `@${String(statusQuery.data.athlete.username)}`
    : statusQuery?.data?.athlete?.displayName
      ? String(statusQuery.data.athlete.displayName)
      : null;

  const lastSyncText = formatWhen(statusQuery?.data?.lastSyncAt);

  const busy =
    statusQuery.isLoading ||
    exchangeMutation.isPending ||
    syncMutation.isPending ||
    disconnectMutation.isPending;

  const serverErrorText =
    statusQuery?.data?.lastError && statusQuery?.data?.lastErrorAt
      ? `${String(statusQuery.data.lastError)} (${formatWhen(
          statusQuery.data.lastErrorAt,
        )})`
      : statusQuery?.data?.lastError
        ? String(statusQuery.data.lastError)
        : null;

  const showDisabledState = !(ACCOUNTS_ENABLED && SERVER_SYNC_ENABLED);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <ScreenHeader title="Connect Strava" showBack onBack={onBack} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: spacing.xl,
          paddingBottom: insets.bottom + 28,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Connect Strava</Text>
        <Text style={styles.subtitle}>
          Sync your rides automatically, track bike usage, and keep your
          maintenance up to date.
        </Text>

        <View style={{ height: spacing.lg }} />

        <AppCard style={styles.card} pressable={false}>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Link2 size={18} color={colors.primary} strokeWidth={2.75} />
              <Text style={styles.rowTitle}>Status</Text>
            </View>
            <Text style={styles.rowValue}>
              {connected ? "Connected" : "Not connected"}
            </Text>
          </View>

          {connected && athleteText ? (
            <Text style={styles.detail}>Connected as {athleteText}</Text>
          ) : null}

          {connected ? (
            <Text style={styles.detail}>
              Last sync: {lastSyncText || "Never"}
            </Text>
          ) : null}

          {showDisabledState ? (
            <Text style={styles.warning}>
              This build has Accounts/Server Sync turned off. Turn those on to
              enable Strava.
            </Text>
          ) : null}

          {serverErrorText ? (
            <Text style={styles.warning}>Strava error: {serverErrorText}</Text>
          ) : null}

          {uiError ? <Text style={styles.warning}>{uiError}</Text> : null}

          {statusQuery.isError ? (
            <Text style={styles.warning}>
              Couldn’t load Strava status. Are you signed in?
            </Text>
          ) : null}

          <View style={{ height: spacing.lg }} />

          {!connected ? (
            <AppButton
              title={busy ? "Connecting…" : "Connect Strava"}
              onPress={onConnect}
              loading={exchangeMutation.isPending}
              disabled={busy || showDisabledState}
            />
          ) : (
            <>
              <AppButton
                title={syncMutation.isPending ? "Syncing…" : "Sync now"}
                onPress={onSyncNow}
                loading={syncMutation.isPending}
                disabled={busy || showDisabledState}
                style={{ marginBottom: spacing.md }}
              />

              <AppButton
                title="Disconnect"
                variant="secondary"
                onPress={onDisconnect}
                disabled={busy || showDisabledState}
              />
            </>
          )}
        </AppCard>

        <View style={{ height: spacing.lg }} />

        <AppCard style={styles.cardSoft} pressable={false}>
          <View style={styles.tipRow}>
            <RefreshCw
              size={18}
              color={colors.textSecondary}
              strokeWidth={2.75}
            />
            <Text style={styles.tipTitle}>How sync works</Text>
          </View>
          <Text style={styles.tipText}>
            • First sync pulls the last 30 days.\n• Next syncs are incremental
            using your last sync time.\n• Tokens refresh automatically (no
            tokens are sent to your phone).
          </Text>
          <View style={{ height: spacing.sm }} />
          <View style={styles.tipRow}>
            <Unlink2
              size={18}
              color={colors.textSecondary}
              strokeWidth={2.75}
            />
            <Text style={styles.tipTitle}>Disconnect</Text>
          </View>
          <Text style={styles.tipText}>
            Disconnecting removes stored tokens, but keeps your imported rides.
          </Text>
        </AppCard>

        <View style={{ height: spacing.xxxl }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  title: {
    fontSize: 30,
    lineHeight: 32,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    letterSpacing: -0.6,
  },
  subtitle: {
    marginTop: 6,
    fontSize: typography.base,
    lineHeight: 20,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  cardSoft: {
    backgroundColor: colors.surfaceWarm,
    borderColor: colors.border,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  rowTitle: {
    fontSize: 14,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
  },
  rowValue: {
    fontSize: 13,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textSecondary,
  },
  detail: {
    marginTop: spacing.sm,
    fontSize: 12,
    lineHeight: 16,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
  warning: {
    marginTop: spacing.sm,
    fontSize: 12,
    lineHeight: 16,
    fontFamily: typography.fontFamily.semibold,
    color: colors.danger,
  },
  tipRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  tipTitle: {
    fontSize: 14,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
  },
  tipText: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
});
