import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  Modal,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Bike, Info, X } from "lucide-react-native";

import ScreenHeader from "@/components/layout/ScreenHeader";
import AppCard from "@/components/AppCard";
import Chip from "@/components/Chip";
import StickyCTA from "@/components/onboarding/StickyCTA";
import KeyboardAvoidingAnimatedView from "@/components/KeyboardAvoidingAnimatedView";

import { colors, spacing, radius, typography } from "@/theme/index";
import { useRidesStore } from "@/store/rides";
import useChainlyStore from "@/store/chainlyStore";

function todayYmd() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseYmdToIso(ymd) {
  const s = String(ymd || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    return null;
  }
  // Use midday local time to avoid timezone edge cases.
  const d = new Date(`${s}T12:00:00`);
  if (!Number.isFinite(d.getTime())) {
    return null;
  }
  return d.toISOString();
}

function isFutureIso(iso) {
  if (!iso) return false;
  const d = new Date(String(iso));
  if (!Number.isFinite(d.getTime())) return false;

  const now = new Date();

  const dDay = new Date(d);
  dDay.setHours(0, 0, 0, 0);

  const nDay = new Date(now);
  nDay.setHours(0, 0, 0, 0);

  return dDay.getTime() > nDay.getTime();
}

function safeNumOrNull(v) {
  if (v == null) return null;
  const s = String(v).trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function labelTerrain(t) {
  if (t === "road") return "Road";
  if (t === "gravel") return "Gravel";
  if (t === "trail_flow") return "Trail (Flow)";
  if (t === "trail_technical") return "Trail (Tech)";
  if (t === "bike_park_dh") return "Bike Park / DH";
  return t;
}

function labelIntensity(i) {
  if (i === "easy") return "Easy";
  if (i === "moderate") return "Moderate";
  if (i === "hard") return "Hard";
  if (i === "race_all_out") return "Race / All-Out";
  return i;
}

export default function AddManualRideScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();

  const bikes = useChainlyStore((s) => s.bikes);

  const initialBikeId = useMemo(() => {
    if (!params?.bikeId) return null;
    return String(params.bikeId);
  }, [params?.bikeId]);

  const [bikeId, setBikeId] = useState(initialBikeId);
  const [rideDate, setRideDate] = useState(todayYmd());
  const [durationMinutes, setDurationMinutes] = useState("");
  const [distanceKm, setDistanceKm] = useState("");
  const [elevationGainM, setElevationGainM] = useState("");
  const [terrainType, setTerrainType] = useState(null);
  const [intensityLevel, setIntensityLevel] = useState(null);
  const [notes, setNotes] = useState("");
  const [showIntensityInfo, setShowIntensityInfo] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const isoRideAt = useMemo(() => parseYmdToIso(rideDate), [rideDate]);

  const durationNum = useMemo(
    () => safeNumOrNull(durationMinutes),
    [durationMinutes],
  );

  const distanceNum = useMemo(() => safeNumOrNull(distanceKm), [distanceKm]);
  const elevationNum = useMemo(
    () => safeNumOrNull(elevationGainM),
    [elevationGainM],
  );

  const rideDateInFuture = useMemo(() => isFutureIso(isoRideAt), [isoRideAt]);

  const durationInvalid = useMemo(() => {
    if (durationNum == null) return true;
    return !(durationNum > 0);
  }, [durationNum]);

  const distanceInvalid = useMemo(() => {
    // Distance is REQUIRED
    if (distanceNum == null) return true;
    return distanceNum < 0;
  }, [distanceNum]);

  const elevationInvalid = useMemo(() => {
    if (elevationNum == null) return false;
    return elevationNum < 0;
  }, [elevationNum]);

  const formValid = useMemo(() => {
    if (!bikeId) return false;
    if (!isoRideAt) return false;
    if (rideDateInFuture) return false;
    if (durationInvalid) return false;
    if (!terrainType) return false;
    if (!intensityLevel) return false;
    if (distanceInvalid) return false;
    if (elevationInvalid) return false;
    return true;
  }, [
    bikeId,
    distanceInvalid,
    durationInvalid,
    elevationInvalid,
    intensityLevel,
    isoRideAt,
    rideDateInFuture,
    terrainType,
  ]);

  const onBack = useCallback(() => {
    router.back();
  }, [router]);

  const terrainOptions = useMemo(
    () => ["road", "gravel", "trail_flow", "trail_technical", "bike_park_dh"],
    [],
  );

  const intensityOptions = useMemo(
    () => ["easy", "moderate", "hard", "race_all_out"],
    [],
  );

  const saveLabel = saving ? "Saving…" : "Save Ride";

  const onSave = useCallback(async () => {
    if (saving) return;

    setError(null);

    if (!bikeId) {
      setError("Pick a bike first.");
      return;
    }

    if (!isoRideAt) {
      setError("Enter a date like 2026-01-11.");
      return;
    }

    if (rideDateInFuture) {
      setError("Ride date can’t be in the future.");
      return;
    }

    if (durationInvalid) {
      setError("Duration must be more than 0 minutes.");
      return;
    }

    if (!terrainType) {
      setError("Pick a terrain type.");
      return;
    }

    if (!intensityLevel) {
      setError("Pick an intensity level.");
      return;
    }

    if (distanceNum == null) {
      setError("Distance is required.");
      return;
    }

    if (distanceInvalid) {
      setError("Distance must be 0 or more.");
      return;
    }

    if (elevationInvalid) {
      setError("Elevation gain must be 0 or more.");
      return;
    }

    const normalized = {
      bikeId: String(bikeId),
      source: "manual",
      rideDate: String(isoRideAt),
      durationMinutes: Number(durationNum),
      distanceKm: Number(distanceNum),
      elevationGainM: elevationNum == null ? null : Number(elevationNum),
      terrainType: String(terrainType),
      intensityLevel: String(intensityLevel),
      notes: notes?.trim() ? notes.trim().slice(0, 300) : null,
    };

    try {
      setSaving(true);

      // Call saveManualRide directly from store instead of using a selector
      await useRidesStore.getState().saveManualRide({
        bikeId: normalized.bikeId,
        rideDate: normalized.rideDate,
        durationMinutes: normalized.durationMinutes,
        distanceKm: normalized.distanceKm,
        elevationGainM: normalized.elevationGainM,
        terrainType: normalized.terrainType,
        intensityLevel: normalized.intensityLevel,
        notes: normalized.notes,
      });

      Alert.alert("Saved", "Ride added — Bike health updated");
      router.back();
    } catch (e) {
      console.error(e);
      Alert.alert("Couldn’t save ride", "Try again.");
    } finally {
      setSaving(false);
    }
  }, [
    bikeId,
    distanceInvalid,
    distanceNum,
    durationInvalid,
    durationNum,
    elevationInvalid,
    elevationNum,
    intensityLevel,
    isoRideAt,
    notes,
    rideDateInFuture,
    router,
    saving,
    terrainType,
  ]);

  const headerSubtitle = useMemo(() => {
    if (bikeId) {
      const b = (bikes || []).find((x) => String(x?.id) === String(bikeId));
      if (b?.name) return `For ${b.name}`;
    }
    return "Log a ride manually.";
  }, [bikeId, bikes]);

  const bikePickerTitle = useMemo(() => {
    return bikeId ? "Bike" : "Pick a bike";
  }, [bikeId]);

  const bikePickerSub = useMemo(() => {
    if (!bikeId) return "Required";
    return "Tap to change";
  }, [bikeId]);

  const offlineFootnote = null;

  return (
    <KeyboardAvoidingAnimatedView style={styles.container} behavior="padding">
      <StatusBar style="dark" />

      <View style={{ paddingTop: insets.top }}>
        <ScreenHeader title="Add Ride Manually" showBack onBack={onBack} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: spacing.xl,
          paddingTop: spacing.sm,
          paddingBottom: 140,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Add Ride Manually</Text>
        <Text style={styles.subtitle}>{headerSubtitle}</Text>

        <View style={{ height: spacing.lg }} />

        <AppCard style={styles.card} pressable={false}>
          <View style={styles.cardTop}>
            <View style={styles.cardIcon}>
              <Bike size={18} color={colors.primary} strokeWidth={2.5} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{bikePickerTitle}</Text>
              <Text style={styles.cardSub}>{bikePickerSub}</Text>
            </View>
          </View>

          <View style={{ height: spacing.md }} />

          {(bikes || []).length ? (
            <View style={styles.bikeList}>
              {(bikes || []).map((b) => {
                const isSelected = String(b?.id) === String(bikeId);
                const tone = isSelected ? "orange" : "neutral";
                const label = b?.name ? String(b.name) : "Bike";

                return (
                  <Pressable
                    key={String(b.id)}
                    onPress={() => setBikeId(String(b.id))}
                    hitSlop={6}
                  >
                    <View
                      style={[
                        styles.bikeRow,
                        isSelected ? styles.bikeRowSelected : null,
                      ]}
                    >
                      <Text style={styles.bikeName}>{label}</Text>
                      <Chip
                        label={isSelected ? "Selected" : "Pick"}
                        selected
                        tone={tone}
                      />
                    </View>
                  </Pressable>
                );
              })}
            </View>
          ) : (
            <Text style={styles.helperText}>
              No bikes yet. Add a bike in your Garage first.
            </Text>
          )}
        </AppCard>

        <View style={{ height: spacing.lg }} />

        <AppCard style={styles.card} pressable={false}>
          <Text style={styles.inputLabel}>Ride date (YYYY-MM-DD)</Text>
          <TextInput
            value={rideDate}
            onChangeText={setRideDate}
            placeholder={todayYmd()}
            placeholderTextColor={colors.textTertiary}
            autoCapitalize="none"
            style={styles.input}
          />

          <View style={{ height: spacing.md }} />

          <Text style={styles.inputLabel}>Duration (minutes)</Text>
          <TextInput
            value={durationMinutes}
            onChangeText={setDurationMinutes}
            placeholder="e.g. 75"
            placeholderTextColor={colors.textTertiary}
            keyboardType="number-pad"
            style={styles.input}
          />

          <View style={{ height: spacing.md }} />

          <Text style={styles.inputLabel}>Terrain</Text>
          <View style={styles.chipWrap}>
            {terrainOptions.map((t) => {
              const selected = t === terrainType;
              const tone = selected ? "orange" : "neutral";
              const label = labelTerrain(t);
              return (
                <Chip
                  key={t}
                  label={label}
                  selected={selected}
                  tone={tone}
                  onPress={() => setTerrainType(t)}
                />
              );
            })}
          </View>

          <View style={{ height: spacing.md }} />

          <View style={styles.labelRow}>
            <Text style={styles.inputLabel}>Intensity</Text>
            <Pressable
              onPress={() => setShowIntensityInfo(true)}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Ride intensity explained"
              style={styles.infoBtn}
            >
              <Info size={16} color={colors.textSecondary} strokeWidth={2.5} />
            </Pressable>
          </View>

          <View style={styles.chipWrap}>
            {intensityOptions.map((i) => {
              const selected = i === intensityLevel;
              const tone = selected ? "orange" : "neutral";
              const label = labelIntensity(i);
              return (
                <Chip
                  key={i}
                  label={label}
                  selected={selected}
                  tone={tone}
                  onPress={() => setIntensityLevel(i)}
                />
              );
            })}
          </View>

          <View style={{ height: spacing.md }} />

          <Text style={styles.inputLabel}>Distance (km)</Text>
          <TextInput
            value={distanceKm}
            onChangeText={setDistanceKm}
            placeholder="e.g. 18.4"
            placeholderTextColor={colors.textTertiary}
            keyboardType="decimal-pad"
            style={styles.input}
          />

          <View style={{ height: spacing.md }} />

          <Text style={styles.inputLabel}>Elevation gain (m) — optional</Text>
          <TextInput
            value={elevationGainM}
            onChangeText={setElevationGainM}
            placeholder="e.g. 650"
            placeholderTextColor={colors.textTertiary}
            keyboardType="decimal-pad"
            style={styles.input}
          />

          <View style={{ height: spacing.md }} />

          <Text style={styles.inputLabel}>Notes — optional</Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Notes to remember?"
            placeholderTextColor={colors.textTertiary}
            multiline
            style={[styles.input, styles.textArea]}
          />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </AppCard>
      </ScrollView>

      <StickyCTA
        primaryTitle={saveLabel}
        onPrimary={onSave}
        primaryDisabled={!formValid}
        primaryLoading={saving}
        secondaryTitle="Cancel"
        onSecondary={onBack}
        footnote={offlineFootnote}
        variant="warm"
      />

      {/* Intensity Info Modal */}
      <Modal
        visible={showIntensityInfo}
        transparent
        animationType="fade"
        onRequestClose={() => setShowIntensityInfo(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowIntensityInfo(false)}
        >
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Ride intensity explained</Text>
              <Pressable
                onPress={() => setShowIntensityInfo(false)}
                hitSlop={10}
                style={styles.modalClose}
              >
                <X size={18} color={colors.textSecondary} strokeWidth={2.75} />
              </Pressable>
            </View>

            <Text style={styles.modalLine}>
              • Easy (Recovery): relaxed pace, minimal pushing;
              beginner-friendly; bike stress is low.
            </Text>
            <Text style={styles.modalLine}>
              • Moderate (Training): steady effort; you’re pushing a bit; normal
              trail wear.
            </Text>
            <Text style={styles.modalLine}>
              • Hard (Aggressive): high effort; faster descents, harder braking;
              more wear on tires/brakes/suspension.
            </Text>
            <Text style={styles.modalLine}>
              • Race / All-Out: maximum pushing; repeated hard impacts/braking;
              highest wear; log if you want accurate service history.
            </Text>
          </Pressable>
        </Pressable>
      </Modal>
    </KeyboardAvoidingAnimatedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  title: {
    fontSize: 30,
    lineHeight: 32,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    letterSpacing: -0.6,
  },
  subtitle: {
    marginTop: 6,
    fontSize: typography.base,
    lineHeight: 20,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },

  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  cardIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.round,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primarySoft2,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    fontSize: 16,
    lineHeight: 18,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  cardSub: {
    marginTop: 2,
    fontSize: 12,
    lineHeight: 14,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textSecondary,
  },

  bikeList: {
    gap: spacing.sm,
  },
  bikeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    backgroundColor: colors.surfaceWarm,
  },
  bikeRowSelected: {
    borderColor: colors.primarySoft2,
    backgroundColor: colors.primarySoft,
  },
  bikeName: {
    flex: 1,
    paddingRight: spacing.md,
    fontSize: typography.base,
    lineHeight: 18,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textPrimary,
  },

  inputLabel: {
    fontSize: 12,
    lineHeight: 14,
    fontFamily: typography.fontFamily.black,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  input: {
    minHeight: 46,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceWarm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.base,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textPrimary,
  },
  textArea: {
    minHeight: 90,
    textAlignVertical: "top",
    paddingTop: spacing.md,
  },

  chipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },

  helperText: {
    fontSize: typography.base,
    lineHeight: 18,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },

  errorText: {
    marginTop: spacing.md,
    fontSize: typography.sm,
    lineHeight: 16,
    fontFamily: typography.fontFamily.semibold,
    color: colors.danger,
  },

  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  infoBtn: {
    width: 28,
    height: 28,
    borderRadius: radius.round,
    backgroundColor: colors.surfaceWarm,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    padding: spacing.lg,
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
  },
  modalHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  modalTitle: {
    flex: 1,
    fontSize: 18,
    lineHeight: 20,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  modalClose: {
    width: 34,
    height: 34,
    borderRadius: radius.round,
    backgroundColor: colors.surfaceWarm,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: spacing.md,
  },
  modalLine: {
    marginTop: spacing.sm,
    fontSize: typography.base,
    lineHeight: 19,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
});
