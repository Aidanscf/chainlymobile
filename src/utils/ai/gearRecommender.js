import { colors } from "@/theme/index";
import { checkCompatibility, buildWhyThisFitsCopy } from "../compatibility";
import { startAIJob, waitForAIJob } from "@/services/aiJobClient";

export const INTENT_OPTIONS = [
  { key: "upgrade", label: "Upgrade" },
  { key: "replace", label: "Replace" },
  { key: "find", label: "Find Part" },
];

export const FOCUS_OPTIONS = [
  { key: "drivetrain", label: "Drivetrain (Cassette/Chain)" },
  { key: "brakes", label: "Brakes" },
  { key: "suspension", label: "Suspension" },
  { key: "wheels_tires", label: "Wheels & Tires" },
  { key: "cockpit", label: "Cockpit" },
];

export const REGION_OPTIONS = [
  { key: "usa", label: "USA" },
  { key: "canada", label: "Canada" },
  { key: "eu", label: "EU" },
];

export const BUDGET_PRESETS = [
  { key: "$", label: "$" },
  { key: "$$", label: "$$" },
  { key: "$$$", label: "$$$" },
];

export function focusToCategoryLabel(focusKey) {
  const found = FOCUS_OPTIONS.find((x) => x.key === focusKey);
  return found?.label || "Component";
}

// Mock product catalog (MVP). Clean shape so it can be replaced by real product APIs later.
export const mockProducts = [
  {
    id: "p1",
    focus: "drivetrain",
    name: "SRAM XG‑1275 GX Eagle Cassette (10–52T)",
    image:
      "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1200&h=900&fit=crop",
    price: "$215–$250",
    match: 98,
    retailer: "Jenson",
    affiliateUrl: "https://example.com",
    trust: ["Fit guaranteed", "Matches your climbing"],
    standards: { driver: "XD", speedCount: 12 },
    attrs: {
      weight: "450g",
      durability: "High",
      ridingFit: "All‑Mountain",
      compatibility: "XD • 12‑speed",
    },
  },
  {
    id: "p2",
    focus: "drivetrain",
    name: "Shimano Deore 12‑speed Cassette (10–51T)",
    image:
      "https://images.unsplash.com/photo-1520975958225-71c5d1f6a9b9?w=1200&h=900&fit=crop",
    price: "$95–$120",
    match: 86,
    retailer: "Amazon",
    affiliateUrl: "https://example.com",
    trust: ["Value pick", "Solid durability"],
    standards: { driver: "MicroSpline", speedCount: 12 },
    attrs: {
      weight: "470g",
      durability: "Med‑High",
      ridingFit: "Trail",
      compatibility: "MicroSpline • 12‑speed",
    },
  },
  {
    id: "p3",
    focus: "brakes",
    name: "Shimano RT‑MT800 Rotor (203mm)",
    image:
      "https://images.unsplash.com/photo-1529421308418-eab98863cee5?w=1200&h=900&fit=crop",
    price: "$55–$75",
    match: 92,
    retailer: "Local shop",
    affiliateUrl: "https://example.com",
    trust: ["Quiet braking", "Heat control"],
    standards: { rotorMm: 203 },
    attrs: {
      weight: "185g",
      durability: "High",
      ridingFit: "Tech",
      compatibility: "203mm rotor",
    },
  },
  {
    id: "p4",
    focus: "wheels_tires",
    name: "Maxxis Minion DHR II (29 x 2.4)",
    image:
      "https://images.unsplash.com/photo-1620012253295-c15cc3e65df4?w=1200&h=900&fit=crop",
    price: "$68–$92",
    match: 90,
    retailer: "Jenson",
    affiliateUrl: "https://example.com",
    trust: ["Grip for tech", "Fast in corners"],
    standards: { wheelSize: 29, tireWidthIn: 2.4 },
    attrs: {
      weight: "~980g",
      durability: "High",
      ridingFit: "All‑Mountain",
      compatibility: '29" • 2.4"',
    },
  },
  {
    id: "p5",
    focus: "cockpit",
    name: "780mm Trail Bar + 40mm Stem (combo)",
    image:
      "https://images.unsplash.com/photo-1508780709619-79562169bc64?w=1200&h=900&fit=crop",
    price: "$89–$140",
    match: 84,
    retailer: "Local shop",
    affiliateUrl: "https://example.com",
    trust: ["More control", "Comfort for long days"],
    standards: {},
    attrs: {
      weight: "~410g",
      durability: "Med‑High",
      ridingFit: "Flow",
      compatibility: "31.8 clamp",
    },
  },
];

