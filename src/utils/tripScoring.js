// Trip scoring + personalization helpers

import { riderCharacter } from "@/data/mock";

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

function normalizeStat(value) {
  const v = Number(value || 0);
  return clamp(v / 100, 0, 1);
}

function statByKey(key) {
  const skills = Array.isArray(riderCharacter?.skills)
    ? riderCharacter.skills
    : [];
  const found = skills.find((s) => s.key === key);
  return normalizeStat(found?.value || 0);
}

function sum(arr) {
  return arr.reduce((a, b) => a + b, 0);
}

/**
 * @typedef {Object} TripRecommendation
 * @property {string} id
 * @property {string} destinationId
 * @property {string} destinationLabel
 * @property {string[]} badges
 * @property {string} categoryKey
 * @property {string} categoryLabel
 * @property {number} durationDays
 * @property {string} durationLabel
 * @property {string} summary
 * @property {string} socialProof
 * @property {string[]} preferenceTags
 */

export const TRIP_CATEGORIES = [
  {
    key: "quick_wins",
    label: "Quick Wins (2–3 hours)",
    durationDays: 1,
  },
  {
    key: "weekend_shred",
    label: "Weekend Shred (2 days)",
    durationDays: 2,
  },
  {
    key: "bucket_list",
    label: "Bucket List (3–5 days)",
    durationDays: 4,
  },
];

export const baseTripIdeas = /** @type {TripRecommendation[]} */ ([
  {
    id: "rec-whistler-weekend",
    destinationId: "whistler",
    destinationLabel: "Whistler, BC",
    badges: ["Bike Park", "Tech Flow"],
    categoryKey: "weekend_shred",
    categoryLabel: "Weekend Shred",
    durationDays: 2,
    durationLabel: "2 days",
    summary: "~28 km • 1,300 m",
    socialProof: "Rider Favorite",
    preferenceTags: ["flow", "jumps", "tech"],
  },
  {
    id: "rec-squamish-quick",
    destinationId: "squamish",
    destinationLabel: "Squamish, BC",
    badges: ["Tech", "Enduro"],
    categoryKey: "quick_wins",
    categoryLabel: "Quick Wins",
    durationDays: 1,
    durationLabel: "2–3 hours",
    summary: "~16 km • 700 m",
    socialProof: "Local Legend",
    preferenceTags: ["tech", "climbing"],
  },
  {
    id: "rec-bentonville-weekend",
    destinationId: "bentonville",
    destinationLabel: "Bentonville, AR",
    badges: ["Flow", "Jumps"],
    categoryKey: "weekend_shred",
    categoryLabel: "Weekend Shred",
    durationDays: 2,
    durationLabel: "2 days",
    summary: "~34 km • 600 m",
    socialProof: "Fast + Fun",
    preferenceTags: ["flow", "jumps"],
  },
  {
    id: "rec-moab-bucket",
    destinationId: "moab",
    destinationLabel: "Moab, UT",
    badges: ["Enduro", "Big Views"],
    categoryKey: "bucket_list",
    categoryLabel: "Bucket List",
    durationDays: 4,
    durationLabel: "4 days",
    summary: "~62 km • 2,200 m",
    socialProof: "Iconic Lines",
    preferenceTags: ["tech", "climbing"],
  },
  {
    id: "rec-sedona-quick",
    destinationId: "sedona",
    destinationLabel: "Sedona, AZ",
    badges: ["Tech", "Views"],
    categoryKey: "quick_wins",
    categoryLabel: "Quick Wins",
    durationDays: 1,
    durationLabel: "2–3 hours",
    summary: "~18 km • 650 m",
    socialProof: "Spicy + Scenic",
    preferenceTags: ["tech", "views"],
  },
  {
    id: "rec-finale-bucket",
    destinationId: "finale",
    destinationLabel: "Finale Ligure, IT",
    badges: ["Enduro", "Coastal"],
    categoryKey: "bucket_list",
    categoryLabel: "Bucket List",
    durationDays: 4,
    durationLabel: "4 days",
    summary: "~55 km • 1,900 m",
    socialProof: "Euro Dream",
    preferenceTags: ["flow", "tech"],
  },
]);

export function scoreTripForRider(trip) {
  const tags = new Set(trip.preferenceTags || []);

  // riderCharacter skills: jumping / cornering / drops / flow / tech / climbing
  const sJump = statByKey("jumping");
  const sFlow = statByKey("flow");
  const sTech = statByKey("tech");
  const sClimb = statByKey("climbing");

  const tagScore = sum([
    tags.has("jumps") ? sJump * 1.2 : 0,
    tags.has("flow") ? sFlow * 1.2 : 0,
    tags.has("tech") ? sTech * 1.15 : 0,
    tags.has("climbing") ? sClimb * 1.05 : 0,
    tags.has("views") ? 0.25 : 0,
  ]);

  const durationScore =
    trip.categoryKey === "quick_wins"
      ? 0.25
      : trip.categoryKey === "weekend_shred"
        ? 0.2
        : 0.1;

  const socialBoost = String(trip.socialProof || "")
    .toLowerCase()
    .includes("favorite")
    ? 0.2
    : 0;

  return tagScore + durationScore + socialBoost;
}

export function rankTripsForRider(tripsList) {
  const list = Array.isArray(tripsList) ? tripsList : [];
  return list
    .map((t) => ({ trip: t, score: scoreTripForRider(t) }))
    .sort((a, b) => b.score - a.score)
    .map((x) => x.trip);
}

export function groupTripsByCategory(tripsList) {
  const list = Array.isArray(tripsList) ? tripsList : [];
  const grouped = {
    quick_wins: [],
    weekend_shred: [],
    bucket_list: [],
  };

  for (const t of list) {
    if (grouped[t.categoryKey]) {
      grouped[t.categoryKey].push(t);
    }
  }

  return grouped;
}

export function whyThisFitsText({ trip, riderProfile, preferences }) {
  const strengths = Array.isArray(riderProfile?.strengths)
    ? riderProfile.strengths
    : riderCharacter?.strengths || [];

  const topStrength = strengths[0] || "Strong Flow";

  const wantsTech = Boolean(preferences?.wantsTech);
  const wantsFlow = Boolean(preferences?.wantsFlow);
  const wantsJumps = Boolean(preferences?.wantsJumps);

  const parts = [];
  if (wantsTech) parts.push("Tech");
  if (wantsFlow) parts.push("Flow");
  if (wantsJumps) parts.push("Jumps");

  const vibe = parts.length ? parts.join(" + ") : "Good Times";

  return `${vibe} + ${trip?.socialProof || "big smiles"} — perfect for your ${topStrength} stats.`;
}

export default {
  TRIP_CATEGORIES,
  baseTripIdeas,
  scoreTripForRider,
  rankTripsForRider,
  groupTripsByCategory,
  whyThisFitsText,
};
