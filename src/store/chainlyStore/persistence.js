import AsyncStorage from "@react-native-async-storage/async-storage";

const BIKES_STORAGE_KEY = "chainly_bikes_v1";
const COMPONENTS_STORAGE_KEY = "chainly_components_v1";
const MAINTENANCE_EVENTS_STORAGE_KEY = "chainly_maintenance_events_v1";
const PENDING_BIKE_CREATES_STORAGE_KEY = "chainly_pending_bike_creates_v1";

export async function persistBikes(bikes) {
  try {
    await AsyncStorage.setItem(BIKES_STORAGE_KEY, JSON.stringify(bikes));
  } catch (e) {
    console.error(e);
  }
}

export async function readPersistedBikes() {
  try {
    const raw = await AsyncStorage.getItem(BIKES_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return null;
    }
    return parsed;
  } catch (e) {
    console.error(e);
    return null;
  }
}

export async function persistComponentsMap(map) {
  try {
    await AsyncStorage.setItem(COMPONENTS_STORAGE_KEY, JSON.stringify(map));
  } catch (e) {
    console.error(e);
  }
}

export async function readPersistedComponentsMap() {
  try {
    const raw = await AsyncStorage.getItem(COMPONENTS_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch (e) {
    console.error(e);
    return null;
  }
}

export async function persistMaintenanceEventsMap(map) {
  try {
    await AsyncStorage.setItem(
      MAINTENANCE_EVENTS_STORAGE_KEY,
      JSON.stringify(map),
    );
  } catch (e) {
    console.error(e);
  }
}

export async function readPersistedMaintenanceEventsMap() {
  try {
    const raw = await AsyncStorage.getItem(MAINTENANCE_EVENTS_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch (e) {
    console.error(e);
    return null;
  }
}

export async function persistPendingBikeCreates(list) {
  try {
    await AsyncStorage.setItem(
      PENDING_BIKE_CREATES_STORAGE_KEY,
      JSON.stringify(Array.isArray(list) ? list : []),
    );
  } catch (e) {
    console.error(e);
  }
}

export async function readPersistedPendingBikeCreates() {
  try {
    const raw = await AsyncStorage.getItem(PENDING_BIKE_CREATES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch (e) {
    console.error(e);
    return [];
  }
}
