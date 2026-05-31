// Mock Trailforks-style data + helpers
// Note: This project is JavaScript-first. We keep the types as JSDoc so this can
// be swapped to TypeScript later without changing call sites.

import { riderCharacter } from "@/data/mock";

/**
 * @typedef {"green"|"blue"|"black"|"double_black"} TrailDifficulty
 */

/**
 * @typedef {Object} Destination
 * @property {string} id
 * @property {string} name
 * @property {string} region
 * @property {number} lat
 * @property {number} lng
 */

/**
 * @typedef {Object} Trail
 * @property {string} id
 * @property {string} destinationId
 * @property {string} name
 * @property {TrailDifficulty} difficulty
 * @property {number} distanceKm
 * @property {number} climbingM
 * @property {string[]} tags
 * @property {string} image
 */

/**
 * @typedef {Object} TripPlanEntry
 * @property {string} id
 * @property {"ride"|"lunch"|"shop"|"recovery"} type
 * @property {string} title
 * @property {string} time
 * @property {string} duration
 * @property {string} tips
 * @property {string[]=} trailIds
 */

/**
 * @typedef {Object} TripPlanDay
 * @property {string} id
 * @property {number} dayIndex
 * @property {string} title
 * @property {TripPlanEntry[]} entries
 */

/**
 * @typedef {Object} TripPlan
 * @property {string} id
 * @property {Destination} destination
 * @property {number} durationDays
 * @property {Object} riderProfile
 * @property {Object} preferences
 * @property {Object} constraints
 * @property {TripPlanDay[]} itineraryDays
 * @property {Trail[]} featuredTrails
 * @property {Object} logistics
 * @property {Object} essentials
 * @property {{id: string, label: string, checked: boolean}[]} packingChecklist
 * @property {{title: string, subtitle: string, badges: string[], topTrails: string[]}} shareCardData
 * @property {{distanceKm: number, climbingM: number}} summary
 */

export const destinations = /** @type {Destination[]} */ ([
  {
    id: "whistler",
    name: "Whistler, BC",
    region: "Canada",
    lat: 50.1163,
    lng: -122.9574,
  },
  {
    id: "squamish",
    name: "Squamish, BC",
    region: "Canada",
    lat: 49.7016,
    lng: -123.1558,
  },
  {
    id: "bentonville",
    name: "Bentonville, AR",
    region: "USA",
    lat: 36.3729,
    lng: -94.2088,
  },
  {
    id: "moab",
    name: "Moab, UT",
    region: "USA",
    lat: 38.5733,
    lng: -109.5498,
  },
  {
    id: "sedona",
    name: "Sedona, AZ",
    region: "USA",
    lat: 34.8697,
    lng: -111.761,
  },
  {
    id: "finale",
    name: "Finale Ligure, IT",
    region: "Europe",
    lat: 44.1698,
    lng: 8.343,
  },
]);

