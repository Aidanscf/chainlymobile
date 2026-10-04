import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Persisted auth payload key (AsyncStorage)
const AUTH_STORAGE_KEY = "chainly_auth_v1";

function devLog(...args) {
  const isDev = process.env.NODE_ENV !== "production";
  if (isDev) {
    // Avoid logging tokens.
    console.log("[auth]", ...args);
  }
}

function safeParse(json) {
  try {
    return JSON.parse(json);
  } catch (e) {
    return null;
  }
}

function normalizeUser(raw) {
  if (!raw || typeof raw !== "object") {
    return null;
  }
  const id = raw.id == null ? null : String(raw.id);
  const email = raw.email == null ? null : String(raw.email).trim();
  if (!email) {
    return null;
  }
  const name =
    raw.name == null || String(raw.name).trim() === ""
      ? null
      : String(raw.name).trim();
  return { id, email, name };
}

function apiFailure(error, fallback) {
  const detail =
    error && typeof error.detail === "string" && error.detail
      ? error.detail
      : error?.message || fallback;
  const err = new Error(detail);
  err.status = error?.status;
  err.detail = detail;
  return err;
}

async function clearLocalAuth(set) {
  try {
    await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
  } catch (e) {
    console.error(e);
  }

  set({
    status: "anonymous",
    user: null,
    accessToken: null,
    refreshToken: null,
    lastLoginAt: null,
    localDataHasUnsyncedChanges: false,
    error: null,
  });

  try {
    useAuthModal.getState().close();
  } catch (e) {
    // no-op
  }
}

async function persistAuthState(state) {
  const payload = {
    status: state.status,
    user: state.user,
    accessToken: state.accessToken,
    refreshToken: state.refreshToken,
    lastLoginAt: state.lastLoginAt,
    localDataHasUnsyncedChanges: state.localDataHasUnsyncedChanges,
  };

  if (payload.status !== "authenticated") {
    await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
    return;
  }

  await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(payload));
}

/**
 * Auth store (local-first): persists the minimum info needed to know who is signed in.
 *
 * Required by the prompt:
 * - status: anonymous | authenticated
 * - user: { id, email }
 * - accessToken (session token returned by /api/auth/token)
 * - refreshToken (if provided)
 * - lastLoginAt
 * - actions: loginWithWebView, handleAuthCallback, logout, hydrateAuth
 */
