import React, { useCallback } from "react";
import { View, Text, Alert } from "react-native";
import * as Linking from "expo-linking";
import AppCard from "@/components/AppCard";
import Chip from "@/components/Chip";
import { colors, spacing, typography } from "@/theme/index";

export function ResourcesCard({ resources }) {
  const onOpenResource = useCallback(async (url) => {
    const u = String(url || "").trim();
    if (!u) {
      return;
    }

    try {
      const canOpen = await Linking.canOpenURL(u);
      if (!canOpen) {
        Alert.alert(
          "Can't open link",
          "This link can't be opened on this device.",
        );
        return;
      }
      await Linking.openURL(u);
    } catch (e) {
      console.error(e);
      Alert.alert("Couldn't open link", "Try again in a moment.");
    }
  }, []);

  return (
    <AppCard style={styles.card}>
      <Text style={styles.sectionTitle}>Resources</Text>
      <Text style={styles.sectionSub}>
        Reputable guides and videos you can open.
      </Text>

      {resources.length ? (
        <View style={{ marginTop: spacing.md, gap: spacing.md }}>
          {resources.slice(0, 6).map((r, idx) => {
            const title = String(r?.title || "Resource");
            const source = String(r?.source || "");
            const type = String(r?.type || "article");
            const why = String(r?.why_relevant || "");
            const url = String(r?.url || "");

            return (
              <AppCard
                key={`${url}_${idx}`}
                onPress={() => onOpenResource(url)}
                style={styles.resourceRow}
              >
                <View style={styles.resourceTopRow}>
                  <Text style={styles.resourceTitle}>{title}</Text>
                  <Chip label={type.toUpperCase()} selected tone="neutral" />
                </View>
                {source ? (
                  <Text style={styles.resourceMeta}>{source}</Text>
                ) : null}
                {why ? <Text style={styles.resourceWhy}>{why}</Text> : null}
              </AppCard>
            );
          })}
        </View>
      ) : (
        <Text style={styles.emptyText}>No resources returned. Try again.</Text>
      )}
    </AppCard>
  );
}

const styles = {
  card: {
    backgroundColor: colors.surfaceWarm,
    borderColor: colors.border,
  },
  sectionTitle: {
    fontSize: 18,
    lineHeight: 20,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    letterSpacing: -0.2,
    marginBottom: spacing.sm,
  },
  sectionSub: {
    fontSize: typography.base,
    lineHeight: 19,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
  resourceRow: {
    paddingVertical: spacing.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  resourceTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  resourceTitle: {
    flex: 1,
    fontSize: 16,
    lineHeight: 18,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  resourceMeta: {
    marginTop: 6,
    fontSize: typography.sm,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textSecondary,
  },
  resourceWhy: {
    marginTop: 6,
    fontSize: typography.base,
    lineHeight: 19,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
  emptyText: {
    marginTop: spacing.md,
    fontSize: typography.base,
    lineHeight: 19,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
};
