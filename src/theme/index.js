// Chainly Design System
// Reset goal: warmer + more saturated + more playful consumer-app vibe.

export const colors = {
  // Brand
  primary: "#FF6A2A", // vibrant warm orange
  primaryLight: "#FF9A6A",
  primaryHover: "#FF7A3D",
  primarySoft: "#FFF0E7", // orange-tinted highlight
  primarySoft2: "#FFE1D1",

  // --- section accents (used sparingly for icons/active states)
  teal: "#16B8A6", // trip planner secondary
  gold: "#FFB020", // leagues accent (warm gold)

  // Status
  success: "#1FC05B", // saturated confident green
  successSoft: "#E8FAF0",
  warning: "#FFB020",
  warningSoft: "#FFF3DB",
  danger: "#FF3B30",
  dangerLight: "#FFE8E7",
  info: "#3B82F6",

  // App canvas (GLOBAL)
  // This is the "soft grey canvas" that every screen sits on top of.
  appBackground: "#F3F2EE",

  // Surfaces
  background: "#F3F2EE", // legacy alias: keep screens using colors.background on the same canvas
  surface: "#FFFFFF",
  surfaceWarm: "#FFF9F4",

  // Text (higher contrast)
  textPrimary: "#16130F",
  textSecondary: "#5B564F",
  textTertiary: "#8C857C",

  // Borders / dividers (very subtle)
  divider: "#F1E8DE",
  border: "#EFE6DC",
  borderLight: "#F5EFE8",

  // Icon backgrounds
  iconBgOrange: "#FFF0E7",
  iconBgYellow: "#FFF3DB",
  iconBgRed: "#FFE8E7",
  iconBgGreen: "#E8FAF0",

  // Shadows (warm)
  shadowColor: "#2B1408",
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const radius = {
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 28,
  round: 9999,
};

export const shadows = {
  small: {
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
  },
  medium: {
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 14,
    elevation: 4,
  },
  large: {
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 22,
    elevation: 8,
  },
};

export const typography = {
  // Sizes
  xs: 11,
  sm: 13,
  base: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  xxxl: 32,

  // Friendly rounded font (Nunito)
  fontFamily: {
    regular: "Nunito_500Medium",
    semibold: "Nunito_700Bold",
    bold: "Nunito_800ExtraBold",
    black: "Nunito_900Black",
  },

  // Fallback weights (when system font is used)
  regular: "500",
  medium: "600",
  semibold: "700",
  bold: "800",

  // Tighter line heights for punchier hierarchy
  lineHeights: {
    tight: 1.15,
    normal: 1.3,
    relaxed: 1.5,
  },
};

// Component-specific presets
export const components = {
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    ...shadows.small,
  },
  button: {
    borderRadius: radius.round,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xxl,
  },
  chip: {
    borderRadius: radius.round,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
};

export default {
  colors,
  spacing,
  radius,
  shadows,
  typography,
  components,
};
