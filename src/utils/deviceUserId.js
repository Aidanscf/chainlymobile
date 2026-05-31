import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "chainly_device_user_id_v1";

let cached = null;
let inflight = null;

function uuidv4() {
  // RFC4122-ish UUID v4 (good enough for client identifiers)
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export async function getDeviceUserId() {
  if (cached) {
    return cached;
  }
  if (inflight) {
    return inflight;
  }

  inflight = (async () => {
    try {
      const existing = await AsyncStorage.getItem(STORAGE_KEY);
      const trimmed = existing ? String(existing).trim() : null;
      if (trimmed) {
        cached = trimmed;
        return cached;
      }

      const next = uuidv4();
      await AsyncStorage.setItem(STORAGE_KEY, next);
      cached = next;
      return cached;
    } catch (e) {
      // If storage fails, still return a stable-ish in-memory id for this run.
      console.error(e);
      cached = cached || uuidv4();
      return cached;
    } finally {
      inflight = null;
    }
  })();

  return inflight;
}

export default getDeviceUserId;
