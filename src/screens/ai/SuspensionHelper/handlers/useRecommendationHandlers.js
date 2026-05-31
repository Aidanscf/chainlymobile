import { useCallback } from "react";
import { Platform, Alert } from "react-native";
import * as Haptics from "expo-haptics";
import { useSuspensionStore } from "@/store/suspension";
import { applyDeltaToSettings, nowIso } from "../utils/suspensionHelpers";

export function useRecommendationHandlers(
  list,
  session,
  recommended,
  showToast,
  setRecState,
) {
  const setSessionField = useSuspensionStore((s) => s.setSessionField);
  const savePresetFromSession = useSuspensionStore(
    (s) => s.savePresetFromSession,
  );
  const updatePresetNotes = useSuspensionStore((s) => s.updatePresetNotes);

  const onAcceptRecommendation = useCallback(async () => {
    if (!recommended) return;

    const active =
      list.find((p) => p.id === session.activePresetId) || list[0] || null;
    if (!active) {
      showToast("Create a preset first");
      return;
    }

    Alert.alert(
      "Apply tweaks",
      "Want to apply these changes temporarily, or save them as a new preset?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Temporary",
          onPress: () => {
            const nextShock = applyDeltaToSettings(
              active.shockSettings,
              recommended.shockDelta,
            );
            setSessionField("shockSettings", nextShock);
            setSessionField("activePresetId", active.id);
            setRecState({ status: "accepted" });
            showToast("Tweaks applied (temporary)");
          },
        },
        {
          text: "Save new preset",
          onPress: () => {
            try {
              const nextShock = applyDeltaToSettings(
                active.shockSettings,
                recommended.shockDelta,
              );
              setSessionField("bikeId", active.bikeId);
              setSessionField("forkSettings", active.forkSettings);
              setSessionField("shockSettings", nextShock);

              const created = savePresetFromSession({
                name: `${active.name || "Preset"} + Tweaks`,
                terrainTag: active.terrainTag,
                weatherTag: active.weatherTag,
              });
              updatePresetNotes(
                created.id,
                `Auto-saved from recommendation (${nowIso().slice(0, 10)}).`,
              );
              setRecState({ status: "accepted" });
              showToast("Saved as new preset");
            } catch (e) {
              console.error(e);
              showToast("Could not save preset");
            }
          },
        },
      ],
    );
  }, [
    list,
    recommended,
    savePresetFromSession,
    session.activePresetId,
    setSessionField,
    showToast,
    updatePresetNotes,
    setRecState,
  ]);

  const onDismissRecommendation = useCallback(async () => {
    try {
      if (Platform.OS !== "web") {
        await Haptics.selectionAsync();
      }
    } catch (e) {
      // no-op
    }
    setRecState({ status: "dismissed" });
    showToast("Dismissed");
  }, [showToast, setRecState]);

  return {
    onAcceptRecommendation,
    onDismissRecommendation,
  };
}
