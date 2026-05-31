// TEMP_DISABLED: expo-notifications native polyfill
// This stubs out all notification calls on Android/iOS for debug builds.
// To re-enable: remove the NATIVE_ALIASES entry in metro.config.js

export const PermissionStatus = {
  GRANTED: 'granted',
  DENIED: 'denied',
  UNDETERMINED: 'undetermined',
};

export const AndroidImportance = {
  DEFAULT: 3,
  HIGH: 4,
  LOW: 2,
  MAX: 5,
  MIN: 1,
  NONE: 0,
};

export function setNotificationHandler(handler) {
  // TEMP_DISABLED
}

export async function getPermissionsAsync() {
  return { status: PermissionStatus.UNDETERMINED, granted: false, canAskAgain: true, expires: 'never' };
}

export async function requestPermissionsAsync() {
  return { status: PermissionStatus.UNDETERMINED, granted: false, canAskAgain: true, expires: 'never' };
}

export async function getExpoPushTokenAsync(options) {
  return { data: null };
}

export async function getDevicePushTokenAsync() {
  return { data: null, type: 'android' };
}

export async function setNotificationChannelAsync(channelId, channel) {
  // TEMP_DISABLED
  return null;
}

export async function scheduleNotificationAsync(request) {
  // TEMP_DISABLED
  return 'disabled-' + Date.now();
}

export async function cancelAllScheduledNotificationsAsync() {
  // TEMP_DISABLED
}

export async function cancelScheduledNotificationAsync(identifier) {
  // TEMP_DISABLED
}

export async function getAllScheduledNotificationsAsync() {
  return [];
}

export function addNotificationReceivedListener(listener) {
  return { remove: () => {} };
}

export function addNotificationResponseReceivedListener(listener) {
  return { remove: () => {} };
}

export function removeNotificationSubscription(subscription) {
  // TEMP_DISABLED
}

export default {
  PermissionStatus,
  AndroidImportance,
  setNotificationHandler,
  getPermissionsAsync,
  requestPermissionsAsync,
  getExpoPushTokenAsync,
  getDevicePushTokenAsync,
  setNotificationChannelAsync,
  scheduleNotificationAsync,
  cancelAllScheduledNotificationsAsync,
  cancelScheduledNotificationAsync,
  getAllScheduledNotificationsAsync,
  addNotificationReceivedListener,
  addNotificationResponseReceivedListener,
  removeNotificationSubscription,
};
