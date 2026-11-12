import assert from 'node:assert/strict';
import {readFirstTrackSpecification,specificationLabel,requestError} from '../plugins/Example/src/specifications.ts';
const page={rows:[{modules:[{type:'ALBUM_ITEMS',pagedList:{items:[{type:'track',item:{id:9,title:'First song',album:{id:1}}},{type:'track',item:{id:10}}]}}]}]};
const info={trackId:9,bitDepth:24,sampleRate:96000,audioMode:'STEREO',audioQuality:'HI_RES_LOSSLESS'};
const calls:string[]=[];
const request=async(url:string)=>{calls.push(url);return url.includes('/pages/album')?page:info;};
const spec=await readFirstTrackSpecification('1','CA',request,new AbortController().signal);
assert.equal(specificationLabel(spec),'First track: 24-bit / 96 kHz · Stereo');
assert.equal(calls.length,2);
assert.equal(new URL(calls[0]).searchParams.get('countryCode'),'CA');
assert.ok(calls[1].includes('/tracks/9/playbackinfo?'));
assert.ok(!calls.some(u=>u.includes('/tracks/10')));
assert.match(specificationLabel({...spec,bitDepth:16,sampleRate:44100}),/CD resolution/);
assert.ok(!specificationLabel({...spec,bitDepth:16,sampleRate:48000}).includes('CD resolution'));
for(const patch of [{sampleRate:undefined},{sampleRate:96},{bitDepth:0},{audioQuality:'LOW'},{audioMode:'DOLBY_ATMOS'},{trackId:10}]){
 await assert.rejects(()=>readFirstTrackSpecification('1','CA',async u=>u.includes('/pages/album')?page:{...info,...patch},new AbortController().signal));
}
await assert.rejects(()=>readFirstTrackSpecification('2','CA',request,new AbortController().signal),/different album/);
await assert.rejects(()=>readFirstTrackSpecification('1','CA',async()=>({rows:[]}),new AbortController().signal),/unavailable/);
const cancel=new AbortController();cancel.abort();
await assert.rejects(()=>readFirstTrackSpecification('1','CA',request,cancel.signal),/Cancelled/);
assert.equal(requestError(400,{subStatus:123,userMessage:'Invalid platform'}),'HTTP 400 (code 123): Invalid platform');
assert.equal(requestError(400,{userMessage:'Bearer secret token'}),'HTTP 400');
assert.equal(requestError(400,{userMessage:'https://example.com/private'}),'HTTP 400');
assert.equal(requestError(401,{userMessage:'Private information'}),'HTTP 401');
console.log('PASS: first-track metadata only, exact units, CD labeling, mismatches, missing fields, spatial fallback rejection, cancellation and limited diagnostics.');
