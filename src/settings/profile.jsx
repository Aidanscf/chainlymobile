import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Platform,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { Camera, Mail, User2 } from "lucide-react-native";

import { ACCOUNTS_ENABLED } from "@/utils/featureFlags";
import { useAuthStore } from "@/utils/auth/store";

import ScreenHeader from "@/components/layout/ScreenHeader";
import AppCard from "@/components/AppCard";
import AppButton from "@/components/AppButton";
import Chip from "@/components/Chip";
import KeyboardAvoidingAnimatedView from "@/components/KeyboardAvoidingAnimatedView";
import { colors, spacing, radius, typography, shadows } from "@/theme/index";
import useSettingsStore from "@/store/settings";

const GOAL_OPTIONS = [
  "Get fitter",
  "Ride more",
  "Improve skills",
  "Send bigger jumps",
  "Climb stronger",
  "Race/Leagues",
  "Trips & destinations",
  "Bike maintenance confidence",
];

const TERRAIN_OPTIONS = ["Tech", "Flow", "Jumps", "Steeps", "Climbs"];

export default function SettingsProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const hydrated = useSettingsStore((s) => s.hydrated);
  const hydrate = useSettingsStore((s) => s.hydrate);
  const profile = useSettingsStore((s) => s.settings.profile);
  const userProfile = useSettingsStore((s) => s.settings.userProfile);
  const bikeInfo = useSettingsStore((s) => s.settings.bikeInfo);
  const update = useSettingsStore((s) => s.update);

  const authHydrated = useAuthStore((s) => s.hydrated);
  const authStatus = useAuthStore((s) => s.status);
  const authUser = useAuthStore((s) => s.user);
  const authError = useAuthStore((s) => s.error);

  const [name, setName] = useState(profile?.name || "");
  const [email, setEmail] = useState(profile?.email || "");

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    setName(profile?.name || "");
    setEmail(profile?.email || "");
  }, [profile?.name, profile?.email]);

  const onBack = useCallback(() => {
    router.back();
  }, [router]);

  const onHaptic = useCallback(async () => {
    try {
      if (Platform.OS !== "web") {
        await Haptics.selectionAsync();
      }
    } catch (e) {
      // no-op
    }
  }, []);

  const onAccountPress = useCallback(async () => {
    await onHaptic();
    router.push("/login");
  }, [onHaptic, router]);

  const onLogout = useCallback(async () => {
    await onHaptic();
    const doLogout = async () => {
      await useAuthStore.getState().logout();
      if (Platform.OS === "web" && typeof window !== "undefined") {
        window.location.assign("/login");
        return;
      }
      router.replace("/login");
    };

    if (Platform.OS === "web") {
      const ok =
        typeof window !== "undefined" &&
        window.confirm("Log out? You can keep using Chainly offline.");
      if (ok) await doLogout();
      return;
    }

    Alert.alert("Log out?", "You can keep using Chainly offline.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log out",
        style: "destructive",
        onPress: () => {
          doLogout();
        },
      },
    ]);
  }, [onHaptic, router]);

  const initials = useMemo(() => {
    const parts = String(name || "Rider")
      .trim()
      .split(" ")
      .filter(Boolean);
    const a = parts[0]?.[0] || "R";
    const b = parts[1]?.[0] || "";
    return (a + b).toUpperCase();
  }, [name]);

  const onPickAvatar = useCallback(async () => {
    try {
      if (Platform.OS !== "web") {
        await Haptics.selectionAsync();
      }
    } catch (e) {
      // no-op
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.9,
        allowsEditing: true,
        aspect: [1, 1],
      });

      if (!result.canceled) {
        const uri = result.assets?.[0]?.uri;
        if (uri) {
          await update("profile.avatarUri", uri);
        }
      }
    } catch (e) {
      console.error(e);
      Alert.alert("Couldn’t open photos", "Try again in a moment.");
    }
  }, [update]);

  const onSave = useCallback(async () => {
    const trimmedName = String(name || "").trim();
    const trimmedEmail = String(email || "").trim();

    if (!trimmedName) {
      Alert.alert("Add your name", "So friends know it’s you.");
      return;
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

    await update("profile.name", trimmedName);
    await update("profile.email", trimmedEmail);

    Alert.alert("Saved", "Nice — your profile is updated.");
  }, [email, name, update]);

  const toggleMulti = useCallback(
    async (path, current, value) => {
      const list = Array.isArray(current) ? current : [];
      const next = list.includes(value)
        ? list.filter((x) => x !== value)
        : [...list, value];
      await update(path, next);
    },
    [update],
  );

  if (!hydrated) {
    return null;
  }

  const showAccountSection = !!ACCOUNTS_ENABLED;
  const isAuthed = authStatus === "authenticated";
  const signedInEmail = authUser?.email ? String(authUser.email) : null;

  return (
    <KeyboardAvoidingAnimatedView style={styles.container} behavior="padding">
      <StatusBar style="dark" />

      <ScreenHeader title="Profile" showBack onBack={onBack} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: spacing.xl,
          paddingBottom: insets.bottom + 28,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Your rider profile</Text>
        <Text style={styles.subtitle}>
          This helps Chainly personalize your coaching — and makes friends feel
          familiar.
        </Text>

        {showAccountSection ? (
          <>
            <View style={{ height: spacing.lg }} />
            <Text style={styles.sectionTitle}>Account</Text>
            <Text style={styles.sectionSub}>
              Connect an account to sync your bikes, stats, and presets later.
            </Text>

            <View style={{ height: spacing.lg }} />

            <AppCard style={styles.accountCard} pressable={false}>
              {authHydrated && isAuthed && signedInEmail ? (
                <>
                  <Text style={styles.accountTitle}>Signed in as</Text>
                  <Text style={styles.accountEmail}>{signedInEmail}</Text>

                  <View style={{ height: spacing.md }} />

                  <AppButton title="Log out" onPress={onLogout} />
                </>
              ) : (
                <>
                  <Text style={styles.accountTitle}>
                    Sign in to sync your bikes, stats, and presets
                  </Text>
                  {authError ? (
                    <Text style={styles.accountError}>{authError}</Text>
                  ) : null}

                  <View style={{ height: spacing.md }} />

                  <AppButton
                    title="Log in / Create account"
                    onPress={onAccountPress}
                  />
                </>
              )}
            </AppCard>
          </>
        ) : null}

        <View style={{ height: spacing.lg }} />

        {/* Identity */}
        <AppCard style={styles.heroCard} pressable={false}>
          <View style={styles.avatarRow}>
            <Pressable onPress={onPickAvatar} hitSlop={10}>
              <View style={styles.avatarRing}>
                <View style={styles.avatarInner}>
                  {profile?.avatarUri ? (
                    <Image
                      source={{ uri: profile.avatarUri }}
                      style={styles.avatarImg}
                      contentFit="cover"
                    />
                  ) : (
                    <Text style={styles.avatarInitials}>{initials}</Text>
                  )}
                </View>
                <View style={styles.avatarCam}>
                  <Camera
                    size={16}
                    color={colors.textPrimary}
                    strokeWidth={2.5}
                  />
                </View>
              </View>
            </Pressable>

            <View style={{ flex: 1 }}>
              <Text style={styles.heroName}>{name || "Rider"}</Text>
              <Text style={styles.heroHint}>Tap the avatar to change it</Text>
            </View>
          </View>
        </AppCard>

        <View style={{ height: spacing.lg }} />

        <AppCard style={styles.formCard} pressable={false}>
          <Field
            icon={User2}
            label="Name"
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            autoCapitalize="words"
          />

          <View style={{ height: spacing.md }} />

          <Field
            icon={Mail}
            label="Email (optional)"
            value={email}
            onChangeText={setEmail}
            placeholder="name@email.com"
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <Text style={styles.helper}>
            We’ll only use email for account and recovery stuff. No spam.
          </Text>

          <View style={{ height: spacing.lg }} />

          <AppButton title="Save changes" onPress={onSave} />
        </AppCard>

        <View style={{ height: spacing.lg }} />

        {/* Personalization (onboarding fields) */}
        <Text style={styles.sectionTitle}>Personalization</Text>
        <Text style={styles.sectionSub}>
          These match what you answered in onboarding. You can tweak them
          anytime.
        </Text>

        <View style={{ height: spacing.lg }} />

        <AppCard style={styles.prefCard} pressable={false}>
          <Text style={styles.prefLabel}>Skill level</Text>
          <View style={styles.chipWrap}>
            {["Beginner", "Intermediate", "Advanced"].map((opt) => (
              <Chip
                key={opt}
                label={opt}
                tone="orange"
                selected={userProfile?.skillLevel === opt}
                onPress={() => update("userProfile.skillLevel", opt)}
              />
            ))}
          </View>

          <View style={{ height: spacing.lg }} />

          <Text style={styles.prefLabel}>Riding frequency</Text>
          <View style={styles.chipWrap}>
            {["1x/week", "2-3x/week", "4-6x/week", "Daily"].map((opt) => (
              <Chip
                key={opt}
                label={opt}
                tone="orange"
                selected={userProfile?.ridingFrequency === opt}
                onPress={() => update("userProfile.ridingFrequency", opt)}
              />
            ))}
          </View>

          <View style={{ height: spacing.lg }} />

          <Text style={styles.prefLabel}>Riding goals</Text>
          <View style={styles.chipWrap}>
            {GOAL_OPTIONS.map((opt) => (
              <Chip
                key={opt}
                label={opt}
                tone="orange"
                selected={(userProfile?.ridingGoals || []).includes(opt)}
                onPress={() =>
                  toggleMulti(
                    "userProfile.ridingGoals",
                    userProfile?.ridingGoals,
                    opt,
                  )
                }
              />
            ))}
          </View>

          <View style={{ height: spacing.lg }} />

          <Text style={styles.prefLabel}>Primary discipline</Text>
          <View style={styles.chipWrap}>
            {["Trail", "Enduro", "XC", "DH/Bike Park", "Gravel/Road"].map(
              (opt) => (
                <Chip
                  key={opt}
                  label={opt}
                  tone="orange"
                  selected={userProfile?.primaryDiscipline === opt}
                  onPress={() => update("userProfile.primaryDiscipline", opt)}
                />
              ),
            )}
          </View>

          <View style={{ height: spacing.lg }} />

          <Text style={styles.prefLabel}>Terrain preference</Text>
          <View style={styles.chipWrap}>
            {TERRAIN_OPTIONS.map((opt) => (
              <Chip
                key={opt}
                label={opt}
                tone="orange"
                selected={(userProfile?.terrainPreference || []).includes(opt)}
                onPress={() =>
                  toggleMulti(
                    "userProfile.terrainPreference",
                    userProfile?.terrainPreference,
                    opt,
                  )
                }
              />
            ))}
          </View>

          <View style={{ height: spacing.lg }} />

          <Text style={styles.prefLabel}>Maintenance mindset</Text>
          <View style={styles.chipWrap}>
            {[
              "I baby it",
              "I’m decent",
              "I ride it hard",
              "What maintenance?",
            ].map((opt) => (
              <Chip
                key={opt}
                label={opt}
                tone="orange"
                selected={userProfile?.maintenanceMindset === opt}
                onPress={() => update("userProfile.maintenanceMindset", opt)}
              />
            ))}
          </View>

          <View style={{ height: spacing.lg }} />

          <Text style={styles.prefLabel}>Yearly spend range</Text>
          <View style={styles.chipWrap}>
            {["$0–250", "$250–750", "$750–1500", "$1500–3000", "$3000+"].map(
              (opt) => (
                <Chip
                  key={opt}
                  label={opt}
                  tone="orange"
                  selected={userProfile?.yearlySpendRange === opt}
                  onPress={() => update("userProfile.yearlySpendRange", opt)}
                />
              ),
            )}
          </View>

          <View style={{ height: spacing.lg }} />

          <Text style={styles.prefLabel}>Units</Text>
          <View style={styles.chipWrap}>
            {["Metric", "Imperial"].map((opt) => (
              <Chip
                key={opt}
                label={opt}
                tone="orange"
                selected={userProfile?.units === opt}
                onPress={() => update("userProfile.units", opt)}
              />
            ))}
          </View>

          <View style={{ height: spacing.lg }} />

          <Text style={styles.prefLabel}>Bike info</Text>
          <View style={styles.chipWrap}>
            {["Yes", "Not yet"].map((opt) => (
              <Chip
                key={opt}
                label={opt}
                tone="orange"
                selected={(bikeInfo?.hasBike ? "Yes" : "Not yet") === opt}
                onPress={() => update("bikeInfo.hasBike", opt === "Yes")}
              />
            ))}
          </View>

          <View style={{ height: spacing.md }} />

          <View style={styles.chipWrap}>
            {["Mountain", "Gravel/Road", "Multiple"].map((opt) => (
              <Chip
                key={opt}
                label={opt}
                tone="orange"
                selected={bikeInfo?.bikeType === opt}
                onPress={() => update("bikeInfo.bikeType", opt)}
              />
            ))}
          </View>

          <Text style={styles.helperInline}>
            Tip: add your full bike spec in Garage for the best compatibility
            checks.
          </Text>
        </AppCard>

        <View style={{ height: spacing.xxxl }} />
      </ScrollView>
    </KeyboardAvoidingAnimatedView>
  );
}

