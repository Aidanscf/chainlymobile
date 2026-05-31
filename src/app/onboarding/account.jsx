import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Platform,
  Animated,
  Alert,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import {
  Mail,
  Apple,
  Chrome,
  ArrowRight,
  ShieldCheck,
  UserPlus,
  LogIn,
} from "lucide-react-native";

import { ACCOUNTS_ENABLED } from "@/utils/featureFlags";
import { useAuthStore } from "@/utils/auth/store";

import KeyboardAvoidingAnimatedView from "@/components/KeyboardAvoidingAnimatedView";
import AppCard from "@/components/AppCard";
import { colors, spacing, radius, typography, shadows } from "@/theme/index";
import useSettingsStore from "@/store/settings";
import useOnboardingStore from "@/store/onboarding";
import { apiFetch } from "@/services/apiClient";

import OnboardingBackground from "@/components/onboarding/OnboardingBackground.jsx";
import OnboardingTopBar from "@/components/onboarding/OnboardingTopBar.jsx";
import StickyCTA from "@/components/onboarding/StickyCTA.jsx";

function isValidEmail(email) {
  const e = String(email || "").trim();
  if (!e) return false;
  if (!e.includes("@")) return false;
  if (!e.includes(".")) return false;
  return true;
}

export default function OnboardingAccountScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const hydrated = useSettingsStore((s) => s.hydrated);
  const hydrate = useSettingsStore((s) => s.hydrate);
  const update = useSettingsStore((s) => s.update);

  const settings = useSettingsStore((s) => s.settings);

  const setProgress = useOnboardingStore((s) => s.setProgress);

  const authHydrated = useAuthStore((s) => s.hydrated);
  const authStatus = useAuthStore((s) => s.status);
  const authUser = useAuthStore((s) => s.user);
  const authError = useAuthStore((s) => s.error);

  const [mode, setMode] = useState("options"); // options | email (legacy local-only)
  const [email, setEmail] = useState(settings?.profile?.email || "");
  const [saving, setSaving] = useState(false);

  const didAutoAdvanceRef = useRef(false);
  const pendingAuthAdvanceRef = useRef(false);

  useEffect(() => {
    if (!hydrated) {
      hydrate();
    }
  }, [hydrate, hydrated]);

  useEffect(() => {
    setProgress({ currentStepIndex: 102, lastRoute: "/onboarding/account" });
  }, [setProgress]);

  // Keyboard padding animation (no tab navigation here)
  const focusedPadding = 14;
  const paddingAnimation = useRef(
    new Animated.Value(insets.bottom + focusedPadding),
  ).current;

  const animateTo = useCallback(
    (value) => {
      Animated.timing(paddingAnimation, {
        toValue: value,
        duration: 200,
        useNativeDriver: false,
      }).start();
    },
    [paddingAnimation],
  );

  const handleInputFocus = useCallback(() => {
    if (Platform.OS === "web") return;
    animateTo(focusedPadding);
  }, [animateTo]);

  const handleInputBlur = useCallback(() => {
    if (Platform.OS === "web") return;
    animateTo(insets.bottom + focusedPadding);
  }, [animateTo, insets.bottom]);

  const onBack = useCallback(() => {
    if (!ACCOUNTS_ENABLED && mode === "email") {
      setMode("options");
      return;
    }
    router.back();
  }, [mode, router]);

  const goNext = useCallback(() => {
    router.push("/onboarding/paywall");
  }, [router]);

  const onSkip = useCallback(async () => {
    try {
      if (Platform.OS !== "web") await Haptics.selectionAsync();
    } catch (e) {
      // no-op
    }
    await update("onboarding.accountConnected", false);
    goNext();
  }, [goNext, update]);

  const onContinueWithEmail = useCallback(async () => {
    try {
      if (Platform.OS !== "web") await Haptics.selectionAsync();
    } catch (e) {
      // no-op
    }
    setMode("email");
  }, []);

  const onFakeProvider = useCallback(async (label) => {
    try {
      if (Platform.OS !== "web") {
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Warning,
        );
      }
    } catch (e) {
      // no-op
    }

    Alert.alert(
      "Not wired yet",
      `${label} sign-in is stubbed in this build. You can still save progress locally.`,
    );
  }, []);

  const onSaveEmail = useCallback(async () => {
    const trimmed = String(email || "").trim();
    if (trimmed && !isValidEmail(trimmed)) {
      Alert.alert("Check your email", "That doesn’t look like a valid email.");
      return;
    }

    setSaving(true);
    try {
      await update("profile.email", trimmed);
      await update("onboarding.accountConnected", true);

      // Best-effort sync (never block onboarding).
      try {
        const payload = {
          userProfile: settings?.userProfile || {},
          bikeInfo: settings?.bikeInfo || {},
          notificationPrefs: settings?.notificationPrefs || {},
          profile: { email: trimmed, name: settings?.profile?.name || "Rider" },
        };

        await apiFetch("/api/profile", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      } catch (e) {
        console.error(e);
      }

      try {
        if (Platform.OS !== "web") {
          await Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Success,
          );
        }
      } catch (e) {
        // no-op
      }

      goNext();
    } catch (e) {
      console.error(e);
      Alert.alert("Couldn’t save", "Try again in a moment.");
    } finally {
      setSaving(false);
    }
  }, [email, goNext, settings, update]);

  const onCreateAccount = useCallback(async () => {
    try {
      if (Platform.OS !== "web") await Haptics.selectionAsync();
    } catch (e) {
      // no-op
    }

    pendingAuthAdvanceRef.current = true;
    useAuthStore.getState().clearError();
    useAuthStore.getState().loginWithWebView({ mode: "signup" });
  }, []);

  const onLogin = useCallback(async () => {
    try {
      if (Platform.OS !== "web") await Haptics.selectionAsync();
    } catch (e) {
      // no-op
    }

    router.push("/login");
  }, [router]);

  useEffect(() => {
    if (!ACCOUNTS_ENABLED) {
      return;
    }
    if (!authHydrated) {
      return;
    }

    const isAuthed = authStatus === "authenticated";
    if (!isAuthed) {
      return;
    }

    // Avoid routing loops; only advance if the user just initiated auth on this screen.
    if (!pendingAuthAdvanceRef.current || didAutoAdvanceRef.current) {
      return;
    }

    didAutoAdvanceRef.current = true;

    const doAfterAuth = async () => {
      try {
        await update("onboarding.accountConnected", true);

        const emailFromAccount = authUser?.email ? String(authUser.email) : "";
        if (emailFromAccount) {
          await update("profile.email", emailFromAccount);
        }

        // Optional safe win: persist onboarding profile to server under the authed user id.
        try {
          const payload = {
            userProfile: settings?.userProfile || {},
            bikeInfo: settings?.bikeInfo || {},
            notificationPrefs: settings?.notificationPrefs || {},
            profile: {
              email: emailFromAccount,
              name: settings?.profile?.name || "Rider",
            },
          };

          await apiFetch("/api/profile", {
            method: "POST",
            body: JSON.stringify(payload),
          });
        } catch (e) {
          console.error(e);
        }

        goNext();
      } catch (e) {
        console.error(e);
        // If this fails, keep them local-first.
        goNext();
      }
    };

    doAfterAuth();
  }, [authHydrated, authStatus, authUser?.email, goNext, settings, update]);

  const canSave = useMemo(() => {
    const trimmed = String(email || "").trim();
    if (!trimmed) return true; // optional
    return isValidEmail(trimmed);
  }, [email]);

  const headline = useMemo(() => {
    if (ACCOUNTS_ENABLED) {
      return authStatus === "authenticated"
        ? "Account connected"
        : "Add an account";
    }
    return mode === "email" ? "Continue with Email" : "Save your progress";
  }, [authStatus, mode]);

  const subhead = useMemo(() => {
    if (ACCOUNTS_ENABLED) {
      return "Optional. Keeps your data safe across devices.";
    }
    return "Local-first by default. Add an account so your profile survives phone upgrades.";
  }, []);

  if (!hydrated) return null;

  return (
    <KeyboardAvoidingAnimatedView style={styles.container} behavior="padding">
      <StatusBar style="dark" />
      <OnboardingBackground variant="warm" />

      <OnboardingTopBar title="Account" onBack={onBack} />

      <Animated.View
        style={{
          flex: 1,
          paddingBottom: paddingAnimation,
        }}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingTop: spacing.xl,
            paddingHorizontal: spacing.xl,
            paddingBottom: 12,
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.hero}>
            <View style={styles.trustPill}>
              <ShieldCheck
                size={16}
                color={colors.primary}
                strokeWidth={2.75}
              />
              <Text style={styles.trustText}>Optional. Works offline.</Text>
            </View>

            <Text style={styles.title}>{headline}</Text>
            <Text style={styles.subtitle}>{subhead}</Text>
          </View>

          <View style={{ height: spacing.xl }} />

          {!ACCOUNTS_ENABLED ? (
            // -----------------------
            // Legacy local-only flow
            // -----------------------
            mode === "options" ? (
              <View style={{ gap: spacing.md }}>
                <ProviderButton
                  icon={Chrome}
                  title="Continue with Google"
                  sub="Coming soon"
                  onPress={() => onFakeProvider("Google")}
                />
                <ProviderButton
                  icon={Apple}
                  title="Continue with Apple"
                  sub="Coming soon"
                  onPress={() => onFakeProvider("Apple")}
                />
                <ProviderButton
                  icon={Mail}
                  title="Continue with Email"
                  sub="Fast and simple"
                  onPress={onContinueWithEmail}
                  emphasized
                />

                <View style={{ height: spacing.sm }} />

                <AppCard style={styles.noteCard} pressable={false} padding={16}>
                  <Text style={styles.noteTitle}>No account? Still great.</Text>
                  <Text style={styles.noteSub}>
                    You can do everything in Chainly without signing in.
                  </Text>
                </AppCard>

                <View style={{ height: 140 }} />
              </View>
            ) : (
              <View>
                <AppCard
                  style={styles.emailCard}
                  pressable={false}
                  padding={18}
                >
                  <Text style={styles.fieldLabel}>Email (optional)</Text>
                  <View style={styles.inputWrap}>
                    <TextInput
                      value={email}
                      onChangeText={setEmail}
                      placeholder="name@email.com"
                      placeholderTextColor={colors.textTertiary}
                      style={styles.input}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      returnKeyType="done"
                      onFocus={handleInputFocus}
                      onBlur={handleInputBlur}
                    />
                  </View>

                  <Text style={styles.helper}>
                    No spam. This is just for account recovery later.
                  </Text>
                </AppCard>

                <View style={{ height: 200 }} />
              </View>
            )
          ) : (
            // -----------------------
            // Real user accounts flow
            // -----------------------
            <View style={{ gap: spacing.md }}>
              {authStatus === "authenticated" && authUser?.email ? (
                <AppCard style={styles.noteCard} pressable={false} padding={16}>
                  <Text style={styles.noteTitle}>Signed in</Text>
                  <Text style={styles.noteSub}>{authUser.email}</Text>
                </AppCard>
              ) : (
                <>
                  <ProviderButton
                    icon={UserPlus}
                    title="Create account"
                    sub="Email + password"
                    onPress={onCreateAccount}
                    emphasized
                  />
                  <ProviderButton
                    icon={LogIn}
                    title="Log in"
                    sub="Already have an account"
                    onPress={onLogin}
                  />

                  {authError ? (
                    <Text style={styles.errorText}>{authError}</Text>
                  ) : null}

                  <View style={{ height: spacing.sm }} />

                  <AppCard
                    style={styles.noteCard}
                    pressable={false}
                    padding={16}
                  >
                    <Text style={styles.noteTitle}>Local-first</Text>
                    <Text style={styles.noteSub}>
                      You can still use Chainly without signing in.
                    </Text>
                  </AppCard>
                </>
              )}

              <View style={{ height: 140 }} />
            </View>
          )}
        </ScrollView>

        <View style={styles.footerFade} />
        {!ACCOUNTS_ENABLED ? (
          mode === "options" ? (
            <StickyCTA
              primaryTitle="Skip for now"
              onPrimary={onSkip}
              footnote="You can connect an account anytime in Settings."
              variant="default"
            />
          ) : (
            <StickyCTA
              primaryTitle={saving ? "Saving…" : "Save & Continue"}
              onPrimary={onSaveEmail}
              primaryDisabled={!canSave}
              primaryLoading={saving}
              secondaryTitle="Skip for now"
              onSecondary={onSkip}
            />
          )
        ) : authStatus === "authenticated" ? (
          <StickyCTA
            primaryTitle="Continue"
            onPrimary={goNext}
            secondaryTitle="Skip for now"
            onSecondary={onSkip}
            footnote="We’ll sync your profile later."
          />
        ) : (
          <StickyCTA
            primaryTitle="Skip for now"
            onPrimary={onSkip}
            footnote="You can connect an account anytime in Settings."
            variant="default"
          />
        )}
      </Animated.View>
    </KeyboardAvoidingAnimatedView>
  );
}