// --- NEW: inspiration-driven "Recommended for You" discovery catalog ---
// Keep this lightweight: it is not the full recommender. Just easy yes ideas.
export const mockDiscoveryGear = [
  {
    productId: "d1",
    focus: "drivetrain",
    name: "SRAM GX Eagle Chain (12‑speed)",
    image:
      "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1200&h=900&fit=crop",
    price: "$34–$55",
    category: "drivetrain",
    tag: "Rider Favorite",
    trendingScore: 88,
    standards: { speedCount: 12 },
  },
  {
    productId: "d2",
    focus: "brakes",
    name: "Sintered Brake Pads (quiet + durable)",
    image:
      "https://images.unsplash.com/photo-1529421308418-eab98863cee5?w=1200&h=900&fit=crop",
    price: "$22–$39",
    category: "brakes",
    tag: "Popular Upgrade",
    trendingScore: 84,
    standards: {},
  },
  {
    productId: "d3",
    focus: "wheels_tires",
    name: "Maxxis Minion DHF (29 x 2.5)",
    image:
      "https://images.unsplash.com/photo-1620012253295-c15cc3e65df4?w=1200&h=900&fit=crop",
    price: "$68–$92",
    category: "wheels_tires",
    tag: "Great for Tech",
    trendingScore: 92,
    standards: { wheelSize: 29, tireWidthIn: 2.5 },
  },
  {
    productId: "d4",
    focus: "suspension",
    name: "Volume Tokens (more support, less bottom‑out)",
    image:
      "https://images.unsplash.com/photo-1508780709619-79562169bc64?w=1200&h=900&fit=crop",
    price: "$18–$35",
    category: "suspension",
    tag: "Trending",
    trendingScore: 90,
    standards: {},
  },
  {
    productId: "d5",
    focus: "drivetrain",
    name: "Shifter Cable + Housing Refresh",
    image:
      "https://images.unsplash.com/photo-1520975958225-71c5d1f6a9b9?w=1200&h=900&fit=crop",
    price: "$12–$28",
    category: "drivetrain",
    tag: "Easy Win",
    trendingScore: 80,
    standards: {},
  },
  {
    productId: "d6",
    focus: "cockpit",
    name: "Grippy Lock‑On Grips (less hand fatigue)",
    image:
      "https://images.unsplash.com/photo-1576435728678-68d0fbf94e91?w=1200&h=900&fit=crop",
    price: "$22–$35",
    category: "cockpit",
    tag: "Rider Favorite",
    trendingScore: 82,
    standards: {},
  },
  {
    productId: "d7",
    focus: "brakes",
    name: "203mm Front Rotor (more control on steeps)",
    image:
      "https://images.unsplash.com/photo-1529421308418-eab98863cee5?w=1200&h=900&fit=crop",
    price: "$45–$75",
    category: "brakes",
    tag: "Great for Tech",
    trendingScore: 86,
    standards: { rotorMm: 203 },
  },
  {
    productId: "d8",
    focus: "wheels_tires",
    name: "Tubeless Sealant Top‑Up Kit",
    image:
      "https://images.unsplash.com/photo-1620012253295-c15cc3e65df4?w=1200&h=900&fit=crop",
    price: "$9–$18",
    category: "wheels_tires",
    tag: "Trending",
    trendingScore: 83,
    standards: {},
  },
];

