import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Pressable,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import ScreenHeader from "@/components/layout/ScreenHeader";
import ScreenContainer from "@/components/layout/ScreenContainer";
import AppCard from "@/components/AppCard";
import AppButton from "@/components/AppButton";
import KeyboardAvoidingAnimatedView from "@/components/KeyboardAvoidingAnimatedView";
import { colors, spacing, radius, typography } from "@/theme/index";
import { useChainlyStore } from "@/store/chainlyStore";

import StepBasics from "@/components/garage/AddBikeStepBasics";
import StepSpecs from "@/components/garage/AddBikeStepSpecs";
import StepSuspension from "@/components/garage/AddBikeStepSuspension";
import StepDrivetrain from "@/components/garage/AddBikeStepDrivetrain";
import StepWheels from "@/components/garage/AddBikeStepWheels";
import StepReview from "@/components/garage/AddBikeStepReview";

import {
  validateBikeBasics,
  validateBikeSpecs,
  validateBikeSuspension,
  validateBikeDrivetrain,
  validateBikeWheels,
  buildComponentsFromDraft,
  normalizeDraftToCanonicalBike,
} from "@/utils/validation/bike";

import { apiFetch } from "@/services/apiClient";
import { isServerSyncActive } from "@/utils/serverSync";

const DRAFT_KEY = "chainly_add_bike_draft_v1";

const STEPS = [
  { key: "basics", title: "Bike Basics" },
  { key: "specs", title: "Specs & Standards" },
  { key: "suspension", title: "Suspension Setup" },
  { key: "drivetrain", title: "Drivetrain & Brakes" },
  { key: "wheels", title: "Wheels & Tires" },
  { key: "review", title: "Review & Save" },
];

function ProgressPills({ stepIndex }) {
  return (
    <View style={styles.progressRow}>
      {STEPS.map((s, idx) => {
        const isActive = idx === stepIndex;
        const isDone = idx < stepIndex;

        const bg = isActive
          ? colors.primary
          : isDone
            ? colors.primarySoft2
            : colors.surface;

        const border = isActive
          ? colors.primary
          : isDone
            ? colors.primary
            : colors.border;

        const fg = isActive
          ? "#FFFFFF"
          : isDone
            ? colors.primary
            : colors.textTertiary;

        const label = String(idx + 1);

        return (
          <View
            key={s.key}
            style={[
              styles.progressPill,
              { backgroundColor: bg, borderColor: border },
            ]}
          >
            <Text style={[styles.progressText, { color: fg }]}>{label}</Text>
          </View>
        );
      })}
    </View>
  );
}

function getInitialDraft() {
  return {
    // Step 1
    name: "",
    bike_type: "Trail",
    brand: "",
    model: "",
    model_year: "",
    image_url: null,

    // NEW: more bike details (optional)
    purchase_date: "", // YYYY-MM-DD
    serial_number: "",

    // Step 2 (DB fields)
    wheel_size: null,
    wheel_config: "unknown", // dropdown
    frame_size: "",
    hub_driver: null,
    drivetrain_speed: null,
    brake_mount: null,
    rotor_size: null, // max rotor size (mm)

    // Step 3
    fork_brand: "",
    fork_model: "",
    fork_travel_mm: "",
    fork_spring: "Air",

    shock_brand: "",
    shock_model: "",
    rear_travel_mm: "",
    shock_spring: "Air",

    // Step 4
    crankset: "",
    cassette: "",
    chain_type: "",

    // NEW: drivetrain slots (optional)
    derailleur_model: "",
    shifter_model: "",
    bottom_bracket_type: "",
    bottom_bracket_standard: "",

    brake_model: "",
    rotor_front_mm: "",
    rotor_rear_mm: "",

    // NEW: cockpit slot (optional)
    dropper_brand: "",
    dropper_model: "",
    dropper_travel_mm: "",

    // Step 5
    wheelset_model: "",
    tire_front_model: "",
    tire_front_width: "",
    tire_rear_model: "",
    tire_rear_width: "",
    tubeless: true,

    // NEW: component metadata (optional, applies to created component rows)
    components_came_with_bike: false,
    components_installed_at: "", // YYYY-MM-DD
  };
}

