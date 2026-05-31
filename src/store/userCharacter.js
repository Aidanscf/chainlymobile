import { create } from "zustand";
import { getCharacterData } from "@/utils/characterMapping";

/**
 * User Character Store
 * Tracks the user's current character badge, riding type, and overall score
 * This is updated after each media analysis completes
 */
export const useUserCharacter = create((set, get) => ({
  // Current character state
  badge: null, // e.g. "Air Captain", "Berm Wizard", etc.
  ridingType: null, // e.g. "Jumps", "Cornering", etc.
  overallScore: null, // e.g. 86
  lastUpdated: null, // ISO timestamp

  /**
   * Update the user's character after an analysis
   * @param {object} data - { badge, ridingType, overallScore }
   */
  updateCharacter: (data) => {
    set({
      badge: data?.badge || null,
      ridingType: data?.ridingType || null,
      overallScore: data?.overallScore || null,
      lastUpdated: new Date().toISOString(),
    });
  },

  /**
   * Get the full character data including avatar and subtitle
   * @returns {object} Character data from characterMapping
   */
  getCharacterData: () => {
    const state = get();
    if (!state.badge) {
      return null;
    }
    return getCharacterData(state.badge);
  },

  /**
   * Check if the user has a character (has completed at least one analysis)
   * @returns {boolean}
   */
  hasCharacter: () => {
    return !!get().badge;
  },

  /**
   * Clear character data (for testing/reset)
   */
  clearCharacter: () => {
    set({
      badge: null,
      ridingType: null,
      overallScore: null,
      lastUpdated: null,
    });
  },
}));

export default useUserCharacter;
