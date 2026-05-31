import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import { Camera } from "lucide-react-native";

import AppCard from "@/components/AppCard";
import AppButton from "@/components/AppButton";
import { colors, spacing, radius, typography } from "@/theme/index";
import { useChainlyStore } from "@/store/chainlyStore";
import ScreenHeader from "@/components/layout/ScreenHeader";
import useUpload from "@/utils/useUpload";

export default function PhotoMechanicUploadScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const current = useChainlyStore((s) => s.currentDiagnosis);
  const analyzeLoading = useChainlyStore((s) => s.diagnosisLoading);
  const analyze = useChainlyStore((s) => s.analyzeDiagnosisFromImage);

  const [upload, { loading: uploadLoading }] = useUpload();

  const [imageUri, setImageUri] = useState(current?.imageUri || null);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [error, setError] = useState(null);

  const hasImage = Boolean(imageUri);

  const pickFromLibrary = useCallback(async () => {
    setError(null);
    try {
      Haptics.selectionAsync();

      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (perm.status !== "granted") {
        setError("Give me photo access and I’ll do the magic ✨");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
      });

      if (result.canceled) {
        return;
      }

      const asset = result.assets?.[0];
      if (!asset?.uri) {
        throw new Error("No image selected");
      }

      setSelectedAsset(asset);
      setImageUri(asset.uri);
    } catch (e) {
      console.error(e);
      setError("Couldn’t open your library. Try again.");
    }
  }, []);

  const takePhoto = useCallback(async () => {
    setError(null);
    try {
      Haptics.selectionAsync();

      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (perm.status !== "granted") {
        setError("Give me camera access and I’ll spot the issue 👀");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        quality: 1,
      });

      if (result.canceled) {
        return;
      }

      const asset = result.assets?.[0];
      if (!asset?.uri) {
        throw new Error("No photo captured");
      }

      setSelectedAsset(asset);
      setImageUri(asset.uri);
    } catch (e) {
      console.error(e);
      setError("Couldn’t open the camera. Check permissions.");
    }
  }, []);

  const isRemoteUrl = useCallback((uri) => {
    const u = String(uri || "");
    return u.startsWith("http://") || u.startsWith("https://");
  }, []);

  const onAnalyze = useCallback(async () => {
    if (!imageUri) {
      return;
    }
    setError(null);

    try {
      // For real OpenAI vision on the backend, we need a publicly reachable URL.
      // If the user picked a local image, upload it first.
      let urlForAI = imageUri;

      if (!isRemoteUrl(imageUri) && selectedAsset) {
        const { url, error: uploadError } = await upload({
          reactNativeAsset: selectedAsset,
        });
        if (uploadError) {
          setError("Upload failed. Try again.");
          return;
        }
        if (url) {
          urlForAI = url;
        }
      }

      await analyze({ imageUri: urlForAI });
      router.push("/ai/photo-mechanic/context");
    } catch (e) {
      console.error(e);
      setError("I couldn’t scan that photo. Try a clearer shot.");
    }
  }, [analyze, imageUri, isRemoteUrl, router, selectedAsset, upload]);

  const headerTitle = useMemo(() => {
    if (analyzeLoading || uploadLoading) {
      return "Scanning";
    }
    return "Upload";
  }, [analyzeLoading, uploadLoading]);

  const primaryCtaTitle = useMemo(() => {
    if (uploadLoading) {
      return "Uploading…";
    }
    if (analyzeLoading) {
      return "Scanning your setup…";
    }
    return "Analyze Photo";
  }, [analyzeLoading, uploadLoading]);

  const primaryCtaLoading = analyzeLoading || uploadLoading;

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <ScreenHeader title={headerTitle} showBack />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: insets.bottom + 28 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Upload a bike photo</Text>
        <Text style={styles.subtitle}>
          A clean shot of the problem area works best (brakes, chain, tire,
          etc.).
        </Text>

        <AppCard style={styles.dropzoneCard}>
          {hasImage ? (
            <View style={styles.previewWrap}>
              <Image
                source={imageUri}
                style={styles.preview}
                contentFit="cover"
                transition={150}
              />
            </View>
          ) : (
            <View style={styles.placeholder}>
              <View style={styles.placeholderIcon}>
                <Camera size={22} color={colors.primary} strokeWidth={2.5} />
              </View>
              <Text style={styles.placeholderTitle}>Drop a photo here</Text>
              <Text style={styles.placeholderSub}>
                (Okay fine… tap a button. I’m not judging.)
              </Text>
            </View>
          )}

          <View style={styles.buttonRow}>
            <View style={{ flex: 1 }}>
              <AppButton title="Take Photo" onPress={takePhoto} />
            </View>
            <View style={{ flex: 1 }}>
              <AppButton
                title="Choose from Library"
                onPress={pickFromLibrary}
                variant="secondary"
              />
            </View>
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </AppCard>

        <View style={{ height: spacing.lg }} />

        <AppButton
          title={primaryCtaTitle}
          onPress={onAnalyze}
          loading={primaryCtaLoading}
          disabled={!hasImage || primaryCtaLoading}
        />

        {primaryCtaLoading ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.loadingText}>Scanning your setup…</Text>
            <Text style={styles.loadingSub}>
              Looking for the loudest clue (and the easiest win).
            </Text>
          </View>
        ) : null}
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

  dropzoneCard: {
    backgroundColor: colors.surfaceWarm,
    borderColor: colors.border,
  },
  previewWrap: {
    height: 260,
    borderRadius: radius.xl,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  preview: {
    width: "100%",
    height: "100%",
  },
  placeholder: {
    height: 260,
    borderRadius: radius.xl,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: colors.primarySoft2,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
  },
  placeholderIcon: {
    width: 54,
    height: 54,
    borderRadius: radius.round,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primarySoft2,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  placeholderTitle: {
    fontSize: 18,
    lineHeight: 20,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  placeholderSub: {
    marginTop: 6,
    fontSize: typography.base,
    lineHeight: 19,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    textAlign: "center",
  },

  buttonRow: {
    marginTop: spacing.lg,
    flexDirection: "row",
    gap: spacing.md,
  },

  errorText: {
    marginTop: spacing.md,
    fontSize: typography.sm,
    fontFamily: typography.fontFamily.semibold,
    color: colors.danger,
  },

  loadingCard: {
    marginTop: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
    alignItems: "center",
  },
  loadingText: {
    marginTop: spacing.sm,
    fontSize: 16,
    lineHeight: 18,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
  },
  loadingSub: {
    marginTop: 6,
    fontSize: typography.base,
    lineHeight: 19,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    textAlign: "center",
  },
});
