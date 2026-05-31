import {
  normalizeWheelSizeInput,
  normalizeHubDriverInput,
  normalizeBrakeMountInput,
  normalizeIntRangeInput,
} from "@/store/chainlyStore/normalization";

function requiredText(v) {
  const s = String(v || "").trim();
  return s.length ? s : null;
}

function optionalText(v) {
  const s = String(v || "").trim();
  return s.length ? s : null;
}

function toIntOrNull(v) {
  const s = String(v ?? "").trim();
  if (!s) return null;
  const n = Number(s);
  if (!Number.isFinite(n)) return null;
  return Math.round(n);
}

function normalizeWheelConfigInput(v) {
  const s = String(v ?? "")
    .trim()
    .toLowerCase();
  if (!s) return "unknown";
  const allowed = new Set([
    "29",
    "27.5",
    "mullet_29f_27.5r",
    "mixed_other",
    "unknown",
  ]);
  return allowed.has(s) ? s : "unknown";
}

function normalizeYmdOrNull(v) {
  const s = String(v ?? "").trim();
  if (!s) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  return s;
}

function ymdToIsoMidday(ymd) {
  const s = normalizeYmdOrNull(ymd);
  if (!s) return null;
  const d = new Date(`${s}T12:00:00`);
  if (!Number.isFinite(d.getTime())) return null;
  return d.toISOString();
}

export function validateBikeBasics(draft) {
  const errors = {};
  const name = requiredText(draft?.name);
  if (!name) {
    errors.name = "Bike name is required";
  }

  const year = toIntOrNull(draft?.model_year);
  if (draft?.model_year && (year == null || year < 1970 || year > 2050)) {
    errors.model_year = "Year should look like 1999–2050";
  }

  return { ok: Object.keys(errors).length === 0, errors };
}

export function validateBikeSpecs(draft) {
  const errors = {};

  const wheel = normalizeWheelSizeInput(draft?.wheel_size);
  if (!wheel) errors.wheel_size = "Pick a wheel size";

  const hub = normalizeHubDriverInput(draft?.hub_driver);
  if (!hub) errors.hub_driver = "Pick a hub driver";

  const mount = normalizeBrakeMountInput(draft?.brake_mount);
  if (!mount) errors.brake_mount = "Pick a brake mount";

  const speed = toIntOrNull(draft?.drivetrain_speed);
  if (!speed) errors.drivetrain_speed = "Pick a drivetrain speed";

  const rotor = normalizeIntRangeInput(draft?.rotor_size, {
    min: 140,
    max: 220,
  });
  if (rotor.value == null) {
    errors.rotor_size = "Add a max rotor size";
  } else if (rotor.error) {
    errors.rotor_size = rotor.error;
  }

  // Frame size is optional but encouraged.
  const frameSize = optionalText(draft?.frame_size);
  if (draft?.frame_size && !frameSize) {
    errors.frame_size = "Frame size looks empty";
  }

  return { ok: Object.keys(errors).length === 0, errors };
}

export function validateBikeSuspension(_draft) {
  // Suspension is optional, but if they enter a travel value we validate range.
  const errors = {};

  const forkTravel = normalizeIntRangeInput(_draft?.fork_travel_mm, {
    min: 0,
    max: 220,
  });
  if (_draft?.fork_travel_mm && forkTravel.error) {
    errors.fork_travel_mm = forkTravel.error;
  }

  const rearTravel = normalizeIntRangeInput(_draft?.rear_travel_mm, {
    min: 0,
    max: 220,
  });
  if (_draft?.rear_travel_mm && rearTravel.error) {
    errors.rear_travel_mm = rearTravel.error;
  }

  return { ok: Object.keys(errors).length === 0, errors };
}

export function validateBikeDrivetrain(draft) {
  const errors = {};

  const rf = normalizeIntRangeInput(draft?.rotor_front_mm, {
    min: 140,
    max: 220,
  });
  if (draft?.rotor_front_mm && rf.error) errors.rotor_front_mm = rf.error;

  const rr = normalizeIntRangeInput(draft?.rotor_rear_mm, {
    min: 140,
    max: 220,
  });
  if (draft?.rotor_rear_mm && rr.error) errors.rotor_rear_mm = rr.error;

  return { ok: Object.keys(errors).length === 0, errors };
}