async function safeReadDraft() {
  try {
    const raw = await AsyncStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch (e) {
    console.error(e);
    return null;
  }
}

async function safeWriteDraft(next) {
  try {
    await AsyncStorage.setItem(DRAFT_KEY, JSON.stringify(next));
  } catch (e) {
    console.error(e);
  }
}

async function safeClearDraft() {
  try {
    await AsyncStorage.removeItem(DRAFT_KEY);
  } catch (e) {
    console.error(e);
  }
}

export default function AddBikeWizard() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const createBikeWizardOptimistic = useChainlyStore(
    (s) => s.createBikeWizardOptimistic,
  );
  const queuePendingBikeCreate = useChainlyStore(
    (s) => s.queuePendingBikeCreate,
  );
  const markPendingBikeCreateDone = useChainlyStore(
    (s) => s.markPendingBikeCreateDone,
  );

  const [stepIndex, setStepIndex] = useState(0);
  const [draft, setDraft] = useState(getInitialDraft());
  const [fieldErrors, setFieldErrors] = useState({});

  const lastSavedAtRef = useRef(0);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const existing = await safeReadDraft();
      if (!mounted) return;
      if (existing) {
        setDraft((d) => ({ ...d, ...existing }));
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Lightweight autosave as they type.
  useEffect(() => {
    const now = Date.now();
    if (now - lastSavedAtRef.current < 500) {
      return;
    }
    lastSavedAtRef.current = now;
    safeWriteDraft(draft);
  }, [draft]);

  const onSaveDraft = useCallback(async () => {
    await safeWriteDraft(draft);
    Alert.alert("Draft saved", "You can come back and finish anytime.");
  }, [draft]);

  const title = useMemo(() => {
    const step = STEPS[stepIndex];
    return step ? step.title : "Add Bike";
  }, [stepIndex]);

  const validateCurrentStep = useCallback(() => {
    let result = { ok: true, errors: {} };

    if (stepIndex === 0) result = validateBikeBasics(draft);
    if (stepIndex === 1) result = validateBikeSpecs(draft);
    if (stepIndex === 2) result = validateBikeSuspension(draft);
    if (stepIndex === 3) result = validateBikeDrivetrain(draft);
    if (stepIndex === 4) result = validateBikeWheels(draft);

    setFieldErrors(result.errors || {});
    return result.ok;
  }, [draft, stepIndex]);

  const goNext = useCallback(() => {
    const ok = validateCurrentStep();
    if (!ok) {
      return;
    }
    setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
  }, [validateCurrentStep]);

  const goBack = useCallback(() => {
    setFieldErrors({});
    setStepIndex((i) => Math.max(i - 1, 0));
  }, []);

  const mutation = useMutation({
    mutationFn: async (payload) => {
      // IMPORTANT: use apiFetch so x-chainly-user-id is attached.
      return await apiFetch("/api/bikes/create", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    onSuccess: async (_data, variables) => {
      await markPendingBikeCreateDone?.(variables?.bike?.id);
      queryClient.invalidateQueries({ queryKey: ["bikes"] });
    },
    onError: async (error, variables) => {
      console.error(error);
      await queuePendingBikeCreate?.(variables);
      Alert.alert(
        "Saved locally",
        "We saved your bike on this device. Sync failed for now — we’ll retry in the background.",
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["bikes"] });
    },
  });

  const onSaveBike = useCallback(async () => {
    const okBasics = validateBikeBasics(draft);
    const okSpecs = validateBikeSpecs(draft);

    const mergedErrors = {
      ...(okBasics.errors || {}),
      ...(okSpecs.errors || {}),
    };

    if (!okBasics.ok || !okSpecs.ok) {
      setFieldErrors(mergedErrors);
      setStepIndex(0);
      Alert.alert(
        "Missing a couple things",
        "Add a bike name and the key standards so we can keep your build compatible.",
      );
      return;
    }

    const canonicalBike = normalizeDraftToCanonicalBike(draft);
    const components = buildComponentsFromDraft(draft);

    const { bikeId, payload } = await createBikeWizardOptimistic({
      bike: canonicalBike,
      components,
    });

    await safeClearDraft();

    if (!isServerSyncActive()) {
      await queuePendingBikeCreate?.(payload);
      Alert.alert(
        "Saved locally",
        "Your bike is saved on this device. Sign in and enable sync to back it up to your account.",
      );
      router.replace(`/garage/${bikeId}`);
      return;
    }

    mutation.mutate(payload);

    router.replace(`/garage/${bikeId}`);
  }, [
    createBikeWizardOptimistic,
    draft,
    mutation,
    router,
    queuePendingBikeCreate,
  ]);

  const stepContent = useMemo(() => {
    const props = {
      draft,
      setDraft,
      fieldErrors,
    };

    if (stepIndex === 0) return <StepBasics {...props} />;
    if (stepIndex === 1) return <StepSpecs {...props} />;
    if (stepIndex === 2) return <StepSuspension {...props} />;
    if (stepIndex === 3) return <StepDrivetrain {...props} />;
    if (stepIndex === 4) return <StepWheels {...props} />;

    return (
      <StepReview
        draft={draft}
        onEditStep={(idx) => {
          setFieldErrors({});
          setStepIndex(Number(idx) || 0);
        }}
      />
    );
  }, [draft, fieldErrors, stepIndex]);

  const showBackWithinWizard = stepIndex > 0;
  const primaryTitle = stepIndex === STEPS.length - 1 ? "Save Bike" : "Next";
  const primaryAction = stepIndex === STEPS.length - 1 ? onSaveBike : goNext;

  const isSaving = mutation.isPending;

  return (
    <ScreenContainer safeTop>
      <StatusBar style="dark" />

      <KeyboardAvoidingAnimatedView style={{ flex: 1 }} behavior="padding">
        <ScreenHeader
          title={title}
          showBack
          onBack={() => {
            if (showBackWithinWizard) {
              goBack();
              return;
            }
            router.back();
          }}
          rightAction={
            <Pressable
              onPress={onSaveDraft}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Save draft"
            >
              <Text style={styles.draftBtnText}>Save Draft</Text>
            </Pressable>
          }
        />

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: spacing.xxxl }}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.topWrap}>
            <ProgressPills stepIndex={stepIndex} />

            <AppCard style={styles.helperCard}>
              <Text style={styles.helperTitle}>Quick note</Text>
              <Text style={styles.helperBody}>
                These specs help us recommend compatible parts.
              </Text>
            </AppCard>
          </View>

          <View style={styles.stepWrap}>{stepContent}</View>

          <View style={styles.navRow}>
            <View style={{ flex: 1 }}>
              {showBackWithinWizard ? (
                <AppButton
                  title="Back"
                  variant="secondary"
                  onPress={goBack}
                  disabled={isSaving}
                />
              ) : (
                <AppButton
                  title="Cancel"
                  variant="secondary"
                  onPress={() => router.back()}
                  disabled={isSaving}
                />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <AppButton
                title={isSaving ? "Saving…" : primaryTitle}
                onPress={primaryAction}
                disabled={isSaving}
              />
            </View>
          </View>

          {Object.keys(fieldErrors || {}).length ? (
            <View style={styles.errorWrap}>
              <Text style={styles.errorTitle}>Fix these to continue:</Text>
              {Object.values(fieldErrors)
                .slice(0, 4)
                .map((msg) => (
                  <Text key={msg} style={styles.errorText}>
                    • {msg}
                  </Text>
                ))}
            </View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingAnimatedView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  topWrap: {
    paddingHorizontal: spacing.xl,
  },

  progressRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.sm,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  progressPill: {
    flex: 1,
    height: 28,
    borderRadius: radius.round,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  progressText: {
    fontSize: typography.sm,
    fontFamily: typography.fontFamily.black,
  },

  helperCard: {
    backgroundColor: colors.surface,
    borderColor: colors.borderLight,
    padding: spacing.lg,
  },
  helperTitle: {
    fontSize: typography.sm,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    letterSpacing: -0.1,
  },
  helperBody: {
    marginTop: 6,
    fontSize: typography.base,
    lineHeight: 19,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },

  stepWrap: {
    paddingHorizontal: spacing.xl,
    marginTop: spacing.lg,
  },

  navRow: {
    flexDirection: "row",
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    marginTop: spacing.xl,
  },

  errorWrap: {
    marginTop: spacing.lg,
    marginHorizontal: spacing.xl,
    backgroundColor: colors.dangerLight,
    borderWidth: 1,
    borderColor: "#FFD0CD",
    borderRadius: radius.xl,
    padding: spacing.lg,
  },
  errorTitle: {
    fontSize: typography.sm,
    fontFamily: typography.fontFamily.black,
    color: colors.danger,
  },
  errorText: {
    marginTop: 6,
    fontSize: typography.sm,
    fontFamily: typography.fontFamily.semibold,
    color: colors.danger,
  },

  draftBtnText: {
    fontSize: typography.sm,
    fontFamily: typography.fontFamily.black,
    color: colors.primary,
  },
});
