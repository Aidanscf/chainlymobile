import { parseFirstNumber } from "./utils";

export function normalizeWheelSizeInput(v) {
  const s = String(v || "").trim();
  if (!s) return null;
  // accept: 29, 27.5, 700
  const n = parseFirstNumber(s);
  if (!n) return s;
  if (Math.abs(n - 27.5) < 0.2) return "27.5";
  if (Math.abs(n - 29) < 0.2) return "29";
  if (Math.abs(n - 700) < 2) return "700";
  return String(n);
}

export function normalizeHubDriverInput(v) {
  const s = String(v || "").trim();
  if (!s) return null;
  const upper = s.toUpperCase();
  if (upper === "HG" || upper === "XD" || upper === "MICROSPLINE") {
    return upper === "MICROSPLINE" ? "MicroSpline" : upper;
  }
  return s;
}

export function normalizeBrakeMountInput(v) {
  const s = String(v || "")
    .trim()
    .toLowerCase();
  if (!s) return null;
  if (s.includes("flat")) return "flat";
  if (s.includes("post")) return "post";
  return s;
}

export function normalizeIntRangeInput(v, { min, max }) {
  const n = parseFirstNumber(v);
  if (n == null) return { value: null, error: null };
  const i = Math.round(n);
  if (i < min || i > max) {
    return {
      value: i,
      error: `That value looks off. Expected ${min}–${max}.`,
    };
  }
  return { value: i, error: null };
}
