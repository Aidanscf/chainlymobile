import { Stack } from "expo-router";

export default function RidingLogsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="select-type" />
      <Stack.Screen name="upload" />
      <Stack.Screen name="reference-points" />
      <Stack.Screen name="analyzing" />
      <Stack.Screen name="result" />
    </Stack>
  );
}
