export type Artist = { id: string | number; name?: string };
export type Album = { id: string | number; title: string; artists?: Artist[]; artist?: Artist; version?: string; cover?: string; releaseDate?: string; numberOfTracks?: number; audioQuality?: string; audioModes?: string[]; mediaMetadata?: { tags?: string[] } };
export type Release = { album: Album; sources: string[]; current: boolean; reason: string };
export const normalize = (s: string) => s.normalize("NFKC").toLowerCase().replace(/\s+/g," ").trim();
function edition(s: string) {
  let t=normalize(s);
  if (/b[ -]?sides|outtakes|sessions|demos|live at|tribute|karaoke|instrumental/.test(t)) return false;
  t=t.replace(/\b\d{4}\b/g," ").replace(/\b\d+(?:st|nd|rd|th)\s+anniversary\b/g,"anniversary");
  t=t.replace(/\b(super deluxe|deluxe|expanded|extended|special|anniversary|remastered|remaster|remixed|remix|stereo|mono|mix|edition|version|box set)\b/g," ");
  return /^[\s/;,&-]*$/.test(t) && /mix|remaster|deluxe|edition|anniversary|expanded|stereo|mono/i.test(s);
}
export function baseTitle(title: string) {
  let s=title.trim(), previous="";
  while(s!==previous){previous=s;const bracket=s.match(/\s*[([]([^()[\]]+)[)\]]\s*$/);if(bracket&&edition(bracket[1])){s=s.slice(0,bracket.index).trim();continue;}const suffix=s.match(/\s+[-–—]\s+(.+)$/);if(suffix&&edition(suffix[1]))s=s.slice(0,suffix.index).trim();}
  return normalize(s);
}
export function artistIds(a: Album) { return (a.artists?.length?a.artists:a.artist?[a.artist]:[]).map(x=>String(x.id)); }
export function mergeReleases(seed: Album, candidates: {album: Album; source:string}[]): Release[] {
  const rows=new Map<string,Release>();rows.set(String(seed.id),{album:seed,sources:["Current album"],current:true,reason:"Current album"});
  const artists=new Set(artistIds(seed));
  for(const {album,source} of candidates){
    if(!album||typeof album.title!=="string"||!/^\d+$/.test(String(album.id)))continue;
    if(source!=="TIDAL Other Versions"&&(!artistIds(album).some(id=>artists.has(id))||baseTitle(album.title)!==baseTitle(seed.title)))continue;
    const id=String(album.id),row=rows.get(id);
    if(row){if(!row.sources.includes(source))row.sources.push(source);}else rows.set(id,{album,sources:[source],current:false,reason:source==="TIDAL Other Versions"?"Linked by TIDAL":normalize(album.title)===normalize(seed.title)?"Same title and artist":"Edition suffix and artist match"});
  }
  return [...rows.values()];
}
export function apiLocale(value:string){
  if(value==="sr-Latn")return "sr";
  const parts=value.replace("_","-").split("-");
  return parts.length===2?`${parts[0].toLowerCase()}_${parts[1].toUpperCase()}`:value;
}
export type AudioBadge = {label:string;color:string};
export function audioBadges(album:Album):AudioBadge[]{
  const tags=new Set([...(album.mediaMetadata?.tags??[]),...(album.audioModes??[])]);
  const badges:AudioBadge[]=[];
  if(tags.has("DOLBY_ATMOS"))badges.push({label:"Dolby Atmos",color:"#6ab5ff"});
  if(tags.has("SONY_360RA"))badges.push({label:"Sony 360 Reality Audio",color:"#6ab5ff"});
  if(tags.has("HIRES_LOSSLESS")||album.audioQuality==="HI_RES_LOSSLESS")badges.push({label:"Hi-Res lossless",color:"#ffd432"});
  else if(tags.has("LOSSLESS")||album.audioQuality==="LOSSLESS")badges.push({label:"Lossless",color:"#33ffee"});
  // LOW/HIGH cannot establish spatial format, CD resolution or exact stream specs.
  return badges;
}
export function audioSummary(album:Album){
  const badges=audioBadges(album);
  return badges.length?badges.map(b=>b.label).join(" + ")+" · TIDAL metadata":"Audio specification not confirmed";
}
// The client and Luna's albumItems helper use this page endpoint.
// English labels distinguish Other Versions from unrelated More Albums modules.
export function nativeVersions(page:any):Album[] {
  const albums:Album[]=[];
  if(!Array.isArray(page?.rows))throw new Error("Unexpected album page format");
  for(const row of page.rows)for(const module of row.modules??[]){
    if(module.type!=="ALBUM_LIST"||typeof module.title!=="string"||normalize(module.title)!=="other versions")continue;
    if(!Array.isArray(module.pagedList?.items))throw new Error("Other Versions list format is unsupported");
    for(const item of module.pagedList.items){
      const album=item?.type==="ALBUM"?item.data:item;
      if(album&&/^\d+$/.test(String(album.id))&&typeof album.title==="string")albums.push(album);
    }
  }
  return albums;
}
export function displayTitle(album:Album){
  return album.version&&!normalize(album.title).includes(normalize(album.version))?`${album.title} — ${album.version}`:album.title;
}
// Shapes recognized by the client's TI album adapter. Never traverse arbitrary data.
export function artistPageAlbums(page:any):Album[] {
  if(!Array.isArray(page?.items))throw new Error("Unexpected artist page format");
  const albums:Album[]=[];
  const lists=new Set(["HORIZONTAL_LIST","HORIZONTAL_LIST_WITH_CONTEXT","COMPACT_GRID_CARD","PUBLIC_PLAYLIST_LIST","SHORTCUT_LIST"]);
  for(const module of page.items){
    const items=lists.has(module?.type)&&Array.isArray(module.items)?module.items:module?.type==="ANNIVERSARY_CARD"?[module.item]:[];
    for(const item of items)if(item?.type==="ALBUM"&&/^\d+$/.test(String(item.data?.id))&&typeof item.data?.title==="string")albums.push(item.data);
  }
  return albums;
}
export type Request = (url:string, signal:AbortSignal)=>Promise<any>;
export async function discover(id:string, context:{countryCode:string;locale:string}, request:Request, signal:AbortSignal) {
  const common={countryCode:context.countryCode,locale:apiLocale(context.locale),deviceType:"DESKTOP",platform:"DESKTOP"};
  const url=(path:string,params:Record<string,string|number>)=>`${path.startsWith("v2/")?"https://api.tidal.com":"https://desktop.tidal.com"}/${path}?${new URLSearchParams(Object.entries(params).map(([k,v])=>[k,String(v)]))}`;
  const seed=await request(url(`v1/albums/${id}`,common),signal) as Album;
  if(!seed||!seed.title||!artistIds(seed).length)throw new Error("Current album metadata is unavailable.");
  const candidates:{album:Album;source:string}[]=[],warnings:string[]=[];
  const artists=seed.artists?.length?seed.artists:seed.artist?[seed.artist]:[];
  const query=`${baseTitle(seed.title)} ${artists[0]?.name??""}`.trim();
  async function pages(source:string, path:string, params:Record<string,string|number>, kind:"search"|"artist") {
    const seen=new Set<string>();
    try {for(let page=0;page<5;page++) {
      const data=await request(url(path,{...common,...params,limit:50,offset:page*50}),signal);
      const items=kind==="search"?data?.albums?.items:data?.items;
      if(!Array.isArray(items))throw new Error("Unexpected response format");
      let added=0;
      for(const item of items){const album=kind==="search"?item:item?.type==="ALBUM"?item.data:undefined;if(!album||!["string","number"].includes(typeof album.id))continue;const key=String(album.id);if(seen.has(key))continue;seen.add(key);added++;candidates.push({album,source});}
      if(items.length<50)return true;
      if(!added){warnings.push(`${source}: repeated page; stopped early.`);return true;}
      if(page===4)warnings.push(`${source}: reached 250-item limit; more releases may exist.`);
    }}catch(error){if(signal.aborted)throw error;warnings.push(`${source} unavailable: ${error instanceof Error?error.message:"request failed"}`);return false;}
    return true;
  }
  await Promise.all([
    (async()=>{try{
      const page=await request(url("v1/pages/album",{...common,albumId:id,locale:"en_US"}),signal);
      for(const album of nativeVersions(page))candidates.push({album,source:"TIDAL Other Versions"});
    }catch(error){if(signal.aborted)throw error;warnings.push(`TIDAL Other Versions unavailable: ${error instanceof Error?error.message:"request failed"}`);}})(),
    pages("Search","v2/search/",{query,types:"ALBUMS",includeContributors:"true",includeDidYouMean:"true",includeUserPlaylists:"true",supportsUserData:"true"},"search"),
    (async()=>{
      for(const artist of artists.slice(0,3)){
        const complete=await pages(`Artist Albums (${artist.name??artist.id})`,"v2/artist/ARTIST_ALBUMS/view-all",{artistId:String(artist.id)},"artist");
        if(!complete){
          try{
            const data=await request(url(`v2/artist/${artist.id}`,common),signal);
            const albums=artistPageAlbums(data);
            for(const album of albums)candidates.push({album,source:`Artist page (${artist.name??artist.id})`});
            warnings.push(`Artist page fallback returned ${albums.length} album(s); it may omit releases from the full list.`);
          }catch(error){if(signal.aborted)throw error;warnings.push(`Artist page fallback unavailable: ${error instanceof Error?error.message:"request failed"}`);}
        }
      }
      if(artists.length>3)warnings.push("Only the first three credited artists were queried.");
    })()
  ]);
  if(signal.aborted)throw new DOMException("Cancelled","AbortError");
    const rows=mergeReleases(seed,candidates);
  // Search and artist cards may omit track count and audio tags. Enrich only matches.
  const pending=rows.filter(row=>!row.current).slice(0,30);
  let cursor=0,failures=0;
  await Promise.all(Array.from({length:Math.min(3,pending.length)},async()=>{
    while(cursor<pending.length){const row=pending[cursor++];try{
      const full=await request(url(`v1/albums/${row.album.id}`,common),signal);
      if(full&&String(full.id)===String(row.album.id)&&typeof full.title==="string")row.album={...row.album,...full};else failures++;
    }catch(error){if(signal.aborted)throw error;failures++;}}
  }));
  if(failures)warnings.push(`${failures} release(s) have incomplete detail metadata.`);
  if(rows.length>31)warnings.push("Detail metadata is limited to the first 30 alternative releases.");
  return {seed,rows,warnings,examined:new Set(candidates.map(x=>String(x.album.id))).size};
}
