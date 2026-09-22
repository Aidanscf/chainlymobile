import { NativeModules, Platform } from "react-native";
import Constants from "expo-constants";
import * as Device from "expo-device";

function isLoopbackHostname(hostname) {
  const h = String(hostname || "")
    .trim()
    .toLowerCase()
    .replace(/^\[|\]$/g, "");
  return (
    !h ||
    h === "localhost" ||
    h === "127.0.0.1" ||
    h === "0.0.0.0" ||
    h === "::1"
  );
}

function hostnameFromValue(value) {
  const raw = String(value || "").trim();
  if (!raw) return null;

  const withScheme = raw.includes("://") ? raw : `http://${raw}`;
  try {
    const hostname = new URL(withScheme).hostname.replace(/^\[|\]$/g, "");
    if (!isLoopbackHostname(hostname)) return hostname;
  } catch {
    // fall through
  }

  const host = raw
    .replace(/^[a-z]+:\/\//i, "")
    .split("/")[0]
    .split(":")[0]
    .trim();
  if (
    host &&
    !isLoopbackHostname(host) &&
    host !== "exp" &&
    host !== "http" &&
    host !== "https"
  ) {
    return host;
  }
  return null;
}

function getScriptURL() {
  try {
    const NativeSourceCode =
      require("react-native/Libraries/NativeModules/specs/NativeSourceCode").default;
    const url = NativeSourceCode?.getConstants?.()?.scriptURL;
    if (url) return String(url);
  } catch {
    // new-arch SourceCode native module can throw
  }
  return String(NativeModules?.SourceCode?.scriptURL || "");
}

export function getDevMachineHost() {
  const candidates = [
    process.env.EXPO_PUBLIC_DEV_MACHINE_HOST,
    Constants.expoConfig?.hostUri,
    Constants.expoGoConfig?.debuggerHost,
    Constants.manifest2?.extra?.expoGo?.debuggerHost,
    Constants.linkingUri,
    Constants.experienceUrl,
    getScriptURL(),
  ];

  try {
    const getDevServer =
      require("react-native/Libraries/Core/Devtools/getDevServer").default;
    candidates.push(getDevServer?.()?.url, getDevServer?.()?.fullBundleUrl);
  } catch {
    // ignore — only exists in dev bundles
  }

  for (const candidate of candidates) {
    const host = hostnameFromValue(candidate);
    if (host) return host;
  }
  return null;
}

function nativeLoopbackHost() {
  const fromMetro = getDevMachineHost();
  if (fromMetro) return fromMetro;

  // 10.0.2.2 only works inside the Android emulator.
  if (Platform.OS === "android" && Device.isDevice !== true) {
    return "10.0.2.2";
  }

  // USB Metro is localhost via adb reverse, so physical phones need the LAN IP.
  if (Device.isDevice) {
    return "192.168.1.5";
  }

  return Platform.OS === "ios" ? "localhost" : null;
}

const DEFAULT_API_BASE_URL =
  "https://now-interconvertible-laquita.ngrok-free.dev";

let loggedApiBase = false;

export function resolveApiBaseUrl() {
  const raw =
    process.env.EXPO_PUBLIC_PROXY_BASE_URL ||
    process.env.EXPO_PUBLIC_BASE_URL ||
    DEFAULT_API_BASE_URL;
  const resolved = rewriteLocalhostUrl(raw);
  if (__DEV__ && !loggedApiBase) {
    loggedApiBase = true;
    console.log("[api] base URL", resolved, {
      metroHost: getDevMachineHost(),
      envHost: process.env.EXPO_PUBLIC_DEV_MACHINE_HOST || null,
    });
  }
  return resolved;
}

export function rewriteLocalhostUrl(url) {
  const src = String(url || "");
  if (!src || Platform.OS === "web") return src;

  const host = nativeLoopbackHost();
  if (!host) return src;

  let out = src.replace(
    /^(https?:\/\/)(localhost|127\.0\.0\.1)(?=[:/]|$)/i,
    `$1${host}`,
  );

  if (Device.isDevice && host !== "10.0.2.2") {
    out = out.replace(/^(https?:\/\/)10\.0\.2\.2(?=[:/]|$)/i, `$1${host}`);
  }

  return out;
}

export function rewriteLocalhostHost(host) {
  const raw = String(host || "");
  if (!raw || Platform.OS === "web") return raw;
  const asUrl = raw.includes("://") ? raw : `http://${raw}`;
  try {
    return new URL(rewriteLocalhostUrl(asUrl)).host;
  } catch {
    return raw;
  }
}

export function resolveApiHost() {
  const base = resolveApiBaseUrl();
  try {
    return new URL(base).host;
  } catch {
    return rewriteLocalhostHost(process.env.EXPO_PUBLIC_HOST) || "chainly.club";
  }
}