export const useAuthStore = create((set, get) => ({
  hydrated: false,
  hydrating: false,

  status: "anonymous",
  user: null,
  accessToken: null,
  refreshToken: null,
  lastLoginAt: null,

  // Marker for future work (server sync), set to true on login.
  localDataHasUnsyncedChanges: false,

  error: null,

  clearError: () => set({ error: null }),

  hydrateAuth: async () => {
    const { hydrated, hydrating } = get();
    if (hydrated || hydrating) {
      return;
    }

    set({ hydrating: true });

    try {
      const raw = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
      const parsed = raw ? safeParse(raw) : null;

      const status =
        parsed?.status === "authenticated" ? "authenticated" : "anonymous";
      const user = normalizeUser(parsed?.user);
      const accessToken = parsed?.accessToken
        ? String(parsed.accessToken)
        : null;
      const refreshToken = parsed?.refreshToken
        ? String(parsed.refreshToken)
        : null;
      const lastLoginAt = parsed?.lastLoginAt
        ? String(parsed.lastLoginAt)
        : null;
      const localDataHasUnsyncedChanges = !!parsed?.localDataHasUnsyncedChanges;

      if (status === "authenticated" && user && accessToken) {
        set({
          status,
          user,
          accessToken,
          refreshToken,
          lastLoginAt,
          localDataHasUnsyncedChanges,
        });
        devLog("hydrated authenticated", { email: user.email });
        try {
          await get().refreshMe();
        } catch (e) {
          if (e?.status !== 401 && e?.status !== 403) {
            console.warn(
              "[auth] could not restore user:",
              e?.detail || e?.message || e,
            );
          }
        }
      } else {
        await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
        set({
          status: "anonymous",
          user: null,
          accessToken: null,
          refreshToken: null,
          lastLoginAt: null,
          localDataHasUnsyncedChanges: false,
        });
        devLog("hydrated anonymous");
      }
    } catch (e) {
      console.error(e);
      // Fail open: treat as anonymous.
      set({
        status: "anonymous",
        user: null,
        accessToken: null,
        refreshToken: null,
        lastLoginAt: null,
        localDataHasUnsyncedChanges: false,
      });
    } finally {
      set({ hydrated: true, hydrating: false });
    }
  },

  loginWithWebView: (options) => {
    const mode = options?.mode || "signup";
    devLog("loginWithWebView", { mode });
    useAuthModal.getState().open({ mode });
  },

  handleAuthCallback: async (urlOrParams) => {
    // Login / signup / AuthWebView give us { jwt, user, refreshToken }.
    const params =
      urlOrParams && typeof urlOrParams === "object" ? urlOrParams : null;

    if (!params) {
      set({ error: "Login failed, try again" });
      return { ok: false };
    }

    if (params?.error) {
      set({ error: String(params.error) || "Login failed, try again" });
      return { ok: false };
    }

    const accessToken = params?.jwt ? String(params.jwt) : null;
    const refreshToken = params?.refreshToken
      ? String(params.refreshToken)
      : params?.refresh_token
        ? String(params.refresh_token)
        : null;
    const user = normalizeUser(params?.user);

    if (!accessToken || !user?.email) {
      set({ error: "Login failed, try again" });
      return { ok: false };
    }

    const nextState = {
      status: "authenticated",
      user,
      accessToken,
      refreshToken,
      lastLoginAt: new Date().toISOString(),
      localDataHasUnsyncedChanges: true,
      error: null,
    };

    set(nextState);

    try {
      await persistAuthState({ ...get(), ...nextState });
    } catch (e) {
      console.error(e);
      // Still authenticated in-memory.
    }

    try {
      useAuthModal.getState().close();
    } catch (e) {
      // no-op
    }

    devLog("authenticated", { email: user.email });

    return { ok: true, user };
  },

  refreshMe: async () => {
    if (get().status !== "authenticated" || !get().accessToken) {
      return null;
    }

    const { apiFetch } = await import("@/services/apiClient");
    try {
      const data = await apiFetch("/api/auth/me", { method: "GET" });
      const user = normalizeUser(data?.user);
      if (!user?.id || !user?.email) {
        throw apiFailure({ status: 401, detail: "Invalid token" }, "Invalid token");
      }
      set({ user });
      await persistAuthState({ ...get(), user });
      devLog("restored user", { email: user.email });
      return user;
    } catch (e) {
      const failure = apiFailure(e, "Not authenticated");
      if (failure.status === 401 || failure.status === 403) {
        await clearLocalAuth(set);
      }
      throw failure;
    }
  },

  exchangeAuthToken: async (requestUrl) => {
    let queryToken = null;
    if (typeof requestUrl === "string" && requestUrl) {
      try {
        const url = new URL(requestUrl);
        queryToken = url.searchParams.get("token") || url.searchParams.get("jwt");
      } catch (e) {
        queryToken = null;
      }
    }

    const stored = get().accessToken ? String(get().accessToken) : "";
    const bearer = stored || (queryToken ? String(queryToken) : "");
    if (!bearer) {
      throw apiFailure(
        { status: 401, detail: "Not authenticated" },
        "Not authenticated",
      );
    }

    const { apiFetch } = await import("@/services/apiClient");
    let data;
    try {
      data = await apiFetch("/api/auth/token", {
        method: "GET",
        headers: stored ? undefined : { Authorization: `Bearer ${bearer}` },
      });
    } catch (e) {
      throw apiFailure(e, "Not authenticated");
    }

    const jwt = data?.jwt ? String(data.jwt) : "";
    const refreshToken = data?.refreshToken ? String(data.refreshToken) : "";
    const user = normalizeUser(data?.user);
    if (!jwt || !refreshToken || !user?.email) {
      throw apiFailure({ status: 401, detail: "Invalid token" }, "Invalid token");
    }

    return get().handleAuthCallback({ jwt, user, refreshToken });
  },

  logout: async () => {
    devLog("logout");

    const refreshToken = get().refreshToken ? String(get().refreshToken) : "";

    // POST /api/auth/logout requires { refreshToken }.
    // Local logout always proceeds even if the network call fails.
    try {
      const { apiFetch } = await import("@/services/apiClient");
      await apiFetch("/api/auth/logout", {
        method: "POST",
        body: JSON.stringify({ refreshToken }),
      });
    } catch (e) {
      console.warn("[auth] server logout failed:", e?.detail || e?.message || e);
    }

    await clearLocalAuth(set);
  },
}));

/**
 * This store manages the state of the authentication modal.
 */
export const useAuthModal = create((set) => ({
  isOpen: false,
  mode: "signup",
  open: (options) => set({ isOpen: true, mode: options?.mode || "signup" }),
  close: () => set({ isOpen: false }),
}));
