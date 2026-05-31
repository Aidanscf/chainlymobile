function safeNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function normalizeBikeType(raw) {
  const t = String(raw || "").toLowerCase();
  if (!t) return "trail";

  if (t.includes("emtb") || t.includes("e-mtb") || t.includes("e mtb")) {
    return "emtb";
  }
  if (t.includes("downhill") || t === "dh" || t.includes("bike park")) {
    return "dh";
  }
  if (t.includes("enduro")) return "enduro";
  if (t.includes("xc") || t.includes("cross")) return "xc";
  if (t.includes("gravel")) return "gravel";
  if (t.includes("trail")) return "trail";

  return "trail";
}

function bikeTypeMultiplier(bikeType) {
  const t = normalizeBikeType(bikeType);
  if (t === "xc") return 1.0;
  if (t === "gravel") return 1.0;
  if (t === "trail") return 1.1;
  if (t === "enduro") return 1.2;
  if (t === "dh") return 1.35;
  if (t === "emtb") return 1.25;
  return 1.1;
}

function terrainMultiplier(terrainTag) {
  const t = String(terrainTag || "").toLowerCase();
  if (t === "road") return 1.0;
  if (t === "gravel") return 1.2;
  if (t === "trail_flow") return 1.3;
  if (t === "trail_technical") return 1.6;
  if (t === "bike_park_dh") return 1.8;
  return 1.3;
}

function intensityMultiplier(intensityLevel) {
  const i = String(intensityLevel || "").toLowerCase();
  if (i === "easy") return 0.9;
  if (i === "moderate") return 1.0;
  if (i === "hard") return 1.2;
  // NEW: Race / All-Out
  if (
    i === "race_all_out" ||
    i === "race" ||
    i === "all_out" ||
    i === "all-out"
  ) {
    return 1.6;
  }
  return 1.0;
}

function elevationFactor(elevationGainM) {
  const m = safeNum(elevationGainM);
  const factor = 1 + Math.min(m / 2000, 0.35);
  return clamp(factor, 1, 1.35);
}

function rideTimestamp(ride) {
  return (
    ride?.ride_at ||
    ride?.ride_date ||
    ride?.start_date ||
    ride?.created_at ||
    null
  );
}

function toTimeOrNull(iso) {
  if (!iso) return null;
  const d = new Date(String(iso));
  if (!Number.isFinite(d.getTime())) return null;
  return d.getTime();
}

function readRideDistanceKm(ride) {
  // rides store uses `distance` for km today.
  const d =
    ride?.distance_km ??
    ride?.distanceKm ??
    ride?.distance ??
    (ride?.meta ? ride.meta.distanceKm : null);
  const n = Number(d);
  return Number.isFinite(n) ? n : null;
}

function readRideDurationHours(ride) {
  const min =
    ride?.duration_minutes ??
    ride?.durationMinutes ??
    ride?.duration_min ??
    ride?.durationMin ??
    null;
  const sec =
    ride?.moving_time_sec ??
    ride?.movingTimeSec ??
    ride?.elapsed_time_sec ??
    ride?.elapsedTimeSec ??
    null;

  const minN = Number(min);
  if (Number.isFinite(minN) && minN > 0) return minN / 60;

  const secN = Number(sec);
  if (Number.isFinite(secN) && secN > 0) return secN / 3600;

  return null;
}

function readRideTerrain(ride) {
  return (
    ride?.terrain_tag ?? ride?.terrainTag ?? ride?.meta?.terrainType ?? null
  );
}

function readRideIntensity(ride) {
  return (
    ride?.intensity_level ??
    ride?.intensityLevel ??
    ride?.meta?.intensityLevel ??
    null
  );
}

function readRideElevationGainM(ride) {
  const e =
    ride?.elevation_gain_m ??
    ride?.elevationGainM ??
    ride?.elevation_gain ??
    ride?.elevationGain ??
    ride?.meta?.elevationGainM ??
    null;
  const n = Number(e);
  return Number.isFinite(n) ? n : 0;
}

export function computeEquivalentUsage({ ride, bikeType }) {
  const km = readRideDistanceKm(ride);
  const hours = readRideDurationHours(ride);

  const terrainMult = terrainMultiplier(readRideTerrain(ride));
  const intensityMult = intensityMultiplier(readRideIntensity(ride));
  const bikeMult = bikeTypeMultiplier(bikeType);
  const elevFactor = elevationFactor(readRideElevationGainM(ride));

  const fallbackKmh = 12;
  const kmFromHours = hours != null ? hours * fallbackKmh : 0;
  const baseKm = km != null ? km : kmFromHours;

  const equivKm = baseKm * terrainMult * intensityMult * bikeMult * elevFactor;
  const equivHours =
    (hours != null ? hours : 0) *
    terrainMult *
    intensityMult *
    bikeMult *
    elevFactor;

  return {
    equivKm: safeNum(equivKm),
    equivHours: safeNum(equivHours),
  };
}

