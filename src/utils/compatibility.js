// REMOVE this import:
// import { riderCharacter } from "@/data/mock";

// MVP compatibility engine (rule-based)
// TODO: replace with a real compatibility graph + product API normalization.

export function parseNumberFromText(text) {
  if (!text) {
    return null;
  }
  const match = String(text).match(/(\d+)(?:\.(\d+))?/);
  if (!match) {
    return null;
  }
  const whole = match[1];
  const frac = match[2];
  const num = frac ? Number(`${whole}.${frac}`) : Number(whole);
  return Number.isFinite(num) ? num : null;
}

export function inferBikeCompatibilityProfile({ bike, bikeDetail }) {
  // We keep this intentionally simple for MVP.
  // Canonical source of truth: Bike standards fields (with a safe fallback to spec text).

  // Defaults
  let drivetrain = { driver: "HG", speedCount: 12 };
  let brakes = { rotorFrontMm: 180, rotorRearMm: 180, mount: "post" };
  let wheels = { wheelSize: 29, maxTireWidthIn: 2.5 };
  let suspension = { forkTravelMm: 150, rearTravelMm: 150, mount: "trunnion" };

  // --- Prefer canonical Bike fields when present ---
  try {
    const driver = bike?.hub_driver ? String(bike.hub_driver) : null;
    const speed =
      bike?.drivetrain_speed != null ? Number(bike.drivetrain_speed) : null;
    const brakeMount = bike?.brake_mount ? String(bike.brake_mount) : null;
    const rotor = bike?.rotor_size != null ? Number(bike.rotor_size) : null;
    const wheel = bike?.wheel_size ? String(bike.wheel_size) : null;
    const tFront =
      bike?.suspension_travel_front != null
        ? Number(bike.suspension_travel_front)
        : null;
    const tRear =
      bike?.suspension_travel_rear != null
        ? Number(bike.suspension_travel_rear)
        : null;

    if (driver) {
      drivetrain = { ...drivetrain, driver };
    }
    if (Number.isFinite(speed)) {
      drivetrain = { ...drivetrain, speedCount: Math.round(speed) };
    }

    if (brakeMount) {
      brakes = { ...brakes, mount: brakeMount };
    }
    if (Number.isFinite(rotor)) {
      brakes = { ...brakes, rotorFrontMm: Math.round(rotor) };
    }

    if (wheel) {
      const wNum = parseNumberFromText(wheel);
      wheels = { ...wheels, wheelSize: wNum || wheel };
    }

    if (Number.isFinite(tFront)) {
      suspension = { ...suspension, forkTravelMm: Math.round(tFront) };
    }
    if (Number.isFinite(tRear)) {
      suspension = { ...suspension, rearTravelMm: Math.round(tRear) };
    }
  } catch (e) {
    // no-op
  }

  // --- Fallback: infer from spec text when available (legacy) ---
  try {
    const drivetrainRows = bikeDetail?.specSheet?.find(
      (s) => s.key === "drivetrain",
    )?.rows;
    const cassetteRow = drivetrainRows?.find(
      (r) => r.label === "Cassette",
    )?.value;
    const cassetteStart = String(cassetteRow || "").split("–")[0];
    if (cassetteStart && cassetteStart.includes("10")) {
      drivetrain = { ...drivetrain, driver: "XD" };
    }

    const chainRow = drivetrainRows?.find((r) => r.label === "Chain")?.value;
    const speed = chainRow?.includes("12") ? 12 : null;
    if (speed) {
      drivetrain = { ...drivetrain, speedCount: speed };
    }

    const brakeRows = bikeDetail?.specSheet?.find(
      (s) => s.key === "brakes",
    )?.rows;
    const rotors = brakeRows?.find((r) => r.label === "Rotors")?.value;
    if (rotors) {
      const parts = String(rotors)
        .split("/")
        .map((s) => s.trim());
      const f = parseNumberFromText(parts?.[0]);
      const r = parseNumberFromText(parts?.[1]);
      if (f) {
        brakes = { ...brakes, rotorFrontMm: f };
      }
      if (r) {
        brakes = { ...brakes, rotorRearMm: r };
      }
    }

    const wheelsRows = bikeDetail?.specSheet?.find(
      (s) => s.key === "wheels",
    )?.rows;
    const wheelRow = wheelsRows?.find((r) => r.label === "Wheels")?.value;
    if (wheelRow && String(wheelRow).includes("700")) {
      wheels = { ...wheels, wheelSize: 700 };
    }
  } catch (e) {
    // no-op
  }

  return {
    bikeName: bike?.name || "Your bike",
    drivetrain,
    brakes,
    wheels,
    suspension,
  };
}

