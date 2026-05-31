import React, { useMemo } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors } from "@/theme/index";

/**
 * ScreenContainer
 *
 * Global screen wrapper so every screen sits on the same soft grey app canvas.
 * - flex: 1
 * - backgroundColor: colors.appBackground
 * - optional safe-area padding
 *
 * Use this instead of setting background colors on individual screens.
 */
export default function ScreenContainer({
  children,
  style,
  safeTop = false,
  safeBottom = false,
}) {
  const insets = useSafeAreaInsets();

  const containerStyle = useMemo(() => {
    const paddingTop = safeTop ? insets.top : 0;
    const paddingBottom = safeBottom ? insets.bottom : 0;

    return [
      {
        flex: 1,
        backgroundColor: colors.appBackground,
        paddingTop,
        paddingBottom,
      },
      style,
    ];
  }, [insets.bottom, insets.top, safeBottom, safeTop, style]);

  return <View style={containerStyle}>{children}</View>;
}
