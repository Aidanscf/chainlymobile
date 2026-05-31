import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Bell } from "lucide-react-native";
import { useRouter } from "expo-router";
import AppCard from "@/components/AppCard";
import { SectionHeader } from "../components/SectionHeader";
import { Divider } from "../components/Divider";
import { Row } from "../components/Row";
import { colors, spacing, typography } from "@/theme/index";

export function NotificationsSection({
  notificationCenterSummary,
  notificationSummary,
}) {
  const router = useRouter();

  return (
    <>
      <SectionHeader title="Notifications" />
      <AppCard style={styles.sectionCard} pressable={false}>
        <Row
          icon={Bell}
          title="Notification Center"
          sub={notificationCenterSummary}
          onPress={() => router.push("/notifications")}
        />

        <Divider />

        <Row
          icon={Bell}
          title="Notification preferences"
          sub={notificationSummary}
          onPress={() => router.push("/settings/notifications")}
        />
        <Text style={styles.sectionHint}>
          Go ride nudges, maintenance reminders, streaks, and friend invites.
        </Text>
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
  sectionHint: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    marginTop: -6,
    fontSize: 12,
    lineHeight: 16,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
});