function defaultIntervals({ bikeType, brakePadCompound }) {
  const t = normalizeBikeType(bikeType);

  const brakeBase = defaultBrakePadBase({ bikeType: t });
  const compoundMult = brakePadCompoundMultiplier(brakePadCompound);
  const brake = {
    km: safeNum(brakeBase.km) * compoundMult,
    hours: safeNum(brakeBase.hours) * compoundMult,
  };

  const drivetrainReplace =
    t === "trail" || t === "enduro" || t === "dh" || t === "emtb"
      ? { km: 1200 }
      : { km: 2200 };

  const drivetrainService = { km: 200 };

  const tiresReplace =
    t === "trail" || t === "enduro" || t === "dh" || t === "emtb"
      ? { km: 1000 }
      : { km: 2500 };

  return {
    brakes: brake,
    drivetrain_replace: drivetrainReplace,
    drivetrain_service: drivetrainService,
    tires: tiresReplace,
    suspension_lower: { hours: 50 },
    suspension_full: { hours: 150 },
  };
}

function actionTime(ev) {
  return (
    ev?.performed_at ||
    ev?.performedAt ||
    ev?.created_at ||
    ev?.createdAt ||
    null
  );
}

function latestLogTime(events, allowedActions) {
  const list = Array.isArray(events) ? events : [];
  const allowed = new Set(allowedActions);

  let best = null;
  let bestT = 0;

  for (const e of list) {
    const a = String(e?.action || "");
    if (!allowed.has(a)) continue;

    const t = toTimeOrNull(actionTime(e));
    if (!t) continue;

    if (t > bestT) {
      bestT = t;
      best = t;
    }
  }

  return best;
}

function formatRemaining({ remainingKm, remainingHours }) {
  if (remainingKm != null) {
    const km = Math.max(0, remainingKm);
    const rounded = km >= 50 ? Math.round(km / 10) * 10 : Math.round(km);
    return `${rounded} km left`;
  }

  if (remainingHours != null) {
    const h = Math.max(0, remainingHours);
    const rounded = h >= 10 ? Math.round(h) : Math.round(h * 10) / 10;
    return `${rounded} h left`;
  }

  return "";
}

function questStatus({ remaining, interval }) {
  const i = safeNum(interval);
  const r = safeNum(remaining);

  if (r <= 0) return "due";
  if (i > 0 && r / i <= 0.2) return "due_soon";
  return "ok";
}

function msPerDay() {
  return 24 * 60 * 60 * 1000;
}

function daysBetween(nowMs, thenMs) {
  const diff = safeNum(nowMs) - safeNum(thenMs);
  if (!diff) return 0;
  return diff / msPerDay();
}

function formatRemainingDays(remainingDays) {
  const d = safeNum(remainingDays);
  const clamped = Math.max(0, d);

  // Keep it simple + stable (no hours) since this is a "check" quest.
  const rounded =
    clamped >= 3 ? Math.round(clamped) : Math.round(clamped * 10) / 10;

  if (rounded === 0) return "Due today";
  if (rounded === 1) return "1 day left";
  return `${rounded} days left`;
}

function normalizeBrakePadCompound(raw) {
  const v = String(raw || "")
    .trim()
    .toLowerCase();
  if (v === "resin" || v.includes("organic")) return "resin";
  if (v === "semi_metallic" || v.includes("semi")) return "semi_metallic";
  if (v === "metallic" || v.includes("sinter")) return "metallic";
  return "unknown";
}

function normalizeBrakeFluidType(raw) {
  const v = String(raw || "")
    .trim()
    .toLowerCase();
  if (v === "dot") return "dot";
  if (v === "mineral" || v.includes("mineral")) return "mineral";
  return "unknown";
}

function brakePadCompoundMultiplier(compound) {
  const c = normalizeBrakePadCompound(compound);
  if (c === "semi_metallic") return 1.25;
  if (c === "metallic") return 1.5;
  return 1.0; // resin + unknown
}

export function getBrakeBleedIntervalDays({ bike }) {
  const fluid = normalizeBrakeFluidType(
    bike?.brake_fluid_type ?? bike?.brakeFluidType,
  );
  if (fluid === "dot") return 365;
  if (fluid === "mineral") return 730;
  return 540; // unknown (~18 months)
}

