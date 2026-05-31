import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { useAuthStore } from './store';

const callbackUrl = "/api/auth/token";
const getCallbackQueryString = (baseURL) => `callbackUrl=${baseURL}${callbackUrl}`;

/**
 * This renders a WebView for authentication and handles both web and native platforms.
 */
export const AuthWebView = ({ mode, proxyURL, baseURL }) => {
  const callbackQueryString = getCallbackQueryString(baseURL);
  const [currentURI, setURI] = useState(
    `${baseURL}/account/${mode}?${callbackQueryString}`,
  );
  const hydrated = useAuthStore((s) => s.hydrated);
  const status = useAuthStore((s) => s.status);
  const handleAuthCallback = useAuthStore((s) => s.handleAuthCallback);
  const isAuthenticated = hydrated ? status === "authenticated" : null;
  const iframeRef = useRef(null);
  useEffect(() => {
    if (isAuthenticated) {
      return;
    }
    setURI(`${baseURL}/account/${mode}?${callbackQueryString}`);
  }, [mode, baseURL, isAuthenticated]);

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
        src={`${proxyURL}/account/${mode}?callbackUrl=/api/auth/expo-web-success`}
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
        host: process.env.EXPO_PUBLIC_HOST,
        'x-forwarded-host': process.env.EXPO_PUBLIC_HOST,
        'x-createxyz-host': process.env.EXPO_PUBLIC_HOST,
      }}
      onShouldStartLoadWithRequest={(request) => {
        // If we hit the token endpoint, intercept it and fetch the JWT
        if (request.url.includes(callbackUrl)) {
          const fetchToken = async () => {
            try {
              const response = await fetch(request.url);
              const data = await response.json();
              if (data?.jwt) {
                handleAuthCallback({ jwt: data.jwt, user: data.user });
              }
            } catch (err) {
              console.error("Failed to fetch auth token:", err);
            }
          };
          fetchToken();
          return false;
        }

        // Allow the WebView to handle all other navigations normally
        return true;
      }}
      onNavigationStateChange={(navState) => {
        // Backup check for the token URL in case onShouldStartLoadWithRequest missed it
        if (navState.url.includes(callbackUrl)) {
          const fetchToken = async () => {
            try {
              console.log("[AuthWebView] Fetching token from:", navState.url);
              const response = await fetch(navState.url);
              console.log("[AuthWebView] Token response status:", response.status);
              const data = await response.json();
              console.log("[AuthWebView] Token data received:", !!data?.jwt);
              if (data?.jwt) {
                handleAuthCallback({ jwt: data.jwt, user: data.user });
              } else {
                console.error("[AuthWebView] No JWT in response data");
              }
            } catch (err) {
              console.error("Failed to fetch auth token:", err);
            }
          };
          fetchToken();
        }
      }}
      javaScriptEnabled={true}
      domStorageEnabled={true}
      originWhitelist={["*"]}
      style={{ flex: 1 }}
    />
  );
};