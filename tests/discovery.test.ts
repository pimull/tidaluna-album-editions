import assert from "node:assert/strict";
import {baseTitle,mergeReleases,discover,nativeVersions,apiLocale,audioSummary,audioBadges,displayTitle,artistPageAlbums} from "../plugins/Example/src/discovery.ts";
const album=(id:number,title="Currents",artist=7)=>({id,title,artists:[{id:artist,name:"Tame Impala"}],numberOfTracks:13});
for(const title of ["Rubber Soul (2026 Mix)","Rubber Soul (Remastered 2009)","Rubber Soul (Super Deluxe Edition)","Rubber Soul - 2009 Remaster"] )assert.equal(baseTitle(title),"rubber soul");
assert.equal(baseTitle("The Dark Side Of The Moon (50th Anniversary; 2023 Remaster)"),"the dark side of the moon");
assert.equal(baseTitle("Master Of Puppets (Deluxe Box Set / Remastered)"),"master of puppets");
assert.notEqual(baseTitle("Currents B-Sides & Remixes"),"currents");
assert.equal(baseTitle("Album (What's the Story?)"),"album (what's the story?)");
assert.notEqual(baseTitle("Currents (Live at Wembley)"),"currents");
const seed=album(1), alt=album(2,"Currents (Deluxe Edition)");
const merged=mergeReleases(seed,[{album:alt,source:"Search"},{album:alt,source:"Artist"},{album:album(3,"Currents",8),source:"Search"}]);
assert.equal(merged.length,2);assert.equal(merged[0].current,true);assert.deepEqual(merged[1].sources,["Search","Artist"]);
const calls:string[]=[];
const request=async(url:string)=>{calls.push(url);const u=new URL(url);if(u.pathname.startsWith('/v1/albums/'))return u.pathname.endsWith('/2')?alt:seed;if(u.pathname==='/v1/pages/album')return{rows:[]};if(u.pathname==='/v2/search/')return{albums:{items:[seed]}};if(u.pathname==='/v2/artist/ARTIST_ALBUMS/view-all')return{items:[{type:"ALBUM",data:alt}]};throw Error('Unexpected endpoint');};
const result=await discover("1",{countryCode:"CA",locale:"en_US"},request,new AbortController().signal);
assert.equal(result.rows.length,2);assert.equal(result.warnings.length,0);assert.equal(calls.length,6);
assert.ok(calls.every(x=>new URL(x).searchParams.get('countryCode')==='CA'));
const partial=await discover("1",{countryCode:"CA",locale:"en_US"},async u=>{if(u.includes('/v2/search/'))throw Error('HTTP 503');return request(u);},new AbortController().signal);
assert.equal(partial.rows.length,2);assert.match(partial.warnings[0],/Search unavailable/);
let pages=0;const capped=await discover("1",{countryCode:"CA",locale:"en_US"},async u=>{const url=new URL(u);if(url.pathname==='/v2/search/'){const offset=Number(url.searchParams.get('offset'));pages++;return{albums:{items:Array.from({length:50},(_,i)=>album(100+offset+i))}};}return request(u);},new AbortController().signal);
assert.equal(pages,5);assert.ok(capped.warnings.some(x=>x.includes('250-item')));
const cancel=new AbortController();cancel.abort();await assert.rejects(()=>discover("1",{countryCode:"CA",locale:"en_US"},request,cancel.signal),/Cancelled/);
console.log('PASS: edition examples, conservative titles, artist matching, provenance, automatic requests, partial errors, pagination cap and cancellation.');

