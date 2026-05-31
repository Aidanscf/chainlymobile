import { useMemo } from "react";
import { usePathname } from "expo-router";
import { colors } from "@/theme/index";

// Section-aware accent mapping.
// Keep this conservative: accent is used for icons/CTAs/highlights,
// while the app background stays light.
export default function useAccentColor() {
  const pathname = usePathname();

  return useMemo(() => {
    const path = String(pathname || "").toLowerCase();

    // Garage / maintenance
    if (path.includes("/garage") || path.includes("maintenance")) {
      return colors.success;
    }

    // Suspension helper
    if (path.includes("suspension")) {
      return colors.info;
    }

    // Leagues
    if (path.includes("/leagues") || path.includes("character")) {
      return colors.gold || colors.warning;
    }

    // Trip planner can get orange base (secondary teal can be used in-screen)
    if (path.includes("trip-planner")) {
      return colors.primary;
    }

    // AI tools default
    if (path.includes("/ai")) {
      return colors.primary;
    }

    // Friends / social
    if (path.includes("/friends")) {
      return colors.primary;
    }

    // Settings
    if (path.includes("/settings")) {
      return colors.primary;
    }

    return colors.primary;
  }, [pathname]);
}
