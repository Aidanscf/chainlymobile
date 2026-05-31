import React, { useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import {
  PackageSearch,
  Wrench,
  CheckCircle2,
  Circle,
} from "lucide-react-native";

import AppCard from "@/components/AppCard";
import AppButton from "@/components/AppButton";
import Chip from "@/components/Chip";
import { colors, spacing, radius, typography } from "@/theme/index";
import { useChainlyStore } from "@/store/chainlyStore";
import ScreenHeader from "@/components/layout/ScreenHeader";

function priorityTone(priority) {
  return priority === "must" ? "orange" : "neutral";
}

export default function PhotoMechanicPartsToolsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const diagnosis = useChainlyStore((s) => s.currentDiagnosis);
  const toggleToolHave = useChainlyStore((s) => s.toggleToolHave);

  const parts = diagnosis?.parts || [];
  const tools = diagnosis?.tools || [];

  const onSave = useCallback(() => {
    router.push("/ai/photo-mechanic/save");
  }, [router]);

  const onBack = useCallback(() => {
    router.back();
  }, [router]);

  const onFindParts = useCallback(() => {
    Alert.alert(
      "Coming soon",
      "Soon this will find parts that match your exact build.",
    );
  }, []);

  if (!diagnosis) {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" />
        <ScreenHeader title="Parts & Tools" showBack />
        <View style={{ paddingHorizontal: spacing.xl }}>
          <Text style={styles.title}>No list yet</Text>
          <Text style={styles.subtitle}>Go back to Results first.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <ScreenHeader title="Parts & Tools" showBack />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: insets.bottom + 28 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Grab what you need</Text>
        <Text style={styles.subtitle}>
          This is a best guess — your bike might have a special flavor.
        </Text>

        <View style={styles.sectionHeader}>
          <View style={styles.sectionIcon}>
            <PackageSearch size={18} color={colors.primary} strokeWidth={2.5} />
          </View>
          <Text style={styles.sectionTitle}>Parts you might need</Text>
        </View>

        {parts.length ? (
          parts.map((p) => (
            <AppCard key={p.name} style={styles.partCard}>
              <View style={styles.partTop}>
                <Text style={styles.partName}>{p.name}</Text>
                <Chip
                  label={p.priority === "must" ? "Must have" : "Nice to have"}
                  selected
                  tone={priorityTone(p.priority)}
                />
              </View>
              <Text style={styles.partHint}>{p.specHint}</Text>
              <Text style={styles.partPrice}>{p.estPriceRange}</Text>
            </AppCard>
          ))
        ) : (
          <AppCard style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No parts flagged 🎉</Text>
            <Text style={styles.emptySub}>
              This one might be a quick adjustment.
            </Text>
          </AppCard>
        )}

        <AppButton
          title="Find compatible parts"
          onPress={onFindParts}
          variant="secondary"
        />

        <View style={{ height: spacing.xxl }} />

        <View style={styles.sectionHeader}>
          <View style={styles.sectionIcon}>
            <Wrench size={18} color={colors.primary} strokeWidth={2.5} />
          </View>
          <Text style={styles.sectionTitle}>Tools checklist</Text>
        </View>

        {tools.map((t) => {
          const Icon = t.have ? CheckCircle2 : Circle;
          const iconColor = t.have ? colors.success : colors.textTertiary;
          const helper = t.optional ? "Optional" : "Required";
          return (
            <AppCard
              key={t.name}
              style={styles.toolRow}
              onPress={() => toggleToolHave(t.name)}
            >
              <Icon size={22} color={iconColor} strokeWidth={2.5} />
              <View style={{ flex: 1 }}>
                <Text style={styles.toolName}>{t.name}</Text>
                <Text style={styles.toolSub}>{helper}</Text>
              </View>
            </AppCard>
          );
        })}

        <View style={{ height: spacing.lg }} />

        <AppButton title="Add to Maintenance Log" onPress={onSave} />
        <View style={{ height: spacing.sm }} />
        <AppButton
          title="Back to Fix Steps"
          onPress={onBack}
          variant="secondary"
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  scroll: {
    flex: 1,
    paddingHorizontal: spacing.xl,
  },

  title: {
    fontSize: 24,
    lineHeight: 26,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    letterSpacing: -0.4,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.base,
    lineHeight: 20,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  sectionIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.round,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primarySoft2,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    fontSize: 16,
    lineHeight: 18,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },

  partCard: {
    marginBottom: spacing.md,
  },
  partTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  partName: {
    flex: 1,
    fontSize: 16,
    lineHeight: 18,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
  },
  partHint: {
    fontSize: typography.base,
    lineHeight: 19,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
  partPrice: {
    marginTop: spacing.sm,
    fontSize: typography.base,
    lineHeight: 19,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
  },

  emptyCard: {
    marginBottom: spacing.md,
    backgroundColor: colors.surfaceWarm,
    borderColor: colors.border,
  },
  emptyTitle: {
    fontSize: 16,
    lineHeight: 18,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
  },
  emptySub: {
    marginTop: 6,
    fontSize: typography.base,
    lineHeight: 19,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },

  toolRow: {
    marginBottom: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.lg,
  },
  toolName: {
    fontSize: 16,
    lineHeight: 18,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
  },
  toolSub: {
    marginTop: 4,
    fontSize: typography.sm,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textSecondary,
  },
});
