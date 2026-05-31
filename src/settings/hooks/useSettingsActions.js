import { useCallback, useState, useEffect } from "react";
import { Alert, Platform } from "react-native";
import * as Haptics from "expo-haptics";
import {
  ACCOUNTS_ENABLED,
  SERVER_SYNC_ENABLED,
  FEATURE_LEAGUES_MVP,
  FEATURE_LEAGUES_MVP_DEBUG,
} from "@/utils/featureFlags";
import { isServerSyncActive } from "@/utils/serverSync";
import { runManualSync } from "@/utils/syncManager";
import { useAuthStore } from "@/utils/auth/store";

export function useSettingsActions({
  update,
  resetAll,
  toggleDeveloper,
  router,
}) {
  const [versionTapCount, setVersionTapCount] = useState(0);

  const onHaptic = useCallback(async () => {
    try {
      if (Platform.OS !== "web") {
        await Haptics.selectionAsync();
      }
    } catch (e) {
      // no-op
    }
  }, []);

  const onSyncNow = useCallback(async () => {
    await onHaptic();

    if (!SERVER_SYNC_ENABLED) {
      Alert.alert("Sync is off", "This build is running local-only mode.");
      return;
    }

    if (!ACCOUNTS_ENABLED) {
      Alert.alert(
        "Accounts required",
        "Turn on User Accounts for this build before syncing.",
      );
      return;
    }

    const active = isServerSyncActive();
    if (!active) {
      Alert.alert(
        "Sign in to sync",
        "Log in or create an account to sync your bikes, rides, and presets.",
      );
      useAuthStore.getState().clearError();
      useAuthStore.getState().loginWithWebView({ mode: "signin" });
      return;
    }

    const res = await runManualSync({ reason: "settings" });
    if (res?.ok) {
      Alert.alert("Synced", "All set.");
    } else {
      Alert.alert(
        "Couldn't sync",
        "No worries — you can keep using Chainly offline and try again later.",
      );
    }
  }, [onHaptic]);

  const onManageSubscription = useCallback(async () => {
    await onHaptic();
    Alert.alert(
      "Subscription",
      "Billing UI is stubbed in MVP. Want me to wire this to RevenueCat next?",
    );
  }, [onHaptic]);

  const onRestorePurchases = useCallback(async () => {
    await onHaptic();
    Alert.alert(
      "Restore Purchases",
      "Restore is stubbed in MVP. We can hook this up once RevenueCat is enabled.",
    );
  }, [onHaptic]);

  const onLogout = useCallback(async () => {
    await onHaptic();

    if (!ACCOUNTS_ENABLED) {
      Alert.alert(
        "Account",
        "Accounts aren't enabled in this build. You can keep using Chainly locally.",
      );
      return;
    }

    const authStatus = useAuthStore.getState().status;
    const authUser = useAuthStore.getState().user;
    const isAuthed = authStatus === "authenticated";

    if (!isAuthed) {
      useAuthStore.getState().clearError();
      useAuthStore.getState().loginWithWebView({ mode: "signin" });
      return;
    }

    const email = authUser?.email ? String(authUser.email) : "";
    Alert.alert(
      "Log out",
      email ? `Signed in as ${email}` : "Log out of Chainly?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Log out",
          style: "destructive",
          onPress: () => {
            useAuthStore.getState().logout();
          },
        },
      ],
    );
  }, [onHaptic]);

  const onConfirmReset = useCallback(async () => {
    await onHaptic();
    Alert.alert(
      "Reset settings?",
      "This brings everything back to defaults. (Your rides won't be deleted.)",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: () => {
            resetAll();
          },
        },
      ],
    );
  }, [onHaptic, resetAll]);

  const onVersionTap = useCallback(async () => {
    await onHaptic();
    setVersionTapCount((c) => c + 1);
  }, [onHaptic]);

  useEffect(() => {
    if (versionTapCount >= 7) {
      setVersionTapCount(0);
      toggleDeveloper();
      Alert.alert("Developer options", "Unlocked. (You can hide it anytime.)");

      // Hidden leagues debug screen (dev-only + flag gated)
      try {
        const debugEnabled =
          process.env.NODE_ENV !== "production" && FEATURE_LEAGUES_MVP_DEBUG;

        if (FEATURE_LEAGUES_MVP && debugEnabled && router?.push) {
          router.push("/settings/league-debug");
        }
      } catch (e) {
        // no-op
      }
    }
  }, [versionTapCount, toggleDeveloper, router]);

  return {
    onHaptic,
    onSyncNow,
    onManageSubscription,
    onRestorePurchases,
    onLogout,
    onConfirmReset,
    onVersionTap,
  };
}