function Field({ icon: Icon, label, ...props }) {
  return (
    <View>
      <View style={styles.fieldLabelRow}>
        <View style={styles.fieldIcon}>
          <Icon size={16} color={colors.primary} strokeWidth={2.5} />
        </View>
        <Text style={styles.fieldLabel}>{label}</Text>
      </View>

      <View style={styles.inputWrap}>
        <TextInput
          {...props}
          style={styles.input}
          placeholderTextColor={colors.textTertiary}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  title: {
    fontSize: 30,
    lineHeight: 32,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    letterSpacing: -0.6,
  },
  subtitle: {
    marginTop: 6,
    fontSize: typography.base,
    lineHeight: 20,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },

  sectionTitle: {
    fontSize: 14,
    fontFamily: typography.fontFamily.black,
    color: colors.textSecondary,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  sectionSub: {
    marginTop: 6,
    fontSize: 12,
    lineHeight: 16,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },

  heroCard: {
    backgroundColor: colors.surfaceWarm,
    borderColor: colors.border,
  },
  avatarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
  },
  avatarRing: {
    width: 86,
    height: 86,
    borderRadius: radius.round,
    backgroundColor: colors.primarySoft2,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.primary,
  },
  avatarInner: {
    width: 74,
    height: 74,
    borderRadius: radius.round,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  avatarImg: {
    width: "100%",
    height: "100%",
  },
  avatarInitials: {
    fontSize: 22,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    letterSpacing: -0.4,
  },
  avatarCam: {
    position: "absolute",
    right: -2,
    bottom: -2,
    width: 28,
    height: 28,
    borderRadius: radius.round,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.small,
  },

  heroName: {
    fontSize: 18,
    lineHeight: 20,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  heroHint: {
    marginTop: 6,
    fontSize: typography.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },

  formCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  fieldLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  fieldIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.round,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primarySoft2,
    alignItems: "center",
    justifyContent: "center",
  },
  fieldLabel: {
    fontSize: 14,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
  },
  inputWrap: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceWarm,
    borderRadius: radius.lg,
    paddingHorizontal: 14,
    paddingVertical: 12,
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
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },

  prefCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
  },
  prefLabel: {
    fontSize: 14,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  chipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  helperInline: {
    marginTop: spacing.md,
    fontSize: 12,
    lineHeight: 16,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },

  accountCard: {
    backgroundColor: colors.surfaceWarm,
    borderColor: colors.border,
  },
  accountTitle: {
    fontSize: 14,
    lineHeight: 18,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
  },
  accountEmail: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 17,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textSecondary,
  },
  accountError: {
    marginTop: 8,
    fontSize: 12,
    lineHeight: 16,
    fontFamily: typography.fontFamily.semibold,
    color: colors.danger,
  },
});
