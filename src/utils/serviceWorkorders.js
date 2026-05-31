import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "chainly_service_workorders_v1";

function safeParseObject(raw) {
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch (e) {
    return null;
  }
}

export function normalizeWorkorder(row) {
  const r = row && typeof row === "object" ? row : {};
  const id = r.id ? String(r.id) : "";

  const bikeId = r.bike_id ?? r.bikeId;
  const bike_id = bikeId ? String(bikeId) : "";

  const title = r.title ? String(r.title) : "";

  const serviceDateRaw = r.service_date ?? r.serviceDate;
  const service_date = serviceDateRaw ? String(serviceDateRaw) : "";

  const imageUrlRaw = r.image_url ?? r.imageUrl;
  const image_url = imageUrlRaw ? String(imageUrlRaw) : "";

  const createdAtRaw = r.created_at ?? r.createdAt;
  const created_at = createdAtRaw ? String(createdAtRaw) : null;

  const pending = Boolean(r.pending);

  // --- NEW: persisted AI fields (safe defaults)
  const ai_status = r.ai_status ? String(r.ai_status) : "idle";
  const ai_summary =
    r.ai_summary && typeof r.ai_summary === "object" ? r.ai_summary : null;
  const ai_summary_text = r.ai_summary_text ? String(r.ai_summary_text) : "";

  const confRaw = r.ai_confidence ?? r.aiConfidence;
  const confNum = Number(confRaw);
  const ai_confidence = Number.isFinite(confNum) ? confNum : null;

  const aiCreatedAtRaw = r.ai_created_at ?? r.aiCreatedAt;
  const ai_created_at = aiCreatedAtRaw ? String(aiCreatedAtRaw) : null;

  const ai_error = r.ai_error ? String(r.ai_error) : null;

  return {
    id,
    bike_id,
    title,
    service_date,
    image_url,
    image_path: r.image_path ?? r.imagePath ?? null,
    created_at,
    pending,

    ai_status,
    ai_summary,
    ai_summary_text,
    ai_confidence,
    ai_created_at,
    ai_error,
  };
}

export async function readServiceWorkordersMap() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const obj = safeParseObject(raw);
    return obj || {};
  } catch (e) {
    console.error(e);
    return {};
  }
}

export async function persistServiceWorkordersMap(map) {
  try {
    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(map && typeof map === "object" ? map : {}),
    );
  } catch (e) {
    console.error(e);
  }
}

export async function listLocalWorkordersByBikeId(bikeId) {
  const id = String(bikeId || "");
  if (!id) return [];

  const map = await readServiceWorkordersMap();
  const list = Array.isArray(map?.[id]) ? map[id] : [];

  return list.map(normalizeWorkorder).filter((x) => x.id && x.bike_id === id);
}

export async function upsertLocalWorkorder(workorder) {
  const w = normalizeWorkorder(workorder);
  if (!w.id || !w.bike_id) {
    return { ok: false };
  }

  const map = await readServiceWorkordersMap();
  const current = Array.isArray(map?.[w.bike_id]) ? map[w.bike_id] : [];

  const nextList = [w, ...current]
    .map(normalizeWorkorder)
    .filter((x) => x.id)
    .filter(
      (x, idx, arr) =>
        arr.findIndex((y) => String(y.id) === String(x.id)) === idx,
    );

  const nextMap = { ...map, [w.bike_id]: nextList };
  await persistServiceWorkordersMap(nextMap);

  return { ok: true, workorder: w };
}

export async function deleteLocalWorkorder({ bikeId, workorderId }) {
  const b = String(bikeId || "");
  const w = String(workorderId || "");
  if (!b || !w) return { ok: false };

  const map = await readServiceWorkordersMap();
  const current = Array.isArray(map?.[b]) ? map[b] : [];
  const nextList = current
    .map(normalizeWorkorder)
    .filter((x) => String(x.id) !== w);

  const nextMap = { ...map, [b]: nextList };
  await persistServiceWorkordersMap(nextMap);
  return { ok: true };
}

export function sortWorkordersNewestFirst(list) {
  const items = Array.isArray(list) ? list : [];

  const getSortKey = (w) => {
    const d = w?.service_date ? new Date(String(w.service_date)) : null;
    const service = d && Number.isFinite(d.getTime()) ? d.getTime() : 0;

    const c = w?.created_at ? new Date(String(w.created_at)) : null;
    const created = c && Number.isFinite(c.getTime()) ? c.getTime() : 0;

    return Math.max(service, created);
  };

  return [...items].sort((a, b) => getSortKey(b) - getSortKey(a));
}
