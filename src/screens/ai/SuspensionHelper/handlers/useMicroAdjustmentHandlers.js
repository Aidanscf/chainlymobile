import { useCallback } from "react";
import { useSuspensionStore } from "@/store/suspension";
import { applyDeltaToSettings } from "../utils/suspensionHelpers";

export function useMicroAdjustmentHandlers(
  list,
  session,
  microItem,
  showToast,
  setMicroOpen,
) {
  const setSessionField = useSuspensionStore((s) => s.setSessionField);
  const savePresetFromSession = useSuspensionStore(
    (s) => s.savePresetFromSession,
  );
  const updatePresetNotes = useSuspensionStore((s) => s.updatePresetNotes);

  const onApplyMicroTemporary = useCallback(() => {
    if (!microItem) return;
    const active =
      list.find((p) => p.id === session.activePresetId) || list[0] || null;
    if (!active) {
      showToast("Create a preset first");
      return;
    }

    let forkNext = active.forkSettings;
    let shockNext = active.shockSettings;

    (microItem.changes || []).forEach((c) => {
      if (c.appliesTo === "fork")
        forkNext = applyDeltaToSettings(forkNext, c.delta);
      if (c.appliesTo === "shock")
        shockNext = applyDeltaToSettings(shockNext, c.delta);
    });

    setSessionField("bikeId", active.bikeId);
    setSessionField("forkSettings", forkNext);
    setSessionField("shockSettings", shockNext);
    setSessionField("activePresetId", active.id);

    setMicroOpen(false);
    showToast("Adjustment applied (temporary)");
  }, [
    list,
    microItem,
    session.activePresetId,
    setSessionField,
    showToast,
    setMicroOpen,
  ]);

  const onSaveMicroAsPreset = useCallback(() => {
    if (!microItem) return;
    const active =
      list.find((p) => p.id === session.activePresetId) || list[0] || null;
    if (!active) {
      showToast("Create a preset first");
      return;
    }

    let forkNext = active.forkSettings;
    let shockNext = active.shockSettings;

    (microItem.changes || []).forEach((c) => {
      if (c.appliesTo === "fork")
        forkNext = applyDeltaToSettings(forkNext, c.delta);
      if (c.appliesTo === "shock")
        shockNext = applyDeltaToSettings(shockNext, c.delta);
    });

    try {
      setSessionField("bikeId", active.bikeId);
      setSessionField("forkSettings", forkNext);
      setSessionField("shockSettings", shockNext);

      const created = savePresetFromSession({
        name: `${active.name || "Preset"} • ${microItem.title}`,
        terrainTag: active.terrainTag,
        weatherTag: active.weatherTag,
      });

      updatePresetNotes(
        created.id,
        `Micro-adjustment: ${microItem.title}.\n${microItem.explanation}`,
      );

      setMicroOpen(false);
      showToast("Saved as new preset");
    } catch (e) {
      console.error(e);
      showToast("Could not save preset");
    }
  }, [
    list,
    microItem,
    savePresetFromSession,
    session.activePresetId,
    setSessionField,
    showToast,
    updatePresetNotes,
    setMicroOpen,
  ]);

  return {
    onApplyMicroTemporary,
    onSaveMicroAsPreset,
  };
}
