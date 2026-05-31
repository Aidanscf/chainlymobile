import { Stack, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useRef } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Platform, View, ActivityIndicator } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  useFonts,
  Nunito_500Medium,
  Nunito_700Bold,
  Nunito_800ExtraBold,
  Nunito_900Black,
} from "@expo-google-fonts/nunito";
// TEMP_DISABLED: import * as Notifications from "expo-notifications";
import Constants from "expo-constants";

import { apiFetch } from "@/services/apiClient";

import { AuthModal } from "@/utils/auth/useAuthModal";
import { useAuthStore } from "@/utils/auth/store";

import { initSyncManager, runInitialSyncOnce } from "@/utils/syncManager";

import useNotificationsStore from "@/store/notifications";
// TEMP_DISABLED: import { configureNotificationsHandler } from "@/utils/notifications";
import { colors } from "@/theme/index";
import useChainlyStore from "@/store/chainlyStore";
import useRidesStore from "@/store/rides";
import useAIJobsStore from "@/store/aiJobs";
import useSettingsStore from "@/store/settings";
import useOnboardingStore from "@/store/onboarding";
import useSuspensionStore from "@/store/suspension";
import LeaguePointsToastHost from "@/components/leagues/LeaguePointsToastHost";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      cacheTime: 1000 * 60 * 30,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function AppDataBootstrap() {
  const hydrateBikesFromLocal = useChainlyStore((s) => s.hydrateBikesFromLocal);
  const hydrateComponentsFromLocal = useChainlyStore(
    (s) => s.hydrateComponentsFromLocal,
  );
  const hydrateMaintenanceFromLocal = useChainlyStore(
    (s) => s.hydrateMaintenanceFromLocal,
  );

  const hydrateRidesFromLocal = useRidesStore((s) => s.hydrateFromLocal);

  const hydrateSettings = useSettingsStore((s) => s.hydrate);
  const hydrateOnboarding = useOnboardingStore((s) => s.hydrate);

  const hydratePresetsFromLocal = useSuspensionStore(
    (s) => s.hydratePresetsFromLocal,
  );

  useEffect(() => {
    const hydrateData = async () => {
      try {
        await hydrateSettings?.();
        await hydrateOnboarding?.();

        if (typeof hydrateBikesFromLocal === "function") {
          await hydrateBikesFromLocal();
        }
        if (typeof hydrateComponentsFromLocal === "function") {
          await hydrateComponentsFromLocal();
        }
        if (typeof hydrateMaintenanceFromLocal === "function") {
          await hydrateMaintenanceFromLocal();
        }
        if (typeof hydrateRidesFromLocal === "function") {
          await hydrateRidesFromLocal();
        }
        if (typeof hydratePresetsFromLocal === "function") {
          await hydratePresetsFromLocal();
        }
      } catch (error) {
        console.error("Error during data hydration:", error);
      }
    };

    hydrateData();
  }, [
    hydrateBikesFromLocal,
    hydrateComponentsFromLocal,
    hydrateMaintenanceFromLocal,
    hydrateOnboarding,
    hydrateRidesFromLocal,
    hydrateSettings,
    hydratePresetsFromLocal,
  ]);

  return null;
}

export default function RootLayout() {
  const router = useRouter();
  const isReady = useAuthStore((s) => s.hydrated);
  const authStatus = useAuthStore((s) => s.status);

  const didHydrateAuth = useRef(false);
  const didInitSync = useRef(false);

  const hydrateNotifications = useNotificationsStore((s) => s.hydrate);
  const hydrateAIJobs = useAIJobsStore((s) => s.hydrate);

  const [fontsLoaded, fontsError] = useFonts({
    Nunito_500Medium,
    Nunito_700Bold,
    Nunito_800ExtraBold,
    Nunito_900Black,
  });

  useEffect(() => {
    if (didHydrateAuth.current) return;
    didHydrateAuth.current = true;
    useAuthStore.getState().hydrateAuth().catch((e) => { console.error(e); });
  }, []);

  useEffect(() => {
    if (didInitSync.current) return;
    didInitSync.current = true;
    initSyncManager();
  }, []);

  useEffect(() => {
    if (!isReady) return;
    if (authStatus !== "authenticated") return;
    runInitialSyncOnce({ reason: "boot" }).catch((e) => { console.error(e); });
  }, [isReady, authStatus]);

  useEffect(() => {
    hydrateNotifications();
  }, [hydrateNotifications]);

  useEffect(() => {
    hydrateAIJobs();
  }, [hydrateAIJobs]);

  // TEMP_DISABLED: Notification setup (expo-notifications removed for debug build)
  // useEffect(() => {
  //   if (Platform.OS === "web") return;
  //   configureNotificationsHandler();
  //   const receivedSub = Notifications.addNotificationReceivedListener(...);
  //   const responseSub = Notifications.addNotificationResponseReceivedListener(...);
  //   return () => { receivedSub?.remove(); responseSub?.remove(); };
  // }, [addInboxItem, router]);

  // TEMP_DISABLED: Push token registration (expo-notifications removed for debug build)
  // useEffect(() => { ... Notifications.getPermissionsAsync ... }, [authStatus, isReady]);

  useEffect(() => {
    console.log("[RootLayout] state:", { isReady, fontsLoaded, fontsError });
    const fontsReady = fontsLoaded || !!fontsError;
    if (isReady && fontsReady) {
      console.log("[RootLayout] Hiding splash screen (ready)");
      SplashScreen.hideAsync();
    }
  }, [isReady, fontsLoaded, fontsError]);

  // Fail-safe: hide splash after 10s even if something is stuck
  useEffect(() => {
    const timer = setTimeout(() => {
      console.log("[RootLayout] Failsafe: hiding splash screen due to timeout");
      SplashScreen.hideAsync().catch(() => {});
    }, 10000);
    return () => clearTimeout(timer);
  }, []);

  const fontsReady = fontsLoaded || !!fontsError;
  if (!isReady || !fontsReady) {
    if (!isReady) console.log("[RootLayout] Waiting for auth hydration...");
    if (!fontsReady) console.log("[RootLayout] Waiting for fonts...");
    
    return (
      <View style={{ flex: 1, backgroundColor: "#0B0B0B", alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color="#FF6A2A" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AppDataBootstrap />
        <AuthModal />
        <GestureHandlerRootView
          style={{ flex: 1, backgroundColor: colors.appBackground }}
        >
          <LeaguePointsToastHost />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.appBackground },
            }}
            initialRouteName="index"
          >
            <Stack.Screen name="index" />
          </Stack>
        </GestureHandlerRootView>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