export function validateBikeWheels(_draft) {
  return { ok: true, errors: {} };
}

export function normalizeDraftToCanonicalBike(draft) {
  const name = requiredText(draft?.name) || "New Bike";
  const bikeType = String(draft?.bike_type || "Trail").trim() || "Trail";

  const wheelSize = normalizeWheelSizeInput(draft?.wheel_size);
  const hubDriver = normalizeHubDriverInput(draft?.hub_driver);
  const brakeMount = normalizeBrakeMountInput(draft?.brake_mount);

  const rotorMax = normalizeIntRangeInput(draft?.rotor_size, {
    min: 140,
    max: 220,
  }).value;
  const drivetrainSpeed = toIntOrNull(draft?.drivetrain_speed);

  const travelFront = normalizeIntRangeInput(draft?.fork_travel_mm, {
    min: 0,
    max: 220,
  }).value;
  const travelRear = normalizeIntRangeInput(draft?.rear_travel_mm, {
    min: 0,
    max: 220,
  }).value;

  const year = toIntOrNull(draft?.model_year);

  const purchaseDate = normalizeYmdOrNull(draft?.purchase_date);
  const purchaseYear = purchaseDate ? Number(purchaseDate.slice(0, 4)) : null;

  return {
    name,
    bike_type: bikeType,
    wheel_size: wheelSize,
    wheel_config: normalizeWheelConfigInput(draft?.wheel_config),
    hub_driver: hubDriver,
    brake_mount: brakeMount,
    rotor_size: rotorMax,
    drivetrain_speed: drivetrainSpeed,
    suspension_travel_front: travelFront,
    suspension_travel_rear: travelRear,
    image_url: draft?.image_url || null,
    brand: optionalText(draft?.brand),
    model: optionalText(draft?.model),
    model_year: year,
    frame_size: optionalText(draft?.frame_size),

    // NEW: optional details
    purchase_date: purchaseDate,
    purchase_year: purchaseDate ? purchaseYear : null,
    serial_number: optionalText(draft?.serial_number),

    // NEW: used for tubeless-aware quests (sealant)
    is_tubeless: Boolean(draft?.tubeless),
  };
}

