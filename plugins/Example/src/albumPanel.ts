import { readFirstTrackSpecification, specificationLabel, requestError, runSpecificationJobs } from "./specifications";
import type { LunaUnload } from "@luna/core";
import { currentAlbumId, openAlbumInClient } from "./navigation";
import { discover, audioBadges, displayTitle } from "./discovery";
export const unloads=new Set<LunaUnload>();
let disposed=false, controller:AbortController|undefined;
const host=document.createElement("div");
const shadow=host.attachShadow({mode:"open"});
const style=document.createElement("style");style.textContent="*{box-sizing:border-box}h2{font:700 23px/1.25 system-ui;margin:0 0 16px}h3{font:600 18px/1.35 system-ui}p{font:400 14px/1.5 system-ui;margin:8px 0}small{font:400 12px/1.5 system-ui}button{font:600 14px system-ui}img{flex-shrink:0;border-radius:6px}strong{font:600 14px system-ui}";shadow.append(style);
const button=document.createElement("button");
button.textContent="Versions";
button.style.cssText="position:fixed;right:24px;bottom:115px;z-index:99990;padding:12px 18px;border:1px solid #aaa;border-radius:24px;background:#24242c;color:white;font:600 14px system-ui;cursor:pointer;display:none;box-shadow:0 4px 18px #0008";
button.setAttribute("aria-label","Find related album versions");
const panel=document.createElement("section");
panel.setAttribute("role","dialog");panel.setAttribute("aria-label","Related album versions");
panel.style.cssText="position:fixed;right:24px;top:70px;bottom:110px;width:min(620px,calc(100vw - 48px));z-index:99999;overflow:auto;background:#17171e;color:#f5f5f5;border:1px solid #777;border-radius:16px;padding:20px;box-sizing:border-box;font:14px/1.5 system-ui;box-shadow:0 16px 50px #000a;display:none";
const backdrop=document.createElement("div");
backdrop.style.cssText="position:fixed;inset:0;z-index:99998;background:#0003;display:none";
backdrop.setAttribute("aria-hidden","true");
backdrop.onclick=()=>close();
let activeId="", renderedId="";
const el=(tag:string,text?:string)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n;};
function close(){controller?.abort();panel.style.display="none";backdrop.style.display="none";button.disabled=false;button.focus();}
function header(){panel.replaceChildren();const closeButton=el("button","Close ×") as HTMLButtonElement;closeButton.style.cssText="float:right;color:white;background:#333;border:1px solid #777;border-radius:6px;padding:6px 12px;cursor:pointer";closeButton.onclick=close;const heading=el("div");heading.style.cssText="position:sticky;top:-20px;background:#17171e;padding:12px 0;z-index:1";heading.append(closeButton,el("h2","Related album versions"));panel.append(heading,el("p","AVB-006.4 · Other Versions + Search + Artist Albums"));closeButton.focus();}
function note(text:string){const p=el("p",text);panel.append(p);return p;}
const currentId=currentAlbumId;
async function open(){
  controller?.abort();controller=new AbortController();const run=controller,signal=run.signal;
  renderedId=activeId;panel.style.display="block";backdrop.style.display="block";header();const progress=note("Finding related releases…");progress.setAttribute("role","status");button.disabled=true;
  try {
    const {redux,TidalApi,ContentBase}=await import("@luna/lib");
    const state=redux.store.getState();const id=currentId(state);
    if(!id)throw new Error("Open an album page first.");
    const headers=await TidalApi.getAuthHeaders();
    const request=async(url:string,signal:AbortSignal)=>{
      const timeout=new AbortController();const relay=()=>timeout.abort();signal.addEventListener("abort",relay,{once:true});if(signal.aborted)timeout.abort();const timer=setTimeout(()=>timeout.abort(),20000);
      try {const response=await fetch(url,{headers,signal:timeout.signal});if(!response.ok){let body;try{body=await response.json();}catch{}throw new Error(requestError(response.status,body));}return await response.json();}
      catch(error){if(signal.aborted)throw error;if(timeout.signal.aborted)throw new Error("Request timed out");throw error;}
      finally{clearTimeout(timer);signal.removeEventListener("abort",relay);}
    };
    const result=await discover(id,{countryCode:state.session.countryCode,locale:state.settings.language},request,signal);
    if(disposed||signal.aborted||controller!==run)return;
    progress.textContent=`${result.seed.title} · ${result.rows.length} release(s) including the current album`;
    note(`${result.examined} unique source candidates checked. Edition matches are suggestions, not proof of identical audio.`);
    for(const warning of result.warnings){const p=note(warning);p.style.color="#ffcf84";}
    if(result.rows.length===1)note(result.warnings.length?"No additional matches from the sources that succeeded. Discovery is incomplete.":"No additional matches found in these sources. Other editions may still exist.");
    const specJobs:Array<()=>Promise<void>>=[];
    for(const row of result.rows){
      const card=el("article");card.style.cssText="display:flex;gap:16px;padding:18px 0;border-top:1px solid #444";
      if(row.album.cover){const img=document.createElement("img");img.src=ContentBase.formatCoverUrl(row.album.cover,{res:"160"})!;img.alt="";img.width=88;img.height=88;img.style.objectFit="cover";card.append(img);}
      const body=el("div");const title=el("h3",displayTitle(row.album));title.style.margin="0 0 8px";body.append(title);
      const artist=(row.album.artists??(row.album.artist?[row.album.artist]:[])).map(a=>a.name).filter(Boolean).join(", ");
      body.append(el("p",artist),el("p",`${row.album.releaseDate??"Date unknown"} · ${row.album.numberOfTracks??"?"} tracks`));
      if(row.current){const badge=el("strong","Current album");badge.style.color="#9fe8d2";body.append(badge);}
      const formats=el("p");formats.style.cssText="display:flex;gap:8px;flex-wrap:wrap";
      const badges=audioBadges(row.album);
      for(const badge of badges){const tag=el("span",badge.label);tag.style.cssText=`color:${badge.color};background:#24242c;border:1px solid currentColor;border-radius:5px;padding:3px 7px;font:600 13px system-ui`;tag.setAttribute("title","TIDAL album metadata; not a measured playback specification");formats.append(tag);}
      if(!badges.length)formats.textContent="Audio specification not confirmed";
      body.append(formats);
      if(!badges.some(b=>b.label==="Dolby Atmos"||b.label==="Sony 360 Reality Audio")){
        const specStatus=el("p","Waiting for first-track specs…");specStatus.setAttribute("role","status");
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
      body.append(el("p",`Sources: ${row.sources.join(" + ")}`),el("small",`${row.reason} · ID ${row.album.id}`));
      const link=document.createElement("button");link.textContent=row.current?"Current album":"Open in TIDAL";link.disabled=row.current;link.style.cssText="display:block;color:#d7edff;background:#303846;border:1px solid #7c91a8;border-radius:6px;padding:8px 12px;margin-top:12px;cursor:pointer";link.onclick=()=>{try{openAlbumInClient(redux.store.dispatch.bind(redux.store),row.album.id);close();}catch{note("Could not navigate inside TIDAL.");}};body.append(link);card.append(body);panel.append(card);
    }
    void runSpecificationJobs(specJobs,signal);
    note("First-track specs describe the returned stereo stream; other tracks may differ. Coverage is limited to queried sources.");
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
