// Tiny in-app event emitter for Leagues MVP
//
// Safety rules:
// - Must never throw
// - No external deps
// - Used only for "state updated" notifications (no payload assumptions)

const listenersByEvent = {
  updated: new Set(),
};

function safeCall(fn) {
  try {
    fn?.();
  } catch (e) {
    // no-op
  }
}

export const leagueEvents = {
  on(eventName, handler) {
    const evt = eventName ? String(eventName) : "";
    if (!evt || typeof handler !== "function") {
      return () => {};
    }

    const set = listenersByEvent[evt];
    if (!set) {
      return () => {};
    }

    set.add(handler);

    return () => {
      try {
        set.delete(handler);
      } catch (e) {
        // no-op
      }
    };
  },

  emit(eventName) {
    const evt = eventName ? String(eventName) : "";
    const set = listenersByEvent[evt];
    if (!set || set.size === 0) {
      return;
    }

    // Copy to avoid mutation during emit
    const list = Array.from(set);
    list.forEach((fn) => safeCall(fn));
  },

  emitUpdated() {
    this.emit("updated");
  },
};