export const trails = /** @type {Trail[]} */ ([
  {
    id: "trail-a-line",
    destinationId: "whistler",
    name: "A‑Line",
    difficulty: "black",
    distanceKm: 4.2,
    climbingM: 40,
    tags: ["bike_park", "jumps", "flow"],
    image:
      "https://images.unsplash.com/photo-1520975958225-71c5d1f6a9b9?w=1200&h=800&fit=crop",
  },
  {
    id: "trail-crank-it-up",
    destinationId: "whistler",
    name: "Crank It Up",
    difficulty: "blue",
    distanceKm: 5.8,
    climbingM: 30,
    tags: ["flow", "berms"],
    image:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200&h=800&fit=crop",
  },
  {
    id: "trail-garbanzo",
    destinationId: "whistler",
    name: "Garbanzo Zone",
    difficulty: "double_black",
    distanceKm: 10.4,
    climbingM: 90,
    tags: ["steep", "tech", "big_views"],
    image:
      "https://images.unsplash.com/photo-1471217410815-faa4d31f1533?w=1200&h=800&fit=crop",
  },

  {
    id: "trail-rupert",
    destinationId: "squamish",
    name: "Rupert",
    difficulty: "black",
    distanceKm: 3.6,
    climbingM: 280,
    tags: ["tech", "roots", "steep"],
    image:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200&h=800&fit=crop",
  },
  {
    id: "trail-half-nelson",
    destinationId: "squamish",
    name: "Half Nelson",
    difficulty: "blue",
    distanceKm: 4.9,
    climbingM: 210,
    tags: ["flow", "rollers"],
    image:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200&h=800&fit=crop",
  },

  {
    id: "trail-coler-rtl",
    destinationId: "bentonville",
    name: "Coler ‘Ride the Lightning’",
    difficulty: "black",
    distanceKm: 2.7,
    climbingM: 60,
    tags: ["jumps", "flow", "features"],
    image:
      "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1200&h=800&fit=crop",
  },
  {
    id: "trail-slaughter-pen",
    destinationId: "bentonville",
    name: "Slaughter Pen Flow Loops",
    difficulty: "blue",
    distanceKm: 12.2,
    climbingM: 240,
    tags: ["flow", "xc"],
    image:
      "https://images.unsplash.com/photo-1520975958225-71c5d1f6a9b9?w=1200&h=800&fit=crop",
  },

  {
    id: "trail-porcupine-rim",
    destinationId: "moab",
    name: "Porcupine Rim",
    difficulty: "black",
    distanceKm: 22.0,
    climbingM: 620,
    tags: ["enduro", "tech", "big_views"],
    image:
      "https://images.unsplash.com/photo-1471217410815-faa4d31f1533?w=1200&h=800&fit=crop",
  },
  {
    id: "trail-slickrock",
    destinationId: "moab",
    name: "Slickrock (Main Loop)",
    difficulty: "black",
    distanceKm: 16.5,
    climbingM: 520,
    tags: ["tech", "rocks", "iconic"],
    image:
      "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1200&h=800&fit=crop",
  },

  {
    id: "trail-hiline",
    destinationId: "sedona",
    name: "HiLine",
    difficulty: "black",
    distanceKm: 4.0,
    climbingM: 180,
    tags: ["tech", "exposure", "views"],
    image:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200&h=800&fit=crop",
  },
  {
    id: "trail-bell-rock",
    destinationId: "sedona",
    name: "Bell Rock Pathway (Cruiser)",
    difficulty: "green",
    distanceKm: 8.5,
    climbingM: 90,
    tags: ["xc", "views", "recovery"],
    image:
      "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1200&h=800&fit=crop",
  },

  {
    id: "trail-manestra",
    destinationId: "finale",
    name: "Manestra (Shuttle Classic)",
    difficulty: "black",
    distanceKm: 6.9,
    climbingM: 80,
    tags: ["enduro", "flow", "coastal"],
    image:
      "https://images.unsplash.com/photo-1471217410815-faa4d31f1533?w=1200&h=800&fit=crop",
  },
  {
    id: "trail-crestino",
    destinationId: "finale",
    name: "Crestino (Tech Spice)",
    difficulty: "black",
    distanceKm: 5.2,
    climbingM: 110,
    tags: ["tech", "rocks", "coastal"],
    image:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200&h=800&fit=crop",
  },
]);

const eatsByDestination = {
  whistler: [
    {
      id: "eat-1",
      name: "Creekside Burrito Bar",
      rating: 4.7,
      vibe: "Post-ride fuel",
    },
    {
      id: "eat-2",
      name: "Village Pizza Slice",
      rating: 4.5,
      vibe: "Quick carbs",
    },
  ],
  squamish: [
    {
      id: "eat-1",
      name: "Coffee + Donuts",
      rating: 4.6,
      vibe: "Early shuttle squad",
    },
    {
      id: "eat-2",
      name: "Tacos by the River",
      rating: 4.4,
      vibe: "Chill vibes",
    },
  ],
  bentonville: [
    {
      id: "eat-1",
      name: "Downtown Smash Burger",
      rating: 4.8,
      vibe: "Rider favorite",
    },
    { id: "eat-2", name: "Local BBQ Plate", rating: 4.6, vibe: "Big portions" },
  ],
  moab: [
    {
      id: "eat-1",
      name: "Desert Diner",
      rating: 4.5,
      vibe: "Breakfast mission",
    },
    { id: "eat-2", name: "Sunset Thai", rating: 4.6, vibe: "Recovery bowl" },
  ],
  sedona: [
    { id: "eat-1", name: "Smoothie Spot", rating: 4.7, vibe: "Easy recovery" },
    { id: "eat-2", name: "Southwest Grill", rating: 4.5, vibe: "Big views" },
  ],
  finale: [
    {
      id: "eat-1",
      name: "Focaccia + Espresso",
      rating: 4.8,
      vibe: "Italian carbs",
    },
    { id: "eat-2", name: "Gelato Break", rating: 4.7, vibe: "Mandatory" },
  ],
};

