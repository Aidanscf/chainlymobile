import React from "react";
import { Stack } from "expo-router";

export default function LeaguesStackLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="character" />
      <Stack.Screen name="overview" />
    </Stack>
  );
}
