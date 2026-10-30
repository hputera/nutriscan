import "server-only";
import {S3Client,PutObjectCommand,GetObjectCommand,DeleteObjectCommand,CreateBucketCommand} from "@aws-sdk/client-s3";
import {randomUUID} from "node:crypto";
import {db} from "./db";
import {ownedPhotoKey,parsePhoto} from "./photo-rules";
export function storageReady(){return Boolean(process.env.AWS_ENDPOINT_URL_S3&&process.env.AWS_REGION&&process.env.AWS_ACCESS_KEY_ID&&process.env.AWS_SECRET_ACCESS_KEY);}
function storage(){if(!storageReady())throw new Error("Foto online belum dikonfigurasi.");const endpoint=new URL(process.env.AWS_ENDPOINT_URL_S3!);if(endpoint.protocol!=="https:"||!endpoint.hostname.endsWith(".neon.tech"))throw new Error("Endpoint Object Storage Neon tidak valid.");return new S3Client({endpoint:endpoint.href,region:process.env.AWS_REGION,forcePathStyle:true,maxAttempts:2,requestChecksumCalculation:"WHEN_REQUIRED",responseChecksumValidation:"WHEN_REQUIRED",credentials:{accessKeyId:process.env.AWS_ACCESS_KEY_ID!,secretAccessKey:process.env.AWS_SECRET_ACCESS_KEY!}});}
const bucket=()=>process.env.PHOTO_BUCKET||"nutriscan-meals";
export async function uploadPhoto(owner:string,id:string,data:string){const photo=parsePhoto(data);const key=owner+"/"+id+"/"+randomUUID()+"."+photo.extension;await storage().send(new PutObjectCommand({Bucket:bucket(),Key:key,Body:photo.bytes,ContentType:photo.contentType,CacheControl:"private, no-store"}));return key;}
export async function readPhoto(owner:string,key:string){if(!ownedPhotoKey(key,owner))throw new Error("Foto tidak tersedia.");const result=await storage().send(new GetObjectCommand({Bucket:bucket(),Key:key}));return {bytes:await result.Body!.transformToByteArray(),type:result.ContentType??"image/jpeg"};}
export async function removePhoto(owner:string,key:string){if(!ownedPhotoKey(key,owner))throw new Error("Kunci foto tidak valid.");await storage().send(new DeleteObjectCommand({Bucket:bucket(),Key:key}));}
export async function cleanupPhotos(owner:string){
 const sql=db();const rows=await sql`SELECT object_key FROM photo_cleanup WHERE session_id=${owner}::uuid ORDER BY created_at LIMIT 50`;
 if(storageReady())for(let i=0;i<rows.length;i+=5)await Promise.all(rows.slice(i,i+5).map(async row=>{try{await removePhoto(owner,row.object_key);await sql`DELETE FROM photo_cleanup WHERE object_key=${row.object_key} AND session_id=${owner}::uuid`;}catch{/* Durable retry on next history request. */}}));
 const left=await sql`SELECT count(*)::integer AS count FROM photo_cleanup WHERE session_id=${owner}::uuid`;return left[0].count as number;
}
export async function ensurePrivateBucket(){await storage().send(new CreateBucketCommand({Bucket:bucket()}));}
