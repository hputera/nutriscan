import {S3Client,HeadBucketCommand,CreateBucketCommand,PutObjectCommand,GetObjectCommand,DeleteObjectCommand} from "@aws-sdk/client-s3";
import {randomUUID} from "node:crypto";
async function main(){
const required=['AWS_ENDPOINT_URL_S3','AWS_REGION','AWS_ACCESS_KEY_ID','AWS_SECRET_ACCESS_KEY'];const missing=required.filter(k=>!process.env[k]);if(missing.length){console.error('Isi variabel ini di .env.local: '+missing.join(', '));process.exit(1);}
const endpoint=new URL(process.env.AWS_ENDPOINT_URL_S3);if(endpoint.protocol!=='https:'||!endpoint.hostname.endsWith('.neon.tech'))throw new Error('Gunakan endpoint Object Storage Neon yang benar.');
const s3=new S3Client({endpoint:endpoint.href,region:process.env.AWS_REGION,forcePathStyle:true,maxAttempts:2,requestChecksumCalculation:'WHEN_REQUIRED',responseChecksumValidation:'WHEN_REQUIRED',credentials:{accessKeyId:process.env.AWS_ACCESS_KEY_ID,secretAccessKey:process.env.AWS_SECRET_ACCESS_KEY}});
const Bucket=process.env.PHOTO_BUCKET||'nutriscan-meals';
try{await s3.send(new HeadBucketCommand({Bucket}));}catch(e){if(e.$metadata?.httpStatusCode===404)await s3.send(new CreateBucketCommand({Bucket}));else throw new Error('Bucket belum bisa diakses; periksa credential dan scope storage:write.');}
const Key='nutriscan-check/'+randomUUID()+'.txt';let uploaded=false;
try{await s3.send(new PutObjectCommand({Bucket,Key,Body:'nutriscan-storage-test',ContentType:'text/plain'}));uploaded=true;const result=await s3.send(new GetObjectCommand({Bucket,Key}));if(await result.Body.transformToString()!=='nutriscan-storage-test')throw new Error('Read check failed');console.log('PASS: bucket, upload dan pembacaan berhasil. Credential tidak ditampilkan.');}finally{if(uploaded)await s3.send(new DeleteObjectCommand({Bucket,Key}));}
}
main().catch(e=>{console.error("Storage check gagal:",{type:e.name,status:e.$metadata?.httpStatusCode??null});process.exitCode=1;});
