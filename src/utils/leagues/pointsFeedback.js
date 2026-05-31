// Lightweight, safe League points feedback bus
//
// Goals:
// - No global state managers
// - No navigation changes
// - Must never throw

const listeners = new Set();

let lastEmitAt = 0;
let lastEmitDelta = null;

export function emitLeaguePointsFeedback(pointsDelta) {
  try {
    const deltaNum = Number(pointsDelta);
    if (!Number.isFinite(deltaNum)) {
      return;
    }

    // Only show positive deltas ("points earned")
    const rounded = Math.round(deltaNum);
    if (rounded <= 0) {
      return;
    }

    // De-dupe: some code paths can update cache + local UI at the same time.
    // This keeps the toast from firing twice.
    const now = Date.now();
    if (lastEmitDelta === rounded && now - lastEmitAt < 900) {
      return;
    }
    lastEmitAt = now;
    lastEmitDelta = rounded;

    listeners.forEach((fn) => {
      try {
        fn(rounded);
      } catch (e) {
        // never throw
      }
    });
  } catch (e) {
    // never throw
  }
}

export function subscribeLeaguePointsFeedback(listener) {
  try {
    if (typeof listener !== "function") {
      return () => {};
    }

    listeners.add(listener);

    return () => {
      try {
        listeners.delete(listener);
      } catch (e) {
        // no-op
      }
    };
  } catch (e) {
    return () => {};
  }
}
