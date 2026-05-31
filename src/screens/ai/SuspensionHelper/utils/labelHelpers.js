export function terrainLabel(tag) {
  const t = String(tag || "").toLowerCase();
  if (t === "xc") return "XC";
  if (t === "tech") return "Tech";
  if (t === "flow") return "Flow";
  if (t === "park") return "Bike Park";
  if (t === "jumps") return "Jumps";
  return "Trail";
}

export function weatherLabel(tag) {
  const w = String(tag || "").toLowerCase();
  if (w === "wet") return "Wet";
  if (w === "loose") return "Loose";
  if (w === "dusty") return "Dusty";
  return "Dry";
}
