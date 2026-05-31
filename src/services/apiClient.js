import { getDeviceUserId } from "@/utils/deviceUserId";
import { ACCOUNTS_ENABLED } from "@/utils/featureFlags";
import { useAuthStore } from "@/utils/auth/store";
import { Platform } from "react-native";

const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function apiFetch(path, options) {
  const deviceUserId = await getDeviceUserId();

  const authState = useAuthStore.getState();
  const authedUserIdRaw = authState?.user?.id
    ? String(authState.user.id)
    : null;
  const authedUserId =
    authedUserIdRaw && uuidRegex.test(authedUserIdRaw) ? authedUserIdRaw : null;

  const useAccountId =
    !!ACCOUNTS_ENABLED &&
    authState?.status === "authenticated" &&
    !!authedUserId;

  const userId = useAccountId ? authedUserId : deviceUserId;

  const headers = {
    "Content-Type": "application/json",
    ...(options?.headers || {}),
    "x-chainly-user-id": userId,
    ...(useAccountId
      ? {
          // Keep device id around for future migrations / support.
          "x-chainly-device-user-id": deviceUserId,
        }
      : {}),
    ...(useAccountId && authState?.accessToken
      ? {
          Authorization: `Bearer ${authState.accessToken}`,
        }
      : {}),
  };

  // Get the base URL from environment
  // Use EXPO_PUBLIC_PROXY_BASE_URL or EXPO_PUBLIC_BASE_URL for all platforms
  // This ensures API calls work even when mobile app runs on web platform
  const baseUrl =
    process.env.EXPO_PUBLIC_PROXY_BASE_URL ||
    process.env.EXPO_PUBLIC_BASE_URL ||
    "";

  // Build full URL - if baseUrl is empty, use relative path
  const url = baseUrl ? `${baseUrl}${path}` : path;

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      const detail = text ? ` - ${text}` : "";
      throw new Error(
        `When fetching ${path}, the response was [${response.status}] ${response.statusText}${detail}`,
      );
    }

    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      return await response.json();
    }

    return await response.text();
  } catch (error) {
    // Enhanced error message for network failures
    if (error.message === "Failed to fetch") {
      console.error(
        `Network error fetching ${url}. Make sure the dev server is running.`,
      );
      throw new Error(
        `Network error: Unable to reach ${path}. Please check your connection and ensure the dev server is running.`,
      );
    }
    throw error;
  }
}

export async function logEvent(type, payload) {
  try {
    await apiFetch("/api/events", {
      method: "POST",
      body: JSON.stringify({ type, payload }),
    });
  } catch (e) {
    // Intentionally silent for UI safety. Still useful in logs.
    console.error(e);
  }
}
