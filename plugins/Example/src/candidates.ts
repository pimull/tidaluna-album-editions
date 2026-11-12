import { readArtistAlbums } from "./artistAlbums";
type Obj = Record<string, any>;
export const normalizeTitle = (text: string) => text.normalize("NFKC").trim().replace(/\s+/g, " ").toLowerCase();
export function parseAlbumId(input: string): string | undefined {
  const text = input.trim();
  if (/^\d+$/.test(text)) return text;
  try { const url = new URL(text); if (url.protocol !== "https:" || !["tidal.com", "www.tidal.com", "listen.tidal.com"].includes(url.hostname)) return;
    return url.pathname.match(/^\/(?:browse\/)?album\/(\d+)(?:\/u)?\/?$/)?.[1];
  } catch { return; }
}
export function collectCandidates(state: Obj, seed: Obj, query: string) {
  const artistIds = new Set<string>((seed.artists?.length ? seed.artists : seed.artist ? [seed.artist] : []).map((a: Obj) => String(a.id)));
  artistIds.delete("undefined");
  if (!artistIds.size || typeof seed.title !== "string") throw new Error("Seed metadata missing");
  const sources = new Map<string, Set<string>>();
  const add = (id: unknown, source: string) => { if (!["string", "number"].includes(typeof id)) return; const key=String(id); if (!sources.has(key)) sources.set(key,new Set()); sources.get(key)!.add(source); };
  const list = state.content?.albumLists?.[`search/albums/${encodeURIComponent(query.trim())}`];
  const searchIds = list?.sorted?.defaultSort?.items;
  if (Array.isArray(searchIds)) searchIds.forEach(id => add(id, "Search"));
  let artistLists = 0;
  for (const id of artistIds) { const result=readArtistAlbums(state,id); artistLists+=result.matchingLists; result.albums.forEach(album=>add(album.id,"Artist Albums")); }
  const rows: { id: string; album: Obj; sources: string[] }[]=[];
  let missing=0;
  for (const [id, provenance] of sources) {
    const album=state.content?.albums?.[id];
    if (!album) { missing++; continue; }
    const artists=album.artists?.length ? album.artists : album.artist ? [album.artist] : [];
    if (typeof album.title!=="string" || normalizeTitle(album.title)!==normalizeTitle(seed.title) || !artists.some((a: Obj)=>artistIds.has(String(a.id)))) continue;
    rows.push({id,album,sources:[...provenance]});
  }
  return { rows, searchLoaded:Array.isArray(searchIds), artistLists, examined:sources.size, missing };
}
