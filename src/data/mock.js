export const userData = {
  name: "Alex",
  stats: {
    climbing: 88,
    endurance: 92,
    speed: 78,
    sprint: 85,
  },
  stravaConnected: false,
  streak: 12,
  totalRides: 145,
};

export const bikes = [
  {
    id: "1",
    name: "Trailblazer Pro",
    level: 8,
    healthScore: 75,
    image:
      "https://images.unsplash.com/photo-1576435728678-68d0fbf94e91?w=800&h=600&fit=crop",
    quests: [
      { id: "1", title: "Chain Lubrication", completed: true, urgent: false },
      { id: "2", title: "Tire Pressure Check", completed: true, urgent: false },
    ],
    questStats: { dueSoon: 2, urgent: 0 },
  },
  {
    id: "2",
    name: "Urban Explorer",
    level: 6,
    healthScore: 40,
    image:
      "https://images.unsplash.com/photo-1571333250630-f0230c320b6d?w=800&h=600&fit=crop",
    quests: [
      {
        id: "3",
        title: "Brake Pad Replacement",
        completed: true,
        urgent: true,
      },
    ],
    questStats: { dueSoon: 0, urgent: 1 },
  },
];

// --- Garage / Bike detail mock data (clean structure for future backend swap) ---
export const bikeDetailsById = {
  1: {
    parts: {
      brakes: 62,
      chain: 84,
      suspension: 78,
      tires: 90,
    },
    componentHealth: [
      { key: "brakes", label: "Brakes", score: 62, icon: "brakes" },
      { key: "chain", label: "Chain", score: 84, icon: "chain" },
      { key: "tires", label: "Tires", score: 90, icon: "tires" },
      { key: "drivetrain", label: "Drivetrain", score: 74, icon: "shield" },
      { key: "frame", label: "Frame", score: 96, icon: "shield" },
      { key: "suspension", label: "Suspension", score: 78, icon: "suspension" },
    ],
    maintenance: {
      urgent: [{ id: "u1", title: "Bleed rear brake" }],
      dueSoon: [
        { id: "d1", title: "Clean drivetrain" },
        { id: "d2", title: "Check shock pressure" },
      ],
      completed: [
        { id: "c1", title: "Chain Lubrication" },
        { id: "c2", title: "Tire Pressure Check" },
      ],
    },
    specPreview: [
      { label: "Frame", value: 'Alloy Trail Frame, 29"' },
      { label: "Fork", value: "Fox 36, 150mm" },
      { label: "Shock", value: "Fox Float X" },
      { label: "Drivetrain", value: "SRAM GX Eagle 12sp" },
      { label: "Wheels", value: 'DT Swiss 29"' },
      { label: "Brakes", value: "Shimano SLX 4‑piston" },
    ],
    specSheet: [
      {
        key: "frame",
        title: "Frame & Geometry",
        rows: [
          { label: "Frame", value: 'Alloy Trail Frame, 29"' },
          { label: "Travel", value: "150mm (rear)" },
          { label: "Head Angle", value: "64.5°" },
          { label: "Seat Angle", value: "77°" },
          { label: "Reach", value: "480mm (L)" },
        ],
      },
      {
        key: "drivetrain",
        title: "Drivetrain",
        rows: [
          { label: "Shifter", value: "SRAM GX Eagle" },
          { label: "Derailleur", value: "SRAM GX Eagle" },
          { label: "Cassette", value: "10–52T" },
          { label: "Crank", value: "170mm" },
          { label: "Chain", value: "Eagle 12‑speed" },
        ],
      },
      {
        key: "suspension",
        title: "Suspension",
        rows: [
          { label: "Fork", value: "Fox 36, 150mm" },
          { label: "Shock", value: "Fox Float X" },
          { label: "Setup", value: "Trail (recommended)" },
        ],
      },
      {
        key: "wheels",
        title: "Wheels & Tires",
        rows: [
          { label: "Wheels", value: 'DT Swiss 29"' },
          { label: "Front Tire", value: "Maxxis Assegai 2.5" },
          { label: "Rear Tire", value: "Maxxis DHR II 2.4" },
        ],
      },
      {
        key: "brakes",
        title: "Brakes",
        rows: [
          { label: "Brakes", value: "Shimano SLX 4‑piston" },
          { label: "Rotors", value: "203mm / 180mm" },
          { label: "Pads", value: "Metallic" },
        ],
      },
      {
        key: "cockpit",
        title: "Cockpit & Controls",
        rows: [
          { label: "Handlebar", value: "780mm" },
          { label: "Stem", value: "40mm" },
          { label: "Grips", value: "Lock‑on" },
          { label: "Dropper", value: "150mm" },
        ],
      },
    ],
  },
  2: {
    parts: {
      brakes: 28,
      chain: 58,
      suspension: 45,
      tires: 41,
    },
    componentHealth: [
      { key: "brakes", label: "Brakes", score: 28, icon: "brakes" },
      { key: "chain", label: "Chain", score: 58, icon: "chain" },
      { key: "tires", label: "Tires", score: 41, icon: "tires" },
      { key: "drivetrain", label: "Drivetrain", score: 46, icon: "shield" },
      { key: "frame", label: "Frame", score: 88, icon: "shield" },
      { key: "suspension", label: "Suspension", score: 45, icon: "suspension" },
    ],
    maintenance: {
      urgent: [
        { id: "u1", title: "Brake pad replacement" },
        { id: "u2", title: "True rear wheel" },
      ],
      dueSoon: [{ id: "d1", title: "Chain deep clean" }],
      completed: [{ id: "c1", title: "Quick bolt check" }],
    },
    specPreview: [
      { label: "Frame", value: "Steel commuter frame" },
      { label: "Fork", value: "Rigid" },
      { label: "Drivetrain", value: "Shimano 1x" },
      { label: "Wheels", value: "700c" },
      { label: "Brakes", value: "Mechanical disc" },
      { label: "Tires", value: "38c urban" },
    ],
    specSheet: [
      {
        key: "frame",
        title: "Frame & Geometry",
        rows: [
          { label: "Frame", value: "Steel commuter frame" },
          { label: "Fork", value: "Rigid" },
          { label: "Wheel Size", value: "700c" },
        ],
      },
      {
        key: "drivetrain",
        title: "Drivetrain",
        rows: [
          { label: "Drivetrain", value: "Shimano 1x" },
          { label: "Cassette", value: "11–42T" },
        ],
      },
      {
        key: "wheels",
        title: "Wheels & Tires",
        rows: [
          { label: "Wheels", value: "700c" },
          { label: "Tires", value: "38c urban" },
        ],
      },
      {
        key: "brakes",
        title: "Brakes",
        rows: [
          { label: "Brakes", value: "Mechanical disc" },
          { label: "Rotors", value: "160mm" },
        ],
      },
      {
        key: "cockpit",
        title: "Cockpit & Controls",
        rows: [
          { label: "Handlebar", value: "720mm" },
          { label: "Stem", value: "60mm" },
        ],
      },
    ],
  },
};

