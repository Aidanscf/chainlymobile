/**
 * Character badge data mapping
 * Maps each character type to its image URL and metadata
 */

export const CHARACTER_DATA = {
  "Smooth Operator": {
    name: "Smooth Operator",
    subtitle: "Elite rider with top-tier skills across the board",
    avatar:
      "https://ucarecdn.com/b07dffab-2e8f-44c6-b89b-9523bc20bdbd/-/format/auto/",
    emoji: "🏆",
  },
  "Air Captain": {
    name: "Air Captain",
    subtitle: "Master of aerial maneuvers and big sends",
    avatar:
      "https://ucarecdn.com/4c1c205c-189b-40ff-a134-afaef02703c4/-/format/auto/",
    emoji: "✈️",
  },
  "Berm Wizard": {
    name: "Berm Wizard",
    subtitle: "Flowing through corners with style and precision",
    avatar:
      "https://ucarecdn.com/f96d849e-d7c9-47bc-a405-15c4acb19c10/-/format/auto/",
    emoji: "🌀",
  },
  "Drop Doctor": {
    name: "Drop Doctor",
    subtitle: "Nailing technical descents and steep features",
    avatar:
      "https://ucarecdn.com/594022b6-1155-48fe-a350-66dcab344d5b/-/format/auto/",
    emoji: "📍",
  },
  "Tech Tamer": {
    name: "Tech Tamer",
    subtitle: "Technical riding specialist conquering gnarly trails",
    avatar:
      "https://ucarecdn.com/fbf36938-f32a-49aa-8902-f0bc36be811a/-/format/auto/",
    emoji: "🛠️",
  },
};

/**
 * Get character data by badge name
 * @param {string} badgeName - The character badge name
 * @returns {object} Character data object
 */
export function getCharacterData(badgeName) {
  return CHARACTER_DATA[badgeName] || CHARACTER_DATA["Tech Tamer"];
}

/**
 * Get all available character types
 * @returns {string[]} Array of character type names
 */
export function getAllCharacterTypes() {
  return Object.keys(CHARACTER_DATA);
}

/**
 * Check if a badge name is valid
 * @param {string} badgeName - The character badge name
 * @returns {boolean} True if valid
 */
export function isValidCharacterBadge(badgeName) {
  return !!CHARACTER_DATA[badgeName];
}