function clamp01(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) {
    return 0;
  }
  return Math.max(0, Math.min(1, x));
}

function scoreForDiscoveryItem({
  item,
  bikeProfile,
  riderCharacter,
  userProfile,
  bikeInfo,
}) {
  // Bias towards "easy yes" upgrades + rider strengths.
  const skills = riderCharacter?.skills || [];
  const byKey = new Map(skills.map((s) => [s.key, s.value]));
  const climbing = byKey.get("climbing") || 0;
  const tech = byKey.get("tech") || 0;
  const jumping = byKey.get("jumping") || 0;
  const flow = byKey.get("flow") || 0;

  const trend = clamp01((item?.trendingScore || 80) / 100);

  let bias = 0;
  if (climbing >= 85 && item.focus === "drivetrain") {
    bias += 8;
  }
  if (
    tech >= 80 &&
    (item.focus === "brakes" || item.focus === "wheels_tires")
  ) {
    bias += 8;
  }
  if (
    jumping >= 80 &&
    (item.focus === "suspension" || item.focus === "wheels_tires")
  ) {
    bias += 7;
  }
  if (
    flow >= 85 &&
    (item.focus === "cockpit" || item.focus === "wheels_tires")
  ) {
    bias += 5;
  }

  // --- NEW: bias from onboarding profile (discipline + bike type)
  const discipline = userProfile?.primaryDiscipline;
  if (
    discipline === "DH/Bike Park" &&
    (item.focus === "brakes" || item.focus === "suspension")
  ) {
    bias += 6;
  }
  if (discipline === "XC" && item.focus === "drivetrain") {
    bias += 4;
  }

  const bikeType = bikeInfo?.bikeType;
  if (bikeType === "Gravel/Road" && item.focus === "cockpit") {
    bias += 4;
  }

  const compat = checkCompatibility({
    focus: item.focus,
    product: { standards: item.standards || {} },
    bikeProfile,
  });
  const compatPenalty = compat.compatible ? 0 : 16;

  // Keep match in a friendly range.
  const matchScore = Math.round(
    Math.max(
      60,
      Math.min(99, 78 + Math.round(trend * 14) + bias - compatPenalty),
    ),
  );

  return {
    matchScore,
    compatible: compat.compatible !== false,
    compatibility: compat,
  };
}

function buddyCopyForItem({ item, riderCharacter }) {
  const skills = riderCharacter?.skills || [];
  const byKey = new Map(skills.map((s) => [s.key, s.value]));
  const climbing = byKey.get("climbing") || 0;
  const tech = byKey.get("tech") || 0;
  const jumping = byKey.get("jumping") || 0;

  if (item.focus === "drivetrain" && climbing >= 80) {
    return "Popular swap for smoother climbing.";
  }
  if (item.focus === "brakes" && tech >= 75) {
    return "Great upgrade for tech‑heavy trails.";
  }
  if (item.focus === "suspension" && jumping >= 75) {
    return "Riders who send it love this first.";
  }
  if (item.focus === "wheels_tires" && tech >= 75) {
    return "More grip when it gets sketchy.";
  }

  return "Riders like you upgrade this early.";
}

