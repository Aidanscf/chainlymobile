import { useState, useCallback, useRef } from "react";

export function useToast() {
  const toastTimer = useRef(null);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message) => {
    setToast(message);
    if (toastTimer.current) {
      clearTimeout(toastTimer.current);
    }
    toastTimer.current = setTimeout(() => setToast(null), 1700);
  }, []);

  return { toast, showToast };
}
