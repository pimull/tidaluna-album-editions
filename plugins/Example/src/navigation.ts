export function currentAlbumId(state: {router?: {currentParams?: Record<string, unknown>}}): string | undefined {
  const id=state.router?.currentParams?.albumId;
  return /^\d+$/.test(String(id??""))?String(id):undefined;
}
// Verified against TIDAL's router/PUSH action creator and its string call sites.
export function openAlbumInClient(dispatch:(action:{type:string;payload:string})=>unknown,id:string|number) {
  if(!/^\d+$/.test(String(id)))throw new Error("Invalid album ID");
  dispatch({type:"router/PUSH",payload:`/album/${id}`});
}
