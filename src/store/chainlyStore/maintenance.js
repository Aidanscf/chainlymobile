import { safeNum, clamp, pickComponent } from "./utils";
import { computeServiceWearPercent } from "@/utils/wearEngine";

export function buildMaintenanceTitleLocal({ component_type, action }) {
  const t = String(component_type || "").toLowerCase();
  const a = String(action || "").toLowerCase();

  if (a === "urgent") {
    if (t === "chain") return "Service drivetrain";
    if (t === "pads") return "Replace brake pads";
    if (t === "tire") return "Replace tires";
    if (t === "fork") return "Service fork";
    if (t === "shock") return "Service rear shock";
  }

  // due soon
  if (t === "chain") return "Inspect drivetrain";
  if (t === "pads") return "Inspect brake pads";
  if (t === "tire") return "Inspect tire wear";
  if (t === "fork") return "Plan fork service";
  if (t === "shock") return "Plan rear shock service";
  return "Maintenance check";
}

export function componentWearPercent(c) {
  const type = String(c?.component_type || "");
  if (type === "fork" || type === "shock") {
    const expected =
      safeNum(c?.expected_service_hours) || (type === "fork" ? 50 : 60);
    const pct = computeServiceWearPercent({
      serviceHours: c?.service_hours,
      expectedServiceHours: expected,
    });
    // If wear_percent is also provided (future), prefer the worst-case.
    const wp = c?.wear_percent == null ? 0 : safeNum(c.wear_percent);
    return clamp(Math.max(pct, wp), 0, 100);
  }
  return clamp(c?.wear_percent == null ? 0 : safeNum(c.wear_percent), 0, 100);
}

export function componentHealthFromWear(c) {
  const wear = componentWearPercent(c);
  return clamp(100 - wear, 0, 100);
}

function toTimeOrNull(iso) {
  if (!iso) return null;
  const d = new Date(String(iso));
  if (!Number.isFinite(d.getTime())) return null;
  return d.getTime();
}

function getBrakeBleedIntervalDays(bike) {
  const raw = String(bike?.brake_fluid_type ?? bike?.brakeFluidType ?? "")
    .trim()
    .toLowerCase();
  if (raw === "dot") return 365;
  if (raw === "mineral" || raw.includes("mineral")) return 730;
  return 540; // unknown (~18 months)
}

function latestBleedTimeMs(maintenanceEvents) {
  const list = Array.isArray(maintenanceEvents) ? maintenanceEvents : [];
  let best = null;
  let bestT = 0;

  for (const e of list) {
    if (String(e?.action || "") !== "brake_bleed") continue;
    const t =
      toTimeOrNull(e?.performed_at || e?.performedAt) ||
      toTimeOrNull(e?.created_at || e?.createdAt);
    if (!t) continue;
    if (t > bestT) {
      bestT = t;
      best = t;
    }
  }

  return best;
}

export function deriveGarageStatus({ bike, components, maintenanceEvents }) {
  const chain = pickComponent(components, "chain");
  const pads = pickComponent(components, "pads");
  const tire = pickComponent(components, "tire");
  const fork = pickComponent(components, "fork");
  const shock = pickComponent(components, "shock");

  // Defaults: if a wear-tracked category is missing, treat it as "new" (100 health).
  // This keeps the UI stable and fixes older bikes that were created without these rows.
  const drivetrainHealth = chain ? componentHealthFromWear(chain) : 100;

  // Brakes: pad wear (distance/hours) + brake bleed timer (DOT/mineral) are both conservative.
  const brakePadsHealth = pads ? componentHealthFromWear(pads) : 100;

  const bleedIntervalDays = getBrakeBleedIntervalDays(bike);
  const nowMs = Date.now();
  const bikeCreatedMs = toTimeOrNull(bike?.created_at) || nowMs;
  const lastBleedMs = latestBleedTimeMs(maintenanceEvents) || bikeCreatedMs;
  const daysSinceBleed = (nowMs - lastBleedMs) / (24 * 60 * 60 * 1000);
  const bleedUsage =
    bleedIntervalDays > 0 ? daysSinceBleed / bleedIntervalDays : 0;
  const bleedHealth = clamp(100 - bleedUsage * 100, 0, 100);

  const brakeHealth = Math.round(Math.min(brakePadsHealth, bleedHealth));

  const tireHealth = tire ? componentHealthFromWear(tire) : 100;

  const suspensionHealthRaw = [fork, shock]
    .filter(Boolean)
    .map(componentHealthFromWear);
  const suspensionHealth = suspensionHealthRaw.length
    ? Math.round(
        suspensionHealthRaw.reduce((a, b) => a + b, 0) /
          suspensionHealthRaw.length,
      )
    : 100;

  const parts = {
    drivetrain: drivetrainHealth,
    brakes: brakeHealth,
    tires: tireHealth,
    suspension: suspensionHealth,
  };

  // Fixed order, always render all four categories.
  const componentHealth = [
    {
      key: "drivetrain",
      label: "Drivetrain",
      score: drivetrainHealth,
      icon: "drivetrain",
    },
    { key: "brakes", label: "Brakes", score: brakeHealth, icon: "brakes" },
    { key: "tires", label: "Tires", score: tireHealth, icon: "tires" },
    {
      key: "suspension",
      label: "Suspension",
      score: suspensionHealth,
      icon: "suspension",
    },
  ];

  // Health Score is derived ONLY from the breakdown (single source of truth)
  const healthScore = Math.round(
    (drivetrainHealth + brakeHealth + tireHealth + suspensionHealth) / 4,
  );

  const events = Array.isArray(maintenanceEvents) ? maintenanceEvents : [];
  const urgent = events
    .filter((e) => String(e?.action) === "urgent")
    .slice(0, 5)
    .map((e) => ({
      id: String(
        e.id || `urgent_${e.component_type}_${e.created_at || Date.now()}`,
      ),
      title: e.title || buildMaintenanceTitleLocal(e),
      createdAt: e.created_at || e.createdAt || null,
    }));

  const dueSoon = events
    .filter((e) => String(e?.action) === "due_soon")
    .slice(0, 8)
    .map((e) => ({
      id: String(
        e.id || `due_${e.component_type}_${e.created_at || Date.now()}`,
      ),
      title: e.title || buildMaintenanceTitleLocal(e),
      createdAt: e.created_at || e.createdAt || null,
    }));

  return {
    parts,
    componentHealth,
    maintenance: {
      urgent,
      dueSoon,
      completed: (bike?.maintenance?.completed || []).slice(0, 6),
    },
    healthScore,
    urgentCount: urgent.length,
    dueSoonCount: dueSoon.length,
  };
}
