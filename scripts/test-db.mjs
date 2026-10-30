import {neon} from "@neondatabase/serverless";
import {randomUUID} from "node:crypto";
import {saveReportQuery,deleteReportQuery} from "../lib/report-queries.ts";
const sql=neon(process.env.DATABASE_URL);const owner=randomUUID(),other=randomUUID(),id=randomUUID();const photo=owner+"/"+id+"/"+randomUUID()+".jpg";
const data={id,createdAt:new Date().toISOString()};const payload={test:true};
const queries=[
 sql`INSERT INTO nutriscan_sessions(id,token_hash) VALUES(${owner}::uuid,'test-only-hash'),(${other}::uuid,'test-only-hash')`,
 sql`SELECT pg_advisory_xact_lock(hashtextextended(${owner},0))`,
 saveReportQuery(sql,{owner,data,revision:{data:0},key:photo,payload}),
 sql`SELECT 1/(CASE WHEN EXISTS(SELECT 1 FROM submissions WHERE id=${id}::uuid AND revision=1 AND photo_key=${photo}) THEN 1 ELSE 0 END)`,
 saveReportQuery(sql,{owner:other,data,revision:{data:1},key:null,payload:{test:'wrong-owner'}}),
 sql`SELECT 1/(CASE WHEN EXISTS(SELECT 1 FROM submissions WHERE id=${id}::uuid AND payload=${JSON.stringify(payload)}::jsonb) THEN 1 ELSE 0 END)`,
 saveReportQuery(sql,{owner,data,revision:{data:99},key:null,payload:{test:'stale-revision'}}),
 sql`SELECT 1/(CASE WHEN EXISTS(SELECT 1 FROM submissions WHERE id=${id}::uuid AND revision=1) THEN 1 ELSE 0 END)`,
 deleteReportQuery(sql,other,id),
 sql`SELECT 1/(CASE WHEN EXISTS(SELECT 1 FROM submissions WHERE id=${id}::uuid) THEN 1 ELSE 0 END)`,
 deleteReportQuery(sql,owner,id),
 sql`SELECT 1/(CASE WHEN NOT EXISTS(SELECT 1 FROM submissions WHERE id=${id}::uuid) AND EXISTS(SELECT 1 FROM submission_tombstones WHERE session_id=${owner}::uuid AND id=${id}::uuid) AND EXISTS(SELECT 1 FROM photo_cleanup WHERE session_id=${owner}::uuid AND object_key=${photo}) THEN 1 ELSE 0 END)`,
 saveReportQuery(sql,{owner,data,revision:{data:0},key:null,payload}),
 sql`SELECT 1/(CASE WHEN NOT EXISTS(SELECT 1 FROM submissions WHERE id=${id}::uuid) THEN 1 ELSE 0 END)`,
 sql`SELECT CAST('NUTRISCAN_TEST_ROLLBACK' AS integer)`
];
try{await sql.transaction(queries);throw new Error('Rollback expected');}catch(e){if(e.code!=='22P02'||!e.message.includes('NUTRISCAN_TEST_ROLLBACK'))throw new Error('Database integration assertion failed: '+(e.code??'unknown'));}
const check=await sql`SELECT count(*)::integer AS count FROM nutriscan_sessions WHERE id IN(${owner}::uuid,${other}::uuid)`;if(check[0].count!==0)throw new Error('Fixture rollback failed');
console.log('PASS: owner isolation, revision conflict, delete, photo cleanup queue, tombstone anti-resurrection, complete fixture rollback.');
