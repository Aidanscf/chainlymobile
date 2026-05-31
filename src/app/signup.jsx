import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Platform,
  TextInput,
  Alert,
  ScrollView,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { ArrowLeft, UserPlus, Mail, Lock, User } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import ScreenContainer from "@/components/layout/ScreenContainer";
import AppCard from "@/components/AppCard";
import AppButton from "@/components/AppButton";
import { colors, spacing, radius, typography, shadows } from "@/theme/index";
import { apiFetch } from "@/services/apiClient";
import { useAuthStore } from "@/utils/auth/store";

function isValidEmail(email) {
  const e = String(email || "").trim();
  if (!e) return false;
  if (!e.includes("@")) return false;
  if (!e.includes(".")) return false;
  return true;
}

export default function SignupScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const handleAuthCallback = useAuthStore((s) => s.handleAuthCallback);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const canContinue = useMemo(() => {
    const trimmedName = String(name || "").trim();
    const trimmedEmail = String(email || "").trim();
    const pw = String(password || "");
    if (!trimmedName) return false;
    if (!isValidEmail(trimmedEmail)) return false;
    if (pw.length < 6) return false;
    return true;
  }, [email, name, password]);

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const handleCreateAccount = useCallback(async () => {
    try {
      if (Platform.OS !== "web") await Haptics.selectionAsync();
    } catch (e) {
      // no-op
    }

    if (!canContinue) {
      Alert.alert(
        "Check your info",
        "Please enter your name, a valid email, and a password (min 6 characters).",
      );
      return;
    }

    setSubmitting(true);
    try {
      const data = await apiFetch("/api/auth/signup", {
        method: "POST",
        body: JSON.stringify({
          name: String(name || "").trim(),
          email: String(email || "").trim(),
          password: String(password || ""),
        }),
      });

      const jwt = data?.jwt ? String(data.jwt) : null;
      const nextUser = data?.user || null;

      if (!jwt || !nextUser?.email) {
        throw new Error("Invalid signup response");
      }

      await handleAuthCallback({ jwt, user: nextUser });
      router.replace("/(tabs)");
    } catch (e) {
      console.error(e);
      Alert.alert(
        "Signup failed",
        "Couldn’t create your account. Please try again or check server configuration.",
      );
    } finally {
      setSubmitting(false);
    }
  }, [canContinue, email, handleAuthCallback, name, password, router]);

  return (
    <ScreenContainer safeTop safeBottom style={styles.container}>
      <StatusBar style="dark" />

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
        <View style={styles.iconContainer}>
          <View style={styles.iconBubble}>
            <UserPlus size={48} color={colors.primary} strokeWidth={2.5} />
          </View>
        </View>

        <Text style={styles.title}>Create your account</Text>
        <Text style={styles.subtitle}>
          Set up your profile to sync bikes, rides, and maintenance across devices
        </Text>

        <AppCard style={styles.formCard} pressable={false} padding={18}>
          <Text style={styles.fieldLabel}>Name</Text>
          <View style={styles.inputWrap}>
            <User size={18} color={colors.textSecondary} />
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Rider name"
              placeholderTextColor={colors.textTertiary}
              style={styles.input}
              autoCapitalize="words"
              returnKeyType="next"
            />
          </View>

          <View style={{ height: spacing.md }} />

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
              placeholder="Minimum 6 characters"
              placeholderTextColor={colors.textTertiary}
              style={styles.input}
              secureTextEntry
              returnKeyType="done"
            />
          </View>

          <Text style={styles.helper}>
            By continuing, we’ll open the secure sign-up flow.
          </Text>
        </AppCard>

        <View style={{ height: spacing.xl }} />

        <AppButton
          title="Create account"
          onPress={handleCreateAccount}
          size="large"
          disabled={!canContinue || submitting}
          loading={submitting}
          icon={<UserPlus size={20} color={colors.surface} strokeWidth={2.5} />}
        />

        <Text style={styles.footerText}>
          Already have an account?{" "}
          <Text style={styles.footerLink} onPress={() => router.replace("/login")}>
            Log in
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
    fontSize: 34,
    lineHeight: 40,
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
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
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
  footerText: {
    fontSize: typography.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
  footerLink: {
    fontFamily: typography.fontFamily.bold,
    color: colors.primary,
  },
});

