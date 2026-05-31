// Symptom -> adjustment mapping (MVP)
// Keep it friendly, actionable, and light on jargon.

export const SYMPTOMS = [
  { key: "harsh_small", label: "Too harsh on small bumps" },
  { key: "bottom_out", label: "Bottoming out" },
  { key: "bouncy", label: "Feels bouncy" },
  { key: "no_traction", label: "Lacks traction" },
  { key: "front_dives", label: "Front dives" },
  { key: "rear_dead", label: "Rear feels dead" },
];

// Adjustments are intentionally small steps.
// Convention: +rebound means more clicks (faster) only if your clicker counts up when opening.
// We avoid that confusion by expressing adjustments as "Open/Close" in UI.
export const symptomAdjustments = {
  harsh_small: {
    title: "Too harsh on small bumps",
    advice:
      "Let it move a little easier — you want comfort without losing control.",
    fork: [
      {
        kind: "compression",
        delta: -2,
        direction: "open",
        label: "Open compression 2 clicks",
      },
    ],
    shock: [
      {
        kind: "compression",
        delta: -2,
        direction: "open",
        label: "Open compression 2 clicks",
      },
      {
        kind: "psi",
        delta: -5,
        direction: "down",
        label: "Drop 5 PSI (optional)",
      },
    ],
  },

  bottom_out: {
    title: "Bottoming out",
    advice: "Add a bit more support so big hits don’t spike through.",
    fork: [
      { kind: "psi", delta: 5, direction: "up", label: "Add 5 PSI" },
      {
        kind: "tokens",
        delta: 1,
        direction: "add",
        label: "Add 1 token (if supported)",
      },
    ],
    shock: [
      { kind: "psi", delta: 8, direction: "up", label: "Add 8 PSI" },
      {
        kind: "compression",
        delta: 1,
        direction: "close",
        label: "Close compression 1 click",
      },
    ],
  },

  bouncy: {
    title: "Feels bouncy",
    advice: "Slow the return a touch so the bike stops pogo-ing.",
    fork: [
      {
        kind: "rebound",
        delta: -2,
        direction: "slower",
        label: "Slow rebound 2 clicks",
      },
    ],
    shock: [
      {
        kind: "rebound",
        delta: -2,
        direction: "slower",
        label: "Slow rebound 2 clicks",
      },
    ],
  },

  no_traction: {
    title: "Lacks traction",
    advice: "Let the wheels stay glued — softer + calmer is the move.",
    fork: [
      {
        kind: "compression",
        delta: -1,
        direction: "open",
        label: "Open compression 1 click",
      },
      {
        kind: "rebound",
        delta: -1,
        direction: "slower",
        label: "Slow rebound 1 click",
      },
    ],
    shock: [
      {
        kind: "compression",
        delta: -1,
        direction: "open",
        label: "Open compression 1 click",
      },
      {
        kind: "rebound",
        delta: -1,
        direction: "slower",
        label: "Slow rebound 1 click",
      },
    ],
  },

  front_dives: {
    title: "Front dives",
    advice: "Give the front a little more support when you load it.",
    fork: [
      { kind: "psi", delta: 4, direction: "up", label: "Add 4 PSI" },
      {
        kind: "compression",
        delta: 1,
        direction: "close",
        label: "Close compression 1 click",
      },
    ],
    shock: [],
  },

  rear_dead: {
    title: "Rear feels dead",
    advice: "Wake the rear up — it should rebound with energy, not stick.",
    fork: [],
    shock: [
      {
        kind: "rebound",
        delta: 2,
        direction: "faster",
        label: "Speed rebound 2 clicks",
      },
      {
        kind: "compression",
        delta: -1,
        direction: "open",
        label: "Open compression 1 click",
      },
    ],
  },
};

export function getSymptomByKey(key) {
  return SYMPTOMS.find((s) => s.key === key) || null;
}