assert.equal(apiLocale("en-us"),"en_US");
assert.equal(audioSummary({...seed,mediaMetadata:{tags:["HIRES_LOSSLESS"]}}),"Hi-Res lossless · TIDAL metadata");
assert.equal(audioSummary(seed),"Audio specification not confirmed");
assert.equal(displayTitle({...seed,title:"Currents (2021 Mix)",version:"2021 Mix"}),"Currents (2021 Mix)");
const native=album(9,"Currents [With Bonus Material]");
const parsed=nativeVersions({rows:[{modules:[{type:"ALBUM_LIST",title:"Other versions",pagedList:{items:[native]}},{type:"ALBUM_LIST",title:"More Albums",pagedList:{items:[album(10,"Unrelated")]}}]}]});
assert.deepEqual(parsed,[native]);
assert.equal(mergeReleases(seed,[{album:native,source:"Search"}]).length,1);
assert.equal(mergeReleases(seed,[{album:native,source:"TIDAL Other Versions"}]).length,2);
const nativeResult=await discover("1",{countryCode:"CA",locale:"en-us"},async u=>{
  if(u.includes('/v1/pages/album'))return{rows:[{modules:[{type:"ALBUM_LIST",title:"Other versions",pagedList:{items:[native,alt]}}]}]};
  if(new URL(u).pathname==='/v1/albums/9')return native;
  return request(u);
},new AbortController().signal);
assert.equal(nativeResult.rows.length,3);
assert.ok(nativeResult.rows.find(r=>r.album.id===2)?.sources.includes("TIDAL Other Versions"));
assert.equal(nativeResult.warnings.length,0);
console.log("PASS: native versions, metadata, locale and title display.");

assert.equal(audioSummary({...seed,audioQuality:"LOW",mediaMetadata:{tags:["DOLBY_ATMOS"]}}),"Dolby Atmos · TIDAL metadata");
assert.equal(audioSummary({...seed,audioQuality:"LOW",audioModes:["DOLBY_ATMOS"]}),"Dolby Atmos · TIDAL metadata");
assert.equal(audioSummary({...seed,audioQuality:"LOW"}),"Audio specification not confirmed");
assert.equal(audioSummary({...seed,audioQuality:"HIGH"}),"Audio specification not confirmed");
assert.equal(audioSummary({...seed,audioQuality:"LOSSLESS",audioModes:["DOLBY_ATMOS"]}),"Dolby Atmos + Lossless · TIDAL metadata");
const artistPage={items:[{type:"HORIZONTAL_LIST",items:[{type:"ALBUM",data:alt},{type:"TRACK",data:seed}]},{type:"UNKNOWN",items:[{type:"ALBUM",data:seed}]}]};
assert.deepEqual(artistPageAlbums(artistPage),[alt]);
const fallback=await discover("1",{countryCode:"CA",locale:"en-us"},async u=>{
  if(u.includes('/view-all'))throw Error('HTTP 400');
  if(new URL(u).pathname==='/v2/artist/7')return artistPage;
  return request(u);
},new AbortController().signal);
assert.equal(fallback.rows.length,2);
assert.deepEqual(fallback.rows[1].sources,["Artist page (Tame Impala)"]);
assert.ok(fallback.warnings.some(w=>w.includes('HTTP 400')));
assert.ok(fallback.warnings.some(w=>w.includes('fallback returned 1')));
// Currents: neither native associations nor search contains the artist-page edition.
for(const seedId of [47696788,77699617]){
 const releases=[album(47696788),album(77699617)];
 const result=await discover(String(seedId),{countryCode:"CA",locale:"en-us"},async u=>{
   const path=new URL(u).pathname;
   if(path.startsWith('/v1/albums/'))return releases.find(a=>String(a.id)===path.split('/').pop());
   if(path==='/v1/pages/album')return{rows:[]};
   if(path==='/v2/search/')return{albums:{items:[releases[0]]}};
   if(path.includes('/view-all'))throw Error('HTTP 400');
   if(path==='/v2/artist/7')return{items:[{type:"HORIZONTAL_LIST_WITH_CONTEXT",items:[{type:"ALBUM",data:releases[1]}]}]};
   throw Error('Unexpected endpoint');
 },new AbortController().signal);
 assert.deepEqual(new Set(result.rows.map(r=>r.album.id)),new Set([47696788,77699617]));
 assert.equal(result.rows.filter(r=>r.current).length,1);
}
const failed=await discover("1",{countryCode:"CA",locale:"en-us"},async u=>{if(u.includes('/v2/artist/'))throw Error('HTTP 400');return request(u);},new AbortController().signal);
assert.equal(failed.rows.length,1);
assert.ok(failed.warnings.some(w=>w.includes('fallback unavailable')));
const aborted=new AbortController();
await assert.rejects(()=>discover("1",{countryCode:"CA",locale:"en-us"},async u=>{
 if(u.includes('/view-all'))throw Error('HTTP 400');
 if(new URL(u).pathname==='/v2/artist/7'){aborted.abort();throw new DOMException('Cancelled','AbortError');}
 return request(u);
},aborted.signal),/Cancelled/);
console.log("PASS: spatial format precedence, artist-page fallback, Currents discovery in both directions, failure and cancellation.");

