import assert from 'node:assert/strict';
import {normalizeClientVersion,metadataHeaders,createMetadataRequest,clientVersionFromDocument} from '../plugins/Example/src/http.ts';
import {discover} from '../plugins/Example/src/discovery.ts';
assert.equal(normalizeClientVersion('2026.01.09-buildhash'),'2026.1.9');
assert.equal(normalizeClientVersion(undefined),undefined);
assert.equal(normalizeClientVersion('invalid'),undefined);
const auth={Authorization:'Bearer test-only','x-tidal-token':'test-client'};
const artistUrl='https://api.tidal.com/v2/artist/ARTIST_ALBUMS/view-all';
const headers=metadataHeaders(artistUrl,auth,'2026.1.9');
assert.equal(headers.get('x-tidal-client-version'),'2026.1.9');
assert.equal(headers.get('Authorization'),'Bearer test-only');
assert.equal(headers.has('x-tidal-token'),false);
assert.equal(headers.get('Accept'),'application/json');
const v1=metadataHeaders('https://desktop.tidal.com/v1/albums/1',auth);
assert.equal(v1.get('x-tidal-token'),'test-client');
assert.equal(v1.has('x-tidal-client-version'),false);
assert.throws(()=>metadataHeaders(artistUrl,auth),/version unavailable/);
(globalThis as any).wimp={dataset:{version:'2026.01.09-build'}};
assert.equal(clientVersionFromDocument(),'2026.1.9');
delete (globalThis as any).wimp;
(globalThis as any).document={getElementById:()=>({dataset:{version:'2026.02.03-build'}})};
assert.equal(clientVersionFromDocument(),'2026.2.3');
const releases=[47696788,77699617].map(id=>({id,title:'Currents',artists:[{id:3736815,name:'Tame Impala'}]}));
let artistRequests=0;
const fetcher:typeof fetch=async(input,init)=>{
 const url=new URL(String(input));
 if(url.pathname.startsWith('/v2/')){
   const h=new Headers(init?.headers);
   // Regression fixture: reject incomplete v2 headers at the transport boundary.
   if(h.get('x-tidal-client-version')!=='2026.1.9'||h.has('x-tidal-token'))return Response.json({subStatus:1002},{status:400});
 }
 if(url.pathname==='/v2/artist/ARTIST_ALBUMS/view-all'){artistRequests++;return Response.json({items:[{type:'ALBUM',data:releases[1]}]});}
 if(url.pathname==='/v2/search/')return Response.json({albums:{items:[releases[0]]}});
 if(url.pathname==='/v1/pages/album')return Response.json({rows:[]});
 if(url.pathname.startsWith('/v1/albums/'))return Response.json(releases.find(a=>String(a.id)===url.pathname.split('/').pop()));
 throw Error('Unexpected request');
};
const request=createMetadataRequest(auth,()=>normalizeClientVersion('2026.01.09-build'),fetcher);
for(const seed of releases){
 const result=await discover(String(seed.id),{countryCode:'CA',locale:'en-us'},request,new AbortController().signal);
 assert.equal(result.warnings.length,0);
 assert.deepEqual(new Set(result.rows.map(r=>r.album.id)),new Set([47696788,77699617]));
 assert.ok(result.rows.find(r=>r.album.id===77699617)?.sources.includes('Artist Albums (Tame Impala)'));
}
assert.equal(artistRequests,2);
const abort=new AbortController();abort.abort();let called=false;
await assert.rejects(()=>createMetadataRequest(auth,()=>undefined,async()=>{called=true;return Response.json({});})(artistUrl,abort.signal),/Cancelled/);
assert.equal(called,false);
const failing=createMetadataRequest(auth,()=> '2026.1.9',async()=>Response.json({subStatus:1002},{status:400}));
await assert.rejects(()=>failing(artistUrl,new AbortController().signal),/HTTP 400 \(code 1002\)/);
console.log('PASS: native v2 header contract, runtime build normalization, v1 preservation, Currents transport integration and visible errors. Mock transport does not prove the live server cause.');
