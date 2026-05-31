import React from "react";
import { View, Text, TextInput } from "react-native";
import AppCard from "@/components/AppCard";
import AppButton from "@/components/AppButton";
import Chip from "@/components/Chip";
import { colors, spacing, radius, typography } from "@/theme/index";

export function QuestionsStep({
  followUps,
  answers,
  onSetAnswer,
  isLoading,
  onGetDiagnosis,
  onStartOver,
}) {
  return (
    <AppCard style={styles.card}>
      <Text style={styles.sectionTitle}>Quick Questions</Text>
      <Text style={styles.sectionSub}>
        A few details helps keep the diagnosis safer and more accurate.
      </Text>

      {followUps.length ? (
        <View style={{ gap: spacing.lg }}>
          {followUps.map((q) => {
            const id = q?.id;
            const question = q?.question;
            const type = q?.type;
            const options = Array.isArray(q?.options) ? q.options : [];

            const answerValue = id ? answers?.[id] : null;

            const isYes = answerValue === "yes";
            const isNo = answerValue === "no";

            return (
              <View key={String(id || question)}>
                <Text style={styles.questionText}>{question}</Text>

                {type === "yes_no" ? (
                  <View style={styles.rowWrap}>
                    <Chip
                      label="Yes"
                      selected={isYes}
                      tone={isYes ? "orange" : "neutral"}
                      onPress={() => onSetAnswer(id, "yes")}
                      style={{
                        marginRight: spacing.sm,
                        marginBottom: spacing.sm,
                      }}
                    />
                    <Chip
                      label="No"
                      selected={isNo}
                      tone={isNo ? "orange" : "neutral"}
                      onPress={() => onSetAnswer(id, "no")}
                      style={{
                        marginRight: spacing.sm,
                        marginBottom: spacing.sm,
                      }}
                    />
                  </View>
                ) : null}

                {type === "select" ? (
                  <View style={styles.rowWrap}>
                    {options.slice(0, 8).map((opt) => {
                      const selected = answerValue === opt;
                      return (
                        <Chip
                          key={opt}
                          label={opt}
                          selected={selected}
                          tone={selected ? "orange" : "neutral"}
                          onPress={() => onSetAnswer(id, opt)}
                          style={{
                            marginRight: spacing.sm,
                            marginBottom: spacing.sm,
                          }}
                        />
                      );
                    })}
                  </View>
                ) : null}

                {type === "short_text" ? (
                  <View style={styles.shortInputWrap}>
                    <TextInput
                      value={answerValue ? String(answerValue) : ""}
                      onChangeText={(t) => onSetAnswer(id, t)}
                      placeholder="Type a short answer"
                      placeholderTextColor={colors.textSecondary}
                      style={styles.shortInput}
                    />
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>
      ) : (
        <Text style={styles.emptyText}>
          No questions returned. You can still continue.
        </Text>
      )}

      <View style={{ marginTop: spacing.xl, gap: spacing.sm }}>
        <AppButton
          title="Get Diagnosis"
          onPress={onGetDiagnosis}
          loading={isLoading}
        />
        <AppButton
          title="Start over"
          onPress={onStartOver}
          variant="secondary"
        />
      </View>
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
  questionText: {
    fontSize: typography.base,
    lineHeight: 20,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    letterSpacing: -0.1,
  },
  rowWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  shortInputWrap: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: "hidden",
  },
  shortInput: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: typography.base,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textPrimary,
  },
  emptyText: {
    marginTop: spacing.md,
    fontSize: typography.base,
    lineHeight: 19,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
};