assert.deepEqual(audioBadges({...seed,audioQuality:"LOSSLESS"}),[{label:"Lossless",color:"#33ffee"}]);
assert.deepEqual(audioBadges({...seed,audioQuality:"HI_RES_LOSSLESS"}),[{label:"Hi-Res lossless",color:"#ffd432"}]);
assert.deepEqual(audioBadges({...seed,audioModes:["DOLBY_ATMOS"],audioQuality:"LOW"}),[{label:"Dolby Atmos",color:"#6ab5ff"}]);
console.log("PASS: lossless cyan, Hi-Res yellow, Atmos blue without claiming CD resolution.");
// Reproduce the Moon asymmetry: search exposes stereo A/B, only B links Atmos C.
const moon=[album(55391786,'The Dark Side of the Moon'),album(282500342,'The Dark Side Of The Moon (50th Anniversary) [2023 Remaster]'),{...album(283628182,'The Dark Side Of The Moon (50th Anniversary) [2023 Remaster]'),audioModes:['DOLBY_ATMOS']}];
for(const start of [moon[0],moon[1]]){
 const visits:number[]=[];
 const found=await discover(String(start.id),{countryCode:'CA',locale:'en-us'},async u=>{
   const url=new URL(u),path=url.pathname;
   if(path.startsWith('/v1/albums/'))return moon.find(a=>String(a.id)===path.split('/').pop());
   if(path==='/v2/search/')return{albums:{items:[moon[0],moon[1],album(90,'Unrelated')]}};
   if(path.includes('/view-all'))return{items:[]};
   if(path==='/v1/pages/album'){
     const id=Number(url.searchParams.get('albumId'));visits.push(id);
     const links=id===moon[1].id?[moon[0],moon[2]]:id===moon[2].id?[moon[1]]:[];
     return{rows:[{modules:[{type:'ALBUM_LIST',title:'Other versions',pagedList:{items:links}}]}]};
   }
   throw Error('Unexpected endpoint');
 },new AbortController().signal);
 assert.deepEqual(new Set(found.rows.map(r=>r.album.id)),new Set(moon.map(a=>a.id)));
 assert.equal(visits.length,3);assert.equal(new Set(visits).size,3);
 assert.ok(!visits.includes(90));
}
let relatedRequests=0;
const limited=await discover('1',{countryCode:'CA',locale:'en-us'},async u=>{
 const url=new URL(u);
 if(url.pathname==='/v1/pages/album'){relatedRequests++;const id=Number(url.searchParams.get('albumId'));return{rows:[{modules:[{type:'ALBUM_LIST',title:'Other versions',pagedList:{items:[album(id+1)]}}]}]};}
 if(url.pathname.startsWith('/v1/albums/'))return album(Number(url.pathname.split('/').pop()));
 if(url.pathname==='/v2/search/')return{albums:{items:[]}};
 if(url.pathname.includes('/view-all'))return{items:[]};
 throw Error('Unexpected endpoint');
},new AbortController().signal);
assert.equal(relatedRequests,13);
assert.ok(limited.warnings.some(w=>w.includes('12-page limit')));
console.log('PASS: Moon versions agree from either stereo edition, cyclic links deduplicate, unrelated results excluded and expansion bounded.');
