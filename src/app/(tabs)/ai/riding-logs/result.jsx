import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Alert,
  ScrollView,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { CheckCircle, XCircle, AlertTriangle, Home } from "lucide-react-native";
import useUser from "@/utils/auth/useUser";
import { colors, spacing, radius, typography } from "@/theme/index";

export default function ResultScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    type,
    imageUrl,
    pointA,
    pointB,
    result: resultStr,
  } = useLocalSearchParams();
  const { data: user } = useUser();

  const [saving, setSaving] = useState(false);
  const result = JSON.parse(resultStr);

  const handleSave = async () => {
    // Log was already created and analyzed, just go back to logs
    router.push("/(tabs)/ai/riding-logs");
  };

  const getStatusIcon = () => {
    if (result.status === "measured" && result.confidence >= 0.7) {
      return <CheckCircle size={48} color={colors.success} strokeWidth={2.5} />;
    } else if (result.status === "failed") {
      return <XCircle size={48} color={colors.danger} strokeWidth={2.5} />;
    } else {
      return (
        <AlertTriangle size={48} color={colors.warning} strokeWidth={2.5} />
      );
    }
  };

  const getStatusColor = () => {
    if (result.status === "measured" && result.confidence >= 0.7)
      return colors.success;
    if (result.status === "failed") return colors.danger;
    return colors.warning;
  };

  const getStatusMessage = () => {
    if (result.status === "failed") {
      return "Analysis Failed";
    } else if (result.confidence < 0.7) {
      return "Low Confidence";
    } else {
      return "Analysis Complete";
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style="dark" />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View
          style={{
            paddingTop: insets.top + 16,
            paddingHorizontal: spacing.xl,
            paddingBottom: spacing.lg,
          }}
        >
          <Text
            style={{
              fontSize: typography.xl,
              fontFamily: typography.fontFamily.bold,
              color: colors.textPrimary,
              textTransform: "capitalize",
            }}
          >
            {type} Result
          </Text>
        </View>

        {/* Status Card */}
        <View
          style={{ paddingHorizontal: spacing.xl, marginBottom: spacing.xxl }}
        >
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: radius.xl,
              padding: spacing.xxxl,
              alignItems: "center",
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            {getStatusIcon()}

            <Text
              style={{
                fontSize: typography.lg,
                fontFamily: typography.fontFamily.bold,
                color: getStatusColor(),
                marginTop: spacing.lg,
                marginBottom: spacing.sm,
              }}
            >
              {getStatusMessage()}
            </Text>

            {result.status === "measured" && result.value_ft != null ? (
              <>
                <Text
                  style={{
                    fontSize: 56,
                    fontFamily: typography.fontFamily.black,
                    color: colors.textPrimary,
                    marginTop: spacing.sm,
                    letterSpacing: -1,
                  }}
                >
                  {result.value_ft}
                </Text>
                <Text
                  style={{
                    fontSize: typography.xl,
                    color: colors.textSecondary,
                    marginBottom: spacing.lg,
                    fontFamily: typography.fontFamily.semibold,
                  }}
                >
                  ft
                </Text>
                {result.confidence != null && (
                  <View
                    style={{
                      backgroundColor: colors.surfaceWarm,
                      paddingHorizontal: spacing.lg,
                      paddingVertical: spacing.sm,
                      borderRadius: radius.round,
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: typography.base,
                        color: colors.textSecondary,
                        fontFamily: typography.fontFamily.semibold,
                      }}
                    >
                      {Math.round(result.confidence * 100)}% confidence
                    </Text>
                  </View>
                )}
                {result.confidence <= 0.45 && (
                  <Text
                    style={{
                      fontSize: typography.sm,
                      color: colors.warning,
                      marginTop: spacing.md,
                      textAlign: "center",
                      fontFamily: typography.fontFamily.semibold,
                    }}
                  >
                    Low confidence — try a clearer side angle
                  </Text>
                )}
              </>
            ) : (
              <Text
                style={{
                  fontSize: typography.lg,
                  color: colors.textSecondary,
                  marginTop: spacing.sm,
                  textAlign: "center",
                  fontFamily: typography.fontFamily.regular,
                }}
              >
                Could not measure this {type}
              </Text>
            )}
          </View>
        </View>

        {/* Image Preview */}
        <View
          style={{ paddingHorizontal: spacing.xl, marginBottom: spacing.xxl }}
        >
          <Text
            style={{
              fontSize: typography.lg,
              fontFamily: typography.fontFamily.black,
              color: colors.textPrimary,
              marginBottom: spacing.md,
              letterSpacing: -0.2,
            }}
          >
            Your Photo
          </Text>
          <Image
            source={{ uri: imageUrl }}
            style={{ width: "100%", height: 200, borderRadius: radius.xl }}
            resizeMode="cover"
          />
        </View>

        {/* Notes */}
        {result.notes && (
          <View
            style={{ paddingHorizontal: spacing.xl, marginBottom: spacing.xxl }}
          >
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: radius.xl,
                padding: spacing.lg,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Text
                style={{
                  fontSize: typography.base,
                  fontFamily: typography.fontFamily.bold,
                  color: colors.textPrimary,
                  marginBottom: spacing.sm,
                }}
              >
                Notes
              </Text>
              <Text
                style={{
                  fontSize: typography.base,
                  color: colors.textSecondary,
                  lineHeight: 20,
                  fontFamily: typography.fontFamily.regular,
                }}
              >
                {result.notes}
              </Text>
            </View>
          </View>
        )}

        {/* Tips for Better Results */}
        {result.status === "failed" || result.confidence < 0.7 ? (
          <View style={{ paddingHorizontal: spacing.xl }}>
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: radius.xl,
                padding: spacing.lg,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Text
                style={{
                  fontSize: typography.base,
                  fontFamily: typography.fontFamily.bold,
                  color: colors.textPrimary,
                  marginBottom: spacing.md,
                }}
              >
                Tips for Better Results
              </Text>
              <Text
                style={{
                  fontSize: typography.base,
                  color: colors.textSecondary,
                  lineHeight: 20,
                  marginBottom: spacing.sm,
                  fontFamily: typography.fontFamily.regular,
                }}
              >
                • Use a clear side-angle shot
              </Text>
              <Text
                style={{
                  fontSize: typography.base,
                  color: colors.textSecondary,
                  lineHeight: 20,
                  marginBottom: spacing.sm,
                  fontFamily: typography.fontFamily.regular,
                }}
              >
                • Ensure good lighting
              </Text>
              <Text
                style={{
                  fontSize: typography.base,
                  color: colors.textSecondary,
                  lineHeight: 20,
                  marginBottom: spacing.sm,
                  fontFamily: typography.fontFamily.regular,
                }}
              >
                • Show the full {type} from takeoff to landing
              </Text>
              <Text
                style={{
                  fontSize: typography.base,
                  color: colors.textSecondary,
                  lineHeight: 20,
                  marginBottom: spacing.sm,
                  fontFamily: typography.fontFamily.regular,
                }}
              >
                • Keep the bike and rider in frame
              </Text>
            </View>
          </View>
        ) : null}
      </ScrollView>

      {/* Bottom Actions */}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: colors.background,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          padding: spacing.xl,
          paddingBottom: insets.bottom + spacing.xl,
        }}
      >
        <TouchableOpacity
          onPress={handleSave}
          style={{
            backgroundColor: colors.primary,
            borderRadius: radius.round,
            paddingVertical: spacing.lg,
            alignItems: "center",
            marginBottom: spacing.md,
          }}
        >
          <Text
            style={{
              fontSize: typography.lg,
              fontFamily: typography.fontFamily.bold,
              color: colors.surface,
            }}
          >
            Done
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push("/(tabs)/ai/riding-logs")}
          style={{
            backgroundColor: colors.surface,
            borderRadius: radius.round,
            paddingVertical: spacing.lg,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: spacing.sm,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Home size={20} color={colors.textPrimary} strokeWidth={2.5} />
          <Text
            style={{
              fontSize: typography.lg,
              fontFamily: typography.fontFamily.bold,
              color: colors.textPrimary,
            }}
          >
            Back to Logs
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
