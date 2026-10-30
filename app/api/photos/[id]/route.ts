import {NextResponse} from "next/server";
import {z} from "zod";
import {db} from "@/lib/db";
import {requireSession,sessionError} from "@/lib/session";
import {readPhoto} from "@/lib/storage";
export async function GET(request:Request,{params}:{params:Promise<{id:string}>}){try{
 const owner=await requireSession(request);const {id}=await params;if(!z.string().uuid().safeParse(id).success)return new NextResponse(null,{status:404});
 const rows=await db()`SELECT photo_key FROM submissions WHERE id=${id}::uuid AND session_id=${owner}::uuid`;if(!rows[0]?.photo_key)return new NextResponse(null,{status:404});
 const photo=await readPhoto(owner,rows[0].photo_key);return new NextResponse(Buffer.from(photo.bytes),{headers:{"Content-Type":photo.type,"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"}});
 }catch(e){return sessionError(e);}}