const staysByDestination = {
  whistler: [
    { id: "stay-1", name: "Rider Lodge", rating: 4.7, type: "Lodge" },
    { id: "stay-2", name: "Creekside Cabin", rating: 4.6, type: "Cabin" },
  ],
  squamish: [
    { id: "stay-1", name: "Trailhead Motel", rating: 4.4, type: "Motel" },
    { id: "stay-2", name: "Vanlife Camp", rating: 4.5, type: "Camp" },
  ],
  bentonville: [
    { id: "stay-1", name: "Downtown Loft", rating: 4.7, type: "Apartment" },
    { id: "stay-2", name: "Bike Hotel", rating: 4.6, type: "Hotel" },
  ],
  moab: [
    { id: "stay-1", name: "Red Rock Inn", rating: 4.5, type: "Hotel" },
    { id: "stay-2", name: "River Camp", rating: 4.6, type: "Camp" },
  ],
  sedona: [
    { id: "stay-1", name: "Desert Retreat", rating: 4.6, type: "Hotel" },
    { id: "stay-2", name: "Cabin w/ View", rating: 4.7, type: "Cabin" },
  ],
  finale: [
    { id: "stay-1", name: "Coastal B&B", rating: 4.7, type: "B&B" },
    { id: "stay-2", name: "Rider Hostel", rating: 4.5, type: "Hostel" },
  ],
};

export function getDestinationById(id) {
  return destinations.find((d) => d.id === id) || null;
}

export function listTrailsForDestination(destinationId) {
  return trails.filter((t) => t.destinationId === destinationId);
}

export function getTrailById(trailId) {
  return trails.find((t) => t.id === trailId) || null;
}

function sum(arr) {
  return arr.reduce((a, b) => a + b, 0);
}

function pickTopTrails({ destinationId, count = 6, preferences }) {
  const all = listTrailsForDestination(destinationId);

  const wants = new Set(
    [
      ...(preferences?.terrainTags || []),
      preferences?.wantsFlow ? "flow" : null,
      preferences?.wantsTech ? "tech" : null,
      preferences?.wantsJumps ? "jumps" : null,
    ].filter(Boolean),
  );

  const scored = all
    .map((t) => {
      const tagHits = (t.tags || []).filter((x) => wants.has(x)).length;
      const difficultyBoost =
        preferences?.difficulty === "easy" && t.difficulty === "green"
          ? 0.5
          : preferences?.difficulty === "medium" &&
              (t.difficulty === "blue" || t.difficulty === "green")
            ? 0.35
            : preferences?.difficulty === "hard" &&
                (t.difficulty === "black" || t.difficulty === "double_black")
              ? 0.5
              : 0;

      return { trail: t, score: tagHits + difficultyBoost };
    })
    .sort((a, b) => b.score - a.score)
    .map((x) => x.trail);

  return scored.slice(0, count);
}

