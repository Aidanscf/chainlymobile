// TEMP_DISABLED: expo-notifications removed for debug build
// Original file backed up - re-enable by restoring expo-notifications imports

import { Platform } from "react-native";

let handlerConfigured = false;

export function configureNotificationsHandler() {
  // TEMP_DISABLED: Notifications.setNotificationHandler
  console.log("[Notifications] configureNotificationsHandler - temporarily disabled");
}

export async function getPermissionStatus() {
  // TEMP_DISABLED
  return "undetermined";
}

export async function requestNotificationPermissions() {
  // TEMP_DISABLED
  console.log("[Notifications] requestNotificationPermissions - temporarily disabled");
  return "undetermined";
}

export async function cancelAllNotifications() {
  // TEMP_DISABLED
}

export async function scheduleRideNudge({ deepLink, title, body, delayMin }) {
  // TEMP_DISABLED
  return null;
}

export async function scheduleMaintenanceReminder({ deepLink, title, body, delayMin }) {
  // TEMP_DISABLED
  return null;
}

export async function scheduleStreakPing({ deepLink, title, body, delayMin }) {
  // TEMP_DISABLED
  return null;
}

export async function sendFriendNudge({ deepLink, title, body, delayMin, friendId }) {
  // TEMP_DISABLED
  return null;
}

export function computeNudgeCadenceMinutes(frequency) {
  if (frequency === "few") return 48 * 60;
  if (frequency === "often") return 12 * 60;
  return 24 * 60;
}
