export function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

export function findBike(bikes, bikeId) {
  return bikes.find((b) => String(b.id) === String(bikeId)) || null;
}

export function parseFirstNumber(text) {
  const m = String(text || "").match(/(\d+(?:\.\d+)?)/);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) ? n : null;
}

export function safeNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

export function pickComponent(components, type) {
  const list = Array.isArray(components) ? components : [];
  return list.find((c) => String(c?.component_type) === String(type)) || null;
}

export function getComponentName(components, type) {
  const list = Array.isArray(components) ? components : [];
  const found = list.find((c) => String(c?.component_type) === String(type));
  return found?.name || null;
}
