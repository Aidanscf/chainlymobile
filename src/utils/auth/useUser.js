import { useCallback } from "react";
import { useAuthStore } from "./store";

export const useUser = () => {
  const hydrated = useAuthStore((s) => s.hydrated);
  const user = useAuthStore((s) => s.user);
  const refreshMe = useAuthStore((s) => s.refreshMe);

  const fetchUser = useCallback(async () => {
    try {
      const restored = await refreshMe();
      return restored || useAuthStore.getState().user;
    } catch (e) {
      return useAuthStore.getState().user;
    }
  }, [refreshMe]);

  return { user, data: user, loading: !hydrated, refetch: fetchUser };
};

export default useUser;
