import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { rewriteLocalhostUrl, resolveApiHost } from '@/services/apiBaseUrl';
import { useAuthStore } from './store';

const callbackUrl = "/api/auth/token";
const getCallbackQueryString = (baseURL) => `callbackUrl=${baseURL}${callbackUrl}`;

/**
 * This renders a WebView for authentication and handles both web and native platforms.
 */
export const AuthWebView = ({ mode, proxyURL, baseURL }) => {
  const nativeBaseURL = rewriteLocalhostUrl(baseURL);
  const nativeProxyURL = rewriteLocalhostUrl(proxyURL);
  const apiHost = resolveApiHost();
  const callbackQueryString = getCallbackQueryString(nativeBaseURL);
  const [currentURI, setURI] = useState(
    `${nativeBaseURL}/account/${mode}?${callbackQueryString}`,
  );
  const hydrated = useAuthStore((s) => s.hydrated);
  const status = useAuthStore((s) => s.status);
  const handleAuthCallback = useAuthStore((s) => s.handleAuthCallback);
  const exchangeAuthToken = useAuthStore((s) => s.exchangeAuthToken);
  const isAuthenticated = hydrated ? status === "authenticated" : null;
  const iframeRef = useRef(null);
  const exchangeStartedRef = useRef(false);

  const exchangeSession = (requestUrl) => {
    if (exchangeStartedRef.current) {
      return;
    }
    exchangeStartedRef.current = true;
    exchangeAuthToken(requestUrl).catch((err) => {
      exchangeStartedRef.current = false;
      const detail =
        err && typeof err.detail === "string" && err.detail
          ? err.detail
          : "Not authenticated";
      console.error("[AuthWebView]", detail);
      useAuthStore.setState({ error: detail });
    });
  };
  useEffect(() => {
    if (isAuthenticated) {
      return;
    }
    setURI(`${nativeBaseURL}/account/${mode}?${callbackQueryString}`);
  }, [mode, nativeBaseURL, callbackQueryString, isAuthenticated]);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.addEventListener) {
      return;
    }
    const handleMessage = (event) => {
      // Verify the origin for security
      if (event.origin !== process.env.EXPO_PUBLIC_PROXY_BASE_URL) {
        return;
      }
      if (event.data.type === 'AUTH_SUCCESS') {
        handleAuthCallback({
          jwt: event.data.jwt,
          user: event.data.user,
          refreshToken: event.data.refreshToken,
        });
      } else if (event.data.type === 'AUTH_ERROR') {
        console.error('Auth error:', event.data.error);
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [handleAuthCallback]);

  if (Platform.OS === 'web') {
    const handleIframeError = () => {
      console.error('Failed to load auth iframe');
    };

    return (
      <iframe
        ref={iframeRef}
        title="Authentication"
        src={`${nativeProxyURL}/account/${mode}?callbackUrl=/api/auth/expo-web-success`}
        style={{ width: '100%', height: '100%', border: 'none' }}
        onError={handleIframeError}
      />
    );
  }
  return (
    <WebView
      sharedCookiesEnabled
      source={{
        uri: currentURI,
      }}
      headers={{
        'x-createxyz-project-group-id': process.env.EXPO_PUBLIC_PROJECT_GROUP_ID,
        host: apiHost,
        'x-forwarded-host': apiHost,
        'x-createxyz-host': apiHost,
      }}
      onShouldStartLoadWithRequest={(request) => {
        // If we hit the token endpoint, intercept it and fetch the JWT
        if (request.url.includes(callbackUrl)) {
          exchangeSession(rewriteLocalhostUrl(request.url));
          return false;
        }

        // Allow the WebView to handle all other navigations normally
        return true;
      }}
      onNavigationStateChange={(navState) => {
        // Backup check for the token URL in case onShouldStartLoadWithRequest missed it
        if (navState.url.includes(callbackUrl)) {
          exchangeSession(rewriteLocalhostUrl(navState.url));
        }
      }}
      javaScriptEnabled={true}
      domStorageEnabled={true}
      originWhitelist={["*"]}
      style={{ flex: 1 }}
    />
  );
};