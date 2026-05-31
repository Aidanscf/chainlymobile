// Lightweight MVP drill library.
// The Analyzer picks drills based on weakest sub-scores.

export const drillsLibrary = {
  Jumps: {
    takeoff: [
      {
        id: "jump_takeoff_1",
        name: "Pump-to-pop reps",
        goal: "Get a smooth, repeatable takeoff without yanking.",
        steps: [
          "Roll the same jump at 3 speeds",
          "Pump through the lip (no pull)",
          "Land centered and quiet",
        ],
        time: "8 min",
        difficulty: "Easy",
      },
    ],
    air: [
      {
        id: "jump_air_1",
        name: "Straight-air stability",
        goal: "Stay neutral and calm in the air.",
        steps: [
          "Pick a small jump",
          "Focus on neutral hips",
          "Keep hands quiet through landing",
        ],
        time: "6 min",
        difficulty: "Easy",
      },
    ],
    landing: [
      {
        id: "jump_land_1",
        name: "Soft-landing focus",
        goal: "Absorb impact and keep traction.",
        steps: [
          "Land with bent knees",
          "Exhale on impact",
          "Ride away smoothly (no brake grab)",
        ],
        time: "7 min",
        difficulty: "Medium",
      },
    ],
    speed: [
      {
        id: "jump_speed_1",
        name: "Speed repeats",
        goal: "Dial approach speed so you’re not braking on the lip.",
        steps: [
          "Pick a marker before the jump",
          "Brake only before the marker",
          "Coast from marker to takeoff",
        ],
        time: "10 min",
        difficulty: "Medium",
      },
    ],
  },

  Drops: {
    body: [
      {
        id: "drop_body_1",
        name: "Drop posture holds",
        goal: "Build a safe, confident drop stance.",
        steps: [
          "Practice hips-back stance on flat",
          "Add small curb drops",
          "Keep heavy feet + tall chest",
        ],
        time: "8 min",
        difficulty: "Easy",
      },
    ],
    brake: [
      {
        id: "drop_brake_1",
        name: "Brake-release reps",
        goal: "Learn to release brakes as you commit.",
        steps: [
          "Brake hard BEFORE the edge",
          "Release at the edge",
          "Land loose and centered",
        ],
        time: "6 min",
        difficulty: "Medium",
      },
    ],
    absorb: [
      {
        id: "drop_absorb_1",
        name: "Absorption bounces",
        goal: "Increase landing absorption without collapsing.",
        steps: [
          "Do 5 small drops",
          "Absorb with legs, then stand",
          "Aim for silent landings",
        ],
        time: "7 min",
        difficulty: "Medium",
      },
    ],
    line: [
      {
        id: "drop_line_1",
        name: "Spot-the-landing",
        goal: "Pick and commit to a landing zone.",
        steps: [
          "Stop and point to the landing",
          "Roll in and keep eyes there",
          "Repeat 3 times",
        ],
        time: "5 min",
        difficulty: "Easy",
      },
    ],
  },

  Cornering: {
    entry: [
      {
        id: "corner_entry_1",
        name: "Brake-set-go",
        goal: "Set speed early so you can commit to the turn.",
        steps: [
          "Brake on the straight",
          "Release before entry",
          "Roll through the turn smoothly",
        ],
        time: "8 min",
        difficulty: "Easy",
      },
    ],
    lean: [
      {
        id: "corner_lean_1",
        name: "Lean drills",
        goal: "Separate bike lean from body lean.",
        steps: [
          "Find a mellow berm",
          "Lean the bike under you",
          "Keep head level and eyes up",
        ],
        time: "8 min",
        difficulty: "Medium",
      },
    ],
    outside: [
      {
        id: "corner_outside_1",
        name: "Outside-foot focus",
        goal: "Lock in traction with heavy feet.",
        steps: [
          "Outside foot down",
          "Press through the pedal",
          "Light hands, elbows out",
        ],
        time: "6 min",
        difficulty: "Easy",
      },
    ],
    exit: [
      {
        id: "corner_exit_1",
        name: "Exit sprints",
        goal: "Build exit drive for speed.",
        steps: [
          "Pick a corner",
          "Stand up at exit",
          "Sprint 3–4 pedal strokes",
        ],
        time: "6 min",
        difficulty: "Medium",
      },
    ],
  },

  "Steep Tech": {
    braking: [
      {
        id: "tech_brake_1",
        name: "Feather-brake reps",
        goal: "Stay in control without skidding.",
        steps: [
          "Light brake pulses",
          "Release over obstacles",
          "Aim for quiet wheels",
        ],
        time: "7 min",
        difficulty: "Medium",
      },
    ],
    position: [
      {
        id: "tech_pos_1",
        name: "Steep stance",
        goal: "Find a stable position that keeps traction.",
        steps: [
          "Hips back, elbows soft",
          "Heavy feet, light hands",
          "Repeat on a short chute",
        ],
        time: "6 min",
        difficulty: "Easy",
      },
    ],
    vision: [
      {
        id: "tech_vision_1",
        name: "Look-ahead laps",
        goal: "Stop target-fixation and pick smoother lines.",
        steps: [
          "Call out your next 2 moves",
          "Eyes to the safe-out",
          "Repeat 3 laps",
        ],
        time: "8 min",
        difficulty: "Easy",
      },
    ],
    traction: [
      {
        id: "tech_trac_1",
        name: "Smooth-inputs run",
        goal: "Improve traction with smoother control.",
        steps: [
          "One-finger braking",
          "No sudden steering",
          "Let the bike move under you",
        ],
        time: "8 min",
        difficulty: "Medium",
      },
    ],
  },
};

export const recommendedVideos = {
  Jumps: [
    { title: "Takeoff timing basics", url: "https://www.youtube.com" },
    {
      title: "Landing absorption (trail-friendly)",
      url: "https://www.youtube.com",
    },
  ],
  Drops: [
    { title: "Drop body position", url: "https://www.youtube.com" },
    { title: "Braking timing for drops", url: "https://www.youtube.com" },
  ],
  Cornering: [
    { title: "Outside foot pressure", url: "https://www.youtube.com" },
    { title: "Berm technique", url: "https://www.youtube.com" },
  ],
  "Steep Tech": [
    { title: "Steep braking control", url: "https://www.youtube.com" },
    { title: "Vision and line choice", url: "https://www.youtube.com" },
  ],
};
