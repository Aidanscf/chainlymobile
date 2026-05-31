import React, { useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  Platform,
} from "react-native";
import { WebView } from "react-native-webview";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { ChevronLeft, RefreshCcw } from "lucide-react-native";
import * as Haptics from "expo-haptics";

import { colors, spacing, typography, radius, shadows } from "@/theme/index";

const COMMUNITY_URL = "https://chainlyclub.bettermode.io";

export default function CommunityWebViewScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const webViewRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [canGoBack, setCanGoBack] = useState(false);

  const handleBack = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (canGoBack && webViewRef.current) {
      try {
        webViewRef.current.goBack();
      } catch (err) {
        console.log("Could not go back in WebView:", err.message);
        router.back();
      }
    } else {
      router.back();
    }
  }, [canGoBack, router]);

  const handleRefresh = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (webViewRef.current) {
      try {
        webViewRef.current.reload();
      } catch (err) {
        console.log("Could not reload WebView:", err.message);
        // On web, just reload the whole page
        if (Platform.OS === "web") {
          window.location.reload();
        }
      }
    }
  }, []);

  const handleNavigationStateChange = useCallback((navState) => {
    // Skip on web to avoid cross-origin errors
    if (Platform.OS === "web") {
      return;
    }

    try {
      // Only read properties that are safe and don't cause CORS issues
      if (navState && typeof navState.canGoBack !== "undefined") {
        setCanGoBack(navState.canGoBack);
      }
      if (navState && typeof navState.loading !== "undefined") {
        setLoading(navState.loading);
      }
    } catch (error) {
      // Silently ignore cross-origin errors - this is expected for BetterMode
    }
  }, []);

  const handleLoadStart = useCallback(() => {
    setLoading(true);
    setError(false);
  }, []);

  const handleLoadEnd = useCallback(() => {
    setLoading(false);
  }, []);

  const handleError = useCallback(() => {
    setLoading(false);
    setError(true);
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={handleBack} style={styles.backButton} hitSlop={12}>
          <ChevronLeft size={24} color={colors.textPrimary} strokeWidth={2.5} />
        </Pressable>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Chainly Club</Text>
          {loading && (
            <ActivityIndicator
              size="small"
              color={colors.primary}
              style={{ marginLeft: 8 }}
            />
          )}
        </View>

        <Pressable
          onPress={handleRefresh}
          style={styles.refreshButton}
          hitSlop={12}
        >
          <RefreshCcw
            size={20}
            color={colors.textSecondary}
            strokeWidth={2.5}
          />
        </Pressable>
      </View>

      {/* WebView */}
      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Couldn't load community</Text>
          <Text style={styles.errorMessage}>
            Check your connection and try again
          </Text>
          <Pressable onPress={handleRefresh} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <WebView
          ref={webViewRef}
          source={{ uri: COMMUNITY_URL }}
          style={styles.webview}
          onNavigationStateChange={
            Platform.OS === "web" ? undefined : handleNavigationStateChange
          }
          onLoadStart={handleLoadStart}
          onLoadEnd={handleLoadEnd}
          onError={handleError}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          sharedCookiesEnabled={true}
          thirdPartyCookiesEnabled={true}
          startInLoadingState={true}
          originWhitelist={["*"]}
          allowsBackForwardNavigationGestures={Platform.OS !== "web"}
          renderLoading={() => (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Loading Chainly Club...</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  refreshButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  webview: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: spacing.lg,
    fontSize: typography.base,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xxl,
  },
  errorTitle: {
    fontSize: 20,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  errorMessage: {
    fontSize: typography.base,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: spacing.xl,
  },
  retryButton: {
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: radius.round,
    ...shadows.small,
  },
  retryButtonText: {
    fontSize: typography.base,
    fontFamily: typography.fontFamily.semibold,
    color: "#FFFFFF",
  },
});
