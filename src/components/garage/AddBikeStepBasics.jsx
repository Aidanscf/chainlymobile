import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Alert,
  Switch,
} from "react-native";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";

import AppCard from "@/components/AppCard";
import AppButton from "@/components/AppButton";
import Chip from "@/components/Chip";
import { ChevronDown, ChevronRight } from "lucide-react-native";
import useUpload from "@/utils/useUpload";
import { colors, spacing, radius, typography } from "@/theme/index";

const BIKE_TYPES = ["Trail", "Enduro", "XC", "DH", "Gravel / Road"];

function FieldError({ text }) {
  if (!text) return null;
  return <Text style={styles.errorText}>{text}</Text>;
}

function LabeledInput({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  error,
}) {
  return (
    <View style={{ marginTop: spacing.lg }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textTertiary}
        style={[styles.input, error ? styles.inputError : null]}
        autoCorrect={false}
        keyboardType={keyboardType}
      />
      <FieldError text={error} />
    </View>
  );
}

function derivePurchaseYear(ymd) {
  const s = String(ymd || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const y = Number(s.slice(0, 4));
  return Number.isFinite(y) ? y : null;
}

export default function StepBasics({ draft, setDraft, fieldErrors }) {
  const [upload, { loading }] = useUpload();
  const [localPicking, setLocalPicking] = useState(false);
  const [showMoreDetails, setShowMoreDetails] = useState(false);

  const imageUrl = draft?.image_url || null;

  const setField = useCallback(
    (key, value) => {
      setDraft((d) => ({ ...d, [key]: value }));
    },
    [setDraft],
  );

  const pickFromLibrary = useCallback(async () => {
    try {
      setLocalPicking(true);
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permission.status !== "granted") {
        Alert.alert(
          "Permission needed",
          "Allow photo access to pick a bike photo.",
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.9,
      });

      if (result.canceled) return;

      const asset = result.assets?.[0];
      if (!asset) return;

      const up = await upload({ reactNativeAsset: asset });
      if (up?.error) {
        Alert.alert("Upload failed", up.error);
        return;
      }
      setField("image_url", up.url);
    } catch (e) {
      console.error(e);
      Alert.alert("Couldn’t pick photo", "Try again in a sec.");
    } finally {
      setLocalPicking(false);
    }
  }, [setField, upload]);

  const takePhoto = useCallback(async () => {
    try {
      setLocalPicking(true);
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (permission.status !== "granted") {
        Alert.alert(
          "Permission needed",
          "Allow camera access to take a bike photo.",
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.9,
      });

      if (result.canceled) return;

      const asset = result.assets?.[0];
      if (!asset) return;

      const up = await upload({ reactNativeAsset: asset });
      if (up?.error) {
        Alert.alert("Upload failed", up.error);
        return;
      }
      setField("image_url", up.url);
    } catch (e) {
      console.error(e);
      Alert.alert("Couldn’t take photo", "Try again in a sec.");
    } finally {
      setLocalPicking(false);
    }
  }, [setField, upload]);

  const busy = loading || localPicking;

  const typeValue = draft?.bike_type || "Trail";

  const typesRow = useMemo(() => {
    return BIKE_TYPES.map((t) => (
      <Chip
        key={t}
        label={t}
        tone="orange"
        selected={typeValue === t}
        onPress={() => setField("bike_type", t)}
        style={{ marginRight: spacing.sm, marginBottom: spacing.sm }}
      />
    ));
  }, [setField, typeValue]);

  const purchaseYear = useMemo(() => {
    return derivePurchaseYear(draft?.purchase_date);
  }, [draft?.purchase_date]);

  const purchaseDate = String(draft?.purchase_date || "").trim();

  return (
    <View>
      <AppCard style={styles.card}>
        <Text style={styles.cardTitle}>Name your ride</Text>
        <Text style={styles.cardSub}>
          This is what you’ll see in Garage, AI tools, and maintenance quests.
        </Text>

        <LabeledInput
          label="Bike name*"
          value={draft?.name}
          onChangeText={(t) => setField("name", t)}
          placeholder="e.g. Trailblazer Pro"
          error={fieldErrors?.name}
        />

        <View style={{ marginTop: spacing.xl }}>
          <Text style={styles.label}>Bike type</Text>
          <View style={styles.chipsWrap}>{typesRow}</View>
        </View>

        <LabeledInput
          label="Brand (optional)"
          value={draft?.brand}
          onChangeText={(t) => setField("brand", t)}
          placeholder="e.g. Santa Cruz"
          error={null}
        />

        <LabeledInput
          label="Model (optional)"
          value={draft?.model}
          onChangeText={(t) => setField("model", t)}
          placeholder="e.g. Hightower"
          error={null}
        />

        <LabeledInput
          label="Year (optional)"
          value={String(draft?.model_year || "")}
          onChangeText={(t) => setField("model_year", t)}
          placeholder="e.g. 2024"
          keyboardType="number-pad"
          error={fieldErrors?.model_year}
        />

        {/* NEW: More details (collapsed by default) */}
        <View style={{ marginTop: spacing.xl }}>
          <Pressable
            onPress={() => setShowMoreDetails((v) => !v)}
            hitSlop={10}
            style={styles.moreHeader}
          >
            <Text style={styles.moreTitle}>More details</Text>
            {showMoreDetails ? (
              <ChevronDown size={18} color={colors.textTertiary} />
            ) : (
              <ChevronRight size={18} color={colors.textTertiary} />
            )}
          </Pressable>

          {showMoreDetails ? (
            <View style={{ marginTop: spacing.sm }}>
              <LabeledInput
                label="Purchase date (optional)"
                value={String(draft?.purchase_date || "")}
                onChangeText={(t) => setField("purchase_date", t)}
                placeholder="YYYY-MM-DD"
                error={null}
              />

              <LabeledInput
                label="Serial number / ID (optional)"
                value={String(draft?.serial_number || "")}
                onChangeText={(t) => setField("serial_number", t)}
                placeholder="e.g. ABC123"
                error={null}
              />

              {purchaseYear ? (
                <Text style={styles.moreHint}>
                  Purchase year: {purchaseYear}
                </Text>
              ) : (
                <Text style={styles.moreHint}>
                  Tip: add a purchase date to help with install history.
                </Text>
              )}

              <View style={styles.metaRow}>
                <View style={{ flex: 1, paddingRight: spacing.md }}>
                  <Text style={styles.metaLabel}>Came with bike</Text>
                  <Text style={styles.metaSub}>
                    Auto-fills install dates when you log parts.
                  </Text>
                </View>
                <Switch
                  value={!!draft?.components_came_with_bike}
                  onValueChange={(next) => {
                    const came = Boolean(next);
                    const installed = String(
                      draft?.components_installed_at || "",
                    ).trim();
                    const hasPurchase = /^\d{4}-\d{2}-\d{2}$/.test(
                      purchaseDate,
                    );

                    setField("components_came_with_bike", came);

                    if (came && !installed && hasPurchase) {
                      setField("components_installed_at", purchaseDate);
                    }
                  }}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor={colors.surface}
                />
              </View>

              <LabeledInput
                label="Installed at (optional)"
                value={String(draft?.components_installed_at || "")}
                onChangeText={(t) => setField("components_installed_at", t)}
                placeholder="YYYY-MM-DD"
                error={null}
              />
            </View>
          ) : null}
        </View>
      </AppCard>

      <AppCard style={[styles.card, { marginTop: spacing.lg }]}>
        <Text style={styles.cardTitle}>Bike photo</Text>
        <Text style={styles.cardSub}>
          Optional, but it makes your Garage feel real.
        </Text>

        <View style={styles.imageRow}>
          <View style={styles.imagePreview}>
            {imageUrl ? (
              <Image
                source={imageUrl}
                style={styles.image}
                contentFit="cover"
                transition={150}
              />
            ) : (
              <View style={styles.imageEmpty}>
                <Text style={styles.imageEmptyText}>No photo yet</Text>
              </View>
            )}
          </View>

          <View style={{ flex: 1, gap: spacing.sm }}>
            <AppButton
              title={busy ? "Uploading…" : "Choose from Photos"}
              variant="secondary"
              onPress={pickFromLibrary}
              disabled={busy}
            />
            <AppButton
              title={busy ? "Uploading…" : "Take Photo"}
              variant="secondary"
              onPress={takePhoto}
              disabled={busy}
            />

            {imageUrl ? (
              <Pressable
                onPress={() => setField("image_url", null)}
                hitSlop={10}
                style={styles.removePhotoBtn}
              >
                <Text style={styles.removePhotoText}>Remove photo</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      </AppCard>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.borderLight,
    padding: spacing.xl,
  },
  cardTitle: {
    fontSize: 18,
    lineHeight: 20,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  cardSub: {
    marginTop: 6,
    fontSize: typography.base,
    lineHeight: 19,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
  label: {
    fontSize: typography.xs,
    fontFamily: typography.fontFamily.black,
    color: colors.textSecondary,
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
  input: {
    marginTop: 8,
    backgroundColor: colors.surfaceWarm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    fontSize: typography.base,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textPrimary,
  },
  inputError: {
    borderColor: colors.danger,
  },
  errorText: {
    marginTop: 6,
    fontSize: typography.sm,
    fontFamily: typography.fontFamily.semibold,
    color: colors.danger,
  },
  chipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: spacing.sm,
  },
  imageRow: {
    flexDirection: "row",
    gap: spacing.lg,
    marginTop: spacing.lg,
    alignItems: "flex-start",
  },
  imagePreview: {
    width: 104,
    height: 104,
    borderRadius: radius.xl,
    backgroundColor: colors.surfaceWarm,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imageEmpty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.sm,
  },
  imageEmptyText: {
    fontSize: typography.sm,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textTertiary,
    textAlign: "center",
  },
  removePhotoBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  removePhotoText: {
    fontSize: typography.sm,
    fontFamily: typography.fontFamily.black,
    color: colors.danger,
  },
  moreHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surfaceWarm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
  },
  moreTitle: {
    fontSize: typography.sm,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
  },
  moreHint: {
    marginTop: spacing.sm,
    fontSize: typography.sm,
    lineHeight: 17,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textSecondary,
  },
  metaRow: {
    marginTop: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surfaceWarm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
  },
  metaLabel: {
    fontSize: typography.sm,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
  },
  metaSub: {
    marginTop: 4,
    fontSize: typography.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
});
