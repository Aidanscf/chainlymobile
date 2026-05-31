export const RIDING_TYPES = ["Jumps", "Drops", "Cornering"];

export const rubricsByType = {
  Jumps: {
    title: "Jumps",
    description: "Takeoff control, in‑air stability, landing form",
    subScores: [
      {
        key: "takeoff",
        name: "Takeoff",
        cues: ["Smooth preload", "Eyes up to the landing"],
        commonMistake: "Yanking the bars at takeoff",
        drill: "Pump‑to‑pop reps",
      },
      {
        key: "air",
        name: "In‑air control",
        cues: ["Neutral hips", "Quiet hands"],
        commonMistake: "Over‑correcting mid‑air",
        drill: "Straight‑air stability",
      },
      {
        key: "landing",
        name: "Landing",
        cues: ["Absorb with legs", "Land centered"],
        commonMistake: "Stiff legs on impact",
        drill: "Soft‑landing focus",
      },
      {
        key: "speed",
        name: "Speed control",
        cues: ["Commit to one speed", "Brake early, not on lip"],
        commonMistake: "Last‑second braking",
        drill: "Speed repeats",
      },
    ],
  },

  Drops: {
    title: "Drops",
    description: "Body position, braking timing, landing absorption",
    subScores: [
      {
        key: "body",
        name: "Body position",
        cues: ["Hips back, chest tall", "Heavy feet"],
        commonMistake: "Too far forward at the edge",
        drill: "Drop posture holds",
      },
      {
        key: "brake",
        name: "Braking timing",
        cues: ["Brake before the edge", "Release as you drop"],
        commonMistake: "Braking off the drop",
        drill: "Brake‑release reps",
      },
      {
        key: "absorb",
        name: "Landing absorption",
        cues: ["Bend knees on impact", "Stay loose"],
        commonMistake: "Locking out on landing",
        drill: "Absorption bounces",
      },
      {
        key: "line",
        name: "Line choice",
        cues: ["Aim for smooth runout", "Pick a landing zone"],
        commonMistake: "Dropping blind",
        drill: "Spot‑the‑landing",
      },
    ],
  },

  Cornering: {
    title: "Cornering",
    description: "Entry speed, body lean, exit drive",
    subScores: [
      {
        key: "entry",
        name: "Entry speed",
        cues: ["Brake before turn", "Set speed early"],
        commonMistake: "Braking mid‑corner",
        drill: "Brake‑set‑go",
      },
      {
        key: "lean",
        name: "Body lean",
        cues: ["Bike leans more than body", "Eyes to exit"],
        commonMistake: "Leaning body into the turn",
        drill: "Lean drills",
      },
      {
        key: "outside",
        name: "Outside foot pressure",
        cues: ["Heavy outside foot", "Light hands"],
        commonMistake: "Unweighted feet",
        drill: "Outside‑foot focus",
      },
      {
        key: "exit",
        name: "Exit drive",
        cues: ["Stand up out of the turn", "Drive forward"],
        commonMistake: "Coasting through exit",
        drill: "Exit sprints",
      },
    ],
  },

  "Steep Tech": {
    title: "Steep Tech",
    description: "Braking control, traction, line choice",
    subScores: [
      {
        key: "braking",
        name: "Braking control",
        cues: ["Light, even braking", "Release over roots"],
        commonMistake: "Grabbing brakes",
        drill: "Feather‑brake reps",
      },
      {
        key: "position",
        name: "Body position",
        cues: ["Hips back", "Elbows soft"],
        commonMistake: "Locked arms",
        drill: "Steep stance",
      },
      {
        key: "vision",
        name: "Vision / line choice",
        cues: ["Look 2–3 moves ahead", "Pick safe outs"],
        commonMistake: "Staring at the obstacle",
        drill: "Look‑ahead laps",
      },
      {
        key: "traction",
        name: "Traction management",
        cues: ["Heavy feet", "Smooth inputs"],
        commonMistake: "Choppy braking",
        drill: "Smooth‑inputs run",
      },
    ],
  },
};

export function scoreDescriptor(score) {
  const s = Number(score) || 0;
  if (s >= 90) return "Elite";
  if (s >= 75) return "Solid";
  if (s >= 50) return "Developing";
  return "Foundation";
}

export function scoreColor(score) {
  const s = Number(score) || 0;
  if (s >= 85) return "#1FC05B";
  if (s >= 70) return "#FFB020";
  return "#FF6A2A";
}
