import React from "react";
import { View, Alert, StyleSheet, Text } from "react-native";
import { Image } from "expo-image";
import {
  User2,
  Crown,
  Link2,
  KeyRound,
  RotateCcw,
  LogOut,
} from "lucide-react-native";
import { useRouter } from "expo-router";
import AppCard from "@/components/AppCard";
import { SectionHeader } from "../components/SectionHeader";
import { Divider } from "../components/Divider";
import { Row } from "../components/Row";
import { colors, spacing, radius } from "@/theme/index";

export function AccountSection({
  settings,
  profileSubtitle,
  planLabel,
  onHaptic,
  onManageSubscription,
  onRestorePurchases,
  onLogout,
}) {
  const router = useRouter();

  return (
    <>
      <SectionHeader title="Account" />
      <AppCard style={styles.sectionCard} pressable={false}>
        <Row
          icon={User2}
          title={settings?.profile?.name || "Rider"}
          sub={profileSubtitle}
          onPress={() => router.push("/settings/profile")}
          leftSlot={
            settings?.profile?.avatarUri ? (
              <Image
                source={{ uri: settings.profile.avatarUri }}
                style={styles.avatar}
                contentFit="cover"
              />
            ) : null
          }
        />

        <Divider />

        <Row
          icon={Crown}
          title="Subscription & billing"
          sub={`Current plan: ${planLabel}`}
          onPress={onManageSubscription}
          highlight
        />

        <Divider />

        <Row
          icon={Link2}
          title="Connected login methods"
          sub="Google / Apple (stub)"
          onPress={async () => {
            await onHaptic();
            Alert.alert(
              "Connected logins",
              "This is a stub. If you enable User Accounts, we can wire real providers.",
            );
          }}
        />

        <Divider />

        <Row
          icon={KeyRound}
          title="Change password"
          sub="Requires User Accounts"
          onPress={async () => {
            await onHaptic();
            Alert.alert(
              "Change password",
              "User Accounts are currently off. If you enable them, we can add a real password reset flow.",
            );
          }}
        />

        <Divider />

        <Row
          icon={RotateCcw}
          title="Restore purchases"
          sub="If you upgraded on another device"
          onPress={onRestorePurchases}
        />

        <Divider />

        <Row
          icon={LogOut}
          title="Log out"
          sub="Sign out of Chainly"
          onPress={onLogout}
          danger
        />
      </AppCard>
    </>
  );
}

const styles = StyleSheet.create({
  sectionCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    padding: 0,
    overflow: "hidden",
  },
  avatar: {
    width: "100%",
    height: "100%",
  },
});
