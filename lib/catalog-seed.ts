import { FOODS as V2_FOODS, DEFAULT_SETTINGS, DEMOS } from "./catalog-v2.ts";
import type { CatalogVersion, FoodProfile } from "./types.ts";
export { DEFAULT_SETTINGS, DEMOS };
export const CURRENT_CATALOG_VERSION:CatalogVersion="personal-v3";
const referenceUrl="https://repository.kemkes.go.id/book/668";
const estimate={status:"estimate" as const,title:"Profil estimasi prototype",note:"Nilai contoh per 100 g; belum memiliki padanan resep terverifikasi. Jangan dianggap hasil pengukuran."};
function food(id:string,name:string,group:string,values:number[],aliases:string[],code?:string,page?:number):FoodProfile{
 const [calories,protein,carbs,fat,fiber]=values;
 return {id,name,group,icon:"",ingredients:[],per100g:{calories,protein,carbs,fat,fiber},aliases,excludeTerms:[],nutritionReference:code?{status:"reference",title:"TKPI Kemenkes 2020",url:referenceUrl,code,page,note:"Per 100 g bagian termakan; pastikan jenis dan cara pengolahan sesuai."}:estimate};
}
export const FOODS:FoodProfile[]=[...V2_FOODS.map(f=>({...f,icon:"",ingredients:[]})),
 food("semangka","Semangka segar","Buah",[28,.5,6.9,.2,.4],["semangka"],"ER105",46),
 food("melon","Melon segar","Buah",[37,.6,7.8,.4,1],["melon"],"ER067",45),
 food("jagung-rebus","Jagung kuning rebus","Karbohidrat",[142,5,30.3,.7,.8],["jagung kuning rebus","jagung rebus"],"AP010",10),
 food("roti","Roti tawar","Karbohidrat",[265,9,49,3.2,2.7],["roti tawar"]),
 food("roti-gandum","Roti gandum","Karbohidrat",[247,13,41,4.2,7],["roti gandum"]),
 food("oat","Oatmeal matang tanpa susu","Karbohidrat",[71,2.5,12,1.5,1.7],["oatmeal matang","bubur oat"]),
 food("nasi-merah","Nasi merah","Karbohidrat",[149,2.8,32.5,1,1.8],["nasi merah"]),
 food("ubi-rebus","Ubi jalar rebus","Karbohidrat",[86,1.6,20,.1,3],["ubi jalar rebus","ubi rebus"]),
 food("apel","Apel segar","Buah",[52,.3,14,.2,2.4],["apel"]),
 food("mangga","Mangga segar","Buah",[60,.8,15,.4,1.6],["mangga"]),
 food("pisang-umum","Pisang segar, varietas belum diketahui","Buah",[90,1,23,.3,2.5],["pisang segar","pisang"]),
 food("jeruk-umum","Jeruk segar, varietas belum diketahui","Buah",[47,.9,12,.1,2.4],["jeruk segar","jeruk"]),
 food("mentimun","Mentimun segar","Sayur",[15,.7,3.6,.1,.5],["mentimun","timun"]),
 food("selada","Selada segar","Sayur",[15,1.4,2.9,.2,1.3],["selada"]),
 food("bayam","Bayam rebus","Sayur",[23,3,3.8,.3,2.4],["bayam rebus","sayur bening bayam"]),
 food("kangkung","Tumis kangkung","Sayur",[70,2.5,6,4,2],["tumis kangkung","kangkung tumis"]),
 food("brokoli","Brokoli rebus","Sayur",[35,2.4,7.2,.4,3.3],["brokoli rebus","brokoli kukus"]),
 food("terong","Tumis terong","Sayur",[90,1.5,9,5,3],["tumis terong","terong tumis"]),
 food("dada-ayam","Dada ayam panggang tanpa kulit","Protein hewani",[165,31,0,3.6,0],["dada ayam panggang","dada ayam bakar"]),
 food("telur-ceplok","Telur ceplok","Protein hewani",[196,13.6,.8,15,0],["telur ceplok","telur mata sapi"]),
 food("tahu-kukus","Tahu kukus","Protein nabati",[80,10,2,4,.3],["tahu kukus","tahu rebus"]),
 food("tempe-kukus","Tempe kukus","Protein nabati",[193,20,8,10,1.4],["tempe kukus","tempe rebus"]),
 food("udang","Udang rebus","Protein hewani",[99,24,.2,.3,0],["udang rebus","udang kukus"]),
 food("yogurt","Yogurt tawar","Susu",[61,3.5,4.7,3.3,0],["yogurt tawar","yoghurt tawar"]),
 food("soto","Soto ayam tanpa nasi","Masakan campuran",[85,7,5,4,.5],["soto ayam tanpa nasi","soto ayam"]),
 food("gado-gado","Gado-gado","Masakan campuran",[160,6,14,9,3],["gado gado"]),
 food("nasi-goreng","Nasi goreng","Masakan campuran",[200,5,30,7,1],["nasi goreng"]),
 food("capcay","Capcay sayur","Sayur",[65,2,7,3,2],["capcay sayur","cap cai sayur"]),
];
export const CATALOG_METADATA={version:CURRENT_CATALOG_VERSION,source:"TKPI Kemenkes 2020 dan profil estimasi prototype",referenceCount:FOODS.filter(f=>f.nutritionReference?.status==="reference").length,totalFoods:FOODS.length,validated:false,nutritionUrl:referenceUrl};
const normalize=(s:string)=>s.toLocaleLowerCase("id-ID").replace(/[^a-z0-9]+/g," ").trim();
export function matchFoodId(id:string|null,label:string){
 const f=FOODS.find(f=>f.id===id);if(!f)return null;const text=normalize(label);const words=text.split(" ");
 if(f.group==="Buah"&&["goreng","rebus","kukus","jus","smoothie","manisan","keripik"].some(t=>words.includes(t)))return null;
 if(f.id==="oat"&&["susu","yogurt","madu","gula"].some(t=>words.includes(t)))return null;
 if(f.excludeTerms?.some(t=>words.includes(t)))return null;
 return f.aliases?.some(a=>text===a||text.startsWith(a+" "))?f.id:null;
}
