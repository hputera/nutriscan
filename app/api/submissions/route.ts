import {after,NextResponse} from "next/server";
import {z} from "zod";
import {submissionSchema,deleteHistorySchema} from "@/lib/validation";
import {protect,allowRequest} from "@/lib/server";
import {db,databaseCatalogs} from "@/lib/db";
import {requireSession,sessionError} from "@/lib/session";
import {reportPayload} from "@/lib/report";
import {uploadPhoto,storageReady,cleanupPhotos} from "@/lib/storage";
import {saveReportQuery,deleteReportQuery} from "@/lib/report-queries";
import {photoInput} from "@/lib/photo-rules";
export const runtime="nodejs";export const maxDuration=90;
export async function GET(request:Request){const denial=protect(request);if(denial)return denial;try{
 const owner=await requireSession(request);after(async()=>{await cleanupPhotos(owner).catch(()=>{});});const rows=await db()`SELECT id,created_at,payload,revision,photo_key FROM submissions WHERE session_id=${owner}::uuid ORDER BY created_at DESC LIMIT 200`;
 return NextResponse.json({submissions:rows.map(r=>({...r.payload,id:r.id,createdAt:new Date(r.created_at).toISOString(),revision:r.revision,image:r.photo_key?"/api/photos/"+r.id:null,photoStored:Boolean(r.photo_key)}))},{headers:{"Cache-Control":"no-store"}});
 }catch(e){return sessionError(e);}}
export async function POST(request:Request){const denial=protect(request);if(denial)return denial;let uploaded:string|null=null;let owner:string|null=null;let committed=false;try{
 owner=await requireSession(request);if(!allowRequest("save:"+owner,30))return NextResponse.json({error:"Tunggu sebentar sebelum menyimpan lagi."},{status:429});
 if(Number(request.headers.get("content-length")??0)>650000)return NextResponse.json({error:"Data makanan/foto terlalu besar."},{status:413});
 await databaseCatalogs();const raw=await request.json();const result=submissionSchema.safeParse(raw);const photo=photoInput.safeParse(raw.photoData);const revision=z.number().int().min(0).safeParse(raw.revision??0);
 if(!result.success||!photo.success||!revision.success)return NextResponse.json({error:"Data makanan, foto, atau versi belum valid."},{status:400});
 const data=result.data;const sql=db();
 const previous=await sql`SELECT id,revision,photo_key FROM submissions WHERE id=${data.id}::uuid AND session_id=${owner}::uuid`;
 const tombstones=await sql`SELECT id FROM submission_tombstones WHERE session_id=${owner}::uuid AND id=${data.id}::uuid`;
 if(tombstones.length)return NextResponse.json({error:"Catatan sudah dihapus; buat makanan baru untuk menyimpan lagi."},{status:409});
 if(previous.length&&previous[0].revision!==revision.data)return NextResponse.json({error:"Catatan berubah. Muat riwayat terbaru sebelum mengoreksi."},{status:409});
 if(photo.data&&storageReady())uploaded=await uploadPhoto(owner,data.id,photo.data);
 const key=uploaded??previous[0]?.photo_key??null;const payload=reportPayload(data);
 const [,rows]=await sql.transaction([sql`SELECT pg_advisory_xact_lock(hashtextextended(${owner},0))`,saveReportQuery(sql,{owner,data,revision,key,payload})]);
 if(!rows.length){if(uploaded)await sql`INSERT INTO photo_cleanup(object_key,session_id) VALUES(${uploaded},${owner}::uuid) ON CONFLICT DO NOTHING`;await cleanupPhotos(owner);return NextResponse.json({error:"Catatan berubah atau tidak bisa diperbarui pada sesi ini."},{status:409});}
 committed=true;const pendingDeletes=await cleanupPhotos(owner).catch(()=>-1);
 return NextResponse.json({saved:true,revision:rows[0].revision,photoStored:Boolean(key),image:key?"/api/photos/"+data.id:null,photoPending:Boolean(photo.data&&!storageReady()),pendingPhotoDeletes:pendingDeletes});
 }catch(e){if(uploaded&&owner&&!committed)try{await db()`INSERT INTO photo_cleanup(object_key,session_id) VALUES(${uploaded},${owner}::uuid) ON CONFLICT DO NOTHING`;await cleanupPhotos(owner);}catch{}return sessionError(e);}}
export async function DELETE(request:Request){const denial=protect(request);if(denial)return denial;try{
 const owner=await requireSession(request);const parsed=deleteHistorySchema.safeParse(await request.json());if(!parsed.success)return NextResponse.json({error:"Konfirmasi penghapusan diperlukan."},{status:400});
 const sql=db();const id="id" in parsed.data?parsed.data.id:null;
 const [,rows]=await sql.transaction([sql`SELECT pg_advisory_xact_lock(hashtextextended(${owner},0))`,deleteReportQuery(sql,owner,id),sql`UPDATE nutriscan_sessions SET history_cleared_at=CASE WHEN ${id}::uuid IS NULL THEN now() ELSE history_cleared_at END WHERE id=${owner}::uuid`]);
 const pendingPhotoDeletes=await cleanupPhotos(owner).catch(()=>-1);return NextResponse.json({deleted:rows.length,ids:rows.map(r=>r.id),pendingPhotoDeletes});
 }catch(e){return sessionError(e);}}
