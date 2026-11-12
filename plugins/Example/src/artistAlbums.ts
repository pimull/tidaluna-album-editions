type RecordValue = Record<string, unknown>;
const object = (value: unknown): RecordValue | undefined => value !== null && typeof value === "object" && !Array.isArray(value) ? value as RecordValue : undefined;
export type ArtistAlbumResult = { id: string; title: string };
export function readArtistAlbums(state: unknown, artistId: string) {
  const root = object(state);
  const queries = object(object(root?.tidalApi)?.queries);
  const contentAlbums = object(object(root?.content)?.albums);
  const albums = new Map<string, ArtistAlbumResult>();
  let matchingLists = 0;
  let rawItems = 0;
  let incomplete = false;
  if (!queries) return { albums: [], matchingLists, rawItems, incomplete, status: "Artist query cache is unavailable in this client." };
  for (const value of Object.values(queries)) {
    const entry = object(value);
    const args = object(entry?.originalArgs);
    if (entry?.endpointName !== "getArtistViewAllPage" || String(args?.artistId) !== artistId || args?.sourceType !== "ARTIST_ALBUMS") continue;
    if (entry.status !== "fulfilled") continue;
    const items = object(entry.data)?.items;
    if (!Array.isArray(items)) continue;
    matchingLists++;
    rawItems += items.length;
    if (items.length >= 50) incomplete = true;
    for (const value of items) {
      const item = object(value);
      const data = object(item?.data);
      if (item?.type !== "ALBUM" || !data || !["number", "string"].includes(typeof data.id)) continue;
      const id = String(data.id);
      const cached = object(contentAlbums?.[id]);

      const title = typeof cached?.title === "string" ? cached.title : typeof data.title === "string" ? data.title : "Title not provided";
      albums.set(id, { id, title });
    }
  }
  return { albums: [...albums.values()], matchingLists, rawItems, incomplete,
    status: matchingLists ? "Read artist Albums cache. Coverage is not guaranteed complete." : "No loaded Albums list for this artist. Visit the artist page and its Albums section, then return and retry." };
}
