// Lightweight personalization (MVP). No API.

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function skillValue(riderCharacter, key) {
  const skills = riderCharacter?.skills || [];
  const hit = skills.find((s) => s.key === key);
  return Number(hit?.value || 0);
}

function terrainPrefToTags(list) {
  const prefs = Array.isArray(list) ? list : [];
  const tags = [];

  for (const p of prefs) {
    if (p === "Tech") tags.push("tech");
    if (p === "Flow") tags.push("flow");
    if (p === "Jumps") tags.push("park");
    if (p === "Steeps") tags.push("tech");
    if (p === "Climbs") tags.push("epic");
  }

  return [...new Set(tags)];
}

function disciplineToTags(discipline) {
  if (discipline === "XC") return ["epic", "climbing", "flow"];
  if (discipline === "DH/Bike Park") return ["park", "tech"];
  if (discipline === "Enduro") return ["tech", "epic"];
  if (discipline === "Gravel/Road") return ["epic", "climbing"];
  return ["flow", "tech"]; // Trail default
}

function skillPenaltyForTag({ tag, skillLevel }) {
  // Encourage beginners away from super-gnarly defaults.
  if (skillLevel !== "Beginner") {
    return 0;
  }

  if (tag === "tech") return 0.08;
  if (tag === "park") return 0.12;
  if (tag === "epic") return 0.06;
  return 0;
}

function tagAffinityScore({ tag, riderCharacter, userProfile }) {
  // 0..1
  const tech = skillValue(riderCharacter, "tech") / 100;
  const flow = skillValue(riderCharacter, "flow") / 100;
  const climbing = skillValue(riderCharacter, "climbing") / 100;
  const jumping = skillValue(riderCharacter, "jumping") / 100;
  const drops = skillValue(riderCharacter, "drops") / 100;
  const cornering = skillValue(riderCharacter, "cornering") / 100;

  let base = 0.5;
  if (tag === "tech") base = tech;
  if (tag === "flow") base = clamp((flow + cornering) / 2, 0, 1);
  if (tag === "park") base = clamp((jumping + drops) / 2, 0, 1);
  if (tag === "epic") base = climbing;

  // --- NEW: profile-based preferences boost (discipline + terrain + skill)
  const terrainTags = terrainPrefToTags(userProfile?.terrainPreference);
  const disciplineTags = disciplineToTags(userProfile?.primaryDiscipline);
  const wants = new Set([...terrainTags, ...disciplineTags]);

  const preferenceBoost = wants.has(tag) ? 0.18 : 0;
  const penalty = skillPenaltyForTag({
    tag,
    skillLevel: userProfile?.skillLevel,
  });

  return clamp(base + preferenceBoost - penalty, 0, 1);
}

export function scoreDestination({ destination, riderCharacter, userProfile }) {
  const baseTrending = clamp(Number(destination?.trendingScore || 0), 0, 100);

  const tags = Array.isArray(destination?.tags) ? destination.tags : [];
  const tagBoost = tags
    .map((t) => tagAffinityScore({ tag: t, riderCharacter, userProfile }))
    .reduce((a, b) => a + b, 0);

  // Weight: trending matters, but we bias toward fit.
  const fit = clamp(tagBoost / Math.max(1, tags.length), 0, 1);

  // Slightly favor fit when we have profile data.
  const hasProfile = !!userProfile;
  const wTrending = hasProfile ? 0.56 : 0.62;
  const wFit = 1 - wTrending;

  const score = baseTrending * wTrending + fit * 100 * wFit;

  return score;
}

export function whyFitsYou({ destination, riderCharacter, userProfile }) {
  const tags = Array.isArray(destination?.tags) ? destination.tags : [];
  const hasTech = tags.includes("tech");
  const hasFlow = tags.includes("flow");
  const hasPark = tags.includes("park");
  const hasEpic = tags.includes("epic");

  const flowV = skillValue(riderCharacter, "flow");
  const techV = skillValue(riderCharacter, "tech");
  const climbV = skillValue(riderCharacter, "climbing");
  const jumpV = skillValue(riderCharacter, "jumping");

  const terrainWants = terrainPrefToTags(userProfile?.terrainPreference);
  const wantsSet = new Set(terrainWants);

  if (wantsSet.has("tech") && hasTech) {
    return "Matches your Tech preference";
  }
  if (wantsSet.has("flow") && hasFlow) {
    return "Matches your Flow preference";
  }
  if (wantsSet.has("park") && hasPark) {
    return "Matches your Jumps / park preference";
  }
  if (wantsSet.has("epic") && hasEpic) {
    return "Matches your Climbs preference";
  }

  if (hasTech && hasFlow && techV >= 72 && flowV >= 82) {
    return "Perfect for your Tech + Flow strengths";
  }
  if (hasEpic && climbV >= 86) {
    return "Built for your climbing engine — earned views included";
  }
  if (hasPark && jumpV >= 70) {
    return "A playground for your jumps — safe progression laps";
  }
  if (hasFlow && flowV >= 86) {
    return "Flow-forward trails that match your smooth style";
  }

  // Default — still friendly.
  const vibe = hasTech ? "tech" : hasFlow ? "flow" : hasPark ? "park" : "epic";

  return `Great fit if you want more ${vibe} days`;
}

export function pickSuggestedDuration(destination) {
  const list = Array.isArray(destination?.recommendedDurations)
    ? destination.recommendedDurations
    : [];

  // Prefer 2 days, else first.
  const two = list.find((x) => String(x).toLowerCase().includes("2"));
  return two || list[0] || "2 days";
}

export function durationLabelToDays(label) {
  const t = String(label || "").toLowerCase();
  if (t.includes("half")) return 1;
  if (t.includes("3") || t.includes("5")) return 4;
  const match = t.match(/(\d+)/);
  if (match?.[1]) return Number(match[1]);
  return 2;
}
