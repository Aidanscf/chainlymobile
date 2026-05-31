import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  Switch,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import {
  Mountain,
  CornerUpRight,
  MoveDownRight,
  Zap,
} from "lucide-react-native";

import AppCard from "@/components/AppCard";
import AppButton from "@/components/AppButton";
import { colors, spacing, radius, typography } from "@/theme/index";
import { rubricsByType, RIDING_TYPES } from "@/utils/scoringRubrics";
import { useMediaAnalyzerStore } from "@/store/mediaAnalyzer";
import ScreenHeader from "@/components/layout/ScreenHeader";

const TYPE_META = {
  Jumps: {
    icon: Zap,
    description: "Takeoff, air control, landing form",
  },
  Drops: {
    icon: MoveDownRight,
    description: "Body position + landing absorption",
  },
  Cornering: {
    icon: CornerUpRight,
    description: "Speed, lean, traction, exit drive",
  },
};

export default function AIMediaAnalyzerTypeConfirmScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const draft = useMediaAnalyzerStore((s) => s.draft);
  const setDraft = useMediaAnalyzerStore((s) => s.setDraft);

  const [ridingType, setRidingType] = useState("Jumps");
  const [beginnerFriendly, setBeginnerFriendly] = useState(true);
  const [aggressiveScoring, setAggressiveScoring] = useState(false);

  const onBack = useCallback(async () => {
    try {
      if (Platform.OS !== "web") {
        await Haptics.selectionAsync();
      }
    } catch (e) {
      console.error(e);
    }
    router.back();
  }, [router]);

  const whatMattersText = useMemo(() => {
    const rubric = rubricsByType[ridingType];
    return rubric?.description || "";
  }, [ridingType]);

  const onStart = useCallback(async () => {
    try {
      if (!draft?.mediaUri || !draft?.mediaType) {
        router.replace("/ai/media-analyzer");
        return;
      }

      setDraft({
        ridingType,
        options: {
          beginnerFriendly,
          aggressiveScoring,
        },
      });

      if (Platform.OS !== "web") {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      router.push("/ai/media-analyzer/processing");
    } catch (e) {
      console.error(e);
    }
  }, [
    aggressiveScoring,
    beginnerFriendly,
    draft,
    ridingType,
    router,
    setDraft,
  ]);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <ScreenHeader title="Analyzer Coach" showBack onBack={onBack} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>What are we analyzing?</Text>
        <Text style={styles.subtitle}>
          Pick one — I’ll grade the right things and keep feedback crisp.
        </Text>

        <View style={{ gap: spacing.md }}>
          {RIDING_TYPES.map((t) => {
            const meta = TYPE_META[t];
            const Icon = meta?.icon;
            const selected = t === ridingType;

            const cardStyle = selected
              ? [styles.typeCard, styles.typeCardSelected]
              : styles.typeCard;

            const badgeStyle = selected
              ? [styles.typeBadge, styles.typeBadgeSelected]
              : styles.typeBadge;

            const titleColor = selected
              ? colors.textPrimary
              : colors.textPrimary;
            const subColor = selected
              ? colors.textSecondary
              : colors.textSecondary;

            return (
              <AppCard
                key={t}
                style={cardStyle}
                onPress={() => setRidingType(t)}
              >
                <View style={styles.typeRow}>
                  <View style={badgeStyle}>
                    {Icon ? (
                      <Icon
                        size={18}
                        color={colors.primary}
                        strokeWidth={2.5}
                      />
                    ) : null}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.typeTitle, { color: titleColor }]}>
                      {t}
                    </Text>
                    <Text style={[styles.typeSub, { color: subColor }]}>
                      {meta?.description}
                    </Text>
                  </View>
                </View>
              </AppCard>
            );
          })}
        </View>

        <AppCard style={styles.whatMattersCard} pressable={false}>
          <Text style={styles.whatMattersTitle}>What matters</Text>
          <Text style={styles.whatMattersText}>{whatMattersText}</Text>
        </AppCard>

        <AppCard style={styles.toggleCard} pressable={false}>
          <View style={styles.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.toggleTitle}>Beginner-friendly feedback</Text>
              <Text style={styles.toggleSub}>
                Coach cues first. Less jargon.
              </Text>
            </View>
            <Switch
              value={beginnerFriendly}
              onValueChange={setBeginnerFriendly}
              trackColor={{ false: colors.border, true: colors.primarySoft2 }}
              thumbColor={beginnerFriendly ? colors.primary : "#FFFFFF"}
            />
          </View>

          <View style={[styles.toggleRow, { marginTop: spacing.lg }]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.toggleTitle}>Aggressive scoring</Text>
              <Text style={styles.toggleSub}>
                Tough love mode (default off).
              </Text>
            </View>
            <Switch
              value={aggressiveScoring}
              onValueChange={setAggressiveScoring}
              trackColor={{ false: colors.border, true: colors.primarySoft2 }}
              thumbColor={aggressiveScoring ? colors.primary : "#FFFFFF"}
            />
          </View>
        </AppCard>

        <View style={{ marginTop: spacing.xl }}>
          <AppButton title="Start Analysis" onPress={onStart} />
        </View>
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
    fontSize: 28,
    lineHeight: 30,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: typography.base,
    lineHeight: 20,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },

  typeCard: {
    backgroundColor: colors.surface,
    borderColor: colors.borderLight,
  },
  typeCardSelected: {
    backgroundColor: colors.surfaceWarm,
    borderColor: colors.primarySoft2,
  },
  typeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  typeBadge: {
    width: 46,
    height: 46,
    borderRadius: radius.round,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.iconBgOrange,
    borderWidth: 1,
    borderColor: colors.border,
  },
  typeBadgeSelected: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primarySoft2,
  },
  typeTitle: {
    fontSize: 16,
    lineHeight: 18,
    fontFamily: typography.fontFamily.black,
    letterSpacing: -0.2,
  },
  typeSub: {
    marginTop: 4,
    fontSize: typography.sm,
    fontFamily: typography.fontFamily.semibold,
  },

  whatMattersCard: {
    marginTop: spacing.xl,
    backgroundColor: colors.surfaceWarm,
    borderColor: colors.border,
  },
  whatMattersTitle: {
    fontSize: 15,
    lineHeight: 17,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  whatMattersText: {
    marginTop: 6,
    fontSize: typography.base,
    lineHeight: 19,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },

  toggleCard: {
    marginTop: spacing.md,
    backgroundColor: colors.surface,
    borderColor: colors.borderLight,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  toggleTitle: {
    fontSize: 15,
    lineHeight: 17,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  toggleSub: {
    marginTop: 4,
    fontSize: typography.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
});