export function getBrakePadIntervals({ bike }) {
  const bikeType = bike?.bike_type ?? bike?.type;
  const base = defaultBrakePadBase({ bikeType });
  const mult = brakePadCompoundMultiplier(
    bike?.brake_pad_compound ?? bike?.brakePadCompound,
  );

  return {
    intervalKm: safeNum(base.km) * mult,
    intervalHours: safeNum(base.hours) * mult,
  };
}

function defaultBrakePadBase({ bikeType }) {
  const t = normalizeBikeType(bikeType);
  const isHeavy = t === "trail" || t === "enduro" || t === "dh" || t === "emtb";
  return isHeavy ? { km: 500, hours: 25 } : { km: 800, hours: 35 };
}

export function computeMaintenanceQuests({ bike, rides, maintenanceEvents }) {
  const bikeId = String(bike?.id || "");
  const bikeType = bike?.bike_type ?? bike?.type;
  const brakePadCompound = normalizeBrakePadCompound(
    bike?.brake_pad_compound ?? bike?.brakePadCompound,
  );
  const intervals = defaultIntervals({ bikeType, brakePadCompound });

  const isTubeless = Boolean(bike?.is_tubeless ?? bike?.tubeless ?? false);

  const list = Array.isArray(rides) ? rides : [];
  const attached = bikeId
    ? list.filter((r) => String(r?.bike_id || "") === bikeId)
    : [];

  const events = Array.isArray(maintenanceEvents) ? maintenanceEvents : [];

  const createdAtMs = toTimeOrNull(bike?.created_at) || null;
  const nowMs = Date.now();

  // Baselines: last "reset" log timestamps per category.
  const drivetrainResetAt = latestLogTime(events, [
    "chain_replace",
    "drivetrain_service",
  ]);
  const brakesResetAt = latestLogTime(events, [
    "brake_pads_replace",
    "brake_bleed",
  ]);
  const tiresResetAt = latestLogTime(events, [
    "tire_replace_front",
    "tire_replace_rear",
  ]);
  const suspLowerResetAt = latestLogTime(events, [
    "fork_lower_service",
    "shock_air_can_service",
    "suspension_full_service",
  ]);
  const suspFullResetAt = latestLogTime(events, ["suspension_full_service"]);

  // NEW: brake bleed quest baseline
  const brakeBleedAt = latestLogTime(events, ["brake_bleed"]);

  // NEW: time-based "check" quests
  const tirePressureAt = latestLogTime(events, ["tire_pressure_check"]);
  const sealantTopupAt = latestLogTime(events, ["tire_sealant_topup"]);

  const sumUsageSince = (sinceTimeMs) => {
    let usedKm = 0;
    let usedHours = 0;

    for (const r of attached) {
      const t = toTimeOrNull(rideTimestamp(r));
      if (!t) continue;
      if (sinceTimeMs && t <= sinceTimeMs) continue;

      const usage = computeEquivalentUsage({ ride: r, bikeType });
      usedKm += usage.equivKm;
      usedHours += usage.equivHours;
    }

    return { usedKm, usedHours };
  };

  const out = [];

  // --- Bleed Brakes (time-based; always) ---
  {
    const intervalDays = getBrakeBleedIntervalDays({ bike });
    const baseline = brakeBleedAt || createdAtMs || nowMs;
    const usedDays = daysBetween(nowMs, baseline);
    const remainingDays = intervalDays - usedDays;

    const status = questStatus({
      remaining: remainingDays,
      interval: intervalDays,
    });

    out.push({
      key: "brake_bleed",
      label: "Brakes",
      title: "Bleed Brakes",
      status,
      remainingText: formatRemainingDays(remainingDays),
    });
  }

  // --- Check Tire Pressure (time-based; always) ---
  {
    const intervalDays = 7;
    const baseline = tirePressureAt || createdAtMs || nowMs;
    const usedDays = daysBetween(nowMs, baseline);
    const remainingDays = intervalDays - usedDays;

    const status = questStatus({
      remaining: remainingDays,
      interval: intervalDays,
    });

    out.push({
      key: "tire_pressure_check",
      label: "Tires",
      title: "Check Tire Pressure",
      status,
      remainingText: formatRemainingDays(remainingDays),
    });
  }

  // --- Top Up Tire Sealant (time-based; tubeless-only) ---
  if (isTubeless) {
    const intervalDays = 60;
    const baseline = sealantTopupAt || createdAtMs || nowMs;
    const usedDays = daysBetween(nowMs, baseline);
    const remainingDays = intervalDays - usedDays;

    const status = questStatus({
      remaining: remainingDays,
      interval: intervalDays,
    });

    out.push({
      key: "tire_sealant_topup",
      label: "Tires",
      title: "Top Up Tire Sealant",
      status,
      remainingText: formatRemainingDays(remainingDays),
      note: "Only for tubeless setups.",
    });
  }

  // --- Brakes (pad replacement) ---
  {
    const usage = sumUsageSince(brakesResetAt);
    const intervalKm = intervals.brakes.km;
    const intervalHours = intervals.brakes.hours;

    // Due if either km or hours passes (whichever comes first)
    const remainingKm = intervalKm - usage.usedKm;
    const remainingHours = intervalHours - usage.usedHours;

    const remaining = Math.min(remainingKm, remainingHours);
    const interval = Math.min(intervalKm, intervalHours);

    const status = questStatus({ remaining, interval });

    out.push({
      key: "brakes",
      label: "Brake pads",
      title: "Replace brake pads",
      status,
      remainingText: formatRemaining({
        remainingKm: remainingKm <= remainingHours ? remainingKm : null,
        remainingHours: remainingHours < remainingKm ? remainingHours : null,
      }),
    });
  }

  // --- Drivetrain service (clean/lube) ---
  {
    const usage = sumUsageSince(drivetrainResetAt);
    const intervalKm = intervals.drivetrain_service.km;
    const remainingKm = intervalKm - usage.usedKm;
    const status = questStatus({
      remaining: remainingKm,
      interval: intervalKm,
    });

    out.push({
      key: "drivetrain_service",
      label: "Drivetrain",
      title: "Clean + lube drivetrain",
      status,
      remainingText: formatRemaining({ remainingKm }),
    });
  }

  // --- Drivetrain replace (chain) ---
  {
    const usage = sumUsageSince(drivetrainResetAt);
    const intervalKm = intervals.drivetrain_replace.km;
    const remainingKm = intervalKm - usage.usedKm;
    const status = questStatus({
      remaining: remainingKm,
      interval: intervalKm,
    });

    out.push({
      key: "drivetrain_replace",
      label: "Drivetrain",
      title: "Inspect chain wear",
      status,
      remainingText: formatRemaining({ remainingKm }),
    });
  }

  // --- Tires ---
  {
    const usage = sumUsageSince(tiresResetAt);
    const intervalKm = intervals.tires.km;
    const remainingKm = intervalKm - usage.usedKm;
    const status = questStatus({
      remaining: remainingKm,
      interval: intervalKm,
    });

    out.push({
      key: "tires",
      label: "Tires",
      title: "Inspect / replace tires",
      status,
      remainingText: formatRemaining({ remainingKm }),
      note: "Tires wear based on terrain and riding style. Replace earlier if knobs are worn or casing shows.",
    });
  }

  // --- Suspension lower / air can ---
  {
    const usage = sumUsageSince(suspLowerResetAt);
    const intervalH = intervals.suspension_lower.hours;
    const remainingH = intervalH - usage.usedHours;
    const status = questStatus({ remaining: remainingH, interval: intervalH });

    out.push({
      key: "suspension_lower",
      label: "Suspension",
      title: "Fork lowers / shock air can service",
      status,
      remainingText: formatRemaining({ remainingHours: remainingH }),
    });
  }

  // --- Suspension full ---
  {
    const usage = sumUsageSince(suspFullResetAt);
    const intervalH = intervals.suspension_full.hours;
    const remainingH = intervalH - usage.usedHours;
    const status = questStatus({ remaining: remainingH, interval: intervalH });

    out.push({
      key: "suspension_full",
      label: "Suspension",
      title: "Full suspension service",
      status,
      remainingText: formatRemaining({ remainingHours: remainingH }),
    });
  }

  // Sort into buckets for existing UI (urgent / due soon)
  const urgent = out
    .filter((q) => q.status === "due")
    .map((q) => ({
      id: q.key,
      title: q.title,
      subtitle: q.remainingText,
      note: q.note || null,
    }));

  const dueSoon = out
    .filter((q) => q.status === "due_soon")
    .map((q) => ({
      id: q.key,
      title: q.title,
      subtitle: q.remainingText,
      note: q.note || null,
    }));

  const ok = out
    .filter((q) => q.status === "ok")
    .map((q) => ({
      id: q.key,
      title: q.title,
      subtitle: q.remainingText,
      note: q.note || null,
    }));

  return { urgent, dueSoon, ok };
}
