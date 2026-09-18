import { Platform } from "react-native";
import Constants from "expo-constants";

function getDevMachineHost() {
  const hostUri =
    Constants.expoConfig?.hostUri ||
    Constants.expoGoConfig?.debuggerHost ||
    "";
  const host = String(hostUri).split(":")[0]?.trim();
  if (!host || host === "localhost" || host === "127.0.0.1") return null;
  return host;
}

function nativeLoopbackHost() {
  return (
    getDevMachineHost() ||
    (Platform.OS === "android" ? "10.0.2.2" : "localhost")
  );
}

const DEFAULT_API_BASE_URL = "https://chainly.club";

export function resolveApiBaseUrl() {
  const raw =
    process.env.EXPO_PUBLIC_PROXY_BASE_URL ||
    process.env.EXPO_PUBLIC_BASE_URL ||
    DEFAULT_API_BASE_URL;
  return rewriteLocalhostUrl(raw);
}

export function rewriteLocalhostUrl(url) {
  const src = String(url || "");
  if (!src || Platform.OS === "web") return src;
  if (!/^(https?:\/\/)(localhost|127\.0\.0\.1)(:|\/|$)/i.test(src)) {
    return src;
  }
  return src.replace(
    /^(https?:\/\/)(localhost|127\.0\.0\.1)/i,
    `$1${nativeLoopbackHost()}`,
  );
}

export function resolveApiHost() {
  const base = resolveApiBaseUrl();
  try {
    return new URL(base).host;
  } catch {
    return process.env.EXPO_PUBLIC_HOST || "chainly.club";
  }
}
