import { Redirect } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";

import useSettingsStore from "@/store/settings";

export default function Index() {
  const hydrated = useSettingsStore((s) => s.hydrated);
  const hydrate = useSettingsStore((s) => s.hydrate);
  const onboardingComplete = useSettingsStore(
    (s) => !!s.settings?.onboarding?.onboardingComplete,
  );

  useEffect(() => {
    // Defensive: RootLayout hydrates, but this prevents edge cases on fast reloads.
    if (!hydrated) {
      hydrate();
    }
  }, [hydrate, hydrated]);

  if (!hydrated) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0B0B0B",
        }}
      >
        <ActivityIndicator size="large" color="#FFFFFF" />
      </View>
    );
  }

  const target = onboardingComplete ? "/(tabs)" : "/onboarding/welcome";
  console.log("[Index] onboardingComplete:", onboardingComplete, "Redirecting to:", target);
  return <Redirect href={target} />;
}