export function getBikeById(id) {
  return bikes.find((b) => b.id === id) || null;
}

export function getBikeDetailById(id) {
  return bikeDetailsById[id] || null;
}

// --- Rider Character / Skill Tree mock data ---
export const riderCharacter = {
  // Character badge is now dynamic - set via useUserCharacter store after analysis
  // These are fallback values for when no analysis has been completed yet
  characterName: null, // Will be set dynamically
  subtitle: null, // Will be set dynamically
  avatar: null, // Will be set dynamically - no more hardcoded image
  overall: 0, // Will be set dynamically
  league: {
    tier: "Diamond Tier",
    percentile: "Top 5% of riders",
    rank: 1234,
    delta: 18,
  },
  skills: [
    { key: "jumping", label: "Jumping", value: 72, color: "#FF6A2A" },
    { key: "cornering", label: "Cornering", value: 84, color: "#3B82F6" },
    { key: "drops", label: "Drops", value: 77, color: "#FFB020" },
    { key: "flow", label: "Flow", value: 91, color: "#1FC05B" },
    { key: "tech", label: "Tech", value: 79, color: "#A855F7" },
    { key: "climbing", label: "Climbing", value: 92, color: "#FF3B30" },
  ],
  strengths: ["Strong Climber", "Smooth Flow", "Clean Cornering"],
  highlight: {
    title: "PR on the climb 🔥",
    description: "You shaved 22s off your steepest segment — keep it up.",
    tag: "Share-worthy",
    image:
      "https://images.unsplash.com/photo-1520975958225-71c5d1f6a9b9?w=1200&h=800&fit=crop",
  },
};

export const quickActions = [
  {
    id: "1",
    title: "AI Bike Helper",
    icon: "Wrench",
    route: "/ai/photo-mechanic",
    color: "#FF8C42",
  },
  {
    id: "2",
    title: "Gear Recommender",
    icon: "PackageSearch",
    route: "/ai/gear-recommender",
    color: "#FF8C42",
  },
  {
    id: "3",
    title: "AI Trip Planner",
    icon: "Map",
    route: "/ai/trip-planner",
    color: "#FF8C42",
  },
  {
    id: "4",
    title: "Bike Spec Sheet",
    icon: "ClipboardList",
    // Route to Garage first (user picks a bike), then they can open the spec sheet.
    // This avoids accidentally treating "spec-sheet" as a bikeId ("/garage/spec-sheet" matches /garage/:bikeId).
    route: "/garage",
    color: "#FF8C42",
  },
];

export const leagueData = {
  tier: "Bronze Tier",
  rank: 1234,
  totalPlayers: 98765,
  percentile: "Getting started",
  placesFromPromotion: 32,
  recentPerformance: [
    { week: 1, points: 850 },
    { week: 2, points: 920 },
    { week: 3, points: 880 },
    { week: 4, points: 950 },
  ],
};

export const friends = [
  {
    id: "1",
    name: "Sarah Chen",
    avatar: "https://i.pravatar.cc/150?img=1",
    streak: 15,
    totalRides: 98,
    stats: { climbing: 82, endurance: 90, speed: 75, sprint: 80 },
  },
  {
    id: "2",
    name: "Mike Johnson",
    avatar: "https://i.pravatar.cc/150?img=2",
    streak: 8,
    totalRides: 67,
    stats: { climbing: 75, endurance: 85, speed: 88, sprint: 92 },
  },
  {
    id: "3",
    name: "Emma Davis",
    avatar: "https://i.pravatar.cc/150?img=3",
    streak: 22,
    totalRides: 156,
    stats: { climbing: 90, endurance: 88, speed: 82, sprint: 78 },
  },
];

export default {
  userData,
  bikes,
  bikeDetailsById,
  getBikeById,
  getBikeDetailById,
  quickActions,
  leagueData,
  friends,
  riderCharacter,
};