export function buildComponentsFromDraft(draft) {
  const now = new Date().toISOString();

  const safeName = (s) => {
    const v = String(s || "").trim();
    return v.length ? v : null;
  };

  const cameWithBike = Boolean(draft?.components_came_with_bike);
  const installedAtIso = ymdToIsoMidday(draft?.components_installed_at);
  const purchaseAtIso = ymdToIsoMidday(draft?.purchase_date);
  const defaultInstallIso =
    installedAtIso || (cameWithBike ? purchaseAtIso : null) || now;

  const fork = [safeName(draft?.fork_brand), safeName(draft?.fork_model)]
    .filter(Boolean)
    .join(" ");
  const forkTravel = normalizeIntRangeInput(draft?.fork_travel_mm, {
    min: 0,
    max: 220,
  }).value;
  const forkSpring = safeName(draft?.fork_spring);
  const forkLabelParts = [
    fork || null,
    forkTravel ? `${forkTravel}mm` : null,
    forkSpring ? `(${forkSpring})` : null,
  ].filter(Boolean);

  const shock = [safeName(draft?.shock_brand), safeName(draft?.shock_model)]
    .filter(Boolean)
    .join(" ");
  const rearTravel = normalizeIntRangeInput(draft?.rear_travel_mm, {
    min: 0,
    max: 220,
  }).value;
  const shockSpring = safeName(draft?.shock_spring);
  const shockLabelParts = [
    shock || null,
    rearTravel ? `${rearTravel}mm` : null,
    shockSpring ? `(${shockSpring})` : null,
  ].filter(Boolean);

  const rotorFront = normalizeIntRangeInput(draft?.rotor_front_mm, {
    min: 140,
    max: 220,
  }).value;
  const rotorRear = normalizeIntRangeInput(draft?.rotor_rear_mm, {
    min: 140,
    max: 220,
  }).value;

  const tireFrontParts = [
    safeName(draft?.tire_front_model),
    safeName(draft?.tire_front_width),
  ].filter(Boolean);
  const tireRearParts = [
    safeName(draft?.tire_rear_model),
    safeName(draft?.tire_rear_width),
  ].filter(Boolean);

  const tubelessTag = draft?.tubeless ? "(Tubeless)" : "";

  const components = [];

  const withMeta = (row) => ({
    ...row,
    install_date: row.install_date || defaultInstallIso,
    came_with_bike: cameWithBike,
  });

  // Canonical types used by spec sheet
  if (forkLabelParts.length) {
    components.push(
      withMeta({
        component_type: "fork",
        name: forkLabelParts.join(" "),
        wear_percent: 0,
      }),
    );
  }

  if (shockLabelParts.length) {
    components.push(
      withMeta({
        component_type: "shock",
        name: shockLabelParts.join(" "),
        wear_percent: 0,
      }),
    );
  }

  // Drivetrain
  if (safeName(draft?.crankset)) {
    components.push(
      withMeta({
        component_type: "crankset",
        name: safeName(draft?.crankset),
        wear_percent: 0,
      }),
    );
  }
  if (safeName(draft?.cassette)) {
    components.push(
      withMeta({
        component_type: "cassette",
        name: safeName(draft?.cassette),
        wear_percent: 0,
      }),
    );
  }
  if (safeName(draft?.chain_type)) {
    components.push(
      withMeta({
        component_type: "chain",
        name: safeName(draft?.chain_type),
        wear_percent: 0,
      }),
    );
  }

  // NEW: drivetrain slots
  if (safeName(draft?.derailleur_model)) {
    components.push(
      withMeta({
        component_type: "derailleur",
        name: safeName(draft?.derailleur_model),
        wear_percent: 0,
      }),
    );
  }
  if (safeName(draft?.shifter_model)) {
    components.push(
      withMeta({
        component_type: "shifter",
        name: safeName(draft?.shifter_model),
        wear_percent: 0,
      }),
    );
  }

  const bbParts = [
    safeName(draft?.bottom_bracket_type),
    safeName(draft?.bottom_bracket_standard),
  ].filter(Boolean);
  if (bbParts.length) {
    components.push(
      withMeta({
        component_type: "bottom_bracket",
        name: bbParts.join(" "),
        wear_percent: 0,
      }),
    );
  }

  // Brakes
  if (safeName(draft?.brake_model)) {
    components.push(
      withMeta({
        component_type: "brakes",
        name: safeName(draft?.brake_model),
        wear_percent: 0,
      }),
    );
  }
  if (rotorFront) {
    components.push(
      withMeta({
        component_type: "rotor_front",
        name: `${rotorFront}mm`,
        wear_percent: 0,
      }),
    );
  }
  if (rotorRear) {
    components.push(
      withMeta({
        component_type: "rotor_rear",
        name: `${rotorRear}mm`,
        wear_percent: 0,
      }),
    );
  }

  // NEW: cockpit slot
  const dropperTravel = normalizeIntRangeInput(draft?.dropper_travel_mm, {
    min: 0,
    max: 250,
  }).value;
  const dropperParts = [
    safeName(draft?.dropper_brand),
    safeName(draft?.dropper_model),
  ].filter(Boolean);
  const dropperLabelParts = [
    dropperParts.length ? dropperParts.join(" ") : null,
    dropperTravel ? `${dropperTravel}mm` : null,
  ].filter(Boolean);
  if (dropperLabelParts.length) {
    components.push(
      withMeta({
        component_type: "dropper",
        name: dropperLabelParts.join(" "),
        wear_percent: 0,
      }),
    );
  }

  // Wheels & tires
  if (safeName(draft?.wheelset_model)) {
    components.push(
      withMeta({
        component_type: "wheelset",
        name: safeName(draft?.wheelset_model),
        wear_percent: 0,
      }),
    );
  }
  if (tireFrontParts.length) {
    components.push(
      withMeta({
        component_type: "tire_front",
        name: `${tireFrontParts.join(" ")} ${tubelessTag}`.trim(),
        wear_percent: 0,
      }),
    );
  }
  if (tireRearParts.length) {
    components.push(
      withMeta({
        component_type: "tire_rear",
        name: `${tireRearParts.join(" ")} ${tubelessTag}`.trim(),
        wear_percent: 0,
      }),
    );
  }

  return components;
}
