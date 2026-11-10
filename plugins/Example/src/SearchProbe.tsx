import React from "react";
import { getSearchSnapshot, startSearchObservation, stopSearchObservation } from "./searchObservation";

export const SearchProbe = () => {
  const [snapshot, setSnapshot] = React.useState(getSearchSnapshot);
  React.useEffect(() => {
    const timer = setInterval(() => setSnapshot(getSearchSnapshot()), 500);
    return () => clearInterval(timer);
  }, []);
  const ids = new Set(snapshot.albums.map(album => album.id));
  return (
    <section style={{ marginBottom: 24, padding: 16, border: "1px solid #777", borderRadius: 8 }}>
      <h3>Search observation</h3>
      <p>Start, search Currents Tame Impala in TIDAL, open Albums results, then return here.</p>
      <p>This collects album results from all searches while active. It does not associate results with a specific query or prove completeness.</p>
      <button type="button" onClick={async () => {
        const pending = startSearchObservation();
        setSnapshot(getSearchSnapshot());
        await pending;
        setSnapshot(getSearchSnapshot());
      }}>Start / reset observation</button>
      <button type="button" onClick={() => { stopSearchObservation(); setSnapshot(getSearchSnapshot()); }} style={{ marginLeft: 16 }}>Stop observation</button>
      <p role="status">{snapshot.active ? "ACTIVE — " : "INACTIVE — "}{snapshot.status}</p>
      <p>Events received: {snapshot.events} | Unique albums observed: {snapshot.albums.length}</p>
      <p>77699617: {ids.has("77699617") ? "Found in observed results" : "Not observed yet"}</p>
      <p>47696788: {ids.has("47696788") ? "Found in observed results" : "Not observed yet"}</p>
      <h4>Search event structure (field names and counts only)</h4>
      {snapshot.diagnostics.map((text, index) => <pre key={index} style={{ whiteSpace: "pre-wrap", fontSize: 13 }}>{text}</pre>)}
      <ul>{snapshot.albums.map(album => <li key={album.id}>{album.title} — {album.artist} (ID: {album.id})</li>)}</ul>
      <p>Not observed does not mean unavailable. Results are kept only in memory; reset clears them.</p>
    </section>
  );
};
