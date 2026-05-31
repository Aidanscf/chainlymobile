function roundToNearest5(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) {
    return null;
  }
  return Math.round(x / 5) * 5;
}

function midpoint(min, max) {
  const a = Number(min);
  const b = Number(max);
  if (!Number.isFinite(a) || !Number.isFinite(b)) {
    return null;
  }
  return (a + b) / 2;
}

function formatRange(min, max) {
  const mn = Number(min);
  const mx = Number(max);
  if (!Number.isFinite(mn) || !Number.isFinite(mx)) {
    return null;
  }
  return `$${Math.round(mn)}–$${Math.round(mx)}`;
}

// Conservative MVP estimates (display only). Use broad ranges.
const SHOP_COST_BY_AREA = {
  brakes: { shop: [60, 90], diy: [0, 25] },
  drivetrain: { shop: [40, 70], diy: [0, 25] },
  suspension: { shop: [80, 150], diy: [0, 30] },
  wheels_tires: { shop: [40, 80], diy: [0, 20] },
  cockpit: { shop: [40, 80], diy: [0, 20] },
  frame: { shop: [90, 180], diy: [0, 40] },
};

function normalizeSystemArea(area) {
  const a = String(area || "")
    .trim()
    .toLowerCase();
  if (!a) return null;

  // match common mechanic system_area outputs
  if (a.includes("brake")) return "brakes";
  if (a.includes("drive") || a.includes("chain") || a.includes("cassette")) {
    return "drivetrain";
  }
  if (a.includes("suspension") || a.includes("fork") || a.includes("shock")) {
    return "suspension";
  }
  if (a.includes("wheel") || a.includes("tire")) return "wheels_tires";
  if (a.includes("cockpit") || a.includes("steer") || a.includes("handle")) {
    return "cockpit";
  }
  if (a.includes("frame")) return "frame";

  return a;
}

/**
 * Returns null if we can't estimate safely.
 */
export function getMoneySavedEstimate({ diagnosis, fixPlan }) {
  const steps = Array.isArray(fixPlan?.steps) ? fixPlan.steps : [];
  if (!steps.length) {
    return null;
  }

  const sysAreas = Array.isArray(diagnosis?.system_area)
    ? diagnosis.system_area
    : [];
  const primary = normalizeSystemArea(sysAreas[0]);
  if (!primary) {
    return null;
  }

  const row = SHOP_COST_BY_AREA[primary];
  if (!row) {
    return null;
  }

  const [shopMin, shopMax] = row.shop;
  const [diyMin, diyMax] = row.diy;

  const shopMid = midpoint(shopMin, shopMax);
  const diyMid = midpoint(diyMin, diyMax);
  if (shopMid == null || diyMid == null) {
    return null;
  }

  const savedApprox = roundToNearest5(shopMid - diyMid);
  if (!savedApprox || savedApprox <= 15) {
    // avoid showing "$0 saved" vibe
    return null;
  }

  return {
    primaryArea: primary,
    shopRangeText: formatRange(shopMin, shopMax),
    diyRangeText: formatRange(diyMin, diyMax),
    savedApprox,
  };
}
