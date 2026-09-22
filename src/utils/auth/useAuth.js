import { useCallback } from "react";
import { useAuthModal, useAuthStore } from "./store";

/**
 * Public auth hook for the mobile app.
 *
 * - hydrates once in RootLayout via `hydrateAuth()`
 * - opens the existing Auth WebView via `signIn()` / `signUp()`
 */
export const useAuth = () => {
  const hydrated = useAuthStore((s) => s.hydrated);
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const error = useAuthStore((s) => s.error);

  const clearError = useAuthStore((s) => s.clearError);
  const logout = useAuthStore((s) => s.logout);
  const hydrateAuth = useAuthStore((s) => s.hydrateAuth);

  const { open, close } = useAuthModal();

  const signIn = useCallback(() => {
    clearError();
    open({ mode: "signin" });
  }, [clearError, open]);

  const signUp = useCallback(() => {
    clearError();
    open({ mode: "signup" });
  }, [clearError, open]);

  const signOut = useCallback(async () => {
    await logout();
    close();
  }, [close, logout]);

  return {
    // Back-compat with older callers
    isReady: hydrated,
    isAuthenticated: hydrated ? status === "authenticated" : null,

    status,
    user,
    accessToken,
    error,

    signIn,
    signUp,
    signOut,

    // Used by RootLayout
    initiate: hydrateAuth,
  };
};

/**
 * Opens auth automatically if unauthenticated.
 */
export const useRequireAuth = (options) => {
  const isReady = useAuthStore((s) => s.hydrated);
  const status = useAuthStore((s) => s.status);
  const { open } = useAuthModal();

  const mode = options?.mode;

  // Avoid using effects here to prevent loops in screens; keep this hook simple.
  // Callers should wrap in useEffect if they want auto-open behavior.
  return {
    isReady,
    isAuthenticated: isReady ? status === "authenticated" : null,
    openAuth: () => open({ mode: mode || "signin" }),
  };
};

export default useAuth;
