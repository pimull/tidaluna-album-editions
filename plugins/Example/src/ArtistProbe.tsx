import React from "react";
import { readArtistAlbums } from "./artistAlbums";

export const ArtistProbe = () => {
  const [result, setResult] = React.useState<ReturnType<typeof readArtistAlbums>>();
  const [status, setStatus] = React.useState("Visit Tame Impala's artist page and Albums section first, then return here.");
  const [busy, setBusy] = React.useState(false);
  const running = React.useRef(false);
  const mounted = React.useRef(true);
  React.useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const read = async () => {
    if (running.current) return;
    running.current = true; setBusy(true); setResult(undefined);
    setStatus("Reading artist identity and loaded Albums list...");
    try {
      const { TidalApi, redux } = await import("@luna/lib");
      // This seed lookup supplies identity only, never discovered album membership.
      const seed = await TidalApi.album("47696788");
      const artist = seed?.artist ?? seed?.artists?.[0];
      if (!artist?.id) throw new Error("Missing artist identity");
      const next = readArtistAlbums(redux.store.getState(), String(artist.id));
      if (mounted.current) { setResult(next); setStatus(`Artist: ${artist.name} (ID: ${artist.id}). ${next.status}`); }
    } catch {
      if (mounted.current) setStatus("Could not read artist identity or cache. Check Luna compatibility and connection.");
    } finally {
      running.current = false;
      if (mounted.current) setBusy(false);
    }
  };
  const ids = new Set(result?.albums.map(album => album.id));
  return <section style={{ padding: 16, marginBottom: 24, border: "1px solid #777", borderRadius: 8 }}>
    <h3>Artist Albums source</h3>
    <p>Reads only the artist's loaded Albums list. Search results and known-ID lookups are separate.</p>
    <button type="button" disabled={busy} onClick={read} style={{ padding: "8px 12px", border: "1px solid #aaa", borderRadius: 6 }}>{busy ? "Reading..." : "Read artist Albums list"}</button>
    <p role="status">{status}</p>
    {result && <>
      <p>Matching loaded lists: {result.matchingLists} | List items: {result.rawItems} | Unique album IDs: {result.albums.length}</p>
      {result.incomplete && <p>At least 50 items were returned; this list may be truncated.</p>}
      <p>77699617: {ids.has("77699617") ? "Found in artist Albums list" : "Not observed in this source"}</p>
      <p>47696788: {ids.has("47696788") ? "Found in artist Albums list" : "Not observed in this source"}</p>
      <ul>{result.albums.map(album => <li key={album.id}>{album.title} (ID: {album.id}) — Artist Albums</li>)}</ul>
    </>}
  </section>;
};
