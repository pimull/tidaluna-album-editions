import type { LunaUnload } from "@luna/core";

export type SearchAlbum = { id: string; title: string; artist: string };
export type SearchSnapshot = { status: string; active: boolean; events: number; albums: SearchAlbum[]; diagnostics: string[] };
// Private listener cleanup only. Luna registers onUnload in its own cleanup set.
const listenerDisposers = new Set<LunaUnload>();
let snapshot: SearchSnapshot = { status: "Not observing", active: false, events: 0, albums: [], diagnostics: [] };
let generation = 0;
export const getSearchSnapshot = () => snapshot;

export function stopSearchObservation() {
  generation++;
  const disposers = [...listenerDisposers];
  listenerDisposers.clear();
  for (const dispose of disposers) dispose();
  snapshot = { ...snapshot, active: false, status: "Observation stopped" };
}

export async function startSearchObservation() {
  stopSearchObservation();
  const current = generation;
  snapshot = { status: "Starting observation...", active: false, events: 0, albums: [], diagnostics: [] };
  try {
    const { redux } = await import("@luna/lib");
    if (current !== generation) return;
    if (typeof redux?.intercept !== "function") throw new Error("Unsupported host");
    redux.intercept("search/SEARCH_RESULT_SUCCESS", listenerDisposers, (eventPayload) => {
      const event = eventPayload as unknown as { query?: unknown; result?: { albums?: unknown } };
      if (typeof event?.query !== "string") {
        snapshot = { ...snapshot, events: snapshot.events + 1, status: "Search event has no query; cannot identify its album list" };
        return;
      }
      const query = event.query;
      // Interceptors run before reducers. Read the query-specific list afterwards.
      queueMicrotask(() => {
        if (current !== generation) return;
        try {
          const state = redux.store.getState();
          const list = state.content?.albumLists?.[`search/albums/${encodeURIComponent(query)}`];
          const ids = list?.sorted?.defaultSort?.items;
          const items = Array.isArray(ids) ? ids.map(id => state.content?.albums?.[id]).filter(Boolean) : undefined;
          consume({ albums: { items }, queryListPresent: Boolean(list) }, "query-specific search cache");
        } catch {
          snapshot = { ...snapshot, events: snapshot.events + 1, status: "Could not read this search's album list in the current Luna session" };
        }
      });
    });
    function consume(payload: unknown, actionType: string) {
      // Never return true: that would cancel the host action.
      const items = (payload as { albums?: { items?: unknown } } | null)?.albums?.items;
      const events = snapshot.events + 1;
      const diagnostics = [...snapshot.diagnostics, describePayload(payload, events, actionType)].slice(-6);
      if (!Array.isArray(items)) {
        snapshot = { ...snapshot, events, diagnostics, status: "Search event received without an album list" };
        return;
      }
      const collected = new Map(snapshot.albums.map(album => [album.id, album]));
      for (const album of items) {
        if (album == null || !["string", "number"].includes(typeof album.id)) continue;
        const id = String(album.id);
        if (!collected.has(id) && collected.size >= 100) continue;
        collected.set(id, {
          id,
          title: typeof album.title === "string" ? album.title : "Not provided",
          artist: Array.isArray(album.artists)
            ? album.artists.map(artist => artist?.name).filter(name => typeof name === "string").join(", ")
            : album.artist?.name || "Not provided",
        });
      }
      snapshot = { active: true, events, diagnostics, albums: [...collected.values()], status: "Search results observed (up to 100 unique albums)" };
    }
    snapshot = { ...snapshot, active: true, status: "Observing. Search Currents Tame Impala in TIDAL, then return here." };
  } catch {
    if (current === generation) {
      stopSearchObservation();
      snapshot = { ...snapshot, status: "Search observation unavailable in this Luna session" };
    }
  }
}

export function onUnload() {
  stopSearchObservation();
  snapshot = { status: "Not observing", active: false, events: 0, albums: [], diagnostics: [] };
}

// Export the cleanup set Luna actually drains. Do not also export onUnload.
// This set is intentionally separate from the observer listener disposers.
export const unloads = new Set<LunaUnload>([onUnload]);

function describePayload(payload: unknown, event: number, actionType: string): string {
  const shape = (value: unknown): string => {
    if (value === null) return "null";
    if (Array.isArray(value)) return `array(${value.length})`;
    if (typeof value === "object") return "object";
    return typeof value;
  };
  const lines = [`Event ${event}: ${actionType}`, `Payload: ${shape(payload)}`];
  const visited = new WeakSet<object>();
  function walk(value: unknown, path: string, depth: number) {
    if (!value || typeof value !== "object" || depth > 4 || lines.length >= 60 || visited.has(value)) return;
    visited.add(value);
    const entries = Array.isArray(value) ? value.slice(0, 1).map((item, index) => [String(index), item] as const) : Object.entries(value).slice(0, 12);
    for (const [key, child] of entries) {
      if (lines.length >= 60) break;
      const next = path ? `${path}.${key.slice(0, 60)}` : key.slice(0, 60);
      lines.push(`${next}: ${shape(child)}`);
      walk(child, next, depth + 1);
    }
  }
  walk(payload, "", 0);
  const items = (payload as { albums?: { items?: unknown } } | null)?.albums?.items;
  lines.push(`Expected albums.items: ${shape(items)}`);
  if (Array.isArray(items) && items.length) {
    lines.push(`First item keys: ${items[0] && typeof items[0] === "object" ? Object.keys(items[0]).slice(0, 16).join(", ") : shape(items[0])}`);
  }
  return lines.join("\n");
}
