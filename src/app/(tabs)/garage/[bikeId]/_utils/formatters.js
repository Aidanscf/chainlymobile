export function formatShortDate(iso) {
  if (!iso) return "";
  const d = new Date(String(iso));
  if (!Number.isFinite(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function formatDistanceKm(distance) {
  const n = Number(distance);
  if (!Number.isFinite(n)) return "";
  const rounded = Math.round(n * 10) / 10;
  return `${rounded} km`;
}

export function formatMaintenanceType(action) {
  const raw = String(action || "");
  const map = {
    brake_pads_replace: "Brake pads replaced",
    brake_bleed: "Brake bleed",
    tire_replace_front: "Tire replaced (front)",
    tire_replace_rear: "Tire replaced (rear)",
    chain_replace: "Chain replaced",
    drivetrain_service: "Drivetrain service (clean/lube)",
    fork_lower_service: "Fork lower service",
    shock_air_can_service: "Shock air can service",
    suspension_full_service: "Full suspension service",

    // NEW: time-based quests
    tire_pressure_check: "Tire pressure check",
    tire_sealant_topup: "Tire sealant top-up",
  };

  if (map[raw]) return map[raw];

  // fall back to a readable label
  const label = raw
    .replace(/_/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return label || "Maintenance";
}
