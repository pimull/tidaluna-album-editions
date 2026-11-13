import React from "react";
import { collectCandidates, parseAlbumId } from "./candidates";
export const CandidateBrowser = () => {
  const [input,setInput]=React.useState("");
  const [query,setQuery]=React.useState("");
  const [status,setStatus]=React.useState("Enter an album link or ID and the exact search phrase used in TIDAL.");
  const [result,setResult]=React.useState<ReturnType<typeof collectCandidates>>();
  const [busy,setBusy]=React.useState(false);
  const running=React.useRef(false), mounted=React.useRef(true);
  React.useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;};},[]);
  const read=async()=>{
    const id=parseAlbumId(input);
    if(!id || !query.trim()){setStatus("Enter a valid TIDAL album link/ID and a search phrase.");return;}
    if(running.current)return;
    running.current=true;setBusy(true);setResult(undefined);setStatus("Reading loaded candidate sources...");
    try {
      const {TidalApi,redux,ContentBase}=await import("@luna/lib");
      const seed=await TidalApi.album(id);
      if(!seed)throw new Error("Unavailable seed");
      const next=collectCandidates(redux.store.getState(),seed,query);
      // Verified Luna cover helper. Store only its public image URL for rendering.
      for(const row of next.rows) row.album={...row.album,coverUrl:ContentBase.formatCoverUrl(row.album.cover,{res:"160"})};
      if(mounted.current){setResult(next);setStatus(`${seed.title}: ${next.rows.length} candidate release(s). Same title and shared artist ID; not verified audio equivalence.`);}
    }catch{if(mounted.current)setStatus("Could not read candidates. Check the album link, connection and loaded source pages.");}
    finally{running.current=false;if(mounted.current)setBusy(false);}
  };
  const inputStyle={display:"block",width:"100%",padding:10,marginBottom:12,boxSizing:"border-box" as const};
  return <section style={{padding:20,border:"1px solid #888",borderRadius:12,marginBottom:24}}>
    <h2>Candidate versions — AVB-005</h2>
    <p>First search in TIDAL and visit the artist's Albums list. This prototype reads those loaded sources; it does not search automatically.</p>
    <label>Starting album link or ID<input style={inputStyle} value={input} disabled={busy} onChange={e=>{setInput(e.target.value);setResult(undefined);}} placeholder="https://tidal.com/album/..." /></label>
    <label>Exact TIDAL search phrase<input style={inputStyle} value={query} disabled={busy} onChange={e=>{setQuery(e.target.value);setResult(undefined);}} placeholder="Album title and artist" /></label>
    <button type="button" disabled={busy} onClick={read} style={{padding:"10px 16px",border:"1px solid #aaa",borderRadius:6}}>{busy?"Reading...":"Show candidate versions"}</button>
    <p role="status">{status}</p>
    <p>Matching currently ignores only case and whitespace. Edition-suffix matching is coming later; a missing candidate does not mean no other edition exists.</p>
    {result&&<>
      <p>Search source: {result.searchLoaded?"loaded":"not loaded for this phrase"} · Artist Albums lists: {result.artistLists} · Examined IDs: {result.examined} · Missing metadata: {result.missing}</p>
      <p>Loaded results may be partial. Sources are deduplicated by album ID.</p>
      {result.rows.map(({id,album,sources})=><article key={id} style={{display:"flex",gap:16,padding:"16px 0",borderTop:"1px solid #666"}}>
        {album.coverUrl&&<img src={album.coverUrl} alt="" width={96} height={96} style={{objectFit:"cover"}} />}
        <div><h3 style={{margin:"0 0 8px"}}>{album.title}{album.version?` — ${album.version}`:""}</h3>
          <p>{album.artists?.map((a:{name:string})=>a.name).join(", ")||album.artist?.name||"Artist not provided"}</p>
          <p>{album.releaseDate||"Date not provided"} · {album.numberOfTracks??"?"} tracks</p>
          <p>Sources: {sources.join(" + ")} · ID: {id}</p>
          <a href={`https://tidal.com/album/${id}`} target="_blank" rel="noreferrer">Open album</a>
        </div>
      </article>)}
    </>}
  </section>;
};