export function checkCompatibility({ focus, product, bikeProfile }) {
  if (!product || !bikeProfile) {
    return { compatible: true };
  }

  // Drivetrain
  if (focus === "drivetrain") {
    const needDriver = product?.standards?.driver;
    const needSpeed = product?.standards?.speedCount;

    if (needDriver && needDriver !== bikeProfile.drivetrain.driver) {
      return {
        compatible: false,
        reason: `This won’t fit your current ${bikeProfile.drivetrain.driver} driver without a hub/driver conversion.`,
      };
    }

    if (needSpeed && needSpeed !== bikeProfile.drivetrain.speedCount) {
      return {
        compatible: false,
        reason: `This is for ${needSpeed}-speed drivetrains, but your bike is set up for ${bikeProfile.drivetrain.speedCount}-speed.`,
      };
    }
  }

  // Brakes
  if (focus === "brakes") {
    const rotor = product?.standards?.rotorMm;
    if (rotor && rotor > bikeProfile.brakes.rotorFrontMm + 20) {
      return {
        compatible: false,
        reason: `That rotor size is bigger than your front setup. You may need a new adapter or fork clearance check.`,
      };
    }
  }

  // Wheels & Tires
  if (focus === "wheels_tires") {
    const wheelSize = product?.standards?.wheelSize;
    if (wheelSize && wheelSize !== bikeProfile.wheels.wheelSize) {
      return {
        compatible: false,
        reason: `This is built for ${wheelSize}" wheels, but your bike is ${bikeProfile.wheels.wheelSize}.`,
      };
    }

    const tireWidth = product?.standards?.tireWidthIn;
    if (tireWidth && tireWidth > bikeProfile.wheels.maxTireWidthIn) {
      return {
        compatible: false,
        reason: `That tire may be too wide for your frame clearance (max ~${bikeProfile.wheels.maxTireWidthIn}").`,
      };
    }
  }

  // Suspension
  if (focus === "suspension") {
    const travel = product?.standards?.travelMm;
    if (
      travel &&
      bikeProfile.suspension.forkTravelMm &&
      Math.abs(travel - bikeProfile.suspension.forkTravelMm) > 30
    ) {
      return {
        compatible: false,
        reason: `This travel range is pretty far from your current setup — double-check geometry + warranty limits.`,
      };
    }
  }

  return { compatible: true };
}

export function buildWhyThisFitsCopy({ product, bikeProfile, riderCharacter }) {
  const skills = riderCharacter?.skills || [];
  const byKey = new Map(skills.map((s) => [s.key, s.value]));
  const climbing = byKey.get("climbing") || 0;
  const tech = byKey.get("tech") || 0;
  const jumping = byKey.get("jumping") || 0;

  const durabilityLine =
    tech >= 80 ? "durability for techy hits" : "a smooth, reliable feel";
  const weightLine =
    climbing >= 85
      ? "without dragging you uphill"
      : "without overthinking grams";
  const popLine =
    jumping >= 80
      ? "and keep your pop on takeoffs"
      : "and stay planted when it gets fast";

  const bikeName = bikeProfile?.bikeName || "your bike";
  const driver = bikeProfile?.drivetrain?.driver;
  const speed = bikeProfile?.drivetrain?.speedCount;
  const standardsLine = driver && speed ? `(${driver} • ${speed}‑speed)` : "";

  return `Built for ${bikeName} ${standardsLine}: this pick matches your setup standards, leans into ${durabilityLine}, ${weightLine}, ${popLine}.`;
}
