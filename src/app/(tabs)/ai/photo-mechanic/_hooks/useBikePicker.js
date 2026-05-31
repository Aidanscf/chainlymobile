import { useState, useCallback } from "react";

export function useBikePicker() {
  const [bikePickerOpen, setBikePickerOpen] = useState(false);

  const openBikePicker = useCallback(() => {
    setBikePickerOpen(true);
  }, []);

  const closeBikePicker = useCallback(() => {
    setBikePickerOpen(false);
  }, []);

  return {
    bikePickerOpen,
    openBikePicker,
    closeBikePicker,
  };
}
