import React from "react";
import { View, Text, Alert, Pressable, StyleSheet } from "react-native";
import {
  LifeBuoy,
  FileText,
  ShieldCheck,
  UsersRound,
  Info,
} from "lucide-react-native";
import { useRouter } from "expo-router";
import AppCard from "@/components/AppCard";
import { SectionHeader } from "../components/SectionHeader";
import { Divider } from "../components/Divider";
import { Row } from "../components/Row";
import { colors, spacing, radius, typography } from "@/theme/index";

export function SupportSection({ onHaptic, onVersionTap }) {
  const router = useRouter();

  return (
    <>
      <SectionHeader title="Support & about" />
      <AppCard style={styles.sectionCard} pressable={false}>
        <Row
          icon={LifeBuoy}
          title="Contact support"
          sub="We've got you"
          onPress={async () => {
            await onHaptic();
            Alert.alert("Contact", "Stub for now.");
          }}
        />
        <Divider />
        <Row
          icon={LifeBuoy}
          title="Provide feedback"
          sub="Share ideas in the community"
          onPress={async () => {
            await onHaptic();
            router.push("/community");
          }}
        />
        <Divider />
        <Row
          icon={FileText}
          title="Terms of Service"
          sub="The boring (but important) stuff"
          onPress={async () => {
            await onHaptic();
            Alert.alert("Terms of Service", "Stub for now.");
          }}
        />
        <Divider />
        <Row
          icon={ShieldCheck}
          title="Privacy Policy"
          sub="How we handle your data"
          onPress={async () => {
            await onHaptic();
            Alert.alert("Privacy Policy", "Stub for now.");
          }}
        />
        <Divider />
        <Row
          icon={UsersRound}
          title="Community"
          sub="Meet riders, swap tips"
          onPress={async () => {
            await onHaptic();
            router.push("/community");
          }}
        />
        <Divider />
        <Pressable onPress={onVersionTap} hitSlop={10}>
          <View style={styles.rowCard}>
            <View style={styles.rowLeft}>
              <View style={styles.iconWrap}>
                <Info size={18} color={colors.primary} strokeWidth={2.75} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>App version</Text>
                <Text style={styles.rowSub}>0.1.0 (tap 7× for developer)</Text>
              </View>
            </View>
          </View>
        </Pressable>
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
  rowCard: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    flex: 1,
    paddingRight: spacing.md,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: radius.round,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primarySoft2,
    alignItems: "center",
    justifyContent: "center",
  },
  rowTitle: {
    fontSize: 16,
    lineHeight: 18,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
  },
  rowSub: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 16,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
});
