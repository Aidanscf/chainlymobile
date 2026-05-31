import React, { useMemo } from "react";
import { View, StyleSheet } from "react-native";

import { colors } from "@/theme/index";

/**
 * Full-screen decorative background used across onboarding.
 * Purely visual: safe to reuse anywhere.
 */
export default function OnboardingBackground({ variant = "warm" }) {
  const palette = useMemo(() => {
    if (variant === "calm") {
      return {
        a: "#EAF7FF",
        b: "#FFF3DB",
        c: "#FFF0E7",
      };
    }

    if (variant === "dark") {
      return {
        a: "#1A1A1A",
        b: "#0F0F0F",
        c: "#252525",
      };
    }

    // warm / default
    return {
      a: colors.primarySoft2,
      b: "#EAF7FF",
      c: colors.primarySoft,
    };
  }, [variant]);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View
        style={[styles.blob, styles.blobA, { backgroundColor: palette.a }]}
      />
      <View
        style={[styles.blob, styles.blobB, { backgroundColor: palette.b }]}
      />
      <View
        style={[styles.blob, styles.blobC, { backgroundColor: palette.c }]}
      />
      <View style={styles.fadeBottom} />
    </View>
  );
}

const styles = StyleSheet.create({
  blob: {
    position: "absolute",
    borderRadius: 9999,
    opacity: 0.95,
  },
  blobA: {
    width: 340,
    height: 340,
    top: -160,
    right: -130,
  },
  blobB: {
    width: 320,
    height: 320,
    top: 120,
    left: -180,
    opacity: 0.9,
  },
  blobC: {
    width: 260,
    height: 260,
    bottom: 90,
    right: -120,
    opacity: 0.9,
  },

  // Helps the sticky footer feel grounded.
  fadeBottom: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 140,
    backgroundColor: colors.appBackground,
    opacity: 0.55,
  },
});