// Lightweight, inspiration-driven list for the Wizard screen.
export function getRecommendedDiscoveryGear({
  bikeProfile,
  riderCharacter,
  userProfile,
  bikeInfo,
}) {
  if (!bikeProfile) {
    return [];
  }

  const items = (mockDiscoveryGear || [])
    .map((item) => {
      const scored = scoreForDiscoveryItem({
        item,
        bikeProfile,
        riderCharacter,
        userProfile,
        bikeInfo,
      });
      const buddyCopy = buddyCopyForItem({ item, riderCharacter });

      // Freshen tag for your strongest skill (keeps it playful, not robotic).
      let tag = item.tag;
      try {
        const skills = riderCharacter?.skills || [];
        const top = [...skills].sort(
          (a, b) => (b.value || 0) - (a.value || 0),
        )[0];
        const topKey = top?.key;
        if (topKey === "climbing" && item.focus === "drivetrain") {
          tag = "Great for Climbers";
        }
        if (
          topKey === "tech" &&
          (item.focus === "brakes" || item.focus === "wheels_tires")
        ) {
          tag = "Great for Tech";
        }
        if (topKey === "jumping" && item.focus === "suspension") {
          tag = "Great for Jumpers";
        }
      } catch (e) {
        // no-op
      }

      return {
        ...item,
        ...scored,
        tag,
        buddyCopy,
      };
    })
    .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0))
    .slice(0, 10);

  return items;
}

function budgetToMinMatch(budgetKey) {
  if (budgetKey === "$") return 82;
  if (budgetKey === "$$") return 80;
  if (budgetKey === "$$$") return 78;
  return 80;
}

function safeText(x) {
  return String(x ?? "").trim();
}

function safeArr(x) {
  return Array.isArray(x) ? x : [];
}

function whyObjectToString(why) {
  if (!why) {
    return "";
  }
  if (typeof why === "string") {
    return safeText(why);
  }
  if (typeof why === "object") {
    const title = safeText(why?.title);
    const bullets = safeArr(why?.bullets)
      .map((b) => safeText(b))
      .filter(Boolean);

    const lines = [];
    if (title) {
      lines.push(title);
    }
    lines.push(...bullets.slice(0, 4));
    return lines.filter(Boolean).join("\n\n");
  }
  return "";
}

function buildEnhancedWhy({ product, bikeProfile, riderCharacter }) {
  const p = product && typeof product === "object" ? product : {};

  // Server AI can return why as {title, bullets[]}. Convert it.
  const serverWhy = whyObjectToString(p.why);
  const base =
    serverWhy ||
    buildWhyThisFitsCopy({ product: p, bikeProfile, riderCharacter });

  const trust = safeArr(p?.trust)
    .map((t) => safeText(t))
    .filter(Boolean)
    .slice(0, 2);

  const compatReason = safeText(p?.compatibility?.reason);

  const parts = [];
  if (base) {
    parts.push(base);
  }

  if (trust.length > 0) {
    parts.push(`Fit: ${trust.join(" • ")}`);
  } else if (compatReason) {
    parts.push(`Fit: ${compatReason}`);
  }

  return parts.filter(Boolean).join("\n\n");
}

function withDerivedAttrs(product) {
  const p = product && typeof product === "object" ? product : {};
  const attrs = p?.attrs && typeof p.attrs === "object" ? p.attrs : {};

  const weight = safeText(attrs?.weight);
  const durability = safeText(attrs?.durability);
  const ridingFit = safeText(attrs?.ridingFit);
  const compatibility = safeText(attrs?.compatibility);

  const fallbackCompat =
    compatibility ||
    safeText(p?.compatibility?.reason) ||
    (p?.compatibility?.compatible === false ? "Check fit" : "Looks good");

  return {
    ...p,
    attrs: {
      ...attrs,
      weight: weight || "",
      durability: durability || "",
      ridingFit: ridingFit || (p?.focus ? safeText(p.focus) : ""),
      compatibility: fallbackCompat || "",
    },
  };
}

export function normalizeGeneratedGearResults(
  results,
  { bikeProfile, riderCharacter } = {},
) {
  const r = results && typeof results === "object" ? results : {};

  const normalizeProduct = (p) => {
    const prod = p && typeof p === "object" ? p : {};
    const withWhy = {
      ...prod,
      why: buildEnhancedWhy({ product: prod, bikeProfile, riderCharacter }),
      trust: safeArr(prod?.trust)
        .map((t) => safeText(t))
        .filter(Boolean),
    };
    return withDerivedAttrs(withWhy);
  };

  return {
    ...r,
    top: r?.top ? normalizeProduct(r.top) : null,
    alternatives: safeArr(r?.alternatives).map(normalizeProduct),
  };
}

