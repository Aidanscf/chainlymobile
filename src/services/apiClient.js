import { getDeviceUserId } from "@/utils/deviceUserId";
import { ACCOUNTS_ENABLED } from "@/utils/featureFlags";
import { useAuthStore } from "@/utils/auth/store";
import { Platform } from "react-native";
import { fetch as expoFetch } from "expo/fetch";
import { resolveApiBaseUrl } from "@/services/apiBaseUrl";

const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const AUTH_SKIP_PATHS = new Set([
  "/api/auth/login",
  "/api/auth/signup",
  "/api/auth/google",
]);

export async function apiFetch(path, options) {
  const deviceUserId = await getDeviceUserId();

  const authState = useAuthStore.getState();
  const authedUserIdRaw = authState?.user?.id
    ? String(authState.user.id)
    : null;
  const authedUserId =
    authedUserIdRaw && uuidRegex.test(authedUserIdRaw) ? authedUserIdRaw : null;

  const isAuthenticated =
    !!ACCOUNTS_ENABLED &&
    authState?.status === "authenticated" &&
    !!authedUserId;

  const accessToken = authState?.accessToken
    ? String(authState.accessToken)
    : "";

  const userId = isAuthenticated ? authedUserId : deviceUserId;

  const headers = {
    Accept: "application/json",
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true",
    ...(options?.headers || {}),
    "x-chainly-user-id": userId,
    ...(isAuthenticated
      ? {
          "x-chainly-device-user-id": deviceUserId,
        }
      : {}),
    ...(!AUTH_SKIP_PATHS.has(path) && accessToken
      ? {
          Authorization: `Bearer ${accessToken}`,
        }
      : {}),
  };

  const baseUrl = resolveApiBaseUrl();

  // Build full URL - if baseUrl is empty, use relative path
  const url = baseUrl ? `${baseUrl}${path}` : path;

  try {
    const response = await expoFetch(url, {
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

function guessFileName(uri, fallback) {
  const cleaned = String(uri || "").split("?")[0];
  return cleaned.split("/").pop() || fallback;
}

function uploadFormWithXHR(url, formData, headers) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    Object.entries(headers || {}).forEach(([key, value]) => {
      if (value) {
        xhr.setRequestHeader(key, String(value));
      }
    });
    xhr.onload = () => resolve(xhr);
    xhr.onerror = () => reject(new Error("Upload network error"));
    xhr.send(formData);
  });
}

export async function apiUploadFile(fileUri, { name, mimeType } = {}) {
  const uri = String(fileUri || "");
  if (!uri) {
    throw new Error("No file to upload");
  }

  const authState = useAuthStore.getState();
  const accessToken = authState?.accessToken
    ? String(authState.accessToken)
    : "";
  const deviceUserId = await getDeviceUserId();
  const authedUserIdRaw = authState?.user?.id
    ? String(authState.user.id)
    : null;
  const authedUserId =
    authedUserIdRaw && uuidRegex.test(authedUserIdRaw) ? authedUserIdRaw : null;
  const userId =
    ACCOUNTS_ENABLED &&
    authState?.status === "authenticated" &&
    authedUserId
      ? authedUserId
      : deviceUserId;

  const fileName = guessFileName(name || uri, "upload.bin");
  const type = mimeType || "application/octet-stream";

  const headers = {
    "x-chainly-user-id": userId,
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
  };

  const baseUrl = resolveApiBaseUrl();
  const url = `${baseUrl}/api/ai/upload`;

  const formData = new FormData();

  if (Platform.OS === "web") {
    const blobRes = await expoFetch(uri);
    const blob = await blobRes.blob();
    formData.append("file", blob, fileName);
  } else {
    // React Native multipart: { uri, name, type }. expo/fetch cannot send this
    // shape, which made FastAPI return 422 (missing file).
    formData.append("file", { uri, name: fileName, type });
  }

  let status = 0;
  let bodyText = "";

  if (Platform.OS === "web") {
    const response = await expoFetch(url, {
      method: "POST",
      headers,
      body: formData,
    });
    status = response.status;
    bodyText = await response.text().catch(() => "");
    if (!response.ok) {
      throw new Error(
        `Upload failed [${status}] ${response.statusText}${
          bodyText ? ` - ${bodyText}` : ""
        }`,
      );
    }
  } else {
    const xhr = await uploadFormWithXHR(url, formData, headers);
    status = xhr.status;
    bodyText = String(xhr.responseText || "");
    if (status < 200 || status >= 300) {
      throw new Error(
        `Upload failed [${status}]${bodyText ? ` - ${bodyText}` : ""}`,
      );
    }
  }

  const data = bodyText ? JSON.parse(bodyText) : {};
  const uploaded = data?.absoluteUrl || data?.url;
  if (!uploaded) {
    throw new Error("Upload did not return a URL");
  }
  return String(uploaded);
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
