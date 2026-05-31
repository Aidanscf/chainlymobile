import React, { useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";

import { colors, spacing, typography, radius } from "@/theme/index";
import ScreenHeader from "@/components/layout/ScreenHeader";
import KeyboardAvoidingAnimatedView from "@/components/KeyboardAvoidingAnimatedView";
import AppCard from "@/components/AppCard";

import { useBikes } from "./_hooks/useBikes";
import { useBikeSelection } from "./_hooks/useBikeSelection";
import { useMechanicFlow } from "./_hooks/useMechanicFlow";
import { useBikePicker } from "./_hooks/useBikePicker";
import { useDiagnosisData } from "./_hooks/useDiagnosisData";

import { BikeContextCard } from "./_components/BikeContextCard";
import { ErrorCard } from "./_components/ErrorCard";
import { DescribeStep } from "./_components/DescribeStep";
import { QuestionsStep } from "./_components/QuestionsStep";
import { ResultsStep } from "./_components/ResultsStep";
import { BikePickerModal } from "./_components/BikePickerModal";

export default function AIBikeHelperEntryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { bikesQuery, bikeList } = useBikes();
  const {
    selectedBikeId,
    selectedBike,
    bikeProfile,
    onSelectBike,
    clearBikeContext,
  } = useBikeSelection(bikeList);

  const {
    step,
    issueText,
    setIssueText,
    selectedChips,
    guidedContext,
    diagnosis,
    uiError,
    isLoading,
    loadingPhase,
    canGoNext,
    followUps,
    answers,
    onToggleChip,
    onToggleGuidedContext,
    onNext,
    onSetAnswer,
    onGetDiagnosis,
    onStartOver,
  } = useMechanicFlow(bikeProfile);

  const { bikePickerOpen, openBikePicker, closeBikePicker } = useBikePicker();

  const { safetyAlertText, candidates, fixPlan, resources } =
    useDiagnosisData(diagnosis);

  const canChangeBikeContext = step === "describe" && !bikesQuery.isLoading;

  const onBackToAIHub = useCallback(async () => {
    try {
      if (Platform.OS !== "web") {
        await Haptics.selectionAsync();
      }
    } catch (error) {
      console.error(error);
    }
    router.replace("/ai");
  }, [router]);

  const handleOpenBikePicker = useCallback(() => {
    if (!canChangeBikeContext || isLoading) {
      return;
    }
    openBikePicker();
  }, [canChangeBikeContext, isLoading, openBikePicker]);

  const handleClearBikeContext = useCallback(() => {
    if (!canChangeBikeContext || isLoading) {
      return;
    }
    clearBikeContext();
  }, [canChangeBikeContext, isLoading, clearBikeContext]);

  const showDescribe = step === "describe";
  const showQuestions = step === "questions";
  const showResults = step === "results";

  const triageLoading = loadingPhase === "triage";
  const diagnoseLoading = loadingPhase === "diagnose";

  const showDiagnosingOverlay = diagnoseLoading && !showResults;

  const loadingTitle = useMemo(() => {
    if (triageLoading) {
      return "Working…";
    }
    if (diagnoseLoading) {
      return "Diagnosing your bike…";
    }
    return "Working…";
  }, [diagnoseLoading, triageLoading]);

  const loadingSubtitle = useMemo(() => {
    if (triageLoading) {
      return "Getting the right questions so this stays accurate.";
    }
    if (diagnoseLoading) {
      return "Analyzing your description and building a safe fix plan.";
    }
    return "One sec.";
  }, [diagnoseLoading, triageLoading]);

  const headerTitle = "Bike Mechanic";

  return (
    <KeyboardAvoidingAnimatedView style={styles.container} behavior="padding">
      <StatusBar style="dark" />

      <ScreenHeader title={headerTitle} showBack onBack={onBackToAIHub} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Bike Mechanic</Text>
        <Text style={styles.subtitle}>
          Describe what's wrong and I'll help diagnose it.
        </Text>

        <BikeContextCard
          selectedBike={selectedBike}
          bikeList={bikeList}
          bikesQuery={bikesQuery}
          canChangeBikeContext={canChangeBikeContext}
          isLoading={isLoading}
          step={step}
          onOpenBikePicker={handleOpenBikePicker}
          onClearBikeContext={handleClearBikeContext}
        />

        <ErrorCard error={uiError} onRetry={onStartOver} />

        {showDescribe ? (
          <DescribeStep
            issueText={issueText}
            onIssueTextChange={setIssueText}
            selectedChips={selectedChips}
            onToggleChip={onToggleChip}
            guidedContext={guidedContext}
            onToggleGuidedContext={onToggleGuidedContext}
            canGoNext={canGoNext}
            isLoading={triageLoading}
            onNext={onNext}
          />
        ) : null}

        {showQuestions ? (
          <QuestionsStep
            followUps={followUps}
            answers={answers}
            onSetAnswer={onSetAnswer}
            isLoading={diagnoseLoading}
            onGetDiagnosis={onGetDiagnosis}
            onStartOver={onStartOver}
          />
        ) : null}

        {showResults ? (
          <ResultsStep
            diagnosis={diagnosis}
            safetyAlertText={safetyAlertText}
            candidates={candidates}
            fixPlan={fixPlan}
            resources={resources}
            onStartOver={onStartOver}
          />
        ) : null}
      </ScrollView>

      <BikePickerModal
        visible={bikePickerOpen}
        onClose={closeBikePicker}
        bikesQuery={bikesQuery}
        bikeList={bikeList}
        selectedBikeId={selectedBikeId}
        onSelectBike={onSelectBike}
      />

      {showDiagnosingOverlay ? (
        <View style={styles.loadingOverlay} pointerEvents="auto">
          <AppCard style={styles.loadingCard}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.loadingTitle}>{loadingTitle}</Text>
            <Text style={styles.loadingSubtitle}>{loadingSubtitle}</Text>
          </AppCard>
        </View>
      ) : null}
    </KeyboardAvoidingAnimatedView>
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
    fontSize: 32,
    lineHeight: 34,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    letterSpacing: -0.6,
  },
  subtitle: {
    fontSize: typography.base,
    lineHeight: 20,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    marginBottom: spacing.xxl,
  },

  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 50,
    elevation: 12,
    backgroundColor: "rgba(247,243,238,0.78)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
  },
  loadingCard: {
    width: "100%",
    maxWidth: 520,
    backgroundColor: colors.surface,
    borderColor: colors.borderLight,
    alignItems: "center",
    paddingVertical: spacing.xxl,
    gap: spacing.md,
    borderRadius: radius.xl,
  },
  loadingTitle: {
    marginTop: spacing.sm,
    fontSize: 18,
    lineHeight: 20,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  loadingSubtitle: {
    textAlign: "center",
    fontSize: typography.base,
    lineHeight: 19,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textSecondary,
    maxWidth: 340,
  },
});
