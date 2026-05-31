export function buildBikeProfileForAI(bike) {
  if (!bike || typeof bike !== "object") return null;

  // Important: do NOT include health score / maintenance fields here.
  // This is just lightweight context to help the AI be more accurate.
  return {
    bike_id: bike?.id != null ? String(bike.id) : null,
    bike_name: bike?.name != null ? String(bike.name) : null,
    bike_type: bike?.bike_type != null ? String(bike.bike_type) : null,

    // Spec-ish fields that exist in our schema
    wheel_size: bike?.wheel_size ?? null,
    hub_driver: bike?.hub_driver ?? null,
    brake_mount: bike?.brake_mount ?? null,
    rotor_size: bike?.rotor_size ?? null,
    drivetrain_speed: bike?.drivetrain_speed ?? null,
    suspension_travel_front: bike?.suspension_travel_front ?? null,
    suspension_travel_rear: bike?.suspension_travel_rear ?? null,
    is_tubeless: bike?.is_tubeless ?? null,

    brake_pad_compound: bike?.brake_pad_compound ?? null,
    brake_fluid_type: bike?.brake_fluid_type ?? null,
    brake_brand: bike?.brake_brand ?? null,

    brand: bike?.brand ?? null,
    model: bike?.model ?? null,
    model_year: bike?.model_year ?? null,
    frame_size: bike?.frame_size ?? null,
  };
}
