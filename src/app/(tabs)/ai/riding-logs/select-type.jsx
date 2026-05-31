import { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { ArrowLeft, ArrowRight, Zap, TrendingDown } from "lucide-react-native";
import { colors, spacing, radius, typography } from "@/theme/index";

export default function SelectTypeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selectedType, setSelectedType] = useState(null);

  const handleContinue = () => {
    if (selectedType) {
      router.push({
        pathname: "/(tabs)/ai/riding-logs/upload",
        params: { type: selectedType },
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
            }}
          >
            Add Riding Log
          </Text>
        </View>
      </View>

      <View style={{ flex: 1, paddingHorizontal: spacing.xl, paddingTop: 40 }}>
        <Text
          style={{
            fontSize: typography.xxxl,
            fontFamily: typography.fontFamily.black,
            color: colors.textPrimary,
            marginBottom: spacing.md,
            letterSpacing: -0.5,
          }}
        >
          What did you ride?
        </Text>
        <Text
          style={{
            fontSize: typography.base,
            color: colors.textSecondary,
            marginBottom: 40,
            fontFamily: typography.fontFamily.regular,
          }}
        >
          Select the type of feature you want to log
        </Text>

        {/* Jump Option */}
        <TouchableOpacity
          onPress={() => setSelectedType("jump")}
          style={{
            backgroundColor:
              selectedType === "jump" ? colors.primary : colors.surface,
            borderRadius: radius.xl,
            padding: spacing.xxl,
            marginBottom: spacing.lg,
            borderWidth: 2,
            borderColor:
              selectedType === "jump" ? colors.primary : colors.border,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: spacing.lg,
            }}
          >
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: radius.round,
                backgroundColor:
                  selectedType === "jump" ? colors.surface : colors.surfaceWarm,
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1,
                borderColor:
                  selectedType === "jump" ? colors.surface : colors.border,
              }}
            >
              <Zap
                size={32}
                color={
                  selectedType === "jump" ? colors.primary : colors.textTertiary
                }
                strokeWidth={2.5}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: typography.xxl,
                  fontFamily: typography.fontFamily.black,
                  color:
                    selectedType === "jump"
                      ? colors.surface
                      : colors.textPrimary,
                  marginBottom: 4,
                  letterSpacing: -0.4,
                }}
              >
                Jump
              </Text>
              <Text
                style={{
                  fontSize: typography.base,
                  fontFamily: typography.fontFamily.regular,
                  color:
                    selectedType === "jump"
                      ? colors.surface
                      : colors.textSecondary,
                }}
              >
                Measure horizontal distance from takeoff to landing
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Drop Option */}
        <TouchableOpacity
          onPress={() => setSelectedType("drop")}
          style={{
            backgroundColor:
              selectedType === "drop" ? colors.primary : colors.surface,
            borderRadius: radius.xl,
            padding: spacing.xxl,
            borderWidth: 2,
            borderColor:
              selectedType === "drop" ? colors.primary : colors.border,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: spacing.lg,
            }}
          >
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: radius.round,
                backgroundColor:
                  selectedType === "drop" ? colors.surface : colors.surfaceWarm,
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1,
                borderColor:
                  selectedType === "drop" ? colors.surface : colors.border,
              }}
            >
              <TrendingDown
                size={32}
                color={
                  selectedType === "drop" ? colors.primary : colors.textTertiary
                }
                strokeWidth={2.5}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: typography.xxl,
                  fontFamily: typography.fontFamily.black,
                  color:
                    selectedType === "drop"
                      ? colors.surface
                      : colors.textPrimary,
                  marginBottom: 4,
                  letterSpacing: -0.4,
                }}
              >
                Drop
              </Text>
              <Text
                style={{
                  fontSize: typography.base,
                  fontFamily: typography.fontFamily.regular,
                  color:
                    selectedType === "drop"
                      ? colors.surface
                      : colors.textSecondary,
                }}
              >
                Measure vertical height from lip to landing
              </Text>
            </View>
          </View>
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
          disabled={!selectedType}
          style={{
            backgroundColor: selectedType ? colors.primary : colors.border,
            borderRadius: radius.round,
            paddingVertical: spacing.lg,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: spacing.sm,
          }}
        >
          <Text
            style={{
              fontSize: typography.lg,
              fontFamily: typography.fontFamily.bold,
              color: selectedType ? colors.surface : colors.textTertiary,
            }}
          >
            Continue
          </Text>
          <ArrowRight
            size={20}
            color={selectedType ? colors.surface : colors.textTertiary}
            strokeWidth={2.5}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}
