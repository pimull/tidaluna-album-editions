import { requestError } from './specifications';

// TIDAL's tre()/Ki()/EP() read the web build from window.wimp.dataset.version,
// remove its build suffix, and strip zero padding from each numeric component.
export function normalizeClientVersion(value:unknown):string|undefined {
  if(typeof value!=='string')return;
  const date=value.split('-')[0];
  if(!/^\d{4}\.\d{1,2}\.\d{1,2}$/.test(date))return;
  return date.split('.').map(part=>String(Number(part))).join('.');
}
export function clientVersionFromDocument():string|undefined {
  const runtime=globalThis as typeof globalThis & {wimp?:{dataset?:{version?:string}}};
  return normalizeClientVersion(runtime.wimp?.dataset?.version ?? document.getElementById('wimp')?.dataset.version);
}
export function metadataHeaders(url:string,auth:HeadersInit,clientVersion?:string):Headers {
  const headers=new Headers(auth);
  headers.set('Accept','application/json');
  const target=new URL(url);
  if(target.origin==='https://api.tidal.com'&&target.pathname.startsWith('/v2/')){
    if(!clientVersion)throw new Error('TIDAL web client version unavailable; artist/search requests cannot be prepared');
    headers.set('x-tidal-client-version',clientVersion);
    // Match the signed-in client's EP(): bearer authentication, not both schemes.
    if(headers.get('Authorization')?.startsWith('Bearer '))headers.delete('x-tidal-token');
  }
  return headers;
}
export function createMetadataRequest(auth:HeadersInit,version:()=>string|undefined,fetcher:typeof fetch=fetch){
  return async(url:string,signal:AbortSignal)=>{
    if(signal.aborted)throw new DOMException('Cancelled','AbortError');
    const headers=metadataHeaders(url,auth,version());
    const timeout=new AbortController();
    const relay=()=>timeout.abort();signal.addEventListener('abort',relay,{once:true});
    const timer=setTimeout(()=>timeout.abort(),20000);
    try{
      const response=await fetcher(url,{headers,signal:timeout.signal});
      if(!response.ok){let body;try{body=await response.json();}catch{}throw new Error(requestError(response.status,body));}
      return await response.json();
    }catch(error){
      if(signal.aborted)throw error;
      if(timeout.signal.aborted)throw new Error('Request timed out');
      throw error;
    }finally{clearTimeout(timer);signal.removeEventListener('abort',relay);}
  };
}