export function createTripPlanPreview({
  destination,
  durationDays,
  riderProfile,
  preferences,
  constraints,
}) {
  const picked = pickTopTrails({
    destinationId: destination.id,
    count: 5,
    preferences,
  });

  const safePicked = picked.length
    ? picked
    : [
        {
          id: `trail-fallback-${destination.id}`,
          destinationId: destination.id,
          name: "Local loop (AI fallback)",
          difficulty: "blue",
          distanceKm: 12,
          climbingM: 350,
          tags: ["flow"],
          image:
            "https://images.unsplash.com/photo-1520975958225-71c5d1f6a9b9?w=1200&h=800&fit=crop",
        },
      ];

  const distanceKm = Math.round(sum(safePicked.map((t) => t.distanceKm)));
  const climbingM = Math.round(sum(safePicked.map((t) => t.climbingM)));

  const itineraryDays = Array.from({ length: durationDays }).map((_, idx) => {
    const t = safePicked[idx % safePicked.length];
    return {
      id: `day-${idx + 1}`,
      dayIndex: idx,
      title: `Day ${idx + 1}: ${idx === 0 ? "Warm‑up laps" : idx === durationDays - 1 ? "Best hits" : "Adventure day"}`,
      entries: [
        {
          id: `d${idx}-morning`,
          type: "ride",
          title: `Morning ride: ${t?.name || "Flow sampler"}`,
          time: "9:30 AM",
          duration: "2h",
          tips: "Start easy, let your tires wake up.",
          trailIds: t ? [t.id] : [],
        },
        {
          id: `d${idx}-lunch`,
          type: "lunch",
          title: "Lunch: quick carbs + hydration",
          time: "12:15 PM",
          duration: "45m",
          tips: "Bonus points: electrolytes.",
        },
        {
          id: `d${idx}-afternoon`,
          type: "ride",
          title: "Afternoon ride: pick your spice",
          time: "1:30 PM",
          duration: "2h",
          tips: "If you’re feeling good, add one ‘sendy’ lap.",
          trailIds: t ? [t.id] : [],
        },
      ],
    };
  });

  const topTrailNames = safePicked.slice(0, 3).map((t) => t.name);

  /** @type {TripPlan} */
  const plan = {
    id: String(Date.now()),
    destination,
    durationDays,
    riderProfile: riderProfile || {
      skillLevel: riderCharacter?.overall > 84 ? "Advanced" : "Intermediate",
      fitness: riderCharacter?.overall > 88 ? "High" : "Medium",
      bikeType: "Trail",
      strengths: (riderCharacter?.strengths || []).slice(0, 3),
    },
    preferences: preferences || {
      difficulty: "medium",
      terrainTags: ["flow"],
      wantsJumps: true,
      wantsTech: false,
      wantsFlow: true,
    },
    constraints: constraints || {
      budget: "$$",
      accommodationType: "Lodge",
      groupSize: 2,
    },
    itineraryDays,
    featuredTrails: safePicked,
    logistics: {
      stay: (staysByDestination[destination.id] || []).slice(0, 2),
      eat: (eatsByDestination[destination.id] || []).slice(0, 2),
    },
    essentials: {
      safetyNotes: [
        "Do a quick bolt check before Day 1.",
        "Pack layers — temps change fast on descents.",
      ],
      accessNotes: [
        "Respect trail closures + signage.",
        "Ride within your limits — big days stack fatigue.",
      ],
    },
    packingChecklist: [
      { id: "pack-1", label: "Spare tube + levers", checked: false },
      { id: "pack-2", label: "Mini‑pump / CO₂", checked: false },
      { id: "pack-3", label: "Multi‑tool + quick link", checked: false },
      { id: "pack-4", label: "Knee pads (you’ll thank me)", checked: false },
      { id: "pack-5", label: "Light rain shell", checked: false },
    ],
    shareCardData: {
      title: `${destination.name} Trip Plan`,
      subtitle: `${durationDays} day${durationDays === 1 ? "" : "s"} • Built for your vibe`,
      badges: ["Tech Flow", "Rider Favorite"],
      topTrails: topTrailNames,
    },
    summary: { distanceKm, climbingM },
  };

  return plan;
}

export function hydrateTripPlanToFull(plan) {
  if (!plan) {
    return null;
  }

  // Add a bit more detail so the UI feels "full itinerary".
  const nextDays = (plan.itineraryDays || []).map((d, idx) => {
    const extra = {
      id: `d${idx}-recovery`,
      type: "recovery",
      title:
        idx === 0
          ? "Recovery: mobility + snack"
          : "Recovery: legs up, feet out",
      time: "4:30 PM",
      duration: "30m",
      tips: "A quick stretch now = more speed tomorrow.",
    };

    const shop = {
      id: `d${idx}-shop`,
      type: "shop",
      title: "Optional: shop check + tire top-up",
      time: "5:15 PM",
      duration: "20m",
      tips: "Fresh sealant is a love language.",
    };

    return {
      ...d,
      entries: [...(d.entries || []), extra, shop],
    };
  });

  const next = {
    ...plan,
    itineraryDays: nextDays,
  };

  return next;
}

export function formatDifficultyLabel(difficulty) {
  if (difficulty === "green") return "Green";
  if (difficulty === "blue") return "Blue";
  if (difficulty === "black") return "Black";
  if (difficulty === "double_black") return "Double Black";
  return "";
}

export function difficultyTone(difficulty) {
  if (difficulty === "green") return "green";
  if (difficulty === "blue") return "neutral";
  if (difficulty === "black") return "red";
  if (difficulty === "double_black") return "red";
  return "neutral";
}
