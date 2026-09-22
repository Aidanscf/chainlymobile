import { useEffect, useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Platform,
  ActivityIndicator,
  TextInput,
  Alert,
  ScrollView,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { LogIn, ArrowLeft, User, Mail, Lock } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import ScreenContainer from "@/components/layout/ScreenContainer";
import AppCard from "@/components/AppCard";
import AppButton from "@/components/AppButton";
import { colors, spacing, radius, typography, shadows } from "@/theme/index";
import { useAuthModal } from "@/utils/auth/store";
import { useAuthStore } from "@/utils/auth/store";
import useSettingsStore from "@/store/settings";
import { apiFetch } from "@/services/apiClient";

function isValidEmail(email) {
  const e = String(email || "").trim();
  if (!e) return false;
  if (!e.includes("@")) return false;
  if (!e.includes(".")) return false;
  return true;
}

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isReady = useAuthStore((s) => s.hydrated);
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);
  const handleAuthCallback = useAuthStore((s) => s.handleAuthCallback);
  const { isOpen: authModalOpen } = useAuthModal();
  const [isProcessing, setIsProcessing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const hydrated = useSettingsStore((s) => s.hydrated);
  const hydrate = useSettingsStore((s) => s.hydrate);
  const onboardingComplete = useSettingsStore(
    (s) => !!s.settings?.onboarding?.onboardingComplete,
  );

  // Hydrate settings if not already done
  useEffect(() => {
    if (!hydrated) {
      hydrate();
    }
  }, [hydrate, hydrated]);

  // Handle successful authentication
  useEffect(() => {
    if (!isReady || !hydrated) {
      return;
    }

    // User just authenticated
    const isAuthenticated = status === "authenticated";
    if (isAuthenticated && user && !authModalOpen && !isProcessing) {
      setIsProcessing(true);

      const handlePostAuth = async () => {
        try {
          if (Platform.OS !== "web") {
            await Haptics.notificationAsync(
              Haptics.NotificationFeedbackType.Success,
            );
          }
        } catch (e) {
          // no-op
        }

        // Route based on onboarding status
        if (onboardingComplete) {
          // Returning user - go directly to app
          router.replace("/(tabs)");
        } else {
          // New user who created account but hasn't finished onboarding
          router.replace("/onboarding/friction");
        }
      };

      // Small delay to ensure state is fully settled
      setTimeout(handlePostAuth, 300);
    }
  }, [
    isReady,
    status,
    user,
    authModalOpen,
    onboardingComplete,
    hydrated,
    isProcessing,
    router,
  ]);

  const handleLogin = useCallback(async () => {
    try {
      if (Platform.OS !== "web") {
        await Haptics.selectionAsync();
      }
    } catch (e) {
      // no-op
    }

    const trimmedEmail = String(email || "").trim();
    const pw = String(password || "");

    if (!isValidEmail(trimmedEmail) || pw.length < 6) {
      Alert.alert(
        "Check your details",
        "Enter a valid email and password (min 6 characters).",
      );
      return;
    }

    setSubmitting(true);
    try {
      // Expected server response shape:
      // { jwt: string, user: { id?: string, email: string } }
      const data = await apiFetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: trimmedEmail, password: pw }),
      });

      const jwt = data?.jwt ? String(data.jwt) : null;
      const nextUser = data?.user || null;
      const refreshToken = data?.refreshToken
        ? String(data.refreshToken)
        : data?.refresh_token
          ? String(data.refresh_token)
          : null;

      if (!jwt || !nextUser?.email) {
        throw new Error("Invalid login response");
      }

      await handleAuthCallback({ jwt, user: nextUser, refreshToken });
    } catch (e) {
      console.error(e);
      const detail = e?.message ? String(e.message) : "";
      Alert.alert(
        "Login failed",
        detail.includes("Failed to fetch") || detail.includes("Network error")
          ? "Couldn’t reach the server. Login is failing on chainly.club (database auth). Please try again after the backend is fixed."
          : detail || "Couldn’t sign in. Please check your email and password.",
      );
    } finally {
      setSubmitting(false);
    }
  }, [email, password, handleAuthCallback]);

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  // Show loading if we're processing auth
  const isAuthenticated = status === "authenticated";
  if (isProcessing || (isAuthenticated && !authModalOpen)) {
    return (
      <ScreenContainer safeTop safeBottom style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading your account...</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer safeTop safeBottom style={styles.container}>
      <StatusBar style="dark" />

      {/* Header with back button */}
      <View style={styles.header}>
        <AppButton
          title=""
          onPress={handleBack}
          size="small"
          variant="ghost"
          icon={<ArrowLeft size={24} color={colors.textPrimary} />}
          style={styles.backButton}
        />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={{
          paddingHorizontal: spacing.xl,
          paddingTop: spacing.xxl,
          paddingBottom: Math.max(insets.bottom, spacing.xl) + 24,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Icon */}
        <View style={styles.iconContainer}>
          <View style={styles.iconBubble}>
            <User size={48} color={colors.primary} strokeWidth={2.5} />
          </View>
        </View>

        {/* Heading */}
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>
          Log in to access your bikes, rides, and maintenance history
        </Text>

        {/* Info Card */}
        <AppCard style={styles.infoCard} pressable={false} padding={20}>
          <View style={styles.infoRow}>
            <View style={styles.infoDot} />
            <Text style={styles.infoText}>Sync across all your devices</Text>
          </View>
          <View style={styles.infoRow}>
            <View style={styles.infoDot} />
            <Text style={styles.infoText}>Access premium AI features</Text>
          </View>
          <View style={styles.infoRow}>
            <View style={styles.infoDot} />
            <Text style={styles.infoText}>Keep your data safe</Text>
          </View>
        </AppCard>

        <View style={{ height: spacing.xl }} />

        <AppCard style={styles.formCard} pressable={false} padding={18}>
          <Text style={styles.fieldLabel}>Email</Text>
          <View style={styles.inputWrap}>
            <Mail size={18} color={colors.textSecondary} />
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="name@email.com"
              placeholderTextColor={colors.textTertiary}
              style={styles.input}
              autoCapitalize="none"
              keyboardType="email-address"
              returnKeyType="next"
            />
          </View>

          <View style={{ height: spacing.md }} />

          <Text style={styles.fieldLabel}>Password</Text>
          <View style={styles.inputWrap}>
            <Lock size={18} color={colors.textSecondary} />
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Your password"
              placeholderTextColor={colors.textTertiary}
              style={styles.input}
              secureTextEntry
              returnKeyType="done"
            />
          </View>

          <Text style={styles.helper}>
            If your server uses a different endpoint, update the request in this
            screen.
          </Text>
        </AppCard>

        <View style={{ height: spacing.xl }} />

        {/* Login Button */}
        <AppButton
          title="Log in with Email"
          onPress={handleLogin}
          size="large"
          disabled={submitting}
          loading={submitting}
          icon={<LogIn size={20} color={colors.surface} strokeWidth={2.5} />}
          style={styles.loginButton}
        />

        {/* Footer note */}
        <Text style={styles.footerText}>
          Don't have an account?{" "}
          <Text
            style={styles.footerLink}
            onPress={() => router.push("/signup")}
          >
            Sign up
          </Text>
        </Text>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.appBackground,
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  backButton: {
    alignSelf: "flex-start",
  },
  content: {
    flex: 1,
  },
  iconContainer: {
    alignItems: "center",
    marginBottom: spacing.xxl,
  },
  iconBubble: {
    width: 100,
    height: 100,
    borderRadius: radius.round,
    backgroundColor: colors.primarySoft,
    borderWidth: 3,
    borderColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.medium,
  },
  title: {
    fontSize: 36,
    lineHeight: 42,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    letterSpacing: -1,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.base,
    lineHeight: 22,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.small,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  infoDot: {
    width: 8,
    height: 8,
    borderRadius: radius.round,
    backgroundColor: colors.primary,
  },
  infoText: {
    flex: 1,
    fontSize: typography.base,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textPrimary,
  },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.small,
  },
  fieldLabel: {
    fontSize: 13,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
  },
  inputWrap: {
    marginTop: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceWarm,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textPrimary,
  },
  helper: {
    marginTop: spacing.md,
    fontSize: 12,
    lineHeight: 16,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textSecondary,
  },
  loginButton: {
    marginBottom: spacing.lg,
  },
  footerText: {
    fontSize: typography.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: spacing.xl,
  },
  footerLink: {
    fontFamily: typography.fontFamily.bold,
    color: colors.primary,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.lg,
  },
  loadingText: {
    fontSize: typography.lg,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textSecondary,
  },
});
