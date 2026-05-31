function safeNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

export function computeWearMultiplier({ terrainTag, weatherTag }) {
  const terrain = String(terrainTag || "").toLowerCase();
  const weather = String(weatherTag || "").toLowerCase();

  let mult = 1;
  if (weather.includes("wet")) mult *= 1.3;

  if (terrain.includes("bike") && terrain.includes("park")) mult *= 1.4;
  if (terrain.includes("park")) mult *= 1.4;

  if (terrain.includes("tech")) mult *= 1.2;

  return mult;
}

export function computeWearDeltas({
  distanceKm,
  descentM,
  durationMin,
  terrainTag,
  weatherTag,
}) {
  const km = safeNum(distanceKm);
  const descent = safeNum(descentM);
  const minutes = safeNum(durationMin);

  const mult = computeWearMultiplier({ terrainTag, weatherTag });

  return {
    multiplier: mult,
    deltas: {
      chainWearPct: (km / 300) * mult,
      tiresWearPct: (km / 200) * mult,
      padsWearPct: (descent / 1000) * mult,
      suspensionServiceHours: minutes > 0 ? minutes / 60 : 0,
    },
  };
}

export function computeServiceWearPercent({
  serviceHours,
  expectedServiceHours,
}) {
  const hours = safeNum(serviceHours);
  const expected = safeNum(expectedServiceHours);
  if (!expected) return 0;
  return clamp((hours / expected) * 100, 0, 100);
}

export function thresholdCrossings({ beforePct, afterPct }) {
  const b = safeNum(beforePct);
  const a = safeNum(afterPct);
  return {
    dueSoon: b < 75 && a >= 75,
    urgent: b < 90 && a >= 90,
  };
}
