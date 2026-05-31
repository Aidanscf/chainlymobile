import { create } from "zustand";

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

export const useGearStore = create((set, get) => ({
  // Wizard state
  wizard: {
    intent: "upgrade", // upgrade | replace | find
    focus: "drivetrain", // drivetrain | brakes | suspension | wheels_tires | cockpit
    query: "",
    budget: "$$", // $ | $$ | $$$
    region: "usa", // usa | canada | eu
    bikeId: "1",
  },

  // Results state
  results: {
    top: null,
    alternatives: [],
    alert: null,
  },

  // Compare + Save state
  compare: {
    left: null,
    right: null,
  },

  wishlist: [], // {id, savedAt, bikeId?, mode, notes?, product}

  setWizardField: (key, value) => {
    set((state) => ({
      wizard: {
        ...state.wizard,
        [key]: value,
      },
    }));
  },

  resetWizard: () => {
    set({
      wizard: {
        intent: "upgrade",
        focus: "drivetrain",
        query: "",
        budget: "$$",
        region: "usa",
        bikeId: "1",
      },
      results: { top: null, alternatives: [], alert: null },
      compare: { left: null, right: null },
    });
  },

  setResults: (nextResults) => {
    set({ results: deepClone(nextResults) });
  },

  setCompare: ({ left, right }) => {
    set({ compare: { left, right } });
  },

  saveToWishlist: ({
    product,
    bikeId = null,
    mode = "upgrade_later",
    notes = "",
  }) => {
    if (!product) {
      return;
    }
    const item = {
      id: `${product.id}-${Date.now()}`,
      savedAt: new Date().toISOString(),
      bikeId,
      mode,
      notes,
      product: deepClone(product),
    };

    set((state) => ({
      wishlist: [item, ...(state.wishlist || [])].slice(0, 50),
    }));

    return item;
  },

  removeWishlistItem: (wishlistId) => {
    set((state) => ({
      wishlist: (state.wishlist || []).filter((w) => w.id !== wishlistId),
    }));
  },
}));

export default useGearStore;
