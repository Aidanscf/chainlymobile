import React, { useMemo, useState, useCallback } from "react";
import { View, Text, TextInput, Pressable } from "react-native";
import AppCard from "@/components/AppCard";
import AppButton from "@/components/AppButton";
import Chip from "@/components/Chip";
import { colors, spacing, radius, typography } from "@/theme/index";
import { QUICK_CHIPS } from "../_constants/quickChips";
import { ChevronDown, ChevronUp } from "lucide-react-native";

const START_OPTIONS = [
  "Today",
  "Last ride",
  "Last week",
  "After maintenance",
  "After crash / impact",
  "Gradually over time",
];

const HAPPENS_OPTIONS = [
  "Under braking",
  "Under pedaling",
  "While climbing",
  "On descents",
  "At high speed",
  "Standing vs seated",
];

const SEVERITY_OPTIONS = [
  "Mild annoyance",
  "Affects performance",
  "Feels unsafe",
  "Ride-stopping issue",
];

const CHANGES_OPTIONS = [
  "New part installed",
  "Bike serviced",
  "Suspension adjusted",
  "Weather change",
  "Nothing obvious",
];

export function DescribeStep({
  issueText,
  onIssueTextChange,
  selectedChips,
  onToggleChip,
  guidedContext,
  onToggleGuidedContext,
  canGoNext,
  isLoading,
  onNext,
}) {
  const [showGuided, setShowGuided] = useState(false);

  const started = useMemo(() => {
    return Array.isArray(guidedContext?.started) ? guidedContext.started : [];
  }, [guidedContext?.started]);

  const happens = useMemo(() => {
    return Array.isArray(guidedContext?.happens) ? guidedContext.happens : [];
  }, [guidedContext?.happens]);

  const severity = useMemo(() => {
    return Array.isArray(guidedContext?.severity) ? guidedContext.severity : [];
  }, [guidedContext?.severity]);

  const changes = useMemo(() => {
    return Array.isArray(guidedContext?.changes) ? guidedContext.changes : [];
  }, [guidedContext?.changes]);

  const toggleGuidedOpen = useCallback(() => {
    setShowGuided((v) => !v);
  }, []);

  const renderChipGroup = useCallback(
    ({ title, groupKey, options, selected }) => {
      return (
        <View style={{ marginTop: spacing.md }}>
          <Text style={styles.guidedLabel}>{title}</Text>
          <View style={styles.guidedChipWrap}>
            {options.map((c) => {
              const isSelected = selected.includes(c);
              return (
                <Chip
                  key={`${groupKey}_${c}`}
                  label={c}
                  selected={isSelected}
                  tone={isSelected ? "orange" : "neutral"}
                  onPress={() => onToggleGuidedContext?.(groupKey, c)}
                  style={{ marginRight: spacing.sm, marginBottom: spacing.sm }}
                />
              );
            })}
          </View>
        </View>
      );
    },
    [onToggleGuidedContext],
  );

  return (
    <AppCard style={styles.card}>
      <Text style={styles.sectionTitle}>Describe the problem</Text>

      <View style={styles.textAreaWrap}>
        <TextInput
          value={issueText}
          onChangeText={onIssueTextChange}
          placeholder={
            "Examples:\n• My brakes squeal and feel weak\n• Rear derailleur skips under load\n• Fork is making a knocking sound"
          }
          placeholderTextColor={colors.textSecondary}
          multiline
          textAlignVertical="top"
          style={styles.textArea}
        />
      </View>

      <Text style={styles.hintText}>Quick tags (optional)</Text>
      <View style={styles.chipWrap}>
        {QUICK_CHIPS.map((c) => {
          const selected = selectedChips.includes(c);
          return (
            <Chip
              key={c}
              label={c}
              selected={selected}
              tone={selected ? "orange" : "neutral"}
              onPress={() => onToggleChip(c)}
              style={{
                marginRight: spacing.sm,
                marginBottom: spacing.sm,
              }}
            />
          );
        })}
      </View>

      <Pressable
        onPress={toggleGuidedOpen}
        accessibilityRole="button"
        style={styles.guidedHeader}
      >
        <View style={{ flex: 1 }}>
          <Text style={styles.guidedTitle}>
            Help me diagnose faster (optional)
          </Text>
          <Text style={styles.guidedSubtitle}>Tap to add quick context</Text>
        </View>
        {showGuided ? (
          <ChevronUp
            size={18}
            color={colors.textSecondary}
            strokeWidth={2.75}
          />
        ) : (
          <ChevronDown
            size={18}
            color={colors.textSecondary}
            strokeWidth={2.75}
          />
        )}
      </Pressable>

      {showGuided ? (
        <View style={styles.guidedBody}>
          {renderChipGroup({
            title: "When did the issue start?",
            groupKey: "started",
            options: START_OPTIONS,
            selected: started,
          })}
          {renderChipGroup({
            title: "Where does it happen?",
            groupKey: "happens",
            options: HAPPENS_OPTIONS,
            selected: happens,
          })}
          {renderChipGroup({
            title: "How bad is it?",
            groupKey: "severity",
            options: SEVERITY_OPTIONS,
            selected: severity,
          })}
          {renderChipGroup({
            title: "What changed recently?",
            groupKey: "changes",
            options: CHANGES_OPTIONS,
            selected: changes,
          })}
        </View>
      ) : null}

      <AppButton
        title="Next"
        onPress={onNext}
        disabled={!canGoNext}
        loading={isLoading}
      />

      <Text style={styles.smallPrint}>
        Tip: include when it started and what changed recently.
      </Text>
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
  textAreaWrap: {
    marginTop: spacing.sm,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: "hidden",
  },
  textArea: {
    minHeight: 140,
    padding: spacing.lg,
    fontSize: typography.base,
    lineHeight: 20,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textPrimary,
  },
  hintText: {
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    fontSize: typography.sm,
    fontFamily: typography.fontFamily.bold,
    color: colors.textSecondary,
  },
  chipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: spacing.lg,
  },
  guidedChipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  smallPrint: {
    marginTop: spacing.md,
    fontSize: typography.sm,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textSecondary,
    textAlign: "center",
  },
  guidedHeader: {
    marginTop: spacing.md,
    paddingVertical: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  guidedTitle: {
    fontSize: typography.sm,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
  },
  guidedSubtitle: {
    marginTop: 4,
    fontSize: typography.sm,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textSecondary,
  },
  guidedBody: {
    marginBottom: spacing.lg,
    paddingBottom: spacing.sm,
  },
  guidedLabel: {
    fontSize: typography.sm,
    fontFamily: typography.fontFamily.bold,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
};
