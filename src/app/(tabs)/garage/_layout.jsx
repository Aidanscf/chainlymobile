import React from "react";
import { Stack } from "expo-router";

export default function GarageStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  );
}
