import { create } from "zustand";

export const useBucketListStore = create((set, get) => ({
  savedDestinationIds: [],

  add: (destinationId) => {
    const id = String(destinationId);
    set((state) => {
      const prev = Array.isArray(state.savedDestinationIds)
        ? state.savedDestinationIds
        : [];
      const next = [id, ...prev].filter(
        (x, idx, arr) => arr.indexOf(x) === idx,
      );
      return { savedDestinationIds: next };
    });
  },

  remove: (destinationId) => {
    const id = String(destinationId);
    set((state) => {
      const prev = Array.isArray(state.savedDestinationIds)
        ? state.savedDestinationIds
        : [];
      return { savedDestinationIds: prev.filter((x) => String(x) !== id) };
    });
  },

  isSaved: (destinationId) => {
    const id = String(destinationId);
    const list = get().savedDestinationIds || [];
    return list.some((x) => String(x) === id);
  },

  toggle: (destinationId) => {
    const id = String(destinationId);
    const saved = get().isSaved(id);
    if (saved) {
      get().remove(id);
      return false;
    }
    get().add(id);
    return true;
  },
}));

export default useBucketListStore;
