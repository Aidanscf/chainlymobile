import React, { useCallback } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { colors, spacing, radius, typography, shadows } from "../theme/index";
import { AlertCircle, Clock, CheckCircle2 } from "lucide-react-native";
import * as Haptics from "expo-haptics";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const BikeCard = ({ bike, onPress }) => {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => {
    return { transform: [{ scale: scale.value }] };
  });

  const getHealthColor = (score) => {
    if (score >= 70) return colors.success;
    if (score >= 40) return colors.warning;
    return colors.danger;
  };

  const healthColor = getHealthColor(bike.healthScore);

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.99, { damping: 18, stiffness: 260 });
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 18, stiffness: 260 });
  }, [scale]);

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.(bike);
  }, [bike, onPress]);

  const questStats = bike?.questStats || {
    urgent: 0,
    dueSoon: 0,
    completed: 0,
  };
  const quests = Array.isArray(bike?.quests) ? bike.quests : [];

  return (
    <AnimatedPressable
      style={[styles.card, animatedStyle]}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.bikeName}>{bike.name}</Text>
        <View style={styles.levelBadge}>
          <Text style={styles.levelText}>Lv {bike.level}</Text>
        </View>
      </View>

      {/* Health */}
      <View style={styles.healthSection}>
        <View style={styles.healthRow}>
          <Text style={styles.healthLabel}>Maintenance Health</Text>
          <Text style={[styles.healthScore, { color: healthColor }]}>
            {bike.healthScore}%
          </Text>
        </View>
        <View style={styles.healthBar}>
          <View
            style={[
              styles.healthFill,
              { width: `${bike.healthScore}%`, backgroundColor: healthColor },
            ]}
          />
        </View>
      </View>

      {/* Quest Indicators */}
      {(questStats.dueSoon > 0 || questStats.urgent > 0) && (
        <View style={styles.questIndicators}>
          {questStats.urgent > 0 && (
            <View style={[styles.indicator, styles.urgentIndicator]}>
              <AlertCircle size={14} color={colors.danger} strokeWidth={2.25} />
              <Text style={styles.urgentText}>
                Urgent Quests ({questStats.urgent})
              </Text>
            </View>
          )}
          {questStats.dueSoon > 0 && (
            <View style={[styles.indicator, styles.dueSoonIndicator]}>
              <Clock size={14} color={colors.warning} strokeWidth={2.25} />
              <Text style={styles.dueSoonText}>
                Due Soon Quests ({questStats.dueSoon})
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Quests (demo bikes may include these; new bikes can omit) */}
      {quests.length > 0 ? (
        <View style={styles.questsSection}>
          {quests.map((quest) => {
            const iconColor = quest.completed
              ? colors.primary
              : colors.textTertiary;
            const textStyle = quest.completed ? styles.questTextDone : null;
            return (
              <View key={quest.id} style={styles.questItem}>
                <CheckCircle2 size={16} color={iconColor} strokeWidth={2.25} />
                <Text style={[styles.questText, textStyle]}>{quest.title}</Text>
                {quest.completed ? (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>Done</Text>
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>
      ) : null}
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.small,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  bikeName: {
    flex: 1,
    paddingRight: spacing.md,
    fontSize: 18,
    lineHeight: 20,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  levelBadge: {
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.round,
    borderWidth: 1,
    borderColor: colors.primarySoft2,
  },
  levelText: {
    fontSize: typography.sm,
    color: colors.primary,
    fontFamily: typography.fontFamily.semibold,
  },
  healthSection: {
    marginBottom: spacing.md,
  },
  healthRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  healthLabel: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    fontFamily: typography.fontFamily.regular,
  },
  healthScore: {
    fontSize: typography.base,
    fontFamily: typography.fontFamily.bold,
    letterSpacing: -0.2,
  },
  healthBar: {
    height: 10,
    backgroundColor: colors.borderLight,
    borderRadius: radius.round,
    overflow: "hidden",
  },
  healthFill: {
    height: "100%",
    borderRadius: radius.round,
  },
  questIndicators: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  indicator: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.round,
    gap: spacing.xs,
  },
  urgentIndicator: {
    backgroundColor: colors.dangerLight,
  },
  dueSoonIndicator: {
    backgroundColor: colors.warningSoft,
  },
  urgentText: {
    fontSize: typography.xs,
    color: colors.danger,
    fontFamily: typography.fontFamily.semibold,
  },
  dueSoonText: {
    fontSize: typography.xs,
    color: colors.warning,
    fontFamily: typography.fontFamily.semibold,
  },
  questsSection: {
    marginTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: spacing.sm,
  },
  questItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  questText: {
    fontSize: typography.base,
    color: colors.textPrimary,
    marginLeft: spacing.sm,
    flex: 1,
    fontFamily: typography.fontFamily.semibold,
  },
  questTextDone: {
    color: colors.textSecondary,
    fontFamily: typography.fontFamily.regular,
  },
  badge: {
    backgroundColor: colors.successSoft,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.round,
    borderWidth: 1,
    borderColor: "#CCF4DF",
  },
  badgeText: {
    fontSize: typography.xs,
    color: colors.success,
    fontFamily: typography.fontFamily.semibold,
  },
});

export default BikeCard;
