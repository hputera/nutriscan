import {NextResponse} from "next/server";
import {randomUUID} from "node:crypto";
import {z} from "zod";
import {protect,allowRequest} from "@/lib/server";
import {db} from "@/lib/db";
import {ACTIVE_COOKIE,deviceIdentity,newToken,hashToken,setSessionCookies,sessionError} from "@/lib/session";
export const runtime="nodejs";
export async function GET(request:Request){const denial=protect(request);if(denial)return denial;try{const identity=await deviceIdentity(request);return NextResponse.json({active:identity?.active??false,canResume:Boolean(identity?.hasProfile)},{headers:{"Cache-Control":"no-store"}});}catch(e){return sessionError(e);}}
export async function POST(request:Request){const denial=protect(request);if(denial)return denial;try{
 const existing=await deviceIdentity(request);if(existing){const response=NextResponse.json({active:true});setSessionCookies(response,request,existing.id,existing.token);return response;}
 if(!allowRequest("session-create",30))return NextResponse.json({error:"Tunggu sebentar sebelum membuat sesi lagi."},{status:429});
 const body=await request.json().catch(()=>({}));const parsed=z.string().uuid().safeParse(body.legacySessionId);const id=parsed.success?parsed.data:randomUUID();const token=newToken();
 const rows=await db()`INSERT INTO nutriscan_sessions(id,token_hash) VALUES (${id}::uuid,${hashToken(token)}) ON CONFLICT(id) DO NOTHING RETURNING id`;
 if(!rows.length)return NextResponse.json({error:"Sesi ini sudah terikat cookie perangkat. Jangan hapus cookie untuk mempertahankan akses; gunakan browser yang sama."},{status:409});
 const response=NextResponse.json({active:true});setSessionCookies(response,request,id,token);return response;
 }catch(e){return sessionError(e);}}
export async function DELETE(request:Request){const denial=protect(request);if(denial)return denial;const response=NextResponse.json({loggedOut:true});response.cookies.set(ACTIVE_COOKIE,"",{httpOnly:true,sameSite:"strict",path:"/",maxAge:0});return response;}
