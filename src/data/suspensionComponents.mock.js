// Mock suspension catalog (MVP)
// Used by AI Suspension Setup Helper (AI tab only)

export const suspensionComponents = [
  {
    id: "fork-fox-36-grip2",
    brand: "FOX",
    model: "36 Factory GRIP2",
    type: "fork",
    airOrCoil: "air",
    maxPsi: 120,
    clickRanges: {
      rebound: { min: 0, max: 18 },
      compression: { min: 0, max: 16 },
    },
    supportsTokens: true,
  },
  {
    id: "fork-rockshox-lyrik-charger",
    brand: "RockShox",
    model: "Lyrik Charger 3",
    type: "fork",
    airOrCoil: "air",
    maxPsi: 140,
    clickRanges: {
      rebound: { min: 0, max: 20 },
      compression: { min: 0, max: 15 },
    },
    supportsTokens: true,
  },
  {
    id: "fork-fox-34-grip",
    brand: "FOX",
    model: "34 Performance GRIP",
    type: "fork",
    airOrCoil: "air",
    maxPsi: 120,
    clickRanges: {
      rebound: { min: 0, max: 18 },
      compression: { min: 0, max: 10 },
    },
    supportsTokens: true,
  },

  {
    id: "shock-fox-float-x",
    brand: "FOX",
    model: "Float X",
    type: "shock",
    airOrCoil: "air",
    maxPsi: 350,
    clickRanges: {
      rebound: { min: 0, max: 18 },
      compression: { min: 0, max: 12 },
    },
    supportsTokens: true,
  },
  {
    id: "shock-rockshox-super-deluxe",
    brand: "RockShox",
    model: "Super Deluxe Ultimate",
    type: "shock",
    airOrCoil: "air",
    maxPsi: 350,
    clickRanges: {
      rebound: { min: 0, max: 20 },
      compression: { min: 0, max: 12 },
    },
    supportsTokens: true,
  },
  {
    id: "shock-fox-dhx2-coil",
    brand: "FOX",
    model: "DHX2 (Coil)",
    type: "shock",
    airOrCoil: "coil",
    maxPsi: null,
    clickRanges: {
      rebound: { min: 0, max: 16 },
      compression: { min: 0, max: 16 },
    },
    supportsTokens: false,
  },
];

export function listForks() {
  return suspensionComponents.filter((c) => c.type === "fork");
}

export function listShocks() {
  return suspensionComponents.filter((c) => c.type === "shock");
}

export function getComponentById(id) {
  return suspensionComponents.find((c) => c.id === id) || null;
}
