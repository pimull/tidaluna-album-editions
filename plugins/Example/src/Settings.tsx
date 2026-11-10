import React from "react";
import { SearchProbe } from "./SearchProbe";
import type { TidalApi } from "@luna/lib";
import { LunaSettings } from "@luna/ui";

const albumIds = ["77699617", "47696788"] as const;
type AlbumData = Awaited<ReturnType<typeof TidalApi.album>>;
type Result = { id: string; album?: AlbumData; error?: string };

export const Settings = () => {
  const [results, setResults] = React.useState<Result[]>([]);
  const [loading, setLoading] = React.useState(false);
  const busy = React.useRef(false);
  const mounted = React.useRef(true);
  React.useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  const loadAlbums = async () => {
    if (busy.current) return;
    busy.current = true;
    setLoading(true);
    try {
      const next = await Promise.all(albumIds.map(async (id): Promise<Result> => {
        try {
          const { TidalApi } = await import("@luna/lib");
          if (typeof TidalApi?.album !== "function") {
            return { id, error: "This Luna version does not expose TidalApi.album. Album reading is unavailable." };
          }
          const album = await TidalApi.album(id);
          return album
            ? { id, album }
            : { id, error: "Album unavailable for this session (no data returned)." };
        } catch {
          return { id, error: "Could not read this album. Check your connection and Luna compatibility, then retry." };
        }
      }));
      if (mounted.current) setResults(next);
    } finally {
      busy.current = false;
      if (mounted.current) setLoading(false);
    }
  };

  return (
    <LunaSettings>
      <section style={{ padding: 16 }}>
        <h2>Album Version Browser — AVB-003-fix3</h2>
        <SearchProbe />
        <h3>Known album lookup (separate from search results)</h3>
        <button type="button" disabled={loading} onClick={loadAlbums}>
          {loading ? "Reading albums..." : "Read two test albums"}
        </button>
        <div aria-live="polite">
          {results.map(({ id, album, error }) => (
            <section key={id} style={{ marginTop: 16, padding: 12, border: "1px solid #777", borderRadius: 8 }}>
              <h3>Album ID: {id}</h3>
              {error ? <p>{error}</p> : album && (
                <dl>
                  <dt>Title</dt><dd>{album.title || "Not provided"}</dd>
                  <dt>Artist</dt><dd>{album.artists?.map(artist => artist.name).join(", ") || album.artist?.name || "Not provided"}</dd>
                  <dt>Version</dt><dd>{album.version || "Not provided"}</dd>
                  <dt>Release date</dt><dd>{album.releaseDate || "Not provided"}</dd>
                  <dt>Track count</dt><dd>{album.numberOfTracks ?? "Not provided"}</dd>
                  <dt>UPC</dt><dd>{album.upc || "Not provided"}</dd>
                  <dt>Record label</dt><dd>{album.recordLabel || "Not provided"}</dd>
                </dl>
              )}
            </section>
          ))}
        </div>
      </section>
    </LunaSettings>
  );
};
