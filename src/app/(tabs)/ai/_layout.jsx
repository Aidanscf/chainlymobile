import React from "react";
import { Stack } from "expo-router";

export default function AIStackLayout() {
  return (
    <Stack
      initialRouteName="index"
      screenOptions={{
        headerShown: false,
      }}
    />
  );
}