// Lightweight, inspiration-driven list for the Wizard screen.
export function createGearRecommendations({
  wizard,
  bikeProfile,
  riderCharacter,
  userProfile,
  bikeInfo,
}) {
  const focus = wizard?.focus || "drivetrain";
  const budget = wizard?.budget || "$$";

  const candidates = mockProducts.filter((p) => p.focus === focus);

  const minMatch = budgetToMinMatch(budget);

  const scored = candidates
    .map((p) => {
      const compat = checkCompatibility({ focus, product: p, bikeProfile });
      const compatPenalty = compat.compatible ? 0 : 18;

      // Tiny bias: if "upgrade" then prefer higher match; if "replace" prefer value.
      const intentBias = wizard?.intent === "upgrade" ? 2 : 0;

      const query = String(wizard?.query || "")
        .trim()
        .toLowerCase();
      const queryBias = query && p.name.toLowerCase().includes(query) ? 6 : 0;

      // Mild discipline bias (just enough to feel personalized)
      const discipline = userProfile?.primaryDiscipline;
      const disciplineBias =
        discipline === "DH/Bike Park" && focus === "brakes"
          ? 2
          : discipline === "XC" && focus === "drivetrain"
            ? 2
            : 0;

      const match = Math.max(
        0,
        Math.min(
          100,
          (p.match || 80) -
            compatPenalty +
            intentBias +
            queryBias +
            disciplineBias,
        ),
      );

      const enriched = {
        ...p,
        match,
        compatibility: compat,
      };

      const why = buildEnhancedWhy({
        product: enriched,
        bikeProfile,
        riderCharacter,
      });

      return withDerivedAttrs({
        ...enriched,
        why,
      });
    })
    .filter((p) => p.match >= minMatch)
    .sort((a, b) => (b.match || 0) - (a.match || 0));

  const top = scored[0] || null;
  const alternatives = scored.slice(1, 4);

  let alert = null;
  if (top && top.compatibility && !top.compatibility.compatible) {
    alert = {
      tone: "orange",
      title: "Compatibility heads‑up",
      message: top.compatibility.reason,
    };
  }

  if (!top) {
    alert = {
      tone: "orange",
      title: "No perfect matches yet",
      message:
        "Try switching the component focus or loosen your budget — I’ll hunt again.",
    };
  }

  return {
    top,
    alternatives,
    alert,
    themeAccent: colors.primary,
  };
}

