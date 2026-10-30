import "./load-catalog.ts";
import assert from "node:assert/strict";
import {test} from "node:test";
import {deleteHistorySchema} from "../lib/validation.ts";
import {parsePhoto,ownedPhotoKey} from "../lib/photo-rules.ts";
test("history deletion always requires explicit confirmation",()=>{
 assert.equal(deleteHistorySchema.safeParse({all:true}).success,false);
 assert.equal(deleteHistorySchema.safeParse({all:true,confirm:false}).success,false);
 assert.equal(deleteHistorySchema.safeParse({all:true,confirm:true}).success,true);
 assert.equal(deleteHistorySchema.safeParse({id:"not-an-id",confirm:true}).success,false);
});
test("photo keys cannot cross device ownership or traverse paths",()=>{
 const a="f5c6f354-c3ac-4d65-b19d-3d51741a09ec",b="13b61c3a-1219-45f9-9d78-27f22e50b987";
 assert.equal(ownedPhotoKey(`${a}/${b}/${b}.jpg`,a),true);
 assert.equal(ownedPhotoKey(`${a}/${b}/${b}.jpg`,b),false);
 assert.equal(ownedPhotoKey(`${a}/../${b}.jpg`,a),false);
 assert.equal(ownedPhotoKey(`${a}/${b}/${b}.jpg/extra`,a),false);
});
test("stored photo validation checks signatures and rejects SVG, false MIME and oversized content",()=>{
 const png=Buffer.from([137,80,78,71,13,10,26,10,0]);
 assert.equal(parsePhoto("data:image/png;base64,"+png.toString("base64")).contentType,"image/png");
 assert.throws(()=>parsePhoto("data:image/jpeg;base64,"+png.toString("base64")));
 assert.throws(()=>parsePhoto("data:image/svg+xml;base64,"+Buffer.from("<svg/>").toString("base64")));
 assert.throws(()=>parsePhoto("data:image/png;base64,"+Buffer.alloc(400*1024).toString("base64")));
});
