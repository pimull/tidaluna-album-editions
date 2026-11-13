import type { Request } from './discovery';
export type TrackSpecification = {trackId:string;title:string;bitDepth:number;sampleRate:number;audioMode:string;audioQuality:string};
export async function readFirstTrackSpecification(albumId:string, countryCode:string, request:Request, signal:AbortSignal):Promise<TrackSpecification> {
  if(!/^\d+$/.test(albumId))throw new Error('Invalid album ID');
  const params=new URLSearchParams({albumId,countryCode,locale:'en_US',deviceType:'DESKTOP'});
  const page=await request(`https://desktop.tidal.com/v1/pages/album?${params}`,signal);
  const module=page?.rows?.flatMap((row:any)=>row.modules??[]).find((entry:any)=>entry.type==='ALBUM_ITEMS');
  const entry=module?.pagedList?.items?.find((entry:any)=>String(entry.type).toLowerCase()==='track');
  const track=entry?.item;
  if(!track||!/^\d+$/.test(String(track.id)))throw new Error('First track metadata unavailable');
  if(track.album?.id!==undefined&&String(track.album.id)!==albumId)throw new Error('Track belongs to a different album');
  // Same endpoint and request parameters as Luna TidalApi.playbackInfo. Metadata only.
  const info=await request(`https://desktop.tidal.com/v1/tracks/${track.id}/playbackinfo?audioquality=HI_RES_LOSSLESS&playbackmode=STREAM&assetpresentation=FULL`,signal);
  if(String(info?.trackId)!==String(track.id))throw new Error('Playback metadata does not match the requested track');
  if(signal.aborted)throw new DOMException('Cancelled','AbortError');
  if(info.audioMode!=='STEREO')throw new Error('Exact stereo specification unavailable for this audio mode');
  if(!['LOSSLESS','HI_RES_LOSSLESS'].includes(info.audioQuality))throw new Error('Lossless specification unavailable for this track');
  if(!Number.isInteger(info.bitDepth)||info.bitDepth<1||info.bitDepth>64||!Number.isFinite(info.sampleRate)||info.sampleRate<8000||info.sampleRate>768000)throw new Error('Exact specification not returned');
  return {trackId:String(track.id),title:typeof track.title==='string'?track.title:'First track',bitDepth:info.bitDepth,sampleRate:info.sampleRate,audioMode:info.audioMode,audioQuality:info.audioQuality};
}
export function specificationLabel(spec:TrackSpecification){
  return `First track: ${spec.bitDepth}-bit / ${spec.sampleRate/1000} kHz · Stereo${spec.bitDepth===16&&spec.sampleRate===44100?' · CD resolution':''}`;
}
// Show only short API diagnostics, not response bodies, URLs or authentication values.
export function requestError(status:number,body:any){
  const code=typeof body?.subStatus==='number'?` (code ${body.subStatus})`:'';
  const message=status===400&&typeof body?.userMessage==='string'?body.userMessage:'';
  const safe=message.length<=180&&!/bearer|token|https?:|@|[A-Za-z0-9_=-]{40}/i.test(message)?message:'';
  return `HTTP ${status}${code}${safe?`: ${safe}`:''}`;
}

// Start at most two metadata probes at once. Closing the panel cancels queued work.
export async function runSpecificationJobs(jobs:Array<()=>Promise<void>>,signal:AbortSignal){
  let cursor=0;
  await Promise.all(Array.from({length:Math.min(2,jobs.length)},async()=>{
    while(!signal.aborted&&cursor<jobs.length){const job=jobs[cursor++];await job();}
  }));
}