export async function generateGearRecommendationsJob({
  wizard,
  bikeProfile,
  riderCharacter,
  userProfile,
  bikeInfo,
}) {
  // Prefer backend AI job system (cacheable + auditable)
  try {
    // Extract current part info based on focus to help AI understand upgrade/replace context
    let currentPart = null;
    if (wizard?.focus && bikeInfo) {
      const focus = String(wizard.focus);
      if (focus === "drivetrain") {
        currentPart = {
          cassette: bikeInfo.cassette || null,
          crankset: bikeInfo.crankset || null,
          chainType: bikeInfo.chain_type || null,
          drivetrainSpeed: bikeInfo.drivetrain_speed || null,
          brand: bikeInfo.drivetrain_brand || null,
        };
      } else if (focus === "brakes") {
        currentPart = {
          model: bikeInfo.brake_model || null,
          brand: bikeInfo.brake_brand || null,
          rotorSizeFront:
            bikeInfo.rotor_size_front || bikeInfo.rotor_size || null,
          rotorSizeRear: bikeInfo.rotor_size_rear || null,
        };
      } else if (focus === "suspension") {
        currentPart = {
          travelFront: bikeInfo.suspension_travel_front || null,
          travelRear: bikeInfo.suspension_travel_rear || null,
        };
      } else if (focus === "wheels_tires") {
        currentPart = {
          wheelSize: bikeInfo.wheel_size || null,
          hubDriver: bikeInfo.hub_driver || null,
          isTubeless: bikeInfo.is_tubeless || null,
        };
      }
    }

    const { job } = await startAIJob({
      type: "gear_recommender",
      input: {
        wizard,
        bikeProfile,
        riderCharacter,
        userProfile,
        bikeInfo,
        currentPart,
        standards: bikeProfile, // Pass compatibility standards
      },
    });

    if (job?.id) {
      const waiter = waitForAIJob({
        jobId: job.id,
        pollIntervalMs: 650,
        timeoutMs: 20000,
      });
      const finalJob = await waiter.done;
      const res = finalJob?.result || null;
      if (res) {
        // Normalize server AI output:
        // - Results screen expects top.why to be a string
        // - Compare wants attrs.{weight,durability,ridingFit,compatibility}
        return normalizeGeneratedGearResults(res, {
          bikeProfile,
          riderCharacter,
        });
      }
    }
  } catch (e) {
    console.error(e);
  }

  // Offline-safe fallback
  return createGearRecommendations({
    wizard,
    bikeProfile,
    riderCharacter,
    userProfile,
    bikeInfo,
  });
}

function hashToId(input) {
  const str = String(input || "");
  let h = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  // unsigned -> base36
  return (h >>> 0).toString(36);
}

function formatPriceRange({ min, max, currency }) {
  const mn = Number(min);
  const mx = Number(max);
  const cur = String(currency || "").toUpperCase();

  const hasMin = Number.isFinite(mn) && mn > 0;
  const hasMax = Number.isFinite(mx) && mx > 0;

  if (!hasMin && !hasMax) {
    return "";
  }

  const range =
    hasMin && hasMax
      ? `${Math.round(mn)}–${Math.round(mx)}`
      : `${Math.round(hasMin ? mn : mx)}`;

  // keep existing UI vibe (short), but still include currency when provided
  if (cur === "USD") return `$${range}`;
  if (cur === "CAD") return `CA$${range}`;
  if (cur) return `${range} ${cur}`;
  return `$${range}`;
}

function categoryToFocus(category) {
  const c = String(category || "").toLowerCase();
  if (c.includes("brake")) return "brakes";
  if (c.includes("drive")) return "drivetrain";
  if (c.includes("wheel") || c.includes("tire")) return "wheels_tires";
  if (c.includes("cockpit")) return "cockpit";
  if (c.includes("suspension")) return "suspension";
  return "drivetrain";
}

const fallbackImageByCategory = {
  brakes:
    "https://images.unsplash.com/photo-1529421308418-eab98863cee5?w=1200&h=900&fit=crop",
  drivetrain:
    "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1200&h=900&fit=crop",
  wheels_tires:
    "https://images.unsplash.com/photo-1620012253295-c15cc3e65df4?w=1200&h=900&fit=crop",
  cockpit:
    "https://images.unsplash.com/photo-1508780709619-79562169bc64?w=1200&h=900&fit=crop",
  suspension:
    "https://images.unsplash.com/photo-1508780709619-79562169bc64?w=1200&h=900&fit=crop",
};

