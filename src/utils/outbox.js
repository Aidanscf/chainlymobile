import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSyncStore } from "@/store/sync";

const OUTBOX_KEY = "chainly_outbox_v1";

function devLog(...args) {
  const isDev = process.env.NODE_ENV !== "production";
  if (isDev) {
    console.log("[sync]", ...args);
  }
}

function safeParse(str) {
  try {
    return JSON.parse(str);
  } catch (e) {
    return null;
  }
}

export async function getOutbox() {
  try {
    const raw = await AsyncStorage.getItem(OUTBOX_KEY);
    const parsed = raw ? safeParse(raw) : null;
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error(e);
    return [];
  }
}

async function setOutbox(next) {
  const list = Array.isArray(next) ? next : [];
  try {
    await AsyncStorage.setItem(OUTBOX_KEY, JSON.stringify(list));
  } catch (e) {
    console.error(e);
  }

  try {
    await useSyncStore.getState().setOutboxCount(list.length);
  } catch (e) {
    // no-op
  }
}

export async function addOutboxItem(item) {
  const it = item && typeof item === "object" ? item : null;
  if (!it?.type) return { ok: false };

  const createdAt = it.createdAt
    ? String(it.createdAt)
    : new Date().toISOString();
  const normalized = {
    type: String(it.type),
    payload: it.payload ?? null,
    userId: it.userId ? String(it.userId) : null,
    createdAt,
  };

  const current = await getOutbox();
  const next = [normalized, ...current].slice(0, 250);
  await setOutbox(next);
  devLog("outbox add", normalized.type);
  return { ok: true };
}

export async function removeOutboxItems(predicate) {
  const current = await getOutbox();
  const fn = typeof predicate === "function" ? predicate : () => false;
  const next = current.filter((x) => !fn(x));
  await setOutbox(next);
  return { ok: true, removed: current.length - next.length };
}

export async function clearOutbox() {
  await setOutbox([]);
  return { ok: true };
}
