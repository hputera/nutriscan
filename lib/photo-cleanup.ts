// Keep failed deletions queued; stop starting work when the shared budget expires.
export async function drainPhotoQueue(keys:string[],remove:(key:string,signal:AbortSignal)=>Promise<unknown>,forget:(key:string)=>Promise<unknown>,signal:AbortSignal){
 for(let i=0;i<keys.length&&!signal.aborted;i+=5)await Promise.all(keys.slice(i,i+5).map(async key=>{
  try{signal.throwIfAborted();await remove(key,signal);await forget(key);}catch{/* Retained for a later retry. */}
 }));
}