// Treat RecommendedGearCarousel's item shape as the canonical card model for this screen.
// IMPORTANT: Do not change the UI; adapt AI results into the existing shape.
export function mapAiRecommendedGearToCardModel(apiItem) {
  const item = apiItem && typeof apiItem === "object" ? apiItem : {};

  const brand = String(item.brand || "").trim();
  const model = String(item.model || "").trim();
  const title = String(item.title || "").trim();
  const category = String(item.category || "").trim();
  const focus = categoryToFocus(category);

  const keySpecs = Array.isArray(item.keySpecs) ? item.keySpecs : [];
  const idSeed = [brand, model, title, category, keySpecs.join("|")]
    .filter(Boolean)
    .join("::");

  const gearIdRaw = String(item.gearId || "").trim();
  const stableId = gearIdRaw || `ai_${hashToId(idSeed)}`;

  const fitConfidence = Number(item?.bikeFit?.fitConfidence);
  const fit01 = Number.isFinite(fitConfidence)
    ? Math.max(0, Math.min(1, fitConfidence))
    : 0.65;

  const why = Array.isArray(item.whyRecommended) ? item.whyRecommended : [];
  const bestFor = Array.isArray(item.bestFor) ? item.bestFor : [];

  const buddyCopy =
    String(why[0] || "").trim() ||
    String(bestFor[0] || "").trim() ||
    "Fresh picks tuned to your setup.";

  // Use category as the tag (short + meaningful).
  const tag = category;

  // Server refresh now attaches a real `imageUrl` from catalog lookup.
  // IMPORTANT: do not trust AI-generated image URLs.
  const imageUrl =
    typeof item.imageUrl === "string" && item.imageUrl ? item.imageUrl : "";
  const legacyImage =
    typeof item.image === "string" && item.image ? item.image : "";

  const image =
    imageUrl ||
    legacyImage ||
    fallbackImageByCategory[focus] ||
    fallbackImageByCategory.drivetrain;

  const estimated =
    item.estimatedPrice && typeof item.estimatedPrice === "object"
      ? item.estimatedPrice
      : {};

  const price = formatPriceRange({
    min: estimated.min,
    max: estimated.max,
    currency: estimated.currency,
  });

  const compatible = fit01 >= 0.6;
  const matchScore = Math.round(fit01 * 100);

  return {
    productId: stableId,
    focus,
    name:
      title || [brand, model].filter(Boolean).join(" ") || "Recommended gear",
    image,
    price,
    category: focus,
    tag,
    trendingScore: matchScore,
    matchScore,
    compatible,
    buddyCopy,
    standards: {},
  };
}

function safeArray(x) {
  return Array.isArray(x) ? x : [];
}

function normalizeAiItem(apiItem) {
  const item = apiItem && typeof apiItem === "object" ? apiItem : {};

  const bikeFitRaw =
    item.bikeFit && typeof item.bikeFit === "object" ? item.bikeFit : {};

  return {
    ...item,
    whyRecommended: safeArray(item.whyRecommended),
    keySpecs: safeArray(item.keySpecs),
    pros: safeArray(item.pros),
    cons: safeArray(item.cons),
    requiredExtras: safeArray(item.requiredExtras),
    bestFor: safeArray(item.bestFor),
    bikeFit: {
      ...bikeFitRaw,
      compatibleBecause: safeArray(bikeFitRaw.compatibleBecause),
      fitChecks: safeArray(bikeFitRaw.fitChecks),
      incompatibilityRisks: safeArray(bikeFitRaw.incompatibilityRisks),
    },
  };
}

/**
 * Pure adapter: API response -> canonical GearCardModel list used by RecommendedGearCarousel.
 *
 * Rules:
 * - Does NOT mutate previousCards
 * - Stable IDs: uses apiItem.gearId when present, otherwise deterministic hash
 * - Adds `id` alias + `isLoading` flag without changing the UI layout
 */
export function mapAiRecommendedGearToGearCards(apiItems, previousCards) {
  const list = Array.isArray(apiItems) ? apiItems : [];

  const next = list.map((raw) => {
    const normalized = normalizeAiItem(raw);
    const card = mapAiRecommendedGearToCardModel(normalized);

    return {
      ...card,
      id: card.productId,
      isLoading: false,
      source: "ai_refresh",
      ai: normalized,
    };
  });

  // Never mutate previousCards; it is accepted only to match the requested signature.
  // (Future: could preserve ordering or keep expansion state keyed by id.)
  void previousCards;

  return next;
}
