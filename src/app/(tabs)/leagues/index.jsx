import React from "react";
import { Redirect } from "expo-router";

export default function LeaguesScreen() {
  // Redirect to the character screen
  return <Redirect href="/(tabs)/leagues/character" />;
}
