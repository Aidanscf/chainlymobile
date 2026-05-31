import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  Image,
  Dimensions,
  TouchableWithoutFeedback,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { ArrowLeft, MapPin } from "lucide-react-native";
import { colors, spacing, radius, typography } from "@/theme/index";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const IMAGE_WIDTH = SCREEN_WIDTH - 40;
const IMAGE_HEIGHT = IMAGE_WIDTH * (9 / 16); // Fixed height based on aspect ratio
const MARKER_RADIUS = 12;

// Helper: Clamp value between min and max
function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export default function ReferencePointsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { type, imageUrl } = useLocalSearchParams();

  const [pointA, setPointA] = useState(null);
  const [pointB, setPointB] = useState(null);
  const [containerLayout, setContainerLayout] = useState(null);
  const [wheelSize, setWheelSize] = useState("29"); // Add wheel size state

  const handleImageTouch = (event) => {
    // Safety check: ensure container layout has been measured
    if (
      !containerLayout ||
      containerLayout.width <= 0 ||
      containerLayout.height <= 0
    ) {
      console.warn("Container not measured yet, ignoring tap");
      return;
    }

    // Get touch coordinates relative to the image container
    const { locationX, locationY } = event.nativeEvent;

    console.log("Touch coordinates:", {
      locationX,
      locationY,
      containerLayout,
    });

    // Convert to normalized coordinates [0..1] and clamp
    const normalizedX = clamp(locationX / containerLayout.width, 0, 1);
    const normalizedY = clamp(locationY / containerLayout.height, 0, 1);

    console.log("Normalized coordinates:", { normalizedX, normalizedY });

    if (!pointA) {
      setPointA({ x: normalizedX, y: normalizedY });
    } else if (!pointB) {
      setPointB({ x: normalizedX, y: normalizedY });
    } else {
      // Reset and start over
      setPointA({ x: normalizedX, y: normalizedY });
      setPointB(null);
    }
  };

  const handleContainerLayout = (event) => {
    const { width, height } = event.nativeEvent.layout;
    console.log("Container layout:", { width, height });
    setContainerLayout({ width, height });
  };

  const handleContinue = () => {
    if (pointA && pointB) {
      router.push({
        pathname: "/(tabs)/ai/riding-logs/analyzing",
        params: {
          type,
          imageUrl,
          pointA: JSON.stringify(pointA),
          pointB: JSON.stringify(pointB),
          wheelSize, // Pass wheel size to next screen
        },
      });
    }
  };

  const getInstructions = () => {
    if (type === "jump") {
      if (!pointA) return "Tap the takeoff point";
      if (!pointB) return "Now tap the landing point";
      return "Points marked! Ready to analyze";
    } else {
      if (!pointA) return "Tap the lip/top of the drop";
      if (!pointB) return "Now tap the landing point";
      return "Points marked! Ready to analyze";
    }
  };

  // Calculate marker positions from normalized coords
  const markerALeft =
    pointA && containerLayout ? pointA.x * containerLayout.width : 0;
  const markerATop =
    pointA && containerLayout ? pointA.y * containerLayout.height : 0;
  const markerBLeft =
    pointB && containerLayout ? pointB.x * containerLayout.width : 0;
  const markerBTop =
    pointB && containerLayout ? pointB.y * containerLayout.height : 0;

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
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <ArrowLeft size={24} color={colors.textPrimary} strokeWidth={2.5} />
          </Pressable>
          <Text
            style={{
              fontSize: typography.xl,
              fontFamily: typography.fontFamily.bold,
              color: colors.textPrimary,
            }}
          >
            Mark Reference Points
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
          {getInstructions()}
        </Text>
        <Text
          style={{
            fontSize: typography.base,
            color: colors.textSecondary,
            marginBottom: spacing.xxxl,
            fontFamily: typography.fontFamily.regular,
          }}
        >
          Tap to place markers on the image
        </Text>

        {/* Interactive Image Container - using TouchableWithoutFeedback */}
        <View
          onLayout={handleContainerLayout}
          style={{
            marginBottom: spacing.xxl,
            width: IMAGE_WIDTH,
            height: IMAGE_HEIGHT,
          }}
        >
          <TouchableWithoutFeedback onPressIn={handleImageTouch}>
            <View
              style={{
                position: "relative",
                width: IMAGE_WIDTH,
                height: IMAGE_HEIGHT,
              }}
            >
              <Image
                source={{ uri: imageUrl }}
                style={{
                  width: IMAGE_WIDTH,
                  height: IMAGE_HEIGHT,
                  borderRadius: radius.xl,
                }}
                resizeMode="cover"
              />

              {/* Point A Marker */}
              {pointA && containerLayout && (
                <View
                  pointerEvents="none"
                  style={{
                    position: "absolute",
                    left: markerALeft,
                    top: markerATop,
                    width: MARKER_RADIUS * 2,
                    height: MARKER_RADIUS * 2,
                    borderRadius: MARKER_RADIUS,
                    backgroundColor: colors.primary,
                    borderWidth: 3,
                    borderColor: colors.surface,
                    alignItems: "center",
                    justifyContent: "center",
                    transform: [
                      { translateX: -MARKER_RADIUS },
                      { translateY: -MARKER_RADIUS },
                    ],
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontFamily: typography.fontFamily.black,
                      color: colors.surface,
                    }}
                  >
                    A
                  </Text>
                </View>
              )}

              {/* Point B Marker */}
              {pointB && containerLayout && (
                <View
                  pointerEvents="none"
                  style={{
                    position: "absolute",
                    left: markerBLeft,
                    top: markerBTop,
                    width: MARKER_RADIUS * 2,
                    height: MARKER_RADIUS * 2,
                    borderRadius: MARKER_RADIUS,
                    backgroundColor: colors.success,
                    borderWidth: 3,
                    borderColor: colors.surface,
                    alignItems: "center",
                    justifyContent: "center",
                    transform: [
                      { translateX: -MARKER_RADIUS },
                      { translateY: -MARKER_RADIUS },
                    ],
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontFamily: typography.fontFamily.black,
                      color: colors.surface,
                    }}
                  >
                    B
                  </Text>
                </View>
              )}
            </View>
          </TouchableWithoutFeedback>
        </View>

        {/* Wheel Size Input */}
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: radius.xl,
            padding: spacing.lg,
            marginBottom: spacing.lg,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Text
            style={{
              fontSize: typography.base,
              fontFamily: typography.fontFamily.semibold,
              color: colors.textPrimary,
              marginBottom: spacing.md,
            }}
          >
            Wheel Size (for accurate measurement)
          </Text>
          <View
            style={{
              flexDirection: "row",
              gap: spacing.sm,
            }}
          >
            {["26", "27.5", "29"].map((size) => (
              <Pressable
                key={size}
                onPress={() => setWheelSize(size)}
                style={{
                  flex: 1,
                  backgroundColor:
                    wheelSize === size ? colors.primary : colors.surfaceWarm,
                  borderRadius: radius.lg,
                  paddingVertical: spacing.md,
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor:
                    wheelSize === size ? colors.primary : colors.border,
                }}
              >
                <Text
                  style={{
                    fontSize: typography.lg,
                    fontFamily: typography.fontFamily.bold,
                    color:
                      wheelSize === size ? colors.surface : colors.textPrimary,
                  }}
                >
                  {size}"
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Legend */}
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: radius.xl,
            padding: spacing.lg,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: spacing.md,
              marginBottom: spacing.sm,
            }}
          >
            <View
              style={{
                width: 20,
                height: 20,
                borderRadius: 10,
                backgroundColor: colors.primary,
              }}
            />
            <Text
              style={{
                fontSize: typography.base,
                color: colors.textPrimary,
                fontFamily: typography.fontFamily.semibold,
              }}
            >
              Point A: {type === "jump" ? "Takeoff" : "Lip/Top"}
            </Text>
          </View>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: spacing.md,
            }}
          >
            <View
              style={{
                width: 20,
                height: 20,
                borderRadius: 10,
                backgroundColor: colors.success,
              }}
            />
            <Text
              style={{
                fontSize: typography.base,
                color: colors.textPrimary,
                fontFamily: typography.fontFamily.semibold,
              }}
            >
              Point B: Landing
            </Text>
          </View>
        </View>
      </View>

      {/* Continue Button */}
      <View
        style={{
          padding: spacing.xl,
          paddingBottom: insets.bottom + spacing.xl,
        }}
      >
        <Pressable
          onPress={handleContinue}
          disabled={!pointA || !pointB}
          style={{
            backgroundColor: pointA && pointB ? colors.primary : colors.border,
            borderRadius: radius.round,
            paddingVertical: spacing.lg,
            alignItems: "center",
          }}
        >
          <Text
            style={{
              fontSize: typography.lg,
              fontFamily: typography.fontFamily.bold,
              color: pointA && pointB ? colors.surface : colors.textTertiary,
            }}
          >
            Analyze {type === "jump" ? "Jump" : "Drop"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
