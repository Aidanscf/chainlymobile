import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  Pressable,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import { useVideoPlayer, VideoView } from "expo-video";
import * as Haptics from "expo-haptics";
import { Video, Camera, Sparkles } from "lucide-react-native";

import AppCard from "@/components/AppCard";
import AppButton from "@/components/AppButton";
import { colors, spacing, radius, typography } from "@/theme/index";
import { useMediaAnalyzerStore } from "@/store/mediaAnalyzer";
import ScreenHeader from "@/components/layout/ScreenHeader";

const SAMPLE_VIDEO =
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";

export default function AIMediaAnalyzerUploadScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const setDraft = useMediaAnalyzerStore((s) => s.setDraft);
  const clearDraft = useMediaAnalyzerStore((s) => s.clearDraft);

  const [error, setError] = useState(null);
  const [media, setMedia] = useState(null);

  const isVideo = media?.mediaType === "video";

  // Avoid passing null into the video hook (some runtimes expect a string source).
  // We only render the VideoView when isVideo is true.
  const videoSource = isVideo ? media?.uri : SAMPLE_VIDEO;
  const player = useVideoPlayer(videoSource, (p) => {
    if (!p) {
      return;
    }
    p.loop = true;
  });

  const onBackToAIHub = useCallback(async () => {
    try {
      if (Platform.OS !== "web") {
        await Haptics.selectionAsync();
      }
    } catch (e) {
      console.error(e);
    }
    router.replace("/ai");
  }, [router]);

  const ensureCameraPerms = useCallback(async () => {
    const cam = await ImagePicker.requestCameraPermissionsAsync();
    if (!cam.granted) {
      throw new Error("Camera permission is required to record a clip");
    }
  }, []);

  const ensureLibraryPerms = useCallback(async () => {
    const lib = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!lib.granted) {
      throw new Error("Photo library permission is required to choose media");
    }
  }, []);

  const chooseVideo = useCallback(async () => {
    setError(null);
    try {
      await ensureLibraryPerms();

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        quality: 1,
      });

      if (result.canceled) {
        return;
      }

      const asset = result.assets?.[0];
      if (!asset?.uri) {
        throw new Error("No video selected");
      }

      setMedia({
        uri: asset.uri,
        mediaType: "video",
        fileSize: asset.fileSize ?? null,
        duration: asset.duration ?? null,
      });
    } catch (e) {
      console.error(e);
      setError(String(e?.message || "Could not choose video"));
    }
  }, [ensureLibraryPerms]);

  const useSample = useCallback(async () => {
    setError(null);
    try {
      if (Platform.OS !== "web") {
        await Haptics.selectionAsync();
      }
    } catch (e) {
      console.error(e);
    }

    setMedia({
      uri: SAMPLE_VIDEO,
      mediaType: "video",
      fileSize: null,
      duration: 8,
      isSample: true,
    });
  }, []);

  const sizeWarning = useMemo(() => {
    const bytes = Number(media?.fileSize);
    if (!Number.isFinite(bytes) || bytes <= 0) {
      return null;
    }
    const mb = bytes / (1024 * 1024);
    if (mb <= 45) {
      return null;
    }
    return `Heads up: this file is ~${mb.toFixed(0)}MB. Upload may take a bit.`;
  }, [media?.fileSize]);

  const onAnalyze = useCallback(async () => {
    setError(null);
    try {
      if (!media?.uri || !media?.mediaType) {
        return;
      }

      clearDraft();
      setDraft({
        mediaUri: media.uri,
        mediaType: media.mediaType,
      });

      if (Platform.OS !== "web") {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      router.push("/ai/media-analyzer/type-confirm");
    } catch (e) {
      console.error(e);
      setError("Could not start analysis");
    }
  }, [clearDraft, media, router, setDraft]);

  const previewTitle = "Video selected";

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <ScreenHeader title="Analyzer Coach" showBack onBack={onBackToAIHub} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Analyzer Coach</Text>
        <Text style={styles.subtitle}>
          Upload a video clip — I'll grade the moment and give you drills.
        </Text>

        <AppCard style={styles.heroCard}>
          <View style={styles.heroBadge}>
            <Sparkles size={18} color={colors.primary} strokeWidth={2.5} />
            <Text style={styles.heroBadgeText}>Video Coaching</Text>
          </View>

          <Text style={styles.heroHelper}>
            Best results: 3–10 seconds, rider in frame, clear landing/turn.
          </Text>

          <View style={{ marginTop: spacing.xl }}>
            <AppButton
              title="Choose Video"
              onPress={chooseVideo}
              variant="primary"
            />
          </View>

          <View style={{ marginTop: spacing.lg }}>
            <AppButton
              title="Use Sample Clip"
              onPress={useSample}
              variant="ghost"
            />
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {sizeWarning ? (
            <View style={styles.warningBox}>
              <Text style={styles.warningText}>{sizeWarning}</Text>
            </View>
          ) : null}

          {media?.uri ? (
            <View style={styles.previewWrap}>
              <View style={styles.previewTopRow}>
                <View style={styles.previewIcon}>
                  <Video size={18} color={colors.primary} strokeWidth={2.5} />
                </View>
                <Text style={styles.previewTitle}>{previewTitle}</Text>
              </View>

              <View style={styles.previewMediaFrame}>
                {isVideo && player ? (
                  <Pressable
                    style={{ flex: 1 }}
                    onPress={() => {
                      try {
                        if (player.playing) {
                          player.pause();
                        } else {
                          player.play();
                        }
                      } catch (e) {
                        console.error(e);
                      }
                    }}
                  >
                    <VideoView
                      style={{ width: "100%", height: "100%" }}
                      player={player}
                      nativeControls
                      allowsFullscreen
                      contentFit="cover"
                    />
                  </Pressable>
                ) : (
                  <View style={styles.videoFallback}>
                    <Camera
                      size={20}
                      color={colors.textSecondary}
                      strokeWidth={2.5}
                    />
                    <Text style={styles.videoFallbackText}>
                      Preview not available
                    </Text>
                  </View>
                )}
              </View>

              <View style={{ marginTop: spacing.xl }}>
                <AppButton title="Analyze" onPress={onAnalyze} />
              </View>
            </View>
          ) : null}
        </AppCard>
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
    fontSize: 36,
    lineHeight: 38,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    letterSpacing: -0.8,
  },
  subtitle: {
    fontSize: 17,
    lineHeight: 23,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    marginBottom: spacing.xxl,
  },

  heroCard: {
    backgroundColor: colors.surfaceWarm,
    borderColor: colors.border,
    paddingVertical: spacing.xxl,
  },
  heroBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.round,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primarySoft2,
    marginBottom: spacing.lg,
  },
  heroBadgeText: {
    fontSize: 15,
    fontFamily: typography.fontFamily.bold,
    color: colors.primary,
  },
  heroHelper: {
    fontSize: 16,
    lineHeight: 22,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },

  errorText: {
    marginTop: spacing.lg,
    fontSize: typography.base,
    fontFamily: typography.fontFamily.semibold,
    color: colors.danger,
  },

  warningBox: {
    marginTop: spacing.lg,
    padding: spacing.lg,
    backgroundColor: colors.warningSoft,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
  },
  warningText: {
    fontSize: typography.base,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textPrimary,
  },

  previewWrap: {
    marginTop: spacing.xxl,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: spacing.xl,
  },
  previewTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  previewIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.round,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primarySoft2,
  },
  previewTitle: {
    fontSize: 18,
    lineHeight: 20,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  previewMediaFrame: {
    height: 280,
    borderRadius: radius.xl,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  videoFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
  },
  videoFallbackText: {
    fontSize: typography.base,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textSecondary,
  },
});
