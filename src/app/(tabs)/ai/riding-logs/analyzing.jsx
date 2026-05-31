import { useEffect, useState } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Zap } from "lucide-react-native";
import { colors, spacing, radius, typography } from "@/theme/index";
import useUser from "@/utils/auth/useUser";
import { apiFetch } from "@/utils/apiClient";

export default function AnalyzingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: user } = useUser();
  const { type, imageUrl, pointA, pointB, bikeId, wheelSize } =
    useLocalSearchParams();

  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (user) {
      runAnalysis();
    }
  }, [user]);

  const runAnalysis = async () => {
    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 8, 85));
      }, 300);

      // Parse reference points
      const parsedPointA = JSON.parse(pointA);
      const parsedPointB = JSON.parse(pointB);

      // Use wheelSize from params, fallback to "29" if not provided
      const finalWheelSize = wheelSize || "29";

      // Step 1: Create the riding log first
      const createData = await apiFetch("/api/riding-logs", {
        method: "POST",
        body: JSON.stringify({
          type,
          image_url: imageUrl,
          bike_id: bikeId || null,
          status: "pending",
          marker_a_x: parsedPointA.x,
          marker_a_y: parsedPointA.y,
          marker_b_x: parsedPointB.x,
          marker_b_y: parsedPointB.y,
        }),
      });

      const ridingLogId = createData.log?.id;

      if (!ridingLogId) {
        throw new Error("No log ID returned");
      }

      setProgress(40);

      // Step 2: Call analysis endpoint with wheel size
      const result = await apiFetch("/api/riding-logs/analyze", {
        method: "POST",
        body: JSON.stringify({
          riding_log_id: ridingLogId,
          type,
          image_url: imageUrl,
          wheel: {
            wheel_size_label: finalWheelSize,
          },
          markers: {
            a: { x: parsedPointA.x, y: parsedPointA.y },
            b: { x: parsedPointB.x, y: parsedPointB.y },
          },
        }),
      });

      clearInterval(progressInterval);
      setProgress(100);

      // Navigate to result screen
      setTimeout(() => {
        router.replace({
          pathname: "/(tabs)/ai/riding-logs/result",
          params: {
            type,
            imageUrl,
            pointA,
            pointB,
            ridingLogId,
            result: JSON.stringify(result),
          },
        });
      }, 500);
    } catch (error) {
      console.error("Error analyzing:", error);
      // Still navigate to result with error
      router.replace({
        pathname: "/(tabs)/ai/riding-logs/result",
        params: {
          type,
          imageUrl,
          pointA,
          pointB,
          result: JSON.stringify({
            type,
            value_ft: 0,
            confidence: 0,
            notes: "Analysis failed. Please try again.",
            status: "failed",
          }),
        },
      });
    }
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.background,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <StatusBar style="dark" />

      <View style={{ alignItems: "center" }}>
        <View
          style={{
            width: 120,
            height: 120,
            borderRadius: 60,
            backgroundColor: colors.surface,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: spacing.xxxl,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Zap size={48} color={colors.primary} strokeWidth={2.5} />
        </View>

        <Text
          style={{
            fontSize: typography.xxxl,
            fontFamily: typography.fontFamily.black,
            color: colors.textPrimary,
            marginBottom: spacing.md,
            textAlign: "center",
            letterSpacing: -0.5,
          }}
        >
          Analyzing {type}...
        </Text>

        <Text
          style={{
            fontSize: typography.base,
            color: colors.textSecondary,
            marginBottom: spacing.xxxl,
            textAlign: "center",
            paddingHorizontal: 40,
            fontFamily: typography.fontFamily.regular,
          }}
        >
          Running pose estimation and calculating distance
        </Text>

        {/* Progress Bar */}
        <View
          style={{
            width: 200,
            height: 6,
            backgroundColor: colors.surfaceWarm,
            borderRadius: radius.sm,
            overflow: "hidden",
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <View
            style={{
              width: `${progress}%`,
              height: "100%",
              backgroundColor: colors.primary,
            }}
          />
        </View>

        <Text
          style={{
            fontSize: typography.base,
            color: colors.textSecondary,
            marginTop: spacing.md,
            fontFamily: typography.fontFamily.semibold,
          }}
        >
          {progress}%
        </Text>
      </View>
    </View>
  );
}
