import React from "react";
import { Stack } from "expo-router";

// Friends stack only: FriendsHome, AddFriend, FriendProfile, CompareStats
export default function FriendsStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  );
}
