import { colors } from "@/theme/index";

export function getStateColor(score) {
  if (score >= 70) return colors.success;
  if (score >= 40) return colors.warning;
  return colors.danger;
}