function ProviderButton({
  icon: Icon,
  title,
  sub,
  onPress,
  emphasized = false,
}) {
  const bg = emphasized ? colors.primarySoft : colors.surface;
  const bd = emphasized ? colors.primary : colors.border;

  return (
    <Pressable
      onPress={onPress}
      style={[styles.providerBtn, { backgroundColor: bg, borderColor: bd }]}
      hitSlop={10}
    >
      <View style={styles.providerRow}>
        <View
          style={[
            styles.providerIcon,
            emphasized ? styles.providerIconEmph : null,
          ]}
        >
          <Icon size={20} color={colors.primary} strokeWidth={2.75} />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.providerTitle}>{title}</Text>
          <Text style={styles.providerSub}>{sub}</Text>
        </View>

        <ArrowRight size={18} color={colors.textSecondary} strokeWidth={3} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.appBackground },

  hero: {
    paddingTop: spacing.sm,
  },
  trustPill: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.round,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.small,
  },
  trustText: {
    fontSize: 12,
    fontFamily: typography.fontFamily.black,
    color: colors.textSecondary,
  },

  title: {
    marginTop: spacing.lg,
    fontSize: 34,
    lineHeight: 38,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    letterSpacing: -0.9,
  },
  subtitle: {
    marginTop: spacing.sm,
    fontSize: 15,
    lineHeight: 20,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textSecondary,
  },

  providerBtn: {
    borderWidth: 1,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 16,
    ...shadows.small,
  },
  providerRow: {
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  providerIcon: {
    width: 46,
    height: 46,
    borderRadius: radius.round,
    backgroundColor: colors.surfaceWarm,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  providerIconEmph: {
    backgroundColor: colors.primarySoft2,
    borderColor: colors.primary,
  },
  providerTitle: {
    fontSize: 16,
    lineHeight: 18,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
  },
  providerSub: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 16,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textSecondary,
  },

  noteCard: {
    backgroundColor: colors.surfaceWarm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  noteTitle: {
    fontSize: 14,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
  },
  noteSub: {
    marginTop: 6,
    fontSize: 12,
    lineHeight: 16,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textSecondary,
  },

  emailCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  fieldLabel: {
    fontSize: 13,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
  },
  inputWrap: {
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceWarm,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  input: {
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

  footerFade: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 120,
    backgroundColor: colors.appBackground,
    opacity: 0.85,
  },

  errorText: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 16,
    fontFamily: typography.fontFamily.semibold,
    color: colors.danger,
  },
});
