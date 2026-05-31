import { useCallback } from "react";
import { useAuthStore } from "./store";

export const useUser = () => {
  const hydrated = useAuthStore((s) => s.hydrated);
  const user = useAuthStore((s) => s.user);

  const fetchUser = useCallback(async () => {
    return user;
  }, [user]);

  return { user, data: user, loading: !hydrated, refetch: fetchUser };
};

export default useUser;
