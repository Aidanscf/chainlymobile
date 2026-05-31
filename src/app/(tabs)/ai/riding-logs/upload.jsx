import { useState } from "react";
import { View, Text, TouchableOpacity, Image, Alert } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { ArrowLeft, Upload, Image as ImageIcon } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import useUpload from "@/utils/useUpload";
import { colors, spacing, radius, typography } from "@/theme/index";

export default function UploadScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { type } = useLocalSearchParams();
  const [upload, { loading: uploading }] = useUpload();

  const [imageUri, setImageUri] = useState(null);
  const [uploadedUrl, setUploadedUrl] = useState(null);

  const pickImage = async (source) => {
    try {
      let result;

      // Remove camera handling, only keep library
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];

        if (!asset?.uri) {
          Alert.alert("Error", "Couldn't read image. Try again.");
          return;
        }

        setImageUri(asset.uri);

        // Upload with the actual asset object (not a custom constructed object)
        const uploadResult = await upload({
          reactNativeAsset: asset,
        });

        if (uploadResult?.url) {
          setUploadedUrl(uploadResult.url);
        } else if (uploadResult?.error) {
          Alert.alert("Upload failed", uploadResult.error);
        }
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to select image");
    }
  };

  const handleContinue = () => {
    if (uploadedUrl) {
      router.push({
        pathname: "/(tabs)/ai/riding-logs/reference-points",
        params: { type, imageUrl: uploadedUrl },
      });
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style="dark" />

      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + 16,
          paddingHorizontal: spacing.xl,
          paddingBottom: spacing.lg,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: spacing.md,
          }}
        >
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft size={24} color={colors.textPrimary} strokeWidth={2.5} />
          </TouchableOpacity>
          <Text
            style={{
              fontSize: typography.xl,
              fontFamily: typography.fontFamily.bold,
              color: colors.textPrimary,
              textTransform: "capitalize",
            }}
          >
            {type} Photo
          </Text>
        </View>
      </View>

      <View style={{ flex: 1, paddingHorizontal: spacing.xl }}>
        <Text
          style={{
            fontSize: typography.xxxl,
            fontFamily: typography.fontFamily.black,
            color: colors.textPrimary,
            marginBottom: spacing.md,
            letterSpacing: -0.5,
          }}
        >
          Upload a photo
        </Text>
        <Text
          style={{
            fontSize: typography.base,
            color: colors.textSecondary,
            marginBottom: spacing.xxxl,
          }}
        >
          For best results, use a side-angle shot showing the full {type}
        </Text>

        {/* Image Preview */}
        {imageUri ? (
          <View style={{ marginBottom: spacing.xxl }}>
            <Image
              source={{ uri: imageUri }}
              style={{ width: "100%", height: 300, borderRadius: radius.xl }}
              resizeMode="cover"
            />
            {uploading && (
              <View
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: "rgba(0,0,0,0.7)",
                  borderRadius: radius.xl,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text
                  style={{
                    color: colors.surface,
                    fontSize: typography.lg,
                    fontFamily: typography.fontFamily.semibold,
                  }}
                >
                  Uploading...
                </Text>
              </View>
            )}
          </View>
        ) : (
          <View
            style={{
              backgroundColor: colors.surfaceWarm,
              borderRadius: radius.xl,
              padding: 40,
              alignItems: "center",
              marginBottom: spacing.xxl,
              borderWidth: 2,
              borderColor: colors.border,
              borderStyle: "dashed",
            }}
          >
            <Upload size={48} color={colors.textTertiary} />
            <Text
              style={{
                fontSize: typography.base,
                color: colors.textSecondary,
                marginTop: spacing.lg,
                textAlign: "center",
              }}
            >
              No photo selected
            </Text>
          </View>
        )}

        {/* Action Buttons */}
        <TouchableOpacity
          onPress={() => pickImage("library")}
          disabled={uploading}
          style={{
            backgroundColor: colors.surface,
            borderRadius: radius.xl,
            paddingVertical: spacing.lg,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: spacing.md,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <ImageIcon size={22} color={colors.textPrimary} strokeWidth={2.5} />
          <Text
            style={{
              fontSize: typography.lg,
              fontFamily: typography.fontFamily.semibold,
              color: colors.textPrimary,
            }}
          >
            Choose from Library
          </Text>
        </TouchableOpacity>
      </View>

      {/* Continue Button */}
      <View
        style={{
          padding: spacing.xl,
          paddingBottom: insets.bottom + spacing.xl,
        }}
      >
        <TouchableOpacity
          onPress={handleContinue}
          disabled={!uploadedUrl || uploading}
          style={{
            backgroundColor:
              uploadedUrl && !uploading ? colors.primary : colors.border,
            borderRadius: radius.round,
            paddingVertical: spacing.lg,
            alignItems: "center",
          }}
        >
          <Text
            style={{
              fontSize: typography.lg,
              fontFamily: typography.fontFamily.bold,
              color:
                uploadedUrl && !uploading
                  ? colors.surface
                  : colors.textTertiary,
            }}
          >
            {uploading ? "Uploading..." : "Continue"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
