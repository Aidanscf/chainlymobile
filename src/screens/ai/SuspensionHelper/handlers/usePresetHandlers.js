import { useCallback } from "react";
import { Platform, Alert } from "react-native";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { useSuspensionStore } from "@/store/suspension";
import { terrainLabel, weatherLabel } from "../utils/labelHelpers";

export function usePresetHandlers(selectedBike, showToast) {
  const applyPreset = useSuspensionStore((s) => s.applyPreset);
  const deletePreset = useSuspensionStore((s) => s.deletePreset);
  const duplicatePreset = useSuspensionStore((s) => s.duplicatePreset);
  const getSharePayloadForPreset = useSuspensionStore(
    (s) => s.getSharePayloadForPreset,
  );

  const onApplyPreset = useCallback(
    async (presetId) => {
      try {
        if (Platform.OS !== "web") {
          await Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Success,
          );
        }
      } catch (e) {
        // no-op
      }
      applyPreset(presetId);
      showToast("Setup applied");
    },
    [applyPreset, showToast],
  );

  const onDuplicate = useCallback(
    async (presetId) => {
      try {
        if (Platform.OS !== "web") {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      } catch (e) {
        // no-op
      }
      duplicatePreset(presetId);
      showToast("Duplicate created");
    },
    [duplicatePreset, showToast],
  );

  const onConfirmDelete = useCallback(
    (preset) => {
      Alert.alert(
        "Delete preset?",
        `Delete "${preset?.name || "Preset"}"? You can't undo this.`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: async () => {
              deletePreset(preset.id);
              showToast("Preset deleted");
            },
          },
        ],
      );
    },
    [deletePreset, showToast],
  );

  const onCopyShareCard = useCallback(
    async (preset) => {
      try {
        const bikeName = selectedBike?.name || "Bike";
        const payload = getSharePayloadForPreset(preset?.id);

        const shareText = [
          `Chainly Suspension Setup`,
          `Bike: ${bikeName}`,
          `Preset: ${payload?.name || preset?.name || "Preset"}`,
          `Tags: ${terrainLabel(payload?.terrainTag)} • ${weatherLabel(payload?.weatherTag)}`,
          "",
          `Fork: ${payload?.forkSummary || "—"}`,
          `Shock: ${payload?.shockSummary || "—"}`,
          "",
          payload?.notes ? `Notes: ${payload.notes}` : null,
        ]
          .filter(Boolean)
          .join("\n");

        await Clipboard.setStringAsync(shareText);
        showToast("Share card copied");
      } catch (error) {
        console.error(error);
        showToast("Could not copy share card");
      }
    },
    [getSharePayloadForPreset, selectedBike?.name, showToast],
  );

  return {
    onApplyPreset,
    onDuplicate,
    onConfirmDelete,
    onCopyShareCard,
  };
}
