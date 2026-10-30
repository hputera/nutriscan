import "server-only";
import {createHash,randomBytes,timingSafeEqual} from "node:crypto";
import {NextResponse} from "next/server";
import {db} from "./db";
import {requestOrigin} from "./request-origin";
export const DEVICE_COOKIE="nutriscan-device";export const ACTIVE_COOKIE="nutriscan-active";
export function cookieValue(request:Request,name:string){return (request.headers.get("cookie")??"").split(";").map(v=>v.trim()).find(v=>v.startsWith(name+"="))?.slice(name.length+1)??"";}
export function hashToken(token:string){return createHash("sha256").update(token).digest("hex");}
function equal(a:string,b:string){const aa=Buffer.from(a),bb=Buffer.from(b);return aa.length===bb.length&&timingSafeEqual(aa,bb);}
export async function deviceIdentity(request:Request){
 const value=cookieValue(request,DEVICE_COOKIE);const [id,token]=value.split(".");
 if(!/^[0-9a-f-]{36}$/i.test(id??"")||!/^([a-f0-9]{64})$/.test(token??""))return null;
 const rows=await db()`SELECT id,token_hash,profile IS NOT NULL AS has_profile FROM nutriscan_sessions WHERE id=${id}::uuid`;
 if(!rows[0]||!equal(rows[0].token_hash,hashToken(token)))return null;
 return {id:rows[0].id as string,token,hasProfile:Boolean(rows[0].has_profile),active:equal(cookieValue(request,ACTIVE_COOKIE),hashToken(token+":active"))};
}
export async function requireSession(request:Request){const identity=await deviceIdentity(request);if(!identity?.active)throw new SessionError();return identity.id;}
export class SessionError extends Error{constructor(){super("Masuk kembali ke profil untuk mengakses data.");}}
export function sessionError(error:unknown){return NextResponse.json({error:error instanceof SessionError?error.message:"Neon belum bisa diakses. Periksa koneksi dan jalankan db:setup."},{status:error instanceof SessionError?401:503});}
export function setSessionCookies(response:NextResponse,request:Request,id:string,token:string){const secure=requestOrigin(request).protocol==="https:";const options={httpOnly:true,sameSite:"strict" as const,secure,path:"/",maxAge:60*60*24*365};response.cookies.set(DEVICE_COOKIE,id+"."+token,options);response.cookies.set(ACTIVE_COOKIE,hashToken(token+":active"),{...options,maxAge:60*60*24*7});}
export function newToken(){return randomBytes(32).toString("hex");}
