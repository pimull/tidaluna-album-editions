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
    redux.intercept("search/SEARCH_RESULT_SUCCESS", listenerDisposers, payload => {
      // Never return true: that would cancel the host action.
      const items = payload?.albums?.items;
      const events = snapshot.events + 1;
      const diagnostics = [...snapshot.diagnostics, describePayload(payload, events)].slice(-6);
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
    });
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

function describePayload(payload: unknown, event: number): string {
  const shape = (value: unknown): string => {
    if (value === null) return "null";
    if (Array.isArray(value)) return `array(${value.length})`;
    if (typeof value === "object") return "object";
    return typeof value;
  };
  const lines = [`Event ${event}: ${shape(payload)}`];
  if (payload && typeof payload === "object") {
    for (const [key, value] of Object.entries(payload).slice(0, 16)) {
      lines.push(`${key.slice(0, 60)}: ${shape(value)}`);
      if (value && typeof value === "object" && !Array.isArray(value)) {
        for (const [child, nested] of Object.entries(value).slice(0, 12)) {
          lines.push(`  ${key.slice(0, 60)}.${child.slice(0, 60)}: ${shape(nested)}`);
        }
      }
    }
  }
  const items = (payload as { albums?: { items?: unknown } } | null)?.albums?.items;
  lines.push(`Expected albums.items: ${shape(items)}`);
  if (Array.isArray(items) && items.length) {
    lines.push(`First item keys: ${items[0] && typeof items[0] === "object" ? Object.keys(items[0]).slice(0, 16).join(", ") : shape(items[0])}`);
  }
  return lines.join("\n");
}
