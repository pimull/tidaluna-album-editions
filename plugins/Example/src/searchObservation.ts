import type { LunaUnload } from "@luna/core";

export type SearchAlbum = { id: string; title: string; artist: string };
export type SearchSnapshot = { status: string; active: boolean; events: number; albums: SearchAlbum[] };
export const unloads = new Set<LunaUnload>();
let snapshot: SearchSnapshot = { status: "Not observing", active: false, events: 0, albums: [] };
let generation = 0;
export const getSearchSnapshot = () => snapshot;

export function stopSearchObservation() {
  generation++;
  for (const dispose of unloads) dispose();
  unloads.clear();
  snapshot = { ...snapshot, active: false, status: "Observation stopped" };
}

export async function startSearchObservation() {
  stopSearchObservation();
  const current = generation;
  snapshot = { status: "Starting observation...", active: false, events: 0, albums: [] };
  try {
    const { redux } = await import("@luna/lib");
    if (current !== generation) return;
    if (typeof redux?.intercept !== "function") throw new Error("Unsupported host");
    redux.intercept("search/SEARCH_RESULT_SUCCESS", unloads, payload => {
      // Never return true: that would cancel the host action.
      const items = payload?.albums?.items;
      const events = snapshot.events + 1;
      if (!Array.isArray(items)) {
        snapshot = { ...snapshot, events, status: "Search event received without an album list" };
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
      snapshot = { active: true, events, albums: [...collected.values()], status: "Search results observed (up to 100 unique albums)" };
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
  snapshot = { status: "Not observing", active: false, events: 0, albums: [] };
}
