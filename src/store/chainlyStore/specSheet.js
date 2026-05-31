import { getComponentName } from "./utils";

function formatBrakePadCompound(raw) {
  const v = String(raw || "")
    .trim()
    .toLowerCase();
  if (v === "resin" || v.includes("organic")) return "Resin (Organic)";
  if (v === "semi_metallic" || v.includes("semi")) return "Semi-metallic";
  if (v === "metallic" || v.includes("sinter")) return "Metallic (Sintered)";
  return "Unknown";
}

function formatBrakeFluidType(raw) {
  const v = String(raw || "")
    .trim()
    .toLowerCase();
  if (v === "dot") return "DOT";
  if (v === "mineral" || v.includes("mineral")) return "Mineral oil";
  return "Unknown";
}

function formatWheelConfig(raw) {
  const v = String(raw || "").trim();
  if (!v) return "Unknown";
  if (v === "29") return '29"';
  if (v === "27.5") return '27.5"';
  if (v === "mullet_29f_27.5r") return "Mullet (29F / 27.5R)";
  if (v === "mixed_other") return "Mixed / Other";
  if (v === "unknown") return "Unknown";
  return v;
}

export function buildSpecSheetFromCanonical({ bike, components }) {
  const wheelSize = bike?.wheel_size || null;
  const wheelConfig = bike?.wheel_config ?? bike?.wheelConfig ?? null;
  const hubDriver = bike?.hub_driver || null;
  const brakeMount = bike?.brake_mount || null;
  const rotorSize = bike?.rotor_size != null ? String(bike.rotor_size) : null;
  const drivetrainSpeed =
    bike?.drivetrain_speed != null ? String(bike.drivetrain_speed) : null;
  const tFront =
    bike?.suspension_travel_front != null
      ? String(bike.suspension_travel_front)
      : null;
  const tRear =
    bike?.suspension_travel_rear != null
      ? String(bike.suspension_travel_rear)
      : null;

  const forkName = getComponentName(components, "fork");
  const shockName = getComponentName(components, "shock");

  const derailleurName = getComponentName(components, "derailleur");
  const shifterName = getComponentName(components, "shifter");
  const bbName = getComponentName(components, "bottom_bracket");
  const dropperName = getComponentName(components, "dropper");

  const brakePadCompound = formatBrakePadCompound(
    bike?.brake_pad_compound ?? bike?.brakePadCompound,
  );
  const brakeFluidType = formatBrakeFluidType(
    bike?.brake_fluid_type ?? bike?.brakeFluidType,
  );

  // Minimal-but-real spec sheet. We keep labels stable so existing UI stays the same.
  return [
    {
      key: "drivetrain",
      title: "Drivetrain",
      rows: [
        {
          key: "bike.drivetrain_speed",
          label: "Drivetrain Speed",
          value: drivetrainSpeed ? `${drivetrainSpeed}-speed` : "—",
        },
        {
          key: "bike.hub_driver",
          label: "Hub Driver",
          value: hubDriver || "—",
        },
        {
          key: "component.derailleur.name",
          label: "Derailleur",
          value: derailleurName || "—",
        },
        {
          key: "component.shifter.name",
          label: "Shifter",
          value: shifterName || "—",
        },
        {
          key: "component.bottom_bracket.name",
          label: "Bottom Bracket",
          value: bbName || "—",
        },
      ],
    },
    {
      key: "suspension",
      title: "Suspension",
      rows: [
        {
          key: "component.fork.name",
          label: "Fork",
          value: forkName || "—",
        },
        {
          key: "component.shock.name",
          label: "Rear Shock",
          value: shockName || "—",
        },
        {
          key: "bike.suspension_travel_front",
          label: "Front Travel",
          value: tFront ? `${tFront}mm` : "—",
        },
        {
          key: "bike.suspension_travel_rear",
          label: "Rear Travel",
          value: tRear ? `${tRear}mm` : "—",
        },
      ],
    },
    {
      key: "wheels",
      title: "Wheels",
      rows: [
        {
          key: "bike.wheel_size",
          label: "Wheel Size",
          value: wheelSize ? `${wheelSize}"` : "—",
        },
        {
          key: "bike.wheel_config",
          label: "Wheel Config",
          value: formatWheelConfig(wheelConfig),
        },
      ],
    },
    {
      key: "brakes",
      title: "Brakes",
      rows: [
        {
          key: "bike.brake_pad_compound",
          label: "Brake Pad Compound",
          value: brakePadCompound || "Unknown",
        },
        {
          key: "bike.brake_fluid_type",
          label: "Brake Fluid Type",
          value: brakeFluidType || "Unknown",
        },
        {
          key: "bike.brake_mount",
          label: "Brake Mount",
          value: brakeMount || "—",
        },
        {
          key: "bike.rotor_size",
          label: "Rotor Size",
          value: rotorSize ? `${rotorSize}mm` : "—",
        },
      ],
    },
    {
      key: "cockpit",
      title: "Cockpit",
      rows: [
        {
          key: "component.dropper.name",
          label: "Dropper Post",
          value: dropperName || "—",
        },
      ],
    },
  ];
}

export function buildSpecPreviewFromCanonical({ bike, components }) {
  const list = [];

  const wheel = bike?.wheel_size ? `${bike.wheel_size}"` : null;
  if (wheel) {
    list.push({ key: "wheel_size", label: "Wheel Size", value: wheel });
  }

  const speed =
    bike?.drivetrain_speed != null ? `${bike.drivetrain_speed}-speed` : null;
  if (speed) {
    list.push({ key: "drivetrain_speed", label: "Drivetrain", value: speed });
  }

  const travelFront =
    bike?.suspension_travel_front != null
      ? `${bike.suspension_travel_front}mm`
      : null;
  if (travelFront) {
    list.push({ key: "fork_travel", label: "Fork Travel", value: travelFront });
  }

  const fork = getComponentName(components, "fork");
  if (fork) {
    list.push({ key: "fork", label: "Fork", value: fork });
  }

  return list.slice(0, 4);
}
