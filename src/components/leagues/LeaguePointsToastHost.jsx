import React, { useEffect, useMemo, useRef, useState } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors, radius, spacing, typography } from "@/theme/index";
import { subscribeLeaguePointsFeedback } from "@/utils/leagues/pointsFeedback";

// Global, non-blocking toast host for "+X League Points" feedback.
// Safe to mount once near the app root.
export default function LeaguePointsToastHost() {
  const insets = useSafeAreaInsets();

  const [delta, setDelta] = useState(null);
  const [visible, setVisible] = useState(false);

  const anim = useRef(new Animated.Value(0)).current;
  const hideTimer = useRef(null);

  const bottom = useMemo(() => {
    // float above tab bar; keep it safe on devices
    const base = 96;
    return (insets.bottom || 0) + base;
  }, [insets.bottom]);

  useEffect(() => {
    const unsub = subscribeLeaguePointsFeedback((nextDelta) => {
      try {
        if (hideTimer.current) {
          clearTimeout(hideTimer.current);
          hideTimer.current = null;
        }

        setDelta(nextDelta);
        setVisible(true);

        Animated.timing(anim, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }).start();

        hideTimer.current = setTimeout(() => {
          Animated.timing(anim, {
            toValue: 0,
            duration: 180,
            useNativeDriver: true,
          }).start(({ finished }) => {
            if (finished) {
              setVisible(false);
              setDelta(null);
            }
          });
        }, 2200);
      } catch (e) {
        // never throw
      }
    });

    return () => {
      try {
        unsub?.();
      } catch (e) {
        // no-op
      }

      try {
        if (hideTimer.current) {
          clearTimeout(hideTimer.current);
          hideTimer.current = null;
        }
      } catch (e) {
        // no-op
      }
    };
  }, [anim]);

  if (!visible || delta == null) {
    return null;
  }

  const text = `+${delta} League Points`;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Animated.View
        style={[
          styles.toast,
          {
            bottom,
            opacity: anim,
            transform: [
              {
                translateY: anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [14, 0],
                }),
              },
            ],
          },
        ]}
      >
        <Text style={styles.text}>{text}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: "absolute",
    left: spacing.xl,
    right: spacing.xl,
    alignSelf: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: radius.round,
    backgroundColor: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  text: {
    fontSize: typography.sm,
    lineHeight: 16,
    fontFamily: typography.fontFamily.black,
    color: colors.surface,
    textAlign: "center",
    letterSpacing: -0.1,
  },
});
