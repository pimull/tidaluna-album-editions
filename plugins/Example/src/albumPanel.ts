import { panelStyles } from "./panelStyles";
import { createMetadataRequest, clientVersionFromDocument } from "./http";
import { readFirstTrackSpecification, specificationLabel, runSpecificationJobs } from "./specifications";
import type { LunaUnload } from "@luna/core";
import { currentAlbumId, openAlbumInClient } from "./navigation";
import { discover, audioBadges, displayTitle } from "./discovery";
export const unloads=new Set<LunaUnload>();
let disposed=false, controller:AbortController|undefined;
const host=document.createElement("div");
const shadow=host.attachShadow({mode:"open"});
const style=document.createElement("style");style.textContent=panelStyles;shadow.append(style);
const button=document.createElement("button");
button.textContent="Versions";
button.className="avb-trigger";button.style.display="none";
button.setAttribute("aria-label","Find related album versions");
const panel=document.createElement("section");
panel.setAttribute("role","dialog");panel.setAttribute("aria-label","Related album versions");
panel.className="avb-panel";panel.style.display="none";
const backdrop=document.createElement("div");
backdrop.className="avb-backdrop";backdrop.style.display="none";
backdrop.setAttribute("aria-hidden","true");
backdrop.onclick=()=>close();
let activeId="", renderedId="";
const el=(tag:string,text?:string)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n;};
function close(){controller?.abort();panel.style.display="none";backdrop.style.display="none";button.disabled=false;button.focus();}
function header(){
  panel.replaceChildren();panel.scrollTop=0;
  const closeButton=el("button","Close ×") as HTMLButtonElement;closeButton.className="avb-close";closeButton.onclick=close;
  const heading=el("div");heading.className="avb-header";heading.append(el("h2","Album versions"),closeButton);panel.append(heading);closeButton.focus();
}
function note(text:string){const p=el("p",text);p.className="avb-note";panel.append(p);return p;}
const currentId=currentAlbumId;
async function open(){
  controller?.abort();controller=new AbortController();const run=controller,signal=run.signal;
  renderedId=activeId;panel.style.display="block";backdrop.style.display="block";header();const progress=note("Finding related releases…");progress.setAttribute("role","status");progress.className="avb-intro";button.disabled=true;
  try {
    const {redux,TidalApi,ContentBase}=await import("@luna/lib");
    const state=redux.store.getState();const id=currentId(state);
    if(!id)throw new Error("Open an album page first.");
    const headers=await TidalApi.getAuthHeaders();
    const request=createMetadataRequest(headers,clientVersionFromDocument);
    const result=await discover(id,{countryCode:state.session.countryCode,locale:state.settings.language},request,signal);
    if(disposed||signal.aborted||controller!==run)return;
    progress.textContent=`${result.seed.title} · ${result.rows.length} release(s) including this album`;
    if(result.warnings.length){
      const warnings=el("details");warnings.className="avb-warning";
      warnings.append(el("summary","Some sources are incomplete · View details"));
      for(const warning of result.warnings)warnings.append(el("p",warning));panel.append(warnings);
    }
    if(result.rows.length===1)note(result.warnings.length?"No additional matches from the sources that succeeded. Discovery is incomplete.":"No additional matches found in these sources. Other editions may still exist.");
    const specJobs:Array<()=>Promise<void>>=[];
    for(const row of result.rows){
      const card=el("article");card.className="avb-card";
      if(row.album.cover){const img=document.createElement("img");img.src=ContentBase.formatCoverUrl(row.album.cover,{res:"160"})!;img.alt="";img.width=88;img.height=88;img.className="avb-cover";card.append(img);}else{const placeholder=el("div");placeholder.className="avb-cover";placeholder.setAttribute("aria-hidden","true");card.append(placeholder);}
      const body=el("div");
      if(row.current){const badge=el("span","Current album");badge.className="avb-current";body.append(badge);}
      body.append(el("h3",displayTitle(row.album)));
      const artist=(row.album.artists??(row.album.artist?[row.album.artist]:[])).map(a=>a.name).filter(Boolean).join(", ");
      const artistText=el("p",artist);artistText.className="avb-artist";
      const metadata=el("p",`${row.album.releaseDate??"Date unknown"} · ${row.album.numberOfTracks??"?"} tracks`);metadata.className="avb-meta";body.append(artistText,metadata);
      const formats=el("p");formats.className="avb-formats";
      const badges=audioBadges(row.album);
      for(const badge of badges){const tag=el("span",badge.label);tag.className="avb-format";tag.style.color=badge.color;tag.setAttribute("title","TIDAL album metadata; not a measured playback specification");formats.append(tag);}
      if(!badges.length)formats.textContent="Audio specification not confirmed";
      body.append(formats);
      if(!badges.some(b=>b.label==="Dolby Atmos"||b.label==="Sony 360 Reality Audio")){
        const specStatus=el("p","Waiting for first-track specs…");specStatus.setAttribute("role","status");specStatus.className="avb-spec";
        if(specJobs.length<30)specJobs.push(async()=>{
          if(signal.aborted||disposed)return;
          specStatus.textContent="Reading first-track metadata…";
          try{
            const spec=await readFirstTrackSpecification(String(row.album.id),state.session.countryCode,request,signal);
            if(signal.aborted||disposed||controller!==run)return;
            specStatus.textContent=specificationLabel(spec);
            specStatus.style.color=spec.bitDepth>16||spec.sampleRate>44100?"#ffd432":"#33ffee";
            specStatus.setAttribute("title",spec.title+" · Other tracks may differ. This is the returned stream, not a playback measurement.");
          }catch(error){if(signal.aborted||disposed||controller!==run)return;specStatus.textContent=error instanceof Error?error.message:"Specification unavailable";}
        });
        else specStatus.textContent="Automatic specs limited to 30 releases";
        body.append(specStatus);
      }
      const details=el("details");details.className="avb-details";
      details.append(el("summary","Release details"),el("p",`Sources: ${row.sources.join(" + ")}`),el("p",`${row.reason} · Album ID ${row.album.id}`));body.append(details);
      if(!row.current){
        const link=document.createElement("button");link.textContent="Open album →";link.className="avb-open";
        link.setAttribute("aria-label",`Open ${displayTitle(row.album)} in TIDAL`);
        link.onclick=()=>{try{openAlbumInClient(redux.store.dispatch.bind(redux.store),row.album.id);close();}catch{note("Could not navigate inside TIDAL.");}};body.append(link);
      }
      card.append(body);panel.append(card);
    }
    void runSpecificationJobs(specJobs,signal);
    const footer=el("div");footer.className="avb-footer";
    footer.append(el("p","Audio specs are for the first track. Other tracks may differ."));
    const diagnostics=el("details");diagnostics.className="avb-details";
    diagnostics.append(el("summary","About these results"),el("p",`${result.examined} source candidates checked. Related editions are suggestions, not proof of identical audio. Available sources may not include every release.`),el("p","Album Editions · 0.1.0"));footer.append(diagnostics);panel.append(footer);
  }catch(error){if(!signal.aborted&&!disposed&&controller===run)progress.textContent=`Unable to load versions: ${error instanceof Error?error.message:"unknown error"}`;}
  finally{if(controller===run)button.disabled=false;}
}
button.onclick=()=>{void open();};
const keyHandler=(event:KeyboardEvent)=>{if(event.key==="Escape"&&panel.style.display!=="none")close();};
async function init(){
  try{const {redux}=await import("@luna/lib");if(disposed)return;
    shadow.append(button,backdrop,panel);document.body.append(host);document.addEventListener("keydown",keyHandler);
    const refresh=()=>{const id=currentId(redux.store.getState());activeId=id??"";button.style.display=id?"block":"none";if(panel.style.display!=="none"&&renderedId!==activeId)close();};
    const timer=setInterval(refresh,750);unloads.add(()=>clearInterval(timer));refresh();
  }catch{host.remove();}
}
unloads.add(()=>{disposed=true;controller?.abort();host.remove();document.removeEventListener("keydown",keyHandler);});
void init();
