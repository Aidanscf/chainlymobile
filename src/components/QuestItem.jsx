import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, spacing, radius, typography } from "../theme/index";
import { CheckCircle2 } from "lucide-react-native";

const QuestItem = ({ title, completed }) => {
  const iconColor = completed ? colors.primary : colors.textTertiary;

  return (
    <View style={styles.container}>
      <CheckCircle2 size={16} color={iconColor} strokeWidth={2.25} />
      <Text style={[styles.text, completed && styles.completed]}>{title}</Text>
      {completed ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Done</Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  text: {
    fontSize: typography.base,
    lineHeight: 18,
    color: colors.textPrimary,
    marginLeft: spacing.sm,
    flex: 1,
    fontFamily: typography.fontFamily.semibold,
  },
  completed: {
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
    lineHeight: 14,
    color: colors.success,
    fontFamily: typography.fontFamily.semibold,
  },
});

export default QuestItem;
