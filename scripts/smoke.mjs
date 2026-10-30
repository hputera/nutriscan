import assert from "node:assert/strict";
import { createServer } from "node:http";
import next from "next";

// Run the server and HTTP probes in one process so this also works in isolated executors.
// Does not call Gemini or Neon, and does not need credentials.
delete process.env.GEMINI_API_KEY;
delete process.env.DATABASE_URL;
delete process.env.PROTOTYPE_ACCESS_CODE;
const app=next({dev:process.argv.includes("--dev"),dir:process.cwd(),hostname:"127.0.0.1",port:0});
await app.prepare();
const handler=app.getRequestHandler();
const server=createServer((req,res)=>handler(req,res));
await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
const url="http://127.0.0.1:"+server.address().port;
try {
 const page=await fetch(url,{signal:AbortSignal.timeout(60000)});
 assert.equal(page.status,200);
 const html=await page.text();
 for(const text of ["NutriScan | Nutrisi", "Menyiapkan NutriScan"]){assert.ok(html.includes(text),text);}
 for(const text of ["Sistem Pemantauan Gizi", "ESTIMASI BIAYA", "COBA CONTOH MENU", "SDN 47"]){assert.ok(!html.includes(text),text);}
 const status=await fetch(url+"/api/status").then(r=>r.json());assert.equal(status.gemini,false);assert.equal(status.database,false);
 const analyze=await fetch(url+"/api/analyze",{method:"POST"});assert.equal(analyze.status,503);
 const crossOrigin=await fetch(url+"/api/analyze",{method:"POST",headers:{origin:"https://unrelated.example"}});assert.equal(crossOrigin.status,403);
 const history=await fetch(url+"/api/submissions");assert.equal(history.status,503);
 console.log("PASS: personal shell/title, no legacy UI, status without credentials, missing-key response, cross-origin protection and missing-database response.");
} finally {
 server.closeAllConnections();
 await new Promise(resolve=>server.close(resolve));
 await app.close();
}
