import {NextResponse} from "next/server";
import {z} from "zod";
import {protect} from "@/lib/server";
import {requireSession,sessionError} from "@/lib/session";
import {db,databaseCatalogs} from "@/lib/db";
import {submissionSchema} from "@/lib/validation";
import {reportPayload} from "@/lib/report";
import {storageReady,uploadPhoto,cleanupPhotos} from "@/lib/storage";
import {MIGRATION_BATCH_SIZE,MIGRATION_MAX_BYTES} from "@/lib/upload-limits";
import {photoInput} from "@/lib/photo-rules";
export const runtime="nodejs";export const maxDuration=90;
export async function POST(request:Request){const denial=protect(request);if(denial)return denial;try{
 const owner=await requireSession(request);if(Number(request.headers.get("content-length")??0)>MIGRATION_MAX_BYTES)return NextResponse.json({error:"Pindahkan maksimal 5 catatan sekali kirim."},{status:413});
 const body=await request.json();if(!Array.isArray(body.records)||body.records.length>MIGRATION_BATCH_SIZE)return NextResponse.json({error:"Daftar migrasi tidak valid."},{status:400});
 await databaseCatalogs();const sql=db();const accepted:string[]=[],deleted:string[]=[],photosStored:string[]=[],failed:string[]=[];
 for(const raw of body.records){const parsed=submissionSchema.safeParse(raw);if(!parsed.success){failed.push(typeof raw?.id==="string"?raw.id:"invalid");continue;}const record=parsed.data;
  const tomb=await sql`SELECT id FROM submission_tombstones WHERE session_id=${owner}::uuid AND id=${record.id}::uuid UNION ALL SELECT id FROM nutriscan_sessions WHERE id=${owner}::uuid AND history_cleared_at>=${record.createdAt}::timestamptz`;if(tomb.length){deleted.push(record.id);continue;}
  const payload=reportPayload(record);
  await sql.transaction([sql`SELECT pg_advisory_xact_lock(hashtextextended(${owner},0))`,sql`INSERT INTO submissions(id,session_id,created_at,payload) SELECT ${record.id}::uuid,${owner}::uuid,${record.createdAt}::timestamptz,${JSON.stringify(payload)}::jsonb WHERE NOT EXISTS(SELECT 1 FROM submission_tombstones WHERE session_id=${owner}::uuid AND id=${record.id}::uuid) AND NOT EXISTS(SELECT 1 FROM nutriscan_sessions WHERE id=${owner}::uuid AND history_cleared_at>=${record.createdAt}::timestamptz) ON CONFLICT(id) DO NOTHING`]);
  const existing=await sql`SELECT id,photo_key FROM submissions WHERE id=${record.id}::uuid AND session_id=${owner}::uuid`;if(!existing.length){failed.push(record.id);continue;}accepted.push(record.id);
  if(existing[0].photo_key){photosStored.push(record.id);continue;}
  const photo=photoInput.safeParse(raw.photoData);
  if(photo.success&&photo.data&&storageReady()){
   let key:string|null=null;try{key=await uploadPhoto(owner,record.id,photo.data);const attached=await sql`UPDATE submissions SET photo_key=${key},revision=revision+1 WHERE id=${record.id}::uuid AND session_id=${owner}::uuid AND photo_key IS NULL RETURNING id`;
    if(attached.length)photosStored.push(record.id);else await sql`INSERT INTO photo_cleanup(object_key,session_id) VALUES(${key},${owner}::uuid) ON CONFLICT DO NOTHING`;
   }catch{if(key)try{await sql`INSERT INTO photo_cleanup(object_key,session_id) VALUES(${key},${owner}::uuid) ON CONFLICT DO NOTHING`;}catch{}}
  }
 }
 await cleanupPhotos(owner).catch(()=>{});return NextResponse.json({accepted,deleted,photosStored,failed});
 }catch(e){return sessionError(e);}}
